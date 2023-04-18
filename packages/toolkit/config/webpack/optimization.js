// eslint-disable-next-line import/no-extraneous-dependencies
const TerserPlugin = require('terser-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const { optimize, loadConfig } = require('svgo');
const sharp = require('sharp');
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
				test: /\.(jpe?g|png|webp|avif)$/i,
				minimizer: {
					implementation: async (original) => {
						try {
							const image = sharp(original.data);
							const { format } = await image.metadata();
							const config = {
								jpeg: { quality: 82, mozjpeg: true },
								webp: { quality: 80 },
								png: { compressionLevel: 9, quality: 70 },
								avif: { quality: 40, effort: 5 },
							};
							config.jpg = config.jpeg;
							config.heif = config.avif;
							const data = await image[format](config[format]).toBuffer();

							return {
								filename: original.filename,
								data,
								warnings: [],
								errors: [],
								info: {
									// Please always set it to prevent double minification
									minimized: true,
									// Optional
									minimizedBy: ['10up-toolkit'],
								},
							};
						} catch (error) {
							// Return original input if there was an error
							return {
								filename: original.filename,
								data: original.data,
								errors: [error],
								warnings: [],
							};
						}
					},
				},
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
							if (error.name === 'SvgoParserError') {
								error.message = `parsing svg, it sounds like your svg is invalid: ${error.message}`;
							} else {
								error.message = `Something went wrong when parsing ${original.filename}`;
							}

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
								minimizedBy: ['10up-toolkit'],
							},
						};
					},
				},
			}),
		],
	};
};
