/**
 * Internal dependencies
 */
const {
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	getNodeArgsFromCLI,
	hasArgInCLI,
	hasFileArgInCLI,
	spawnScript,
} = require('./cli');

const {
	getWebpackArgs,
	hasBabelConfig,
	getJestOverrideConfigFile,
	hasJestConfig,
	hasPrettierConfig,
	hasEslintConfig,
	hasEslintignoreConfig,
	hasPostCSSConfig,
	getBuildFiles,
	getFilenames,
	getPaths,
	getLocalDevURL,
	hasStylelintConfig,
} = require('./config');
const { fromProjectRoot, fromConfigRoot, hasProjectFile } = require('./file');
const { hasPackageProp, getPackagePath, getPackage } = require('./package');

module.exports = {
	fromProjectRoot,
	fromConfigRoot,
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	getNodeArgsFromCLI,
	hasStylelintConfig,
	getWebpackArgs,
	hasBabelConfig,
	hasArgInCLI,
	hasFileArgInCLI,
	getJestOverrideConfigFile,
	hasJestConfig,
	hasPackageProp,
	hasPrettierConfig,
	hasEslintConfig,
	hasEslintignoreConfig,
	hasPostCSSConfig,
	hasProjectFile,
	spawnScript,
	getPackagePath,
	getBuildFiles,
	getFilenames,
	getPaths,
	getLocalDevURL,
	getPackage,
};
