module.exports = ({ defaultTargets }) => {
	return 'node';
	return `browserslist:${defaultTargets.join(', ')}`;
};
