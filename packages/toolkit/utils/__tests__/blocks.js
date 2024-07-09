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
		).toEqual(JSON.stringify({ version: 1, style: 'file:./style.css' }));
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
			JSON.stringify({
				script: 'file:./script.js',
			}),
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
		).toEqual(JSON.stringify({ style: 'style.css' }));

		expect(
			transformBlockJson(
				JSON.stringify({
					style: ['another-css', 'style.css'],
				}),
				absoluteteFileName,
			),
		).toEqual(JSON.stringify({ style: ['another-css', 'style.css'] }));
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
});
