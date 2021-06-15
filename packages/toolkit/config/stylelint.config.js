const config = {
	extends: ['@10up/stylelint-config'],
	rules: {
		'at-rule-no-unknown': [
			true,
			{
				ignoreAtRules: ['mixin', 'define-mixin'],
			},
		],
	},
};

module.exports = config;
