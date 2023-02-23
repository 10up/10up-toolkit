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
	hasBabelConfig,
	getJestOverrideConfigFile,
	hasJestConfig,
	hasPrettierConfig,
	hasEslintConfig,
	hasEslintignoreConfig,
	hasPostCSSConfig,
	getBuildFiles,
	hasStylelintConfig,
	getTenUpScriptsConfig,
	getTenUpScriptsPackageBuildConfig,
	hasWebpackConfig,
	hasTsConfig,
} = require('./config');
const { fromProjectRoot, fromConfigRoot, hasProjectFile } = require('./file');

const { hasPackageProp, getPackagePath, getPackage, getPackageVersion } = require('./package');

const { displayWebpackStats } = require('./webpack');

const { maybeInsertStyleVersionHash } = require('./blocks');

module.exports = {
	fromProjectRoot,
	fromConfigRoot,
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	getNodeArgsFromCLI,
	hasStylelintConfig,
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
	hasTsConfig,
	spawnScript,
	getPackagePath,
	getBuildFiles,
	getPackage,
	getPackageVersion,
	getTenUpScriptsConfig,
	getTenUpScriptsPackageBuildConfig,
	hasWebpackConfig,
	displayWebpackStats,
	maybeInsertStyleVersionHash,
};
