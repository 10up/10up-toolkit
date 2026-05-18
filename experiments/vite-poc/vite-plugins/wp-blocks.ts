/**
 * vite-plugin-wp-blocks
 *
 * Scans `blocksDir` for `block.json` files and turns the `file:`-prefixed
 * asset references into Rollup input entries — the Vite equivalent of
 * toolkit's `useBlockAssets`. Also copies each `block.json` and any
 * sibling PHP files into the dist tree so registration paths line up.
 *
 * Recognized block.json fields (mirrors toolkit's coverage):
 *   editorScript, script, viewScript, scriptModule, viewScriptModule,
 *   style, editorStyle, viewStyle
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, extname, join, relative, resolve } from 'node:path';
import fg from 'fast-glob';
import type { Plugin } from 'vite';

const SCRIPT_FIELDS = ['editorScript', 'script', 'viewScript'] as const;
const MODULE_FIELDS = ['scriptModule', 'viewScriptModule'] as const;
const STYLE_FIELDS = ['style', 'editorStyle', 'viewStyle'] as const;

type BlockJson = Partial<
	Record<
		(typeof SCRIPT_FIELDS | typeof MODULE_FIELDS | typeof STYLE_FIELDS)[number],
		string | string[]
	>
>;

export interface WpBlocksOptions {
	blocksDir: string;
	buildType?: 'script' | 'module';
	/**
	 * Emit `blocks-manifest.php` (returns one PHP array of all block.json
	 * contents). Lets PHP use `wp_register_block_types_from_metadata_collection`
	 * (WP 6.7+) instead of N filesystem reads + JSON parses on every request.
	 * See #475. Default: `true`.
	 */
	emitManifest?: boolean;
	/**
	 * Block directory names (relative to `blocksDir`) to skip entirely —
	 * neither discovered as entries nor included in the manifest. Useful when
	 * a project still has blocks built with deprecated tooling (Linaria,
	 * Vanilla Extract) that the POC plugins don't cover.
	 */
	skip?: string[];
}

export function wpBlocks(options: WpBlocksOptions): Plugin {
	const buildType = options.buildType ?? 'script';
	const emitManifest = options.emitManifest ?? true;
	const skip = new Set(options.skip ?? []);
	let blocksDirAbs: string;

	return {
		name: 'wp-blocks',
		enforce: 'pre',

		config() {
			blocksDirAbs = resolve(process.cwd(), options.blocksDir);
			return {
				build: {
					rollupOptions: {
						input: discoverEntries(blocksDirAbs, buildType, skip),
					},
				},
			};
		},

		async buildStart() {
			// Watch every block.json so adding a new block triggers a reload in dev.
			const blockJsons = await fg(`${blocksDirAbs.replace(/\\/g, '/')}/**/block.json`, {
				absolute: true,
			});
			for (const file of blockJsons) {
				this.addWatchFile(file);
			}
		},

		async generateBundle() {
			// Only the script pass copies block.json + PHP and emits the manifest.
			// In a dual (script + module) build both passes write to the same dist
			// dir, and these outputs are identical either way — gating to the
			// script pass keeps the second pass purely additive.
			if (buildType !== 'script') return;

			const files = await fg(
				[
					`${blocksDirAbs.replace(/\\/g, '/')}/**/block.json`,
					`${blocksDirAbs.replace(/\\/g, '/')}/**/*.php`,
				],
				{ absolute: true },
			);
			for (const file of files) {
				const rel = relative(blocksDirAbs, file).replace(/\\/g, '/');
				// block.json gets `file:` refs rewritten so they point at the
				// built output (.tsx → .js, .scss → .css), and a `version`
				// gets stamped from the style content hash when missing — both
				// mirror toolkit's `transformBlockJson` exactly.
				const isBlockJson = rel.endsWith('block.json');
				const source = isBlockJson
					? transformBlockJson(readFileSync(file, 'utf8'), file)
					: readFileSync(file);
				this.emitFile({
					type: 'asset',
					fileName: `blocks/${rel}`,
					source,
				});
			}

			if (emitManifest) {
				const manifest = buildBlocksManifest(blocksDirAbs, skip);
				if (manifest) {
					this.emitFile({
						type: 'asset',
						fileName: 'blocks-manifest.php',
						source: manifest,
					});
				}
			}
		},
	};
}

