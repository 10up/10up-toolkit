const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const ESLintPlugin = require('eslint-webpack-plugin');
const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const WebpackBar = require('webpackbar');
const path = require('path');
const CleanExtractedDeps = require('../../utils/clean-extracted-deps');

const { hasStylelintConfig, fromConfigRoot } = require('../../utils');

module.exports = ({
	isPackage,
	isProduction,
	projectConfig: { filenames, devURL, paths, wpDependencyExternals },
}) => {
	return [
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

		// WP_LIVE_RELOAD_PORT global variable changes port on which live reload
		// works when running watch mode.
		!isProduction &&
			devURL &&
			new BrowserSyncPlugin(
				{
					host: 'localhost',
					port: 3000,
					proxy: devURL,
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
			context: path.resolve(process.cwd(), paths.srcDir),
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
	].filter(Boolean);
};
