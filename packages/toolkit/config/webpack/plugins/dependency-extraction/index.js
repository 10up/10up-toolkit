/**
 * RSPack-compatible WordPress Dependency Extraction Plugin
 * Forked from @wordpress/dependency-extraction-webpack-plugin to work with RSPack
 *
 * The main difference is how externals are handled - RSPack doesn't fully support
 * webpack's ExternalsPlugin when used dynamically, so we track externalized deps
 * through a different mechanism.
 */

/* eslint-disable global-require, import/no-extraneous-dependencies, no-continue, jsdoc/require-param-description, jsdoc/require-returns */

const path = require('path');
const json2php = require('json2php');
const { isRspack } = require('../../../bundler');

const {
	defaultRequestToExternal,
	defaultRequestToExternalModule,
	defaultRequestToHandle,
} = require('./util');

const defaultExternalizedReportFileName = 'externalized-dependencies.json';

class DependencyExtractionPlugin {
	constructor(options) {
		this.options = {
			combineAssets: false,
			combinedOutputFile: null,
			externalizedReport: false,
			injectPolyfill: false,
			outputFormat: 'php',
			outputFilename: null,
			useDefaults: true,
			...options,
		};

		this.externalizedDeps = new Set();
		this.useModules = false;
	}

	/**
	 * Determine the external value for a request
	 * @param {string} request
	 * @returns {string|string[]|undefined}
	 */
	getExternalForRequest(request) {
		let externalRequest;

		// Handle via options.requestToExternal(Module) first
		if (this.useModules) {
			if (typeof this.options.requestToExternalModule === 'function') {
				externalRequest = this.options.requestToExternalModule(request);

				if (externalRequest === false) {
					externalRequest = undefined;
				}
				if (externalRequest === true) {
					externalRequest = request;
				}
			}
		} else if (typeof this.options.requestToExternal === 'function') {
			externalRequest = this.options.requestToExternal(request);
		}

		// Cascade to default if unhandled and enabled
		if (typeof externalRequest === 'undefined' && this.options.useDefaults) {
			externalRequest = this.useModules
				? defaultRequestToExternalModule(request)
				: defaultRequestToExternal(request);
		}

		return externalRequest;
	}

	/**
	 * Create externals function for RSPack/webpack
	 */
	createExternalsFunction() {
		return ({ request }, callback) => {
			if (!request) {
				return callback();
			}

			try {
				const externalRequest = this.getExternalForRequest(request);

				if (externalRequest) {
					this.externalizedDeps.add(request);

					// Return the external configuration
					// For RSPack, we need to return in a format it understands
					if (this.useModules) {
						// Module format external
						return callback(null, externalRequest);
					}
					// Window/global format external
					return callback(null, externalRequest);
				}
			} catch (err) {
				return callback(err);
			}

			return callback();
		};
	}

	/**
	 * Map request to dependency handle
	 * @param {string} request
	 * @returns {string}
	 */
	mapRequestToDependency(request) {
		if (typeof this.options.requestToHandle === 'function') {
			const scriptDependency = this.options.requestToHandle(request);
			if (scriptDependency) {
				return scriptDependency;
			}
		}

		if (this.options.useDefaults) {
			const scriptDependency = defaultRequestToHandle(request);
			if (scriptDependency) {
				return scriptDependency;
			}
		}

		return request;
	}

	/**
	 * Stringify asset data
	 * @param {object} asset
	 * @returns {string}
	 */
	stringify(asset) {
		if (this.options.outputFormat === 'php') {
			return `<?php return ${json2php(JSON.parse(JSON.stringify(asset)))};\n`;
		}

		return JSON.stringify(asset);
	}

