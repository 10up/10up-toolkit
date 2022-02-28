/**
 * Returns the actual text content from an argument passed to a translation function.
 *
 * @see eslint-plugin-wpcalypso
 *
 * @param {object} node A Literal, TemplateLiteral or BinaryExpression (+) node
 * @returns {string|boolean} The concatenated string or false.
 */
function getTextContentFromNode(node) {
	if (node.type === 'Literal') {
		return node.value;
	}

	if (node.type === 'BinaryExpression' && node.operator === '+') {
		const left = getTextContentFromNode(node.left);
		const right = getTextContentFromNode(node.right);

		if (left === false || right === false) {
			return false;
		}

		return left + right;
	}

	if (node.type === 'TemplateLiteral') {
		return node.quasis.map((quasis) => quasis.value.raw).join('');
	}

	return false;
}

module.exports = {
	getTextContentFromNode,
};
