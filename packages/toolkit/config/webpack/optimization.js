// eslint-disable-next-line import/no-extraneous-dependencies
const TerserPlugin = require('terser-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const { optimize, loadConfig } = require('svgo');
const { fromProjectRoot, hasProjectFile } = require('../../utils');

module.exports = ({ isProduction, projectConfig: { hot, analyze } }) => {
	return {
		concatenateModules: isProduction && !analyze,
		runtimeChunk: hot ? 'single' : false,
		minimizer: [
			new TerserPlugin({
				parallel: true,
				terserOptions: {
					parse: {
						// We want terser to parse ecma 8 code. However, we don't want it
						// to apply any minification steps that turns valid ecma 5 code
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
			new ImageMinimizerPlugin({
				minimizer: [
					{
						implementation: ImageMinimizerPlugin.squooshMinify,
						options: {
							encodeOptions: {
								mozjpeg: {
									// That setting might be close to lossless, but it’s not guaranteed
									// https://github.com/GoogleChromeLabs/squoosh/issues/85
									quality: 100,
								},
								webp: {
									lossless: 1,
								},
								avif: {
									// https://github.com/GoogleChromeLabs/squoosh/blob/dev/codecs/avif/enc/README.md
									cqLevel: 0,
								},
							},
						},
					},
				],
			}),
			new ImageMinimizerPlugin({
				test: /\.svg$/,
				minimizer: {
					implementation: async (original) => {
						let result;

						try {
							const defaultConfig = {
								plugins: [
									{
										name: 'preset-default',
										params: {
											overrides: {
												removeViewBox: false,
											},
										},
									},
								],
							};

							let config = { ...defaultConfig };

							if (hasProjectFile('svgo.config.js')) {
								const svgoConfigFile = fromProjectRoot('svgo.config.js');
								config = await loadConfig(svgoConfigFile);
							}

							result = optimize(original.data, {
								path: original.filename,
								...config,
							});
						} catch (error) {
							// Return original input if there was an error
							return {
								filename: original.filename,
								data: original.data,
								errors: [error],
								warnings: [],
							};
						}

						return {
							filename: original.filename,
							data: Buffer.from(result.data),
							warnings: [],
							errors: [],
							info: {
								// Please always set it to prevent double minification
								minimized: true,
								// Optional
								minimizedBy: ['10up-toolkit-svgo'],
							},
						};
					},
				},
			}),
		],
	};
};
