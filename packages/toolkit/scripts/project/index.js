const { getArgsFromCLI } = require('../../utils');

const args = getArgsFromCLI();

(async () => {
	if (args && args.length) {
		const subcommand = args[0];

		await require(`./${subcommand}`)();
		process.exit(0);
	}

	console.log('No subcommand provided.');

	process.exit(1);
})();
