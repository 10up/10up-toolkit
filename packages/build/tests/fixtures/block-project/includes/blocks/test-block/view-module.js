/**
 * Test block view script module (ES Module)
 */
import { store, getContext } from '@wordpress/interactivity';

store('test/test-block', {
	actions: {
		toggle() {
			const context = getContext();
			context.isOpen = !context.isOpen;
		},
	},
});
