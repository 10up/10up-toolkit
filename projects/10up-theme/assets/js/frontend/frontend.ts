import { Accordion } from '@10up/component-accordion';

function helloTypeScript(name: string) {
	return `Hello ${name}, this is TypeScript!`;
}

document.write(helloTypeScript('10up'));

new Accordion('.test', {});
