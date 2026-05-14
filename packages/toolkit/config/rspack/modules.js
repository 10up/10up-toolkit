const { hasPostCSSConfig, fromConfigRoot } = require('../../utils');

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

/**
 * Build the SWC configuration that replaces @10up/babel-preset-default.
 *
 * Replicates:
 *   - @babel/preset-env        → SWC env targets
 *   - @babel/preset-react      → SWC JSX transform (automatic or classic/WordPress)
 *   - @babel/preset-typescript → SWC TypeScript support (tsx: true)
 *   - core-js polyfill injection (mode: 'usage')
 *   - WordPress pragma mode    → classic JSX with @wordpress/element imports
 */
function getSwcConfig({ isPackage, isProduction, wordpress, defaultTargets }) {
	// WordPress mode uses classic runtime with @wordpress/element pragma
	// Non-WordPress uses the automatic runtime (React 17+)
	const useWordPressPragma = wordpress;

	const jsc = {
		parser: {
			syntax: 'typescript',
			tsx: true,
			decorators: false,
			dynamicImport: true,
		},
		transform: {
			react: useWordPressPragma
				? {
						runtime: 'classic',
						pragma: 'createElement',
						pragmaFrag: 'Fragment',
						development: !isProduction,
					}
				: {
						runtime: 'automatic',
						development: !isProduction,
					},
		},
		externalHelpers: false,
	};

	const env = {
		targets: defaultTargets.join(', '),
		// core-js polyfill injection — mirrors useBuiltIns: 'usage' from the old babel preset
		...(isPackage
			? {}
			: {
					mode: 'usage',
					coreJs: '3',
				}),
	};

	return {
		jsc,
		env,
		isModule: 'unknown',
		sourceMaps: !isProduction,
	};
}

/**
 * Returns PostCSS loader config, or false if postcss should be skipped.
 */
function getPostCSSLoader() {
	return {
		loader: require.resolve('postcss-loader'),
		options: {
			postcssOptions: {
				...(!hasPostCSSConfig() && {
					config: fromConfigRoot('postcss.config.js'),
				}),
			},
		},
	};
}

module.exports = ({
	isProduction,
	isPackage,
	isModule,
	defaultTargets,
	projectConfig: { wordpress, hot, include },
}) => {
	const swcConfig = getSwcConfig({
		isPackage,
		isProduction,
		wordpress,
		hot,
		isModule,
		defaultTargets,
	});

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
						loader: 'builtin:swc-loader',
						options: {
							...swcConfig,
						},
					},
				].filter(Boolean),
			},
			{
				test: /\.svg$/,
				use: ['@svgr/webpack'],
				type: 'asset/inline',
			},
			// Native CSS — rspack handles parsing, url resolution, and extraction
			{
				test: /\.css$/,
				use: [getPostCSSLoader()],
				type: 'css',
				exclude: [/\.module\.css$/],
			},
			{
				test: /\.(sc|sa)ss$/,
				use: [
					getPostCSSLoader(),
					{
						loader: require.resolve('sass-loader'),
						options: {
							sourceMap: !isProduction,
						},
					},
				],
				type: 'css',
				exclude: [/\.module\.(sc|sa)ss$/],
			},
			// CSS Modules — native rspack support
			{
				test: /\.module\.css$/,
				use: [getPostCSSLoader()],
				type: 'css/module',
			},
			{
				test: /\.module\.(sc|sa)ss$/,
				use: [
					getPostCSSLoader(),
					{
						loader: require.resolve('sass-loader'),
						options: {
							sourceMap: !isProduction,
						},
					},
				],
				type: 'css/module',
			},
			// when in package mode only include referenced resources
			isPackage && {
				test: /\.(woff(2)?|ttf|eot|svg|jpg|jpeg|png|giff|webp)(\?v=\d+\.\d+\.\d+)?$/,
				type: 'asset/resource',
			},
		].filter(Boolean),
	};
};
