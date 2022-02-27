const CopyWebpackPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const WebpackBar = require('webpackbar');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const CleanExtractedDeps = require('./plugins/clean-extracted-deps');
const TenUpToolkitTscPlugin = require('./plugins/tsc');
const NoBrowserSyncPlugin = require('./plugins/no-browser-sync');

const {
	hasStylelintConfig,
	fromConfigRoot,
	hasProjectFile,
	getArgFromCLI,
} = require('../../utils');
const { isPackageInstalled } = require('../../utils/package');

const removeDistFolder = (file) => {
	return file.replace(/(^\.\/dist\/)|^dist\//, '');
};

module.exports = ({
	isPackage,
	isProduction,
	projectConfig: {
		devServer,
		filenames,
		devURL,
		devServerPort,
		paths,
		wpDependencyExternals,
		analyze,
		hot,
	},
	packageConfig: { style },
}) => {
	const hasReactFastRefresh = hot && !isProduction;
	const hasBrowserSync =
		isPackageInstalled('browser-sync-webpack-plugin') && isPackageInstalled('browser-sync');

	const shouldLoadBrowserSync = !isProduction && devURL && !hasReactFastRefresh && hasBrowserSync;

	let browserSync = !isProduction && devURL ? new NoBrowserSyncPlugin() : false;
	if (shouldLoadBrowserSync) {
		// eslint-disable-next-line global-require, import/no-extraneous-dependencies
		const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
		browserSync = new BrowserSyncPlugin(
			{
				host: 'localhost',
				port: getArgFromCLI('--port') || 3000,
				proxy: devURL,
				open: false,
				files: ['**/*.php', '**/*.js', 'dist/**/*.css'],
				ignore: ['dist/**/*.php', 'dist/**/*.js'],
				serveStatic: ['.'],
				rewriteRules: [
					{
						match: /wp-content\/themes\/.*\/dist/g,
						replace: 'dist',
					},
				],
			},
			{
				injectCss: true,
				reload: false,
			},
		);
	}

	return [
		devServer &&
			new HtmlWebpackPlugin({
				...(hasProjectFile('public/index.html') && { template: 'public/index.html' }),
			}),
		new ESLintPlugin({
			failOnError: false,
			fix: false,
			lintDirtyModulesOnly: true,
		}),

		// MiniCSSExtractPlugin to extract the CSS thats gets imported into JavaScript.
		new MiniCSSExtractPlugin({
			// esModule: false,
			filename: (options) => {
				if (isPackage) {
					return removeDistFolder(style);
				}

				return options.chunk.name.match(/-block$/) ? filenames.blockCSS : filenames.css;
			},
			chunkFilename: '[id].css',
		}),

		!isPackage &&
			// Copy static assets to the `dist` folder.
			new CopyWebpackPlugin({
				patterns: [
					{
						from: '**/*.{jpg,jpeg,png,gif,ico,svg,eot,ttf,woff,woff2,otf}',
						to: '[path][name][ext]',
						noErrorOnMissing: true,
						context: path.resolve(process.cwd(), paths.copyAssetsDir),
					},
					hasReactFastRefresh && {
						from: fromConfigRoot('fast-refresh.php'),
						to: '[path][name][ext]',
						noErrorOnMissing: true,
						context: path.resolve(process.cwd(), '/dist'),
					},
				].filter(Boolean),
			}),
		devURL && browserSync,
		// Lint CSS.
		new StyleLintPlugin({
			context: path.resolve(process.cwd(), paths.srcDir),
			files: '**/*.(s(c|a)ss|css)',
			allowEmptyInput: true,
			lintDirtyModulesOnly: true,
			...(!hasStylelintConfig() && {
				configFile: fromConfigRoot('stylelint.config.js'),
			}),
		}),
		// Fancy WebpackBar.
		!hasReactFastRefresh && new WebpackBar(),
		// dependecyExternals variable controls whether scripts' assets get
		// generated, and the default externals set.
		wpDependencyExternals &&
			!isPackage &&
			new DependencyExtractionWebpackPlugin({
				injectPolyfill: true,
				requestToHandle: (request) => {
					if (request.includes('react-refresh/runtime')) {
						return 'tenup-toolkit-react-refresh-runtime';
					}

					return undefined;
				},
			}),
		new CleanExtractedDeps(),
		new RemoveEmptyScriptsPlugin(),
		new TenUpToolkitTscPlugin(),
		analyze && isProduction && new BundleAnalyzerPlugin({ analyzerMode: 'static' }),
		hasReactFastRefresh &&
			new ReactRefreshWebpackPlugin({
				overlay: { sockHost: '127.0.0.1', sockProtocol: 'ws', sockPort: devServerPort },
			}),
	].filter(Boolean);
};
