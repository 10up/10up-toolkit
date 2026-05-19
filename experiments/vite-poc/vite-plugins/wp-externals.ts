/**
 * vite-plugin-wp-externals
 *
 * Two responsibilities, modeled on `@wordpress/wp-build`'s
 * `wordpress-externals-plugin.mjs` (Gutenberg's next-gen externals plugin):
 *
 * 1. Decide whether each import should be externalized, and if so, in what
 *    form. The decision reads each `@wordpress/*` package's *own*
 *    `package.json` for `wpScript` / `wpScriptModuleExports` fields rather
 *    than hardcoding a whitelist. Packages with neither field get bundled
 *    automatically — no hand-maintained `BUNDLED_PACKAGES` list. This
 *    requires consumers to install the `@wordpress/*` packages they import
 *    (rather than relying on globals provided by WP), which is the tradeoff
 *    for self-documenting external-ness and out-of-the-box TypeScript types.
 *
 * 2. Emit a `<entry>.asset.php` sidecar for every entry chunk, listing the
 *    `wp-<name>` script handles (script mode) or raw module specifiers
 *    (module mode) the entry depends on plus a content-hash `version`.
 *    Module-mode assets also get `'type' => 'module'` so WP registers them
 *    via `wp_register_script_module`. Dynamic imports render as
 *    `array('id' => '...', 'import' => 'dynamic')` per WP's expected shape.
 *
 * Non-`@wordpress/*` imports use the legacy hardcoded path: `react`,
 * `react-dom`, `jquery`, `lodash` map to fixed globals; other namespaces
 * (`@woo/...`, `@acme/...`) get config-driven externalization via
 * `externalNamespaces`.
 */
import crypto from 'node:crypto';
import { init, parse, type ImportSpecifier } from 'es-module-lexer';
import MagicString from 'magic-string';
import type { Plugin } from 'vite';
import {
	camelize,
	isScriptModule,
	readPackageMetadata,
	splitImport,
	type WpPackageJson,
} from './package-metadata.ts';

export interface ExternalNamespace {
	/** Window global path, e.g. `wp` for `@wordpress/*`, `woo` for `@woo/*`. */
	global: string;
	/** Script-handle prefix used in `.asset.php`. `wp` → `wp-block-editor`. */
	handlePrefix: string;
}

export interface WpExternalsOptions {
	/**
	 * Project root used to resolve `@wordpress/*` (and other) package.jsons.
	 * Defaults to `process.cwd()`. Pass the absolute project root for
	 * deterministic resolution in monorepos / weird CWDs.
	 */
	projectRoot?: string;
	/**
	 * Additional namespaces to externalize. The metadata-driven path covers
	 * `@wordpress/*` automatically; this lets you add `woo`, `acme`, etc.
	 * as classic-script externals (no metadata read — global/handle config
	 * only).
	 */
	externalNamespaces?: Record<string, ExternalNamespace>;
	/**
	 * Non-scoped vendor externals (`react`, `jquery`, etc.). These don't
	 * carry WP metadata so we keep the hardcoded mapping. Pass `{}` to
	 * disable. Mirrors `wp-build`'s `vendorExternals`.
	 */
	additionalExternals?: Record<string, { global: string; handle: string | null }>;
	/**
	 * 'script' (default) rewrites `import { x } from '@wordpress/y'` into
	 * `const { x } = window.wp.y;` so the resulting bundle works as a
	 * classic <script>. `.asset.php` lists `wp-y`-style handles for
	 * `wp_register_script`.
	 *
	 * 'module' leaves ESM imports intact (resolved at runtime by WP's
	 * import map) for use with `wp_register_script_module` — required for
	 * the Interactivity API and Script Modules generally. `.asset.php`
	 * lists raw module specifiers and includes `'type' => 'module'`.
	 */
	buildType?: 'script' | 'module';
	/**
	 * Substring matchers for file paths that should *always* be treated as
	 * `module`-mode regardless of the plugin-level `buildType`. Lets a
	 * single Vite dev server (which can only run one global mode at a time)
	 * still serve Script Module entries with their ESM imports intact.
	 *
	 * Example: `['/view.ts', '/view-module.ts', '/view-module.js']`
	 */
	moduleEntryMatchers?: string[];
}

/**
 * Vendor externals — non-`@wordpress/*` packages that need fixed
 * global/handle mappings because they're not WP-published packages and
 * don't carry `wpScript` metadata. Maps `react`, `react-dom`,
 * `react/jsx-runtime`, `react/jsx-dev-runtime`, `jquery`, `lodash`.
 *
 * Matches wp-build's `vendorExternals` map verbatim.
 */
