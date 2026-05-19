/**
 * vite-plugin-wp-externals
 *
 * Two responsibilities, mirroring @wordpress/dependency-extraction-webpack-plugin
 * but generalized to support any namespace (see #474):
 *
 * 1. Rewrite `import { useState } from '@wordpress/element'` into direct reads
 *    from the configured global (`window.wp.element`). Same mechanism handles
 *    `@woo/cart` → `window.woo.cart` once `woo` is added to externalNamespaces.
 *
 * 2. Emit a `<entry>.asset.php` sidecar for every entry chunk, listing the
 *    `<handlePrefix>-<pkg>` script handles each entry depends on plus a
 *    content-hash version. WP's `wp_register_script` reads this file to wire
 *    dependencies.
 *
 * The `externalNamespaces` config is the #474 "package-based externalization"
 * pattern from WP core's @wordpress/build — projects declare which namespaces
 * are external and how they map to runtime globals, instead of toolkit
 * hardcoding `@wordpress/`.
 */
import crypto from 'node:crypto';
import { init, parse, type ImportSpecifier } from 'es-module-lexer';
import MagicString from 'magic-string';
import type { Plugin } from 'vite';

export interface ExternalNamespace {
	/** Window global path, e.g. `wp` for `@wordpress/*`, `woo` for `@woo/*`. */
	global: string;
	/** Script-handle prefix used in `.asset.php`. `wp` → `wp-block-editor`. */
	handlePrefix: string;
}

export interface WpExternalsOptions {
	/**
	 * Namespace → externalization config. Match key is the `@<key>/...` import
	 * scope. The key need not equal the global (e.g. `wordpress` → `wp`).
	 *
	 * Default includes WordPress only. Add `woo`, `acme`, etc. per project.
	 */
	externalNamespaces?: Record<string, ExternalNamespace>;
	/**
	 * Additional non-scoped externals (react, jquery, lodash). Mirrors WP's
	 * default register-script handles. Pass `{}` to disable.
	 */
	additionalExternals?: Record<string, { global: string; handle: string | null }>;
	/**
	 * 'script' (default) rewrites `import { x } from '@wordpress/y'` into
	 * `const { x } = window.wp.y;` so the resulting bundle works as a
	 * classic <script>. `.asset.php` lists `wp-y` style handles for
	 * `wp_register_script`.
	 *
	 * 'module' leaves ESM imports intact (resolved at runtime by WP's
	 * import map) for use with `wp_register_script_module` — required for
	 * the Interactivity API and Script Modules generally. `.asset.php`
	 * lists raw specifiers like `@wordpress/interactivity`.
	 */
	buildType?: 'script' | 'module';
	/**
	 * Substring matchers for file paths that should *always* be treated as
	 * `module`-mode regardless of the plugin-level `buildType`. Lets a
	 * single Vite dev server (which can only run one global mode at a time)
	 * still serve Script Module entries with their ESM imports intact —
	 * needed because globals like `window.wp.interactivity` don't exist on
	 * the frontend, only their Script Module equivalents do.
	 *
	 * Example: `['/view.ts', '/view-module.ts', '/view-module.js']`
	 */
	moduleEntryMatchers?: string[];
}

const DEFAULT_NAMESPACES: Record<string, ExternalNamespace> = {
	wordpress: { global: 'wp', handlePrefix: 'wp' },
};

/**
 * React et al. need externalization or every block re-bundles ~40KB of
 * runtime. Modern WP (6.4+) registers all three of these as script handles.
 * In module mode the same identifiers are exposed via WP's import map.
 */
const DEFAULT_ADDITIONAL = {
	react: { global: 'React', handle: 'react' },
	'react-dom': { global: 'ReactDOM', handle: 'react-dom' },
	'react/jsx-runtime': { global: 'ReactJSXRuntime', handle: 'react-jsx-runtime' },
	'react/jsx-dev-runtime': { global: 'ReactJSXRuntime', handle: 'react-jsx-runtime' },
	jquery: { global: 'jQuery', handle: 'jquery' },
	lodash: { global: 'lodash', handle: 'lodash' },
};

/** `block-editor` → `blockEditor` (camelCase). */
function camelize(s: string): string {
	return s.replace(/-(.)/g, (_m, c: string) => c.toUpperCase());
}

