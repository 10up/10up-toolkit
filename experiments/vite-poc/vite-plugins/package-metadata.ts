/**
 * Package-metadata reader for the metadata-driven externals path.
 *
 * Mirrors `@wordpress/wp-build`'s `package-utils.mjs`. Resolves a package's
 * `package.json` via Node's module-resolution and surfaces the two fields
 * that determine whether a package is externalizable:
 *
 *   wpScript: true
 *       Package is registered as a classic <script> in WP core.
 *       Externalize against `window.wp.<camelCased name>` with the
 *       script handle `wp-<name>`.
 *
 *   wpScriptModuleExports: string | Record<string, string>
 *       Package is registered as a Script Module. The value lists the
 *       entry points; root import maps to `'.'` or a string value,
 *       subpath imports (`@wordpress/blocks/sub/path`) map to keys
 *       like `'./sub/path'`. Externalize by leaving the bare specifier
 *       intact for WP's import map to resolve at runtime.
 *
 *   Neither field
 *       Package is *not* externalizable — bundle it into the consumer's
 *       output. Drops the maintenance burden of a hand-maintained
 *       BUNDLED_PACKAGES list (`@wordpress/icons`, `@wordpress/dataviews`,
 *       etc.) by deriving the answer from each package's own metadata.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface WpPackageJson {
	name: string;
	version: string;
	wpScript?: true;
	wpScriptModuleExports?: string | Record<string, string>;
	sideEffects?: boolean | string[];
}

// Cache keyed by package name @ project root. Two different projects in
// the same Node process might have different versions installed.
const cache = new Map<string, WpPackageJson | null>();

/**
 * Resolve a package's `package.json` from the project root, cache, return.
 * Returns `null` when the package isn't installed.
 */
export function readPackageMetadata(
	packageName: string,
	projectRoot: string,
): WpPackageJson | null {
	const cacheKey = `${packageName}@${projectRoot}`;
	if (cache.has(cacheKey)) {
		return cache.get(cacheKey) ?? null;
	}

	try {
		const require = createRequire(join(projectRoot, 'package.json'));
		const pkgJsonPath = require.resolve(`${packageName}/package.json`);
		const meta = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as WpPackageJson;
		cache.set(cacheKey, meta);
		return meta;
	} catch {
		cache.set(cacheKey, null);
		return null;
	}
}

/**
 * Given an import like `@wordpress/blocks` or `@wordpress/blocks/sub`,
 * return the root package name and the subpath portion. Subpath is
 * `null` for root imports.
 *
 *   `@wordpress/blocks`          → { name: '@wordpress/blocks', subpath: null }
 *   `@wordpress/blocks/sub`      → { name: '@wordpress/blocks', subpath: 'sub' }
 *   `@wordpress/blocks/sub/path` → { name: '@wordpress/blocks', subpath: 'sub/path' }
 *   `lodash`                     → { name: 'lodash', subpath: null }
 *   `lodash/get`                 → { name: 'lodash', subpath: 'get' }
 */
export function splitImport(spec: string): { name: string; subpath: string | null } {
	const parts = spec.split('/');
	if (spec.startsWith('@')) {
		// Scoped: `@scope/pkg[/subpath...]`
		if (parts.length < 2) return { name: spec, subpath: null };
		const name = `${parts[0]}/${parts[1]}`;
		const subpath = parts.length > 2 ? parts.slice(2).join('/') : null;
		return { name, subpath };
	}
	return {
		name: parts[0],
		subpath: parts.length > 1 ? parts.slice(1).join('/') : null,
	};
}

/**
 * Does the given package + subpath qualify as a Script Module import?
 * Mirrors wp-build's `isScriptModuleImport`:
 *   - Root import (`subpath: null`): `wpScriptModuleExports` is a string
 *     OR an object with a `'.'` key.
 *   - Subpath import: an object with a `'./<subpath>'` key.
 */
export function isScriptModule(meta: WpPackageJson, subpath: string | null): boolean {
	const exports = meta.wpScriptModuleExports;
	if (!exports) return false;
	if (subpath === null) {
		if (typeof exports === 'string') return true;
		return typeof exports === 'object' && '.' in exports;
	}
	return typeof exports === 'object' && `./${subpath}` in exports;
}

/**
 * Convert `block-editor` → `blockEditor`. Matches the camelCasing
 * `wp.<name>` uses for `@wordpress/<name>` packages.
 */
export function camelize(s: string): string {
	return s.replace(/-(.)/g, (_m, c: string) => c.toUpperCase());
}
