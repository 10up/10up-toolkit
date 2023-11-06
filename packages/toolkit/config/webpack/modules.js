const MiniCSSExtractPlugin = require('mini-css-extract-plugin');

const { hasBabelConfig, hasPostCSSConfig, fromConfigRoot } = require('../../utils');
const { isPackageInstalled } = require('../../utils/package');

const getCSSLoaders = ({ options, postcss, sass }) => {
	// Note that the order of loaders is important. The loaders are applied from right to left.
	// This goes as Sass -> PostCSS -> CSS -> MiniCSSExtractPlugin
	return [
		{
			loader: MiniCSSExtractPlugin.loader,
		},
		{
			loader: require.resolve('css-loader'),
			options,
		},
		postcss && {
			loader: require.resolve('postcss-loader'),
			options: {
				postcssOptions: {
					// Provide a fallback configuration if there's not
					// one explicitly available in the project.
					...(!hasPostCSSConfig() && {
						config: fromConfigRoot('postcss.config.js'),
					}),
				},
			},
		},
		sass && {
			loader: require.resolve('sass-loader'),
			options: {
				sourceMap: options ? options.sourceMap : false,
			},
		},
	].filter(Boolean);
};

function shouldExclude(input, include) {
	let shouldInclude = false;

	include.forEach((includedInput) => {
		if (input.includes(includedInput) || input.includes(includedInput.replace(/\//g, '\\'))) {
			shouldInclude = true;
		}
	});

	// don't exclude if should include
	if (shouldInclude) {
		return false;
	}

	// exclude anything else that includes node_modules
	return /node_modules/.test(input);
}

const LINARIA_EXTENSION = '.linaria.module.css';
const LINARIA_EXTENSION_REGEXP = /\.linaria\.module\.css/;

module.exports = ({
	isProduction,
	isPackage,
	defaultTargets,
	projectConfig: { wordpress, hot, include },
}) => {
	const hasReactFastRefresh = hot && !isProduction;

	// Provide a default configuration if there's not
	// one explicitly available in the project.
	const babelConfig = !hasBabelConfig()
		? {
				babelrc: false,
				configFile: false,
				sourceType: 'unambiguous',
				plugins: [hasReactFastRefresh && require.resolve('react-refresh/babel')].filter(
					Boolean,
				),
				presets: [
					[
						require.resolve('@10up/babel-preset-default'),
						{
							wordpress,
							useBuiltIns: isPackage ? false : 'usage',
							targets: defaultTargets,
						},
					],
				],
		  }
		: {};

	if (isPackageInstalled('@linaria/babel-preset') && !hasBabelConfig()) {
		babelConfig.presets.push([
			'@linaria',
			{
				babelOptions: {
					babelrc: false,
					configFile: false,
					sourceType: 'unambiguous',
					presets: [...babelConfig.presets],
				},
			},
		]);
	}

	return {
		rules: [
			{
				// Match all js/jsx/ts/tsx files except TS definition files
				test: /^(?!.*\.d\.tsx?$).*\.[tj]sx?$/,
				exclude: (input) => shouldExclude(input, include),
				use: [
					{
						loader: require.resolve('./plugins/noop-loader'),
					},
					{
						loader: require.resolve('babel-loader'),
						options: {
							// Babel uses a directory within local node_modules
							// by default. Use the environment variable option
							// to enable more persistent caching.
							cacheDirectory: process.env.BABEL_CACHE_DIRECTORY || true,
							...babelConfig,
						},
					},
					isPackageInstalled('@linaria/webpack-loader') && {
						loader: '@linaria/webpack-loader',
						options: {
							sourceMap: process.env.NODE_ENV !== 'production',
							extension: LINARIA_EXTENSION,
							// Fix $RefreshReg$ is not defined errors with linaria and react-fast-refresh
							// another option is to disable react fast refresh in babel preset via api.caller
							// @see https://github.com/callstack/linaria/issues/1308#issuecomment-1732385974
							overrideContext: (context) => ({ ...context, $RefreshReg$: () => {} }),
							babelOptions: babelConfig,
						},
					},
				].filter(Boolean),
			},
			{
				test: /\.svg$/,
				use: ['@svgr/webpack', 'url-loader'],
			},
			{
				test: /\.css$/,
				use: getCSSLoaders({
					options: {
						sourceMap: !isProduction,
						url: isPackage,
					},
					postcss: true,
					sass: false,
				}),
				exclude: [/\.module\.css$/, LINARIA_EXTENSION_REGEXP],
			},
			{
				test: /\.(sc|sa)ss$/,
				use: [
					...getCSSLoaders({
						options: {
							sourceMap: !isProduction,
							url: isPackage,
						},
						postcss: true,
						sass: true,
					}),
				],
				exclude: [/\.module\.css$/, LINARIA_EXTENSION_REGEXP],
			},
			{
				test: /\.module\.css$/,
				use: [
					...getCSSLoaders({
						options: {
							sourceMap: !isProduction,
							url: isPackage,
							import: false,
							modules: true,
						},
						postcss: true,
						sass: true,
					}),
				],
				exclude: [/\.linaria\.module\.css$/],
			},
			{
				test: LINARIA_EXTENSION_REGEXP,
				use: [
					{ loader: MiniCSSExtractPlugin.loader },
					{
						loader: 'css-loader',
					},
				],
			},
			// when in package module only include referenced resources
			isPackage && {
				test: /\.(woff(2)?|ttf|eot|svg|jpg|jpeg|png|giff|webp)(\?v=\d+\.\d+\.\d+)?$/,
				type: 'asset/resource',
			},
		].filter(Boolean),
	};
};
