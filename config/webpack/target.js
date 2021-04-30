module.exports = ({ defaultTargets }) => {
	return `browserslist:${defaultTargets.join(', ')}`;
};
