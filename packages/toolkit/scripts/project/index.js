const chalk = require('chalk');
const { getArgsFromCLI } = require('../../utils');

const { log } = console;
const args = getArgsFromCLI();

(async () => {
	if (args && args.length) {
		const subcommand = args[0];

		const command = require(`./${subcommand}`);

		if (!command || !command.run) {
			log(chalk.red('Command not found.'));
			process.exit(1);
		}

		await command.run();
	} else {
		// Read all files in current directory except index.js
		const files = require('fs')
			.readdirSync(__dirname)
			.filter((file) => file !== 'index.js' && file.match(/\.js$/));

		files.forEach((file) => {
			const command = require(`./${file}`);

			log(command.description);
		});
	}

	process.exit(0);
})();
