/* eslint-disable import/no-unresolved */
import { registerBlockType } from '@wordpress/blocks';

registerBlockType('test/example-two', {
	edit: () => 'Example Two',
	save: () => 'Example Two',
});
