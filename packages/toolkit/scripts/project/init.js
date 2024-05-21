const inquirer = require('inquirer');
const { resolve } = require('path');
const chalk = require('chalk');

const { log } = console;
const fs = require('fs');

const { execSync } = require('child_process');

const { getWordPressLatestVersion, replaceVariables } = require('../../utils/project');

const { getArgFromCLI, hasArgInCLI } = require('../../utils');

const path = hasArgInCLI('--path') ? getArgFromCLI('--path') : '.';

const name = hasArgInCLI('--name') ? getArgFromCLI('--name') : '';

const confirm = !!hasArgInCLI('--confirm');

const template = hasArgInCLI('--template') ? getArgFromCLI('--template') : '';

const variables = require(`../../project/default-variables.json`);

const description =
	'10up-toolkit project init [--path=<path>] [--name=<name>] [--template=<template>] [--confirm] [--deploy_location=<deploy_location>]';

const run = async () => {
	const questions = [];
	let results = {};

	if (path === '.' && !confirm) {
		const confirmResults = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'confirm',
				message: 'Are you sure you want do this? This operation could be destructive.',
				default: 'y',
			},
		]);

		if (!confirmResults.confirm) {
			process.exit(1);
		}
	}

	if (!name) {
		questions.push({
			type: 'input',
			name: 'name',
			validate: (input) => {
				if (!input.match(/^[a-zA-Z][a-zA-Z0-9 ]+$/)) {
					return false;
				}

				if (input.length < 3) {
					return false;
				}

				return true;
			},
			message:
				'Project name (Letters, numbers, and spaces only. Must start with a letter. Minimum 4 characters):',
		});
	}

	if (!template) {
		questions.push({
			type: 'list',
			name: 'template',
			choices: [
				{
					name: 'None',
					value: '',
				},
				{
					name: 'UI Kit',
					value: 'git@github.com:10up/ui-kit-scaffold.git',
				},
				{
					name: 'Standard WP',
					value: 'git@github.com:10up/wp-scaffold.git',
				},
			],
			message: 'Choose a project template:',
		});
	}

	if (questions.length) {
		results = await inquirer.prompt(questions);
	}

	log(`Initializing project at ${path}`);

	variables.wordpress_version = await getWordPressLatestVersion();

	variables.toolkit_path = resolve(`${__dirname}/../../`);
	variables.init_path = resolve(path);
	variables.template = results.template || template;

	variables.project_name = results.name || name;

	// Make name camel case
	variables.project_name_camel_case = variables.project_name
		.replace(/-([a-z])/g, function (g) {
			return g[1].toUpperCase();
		})
		.replace(/ /g, '');

	variables.project_name_lowercase_underscore = variables.project_name
		.replace(/ /g, '_')
		.toLowerCase();

	variables.project_name_lowercase_hypen = variables.project_name
		.replace(/ /g, '-')
		.toLowerCase();

	variables.project_name_uppercase_underscore = variables.project_name
		.replace(/ /g, '_')
		.toUpperCase();

	Object.keys(variables).forEach((key) => {
		process.env[key] = variables[key];
	});

	const initScript = `${__dirname}/bash/init.sh`;

	execSync(`sh ${initScript}`, { stdio: 'inherit' });

	// Load the contents of the .tenup.yml file into a string
	let configFile = fs.readFileSync(`${path}/.tenup.yml`, 'utf8');

	configFile = replaceVariables(configFile, variables);

	// Write config file back to disk
	fs.writeFileSync(`${path}/.tenup.yml`, configFile);

	log(chalk.green('Project initialized.'));

	// Now generate CI
	await require('./generate-ci').run(true);
};

module.exports = { run, description };
