const { execSync } = require('child_process');

const fs = require('fs');
const { getProjectRoot } = require('../../utils');

const main = async () => {
	const root = getProjectRoot();

	if (!root) {
		console.log('This is not a project.');
		process.exit(1);
	}

	// Execute the build file at projectroot/deploy-scripts/build.sh
	if (fs.existsSync(`${root}/deploy-scripts/build.sh`)) {
		execSync(`sh ${root}/deploy-scripts/build.sh`, { stdio: 'inherit' });
	} else {
		console.log('No build script found.');
		process.exit(1);
	}
};

module.exports = main;
