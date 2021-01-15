/**
 * External dependencies
 */
const { basename } = require('path');

/**
 * Internal dependencies
 */
const { existsSync: fileExists } = require('fs');
const path = require('path');
const { getArgsFromCLI, getFileArgsFromCLI, hasArgInCLI, hasFileArgInCLI } = require('./cli');
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
 * @returns {string=} Override or fallback configuration file path.
 */
function getJestOverrideConfigFile(suffix) {
	if (hasArgInCLI('-c') || hasArgInCLI('--config')) {
		return;
	}

	if (hasProjectFile(`jest-${suffix}.config.js`)) {
		return fromProjectRoot(`jest-${suffix}.config.js`);
	}

	if (!hasJestConfig()) {
		return fromConfigRoot(`jest-${suffix}.config.js`);
	}
}

const hasJestConfig = () =>
	hasProjectFile('jest.config.js') ||
	hasProjectFile('jest.config.json') ||
	hasPackageProp('jest');

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

const hasEslintignoreConfig = () => hasProjectFile('.eslintignore');

const getBuildFiles = () => {
	const packageJson = getPackage();

	const defaultBuildFiles = require(fromConfigRoot('buildfiles.config.js'));

	if (!packageJson.build) {
		packageJson.build = defaultBuildFiles;
	}

	const entries = {};

	Object.keys(packageJson.build).forEach((key) => {
		const filePath = path.resolve(process.cwd(), packageJson.build[key]);

		if (fileExists(filePath)) {
			entries[key] = filePath;
		}
	});

	return entries;
};

/**
 * Converts CLI arguments to the format which webpack understands.
 *
 * @see https://webpack.js.org/api/cli/#usage-with-config-file
 *
 * @returns {Array} The list of CLI arguments to pass to webpack CLI.
 */
const getWebpackArgs = () => {
	// Gets all args from CLI without those prefixed with `--webpack`.
	let webpackArgs = getArgsFromCLI(['--webpack']);

	const hasWebpackOutputOption = hasArgInCLI('-o') || hasArgInCLI('--output');
	if (hasFileArgInCLI() && !hasWebpackOutputOption) {
		/**
		 * Converts a path to the entry format supported by webpack, e.g.:
		 * `./entry-one.js` -> `entry-one=./entry-one.js`
		 * `entry-two.js` -> `entry-two=./entry-two.js`
		 *
		 * @param {string} path The path provided.
		 *
		 * @returns {string} The entry format supported by webpack.
		 */
		const pathToEntry = (path) => {
			const entry = basename(path, '.js');
			let webpackPath = path;

			if (!path.startsWith('./')) {
				webpackPath = `./${path}`;
			}

			return [entry, webpackPath].join('=');
		};

		// The following handles the support for multiple entry points in webpack, e.g.:
		// `wp-scripts build one.js custom=./two.js` -> `webpack one=./one.js custom=./two.js`
		webpackArgs = webpackArgs.map((cliArg) => {
			if (getFileArgsFromCLI().includes(cliArg) && !cliArg.includes('=')) {
				return pathToEntry(cliArg);
			}

			return cliArg;
		});
	}

	if (!hasWebpackConfig()) {
		webpackArgs.push('--config', fromConfigRoot('webpack.config.js'));
	}

	return webpackArgs;
};

module.exports = {
	getWebpackArgs,
	hasBabelConfig,
	getJestOverrideConfigFile,
	hasJestConfig,
	hasPrettierConfig,
	hasPostCSSConfig,
	hasStylelintConfig,
	getBuildFiles,
	hasEslintignoreConfig,
	hasEslintConfig,
};
