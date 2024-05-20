const inquirer = require('inquirer');
const { resolve } = require('path');
const chalk = require('chalk');

const { log } = console;
const fs = require('fs');

const { getProjectVariables, getProjectRoot, replaceVariables } = require('../../utils');

const { getArgFromCLI, hasArgInCLI } = require('../../utils');

const confirm = !!hasArgInCLI('--confirm');

let type = hasArgInCLI('--type') ? getArgFromCLI('--type') : '';

const description = '10up-toolkit project generate-ci [--type=<type>]';

const run = async (cnf = false) => {
	const variables = getProjectVariables();
	const root = getProjectRoot();

	const questions = [];
	let results = {};

	if (!variables) {
		log(chalk.red('No .tenup.yml found.'));
		process.exit(1);
	}

	if (!confirm && !cnf) {
		const confirmResults = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'confirm',
				message: 'Are you sure you want do this? It will overwrite an existing CI files.',
				default: 'y',
			},
		]);

		if (!confirmResults.confirm) {
			process.exit(1);
		}
	}

	if (!type) {
		questions.push({
			type: 'list',
			name: 'type',
			choices: [
				{
					name: 'GitLab',
					value: 'gitlab',
				},
				{
					name: 'None',
					value: 'none',
				},
				/* {
					name: 'GitHub',
					value: 'github',
				}, */
			],
			message: 'Choose a CI type:',
		});
	}

	if (questions.length) {
		results = await inquirer.prompt(questions);
	}

	type = results.type || type;

	if (type === 'none') {
		return;
	}

	if (type === 'gitlab') {
		// Load template file into a string
		const template = fs.readFileSync(
			resolve(__dirname, '../../project/gitlab/.gitlab-ci.tmpl'),
			'utf8',
		);

		let preparedTemplate = replaceVariables(template, variables);

		Object.keys(variables.environments).forEach((env) => {
			const environment = variables.environments[env];

			const fileEnv = env === 'production' ? 'production' : 'staging';

			let filePath = `../../project/gitlab/deploy-configs/rsync-${fileEnv}.tmpl`;

			if (environment.deploy_type === 'wpe' || environment.deploy_type === 'wpengine') {
				filePath = `../../project/gitlab/deploy-configs/wpe-${fileEnv}.tmpl`;
			} else if (environment.deploy_type === 'pantheon') {
				filePath = `../../project/gitlab/deploy-configs/pantheon-${fileEnv}.tmpl`;
			}

			const deployTemplate = fs.readFileSync(resolve(__dirname, filePath), 'utf8');

			const preparedDeployTemplate = replaceVariables(deployTemplate, {
				...variables,
				...environment,
			});

			preparedTemplate += `\n${preparedDeployTemplate}`;
		});

		fs.writeFileSync(`${root}/.gitlab-ci.yml`, preparedTemplate);
	}

	log(chalk.green('CI generated.'));
};

module.exports = { run, description };
