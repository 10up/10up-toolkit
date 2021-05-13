import './style.css';

export * from './hello-world';

export interface MyInterface {
	name: string;
	value: string;
	object: {
		size: string;
	};
}
