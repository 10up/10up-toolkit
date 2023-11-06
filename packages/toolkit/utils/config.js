/**
 * Internal dependencies
 */
const { existsSync: fileExists } = require('fs');
const path = require('path');
const camelcase = require('camelcase');
const { hasArgInCLI, getArgFromCLI } = require('./cli');
const { fromConfigRoot, fromProjectRoot, hasProjectFile } = require('./file');
const { hasPackageProp, getPackage } = require('./package');

// See https://babeljs.io/docs/en/config-files#configuration-file-types
const hasBabelConfig = () =>
	hasProjectFile('.babelrc.js') ||
	hasProjectFile('.babelrc.json') ||
	hasProjectFile('babel.config.js') ||
	hasProjectFile('babel.config.json') ||
	hasProjectFile('.babelrc') ||
	hasPackageProp('babel');

// See https://prettier.io/docs/en/configuration.html.
const hasPrettierConfig = () =>
	hasProjectFile('.prettierrc.js') ||
	hasProjectFile('.prettierrc.json') ||
	hasProjectFile('.prettierrc.toml') ||
	hasProjectFile('.prettierrc.yaml') ||
	hasProjectFile('.prettierrc.yml') ||
	hasProjectFile('prettier.config.js') ||
	hasProjectFile('.prettierrc') ||
	hasPackageProp('prettier');

const hasWebpackConfig = () =>
	hasArgInCLI('--config') ||
	hasProjectFile('webpack.config.js') ||
	hasProjectFile('webpack.config.babel.js');

// See https://github.com/michael-ciniawsky/postcss-load-config#usage (used by postcss-loader).
const hasPostCSSConfig = () =>
	hasProjectFile('postcss.config.js') ||
	hasProjectFile('.postcssrc') ||
	hasProjectFile('.postcssrc.json') ||
	hasProjectFile('.postcssrc.yaml') ||
	hasProjectFile('.postcssrc.yml') ||
	hasProjectFile('.postcssrc.js') ||
	hasPackageProp('postcss');

const hasStylelintConfig = () =>
	hasProjectFile('.stylelintrc.js') ||
	hasProjectFile('.stylelintrc.json') ||
	hasProjectFile('.stylelintrc.yaml') ||
	hasProjectFile('.stylelintrc.yml') ||
	hasProjectFile('stylelint.config.js') ||
	hasProjectFile('.stylelintrc') ||
	hasPackageProp('stylelint');

const hasEslintConfig = () =>
	hasProjectFile('.eslintrc.js') ||
	hasProjectFile('.eslintrc.json') ||
	hasProjectFile('.eslintrc.yaml') ||
	hasProjectFile('.eslintrc.yml') ||
	hasProjectFile('eslintrc.config.js') ||
	hasProjectFile('.eslintrc') ||
	hasPackageProp('eslintConfig');

const hasJestConfig = () =>
	hasProjectFile('jest.config.js') ||
	hasProjectFile('jest.config.json') ||
	hasPackageProp('jest');

const hasTsConfig = () => hasProjectFile('tsconfig.json');

/**
 * Returns path to a Jest configuration which should be provided as the explicit
 * configuration when there is none available for discovery by Jest in the
 * project environment. Returns undefined if Jest should be allowed to discover
 * an available configuration.
 *
 * This can be used in cases where multiple possible configurations are
 * supported. Since Jest will only discover `jest.config.js`, or `jest` package
 * directive, such custom configurations must be specified explicitly.
 *
 * @param {"e2e"|"unit"} suffix Suffix of configuration file to accept.
 *
 * @returns {string} Override or fallback configuration file path.
 */
function getJestOverrideConfigFile(suffix) {
	if (hasArgInCLI('-c') || hasArgInCLI('--config')) {
		return undefined;
	}

	if (hasProjectFile(`jest-${suffix}.config.js`)) {
		return fromProjectRoot(`jest-${suffix}.config.js`);
	}

	if (!hasJestConfig()) {
		return fromConfigRoot(`jest-${suffix}.config.js`);
	}

	return undefined;
}

const hasEslintignoreConfig = () => hasProjectFile('.eslintignore');

const getDefaultConfig = () => {
	const wpMode = getArgFromCLI('--wp');
	const hot = hasArgInCLI('--hot');
	// hot automatically enables dev server
	const devServer = hasArgInCLI('--dev-server') || hot;
	const devServerPort = Number(getArgFromCLI('--port')) || 8000;
	const analyze = hasArgInCLI('--analyze');
	const include = hasArgInCLI('--include') ? getArgFromCLI('--include').split(',') : [];

	return {
		entry: require(fromConfigRoot('buildfiles.config.js')),
		filenames: require(fromConfigRoot('filenames.config.js')),
		paths: require(fromConfigRoot('paths.config.js')),
		wordpress: wpMode !== 'false',
		devServer,
		devServerPort,
		analyze,
		hot,
		// true by default (if TENUP_NO_EXTERNALS is not set)
		// if TENUP_NO_EXTERNALS is truthy then dependencyExternals is false
		wpDependencyExternals:
			typeof process.env.TENUP_NO_EXTERNALS === 'undefined' ||
			!process.env.TENUP_NO_EXTERNALS,
		publicPath: process.env.ASSET_PATH || '/',
		useBlockAssets: true,
		include,
	};
};

