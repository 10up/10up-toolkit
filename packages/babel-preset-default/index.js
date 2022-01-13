const { declare } = require('@babel/helper-plugin-utils');

const defaultTargets = [
	'> 1%',
	'Firefox ESR',
	'last 2 versions',
	'not ie <= 11',
	'not ie_mob <=11',
];

module.exports = declare((api, options) => {
	const {
		modules = 'auto',
		wordpress = false,
		debug = false,
		removePropTypes = {},
		targets = defaultTargets,
		useBuiltIns = 'usage',
	} = options;

	const hasJsxRuntime = (() => {
		try {
			require.resolve('react/jsx-runtime.js');
			return true;
		} catch (e) {
			return false;
		}
	})();

	const development =
		typeof options.development === 'boolean' ? options.development : api.env(['development']);

	const presets = [];

	presets.push([
		require.resolve('@babel/preset-env'),
		{
			debug,
			useBuiltIns,
			corejs: useBuiltIns ? { version: 3, proposals: true } : undefined,
			bugfixes: true,
			modules,
			targets,
		},
	]);

	presets.push([
		require.resolve('@babel/preset-typescript'),
		{ isTSX: true, allExtensions: true },
	]);

	presets.push([
		require.resolve('@babel/preset-react'),
		{ development, runtime: hasJsxRuntime && !wordpress ? 'automatic' : 'classic' },
	]);

	const plugins = [];

	if (!development) {
		plugins.push([
			require.resolve('babel-plugin-transform-react-remove-prop-types'),
			{
				mode: 'remove',
				removeImport: true,
				...removePropTypes,
			},
		]);
	}

	if (wordpress) {
		plugins.push([
			require.resolve('@wordpress/babel-plugin-import-jsx-pragma'),
			{
				scopeVariable: 'createElement',
				scopeVariableFrag: 'Fragment',
				source: '@wordpress/element',
				isDefault: false,
			},
		]);

		plugins.push([
			require.resolve('@babel/plugin-transform-react-jsx'),
			{
				pragma: 'createElement',
				pragmaFrag: 'Fragment',
			},
		]);
	}

	return {
		presets,
		plugins,
	};
});
