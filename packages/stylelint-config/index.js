module.exports = {
	extends: '@wordpress/stylelint-config',
	plugins: ['stylelint-declaration-use-variable', 'stylelint-order'],
	rules: {
		'sh-waqar/declaration-use-variable': [
			['/color/', { ignoreValues: ['transparent', 'inherit', 'currentColor'] }],
		],
		'order/properties-alphabetical-order': true,
		'function-url-quotes': 'always',
		'selector-class-pattern': null,
		'no-eol-whitespace': null,
		'selector-nested-pattern': ['^&'],
		'no-descending-specificity': null,
		'at-rule-no-unknown': [true, { ignoreAtRules: ['mixin', 'define-mixin'] }],
	},
};
