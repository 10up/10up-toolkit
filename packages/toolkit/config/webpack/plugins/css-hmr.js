const { RawSource } = require('webpack-sources');
const RuleSetCompiler = require('webpack/lib/rules/RuleSetCompiler');

class CSSHotModuleReplacementPlugin {
	apply(compiler) {
		compiler.hooks.emit.tapAsync('CSSHotModuleReplacementPlugin', (compilation, callback) => {
			const cssEntryPoints = [];

			// Loop through all the assets in the compilation
			for (const [assetName, asset] of Object.entries(compilation.assets)) {
				// Check if the asset is a CSS file
				// TODO exclude linaria assets
				if (assetName.endsWith('.css')) {
					// Store the CSS asset name (entry point) in the array
					cssEntryPoints.push(assetName);
				}
			}

			const fileName = 'css-hmr.js';

			const jsCode =
				`// This file is automatically generated by the CSSHotModuleReplacementPlugin.
                ${cssEntryPoints.map((entryPoint) => `import './${entryPoint}';`).join('\n')}
            `.trim();

			// Create a new entry point for the JavaScript code
			compilation.entrypoints.set('css-hmr', {
				name: 'css-hmr',
				chunks: ['css-hmr'],
				getFiles: () => [fileName],
			});

			// Create a new asset for the JavaScript entry point
			compilation.emitAsset(fileName, new RawSource(jsCode));

			callback();
		});
	}
}

module.exports = CSSHotModuleReplacementPlugin;
