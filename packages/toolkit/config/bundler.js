/**
 * Bundler abstraction for webpack/rspack switching
 *
 * This module provides a unified interface for both webpack and rspack bundlers.
 * RSPack is used by default for faster build times. Webpack can be used as a fallback
 * via environment variable or package.json configuration.
 *
 * Usage: BUNDLER=webpack npx 10up-toolkit build
 *
 * Or in package.json: { "10up-toolkit": { "bundler": "webpack" } }
 */

/* eslint-disable global-require, import/no-extraneous-dependencies */
const { getTenUpScriptsConfig } = require('../utils');

/**
 * Determine which bundler to use
 * Priority: BUNDLER env var > package.json config > default (rspack)
 *
 * @returns {'webpack' | 'rspack'}
 */
function getBundlerType() {
	// Check environment variable first
	if (process.env.BUNDLER) {
		const bundler = process.env.BUNDLER.toLowerCase();
		if (bundler === 'webpack' || bundler === 'rspack') {
			return bundler;
		}
	}

	// Check package.json config
	try {
		const config = getTenUpScriptsConfig();
		if (config.bundler) {
			const bundler = config.bundler.toLowerCase();
			if (bundler === 'webpack' || bundler === 'rspack') {
				return bundler;
			}
		}
	} catch (e) {
		// If config loading fails, use default
	}

	// Default to rspack
	return 'rspack';
}

/**
 * Check if we're using RSPack
 * @returns {boolean}
 */
function isRspack() {
	return getBundlerType() === 'rspack';
}

/**
 * Check if we're using webpack
 * @returns {boolean}
 */
function isWebpack() {
	return getBundlerType() === 'webpack';
}

/**
 * Get the bundler module (webpack or @rspack/core)
 * @returns {object}
 */
function getBundler() {
	if (isRspack()) {
		return require('@rspack/core');
	}
	return require('webpack');
}

/**
 * Get the dev server module
 * @returns {object}
 */
function getDevServer() {
	if (isRspack()) {
		// RSPack uses @rspack/dev-server which is a wrapper around webpack-dev-server
		// For now, webpack-dev-server works with rspack as well
		return require('webpack-dev-server');
	}
	return require('webpack-dev-server');
}

/**
 * Get CSS extract plugin
 * For RSPack, we use the built-in CssExtractRspackPlugin
 * For webpack, we use mini-css-extract-plugin
 *
 * @returns {object}
 */
function getCssExtractPlugin() {
	if (isRspack()) {
		const rspack = require('@rspack/core');
		return rspack.CssExtractRspackPlugin;
	}
	return require('mini-css-extract-plugin');
}

/**
 * Get CSS extract plugin loader path
 * For RSPack, the loader is built into CssExtractRspackPlugin
 * For webpack, we use mini-css-extract-plugin's loader
 *
 * @returns {string | object}
 */
function getCssExtractLoader() {
	if (isRspack()) {
		const rspack = require('@rspack/core');
		return rspack.CssExtractRspackPlugin.loader;
	}
	return require('mini-css-extract-plugin').loader;
}

/**
 * Get copy plugin
 * For RSPack, we use the built-in CopyRspackPlugin
 * For webpack, we use copy-webpack-plugin
 *
 * @returns {object}
 */
function getCopyPlugin() {
	if (isRspack()) {
		const rspack = require('@rspack/core');
		return rspack.CopyRspackPlugin;
	}
	return require('copy-webpack-plugin');
}

/**
 * Get ESLint plugin
 * @returns {object}
 */
function getEslintPlugin() {
	if (isRspack()) {
		return require('eslint-rspack-plugin');
	}
	return require('eslint-webpack-plugin');
}

/**
 * Get React Refresh plugin
 * @returns {object}
 */
function getReactRefreshPlugin() {
	if (isRspack()) {
		return require('@rspack/plugin-react-refresh');
	}
	return require('@pmmmwh/react-refresh-webpack-plugin');
}

/**
 * Get WebpackBar with the appropriate import
 * @returns {object}
 */
function getWebpackBar() {
	// WebpackBar works with both webpack and rspack
	return require('webpackbar');
}

/**
 * Get the appropriate sources module for creating raw sources
 * @returns {object}
 */
