const rspack = require('@rspack/core');
const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');
const { resolve } = require('path');
const RspackDependencyExtractionPlugin = require('./plugins/dependency-extraction');
const RemoveEmptyScriptsPlugin = require('./plugins/remove-empty-scripts');
const CleanExtractedDeps = require('./plugins/clean-extracted-deps');
const TenUpToolkitTscPlugin = require('./plugins/tsc');
const NoBrowserSyncPlugin = require('./plugins/no-browser-sync');

const {
	fromConfigRoot,
	hasProjectFile,
	getArgFromCLI,
	transformBlockJson,
} = require('../../utils');
const { isPackageInstalled } = require('../../utils/package');

module.exports = ({
	isPackage,
	isModule = false,
	isProduction,
	projectConfig: {
		devServer,
		devURL,
		devServerPort,
		paths,
		wpDependencyExternals,
		analyze,
		hot,
		useBlockAssets,
	},
	buildFiles,
}) => {
	const hasReactFastRefresh = hot && !isProduction && !isModule;

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

	const blocksSourceDirectory = resolve(process.cwd(), paths.blocksDir);

	return [
		devServer &&
			new rspack.HtmlRspackPlugin({
				...(hasProjectFile('public/index.html') && { template: 'public/index.html' }),
			}),

		// CSS extraction is handled natively by rspack via type: 'css' in module rules.
		// No CssExtractRspackPlugin needed — CSS filenames are controlled via output.cssFilename.

		!isPackage &&
			new rspack.CopyRspackPlugin({
				patterns: [
					{
						from: '**/*.{jpg,jpeg,png,gif,webp,avif,ico,svg,eot,ttf,woff,woff2,otf}',
						to: '[path][name][ext]',
						noErrorOnMissing: true,
						context: path.resolve(process.cwd(), paths.copyAssetsDir),
					},
					useBlockAssets && {
						from: path.join(blocksSourceDirectory, '**/block.json').replace(/\\/g, '/'),
						context: blocksSourceDirectory,
						noErrorOnMissing: true,
						to: 'blocks/[path][name][ext]',
						transform: (content, absoluteFilename) => {
							return transformBlockJson(content, absoluteFilename);
						},
					},
					useBlockAssets && {
						from: path.join(blocksSourceDirectory, '**/*.php').replace(/\\/g, '/'),
						context: blocksSourceDirectory,
						noErrorOnMissing: true,
						to: 'blocks/[path][name][ext]',
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
		// Progress indicator
		!hasReactFastRefresh && new rspack.ProgressPlugin(),
		// WordPress dependency extraction — rspack-native
		wpDependencyExternals &&
			!isPackage &&
			new RspackDependencyExtractionPlugin({
				injectPolyfill: false,
				requestToHandle: (request) => {
					if (request.includes('react-refresh/runtime')) {
						if (isModule) {
							return undefined;
						}

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
			new ReactRefreshPlugin({
				overlay: { sockHost: '127.0.0.1', sockProtocol: 'ws', sockPort: devServerPort },
				exclude: [/node_module/, /outputCssLoader\.js/],
			}),
	].filter(Boolean);
};
