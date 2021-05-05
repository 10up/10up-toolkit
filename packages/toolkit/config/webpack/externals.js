module.exports = ({ isPackage, packageConfig: { externals } }) => {
	if (isPackage) {
		return externals.reduce((acc, current) => {
			acc[current] = current;
			return acc;
		}, {});
	}

	return {
		jquery: 'jQuery',
		lodash: 'lodash',
	};
};
