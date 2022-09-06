/**
 * Get the actual translation function name from a CallExpression callee.
 *
 * Returns the "__" part from __ or i18n.__.
 *
 * @param {object} callee
 * @returns {string} Function name.
 */
function getTranslateFunctionName(callee) {
	return callee.property && callee.property.name ? callee.property.name : callee.name;
}

module.exports = {
	getTranslateFunctionName,
};
