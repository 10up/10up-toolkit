module.exports = ({ defaultTargets, isModule, packageConfig: { target, packageType } }) => {
	if (target) {
		return target;
	}

	if (packageType === 'module' || isModule) {
		return 'es2020';
	}

	return `browserslist:${defaultTargets.join(', ')}`;
};
