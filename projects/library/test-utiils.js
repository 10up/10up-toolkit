import * as fs from 'fs';

export function render(html) {
	const container = document.createElement('div');
	container.innerHTML = html;
	document.body.appendChild(container);
	return { container };
}

export function injectCSS(cssfile) {
	const style = document.createElement('style');
	if (!fs.existsSync(cssfile)) {
		// eslint-disable-next-line no-console
		console.error('CSS file does not exist, perhaps you need to run the build command?');
	}
	style.innerHTML = fs.readFileSync(cssfile);
	document.body.appendChild(style);
	return style;
}
