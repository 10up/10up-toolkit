interface MyInterface {
	name: string;
	value: number;
}

function helloTypeScript(name: string) {
	return `Hello ${name}, this is TypeScript!`;
}

export { MyInterface, helloTypeScript };
