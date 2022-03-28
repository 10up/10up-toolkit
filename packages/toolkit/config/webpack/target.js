module.exports = ({ defaultTargets, packageConfig: { target } }) => {
	if (target) {
		return target;
	}

	return `browserslist:${defaultTargets.join(', ')}`;
};
