const rspack = require('@rspack/core');

const { hasPostCSSConfig, fromConfigRoot } = require('../../utils');

const getCSSLoaders = ({ options, postcss, sass }) => {
	// Note that the order of loaders is important. The loaders are applied from right to left.
	// This goes as Sass -> PostCSS -> CSS -> CssExtractRspackPlugin
	return [
		{
			loader: rspack.CssExtractRspackPlugin.loader,
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

/**
 * Build the SWC configuration that replaces @10up/babel-preset-default.
 *
 * Replicates:
 *   - @babel/preset-env        → SWC env targets
 *   - @babel/preset-react      → SWC JSX transform (automatic or classic/WordPress)
 *   - @babel/preset-typescript → SWC TypeScript support (tsx: true)
 *   - core-js polyfill injection (mode: 'usage')
 *   - WordPress pragma mode    → classic JSX with @wordpress/element imports
 *   - react-refresh/babel      → SWC react refresh transform
 */
function getSwcConfig({ isPackage, isProduction, wordpress, hot, isModule, defaultTargets }) {
	const hasReactFastRefresh = hot && !isProduction && !isModule;

	// Determine JSX runtime mode
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
		// Production: remove prop-types (mirrors babel-plugin-transform-react-remove-prop-types)
		...(isProduction && {
			minify: {
				compress: false,
				mangle: false,
			},
		}),
		externalHelpers: false,
	};

	const env = {
		targets: defaultTargets.join(', '),
		// core-js polyfill injection — mirrors useBuiltIns: 'usage' from babel preset
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

module.exports = ({
	isProduction,
	isPackage,
	isModule,
	defaultTargets,
	projectConfig: { wordpress, hot, include },
}) => {
	const hasReactFastRefresh = hot && !isProduction && !isModule;

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
							rspackExperiments: {
								import: [],
							},
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
				exclude: [/\.module\.css$/],
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
				exclude: [/\.module\.css$/],
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
			},
			// when in package module only include referenced resources
			isPackage && {
				test: /\.(woff(2)?|ttf|eot|svg|jpg|jpeg|png|giff|webp)(\?v=\d+\.\d+\.\d+)?$/,
				type: 'asset/resource',
			},
		].filter(Boolean),
	};
};
