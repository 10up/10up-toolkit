const Mustache = require('mustache');
const fs = require('fs');

const recursivelyCloneDirectory = (source, destination, variables) => {
	const files = fs.readdirSync(source);

	for (const file of files) {
		// Check if file is a directory
		console.log(file);
		const isDirectory = fs.lstatSync(`${source}/${file}`).isDirectory();

		if (isDirectory) {
			// Make directory if it doesnt exist
			if (!fs.existsSync(`${destination}/${file}`)) {
				fs.mkdirSync(`${destination}/${file}`);
			}

			recursivelyCloneDirectory(`${source}/${file}`, `${destination}/${file}`, variables);
		} else {
			const templateContent = fs.readFileSync(`${source}/${file}`, {
				encoding: 'utf8',
				flag: 'r',
			});
			const rendered = Mustache.render(templateContent, variables);

			// Write file (overwrite if it exists)
			fs.writeFileSync(`${destination}/${file}`, rendered);
		}
	}
};

/**
 * The project root contains .tenup-ci.yml
 *
 * @returns {string|null}

 */
const getProjectRoot = () => {
	// Find the project root by looking for .tenup-ci.yml in parent directories
	let projectRoot = process.cwd();
	const dirLimit = 50;
	let level = 0;

	let found = true;

	while (!fs.existsSync(`${projectRoot}/.tenup-ci.yml`)) {
		projectRoot = `${projectRoot}/..`;

		if (level >= dirLimit) {
			found = false;

			break;
		}

		level++;
	}

	if (!found) {
		return null;
	}

	// Make path not relative
	projectRoot = fs.realpathSync(projectRoot);

	return projectRoot;
};

module.exports = {
	recursivelyCloneDirectory,
	getProjectRoot,
};
