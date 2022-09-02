process.on('unhandledRejection', (err) => {
	throw err;
});

const { resolve } = require('path');
const { ESLint } = require('eslint');
const { getConfigFile, countResults } = require('./helpers');
const files = ['index', 'react', 'wordpress', 'node'];
const verbose = process.argv.indexOf('--verbose') > -1;

async function testLintConfig(file) {
	const overrideConfigFile = resolve(__dirname, `../config/${file}.js`);
	const failDirectory = resolve(__dirname, `./${file}/fail/*.js`);
	const successDirectory = resolve(__dirname, `./${file}/pass/*.js`);
	const cli = new ESLint({ useEslintrc: false, overrideConfigFile });

	console.log('Running ESLint on fixtures directories. Use --verbose for a detailed report.');
	console.log(`\nLinting ${failDirectory}...`);

	const formatter = await cli.loadFormatter();

	cli.lintFiles([failDirectory]).then((results) => {
		const antipatternCounts = countResults(results);
		const allFail = results.every((result) => result.errorCount > 0 || result.warningCount > 0);

		if (allFail) {
			console.log('√ ESLint logs errors as expected.\n');
		} else if (antipatternCounts.errors) {
			console.log('The following files did not produce errors:');
			results.forEach((file) => {
				if (file.errorCount > 0 || file.warningCount > 0) {
					return;
				}

				console.log(`  ${file.filePath}`);
			});
			console.log('');

			process.exitCode = 1;
		} else {
			console.log('Errors expected, but none encountered!\n');
			process.exitCode = 1;
		}

		// Log full report when --verbose.
		if (verbose) {
			console.log(formatter.format(antipatternCounts.results));
		}
	});

	// Run for pass tests
	console.log(`\nLinting ${successDirectory}...`);

	cli.lintFiles([successDirectory]).then((results) => {
		const exampleCounts = countResults(results);

		// Log full report when --verbose, or whenever errors are unexpectedly reported.
		if (verbose || exampleCounts.errors || exampleCounts.warnings) {
			console.log(formatter.format(results));
		}

		if (exampleCounts.errors) {
			const { errors } = exampleCounts;
			console.log(`${errors} unexpected error${errors !== 1 ? 's' : ''}!\n`);
			process.exitCode = 1;
		} else {
			const { files } = exampleCounts;
			console.log(`${files} files pass lint.`);
		}
	});
}

(async () => {
	const file = getConfigFile();

	if (file) {
		await testLintConfig(file);
	} else {
		for (const file of files) {
			await testLintConfig(file);
		}
	}
})();
