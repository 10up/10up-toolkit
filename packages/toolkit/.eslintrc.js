module.exports = {
	extends: ['@10up/eslint-config/node', '@10up/eslint-config/jest'],
	rules: {
		'global-require': 'off',
		'import/no-dynamic-require': 'off',
		'no-process-exit': 'off',
		// Packages that only expose an `exports` map, which the resolver can't read.
		'import/no-unresolved': ['error', { ignore: ['^vite-plus', '^@10up/wp-vite-plugins'] }],
	},
};