/**
 * Rewrite `file:` references in block.json so they point at the built
 * output, and stamp a `version` from the source style content hash when
 * the block doesn't declare one. Mirrors toolkit's `transformBlockJson`
 * exactly so dist parity is byte-for-byte where it matters:
 *
 *   editorScript / script / viewScript / scriptModule / viewScriptModule → .js
 *   style / editorStyle / viewStyle                                       → .css
 *   version (missing) ← SHA-256 of each `file:` style/viewStyle's source
 *
 * Why hash the *source* styles (not the built ones)? Toolkit does the
 * same — the goal is a stable cache-bust key that changes only when
 * authors edit content. Built CSS bytes are sensitive to incidental
 * postcss/minifier output drift; source bytes aren't.
 */
function transformBlockJson(raw: string, blockJsonPath: string): string {
	let parsed: Record<string, unknown>;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return raw;
	}

	const scriptFields = ['editorScript', 'script', 'viewScript', 'scriptModule', 'viewScriptModule'];
	const styleFields = ['style', 'editorStyle', 'viewStyle'];

	const rewriteRef = (ref: unknown, ext: '.js' | '.css'): unknown => {
		if (typeof ref !== 'string' || !ref.startsWith('file:')) return ref;
		return ref.replace(/\.(tsx?|jsx?|s?css|sass)$/, ext);
	};

	// Version stamping has to happen BEFORE rewriting refs so we hash the
	// source file (e.g. style.scss), not the renamed one (style.css).
	const explicitVersion = typeof parsed.version === 'string' && parsed.version.length > 0;
	if (!explicitVersion) {
		const blockDir = dirname(blockJsonPath);
		const versionHash = hashStyleContent(parsed, ['style', 'viewStyle'], blockDir);
		if (versionHash) {
			parsed.version = versionHash;
		}
	}

	for (const field of scriptFields) {
		const v = parsed[field];
		if (Array.isArray(v)) {
			parsed[field] = v.map((r) => rewriteRef(r, '.js'));
		} else {
			parsed[field] = rewriteRef(v, '.js');
		}
	}
	for (const field of styleFields) {
		const v = parsed[field];
		if (Array.isArray(v)) {
			parsed[field] = v.map((r) => rewriteRef(r, '.css'));
		} else {
			parsed[field] = rewriteRef(v, '.css');
		}
	}

	return JSON.stringify(parsed, null, '\t') + '\n';
}

/**
 * SHA-256 the concatenated source contents of every `file:` ref in the
 * given style fields. Returns `''` if no style file refs were found —
 * which signals to leave `version` unset (matching toolkit).
 */
function hashStyleContent(
	metadata: Record<string, unknown>,
	fields: string[],
	blockDir: string,
): string {
	const hash = createHash('sha256');
	let touched = false;

	for (const field of fields) {
		const value = metadata[field];
		const refs = Array.isArray(value) ? value : [value];
		for (const ref of refs) {
			if (typeof ref !== 'string' || !ref.startsWith('file:')) continue;
			const relPath = ref.replace(/^file:/, '');
			const absPath = join(blockDir, relPath);
			try {
				hash.update(readFileSync(absPath));
				touched = true;
			} catch {
				// Style file missing — skip; the block.json author can fix.
			}
		}
	}

	return touched ? hash.digest('hex') : '';
}

/**
 * Build the WP 6.7+ blocks manifest — one PHP file returning
 * `array( '<dir>' => <block.json contents>, ... )`. Consumed by
 * `wp_register_block_types_from_metadata_collection( $dir, $manifest )`.
 *
 * The manifest's metadata also needs `file:` refs rewritten — same reason
 * as the per-block.json transform above. `wp_register_block_types_from_metadata_collection`
 * reads the manifest directly and resolves files based on these refs.
 */
function buildBlocksManifest(blocksDirAbs: string, skip: Set<string>): string | null {
	const blockJsons = fg.sync(`${blocksDirAbs.replace(/\\/g, '/')}/**/block.json`, {
		absolute: true,
	});

	const entries: Array<[string, unknown]> = [];
	for (const file of blockJsons) {
		try {
			// Run the contents through the same `file:` rewriter we use for the
			// per-block.json copies so the manifest agrees with the dist files
			// (same `file:` extension rewrite, same auto-stamped version).
			const meta = JSON.parse(transformBlockJson(readFileSync(file, 'utf8'), file));
			// Key = directory containing block.json, relative to blocksDir.
			const dirName = relative(blocksDirAbs, file)
				.replace(/[\\/]block\.json$/, '')
				.replace(/\\/g, '/');
			if (skip.has(dirName)) continue;
			entries.push([dirName, meta]);
		} catch {
			// Skip malformed block.json — already warned by discoverEntries.
		}
	}

	if (entries.length === 0) return null;

	const body = entries
		.map(([dir, meta]) => `\t'${dir}' => ${phpExport(meta, 1)},`)
		.join('\n');

	return `<?php\n// This file is generated. Do not modify it manually.\nreturn array(\n${body}\n);\n`;
}

