import { store } from '@wordpress/interactivity';

store('fixture/hello', {
	actions: {
		bump() {
			console.log('Hello block view script ran');
		},
	},
});
