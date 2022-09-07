/** @typedef {import('estree').Node} ESTreeNode */

/**
 * Given an Espree Node, returns true if the node is a component.
 *
 * @param {ESTreeNode} node Node to check.
 *
 * @returns {boolean} Whether node is a component.
 */
function isComponent(node) {
	// Assume function component by naming convention of UpperCamelCase.
	if (node.type === 'FunctionDeclaration' && node.id && /^[A-Z]/.test(node.id.name)) {
		return true;
	}

	// Assume class component by extends name `Component`.
	if (node.type === 'ClassDeclaration' && node.superClass) {
		let superClassName;
		switch (node.superClass.type) {
			case 'Identifier': {
				superClassName = node.superClass.name;
				break;
			}

			case 'MemberExpression': {
				superClassName = node.superClass.property.name;
				break;
			}
			default:
				break;
		}

		if (superClassName === 'Component') {
			return true;
		}
	}

	return false;
}

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
	},
	create(context) {
		return {
			'CallExpression[callee.name="setTimeout"]': function (node) {
				// If the result of a `setTimeout` call is assigned to a
				// variable, assume the timer ID is handled by a cancellation.
				const hasAssignment =
					node.parent.type === 'AssignmentExpression' ||
					node.parent.type === 'VariableDeclarator';
				if (hasAssignment) {
					return;
				}

				let isInComponent = false;

				let parent = node;
				// eslint-disable-next-line prefer-destructuring, no-cond-assign
				while ((parent = parent.parent)) {
					if (isComponent(parent)) {
						isInComponent = true;
						break;
					}
				}

				// Only consider `setTimeout` which occur within a component.
				if (!isInComponent) {
					return;
				}

				// Consider whether `setTimeout` is a reference to the global
				// by checking references to see if `setTimeout` resolves to a
				// variable in scope.
				const { references } = context.getScope();
				const hasResolvedReference = references.some(
					(reference) =>
						reference.identifier.name === 'setTimeout' &&
						!!reference.resolved &&
						reference.resolved.scope.type !== 'global',
				);

				if (hasResolvedReference) {
					return;
				}

				context.report(node, 'setTimeout in a component must be cancelled on unmount');
			},
		};
	},
};
