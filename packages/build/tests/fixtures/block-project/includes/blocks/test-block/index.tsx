/**
 * Test block editor script
 */
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

registerBlockType('test/test-block', {
	title: __('Test Block', 'test'),
	edit: () => {
		const blockProps = useBlockProps();
		return <div {...blockProps}>Test Block</div>;
	},
	save: () => {
		const blockProps = useBlockProps.save();
		return <div {...blockProps}>Test Block</div>;
	},
});
