module.exports = {
	extends: [
		require.resolve('./packages/eslint-config/react'),
		require.resolve('./packages/eslint-config/jest'),
	],
	rules: {
		'import/no-dynamic-require': [0],
		'global-require': [0],
	},
	globals: {
		module: true,
		process: true,
	},
};
