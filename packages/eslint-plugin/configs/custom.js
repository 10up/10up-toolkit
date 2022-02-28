module.exports = {
	plugins: ['@10up'],
	rules: {
		'@10up/no-unused-vars-before-return': 'error',
		'@10up/no-base-control-with-label-without-id': 'error',
		'@10up/no-unguarded-get-range-at': 'error',
		'@10up/no-global-active-element': 'error',
		'@10up/no-global-get-selection': 'error',
		'@10up/no-unsafe-wp-apis': 'error',
	},
	overrides: [
		{
			files: ['*.native.js'],
			rules: {
				'@10up/no-base-control-with-label-without-id': 'off',
				'@10up/i18n-no-flanking-whitespace': 'error',
				'@10up/i18n-hyphenated-range': 'error',
			},
		},
		{
			files: ['*.test.js', '**/test/*.js', 'packages/e2e-test-utils/**/*.js'],
			rules: {
				'@10up/no-global-active-element': 'off',
				'@10up/no-global-get-selection': 'off',
			},
		},
	],
};
