import { store } from '@wordpress/interactivity';

const { state } = store('frontend', {
	state: {
		isExpanded: false,
	},
	actions: {
		toggleExpanded() {
			state.isExpanded = !state.isExpanded;
		},
	},
});
