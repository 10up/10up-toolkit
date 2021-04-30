/**
 * External dependencies
 */
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const WebpackBar = require('webpackbar');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const path = require('path');
const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');
// eslint-disable-next-line import/no-extraneous-dependencies
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const ESLintPlugin = require('eslint-webpack-plugin');
const CleanExtractedDeps = require('../utils/clean-extracted-deps');

/**
 * Internal dependencies
 */
const {
	hasBabelConfig,
	hasPostCSSConfig,
	hasStylelintConfig,
	getBuildFiles,
	fromConfigRoot,
	getTenUpScriptsConfig,
	getTenUpScriptsPackageBuildConfig,
} = require('../utils');

const {
	filenames,
	paths: configPaths,
	devURL: localDevURL,
	wpDependencyExternals,
} = getTenUpScriptsConfig();

const { source, main, externals, libraryName, packageType } = getTenUpScriptsPackageBuildConfig();
const buildFiles = getBuildFiles();

// assume it's a package if there's source and main
const isPackage = typeof source !== 'undefined' && typeof main !== 'undefined';

if (!isPackage && !Object.keys(buildFiles).length) {
	console.error('No files to build!');
	process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';
const mode = isProduction ? 'production' : 'development';

const defaultTargets = ['> 1%', 'ie >= 11', 'Firefox ESR', 'last 2 versions'];

const cssLoaders = [
	{
		loader: MiniCSSExtractPlugin.loader,
	},
	{
		loader: require.resolve('css-loader'),
		options: {
			sourceMap: !isProduction,
			// Local files like fonts etc. are copied using CopyWebpackPlugin when in project mode.
			url: isPackage,
		},
	},
	{
		loader: require.resolve('postcss-loader'),
		options: {
			postcssOptions: {
				// Provide a fallback configuration if there's not
				// one explicitly available in the project.
				...(!hasPostCSSConfig() && {
					config: fromConfigRoot('postcss.config.js'),
				}),
			},
		},
	},
];

const entry = isPackage ? source : buildFiles;
const output = isPackage
	? { filename: main, library: { name: libraryName, type: packageType } }
	: {
			path: path.resolve(process.cwd(), 'dist'),
			filename: (pathData) => {
				return buildFiles[pathData.chunk.name].match(/\/blocks\//)
					? filenames.block
					: filenames.js;
			},
	  };
const externalsArray = isPackage
	? externals.reduce((acc, current) => {
			acc[current] = current;
			return acc;
	  }, {})
	: {
			jquery: 'jQuery',
			lodash: 'lodash',
	  };

const config = {
	devtool: isProduction ? false : 'source-map',
	mode,
	entry,
	output,
	target: `browserslist:${defaultTargets.join(', ')}`,
	resolve: {
		alias: {
			'lodash-es': 'lodash',
		},
	},
	externals: externalsArray,
	performance: {
		maxAssetSize: 100000,
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules\/(?!(@10up\/block-components)\/).*/,
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
								presets: [
									[
										require.resolve('@10up/babel-preset-default'),
										{ wordpress: true, targets: defaultTargets },
									],
								],
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
				include: configPaths.cssLoaderPaths.map((cssPath) =>
					path.resolve(process.cwd(), cssPath),
				),
				use: cssLoaders,
			},
			// when in package module only include referenced resources
			isPackage && {
				test: /\.{jpg,jpeg,png,gif,svg,eot,ttf,woff,woff2}/,
				type: 'asset/resource',
			},
		].filter(Boolean),
	},

	plugins: [
		new ESLintPlugin({
			failOnError: false,
			fix: false,
		}),

		// During rebuilds, all webpack assets that are not used anymore
		// will be removed automatically.
		new CleanWebpackPlugin(),

		// MiniCSSExtractPlugin to extract the CSS thats gets imported into JavaScript.
		new MiniCSSExtractPlugin({
			// esModule: false,
			filename: (options) => {
				return options.chunk.name.match(/-block$/) ? filenames.blockCSS : filenames.css;
			},
			chunkFilename: '[id].css',
		}),

		!isPackage &&
			// Copy static assets to the `dist` folder.
			new CopyWebpackPlugin({
				patterns: [
					{
						from: '**/*.{jpg,jpeg,png,gif,svg,eot,ttf,woff,woff2}',
						to: '[path][name].[ext]',
						noErrorOnMissing: true,
						context: path.resolve(process.cwd(), configPaths.copyAssetsDir),
					},
				],
			}),

		// Compress images
		// Must happen after CopyWebpackPlugin
		new ImageminPlugin({
			disable: !isProduction,
			test: /\.(jpe?g|png|gif|svg)$/i,
		}),

		// WP_LIVE_RELOAD_PORT global variable changes port on which live reload
		// works when running watch mode.
		!isProduction &&
			localDevURL &&
			new BrowserSyncPlugin(
				{
					host: 'localhost',
					port: 3000,
					proxy: localDevURL,
					open: false,
					files: ['**/*.php', 'dist/**/*.js', 'dist//**/*.css'],
				},
				{
					injectCss: true,
					reload: false,
				},
			),
		// Lint CSS.
		new StyleLintPlugin({
			context: path.resolve(process.cwd(), configPaths.srcDir),
			files: '**/*.css',
			allowEmptyInput: true,
			...(!hasStylelintConfig() && {
				configFile: fromConfigRoot('stylelint.config.js'),
			}),
		}),
		// Fancy WebpackBar.
		new WebpackBar(),
		// dependecyExternals variable controls whether scripts' assets get
		// generated, and the default externals set.
		wpDependencyExternals &&
			!isPackage &&
			new DependencyExtractionWebpackPlugin({
				injectPolyfill: true,
			}),
		new CleanExtractedDeps(),
	].filter(Boolean),
	stats: {
		// Copied from `'minimal'`.
		all: false,
		errors: true,
		modules: true,
		warnings: true,
		// Our additional options.
		assets: true,
		errorDetails: true,
		excludeAssets: /\.(jpe?g|png|gif|svg|woff|woff2)$/i,
		moduleTrace: true,
		performance: true,
	},
	optimization: {
		concatenateModules: isProduction,
		minimizer: [
			new TerserPlugin({
				parallel: true,
				terserOptions: {
					parse: {
						// We want terser to parse ecma 8 code. However, we don't want it
						// to apply any minfication steps that turns valid ecma 5 code
						// into invalid ecma 5 code. This is why the 'compress' and 'output'
						// sections only apply transformations that are ecma 5 safe
						// https://github.com/facebook/create-react-app/pull/4234
						ecma: 8,
					},
					compress: {
						ecma: 5,
						warnings: false,
						// Disabled because of an issue with Uglify breaking seemingly valid code:
						// https://github.com/facebook/create-react-app/issues/2376
						// Pending further investigation:
						// https://github.com/mishoo/UglifyJS2/issues/2011
						comparisons: false,
						// Disabled because of an issue with Terser breaking valid code:
						// https://github.com/facebook/create-react-app/issues/5250
						// Pending futher investigation:
						// https://github.com/terser-js/terser/issues/120
						inline: 2,
					},
				},
			}),
		],
	},
};

module.exports = config;
