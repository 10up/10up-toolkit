const path = require('path');
const fs = require('fs');

class MergeMultiThemeDotJSON {
	static defaultOptions = {
		currentTheme: 'default',
		outputFilename: '../theme.json',
		themes: {},
		minify: false,
	};

	constructor(options = {}) {
		this.options = { ...MergeMultiThemeDotJSON.defaultOptions, ...options };
	}

	apply(compiler) {
		const pluginName = MergeMultiThemeDotJSON.name;
		const { webpack } = compiler;
		const { RawSource } = webpack.sources;

		compiler.hooks.thisCompilation.tap(pluginName, (compilation, callback) => {
			// Return early if user has not defined themes.
			if (!this.options.themes || Object.values(this.options.themes).length === 0) {
				callback();
			}

			// Return early if the current theme is not defined.
			if (!this.options.themes[this.options.currentTheme]) {
				callback();
			}

			// Merge the current theme's json files.
			const themeJson = Object.assign(
				{},
				...this.options.themes[this.options.currentTheme].map((file) =>
					JSON.parse(
						fs.readFileSync(path.resolve(file), { encoding: 'utf-8', flag: 'r' }),
					),
				),
			);

			// Emit the current themes merged json as theme.json.
			compilation.emitAsset(
				this.options.outputFilename,
				new RawSource(JSON.stringify(themeJson, null, this.options.minify ? null : 2)),
			);
		});

		compiler.hooks.afterCompile.tap(pluginName, (compilation, callback) => {
			// Return early if user has not defined themes.
			if (!this.options.themes || Object.values(this.options.themes).length === 0) {
				callback();
			}

			// Return early if the current theme is not defined.
			if (!this.options.themes[this.options.currentTheme]) {
				callback();
			}

			// Add the source files as a file dependency so --watch works.
			this.options.themes[this.options.currentTheme].forEach((file) => {
				compilation.fileDependencies.add(path.resolve(file));
			});
		});
	}
}

module.exports = MergeMultiThemeDotJSON;
