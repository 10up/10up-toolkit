const prompts = require('prompts');

const { recursivelyCloneDirectory } = require('../../utils/project');

const { getArgFromCLI, hasArgInCLI } = require('../../utils');

const path = hasArgInCLI('--path') ? getArgFromCLI('--path') : '.';

const variables = require(`../../project/default-variables.json`);

const main = async () => {
	if (path === '.') {
		const response = await prompts({
			type: 'confirm',
			name: 'value',
			initial: true,
			message:
				'Are you sure you want to initialize a project in the current directory? This could potentially overwrite files.',
		});

		if (!response) {
			process.exit(0);
		}
	}

	console.log(`Initializing project at ${path}`);

	recursivelyCloneDirectory(`${__dirname}/../../project/local`, path, variables);

	process.exit(0);
};

module.exports = main;
