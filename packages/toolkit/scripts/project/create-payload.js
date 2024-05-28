const { execSync } = require('child_process');
const chalk = require('chalk');

const { log } = console;

const fs = require('fs');
const {
	getProjectRoot,
	getProjectVariables,
	setEnvVariables,
	getEnvironmentFromBranch,
} = require('../../utils');

const description = '10up-toolkit project create-payload <branch>';

const run = async () => {
	const branch = process.argv.slice(3)[0];

	if (!branch || branch.match(/--/)) {
		log(description);
		log(chalk.red('No branch specified.'));
		process.exit(1);
	}

	const root = getProjectRoot();

	if (!root) {
		log(chalk.red('This is not a project.'));
		process.exit(1);
	}

	let variables = getProjectVariables();

	if (!variables) {
		log(chalk.red('No .tenup.yml found.'));
		process.exit(1);
	}

	const matchedEnvironment = getEnvironmentFromBranch(branch, variables.environments);

	if (!matchedEnvironment) {
		log(chalk.red(`No environment found matching branch \`${branch}\`.`));
		process.exit(0);
	}

	variables = { ...variables, ...matchedEnvironment };

	log(`Creating payload for environment ${matchedEnvironment.environment}.`);

	setEnvVariables(variables);

	// First run build
	await require('./build').run();

	if (fs.existsSync(variables.create_payload_script_path)) {
		execSync(`bash ${variables.create_payload_script_path}`, { stdio: 'inherit' });
	}

	log(chalk.green('Payload created.'));
};

module.exports = { run, description };
