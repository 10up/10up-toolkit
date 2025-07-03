/* eslint-disable */
import { registerBlockType } from '@wordpress/blocks';

import edit from './edit';
import save from './save';
import block from './block.json';

registerBlockType(block, {
	edit,
	save,
});
