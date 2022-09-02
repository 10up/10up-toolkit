module.exports = {
	parser: '@babel/eslint-parser',
	parserOptions: {
		requireConfigFile: false,
		babelOptions: {
			rootMode: 'upward-optional',
			configFile: require.resolve('../babel.config.js'),
		},
	},
	env: {
		browser: true,
		es6: true,
	},
	plugins: ['jsdoc', 'prettier'],
	extends: [
		'airbnb-base',
		require.resolve('../rules/whitespace'),
		require.resolve('../rules/prettier'),
		require.resolve('../rules/jsdoc'),
		require.resolve('../rules/general'),
		'prettier',
		'plugin:prettier/recommended',
	],
	settings: {
		'import/resolver': {
			node: {
				extensions: ['.js', '.jsx', '.ts', '.tsx'],
			},
		},
		'import/extensions': ['.js', '.mjs', '.jsx', '.ts', '.tsx'],
	},
	rules: {
		'class-methods-use-this': 0,
		'no-restricted-syntax': [
			'error',
			{
				selector: 'ForInStatement',
				message:
					'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
			},
			{
				selector: 'LabeledStatement',
				message:
					'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
			},
			{
				selector: 'WithStatement',
				message:
					'`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
			},
		],
		// Disable prefer-destructing for arrays as it can lead to weird and confusing syntax
		'prefer-destructuring': [2, { array: false, object: true }],
		// this rule is good but annoying
		'import/prefer-default-export': 0,
		// an import is valid as long as it's a dependency somewhere,
		// it's up to developer make sure dev dependencies aren't used in the production bundle
		'import/no-extraneous-dependencies': [
			'error',
			{ devDependencies: true, optionalDependencies: true, peerDependencies: true },
		],
	},
	overrides: [
		{
			parser: '@typescript-eslint/parser',
			plugins: ['@typescript-eslint'],
			files: ['*.ts', '*.tsx'],
			rules: {
				// not needed for typescript
				'no-undef': 0,
				// we need to use the no-unused-vars rule from ts.
				'no-unused-vars': 0,
				'@typescript-eslint/no-unused-vars': 2,
				'no-use-before-define': 0,
				'@typescript-eslint/no-use-before-define': 2,
				'import/extensions': [
					'error',
					'ignorePackages',
					{
						js: 'never',
						mjs: 'never',
						jsx: 'never',
						ts: 'never',
						tsx: 'never',
					},
				],
				'jsdoc/require-param-type': 0,
				'no-restricted-globals': 0,
			},
		},
	],
};
