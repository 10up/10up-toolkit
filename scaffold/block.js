/**
 * External dependencies
 */
const copy = require('copy-template-dir');
const path = require('path');
const { prompt } = require('enquirer');

const packageUtils = require('../utils/package');
const { validateBlockName, convertToPHPName } = require('../utils/scaffold');

(async () => {
	const { hasPackageProp, getPackage } = await packageUtils;
	let usingPackageJSON = false;
	let packageNamespace = '';
	// Retrieve the package.json
	const packageJSON = getPackage();

	if (packageJSON) {
		const resp = await prompt([
			{
				type: 'confirm',
				name: 'usePackageJSON',
				message:
					'package.json detected. Do you want to use values from it for portions of this block?',
			},
		]);

		const { usePackageJSON } = resp;
		usingPackageJSON = usePackageJSON;
	}

	if (usingPackageJSON) {
		// Package.json doesn't seem correct.
		if (!hasPackageProp('@10up/scripts')) {
			console.warn(
				'Package.json does not contains @10up/scripts. Please run this from the root of your theme or plugin directory in wp-scaffold.',
			);
			return;
		}

		// Prompt for updating the name property from the default.
		packageNamespace = packageJSON.name.match(/([a-z]+)/);
		if (packageNamespace[0] === 'tenup-theme') {
			console.error(
				'Please update `name` in the package.json to better reflect the project. This property is used for the text-domain and block namespace. ',
			);
			return;
		}
	}

	const response = await prompt([
		{
			type: 'select',
			name: 'apiVersion',
			message: 'Block API version to use',
			choices: [
				{ name: 'v2', message: ' Version 2', value: 'v2' },
				{ name: 'v1', message: ' Version 1', value: 'v1' },
			],
		},
		{
			type: 'input',
			name: 'namespace',
			message: 'Project text-domain and block namespace',
			initial: packageNamespace[0] || '',
		},
		{
			type: 'input',
			name: 'name',
			required: true,
			message: 'Block name: i.e my-custom-block',
			validate(name) {
				try {
					return validateBlockName(name);
				} catch (e) {
					return e.message;
				}
			},
		},
		{
			type: 'input',
			name: 'title',
			message: 'Block title as it appears in the Inserter:',
			initial: 'Scaffolded Block Title',
		},
		{
			type: 'input',
			name: 'desc',
			message: 'Block description:',
			initial: 'Scaffolded Block Description',
		},
		{
			type: 'input',
			name: 'category',
			message: 'Block category:',
			initial: 'common',
		},
		{
			type: 'input',
			name: 'icon',
			message: 'Block icon: ',
		},
		{
			type: 'input',
			name: 'blocksDir',
			message: 'Relative location of block directory',
			initial: '/includes/block-editor/blocks/',
		},
	]);

	// User input values.
	const { apiVersion, namespace, name, title, desc, category, icon, blocksDir } = response;

	// Templates file directories
	const templateDir = path.join(__dirname, `templates/block/api-${apiVersion}`);
	// Output file directories
	const outputDir = path.join(process.cwd(), `${blocksDir}${name}`);
	// Copy the files
	copy(
		templateDir,
		outputDir,
		{
			name: `${namespace}/${name}`,
			title,
			desc,
			textDomain: namespace,
			icon,
			category,
			dir: name,
			phpNamespace: convertToPHPName(name),
		},
		(err, createdFiles) => {
			if (err) throw err;
			createdFiles.forEach((filePath) => console.log(`Created ${filePath}`));
			console.log('JavaScript files generated.');
		},
	);
})();
