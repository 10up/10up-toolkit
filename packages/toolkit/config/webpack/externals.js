module.exports = ({ isPackage, packageConfig: { externals, packageType } }) => {
	if (isPackage) {
		return externals.reduce((acc, current) => {
			if (packageType === 'umd') {
				acc[current] = { commonjs: current, commonjs2: current, amd: current };
			} else {
				acc[current] = `commonjs2 ${current}`;
			}

			return acc;
		}, {});
	}

	return {
		jquery: 'jQuery',
		lodash: 'lodash',
	};
};