	apply(compiler) {
		this.useModules = Boolean(compiler.options.output?.module);

		const bundler = isRspack() ? require('@rspack/core') : require('webpack');
		const { RawSource } = bundler.sources;
		const { createHash } = bundler.util;

		// Add our externals function to the compiler's externals
		const originalExternals = compiler.options.externals || [];
		const externalsArray = Array.isArray(originalExternals)
			? originalExternals
			: [originalExternals];

		const externalType = this.useModules ? 'import' : 'window';
		const externalsFunction = this.createExternalsFunction();

		// For RSPack, we need to add externals differently
		if (isRspack()) {
			// RSPack supports externals as an array of functions
			compiler.options.externals = [...externalsArray, externalsFunction];
			compiler.options.externalsType = externalType;
		} else {
			// For webpack, use ExternalsPlugin
			const { ExternalsPlugin } = bundler;
			const externalsPlugin = new ExternalsPlugin(externalType, externalsFunction);
			externalsPlugin.apply(compiler);
		}

		compiler.hooks.thisCompilation.tap(this.constructor.name, (compilation) => {
			const Compilation = isRspack()
				? require('@rspack/core').Compilation
				: require('webpack').Compilation;

			compilation.hooks.processAssets.tap(
				{
					name: this.constructor.name,
					stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_COMPATIBILITY,
				},
				() => this.checkForMagicComments(compilation),
			);

			compilation.hooks.processAssets.tap(
				{
					name: this.constructor.name,
					stage: Compilation.PROCESS_ASSETS_STAGE_ANALYSE,
				},
				() => this.addAssets(compilation, RawSource, createHash),
			);
		});
	}

	/**
	 * Check for magic comments in assets
	 * @param {object} compilation
	 */
	checkForMagicComments(compilation) {
		const entrypointChunks = new Set();
		for (const entrypoint of compilation.entrypoints.values()) {
			for (const chunk of entrypoint.chunks) {
				entrypointChunks.add(chunk);
			}
		}

		for (const chunk of entrypointChunks) {
			const chunkFiles = Array.from(chunk.files);
			const jsExtensionRegExp = this.useModules ? /\.m?js$/i : /\.js$/i;

			const chunkJSFile = chunkFiles.find((f) => jsExtensionRegExp.test(f));
			if (!chunkJSFile) {
				continue;
			}

			const processContentsForMagicComments = (content) => {
				const magicComments = [];
				if (content.includes('/* wp:polyfill */')) {
					magicComments.push('wp-polyfill');
				}
				return magicComments;
			};

			chunkFiles.sort().forEach((filename) => {
				const asset = compilation.getAsset(filename);
				if (!asset || !asset.source) return;

				const content = asset.source.buffer
					? asset.source.buffer()
					: Buffer.from(asset.source.source());
				const wpMagicComments = processContentsForMagicComments(content);

				try {
					compilation.updateAsset(filename, (v) => v, {
						wpMagicComments,
					});
				} catch (e) {
					// Ignore errors when updating asset info
				}
			});
		}
	}

