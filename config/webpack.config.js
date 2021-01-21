/**
 * External dependencies
 */
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const WebpackBar = require('webpackbar');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries');
const path = require('path');
const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const CleanExtractedDeps = require('../utils/clean-extracted-deps');

/**
 * Internal dependencies
 */
const {
	hasBabelConfig,
	hasPostCSSConfig,
	hasStylelintConfig,
	getBuildFiles,
	getFilenames,
	getPaths,
	getLocalDevURL,
	fromConfigRoot,
	hasEslintConfig,
} = require('../utils');

const buildFiles = getBuildFiles();
const filenames = getFilenames();
const configPaths = getPaths();

const localDevURL = getLocalDevURL();

if (!Object.keys(buildFiles).length) {
	console.error('No files to build!');
	process.exit(1);
}

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
	devtool: isProduction ? false : 'source-map',
	mode,
	entry: buildFiles,
	output: {
		path: path.resolve(process.cwd(), 'dist'),
		filename: (pathData) => {
			return buildFiles[pathData.chunk.name].match(/\/blocks\//)
				? filenames.block
				: filenames.js;
		},
		/**
		 * If multiple webpack runtimes (from different compilations) are used on the same webpage,
		 * there is a risk of conflicts of on-demand chunks in the global namespace.
		 *
		 * @see (@link https://webpack.js.org/configuration/output/#outputjsonpfunction)
		 */
		jsonpFunction: '__TenUpScripts_webpackJsonp',
	},
	resolve: {
		alias: {
			'lodash-es': 'lodash',
		},
	},
	externals: {
		jquery: 'jQuery',
		lodash: 'lodash',
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
							emitWarning: true,
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
				include: configPaths.cssLoaderPaths.map((cssPath) =>
					path.resolve(process.cwd(), cssPath),
				),
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
		new MiniCSSExtractPlugin({
			// esModule: false,
			filename: ({ name }) => (name.match(/-block$/) ? filenames.blockCSS : filenames.css),
			chunkFilename: '[id].css',
		}),

		// Copy static assets to the `dist` folder.
		new CopyWebpackPlugin({
			patterns: [
				{
					from: '**/*.{jpg,jpeg,png,gif,svg,eot,ttf,woff,woff2}',
					to: '[path][name].[ext]',
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
		// new StyleLintPlugin({
		// 	context: path.resolve(process.cwd(), configPaths.srcDir),
		// 	files: '**/*.css',
		// 	allowEmptyInput: true,
		// 	...(!hasStylelintConfig() && {
		// 		configFile: fromConfigRoot('stylelint.config.js'),
		// 	}),
		// }),
		// Fancy WebpackBar.
		new WebpackBar(),
		// TENUP_NO_EXTERNALS global variable controls whether scripts' assets get
		// generated, and the default externals set.
		!process.env.TENUP_NO_EXTERNALS &&
			new DependencyExtractionWebpackPlugin({
				injectPolyfill: true,
			}),
		new CleanExtractedDeps(),
	].filter(Boolean),
	stats: {
		// Copied from `'minimal'`.
		all: false,
		errors: true,
		maxModules: 0,
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
					output: {
						ecma: 5,
						comments: false,
					},
					ie8: false,
				},
			}),
		],
	},
};

if (!isProduction) {
	config.module.rules.unshift({
		test: /\.js$/,
		exclude: [/node_modules/],
		use: require.resolve('source-map-loader'),
		enforce: 'pre',
	});
}

module.exports = config;
