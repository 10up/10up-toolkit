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
	hasEslintConfig,
	hasOxlintConfig,
	hasOxfmtConfig,
	hasPostCSSConfig,
	getBuildFiles,
	hasStylelintConfig,
	getTenUpScriptsConfig,
	getTenUpScriptsPackageBuildConfig,
	hasTsConfig,
} = require('./config');
const { fromProjectRoot, fromConfigRoot, hasProjectFile } = require('./file');

const { hasPackageProp, getPackagePath, getPackage, getPackageVersion } = require('./package');

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
	hasArgInCLI,
	hasFileArgInCLI,
	getEnvironmentFromBranch,
	hasPackageProp,
	hasEslintConfig,
	hasOxlintConfig,
	hasOxfmtConfig,
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
	getGitBranch,
};
