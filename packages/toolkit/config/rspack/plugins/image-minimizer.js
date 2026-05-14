/**
 * Rspack-native image minimizer plugin.
 *
 * Replaces image-minimizer-webpack-plugin which uses Compilation.hooks.moduleAsset
 * (not supported by rspack). This plugin hooks into processAssets at the
 * OPTIMIZE_SIZE stage and runs sharp (for raster images) and svgo (for SVGs)
 * directly on the compilation assets.
 */

const { optimize: svgoOptimize, loadConfig: svgoLoadConfig } = require('svgo');
const sharp = require('sharp');
const { fromProjectRoot, hasProjectFile } = require('../../../utils');

const pluginName = 'RspackImageMinimizerPlugin';

// PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE = 2000
const STAGE = 2000;

class RspackImageMinimizerPlugin {
	apply(compiler) {
		compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
			compilation.hooks.processAssets.tapPromise(
				{ name: pluginName, stage: STAGE },
				async () => {
					const assets = compilation.getAssets();
					const { RawSource } = compiler.webpack.sources;

					for (const asset of assets) {
						const { name } = asset;

						if (/\.(jpe?g|png|webp|avif)$/i.test(name)) {
							try {
								const source = asset.source.buffer
									? asset.source.buffer()
									: Buffer.from(asset.source.source());
								const image = sharp(source);
								const { format } = await image.metadata();
								const config = {
									jpeg: { quality: 82, mozjpeg: true },
									webp: { quality: 80 },
									png: { compressionLevel: 9, quality: 70 },
									avif: { quality: 40, effort: 5 },
								};
								config.jpg = config.jpeg;
								config.heif = config.avif;

								if (format && config[format]) {
									const data = await image[format](config[format]).toBuffer();
									compilation.updateAsset(name, new RawSource(data));
								}
							} catch (error) {
								// Leave original asset if optimization fails
							}
						} else if (/\.svg$/i.test(name)) {
							try {
								const source = asset.source.source();
								const input =
									typeof source === 'string' ? source : source.toString();

								const defaultSvgoConfig = {
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

								let svgoConfig = { ...defaultSvgoConfig };

								if (hasProjectFile('svgo.config.js')) {
									const svgoConfigFile = fromProjectRoot('svgo.config.js');
									svgoConfig = await svgoLoadConfig(svgoConfigFile);
								}

								const result = svgoOptimize(input, {
									path: name,
									...svgoConfig,
								});

								compilation.updateAsset(
									name,
									new RawSource(Buffer.from(result.data)),
								);
							} catch (error) {
								// Leave original asset if optimization fails
							}
						}
					}
				},
			);
		});
	}
}

module.exports = RspackImageMinimizerPlugin;
