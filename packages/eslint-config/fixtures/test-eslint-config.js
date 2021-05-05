/* eslint-disable no-console */
process.on('unhandledRejection', (err) => {
	throw err;
});

const { join } = require('path');
const { CLIEngine } = require('eslint');
const { getConfigFile, countResults } = require('./helpers');

const configFile = getConfigFile();
const directoryToTest = configFile.replace('.js', '');
const cli = new CLIEngine({ useEslintrc: false, configFile });
const formatter = CLIEngine.getFormatter();

const verbose = process.argv.indexOf('--verbose') > -1;

console.log('Running ESLint on fixtures directories. Use --verbose for a detailed report.');
console.log(`\nLinting ${join(__dirname, directoryToTest, '/fail/*.js')}...`);

const antipatternReport = cli.executeOnFiles([join(__dirname, directoryToTest, '/fail/*.js')]);
const antipatternCounts = countResults(antipatternReport.results);
const allFail = antipatternReport.results.reduce(
	// eslint-disable-next-line no-return-assign,no-param-reassign
	(didFail, file) => didFail && (file.errorCount > 0 || file.warningCount > 0),
	true,
);

if (allFail) {
	console.log('√ ESLint logs errors as expected.\n');
} else if (antipatternCounts.errors) {
	console.log('The following files did not produce errors:');
	antipatternReport.results.forEach((file) => {
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

// Run for pass tests

console.log(`\nLinting ${join(__dirname, directoryToTest, '/pass/*.js')}...`);

const exampleReport = cli.executeOnFiles([join(__dirname, directoryToTest, '/pass/*.js')]);
const exampleCounts = countResults(exampleReport.results);

// Log full report when --verbose, or whenever errors are unexpectedly reported.
if (verbose || exampleCounts.errors || exampleCounts.warnings) {
	console.log(formatter(exampleReport.results));
}

if (exampleCounts.errors) {
	const { errors } = exampleCounts;
	console.log(`${errors} unexpected error${errors !== 1 ? 's' : ''}!\n`);
	process.exitCode = 1;
} else {
	const { files } = exampleCounts;
	console.log(`${files} files pass lint.`);
}
