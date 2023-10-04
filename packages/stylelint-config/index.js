module.exports = {
	extends: ['stylelint-config-recommended'],
	plugins: ['stylelint-stylistic', 'stylelint-declaration-strict-value', 'stylelint-order'],
	rules: {
		'at-rule-empty-line-before': [
			'always',
			{
				except: ['blockless-after-blockless'],
				ignore: ['after-comment'],
			},
		],
		'at-rule-no-unknown': [
			true,
			{
				ignoreAtRules: ['mixin', 'define-mixin'],
			},
		],
		'color-hex-length': 'short',
		'color-named': 'never',
		'comment-empty-line-before': [
			'always',
			{
				ignore: ['stylelint-commands'],
			},
		],
		'custom-property-pattern': [
			'^([a-z][a-z0-9]*)(-[a-z0-9]+)*$|^wp--([a-z][a-z0-9]*)(--[a-z0-9]+)*$',
			{
				message: 'Expected custom property name to be kebab-case or wp--kebab--case',
			},
		],
		'declaration-block-no-duplicate-properties': [
			true,
			{
				ignore: ['consecutive-duplicates'],
			},
		],
		'declaration-property-unit-allowed-list': {
			'line-height': ['px'],
		},
		'font-family-name-quotes': 'always-where-recommended',
		'font-weight-notation': [
			'numeric',
			{
				ignore: ['relative'],
			},
		],
		'function-name-case': [
			'lower',
			{
				ignoreFunctions: ['/^DXImageTransform.Microsoft.*$/'],
			},
		],
		'function-url-quotes': 'always',
		'length-zero-no-unit': true,
		'no-descending-specificity': null,
		'number-max-precision': 4,
		'order/properties-alphabetical-order': true,
		'rule-empty-line-before': [
			'always',
			{
				ignore: ['after-comment'],
			},
		],
		'scale-unlimited/declaration-strict-value': [
			'/color/',
			{
				ignoreValues: ['currentcolor', 'inherit', 'initial', 'transparent', 'unset'],
			},
		],
		'selector-attribute-quotes': 'always',
		'selector-class-pattern': null,
		'selector-id-pattern': [
			'^([a-z][a-z0-9]*)(-[a-z0-9]+)*$',
			{
				message:
					'Selector should use lowercase and separate words with hyphens (selector-id-pattern)',
			},
		],
		'selector-nested-pattern': ['^&'],
		'selector-pseudo-element-colon-notation': 'double',
		'selector-type-case': 'lower',
		'stylistic/at-rule-name-case': 'lower',
		'stylistic/at-rule-name-space-after': 'always-single-line',
		'stylistic/at-rule-semicolon-newline-after': 'always',
		'stylistic/block-closing-brace-newline-after': 'always',
		'stylistic/block-closing-brace-newline-before': 'always',
		'stylistic/block-opening-brace-newline-after': 'always',
		'stylistic/block-opening-brace-space-before': 'always',
		'stylistic/color-hex-case': 'lower',
		'stylistic/declaration-bang-space-after': 'never',
		'stylistic/declaration-bang-space-before': 'always',
		'stylistic/declaration-block-semicolon-newline-after': 'always',
		'stylistic/declaration-block-semicolon-space-before': 'never',
		'stylistic/declaration-block-trailing-semicolon': 'always',
		'stylistic/declaration-colon-newline-after': 'always-multi-line',
		'stylistic/declaration-colon-space-after': 'always-single-line',
		'stylistic/declaration-colon-space-before': 'never',
		'stylistic/function-comma-space-after': 'always',
		'stylistic/function-comma-space-before': 'never',
		'stylistic/function-max-empty-lines': 1,
		'stylistic/function-parentheses-space-inside': 'never',
		'stylistic/function-whitespace-after': 'always',
		'stylistic/indentation': 'tab',
		'stylistic/max-empty-lines': 2,
		'stylistic/max-line-length': [
			80,
			{
				ignore: 'non-comments',
				ignorePattern: ['/(https?://[0-9,a-z]*.*)|(^description\\:.+)|(^tags\\:.+)/i'],
			},
		],
		'stylistic/media-feature-colon-space-after': 'always',
		'stylistic/media-feature-colon-space-before': 'never',
		'stylistic/media-feature-range-operator-space-after': 'always',
		'stylistic/media-feature-range-operator-space-before': 'always',
		'stylistic/media-query-list-comma-newline-after': 'always-multi-line',
		'stylistic/media-query-list-comma-space-after': 'always-single-line',
		'stylistic/media-query-list-comma-space-before': 'never',
		'stylistic/no-missing-end-of-source-newline': true,
		'stylistic/number-leading-zero': 'always',
		'stylistic/number-no-trailing-zeros': true,
		'stylistic/property-case': 'lower',
		'stylistic/selector-attribute-brackets-space-inside': 'never',
		'stylistic/selector-attribute-operator-space-after': 'never',
		'stylistic/selector-attribute-operator-space-before': 'never',
		'stylistic/selector-combinator-space-after': 'always',
		'stylistic/selector-combinator-space-before': 'always',
		'stylistic/selector-list-comma-newline-after': 'always',
		'stylistic/selector-list-comma-space-before': 'never',
		'stylistic/selector-max-empty-lines': 0,
		'stylistic/selector-pseudo-class-case': 'lower',
		'stylistic/selector-pseudo-class-parentheses-space-inside': 'never',
		'stylistic/selector-pseudo-element-case': 'lower',
		'stylistic/string-quotes': 'double',
		'stylistic/unit-case': 'lower',
		'stylistic/value-list-comma-newline-after': 'always-multi-line',
		'stylistic/value-list-comma-space-after': 'always-single-line',
		'stylistic/value-list-comma-space-before': 'never',
		'value-keyword-case': [
			'lower',
			{
				camelCaseSvgKeywords: true,
				ignoreKeywords: ['currentcolor'],
			},
		],
	},
};
