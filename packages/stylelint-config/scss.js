module.exports = {
	extends: ['./index.js'],
	rules: {
		'scss/at-rule-no-unknown': [true, { ignoreAtRules: ['mixin', 'define-mixin'] }],
	},
};
