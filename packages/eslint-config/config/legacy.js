module.exports = {
	parserOptions: {
		requireConfigFile: false,
	},
	extends: [
		'airbnb-base/legacy',
		require.resolve('../rules/general'),
		require.resolve('../rules/whitespace'),
		require.resolve('../rules/prettier'),
		'prettier',
		'plugin:prettier/recommended',
	],
	globals: {
		window: true,
		document: true,
		wp: 'readonly',
		lodash: true,
		jQuery: true,
	},
	rules: {
		strict: 0,
		'func-names': 0,
	},
};
