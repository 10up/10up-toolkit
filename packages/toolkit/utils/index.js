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

const { transformBlockJson } = require('./blocks');

const {
	getProjectRoot,
	setEnvVariables,
	getGitBranch,
	getProjectVariables,
	getEnvironmentFromBranch,
	replaceVariables,
	getWordPressLatestVersion,
} = require('./project');

module.exports = {
	fromProjectRoot,
	getProjectRoot,
	setEnvVariables,
	getWordPressLatestVersion,
	fromConfigRoot,
	getProjectVariables,
	getArgFromCLI,
	replaceVariables,
	getArgsFromCLI,
	getFileArgsFromCLI,
	getNodeArgsFromCLI,
	hasStylelintConfig,
	hasBabelConfig,
	hasArgInCLI,
	hasFileArgInCLI,
	getJestOverrideConfigFile,
	hasJestConfig,
	getEnvironmentFromBranch,
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
	transformBlockJson,
	getGitBranch,
};
