const removeDistFolder = (file) => {
	return file.replace(/(^\.\/dist\/)|^dist\//, '');
};
module.exports = ({ isPackage, packageConfig: { source, main, umd, libraryName }, buildFiles }) => {
	if (isPackage) {
		const config = {
			main: {
				import: `./${source}`,
				filename: removeDistFolder(main),
				library: {
					type: 'commonjs2',
				},
			},
		};

		if (umd) {
			config.umd = {
				filename: removeDistFolder(umd),
				import: `./${source}`,
				library: { name: libraryName, type: 'umd' },
			};
		}

		return config;
	}

	return buildFiles;
};
