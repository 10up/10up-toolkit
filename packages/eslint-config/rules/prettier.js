module.exports = {
	rules: {
		'prettier/prettier': [
			2,
			{
				useTabs: true,
				tabWidth: 4,
				printWidth: 100,
				singleQuote: true,
				trailingComma: 'all',
				bracketSpacing: true,
				parenSpacing: false,
				bracketSameLine: false,
				semi: true,
				arrowParens: 'always',
			},
			{
				usePrettierrc: false,
			},
		],
	},
};
