// Exclude bundled WordPress packages from the list.
const wpPackagesRegExp = '^@wordpress/(?!(icons|interface))';

const config = {
	extends: [require.resolve('./custom.js'), require.resolve('./i18n.js')],
	plugins: ['import'],
	env: {
		node: true,
	},
	globals: {
		window: true,
		document: true,
		wp: 'readonly',
	},
	settings: {
		'import/internal-regex': wpPackagesRegExp,
		'import/extensions': ['.js', '.jsx'],
	},
	rules: {
		'import/no-extraneous-dependencies': [
			'error',
			{
				peerDependencies: true,
			},
		],
		'import/no-unresolved': [
			'error',
			{
				ignore: [wpPackagesRegExp],
			},
		],
		'import/default': 'warn',
		'import/named': 'warn',
	},
};

module.exports = config;
