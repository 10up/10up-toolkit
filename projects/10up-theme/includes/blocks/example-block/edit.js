/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';

// the version specified in package.json does not ship a transpiled version,
// so the intent here is to test toolkit `--include` feature to manually tell toolkit to transpile this package
import { ContentPicker } from '@10up/block-components';

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
			<ContentPicker
				onPickChange={(pickedContent) => {
					console.log(pickedContent);
				}}
				mode="post"
				label="Please select a Post or Page:"
				contentTypes={['post', 'page']}
			/>
		</div>
	);
};
export default ExampleBlockEdit;
