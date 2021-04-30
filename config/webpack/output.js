const path = require('path');

module.exports = ({
	isPackage,
	projectConfig: { filenames },
	packageConfig: { main, libraryName, packageType },
	buildFiles,
}) => {
	if (isPackage) {
		return { filename: main, library: { name: libraryName, type: packageType } };
	}

	return {
		path: path.resolve(process.cwd(), 'dist'),
		filename: (pathData) => {
			return buildFiles[pathData.chunk.name].match(/\/blocks\//)
				? filenames.block
				: filenames.js;
		},
	};
};
