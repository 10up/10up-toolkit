const inquirer = require('inquirer');
const { resolve } = require('path');
const chalk = require('chalk');

const { log } = console;
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const fg = require('fast-glob');

const { getWordPressLatestVersion, replaceVariables } = require('../../utils/project');

const { getArgFromCLI, hasArgInCLI } = require('../../utils');

const cliPath = hasArgInCLI('--path') ? getArgFromCLI('--path') : '.';

const projectLayout = hasArgInCLI('--layout') ? getArgFromCLI('--layout') : 'common';

const name = hasArgInCLI('--name') ? getArgFromCLI('--name') : '';

const confirm = !!hasArgInCLI('--confirm');

const skipComposer = !!hasArgInCLI('--skip-composer');

let template = hasArgInCLI('--template') ? getArgFromCLI('--template') : '';

const variables = require(`../../project/default-variables.json`);

const description =
	'10up-toolkit project init [--path=<path>] [--layout=<common>] [--name=<name>] [--template=<template>] [--skip-composer] [--confirm]';

const run = async () => {
	const questions = [];
	let results = {};

	if (cliPath === '.' && !confirm) {
		const confirmResults = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'confirm',
				message: 'Are you sure you want do this? This operation could be destructive.',
				default: 'y',
			},
		]);

		if (!confirmResults.confirm) {
			process.exit(1);
		}
	}

	// we purposely do not actually expose projectLayout as a question for now and leave it as an advanced, semi-hidden option
	/*
	if (projectLayout === 'common') {
		questions.push({
			type: 'input',
			name: 'layout',
			validate: (input) => {
				if (!['common','monorepo'].includes(input)) {
					return false;
				}
				return true;
			},
			message: 'Project Layout (common or monorepo):',
		});
	}
	*/

	if (!name) {
		questions.push({
			type: 'input',
			name: 'name',
			validate: (input) => {
				if (!input.match(/^[a-zA-Z][a-zA-Z0-9 ]+$/)) {
					return false;
				}

				if (input.length < 3) {
					return false;
				}

				return true;
			},
			message:
				'Project name (Letters, numbers, and spaces only. Must start with a letter. Minimum 4 characters):',
		});
	}

	if (!template) {
		questions.push({
			type: 'list',
			name: 'template',
			choices: [
				{
					name: 'None',
					value: 'none',
				},
				{
					name: 'UI Kit',
					value: 'git@github.com:10up/ui-kit-scaffold.git',
				},
				{
					name: 'Standard WP',
					value: 'git@github.com:10up/wp-scaffold.git',
				},
			],
			message: 'Choose a project template:',
		});
	}

	if (questions.length) {
		results = await inquirer.prompt(questions);
	}

	log(`Initializing project at ${cliPath} with a ${projectLayout} project layout`);

	variables.wordpress_version = await getWordPressLatestVersion();

	const toolkitPath = resolve(`${__dirname}/../../`);
	const templateInitPath =
		projectLayout === 'modern' ? `${resolve(cliPath)}/wordpress/wp-content` : resolve(cliPath);
	template = results.template || template;

	const projectName = results.name || name;

	variables.projectName = projectName;

	// Make name camel case
	const projectNameCamelCase = projectName
		.replace(/-([a-z])/g, function (g) {
			return g[1].toUpperCase();
		})
		.replace(/ /g, '');

	const projectNameLowercaseUnderscore = projectName.replace(/ /g, '_').toLowerCase();

	const projectNameLowercaseHypen = projectName.replace(/ /g, '-').toLowerCase();

	const projectNameUppercaseUnderscore = projectName.replace(/ /g, '_').toUpperCase();

	// Create dir if it does not exist
	if (!fs.existsSync(templateInitPath)) {
		fs.mkdirSync(templateInitPath, { recursive: true });
	}

	// If template is not empty, git clone template to init_path
	if (template !== 'none') {
		// Check if init_path directory is not empty
		if (fs.readdirSync(templateInitPath).length > 0) {
			console.error(
				`Directory ${templateInitPath} is not empty. Please provide an empty directory to initialize the project.`,
			);
			process.exit(1);
		}

		execSync(`git clone ${template} '${templateInitPath}'`);
		fs.rmSync(path.join(templateInitPath, '.git'), { recursive: true });
	}

	const tenupComposerFiles = [];

	const replaceOptions = [
		{ from: /TenUpPlugin/g, to: `${projectNameCamelCase}Plugin` },
		{ from: /TenupPlugin/g, to: `${projectNameCamelCase}Plugin` },
		{ from: /TenUpTheme/g, to: `${projectNameCamelCase}Theme` },
		{ from: /TenupTheme/g, to: `${projectNameCamelCase}Theme` },
		{ from: /TENUP_/g, to: `${projectNameUppercaseUnderscore}_` },
		{ from: /tenup_/g, to: `${projectNameLowercaseUnderscore}_` },
		{ from: /tenup-theme/g, to: `${projectNameLowercaseHypen}-theme` },
		{ from: /tenup-plugin/g, to: `${projectNameLowercaseHypen}-plugin` },
		{ from: /10up-plugin/g, to: `${projectNameLowercaseHypen}-plugin` },
		{ from: /tenup-wp-scaffold/g, to: `${projectNameLowercaseHypen}` },
		{ from: /10up\/wp-theme/g, to: `10up/${projectNameLowercaseHypen}-theme` },
		{ from: /10up\/wp-plugin/g, to: `10up/${projectNameLowercaseHypen}-plugin` },
		{ from: /10up\/.*-scaffold/g, to: `10up/${projectNameLowercaseHypen}` },
		{ from: /10up Plugin/g, to: `${projectName} Plugin` },
		{ from: /Tenup Plugin/g, to: `${projectName} Plugin` },
		{ from: /10up Theme/g, to: `${projectName} Theme` },
		{ from: /Tenup Theme/g, to: `${projectName} Theme` },
	];

	const files = await fg(`${templateInitPath}/**/*`, {
		ignore: ['**/*/node_modules', '**/*/vendor', '**/*/dist'],
		dot: true,
	});

	files.forEach((file) => {
		let fileContents = fs.readFileSync(file, 'utf8');

		replaceOptions.forEach((option) => {
			fileContents = fileContents.replace(option.from, option.to);
		});

		fs.writeFileSync(file, fileContents);

		if (file.match(/composer.json$/)) {
			const composerData = JSON.parse(fileContents);

			if (composerData.name.match(/^10up\//)) {
				tenupComposerFiles.push(file);
			}
		}
	});

	const themePath = `${templateInitPath}/themes/${projectNameLowercaseHypen}-theme`;
	const pluginPath = `${templateInitPath}/plugins/${projectNameLowercaseHypen}-plugin`;
	const muPluginPath = `${templateInitPath}/mu-plugins/${projectNameLowercaseHypen}-plugin`;

	// Copy contents of toolkitPath/project/local into cliPath
	execSync(`rsync -rc "${toolkitPath}/project/local/" "${cliPath}"`);

	if (!skipComposer) {
		tenupComposerFiles.forEach((file) => {
			execSync(`composer install --working-dir="${path.dirname(file)}"`);
		});
	}

	const renameDirs = [
		{ from: `${templateInitPath}/themes/tenup-theme`, to: themePath },
		{ from: `${templateInitPath}/plugins/tenup-plugin`, to: pluginPath },
		{ from: `${templateInitPath}/themes/10up-theme`, to: themePath },
		{ from: `${templateInitPath}/plugins/10up-plugin`, to: pluginPath },
		{ from: `${templateInitPath}/mu-plugins/10up-plugin`, to: muPluginPath },
	];

	renameDirs.forEach((dir) => {
		if (fs.existsSync(dir.from)) {
			fs.renameSync(dir.from, dir.to);
		}
	});

	// Load the contents of the .tenup.yml file into a string
	let configFile = fs.readFileSync(`${cliPath}/.tenup.yml`, 'utf8');

	configFile = replaceVariables(configFile, variables);

	// Write config file back to disk
	fs.writeFileSync(`${cliPath}/.tenup.yml`, configFile);

	const cwd = process.cwd();
	process.chdir(cliPath);
	execSync(`bash -l ${__dirname}/bash/build-setup.sh update-composer`, {
		stdio: 'inherit',
	});
	execSync(`bash -l ${__dirname}/bash/build-setup.sh initialize-git`, {
		stdio: 'inherit',
	});
	process.chdir(cwd);

	log(chalk.green('Project initialized.'));

	// Now generate CI
	await require('./generate-ci').run(true, cliPath);
};

module.exports = { run, description };
