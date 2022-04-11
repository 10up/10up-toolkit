import './style.css';

export * from './hello-world';

export function sayIndex() {
	console.log('Hello from index.ts');
}

export interface MyInterface {
	name: string;
	value: string;
	object: {
		size: string;
	};
}

export * from 'xss';
