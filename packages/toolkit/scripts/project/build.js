const { execSync } = require('child_process');
const chalk = require('chalk');

const { log } = console;

const {
	getProjectRoot,
	getProjectVariables,
	setEnvVariables,
	hasArgInCLI,
	getArgFromCLI,
} = require('../../utils');

const buildType = hasArgInCLI('--type') ? getArgFromCLI('--type') : 'local';
const buildEnvironment = hasArgInCLI('--environment') ? getArgFromCLI('--environment') : null;

const description = '10up-toolkit project build [--type=<type>] [--environment=<environment>]';

const run = async () => {
	const root = getProjectRoot();

	if (!root) {
		log(chalk.red('This is not a project.'));
		process.exit(1);
	}

	// combine project variables with actual environment variables
	const variables = { ...getProjectVariables(buildEnvironment), ...process.env };

	if (!variables) {
		log(chalk.red('No .tenup.yml found.'));
		process.exit(1);
	}

	setEnvVariables(variables);

	execSync(`${process.env.SHELL} ${__dirname}/bash/scripts.sh ${buildType}`, {
		stdio: 'inherit',
	});

	log(chalk.green('Build complete.'));
};

module.exports = { run, description };