/**
 * Parse a single ES import statement and produce equivalent code that reads
 * from a global instead. We handle the four shapes that appear in real code:
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
	const namespaces = options.externalNamespaces ?? DEFAULT_NAMESPACES;
	const additional = options.additionalExternals ?? DEFAULT_ADDITIONAL;
	const buildType = options.buildType ?? 'script';
	const moduleEntryMatchers = options.moduleEntryMatchers ?? [];

	/** Per-file mode: `module` mode for files matching `moduleEntryMatchers`, else `buildType`. */
	function modeFor(id: string): 'script' | 'module' {
		const idPath = id.split('?')[0];
		for (const pattern of moduleEntryMatchers) {
			if (idPath.includes(pattern)) return 'module';
		}
		return buildType;
	}

	const nsKeys = Object.keys(namespaces);
	const namespaceRe = new RegExp(`^@(${nsKeys.map(escapeRe).join('|')})\\/([\\w-]+)$`);

	// Per-module dep tracking. Keyed by Rollup module id.
	// In 'module' mode, we store raw specifiers (`@wordpress/interactivity`);
	// in 'script' mode, we store handle names (`wp-interactivity`).
	const depsByModule = new Map<string, Set<string>>();
	// Per-module DYNAMIC dep tracking — `import('@wordpress/a11y')` and
	// similar lazy imports. Module-mode asset.php emits these as
	// `array('id' => 'X', 'import' => 'dynamic')` (matches DEWP and the
	// Ignite plugins). Empty in our current fixture; the tracking is
	// here for the day someone adds a `await import(...)` in a view.ts.
	const dynamicDepsByModule = new Map<string, Set<string>>();

	/**
	 * @wordpress/* packages that are externalizable in MODULE mode.
	 * DEWP (defaultRequestToExternalModule) restricts module externals
	 * to these — the rest only exist as classic scripts in WP and would
	 * throw at build time. Mirroring that whitelist so users get the
	 * same guardrail.
	 *
	 * Format: { specifier → 'static' | 'dynamic' (default import style) }
	 */
	const MODULE_MODE_WP_PACKAGES: Record<string, 'static' | 'dynamic'> = {
		'@wordpress/interactivity': 'static', // must be hoisted; no dynamic support
		'@wordpress/interactivity-router': 'dynamic',
		'@wordpress/a11y': 'dynamic',
	};

	function lookup(
		source: string,
	): { global: string; handle: string | null; specifier: string } | null {
		const m = namespaceRe.exec(source);
		if (m) {
			const ns = namespaces[m[1]];
			const pkg = m[2];
			return {
				global: `${ns.global}.${camelize(pkg)}`,
				handle: `${ns.handlePrefix}-${pkg}`,
				specifier: source,
			};
		}
		if (additional[source]) {
			return { ...additional[source], specifier: source };
		}
		return null;
	}

	// resolveId / load need to run BEFORE Vite's commonjs plugin (which has
	// no explicit enforce, i.e. normal phase). transform needs to run AFTER
	// the React plugin so JSX has already been compiled to JS — otherwise
	// es-module-lexer chokes on raw JSX. Vite/Rollup don't let one plugin
	// declare different enforce values per hook, so we register two.

	const resolverPlugin: Plugin = {
		name: `wp-externals-resolver(${buildType})`,
		enforce: 'pre',

		resolveId(source) {
			if (lookup(source)) {
				return { id: source, external: true };
			}
			// Vite's CJS plugin synthesizes `\0<bare>?commonjs-external` ids for
			// `require('@wordpress/*')` calls inside CJS deps. Catch those and
			// route to our virtual-module loader below so they get a real default
			// export pointing at the runtime global — otherwise the build fails
			// with "default is not exported by ...".
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
			if (modeFor(id) === 'module') {
				return `export default {};`;
			}
			return `const __g = (typeof window !== "undefined" ? window.${ext.global} : {}); export default __g;`;
		},
	};

	const transformPlugin: Plugin = {
		name: `wp-externals(${buildType})`,
		enforce: 'post',

		async transform(code, id) {
			// Don't skip node_modules: an ESM dep can `import * from "react"`
			// or `from "@wordpress/element"`, and those need rewriting too —
			// otherwise the bare imports survive to the output and the browser
			// fails to resolve them.
			// Fast-path bail when no externalized identifier appears in the source.
			if (
				!nsKeys.some((k) => code.includes(`@${k}/`)) &&
				!Object.keys(additional).some((k) => code.includes(k))
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

			const moduleDeps = new Set<string>();
			const dynamicDeps = new Set<string>();
			const ms = new MagicString(code);
			let changed = false;
			const fileMode = modeFor(id);

			for (const imp of imports) {
				if (imp.n === undefined) continue;
				const ext = lookup(imp.n);
				if (!ext) continue;

				// `imp.d > -1` means dynamic import (Rollup/es-module-lexer
				// flags `import('...')` calls with the call-site offset).
				// `imp.d === -1` is a static `import ... from '...'`.
				const isDynamic = imp.d > -1;

				if (fileMode === 'script') {
					if (isDynamic) {
						// Dynamic imports in script mode aren't a thing toolkit
						// supports. Leave them alone; they'll be served from
						// whatever URL Rollup/Vite resolves to.
						continue;
					}
					// Rewrite `import {x} from '@wordpress/y'` → `const {x} = window.wp.y;`
					const stmt = code.slice(imp.ss, imp.se);
					const globalAccess = `(window.${ext.global})`;
					const rewritten = rewriteImport(stmt, globalAccess);
					if (rewritten === null) continue;
					ms.overwrite(imp.ss, imp.se, rewritten);
					changed = true;
					if (ext.handle) moduleDeps.add(ext.handle);
				} else {
					// Module mode: leave the import alone. resolveId already
					// flagged it external. Track raw specifier for asset.php.

					// Guardrail: most @wordpress/* packages are NOT
					// externalizable as modules — they only exist as classic
					// scripts. DEWP throws on this. We warn rather than throw
					// to keep the POC iterating; switch to `this.error()` for
					// strict parity.
					const isWp = imp.n.startsWith('@wordpress/');
					if (isWp && !(imp.n in MODULE_MODE_WP_PACKAGES)) {
						this.warn(
							`${imp.n} cannot be externalized as a Script Module — it only exists as a WP classic script. ` +
								`Move this import to script-mode entry (editorScript / script) or remove it from the module file.`,
						);
					}

					if (isDynamic) {
						dynamicDeps.add(ext.specifier);
					} else {
						moduleDeps.add(ext.specifier);
					}
				}
			}

			if (moduleDeps.size > 0) {
				depsByModule.set(id, moduleDeps);
			}
			if (dynamicDeps.size > 0) {
				dynamicDepsByModule.set(id, dynamicDeps);
			}
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

				const staticDeps = new Set<string>();
				const dynamicDeps = new Set<string>();
				// Module-mode iff at least one source module in this chunk was
				// module-mode. In practice, module entries don't share chunks
				// with script entries (different Vite passes), so this is
				// effectively "is this entry built in module mode".
				let entryMode: 'script' | 'module' = buildType;
				for (const moduleId of Object.keys(item.modules)) {
					const s = depsByModule.get(moduleId);
					if (s) for (const d of s) staticDeps.add(d);
					const d = dynamicDepsByModule.get(moduleId);
					if (d) for (const dep of d) dynamicDeps.add(dep);
					if (modeFor(moduleId) === 'module') entryMode = 'module';
				}

				const version = crypto
					.createHash('md5')
					.update(item.code)
					.digest('hex')
					.slice(0, 20);

				// Static deps render as `'@wordpress/interactivity'`;
				// dynamic deps render as
				// `array('id' => '@wordpress/a11y', 'import' => 'dynamic')`.
				// Matches DEWP + the Ignite plugins' view-module.asset.php
				// format exactly.
				const allParts: string[] = [];
				for (const d of [...staticDeps].sort()) allParts.push(`'${d}'`);
				for (const d of [...dynamicDeps].sort()) {
					allParts.push(`array( 'id' => '${d}', 'import' => 'dynamic' )`);
				}
				const depsArray = allParts.length === 0 ? '' : ` ${allParts.join(', ')} `;

				// Module-mode .asset.php gets `'type' => 'module'` — matches
				// the format @wordpress/dependency-extraction-webpack-plugin
				// emits for Script Modules. WP's WP_Block_Type processor
				// reads this to register via wp_register_script_module
				// instead of wp_register_script.
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

function escapeRe(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
