import path from 'path';
import { transformBlockJson } from '../blocks';
import { getFileContentHash as getFileContentHashMock } from '../file';

jest.mock('../file', () => {
	const module = jest.requireActual('../file');

	jest.spyOn(module, 'getFileContentHash');

	return module;
});

describe('transformBlockJson', () => {
	const absoluteteFileName = path.join('dist', 'blocks', 'block.json');

	it('does nothing if version is set', () => {
		expect(
			transformBlockJson(
				JSON.stringify({
					version: 1,
					style: 'file:./style.css',
				}),
				absoluteteFileName,
			),
		).toEqual(JSON.stringify({ version: 1, style: 'file:./style.css' }, null, 2));
	});

	it('does nothing if style is not set', () => {
		expect(
			transformBlockJson(
				JSON.stringify({
					script: 'file:./script.js',
				}),
				absoluteteFileName,
			),
		).toEqual(
			JSON.stringify(
				{
					script: 'file:./script.js',
				},
				null,
				2,
			),
		);
	});

	it('does nothing if style does not start with file:', () => {
		expect(
			transformBlockJson(
				JSON.stringify({
					style: 'style.css',
				}),
				absoluteteFileName,
			),
		).toEqual(JSON.stringify({ style: 'style.css' }, null, 2));

		expect(
			transformBlockJson(
				JSON.stringify({
					style: ['another-css', 'style.css'],
				}),
				absoluteteFileName,
			),
		).toEqual(JSON.stringify({ style: ['another-css', 'style.css'] }, null, 2));
	});

	it('adds version if style are set but version is not', () => {
		getFileContentHashMock.mockReturnValue('12345678');

		expect(
			transformBlockJson(
				JSON.stringify({
					style: 'file:./style.css',
				}),
				absoluteteFileName,
			),
		).toEqual(
			JSON.stringify(
				{
					style: 'file:./style.css',
					version: '12345678',
				},
				null,
				2,
			),
		);

		expect(getFileContentHashMock).toHaveBeenCalledWith(
			path.join('dist', 'blocks', 'style.css'),
		);

		expect(
			transformBlockJson(
				JSON.stringify({
					style: ['another-style', 'file:./style2.css'],
				}),
				absoluteteFileName,
			),
		).toEqual(
			JSON.stringify(
				{
					style: ['another-style', 'file:./style2.css'],
					version: '12345678',
				},
				null,
				2,
			),
		);

		expect(getFileContentHashMock).toHaveBeenCalledWith(
			path.join('dist', 'blocks', 'style2.css'),
		);
	});

	it('transforms ts and tsx to js', () => {
		expect(
			transformBlockJson(
				JSON.stringify({
					script: 'file:./script.ts',
					editorScript: 'file:./editor.tsx',
					viewScript: 'file:./view.ts',
					viewScriptModule: 'file:./view.tsx',
					scriptModule: 'file:./script.tsx',
				}),
				absoluteteFileName,
			),
		).toEqual(
			JSON.stringify(
				{
					script: 'file:./script.js',
					editorScript: 'file:./editor.js',
					viewScript: 'file:./view.js',
					viewScriptModule: 'file:./view.js',
					scriptModule: 'file:./script.js',
				},
				null,
				2,
			),
		);
		expect(
			transformBlockJson(
				JSON.stringify({
					script: ['file:./script.ts', 'file:./script.tsx'],
					editorScript: ['file:./editor.ts', 'file:./editor.tsx'],
					viewScript: ['file:./view.ts', 'file:./view.tsx'],
					viewScriptModule: ['file:./view.tsx', 'file:./view.ts'],
					scriptModule: ['file:./script.ts', 'file:./script.tsx'],
				}),
				absoluteteFileName,
			),
		).toEqual(
			JSON.stringify(
				{
					script: ['file:./script.js', 'file:./script.js'],
					editorScript: ['file:./editor.js', 'file:./editor.js'],
					viewScript: ['file:./view.js', 'file:./view.js'],
					viewScriptModule: ['file:./view.js', 'file:./view.js'],
					scriptModule: ['file:./script.js', 'file:./script.js'],
				},
				null,
				2,
			),
		);
	});
});