/**
 * Returns 10up-scripts config from package.json with default values
 *
 * @returns {object}
 */
const getTenUpScriptsConfig = () => {
	const packageJson = getPackage();
	const config = packageJson['10up-toolkit'] || packageJson['@10up/scripts'];
	const defaultConfig = getDefaultConfig();

	if (!config) {
		return defaultConfig;
	}

	if (typeof config.include !== 'undefined') {
		if (!Array.isArray(config.include)) {
			throw new Error('config.include must be an array of strings');
		}
	}

	const configInclude = config.include ?? [];
	const include = defaultConfig.include.length === 0 ? configInclude : defaultConfig.include;
	const publicPath = process.env.ASSET_PATH || config.publicPath || defaultConfig.publicPath;

	return {
		// override default configs with user-defined config
		...defaultConfig,
		...config,
		include,
		publicPath,
		// these properties must be merged
		filenames: {
			...defaultConfig.filenames,
			...config.filenames,
		},
		paths: {
			...defaultConfig.paths,
			...config.paths,
		},
	};
};

const removeScope = (name) => name.replace(/^@.*\//, '');

const safeVariableName = (name) => {
	const INVALID_ES3_IDENT = /((^[^a-zA-Z]+)|[^\w.-])|([^a-zA-Z0-9]+$)/g;
	const normalized = removeScope(name).toLowerCase();
	const identifier = normalized.replace(INVALID_ES3_IDENT, '');
	return camelcase(identifier);
};

/**
 * Normalize the package type
 *
 * @param {string} type The user input package type
 *
 * @returns {string} normalized
 */
const normalizePackageType = (type) => {
	switch (type) {
		case 'commonjs':
			return 'commonjs2';
		default:
			return type;
	}
};

/**
 * Returns 10up-toolkit configs for package builds. If 10up-toolkit is not configured for building packages,
 * this returns false.
 *
 * @returns {object | boolean}
 */
const getTenUpScriptsPackageBuildConfig = () => {
	const packageJson = getPackage();
	const config = getTenUpScriptsConfig();
	const { name = 'default-package', style } = packageJson;
	const packageType = normalizePackageType(
		getArgFromCLI('-f') || getArgFromCLI('--format') || config.packageType || 'all',
	);
	const source = getArgFromCLI('-i') || getArgFromCLI('--input') || packageJson.source;
	const main = getArgFromCLI('-o') || getArgFromCLI('--output') || packageJson.main;
	const exports = packageJson.exports || {};
	const target = getArgFromCLI('--target') || '';

	let umd = false;
	if (packageType === 'umd' || packageType === 'all') {
		umd = packageJson.unpkg || packageJson['umd:main'] || false;
	}

	const hasSourceAndMain = source && main;
	const hasExportsField = Object.keys(exports).length > 0;

	if (!hasSourceAndMain && !hasExportsField) {
		return false;
	}

	let externals = [];

	if (hasArgInCLI('--external')) {
		const external = getArgFromCLI('--external');

		if (external && external !== 'none') {
			externals = external.split(',');
		}
	} else {
		if (packageJson.dependencies) {
			externals = Object.keys(packageJson.dependencies);
		}

		if (packageJson.peerDependencies) {
			externals = [...externals, ...Object.keys(packageJson.peerDependencies)];
		}
	}

	const libraryName = getArgFromCLI('--name') || config.libraryName || safeVariableName(name);

	return {
		source,
		main,
		umd,
		exports,
		style,
		externals,
		libraryName,
		packageType,
		target,
	};
};

const getBuildFiles = () => {
	const { entry } = getTenUpScriptsConfig();

	const entries = {};

	Object.keys(entry).forEach((key) => {
		const filePath = path.resolve(process.cwd(), entry[key]);

		if (fileExists(filePath)) {
			entries[key] = filePath;
		}
	});

	return entries;
};

module.exports = {
	hasBabelConfig,
	getJestOverrideConfigFile,
	hasJestConfig,
	hasPrettierConfig,
	hasPostCSSConfig,
	hasStylelintConfig,
	getBuildFiles,
	hasEslintignoreConfig,
	hasEslintConfig,
	getTenUpScriptsConfig,
	getDefaultConfig,
	getTenUpScriptsPackageBuildConfig,
	hasWebpackConfig,
	hasTsConfig,
};
