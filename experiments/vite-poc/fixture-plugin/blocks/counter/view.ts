import { store, getContext } from '@wordpress/interactivity';

interface CounterContext {
	count: number;
}

store('fixture/counter', {
	actions: {
		increment() {
			const ctx = getContext<CounterContext>();
			ctx.count += 2;
		},
		decrement() {
			const ctx = getContext<CounterContext>();
			ctx.count -= 2;
		},
		reset() {
			const ctx = getContext<CounterContext>();
			ctx.count = 0;
		},
	},
});
