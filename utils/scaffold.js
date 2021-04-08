/**
 * Validate the block name is a string and is OK for usages
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/blocks/src/api/registration.js#L213
 *
 * @param {string} name The name of the block.
 * @returns {boolean} Whether name is a valid block name.
 */
function validateBlockName(name) {
	if (typeof name !== 'string') {
		throw new Error('Block names must be strings.');
	}

	const re = /^[a-z][-a-z]+$/g;
	if (!re.test(name)) {
		throw new Error(
			'Names must only include only lowercase alphanumeric characters or dashes, and start with a letter. Example :my-custom-block',
		);
	}
	return true;
}

/**
 * Convert the block name to a PHP class name.
 *
 * @param {string} name Name of the block.
 * @returns {string} Class friendly name.
 */
function convertToPHPName(name) {
	return name
		.replace('/', '-')
		.split('-')
		.map((word) => word.replace(/^./, word[0].toUpperCase()))
		.join('');
}

/**
 * Validate the args passed to the scaffold command
 *
 * @param {Array} args Args passed to the command
 * @param {Array} allowedTypes The list of support types.
 * @returns {string}
 */
function getScaffoldType(args, allowedTypes) {
	if (!args.length) {
		throw new Error('Scaffold Type is missing. Supported types are `block` and `project');
	}
	const [type] = args;

	if (!allowedTypes.includes(type)) {
		throw new Error('Scaffold Type not supported. Supported types are `block` and `project`');
	}
	return type;
}

module.exports = {
	validateBlockName,
	convertToPHPName,
	getScaffoldType,
};
