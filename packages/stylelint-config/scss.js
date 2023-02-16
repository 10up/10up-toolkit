module.exports = {
	extends: ['stylelint-config-standard-scss', './index.js'],
	rules: {
		'at-rule-no-unknown': null,
		'scss/at-rule-no-unknown': [true, { ignoreAtRules: ['mixin', 'define-mixin'] }],
	},
};
