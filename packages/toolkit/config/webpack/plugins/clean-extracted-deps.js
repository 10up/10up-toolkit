/**
 * Removes wp-polyfill from CSS assets extracted via @wordpress/dependency-extraction-webpack-plugin
 */

const { RawSource } = require('webpack-sources');

class CleanExtractedDeps {
	constructor(options) {
		this.options = options;
	}

	apply(compiler) {
		compiler.hooks.emit.tap('CleanExtractedDeps', (compilation) => {
			for (const [entrypointName, entrypoint] of compilation.entrypoints.entries()) {
				let compilationAssetMatch = false;
				let entryPointPath = false;

				Object.keys(compilation.assets).forEach((compilationAsset) => {
					if (compilationAsset.match(new RegExp(`${entrypointName}.asset.php$`))) {
						compilationAssetMatch = compilationAsset;
					}
					if (compilationAsset.match(new RegExp(`${entrypointName}.css$`))) {
						entryPointPath = compilationAsset;
					}
				});

				if (
					entrypoint.origins[0].request.match(/\.css$/) &&
					entryPointPath &&
					compilationAssetMatch
				) {
					const source = compilation.assets[compilationAssetMatch].source();

					delete compilation.assets[compilationAssetMatch];

					compilation.assets[entryPointPath.replace('.css', '.asset.php')] =
						new RawSource(source.replace(/('|")wp-polyfill('|")[\s]*,?/, ''));
				}
			}
		});
	}
}

module.exports = CleanExtractedDeps;
