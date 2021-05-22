module.exports = ({ isPackage, packageConfig: { externals } }) => {
	if (isPackage) {
		return externals.reduce((acc, current) => {
			acc[current] = { commonjs: current, commonjs2: current, amd: current };
			return acc;
		}, {});
	}

	return {
		jquery: 'jQuery',
		lodash: 'lodash',
	};
};
