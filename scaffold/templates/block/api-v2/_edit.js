/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */

/**
 * Edit component.
 * See https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/block-edit-save/#edit
 *
 * @param {object}   props                        The block props.
 * @returns {Function} Render the edit screen
 */
const BlockEdit = (props) => {
	const blockProps = useBlockProps();
	return <div {...blockProps}>Your code here</div>;
};

export default BlockEdit;
