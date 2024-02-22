import { store } from '@wordpress/interactivity';

store('example', {
	actions: {
		toggle: () => {
			console.log('Hello, world!');
		},
	},
});

console.log('Loaded');
