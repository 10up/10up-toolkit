/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';

// Importing the block's editor styles via JS will enable hot reloading for css
import './editor.css';

const ExampleBlockEdit = (props) => {
	const { attributes, setAttributes } = props;
	const { title } = attributes;

	const blockProps = useBlockProps();

	return (
		<div {...blockProps}>
			<RichText
				className="wp-block-example-block__title"
				tagName="h2"
				placeholder={__('Custom Title')}
				value={title}
				onChange={(title) => setAttributes({ title })}
			/>
		</div>
	);
};
export default ExampleBlockEdit;
