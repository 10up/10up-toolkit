module.exports = {
	extends: ['@wordpress/stylelint-config'],
	plugins: ['stylelint-declaration-strict-value', 'stylelint-order'],
	rules: {
		'scale-unlimited/declaration-strict-value': [
			'/color/',
			{ ignoreValues: ['currentcolor', 'inherit', 'initial', 'transparent', 'unset'] },
		],
		'order/properties-alphabetical-order': true,
		'function-url-quotes': 'always',
		'selector-class-pattern': null,
		'no-eol-whitespace': null,
		'selector-nested-pattern': ['^&'],
		'no-descending-specificity': null,
		'at-rule-no-unknown': [true, { ignoreAtRules: ['mixin', 'define-mixin'] }],
		'custom-property-pattern': [
			'^([a-z][a-z0-9]*)(-[a-z0-9]+)*$|^wp--([a-z][a-z0-9]*)(--[a-z0-9]+)*$',
			{
				message: 'Expected custom property name to be kebab-case or wp--kebab--case',
			},
		],
	},
};
