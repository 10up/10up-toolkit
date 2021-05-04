const path = require('path');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');

const { hasBabelConfig, hasPostCSSConfig, fromConfigRoot } = require('../../utils');

module.exports = ({
	isProduction,
	isPackage,
	defaultTargets,
	projectConfig: { wordpress, paths },
}) => {
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

	return {
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
										{ wordpress, targets: defaultTargets },
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
				include: paths.cssLoaderPaths.map((cssPath) =>
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
	};
};