	/**
	 * Add asset files to compilation
	 * @param {object} compilation
	 * @param {Function} RawSource
	 * @param {Function} createHash
	 */
	addAssets(compilation, RawSource, createHash) {
		const {
			combineAssets,
			combinedOutputFile,
			externalizedReport,
			injectPolyfill,
			outputFormat,
			outputFilename,
		} = this.options;

		// Dump externalized dependencies to report file
		if (externalizedReport) {
			const externalizedReportFile =
				typeof externalizedReport === 'string'
					? externalizedReport
					: defaultExternalizedReportFileName;
			compilation.emitAsset(
				externalizedReportFile,
				new RawSource(JSON.stringify(Array.from(this.externalizedDeps).sort())),
			);
		}

		const combinedAssetsData = {};

		const entrypointChunks = new Set();
		for (const entrypoint of compilation.entrypoints.values()) {
			for (const chunk of entrypoint.chunks) {
				entrypointChunks.add(chunk);
			}
		}

		for (const chunk of entrypointChunks) {
			const chunkFiles = Array.from(chunk.files);
			const jsExtensionRegExp = this.useModules ? /\.m?js$/i : /\.js$/i;

			const chunkJSFile = chunkFiles.find((f) => jsExtensionRegExp.test(f));
			if (!chunkJSFile) {
				continue;
			}

			const chunkStaticDeps = new Set();
			const chunkDynamicDeps = new Set();

			if (injectPolyfill) {
				chunkStaticDeps.add('wp-polyfill');
			}

			// Process modules to find externalized dependencies
			const processModule = (m) => {
				const { userRequest } = m;
				if (this.externalizedDeps.has(userRequest)) {
					if (this.useModules) {
						// For modules, we'd need to check if it's static or dynamic
						// Simplified: treat all as static for now
						chunkStaticDeps.add(m.request || userRequest);
					} else {
						chunkStaticDeps.add(this.mapRequestToDependency(userRequest));
					}
				}
			};

			// Search for externalized modules in chunk
			if (compilation.chunkGraph) {
				for (const chunkModule of compilation.chunkGraph.getChunkModulesIterable(chunk)) {
					processModule(chunkModule);
					if (chunkModule.modules) {
						for (const concatModule of chunkModule.modules) {
							processModule(concatModule);
						}
					}
				}
			}

			// Calculate content hash
			const { hashFunction, hashDigest, hashDigestLength } = compilation.outputOptions;

			const hashBuilder = createHash(hashFunction || 'md4');

			const handleMagicComments = (info) => {
				if (!info) return;
				if (info.includes && info.includes('wp-polyfill')) {
					chunkStaticDeps.add('wp-polyfill');
				}
			};

			chunkFiles.sort().forEach((filename) => {
				const asset = compilation.getAsset(filename);
				if (!asset || !asset.source) return;

				const content = asset.source.buffer
					? asset.source.buffer()
					: Buffer.from(asset.source.source());
				hashBuilder.update(content);

				if (asset.info && asset.info.wpMagicComments) {
					handleMagicComments(asset.info.wpMagicComments);
				}
			});

			const contentHash = hashBuilder
				.digest(hashDigest || 'hex')
				.slice(0, hashDigestLength || 16);

			const assetData = {
				dependencies: [
					...Array.from(chunkStaticDeps).sort(),
					...Array.from(chunkDynamicDeps)
						.sort()
						.map((id) => ({ id, import: 'dynamic' })),
				],
				version: contentHash,
			};

			if (this.useModules) {
				assetData.type = 'module';
			}

			if (compilation.options?.optimization?.runtimeChunk !== false) {
				assetData.handle = `${compilation.name}-${chunkJSFile
					.replace(/\\/g, '/')
					.replace(jsExtensionRegExp, '')}`;
			}

			if (combineAssets) {
				combinedAssetsData[chunkJSFile] = assetData;
				continue;
			}

			let assetFilename;
			if (outputFilename) {
				assetFilename = compilation.getPath(outputFilename, {
					chunk,
					filename: chunkJSFile,
					contentHash,
				});
			} else {
				const suffix = `.asset.${outputFormat === 'php' ? 'php' : 'json'}`;
				assetFilename = compilation
					.getPath('[file]', { filename: chunkJSFile })
					.replace(/\.m?js$/i, suffix);
			}

			compilation.assets[assetFilename] = new RawSource(this.stringify(assetData));
			chunk.files.add(assetFilename);
		}

		if (combineAssets) {
			const outputFolder = compilation.outputOptions.path;
			const assetsFilePath = path.resolve(
				outputFolder,
				combinedOutputFile || `assets.${outputFormat === 'php' ? 'php' : 'json'}`,
			);
			const assetsFilename = path.relative(outputFolder, assetsFilePath);
			compilation.assets[assetsFilename] = new RawSource(this.stringify(combinedAssetsData));
		}
	}
}

module.exports = DependencyExtractionPlugin;
