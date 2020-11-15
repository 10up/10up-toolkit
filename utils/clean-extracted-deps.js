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
				if (
					entrypoint.origins[0].request.match(/\.css$/) &&
					compilation.assets[`${entrypointName}.asset.php`]
				) {
					const source = compilation.assets[`${entrypointName}.asset.php`].source();

					compilation.assets[`${entrypointName}.asset.php`] = new RawSource(
						source.replace(/('|")wp-polyfill('|")[\s]*,?/, ''),
					);
				}
			}
		});
	}
}

module.exports = CleanExtractedDeps;
