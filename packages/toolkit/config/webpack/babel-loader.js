const { getBuildFiles } = require('../../utils');

module.exports = require('babel-loader').custom(() => {
	return {
		customOptions({ ...loader }) {
			const buildFilesByFileName = getBuildFiles({
				srcOnly: false,
				filenameAsKey: true,
			});

			const entryFile = buildFilesByFileName[this.resourcePath];
			console.log(this);
			// disable wp optimizations for this entry point
			if (entryFile?.wp === false) {
				console.log('disabling wp for', this.resourcePath);
				loader.presets[0][1].wordpress = false;
			}
			return {
				// Pass the options back with the two custom options removed.
				loader,
			};
		},
	};
});
