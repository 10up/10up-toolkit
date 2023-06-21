const CopyWebpackPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const WebpackBar = require('webpackbar');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { resolve } = require('path');
const RemoveEmptyScriptsPlugin = require('./plugins/remove-empty-scripts');
const CleanExtractedDeps = require('./plugins/clean-extracted-deps');
const TenUpToolkitTscPlugin = require('./plugins/tsc');
const NoBrowserSyncPlugin = require('./plugins/no-browser-sync');

const {
	hasStylelintConfig,
	fromConfigRoot,
	hasProjectFile,
	getArgFromCLI,
	maybeInsertStyleVersionHash,
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

	const blocksSourceDirectory = resolve(process.cwd(), paths.blocksDir);

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

		// MiniCSSExtractPlugin to extract the CSS that gets imported into JavaScript.
		new MiniCSSExtractPlugin({
			filename: (options) => {
				if (isPackage) {
					return removeDistFolder(style);
				}

				let entryModules = [];
				try {
					// with the react fast refresh plugin
					// we cannot always assume there's a single entry module
					// so we need to check if any of the entry modules are relative to blocksSourceDiretory
					entryModules = options.chunk.getModules().filter((module) => {
						return module.isEntryModule();
					});
				} catch (e) {
					try {
						// if it failed it's bc there's only one entryModule
						entryModules.push(options.chunk.entryModule);
					} catch (e) {
						entryModules = [];
					}
				}

				let isBlockAsset = entryModules.some((module) => {
					const fullPath = module.resource;

					return fullPath
						? !path
								.relative(blocksSourceDirectory, fullPath)
								// startWith('../') but in a cross-env way
								.startsWith(path.join('..', '/'))
						: false;
				});

				if (!isBlockAsset) {
					if (useBlockAssets) {
						isBlockAsset =
							// match windows and posix paths
							buildFiles[options.chunk.name].match(/\/blocks?\//) ||
							buildFiles[options.chunk.name].match(/\\blocks?\\/);
					} else {
						isBlockAsset = options.chunk.name.match(/-block$/);
					}
				}

				return isBlockAsset ? filenames.blockCSS : filenames.css;
			},
			chunkFilename: '[id].css',
		}),

		!isPackage &&
			// Copy static assets to the `dist` folder.
			new CopyWebpackPlugin({
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
							return maybeInsertStyleVersionHash(content, absoluteFilename);
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
			new DependencyExtractionWebpackPlugin({
				injectPolyfill: false,
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
				exclude: [/node_module/, /outputCssLoader\.js/],
			}),
	].filter(Boolean);
};
