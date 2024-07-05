const { execSync } = require('child_process');
const chalk = require('chalk');

const { log } = console;

const fs = require('fs');
const { getProjectRoot, getProjectVariables, setEnvVariables } = require('../../utils');

const description = '10up-toolkit project build';

const run = async () => {
	const root = getProjectRoot();

	if (!root) {
		log(chalk.red('This is not a project.'));
		process.exit(1);
	}

	// combine project variables with actual environment variables
	const variables = { ...getProjectVariables(), ...process.env };

	if (!variables) {
		log(chalk.red('No .tenup.yml found.'));
		process.exit(1);
	}

	setEnvVariables(variables);

	if (fs.existsSync(variables.build_script_path)) {
		execSync(`bash -l ${__dirname}/bash/build-setup.sh local`, {
			stdio: 'inherit',
		});
	} else {
		log(chalk.red('No build script found.'));
		process.exit(1);
	}

	log(chalk.green('Build complete.'));
};

module.exports = { run, description };