function getSources() {
	if (isRspack()) {
		const rspack = require('@rspack/core');
		return rspack.sources;
	}
	return require('webpack-sources');
}

/**
 * Get minizer configuration for optimization
 * RSPack uses built-in SwcJsMinimizerRspackPlugin
 * Webpack uses TerserPlugin
 *
 * @returns {object[]}
 */
function getJsMinimizer() {
	if (isRspack()) {
		const rspack = require('@rspack/core');
		return [new rspack.SwcJsMinimizerRspackPlugin()];
	}

	const TerserPlugin = require('terser-webpack-plugin');
	return [
		new TerserPlugin({
			parallel: true,
			terserOptions: {
				parse: {
					ecma: 8,
				},
				compress: {
					ecma: 5,
					warnings: false,
					comparisons: false,
					inline: 2,
				},
			},
		}),
	];
}

/**
 * Get image minimizer plugins for optimization
 * RSPack: image-minimizer-webpack-plugin is not compatible, so we skip image optimization
 * Webpack: use image-minimizer-webpack-plugin with sharp and svgo
 *
 * @param {object} options - Options object
 * @param {Function} options.hasProjectFile - Function to check if a file exists in project
 * @param {Function} options.fromProjectRoot - Function to get path from project root
 * @returns {object[]}
 */
function getImageMinimizers({ hasProjectFile, fromProjectRoot }) {
	// image-minimizer-webpack-plugin is not compatible with RSPack
	// It uses webpack-specific hooks that don't exist in RSPack's lite-tapable
	if (isRspack()) {
		return [];
	}

	const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
	const { optimize, loadConfig } = require('svgo');
	const sharp = require('sharp');

	return [
		new ImageMinimizerPlugin({
			test: /\.(jpe?g|png|webp|avif)$/i,
			minimizer: {
				implementation: async (original) => {
					try {
						const image = sharp(original.data);
						const { format } = await image.metadata();
						const config = {
							jpeg: { quality: 82, mozjpeg: true },
							webp: { quality: 80 },
							png: { compressionLevel: 9, quality: 70 },
							avif: { quality: 40, effort: 5 },
						};
						config.jpg = config.jpeg;
						config.heif = config.avif;
						const data = await image[format](config[format]).toBuffer();

						return {
							filename: original.filename,
							data,
							warnings: [],
							errors: [],
							info: {
								// Please always set it to prevent double minification
								minimized: true,
								// Optional
								minimizedBy: ['10up-toolkit'],
							},
						};
					} catch (error) {
						// Return original input if there was an error
						return {
							filename: original.filename,
							data: original.data,
							errors: [error],
							warnings: [],
						};
					}
				},
			},
		}),
		new ImageMinimizerPlugin({
			test: /\.svg$/,
			minimizer: {
				implementation: async (original) => {
					let result;

					try {
						const defaultConfig = {
							plugins: [
								{
									name: 'preset-default',
									params: {
										overrides: {
											removeViewBox: false,
										},
									},
								},
							],
						};

						let config = { ...defaultConfig };

						if (hasProjectFile('svgo.config.js')) {
							const svgoConfigFile = fromProjectRoot('svgo.config.js');
							config = await loadConfig(svgoConfigFile);
						}

						result = optimize(original.data, {
							path: original.filename,
							...config,
						});
					} catch (error) {
						if (error.name === 'SvgoParserError') {
							error.message = `parsing svg, it sounds like your svg is invalid: ${error.message}`;
						} else {
							error.message = `Something went wrong when parsing ${original.filename}`;
						}

						// Return original input if there was an error
						return {
							filename: original.filename,
							data: original.data,
							errors: [error],
							warnings: [],
						};
					}

					return {
						filename: original.filename,
						data: Buffer.from(result.data),
						warnings: [],
						errors: [],
						info: {
							// Please always set it to prevent double minification
							minimized: true,
							// Optional
							minimizedBy: ['10up-toolkit'],
						},
					};
				},
			},
		}),
	];
}

module.exports = {
	getBundlerType,
	isRspack,
	isWebpack,
	getBundler,
	getDevServer,
	getCssExtractPlugin,
	getCssExtractLoader,
	getCopyPlugin,
	getEslintPlugin,
	getReactRefreshPlugin,
	getWebpackBar,
	getSources,
	getJsMinimizer,
	getImageMinimizers,
};
