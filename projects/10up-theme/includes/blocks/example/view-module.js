import { store } from '@wordpress/interactivity';

store('example', {
	actions: {
		toggle: () => {
			// eslint-disable-next-line no-console
			console.log('Toggle Action');
		},
	},
});

// eslint-disable-next-line no-console
console.log('View Module Loaded');
