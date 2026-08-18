/* eslint-disable import/no-unresolved */
import { registerBlockType } from '@wordpress/blocks';

registerBlockType('test/example-one', {
	edit: () => 'Example One',
	save: () => 'Example One',
});
