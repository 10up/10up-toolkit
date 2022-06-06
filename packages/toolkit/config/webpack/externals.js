module.exports = ({ isPackage, packageConfig: { externals, packageType } }) => {
	if (isPackage) {
		return externals.reduce((acc, current) => {
			if (packageType === 'umd') {
				acc[current] = { commonjs: current, commonjs2: current, amd: current };
			} else if (packageType === 'all') {
				acc[current] = `commonjs2 ${current}`;
			} else {
				acc[current] = `${packageType} ${current}`;
			}

			return acc;
		}, {});
	}

	return {
		jquery: 'jQuery',
		lodash: 'lodash',
	};
};
