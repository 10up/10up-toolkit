module.exports = ({ isPackage, packageConfig: { source }, buildFiles }) => {
	if (isPackage) {
		return source;
	}

	return buildFiles;
};
