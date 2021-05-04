const { getArgFromCLI } = require('../../utils');

module.exports = ({ isPackage, packageConfig: { externals } }) => {
	if (isPackage) {
		const externalsObject = externals.reduce((acc, current) => {
			acc[current] = current;
			return acc;
		}, {});

		const externalOption = getArgFromCLI('--external');

		if (externalOption === 'none') {
			return externalsObject;
		}

		return [externalsObject, /^core-js/];
	}

	return {
		jquery: 'jQuery',
		lodash: 'lodash',
	};
};
