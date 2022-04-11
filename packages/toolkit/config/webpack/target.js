module.exports = ({ defaultTargets, packageConfig: { target, packageType } }) => {
	if (target) {
		return target;
	}

	if (packageType === 'module') {
		return 'es2020';
	}

	return `browserslist:${defaultTargets.join(', ')}`;
};