/** Minimal JSON → PHP array literal exporter. Handles strings/numbers/bools/arrays/objects. */
function phpExport(value: unknown, indent: number): string {
	const pad = '\t'.repeat(indent);
	const padInner = '\t'.repeat(indent + 1);

	if (value === null) return 'null';
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	if (typeof value === 'number') return String(value);
	if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
	if (Array.isArray(value)) {
		if (value.length === 0) return 'array()';
		const items = value.map((v) => `${padInner}${phpExport(v, indent + 1)}`).join(",\n");
		return `array(\n${items},\n${pad})`;
	}
	if (typeof value === 'object') {
		const keys = Object.keys(value as Record<string, unknown>);
		if (keys.length === 0) return 'array()';
		const items = keys
			.map((k) => {
				const v = (value as Record<string, unknown>)[k];
				const phpKey = `'${k.replace(/'/g, "\\'")}'`;
				return `${padInner}${phpKey} => ${phpExport(v, indent + 1)}`;
			})
			.join(",\n");
		return `array(\n${items},\n${pad})`;
	}
	return 'null';
}

function discoverEntries(
	blocksDirAbs: string,
	buildType: 'script' | 'module',
	skip: Set<string>,
): Record<string, string> {
	const entries: Record<string, string> = {};

	const blockJsons = fg.sync(`${blocksDirAbs.replace(/\\/g, '/')}/**/block.json`, {
		absolute: true,
	});

	for (const blockJsonPath of blockJsons) {
		const dirName = relative(blocksDirAbs, blockJsonPath)
			.replace(/[\\/]block\.json$/, '')
			.replace(/\\/g, '/');
		if (skip.has(dirName)) continue;

		let meta: BlockJson;
		try {
			meta = JSON.parse(readFileSync(blockJsonPath, 'utf8')) as BlockJson;
		} catch {
			// Empty/malformed block.json is normal during scaffolding — skip silently.
			continue;
		}

		const fields =
			buildType === 'module'
				? (MODULE_FIELDS as readonly string[])
				: ([...SCRIPT_FIELDS, ...STYLE_FIELDS] as readonly string[]);

		const refs: string[] = [];
		for (const field of fields) {
			const value = (meta as Record<string, unknown>)[field];
			if (typeof value === 'string') refs.push(value);
			else if (Array.isArray(value)) refs.push(...value.filter((v): v is string => typeof v === 'string'));
		}

		for (const ref of refs) {
			if (!ref.startsWith('file:')) continue; // handles aren't files, skip
			const declaredPath = ref.replace(/^file:/, '');
			// Strip extension so we can resolve to whatever source extension exists.
			const withoutExt = declaredPath.replace(/\.(js|ts|tsx|jsx|css|scss|sass)$/, '');
			const candidatePaths = [
				join(dirname(blockJsonPath), `${withoutExt}.tsx`),
				join(dirname(blockJsonPath), `${withoutExt}.ts`),
				join(dirname(blockJsonPath), `${withoutExt}.jsx`),
				join(dirname(blockJsonPath), `${withoutExt}.js`),
				join(dirname(blockJsonPath), `${withoutExt}.scss`),
				join(dirname(blockJsonPath), `${withoutExt}.sass`),
				join(dirname(blockJsonPath), `${withoutExt}.css`),
			];
			const sourcePath = candidatePaths.find((p) => existsSync(p));
			if (!sourcePath) {
				// eslint-disable-next-line no-console
				console.warn(`[wp-blocks] no source file found for ${ref} in ${blockJsonPath}`);
				continue;
			}

			const entryName = `blocks/${relative(blocksDirAbs, sourcePath)
				.replace(extname(sourcePath), '')
				.replace(/\\/g, '/')}`;

			entries[entryName] = sourcePath;
		}
	}

	return entries;
}
