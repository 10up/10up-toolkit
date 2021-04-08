/**
 * Internal dependencies
 */
const { getArgsFromCLI } = require('../utils');
const { getScaffoldType } = require('../utils/scaffold');

const scaffoldTypes = ['block', 'project'];
const args = getArgsFromCLI();

try {
	const type = getScaffoldType(args, scaffoldTypes);
	require(`../scaffold/${type}`);
} catch (e) {
	console.log(e.message);
}
