/**
 * Rspack-native WordPress Dependency Extraction Plugin
 *
 * Replaces @wordpress/dependency-extraction-webpack-plugin with a zero-webpack
 * implementation built directly on rspack's compiler/compilation hooks.
 *
 * What it does:
 *   1. Externalizes known WordPress/React/lodash packages via rspack externals
 *   2. Tracks which externalized deps each entry chunk actually uses
 *   3. Generates .asset.php (or .json) files listing deps + content hash
 */

const path = require('path');
const crypto = require('crypto');

const pluginName = 'RspackDependencyExtractionPlugin';

// ─── Default mappings ───────────────────────────────────────────────────────

const BUNDLED_PACKAGES = new Set([
	'@wordpress/admin-ui',
	'@wordpress/dataviews',
	'@wordpress/dataviews/wp',
	'@wordpress/fields',
	'@wordpress/grid',
	'@wordpress/icons',
	'@wordpress/interface',
	'@wordpress/ui',
	'@wordpress/undo-manager',
	'@wordpress/views',
]);

function camelCaseDash(str) {
	return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function defaultRequestToExternal(request) {
	// Packages that should always be bundled
	if (BUNDLED_PACKAGES.has(request)) {
		return undefined;
	}

	switch (request) {
		case 'moment':
			return 'moment';
		case '@babel/runtime/regenerator':
			return 'regeneratorRuntime';
		case 'lodash':
		case 'lodash-es':
			return 'lodash';
		case 'jquery':
			return 'jQuery';
		case 'react':
			return 'React';
		case 'react-dom':
		case 'react-dom/client':
			return 'ReactDOM';
		case 'react/jsx-runtime':
		case 'react/jsx-dev-runtime':
			return 'ReactJSXRuntime';
		default:
			// noop
			break;
	}

	if (request.includes('react-refresh/runtime')) {
		return 'ReactRefreshRuntime';
	}

	if (request.startsWith('@wordpress/')) {
		return ['wp', camelCaseDash(request.substring('@wordpress/'.length))];
	}

	return undefined;
}

function defaultRequestToHandle(request) {
	switch (request) {
		case '@babel/runtime/regenerator':
			return 'regenerator-runtime';
		case 'lodash-es':
			return 'lodash';
		case 'react-dom/client':
			return 'react-dom';
		case 'react/jsx-runtime':
			return 'react-jsx-runtime';
		default:
			// noop
			break;
	}

	if (request.includes('react-refresh/runtime')) {
		return 'wp-react-refresh-runtime';
	}

	if (request.startsWith('@wordpress/')) {
		return `wp-${request.substring('@wordpress/'.length)}`;
	}

	return undefined;
}

function defaultRequestToExternalModule(request) {
	if (BUNDLED_PACKAGES.has(request)) {
		return undefined;
	}

	switch (request) {
		case '@wordpress/interactivity':
			return `module ${request}`;
		case '@wordpress/interactivity-router':
		case '@wordpress/a11y':
			return `import ${request}`;
		default:
			// noop
			break;
	}

	if (request.startsWith('@wordpress/')) {
		// In module mode, most WP packages shouldn't be imported
		return undefined;
	}

	return undefined;
}

// ─── json2php: convert JS value to PHP literal ─────────────────────────────

function json2php(value) {
	if (value === null) return 'NULL';
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	if (typeof value === 'number') return String(value);
	if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
	if (Array.isArray(value)) {
		// Check if it's a sequential numeric array
		const isSequential = value.every((_, i) => i in value);
		if (isSequential) {
			return `array(${value.map(json2php).join(', ')})`;
		}
	}
	if (typeof value === 'object') {
		const entries = Object.entries(value);
		const pairs = entries.map(([k, v]) => `'${k}' => ${json2php(v)}`);
		return `array(${pairs.join(', ')})`;
	}
	return String(value);
}

// ─── Plugin class ───────────────────────────────────────────────────────────

class RspackDependencyExtractionPlugin {
	constructor(options = {}) {
		this.options = {
			combineAssets: false,
			combinedOutputFile: null,
			injectPolyfill: false,
			outputFormat: 'php',
			outputFilename: null,
			useDefaults: true,
			requestToExternal: undefined,
			requestToExternalModule: undefined,
			requestToHandle: undefined,
			...options,
		};

		this.externalizedDeps = new Set();
	}

	/**
	 * Determine if a request should be externalized.
	 * Returns the external value or undefined to bundle normally.
	 */
	resolveExternal(request) {
		let externalRequest;

		if (this.useModules) {
			if (typeof this.options.requestToExternalModule === 'function') {
				externalRequest = this.options.requestToExternalModule(request);
				if (externalRequest === false) externalRequest = undefined;
				if (externalRequest === true) externalRequest = request;
			}
		} else {
			if (typeof this.options.requestToExternal === 'function') {
				externalRequest = this.options.requestToExternal(request);
			}
		}

		if (typeof externalRequest === 'undefined' && this.options.useDefaults) {
			externalRequest = this.useModules
				? defaultRequestToExternalModule(request)
				: defaultRequestToExternal(request);
		}

		return externalRequest;
	}

	/**
	 * Map a request to its WordPress script handle.
	 */
	mapRequestToHandle(request) {
		if (typeof this.options.requestToHandle === 'function') {
			const handle = this.options.requestToHandle(request);
			if (handle) return handle;
		}

		if (this.options.useDefaults) {
			const handle = defaultRequestToHandle(request);
			if (handle) return handle;
		}

		return request;
	}

	apply(compiler) {
		this.useModules = Boolean(compiler.options.output?.module);

		// ── Phase 1: Set up externals ──
		const externalsType = this.useModules ? 'import' : 'window';

		// Add our externalization function to the compiler's externals
		const originalExternals = compiler.options.externals || [];
		const externalsArray = Array.isArray(originalExternals)
			? originalExternals
			: [originalExternals];

		compiler.options.externals = [
			...externalsArray,
			({ request }, callback) => {
				const external = this.resolveExternal(request);
				if (external) {
					this.externalizedDeps.add(request);
					// Format the external based on type
					if (typeof external === 'string') {
						return callback(null, `${externalsType} ${external}`);
					}
					if (Array.isArray(external)) {
						return callback(null, external);
					}
					return callback(null, external);
				}
				return callback();
			},
		];

		// ── Phase 2: Generate .asset.php files ──
		compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
			compilation.hooks.processAssets.tap(
				{
					name: pluginName,
					// PROCESS_ASSETS_STAGE_ANALYSE = 4000
					stage: 4000,
				},
				() => {
					const combinedAssets = {};

					const processedFiles = new Set();

					for (const [entrypointName, entrypoint] of compilation.entrypoints.entries()) {
						// Skip the runtime chunk — it's shared infrastructure, not a WP-enqueued script
						if (entrypointName === 'runtime') continue;

						const chunkDeps = new Set();

						// Find JS file for this entrypoint
						const jsExtRegExp = this.useModules ? /\.m?js$/i : /\.js$/i;
						let chunkJSFile = null;

						for (const chunk of entrypoint.chunks) {
							for (const file of chunk.files) {
								if (jsExtRegExp.test(file)) {
									chunkJSFile = file;
									break;
								}
							}
							if (chunkJSFile) break;
						}

						if (!chunkJSFile) continue;

						// Skip if we've already emitted an asset for this JS file
						// (can happen when multiple entrypoints share a runtime chunk)
						if (processedFiles.has(chunkJSFile)) continue;
						processedFiles.add(chunkJSFile);

						// Collect externalized dependencies for this entrypoint
						for (const chunk of entrypoint.chunks) {
							const modules = compilation.chunkGraph
								? compilation.chunkGraph.getChunkModulesIterable(chunk)
								: chunk.getModules
									? chunk.getModules()
									: [];

							for (const module of modules) {
								const { userRequest } = module;
								if (userRequest && this.externalizedDeps.has(userRequest)) {
									chunkDeps.add(this.mapRequestToHandle(userRequest));
								}
							}
						}

						// Check for /* wp:polyfill */ magic comments
						if (compilation.assets[chunkJSFile]) {
							const source = compilation.assets[chunkJSFile].source();
							if (typeof source === 'string' && source.includes('wp:polyfill')) {
								chunkDeps.add('wp-polyfill');
							}
						}

						if (this.options.injectPolyfill) {
							chunkDeps.add('wp-polyfill');
						}

						// Generate content hash
						const contentHash = crypto
							.createHash('md5')
							.update(
								compilation.assets[chunkJSFile]
									? compilation.assets[chunkJSFile].source()
									: entrypointName,
							)
							.digest('hex')
							.substring(0, 8);

						const assetData = {
							dependencies: Array.from(chunkDeps).sort(),
							version: contentHash,
						};

						if (this.useModules) {
							assetData.type = 'module';
						}

						// Generate asset filename
						const suffix = `.asset.${this.options.outputFormat === 'php' ? 'php' : 'json'}`;
						const assetFilename = chunkJSFile.replace(jsExtRegExp, suffix);

						if (this.options.combineAssets) {
							combinedAssets[entrypointName] = assetData;
						} else {
							// Emit asset
							const content =
								this.options.outputFormat === 'php'
									? `<?php return ${json2php(assetData)};\n`
									: JSON.stringify(assetData);

							compilation.emitAsset(
								assetFilename,
								new compiler.webpack.sources.RawSource(content),
							);
						}
					}

					// Handle combined assets mode
					if (this.options.combineAssets) {
						const outputFile =
							this.options.combinedOutputFile ||
							`assets.${this.options.outputFormat === 'php' ? 'php' : 'json'}`;

						const content =
							this.options.outputFormat === 'php'
								? `<?php return ${json2php(combinedAssets)};\n`
								: JSON.stringify(combinedAssets);

						compilation.emitAsset(
							outputFile,
							new compiler.webpack.sources.RawSource(content),
						);
					}
				},
			);
		});
	}
}

module.exports = RspackDependencyExtractionPlugin;
