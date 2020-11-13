/**
 * External dependencies
 */
const LiveReloadPlugin = require('webpack-livereload-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const WebpackBar = require('webpackbar');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries');
const path = require('path');
/**
 * WordPress dependencies
 */
const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');

/**
 * Internal dependencies
 */
const {
	hasBabelConfig,
	hasPostCSSConfig,
	hasStylelintConfig,
	getBuildFiles,
	fromConfigRoot,
	hasEslintConfig,
} = require('../utils');

const isProduction = process.env.NODE_ENV === 'production';
const mode = isProduction ? 'production' : 'development';

const cssLoaders = [
	{
		loader: MiniCSSExtractPlugin.loader,
	},
	{
		loader: require.resolve('css-loader'),
		options: {
			sourceMap: !isProduction,
		},
	},
	{
		loader: require.resolve('postcss-loader'),
		options: {
			// Provide a fallback configuration if there's not
			// one explicitly available in the project.
			...(!hasPostCSSConfig() && {
				ident: 'postcss',
				config: {
					path: fromConfigRoot('postcss.config.js'),
				},
			}),
		},
	},
];

const config = {
	devtool: 'inline-cheap-module-source-map',
	mode,
	entry: getBuildFiles(),
	output: {
		filename: '[name].js',
		path: path.resolve(process.cwd(), 'dist'),
	},
	resolve: {
		alias: {
			'lodash-es': 'lodash',
		},
	},
	performance: {
		maxAssetSize: 100000,
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [
					require.resolve('thread-loader'),
					{
						loader: require.resolve('babel-loader'),
						options: {
							// Babel uses a directory within local node_modules
							// by default. Use the environment variable option
							// to enable more persistent caching.
							cacheDirectory: process.env.BABEL_CACHE_DIRECTORY || true,

							// Provide a fallback configuration if there's not
							// one explicitly available in the project.
							...(!hasBabelConfig() && {
								babelrc: false,
								configFile: false,
								presets: [require.resolve('@10up/babel-preset-default')],
							}),
						},
					},
					{
						loader: require.resolve('eslint-loader'),
						options: {
							enforce: 'pre',
							...(!hasEslintConfig() && {
								configFile: fromConfigRoot('.eslintrc.js'),
							}),
						},
					},
				],
			},
			{
				test: /\.svg$/,
				use: ['@svgr/webpack', 'url-loader'],
			},
			{
				test: /\.css$/,
				include: path.resolve(process.cwd(), './assets/css'),
				use: cssLoaders,
			},
		],
	},
	plugins: [
		// Remove the extra JS files Webpack creates for CSS entries.
		// This should be fixed in Webpack 5.
		new FixStyleOnlyEntriesPlugin({
			silent: true,
		}),
		// During rebuilds, all webpack assets that are not used anymore
		// will be removed automatically.
		new CleanWebpackPlugin(),
		// MiniCSSExtractPlugin to extract the CSS thats gets imported into JavaScript.
		new MiniCSSExtractPlugin({ esModule: false, filename: '[name].css' }),
		// WP_LIVE_RELOAD_PORT global variable changes port on which live reload
		// works when running watch mode.
		!isProduction &&
			new LiveReloadPlugin({
				port: process.env.TENUP_LIVE_RELOAD_PORT || 35729,
			}),
		// Lint CSS.
		new StyleLintPlugin({
			context: path.resolve(process.cwd(), './assets/css'),
			files: '**/*.css',
			...(!hasStylelintConfig() && {
				configFile: fromConfigRoot('stylelint.config.js'),
			}),
		}),
		// Fancy WebpackBar.
		new WebpackBar(),
		// TENUP_NO_EXTERNALS global variable controls whether scripts' assets get
		// generated, and the default externals set.
		!process.env.TENUP_NO_EXTERNALS &&
			new DependencyExtractionWebpackPlugin({ injectPolyfill: false }),
	].filter(Boolean),
	stats: {
		children: false,
	},
};

if (!isProduction) {
	config.devtool = 'source-map';
	config.module.rules.unshift({
		test: /\.js$/,
		exclude: [/node_modules/],
		use: require.resolve('source-map-loader'),
		enforce: 'pre',
	});
}

module.exports = config;