const DEFAULT_VENDOR: Record<string, { global: string; handle: string | null }> = {
	react: { global: 'React', handle: 'react' },
	'react-dom': { global: 'ReactDOM', handle: 'react-dom' },
	'react-dom/client': { global: 'ReactDOM', handle: 'react-dom' },
	'react/jsx-runtime': { global: 'ReactJSXRuntime', handle: 'react-jsx-runtime' },
	'react/jsx-dev-runtime': { global: 'ReactJSXRuntime', handle: 'react-jsx-runtime' },
	moment: { global: 'moment', handle: 'moment' },
	jquery: { global: 'jQuery', handle: 'jquery' },
	lodash: { global: 'lodash', handle: 'lodash' },
	'lodash-es': { global: 'lodash', handle: 'lodash' },
};

interface ResolvedExternal {
	/** Window global path for script-mode rewrite. `null` if module-only. */
	global: string | null;
	/** Script handle (`wp-element`, `react-jsx-runtime`). `null` if module-only. */
	handle: string | null;
	/** Raw import specifier preserved for module-mode `.asset.php`. */
	specifier: string;
	/** Whether this package can be used as a Script Module. */
	moduleEligible: boolean;
	/** Whether this package can be used as a classic script. */
	scriptEligible: boolean;
}

/**
 * Parse a single ES import statement and produce equivalent code that reads
 * from a global instead. Handles the four shapes that appear in real code:
 *
 *   import foo from '@x/y';             → const foo = (g && g.default) || g;
 *   import * as foo from '@x/y';        → const foo = g;
 *   import { a, b as c } from '@x/y';   → const { a, b: c } = g;
 *   import '@x/y';                      → (drops the statement; rare)
 */
function rewriteImport(stmt: string, globalAccess: string): string | null {
	const match = stmt.match(/^\s*import\s+(.*?)\s+from\s+['"][^'"]+['"]\s*;?\s*$/s);
	if (!match) return '';
	const bindings = match[1].trim();

	const namespace = bindings.match(/^\*\s+as\s+(\w+)$/);
	if (namespace) return `const ${namespace[1]} = ${globalAccess};`;

	const mixed = bindings.match(/^(\w+)\s*,\s*\{(.+)\}$/s);
	if (mixed) {
		return [
			`const ${mixed[1]} = (${globalAccess} && ${globalAccess}.default) || ${globalAccess};`,
			`const { ${normalizeNamed(mixed[2].trim())} } = ${globalAccess};`,
		].join(' ');
	}

	if (bindings.startsWith('{')) {
		const named = bindings.replace(/^\{|\}$/g, '').trim();
		return `const { ${normalizeNamed(named)} } = ${globalAccess};`;
	}

	if (/^\w+$/.test(bindings)) {
		return `const ${bindings} = (${globalAccess} && ${globalAccess}.default) || ${globalAccess};`;
	}

	return null;
}

function normalizeNamed(named: string): string {
	return named
		.split(',')
		.map((p) => p.trim())
		.filter(Boolean)
		.map((p) => {
			const m = p.match(/^(\w+)\s+as\s+(\w+)$/);
			return m ? `${m[1]}: ${m[2]}` : p;
		})
		.join(', ');
}

