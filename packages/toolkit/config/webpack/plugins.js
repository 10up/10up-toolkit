const StyleLintPlugin = require('stylelint-webpack-plugin');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { resolve } = require('path');
const { VanillaExtractPlugin } = require('@vanilla-extract/webpack-plugin');

const {
	getCopyPlugin,
	getCssExtractPlugin,
	getEslintPlugin,
	getReactRefreshPlugin,
	getWebpackBar,
	isRspack,
} = require('../bundler');

const RemoveEmptyScriptsPlugin = require('./plugins/remove-empty-scripts');
const CleanExtractedDeps = require('./plugins/clean-extracted-deps');
const TenUpToolkitTscPlugin = require('./plugins/tsc');
const NoBrowserSyncPlugin = require('./plugins/no-browser-sync');

// Use our forked dependency extraction plugin for RSPack compatibility
// The original @wordpress/dependency-extraction-webpack-plugin uses webpack internals
// that are not fully compatible with RSPack
const DependencyExtractionPlugin = isRspack()
	? require('./plugins/dependency-extraction')
	: require('@wordpress/dependency-extraction-webpack-plugin');

const {
	hasStylelintConfig,
	fromConfigRoot,
	hasProjectFile,
	getArgFromCLI,
	transformBlockJson,
} = require('../../utils');
const { isPackageInstalled } = require('../../utils/package');

const removeDistFolder = (file) => {
	return file.replace(/(^\.\/dist\/)|^dist\//, '');
};

// There are differences between Windows and Posix when it comes to the WebpackBar
// This ensures that the same reporter is used everywhere
const webpackbarArguments =
	process.env.JEST_WORKER_ID !== undefined ? { reporters: ['basic'] } : undefined;

module.exports = ({
	isPackage,
	isModule = false,
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
		useBlockAssets,
	},
	packageConfig: { style },
	buildFiles,
}) => {
	const hasReactFastRefresh = hot && !isProduction && !isModule;
	const shouldCompileVanillaExtract = isPackageInstalled('@vanilla-extract/css');

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

	// Get the appropriate plugins based on bundler type
	const CopyPlugin = getCopyPlugin();
	const CssExtractPlugin = getCssExtractPlugin();
	const ESLintPlugin = getEslintPlugin();
	const ReactRefreshPlugin = getReactRefreshPlugin();
	const WebpackBar = getWebpackBar();

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
		shouldCompileVanillaExtract && new VanillaExtractPlugin(),
		// CssExtractPlugin to extract the CSS that gets imported into JavaScript.
		new CssExtractPlugin({
			filename: (options) => {
				if (isPackage) {
					return removeDistFolder(style);
				}

				const chunkName = options.chunk.name;
				let isBlockAsset = false;

				// First try to check using entry modules (webpack-specific, may not work with RSPack)
				if (!isRspack()) {
					let entryModules = [];
					try {
						// with the react fast refresh plugin
						// we cannot always assume there's a single entry module
						// so we need to check if any of the entry modules are relative to blocksSourceDirectory
						entryModules = options.chunk.getModules().filter((module) => {
							return module.isEntryModule && module.isEntryModule();
						});
					} catch (e) {
						try {
							// if it failed it's bc there's only one entryModule
							if (options.chunk.entryModule) {
								entryModules.push(options.chunk.entryModule);
							}
						} catch (e) {
							entryModules = [];
						}
					}

					isBlockAsset = entryModules.some((module) => {
						const fullPath = module.resource;

						return fullPath
							? !path
									.relative(blocksSourceDirectory, fullPath)
									// startWith('../') but in a cross-env way
									.startsWith(path.join('..', '/'))
							: false;
					});
				}

				// Fallback: check by chunk name or build file path
				if (!isBlockAsset) {
					if (useBlockAssets && buildFiles[chunkName]) {
						isBlockAsset =
							// match windows and posix paths
							buildFiles[chunkName].match(/\/blocks?\//) ||
							buildFiles[chunkName].match(/\\blocks?\\/);
					} else if (!useBlockAssets) {
						isBlockAsset = chunkName && chunkName.match(/-block$/);
					}
				}

				return isBlockAsset ? filenames.blockCSS : filenames.css;
			},
			chunkFilename: '[id].css',
		}),

		!isPackage &&
			// Copy static assets to the `dist` folder.
			new CopyPlugin({
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
		// Lint CSS.
		new StyleLintPlugin({
			context: path.resolve(process.cwd(), paths.srcDir),
			files: '**/*.(s(c|a)ss|css)',
			allowEmptyInput: true,
			lintDirtyModulesOnly: true,
			failOnError: false,
			...(!hasStylelintConfig() && {
				configFile: fromConfigRoot('stylelint.config.js'),
			}),
		}),
		// Fancy WebpackBar.
		!hasReactFastRefresh && new WebpackBar(webpackbarArguments),
		// dependencyExternals variable controls whether scripts' assets get
		// generated, and the default externals set.
		wpDependencyExternals &&
			!isPackage &&
			new DependencyExtractionPlugin({
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
			new ReactRefreshPlugin(
				isRspack()
					? {
							// RSPack plugin uses different options
							overlay: {
								sockHost: '127.0.0.1',
								sockProtocol: 'ws',
								sockPort: devServerPort,
							},
						}
					: {
							overlay: {
								sockHost: '127.0.0.1',
								sockProtocol: 'ws',
								sockPort: devServerPort,
							},
							exclude: [/node_module/, /outputCssLoader\.js/],
						},
			),
	].filter(Boolean);
};
