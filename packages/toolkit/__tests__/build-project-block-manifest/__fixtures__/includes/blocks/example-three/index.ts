/* eslint-disable import/no-unresolved */
import { registerBlockType } from '@wordpress/blocks';

registerBlockType('test/example-three', {
	edit: () => 'Example Three',
	save: () => 'Example Three',
});