export function wpExternals(options: WpExternalsOptions = {}): Plugin[] {
	const projectRoot = options.projectRoot ?? process.cwd();
	const externalNamespaces = options.externalNamespaces ?? {};
	const vendorExternals = options.additionalExternals ?? DEFAULT_VENDOR;
	const buildType = options.buildType ?? 'script';
	const moduleEntryMatchers = options.moduleEntryMatchers ?? [];

	function modeFor(id: string): 'script' | 'module' {
		const idPath = id.split('?')[0];
		for (const pattern of moduleEntryMatchers) {
			if (idPath.includes(pattern)) return 'module';
		}
		return buildType;
	}

	/**
	 * Look up how a given import specifier should be externalized.
	 * Returns `null` if it shouldn't be (i.e. should be bundled normally).
	 *
	 * Resolution order:
	 *   1. Vendor map (`react`, `jquery`, etc.) — hardcoded.
	 *   2. `@wordpress/*` — read the package's `package.json` for
	 *      `wpScript` / `wpScriptModuleExports`.
	 *   3. Other configured namespaces (`@woo/*`, etc.) — config only,
	 *      no metadata read (treated like classic scripts).
	 */
	function lookup(spec: string): ResolvedExternal | null {
		// 1. Vendor (react, jquery, …) — exact match including subpath.
		if (vendorExternals[spec]) {
			const v = vendorExternals[spec];
			return {
				global: v.global,
				handle: v.handle,
				specifier: spec,
				moduleEligible: false,
				scriptEligible: true,
			};
		}

		const { name, subpath } = splitImport(spec);

		// 2. @wordpress/* — metadata-driven via package.json.
		if (name.startsWith('@wordpress/')) {
			const meta = readPackageMetadata(name, projectRoot);
			if (!meta) {
				// Not installed locally. Two real failure modes:
				//   a) consumer forgot to `npm install @wordpress/element`
				//   b) package exists but is bundled-only (@wordpress/icons etc.)
				// We can't tell the two apart without metadata; the safer
				// default is "not externalizable — let Vite resolve/bundle
				// or fail loudly with a missing-module error". Toolkit's old
				// model would have externalized everything — that produces
				// runtime "wp.foo is undefined" errors which are harder
				// to debug than a build-time install instruction.
				return null;
			}

			const shortName = name.slice('@wordpress/'.length);
			const moduleEligible = isScriptModule(meta, subpath);
			const scriptEligible = !!meta.wpScript;

			if (!moduleEligible && !scriptEligible) {
				// Bundled package (@wordpress/icons, @wordpress/dataviews, …).
				// Return null so Rollup/Vite bundles it into the consumer.
				return null;
			}

			return {
				global: scriptEligible ? `wp.${camelize(shortName)}` : null,
				handle: scriptEligible ? `wp-${shortName}` : null,
				specifier: spec,
				moduleEligible,
				scriptEligible,
			};
		}

		// 3. Other configured namespaces (`@woo/*`, etc.) — no metadata.
		for (const [ns, cfg] of Object.entries(externalNamespaces)) {
			if (name.startsWith(`@${ns}/`)) {
				const shortName = name.slice(`@${ns}/`.length);
				return {
					global: `${cfg.global}.${camelize(shortName)}`,
					handle: `${cfg.handlePrefix}-${shortName}`,
					specifier: spec,
					moduleEligible: false,
					scriptEligible: true,
				};
			}
		}

		return null;
	}

	// In module mode, only specific @wordpress packages support dynamic
	// imports per wp-build. Static is the safer default.
	function moduleImportKind(spec: string, isDynamic: boolean): 'static' | 'dynamic' {
		// `@wordpress/interactivity` MUST be static (DEWP comment:
		// "Interactivity does not support dynamic imports at this time").
		if (spec === '@wordpress/interactivity') return 'static';
		return isDynamic ? 'dynamic' : 'static';
	}

	// Per-module dep tracking. Keyed by Rollup module id.
	const staticDepsByModule = new Map<string, Set<string>>();
	const dynamicDepsByModule = new Map<string, Set<string>>();
	const handleDepsByModule = new Map<string, Set<string>>();

	const resolverPlugin: Plugin = {
		name: `wp-externals-resolver(${buildType})`,
		enforce: 'pre',

		resolveId(source) {
			const ext = lookup(source);
			if (ext) {
				return { id: source, external: true };
			}
			// CJS-wrapped externals (`\0<spec>?commonjs-external`).
			const m = source.match(/^\0([^?]+)\?commonjs-external$/);
			if (m && lookup(m[1])) {
				return source;
			}
			return null;
		},

		load(id) {
			const m = id.match(/^\0([^?]+)\?commonjs-external$/);
			if (!m) return null;
			const ext = lookup(m[1]);
			if (!ext) return null;
			if (modeFor(id) === 'module' && ext.moduleEligible) {
				return `export default {};`;
			}
			if (!ext.global) {
				return `export default {};`;
			}
			return `const __g = (typeof window !== "undefined" ? window.${ext.global} : {}); export default __g;`;
		},
	};

	const transformPlugin: Plugin = {
		name: `wp-externals(${buildType})`,
		enforce: 'post',

		async transform(code, id) {
			// Fast-path bail.
			if (
				!code.includes('@wordpress/') &&
				!Object.keys(vendorExternals).some((k) => code.includes(k)) &&
				!Object.keys(externalNamespaces).some((k) => code.includes(`@${k}/`))
			) {
				return null;
			}

			await init;
			let imports: readonly ImportSpecifier[];
			try {
				[imports] = parse(code);
			} catch {
				return null;
			}
			if (imports.length === 0) return null;

			const ms = new MagicString(code);
			let changed = false;
			const fileMode = modeFor(id);

			const staticDeps = new Set<string>();
			const dynamicDeps = new Set<string>();
			const handleDeps = new Set<string>();

			for (const imp of imports) {
				if (imp.n === undefined) continue;
				const ext = lookup(imp.n);
				if (!ext) continue;

				const isDynamic = imp.d > -1;

				if (fileMode === 'script') {
					if (isDynamic || !ext.scriptEligible) {
						// Dynamic imports → leave alone. Module-only packages
						// (no wpScript) → leave alone too; Rollup will keep
						// the bare ESM import which is fine in a module
						// context but problematic in a classic script. We
						// warn rather than fail to surface the issue.
						if (!ext.scriptEligible && !isDynamic) {
							this.warn(
								`${imp.n} is module-only (no wpScript in its package.json) but imported into a script-mode entry. ` +
									`Move this import to a viewScriptModule entry, or this script will fail at runtime.`,
							);
						}
						continue;
					}
					const stmt = code.slice(imp.ss, imp.se);
					const globalAccess = `(window.${ext.global})`;
					const rewritten = rewriteImport(stmt, globalAccess);
					if (rewritten === null) continue;
					ms.overwrite(imp.ss, imp.se, rewritten);
					changed = true;
					if (ext.handle) handleDeps.add(ext.handle);
				} else {
					// Module mode.
					if (!ext.moduleEligible) {
						this.warn(
							`${imp.n} is not Script-Module-eligible (no wpScriptModuleExports in its package.json) but imported into a module-mode entry. ` +
								`Move this import to a script-mode entry (editorScript / script).`,
						);
						continue;
					}
					const kind = moduleImportKind(imp.n, isDynamic);
					if (kind === 'static') {
						staticDeps.add(ext.specifier);
					} else {
						dynamicDeps.add(ext.specifier);
					}
				}
			}

			if (staticDeps.size > 0) staticDepsByModule.set(id, staticDeps);
			if (dynamicDeps.size > 0) dynamicDepsByModule.set(id, dynamicDeps);
			if (handleDeps.size > 0) handleDepsByModule.set(id, handleDeps);

			if (!changed) return null;

			return {
				code: ms.toString(),
				map: ms.generateMap({ hires: true }),
			};
		},

		generateBundle(_outputOptions, bundle) {
			for (const [fileName, item] of Object.entries(bundle)) {
				if (item.type !== 'chunk' || !item.isEntry) continue;
				if (!fileName.endsWith('.js') && !fileName.endsWith('.mjs')) continue;

				const handleSet = new Set<string>();
				const staticSet = new Set<string>();
				const dynamicSet = new Set<string>();
				let entryMode: 'script' | 'module' = buildType;

				for (const moduleId of Object.keys(item.modules)) {
					const h = handleDepsByModule.get(moduleId);
					if (h) for (const d of h) handleSet.add(d);
					const s = staticDepsByModule.get(moduleId);
					if (s) for (const d of s) staticSet.add(d);
					const d = dynamicDepsByModule.get(moduleId);
					if (d) for (const dep of d) dynamicSet.add(dep);
					if (modeFor(moduleId) === 'module') entryMode = 'module';
				}

				const version = crypto
					.createHash('md5')
					.update(item.code)
					.digest('hex')
					.slice(0, 20);

				let depsArray = '';
				const parts: string[] = [];
				if (entryMode === 'module') {
					for (const d of [...staticSet].sort()) parts.push(`'${d}'`);
					for (const d of [...dynamicSet].sort()) {
						parts.push(`array( 'id' => '${d}', 'import' => 'dynamic' )`);
					}
				} else {
					for (const h of [...handleSet].sort()) parts.push(`'${h}'`);
				}
				if (parts.length > 0) depsArray = ` ${parts.join(', ')} `;

				const typeField = entryMode === 'module' ? `, 'type' => 'module'` : '';
				const php = `<?php return array( 'dependencies' => array(${depsArray}), 'version' => '${version}'${typeField} );\n`;

				this.emitFile({
					type: 'asset',
					fileName: fileName.replace(/\.m?js$/, '.asset.php'),
					source: php,
				});
			}
		},
	};

	return [resolverPlugin, transformPlugin];
}
