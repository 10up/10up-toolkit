module.exports = {
	rules: {
		'jsdoc/check-alignment': 1,
		'jsdoc/check-examples': 0,
		'jsdoc/check-indentation': 1,
		'jsdoc/check-param-names': 1,
		'jsdoc/check-tag-names': 1,
		'jsdoc/check-types': 1,
		'jsdoc/newline-after-description': 1,
		'jsdoc/no-undefined-types': 1,
		'jsdoc/require-description': 1,
		'jsdoc/require-jsdoc': [
			0,
			{
				publicOnly: true,
				exemptEmptyFunctions: true,
			},
		], // disabling for now because eslint --fix is adding empty jsdoc blocks.
		'jsdoc/require-param': [1, { enableFixer: false }],
		'jsdoc/require-param-description': 1,
		'jsdoc/require-param-name': 1,
		'jsdoc/require-param-type': 1,
		'jsdoc/require-returns': 1,
		'jsdoc/require-returns-check': 1,
		'jsdoc/require-returns-type': 1,
		'jsdoc/valid-types': 1,
	},
};
