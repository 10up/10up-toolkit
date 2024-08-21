const YAML = require('yaml');
const fs = require('fs');

const { resolve } = require('path');
const { execSync } = require('child_process');
const fetch = require('node-fetch');

/**
 * The project root contains .tenup.yml
 *
 * @param {string} path Path to check
 * @returns {string|null}
 */
const getProjectRoot = (path = '.') => {
	// Find the project root by looking for .tenup.yml in parent directories
	let projectRoot = path === '.' ? process.cwd() : path;
	const dirLimit = 50;
	let level = 0;

	let found = true;

	while (!fs.existsSync(`${projectRoot}/.tenup.yml`)) {
		projectRoot = `${projectRoot}/..`;

		if (level >= dirLimit) {
			found = false;

			break;
		}

		level++;
	}

	if (!found) {
		return null;
	}

	return projectRoot;
};

/**
 * Get the latest version of WordPress
 *
 * @returns {string|null}
 */
const getWordPressLatestVersion = async () => {
	let jsonData;

	try {
		const response = await fetch('https://api.wordpress.org/core/version-check/1.7/');
		jsonData = await response.json();
	} catch (error) {
		return null;
	}

	if (jsonData?.offers[0]?.version) {
		return jsonData.offers[0].version;
	}

	return null;
};

/**
 * Flatten an object
 *
 * @param {*} obj
 * @param {*} parentKey
 * @param {*} result
 * @returns {*}
 */
const flattenObject = (obj, parentKey = '', result = {}) => {
	Object.keys(obj).forEach((key) => {
		const newKey = parentKey ? `${parentKey}__${key}` : key;
		const value = obj[key];

		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			// Recursively flatten the nested object
			flattenObject(value, newKey, result);
		} else {
			// Assign the value to the result object with the concatenated key
			result[newKey] = value;
		}
	});

	return result;
};

/**
 * Setuip environment variables
 *
 * @param {*} variables
 */
const setEnvVariables = (variables) => {
	const flattenedVariables = flattenObject(variables);

	// Loop through variables and set them as environment variables
	Object.keys(flattenedVariables).forEach((key) => {
		process.env[key] = flattenedVariables[key];
		process.env[key.toUpperCase()] = flattenedVariables[key];
	});
};

/**
 * Get matched environment from branch
 *
 * @param {*} branch Branch name
 * @param {*} environments All environments
 * @returns {}
 */
const getEnvironmentFromBranch = (branch, environments = []) => {
	let matchedEnvironment = null;

	Object.keys(environments).forEach((environment) => {
		if (environments[environment].branch === branch) {
			matchedEnvironment = environments[environment];
			matchedEnvironment.environment = environment;
		}
	});

	return matchedEnvironment;
};

const getGitBranch = () => {
	let branch = null;
	try {
		// Get the current git branch into a variable. Ensure nothing is printed to the stdout
		branch = execSync('git rev-parse --abbrev-ref HEAD 2>/dev/null', {
			encoding: 'utf8',
		})
			.toString()
			.trim();
	} catch (error) {
		// Do nothing
	}

	return branch;
};

/**
 * Get variables from .tenup.yml
 *
 * @param {string} path Path to check
 * @returns {object|null}
 */
const getProjectVariables = (environment, path = '.') => {
	const projectRoot = getProjectRoot(path);

	if (!projectRoot) {
		return null;
	}

	// Check that .tenup.yml exists
	if (!fs.existsSync(`${projectRoot}/.tenup.yml`)) {
		return null;
	}

	const data = YAML.parse(fs.readFileSync(`${projectRoot}/.tenup.yml`, 'utf8'));

	if (!data) {
		return null;
	}

	if (!environment) {
		const branch = getGitBranch();

		if (branch) {
			data.current_branch = branch;
			const matchedEnvironment = getEnvironmentFromBranch(branch, data.environments);

			if (matchedEnvironment) {
				data.current_environment = {};
				Object.keys(matchedEnvironment).forEach((key) => {
					data.current_environment[key] = matchedEnvironment[key];

					// We hoist these to the root of the object to make it easier to use in shell e.g. WORDPRESS_VERSION
					data[key] = matchedEnvironment[key];
				});
			}
		}
	}

	data.project_root = projectRoot;

	data.rsync_file_excludes = `./scripts/rsync-excludes.txt`;
	data.rsync_file_excludes_absolute = `${projectRoot}/scripts/rsync-excludes.txt`;

	data.toolkit_path = resolve(`${__dirname}/../`);

	return data;
};

const replaceVariables = (template, variables) => {
	let preparedTemplate = template;

	Object.keys(variables).forEach((key) => {
		preparedTemplate = preparedTemplate.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
	});

	return preparedTemplate;
};

module.exports = {
	getProjectRoot,
	replaceVariables,
	setEnvVariables,
	getGitBranch,
	getProjectVariables,
	getWordPressLatestVersion,
	getEnvironmentFromBranch,
};
