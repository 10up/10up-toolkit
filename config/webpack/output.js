const path = require('path');

module.exports = ({ isPackage, projectConfig: { filenames }, buildFiles }) => {
	if (isPackage) {
		return {
			path: path.resolve(process.cwd(), 'dist'),
			clean: true,
		};
	}

	return {
		clean: true,
		path: path.resolve(process.cwd(), 'dist'),
		filename: (pathData) => {
			return buildFiles[pathData.chunk.name].match(/\/blocks\//)
				? filenames.block
				: filenames.js;
		},
	};
};
