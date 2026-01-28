const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const { optimize, loadConfig } = require('svgo');
const sharp = require('sharp');

const { getJsMinimizer } = require('../bundler');
const { fromProjectRoot, hasProjectFile } = require('../../utils');

module.exports = ({ isProduction, projectConfig: { hot, analyze } }) => {
	return {
		concatenateModules: isProduction && !analyze,
		runtimeChunk: hot ? 'single' : false,
		minimizer: [
			// Use bundler-appropriate JS minimizer (RSPack uses SWC, webpack uses Terser)
			...getJsMinimizer(),
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
