import '../../css/frontend/style.css';
import { Component } from './components/component-1';

function helloTypeScript(name: string) {
	return `Hello ${name}, this is TypeScript!`;
}

Component();

document.write(helloTypeScript('10up'));
