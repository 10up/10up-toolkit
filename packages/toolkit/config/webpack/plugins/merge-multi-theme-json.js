const path = require('path');

class MergeMultiThemeDotJSON {
	static defaultOptions = {
		currentTheme: 'default',
		outputFilename: '../theme.json',
	};

	constructor(options = {}) {
		this.options = { ...MergeMultiThemeDotJSON.defaultOptions, ...options };
	}

	apply(compiler) {
		const pluginName = MergeMultiThemeDotJSON.name;
		const { webpack } = compiler;
		const { Compilation } = webpack;
		const { RawSource } = webpack.sources;
		compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
			compilation.hooks.processAssets.tap(
				{
					name: pluginName,
					stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
				},
				() => {
					// Return early if user has not defined themes.
					if (!this.options.themes || Object.values(this.options.themes).length === 0) {
						return;
					}

					// Return early if the current theme is not defined.
					if (!this.options.themes[this.options.currentTheme]) {
						return;
					}

					// Merge the current theme's json files.
					const themeJson = Object.assign(
						{},
						...this.options.themes[this.options.currentTheme].map(
							(file) => require(path.resolve(file)), // eslint-disable-line import/no-dynamic-require,global-require
						),
					);

					// Emit the current themes merged json as theme.json.
					compilation.emitAsset(
						this.options.outputFilename,
						new RawSource(JSON.stringify(themeJson)),
					);
				},
			);
		});
	}
}

module.exports = MergeMultiThemeDotJSON;
