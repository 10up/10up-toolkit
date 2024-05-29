const YAML = require('yaml');
const fs = require('fs');

const { resolve } = require('path');
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
 * Setuip environment variables
 *
 * @param {*} variables
 */
const setEnvVariables = (variables) => {
	// Loop through variables and set them as environment variables
	Object.keys(variables).forEach((key) => {
		process.env[key] =
			typeof variables[key] === 'object' ? JSON.stringify(variables[key]) : variables[key];
		process.env[key.toUpperCase()] =
			typeof variables[key] === 'object' ? JSON.stringify(variables[key]) : variables[key];
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

/**
 * Get variables from .tenup.yml
 *
 * @param {string} path Path to check
 * @returns {object|null}
 */
const getProjectVariables = (path = '.') => {
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

	data.project_root = projectRoot;

	if (data.create_payload_script_path) {
		data.create_payload_script_path = resolve(
			`${projectRoot}/${data.create_payload_script_path}`,
		);
	} else {
		data.create_payload_script_path = resolve(
			`${__dirname}/../scripts/project/bash/create-payload.sh`,
		);
	}

	if (data.build_script_path) {
		data.build_script_path = resolve(`${projectRoot}/${data.build_script_path}`);
	} else {
		data.build_script_path = `${projectRoot}/scripts/build.sh`;
	}

	if (!data.deploy_file_excludes) {
		data.deploy_file_excludes = `./scripts/deploy-excludes.txt`;
	}

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
	getProjectVariables,
	getWordPressLatestVersion,
	getEnvironmentFromBranch,
};
