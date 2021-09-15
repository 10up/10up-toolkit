const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const ESLintPlugin = require('eslint-webpack-plugin');
const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const WebpackBar = require('webpackbar');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const CleanExtractedDeps = require('../../utils/clean-extracted-deps');

const {
	hasStylelintConfig,
	fromConfigRoot,
	hasProjectFile,
	getArgFromCLI,
} = require('../../utils');

const removeDistFolder = (file) => {
	return file.replace(/(^\.\/dist\/)|^dist\//, '');
};

module.exports = ({
	isPackage,
	isProduction,
	projectConfig: { devServer, filenames, devURL, paths, wpDependencyExternals },
	packageConfig: { style },
}) => {
	return [
		devServer &&
			new HtmlWebpackPlugin({
				...(hasProjectFile('public/index.html') && { template: 'public/index.html' }),
			}),
		new ESLintPlugin({
			failOnError: false,
			fix: false,
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
						from: '**/*.{jpg,jpeg,png,gif,svg,eot,ttf,woff,woff2}',
						to: '[path][name].[ext]',
						noErrorOnMissing: true,
						context: path.resolve(process.cwd(), paths.copyAssetsDir),
					},
				],
			}),

		// Compress images
		// Must happen after CopyWebpackPlugin
		new ImageminPlugin({
			disable: !isProduction,
			test: /\.(jpe?g|png|gif|svg)$/i,
		}),

		!isProduction &&
			devURL &&
			new BrowserSyncPlugin(
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
			),
		// Lint CSS.
		new StyleLintPlugin({
			context: path.resolve(process.cwd(), paths.srcDir),
			files: '**/*.(s(c|a)ss|css)',
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
		new RemoveEmptyScriptsPlugin(),
	].filter(Boolean);
};
