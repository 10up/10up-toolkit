/* eslint-disable no-console */
process.on('unhandledRejection', (err) => {
	throw err;
});

const { join } = require('path');
const { ESLint } = require('eslint');
const { getConfigFile, countResults } = require('./helpers');

const baseConfig  = getConfigFile();
const directoryToTest = baseConfig .replace('.js', '');
const cli = new ESLint({ useEslintrc: false, overrideConfigFile : baseConfig  });
const formatter = cli.loadFormatter();

const verbose = process.argv.indexOf('--verbose') > -1;

console.log('Running ESLint on fixtures directories. Use --verbose for a detailed report.');
console.log(`\nLinting ${join(__dirname, directoryToTest, '/fail/*.js')}...`);

cli.lintFiles([join(__dirname, directoryToTest, '/fail/*.js')]).then((results) => {
	const antipatternCounts = countResults(results);
	const allFail = results.reduce(
	// eslint-disable-next-line no-return-assign,no-param-reassign
	(didFail, file) => didFail && (file.errorCount > 0 || file.warningCount > 0),
	true,
);

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
	console.log(formatter(antipatternReport.results));
}

});

// Run for pass tests

console.log(`\nLinting ${join(__dirname, directoryToTest, '/pass/*.js')}...`);

cli.lintFiles([join(__dirname, directoryToTest, '/pass/*.js')]).then((results) => {
	const exampleCounts = countResults(results);

	// Log full report when --verbose, or whenever errors are unexpectedly reported.
	if (verbose || exampleCounts.errors || exampleCounts.warnings) {
		console.log(formatter(results));
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
