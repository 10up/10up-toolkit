/**
 * Tests for block.json transformation
 */
import { describe, it, expect } from 'vitest';
import { transformBlockJson } from '../src/plugins/block-json.js';

describe('Block JSON Transformation', () => {
	describe('transformBlockJson', () => {
		it('should transform TypeScript paths to JavaScript', () => {
			const input = JSON.stringify({
				name: 'test/block',
				editorScript: 'file:./index.ts',
			});

			const result = JSON.parse(transformBlockJson(input, '/path/to/block.json'));
			expect(result.editorScript).toBe('file:./index.js');
		});

		it('should transform TSX paths to JavaScript', () => {
			const input = JSON.stringify({
				name: 'test/block',
				editorScript: 'file:./index.tsx',
			});

			const result = JSON.parse(transformBlockJson(input, '/path/to/block.json'));
			expect(result.editorScript).toBe('file:./index.js');
		});

		it('should transform SCSS paths to CSS', () => {
			const input = JSON.stringify({
				name: 'test/block',
				style: 'file:./style.scss',
				editorStyle: 'file:./editor.scss',
			});

			const result = JSON.parse(transformBlockJson(input, '/path/to/block.json'));
			expect(result.style).toBe('file:./style.css');
			expect(result.editorStyle).toBe('file:./editor.css');
		});

		it('should transform SASS paths to CSS', () => {
			const input = JSON.stringify({
				name: 'test/block',
				style: 'file:./style.sass',
			});

			const result = JSON.parse(transformBlockJson(input, '/path/to/block.json'));
			expect(result.style).toBe('file:./style.css');
		});

		it('should handle array asset fields', () => {
			const input = JSON.stringify({
				name: 'test/block',
				editorScript: ['file:./index.ts', 'file:./utils.tsx'],
				style: ['file:./style.scss', 'file:./additional.sass'],
			});

			const result = JSON.parse(transformBlockJson(input, '/path/to/block.json'));
			expect(result.editorScript).toEqual(['file:./index.js', 'file:./utils.js']);
			expect(result.style).toEqual(['file:./style.css', 'file:./additional.css']);
		});

		it('should not transform non-file: paths', () => {
			const input = JSON.stringify({
				name: 'test/block',
				editorScript: 'wp-block-editor',
				style: 'https://example.com/style.css',
			});

			const result = JSON.parse(transformBlockJson(input, '/path/to/block.json'));
			expect(result.editorScript).toBe('wp-block-editor');
			expect(result.style).toBe('https://example.com/style.css');
		});

		it('should preserve existing version', () => {
			const input = JSON.stringify({
				name: 'test/block',
				version: '1.0.0',
				editorScript: 'file:./index.ts',
			});

			const result = JSON.parse(transformBlockJson(input, '/path/to/block.json'));
			expect(result.version).toBe('1.0.0');
		});

		it('should handle all script asset fields', () => {
			const input = JSON.stringify({
				name: 'test/block',
				script: 'file:./script.ts',
				editorScript: 'file:./editor.tsx',
				viewScript: 'file:./view.ts',
				scriptModule: 'file:./module.ts',
				viewScriptModule: 'file:./view-module.tsx',
			});

			const result = JSON.parse(transformBlockJson(input, '/path/to/block.json'));
			expect(result.script).toBe('file:./script.js');
			expect(result.editorScript).toBe('file:./editor.js');
			expect(result.viewScript).toBe('file:./view.js');
			// ES modules should output as .mjs
			expect(result.scriptModule).toBe('file:./module.mjs');
			expect(result.viewScriptModule).toBe('file:./view-module.mjs');
		});

		it('should handle all style asset fields', () => {
			const input = JSON.stringify({
				name: 'test/block',
				style: 'file:./style.scss',
				editorStyle: 'file:./editor.scss',
				viewStyle: 'file:./view.scss',
			});

			const result = JSON.parse(transformBlockJson(input, '/path/to/block.json'));
			expect(result.style).toBe('file:./style.css');
			expect(result.editorStyle).toBe('file:./editor.css');
			expect(result.viewStyle).toBe('file:./view.css');
		});

		it('should preserve other block.json properties', () => {
			const input = JSON.stringify({
				apiVersion: 3,
				name: 'test/block',
				title: 'Test Block',
				category: 'common',
				icon: 'smiley',
				description: 'A test block',
				supports: {
					html: false,
					align: true,
				},
				attributes: {
					content: { type: 'string' },
				},
				editorScript: 'file:./index.ts',
			});

			const result = JSON.parse(transformBlockJson(input, '/path/to/block.json'));
			expect(result.apiVersion).toBe(3);
			expect(result.name).toBe('test/block');
			expect(result.title).toBe('Test Block');
			expect(result.category).toBe('common');
			expect(result.icon).toBe('smiley');
			expect(result.supports).toEqual({ html: false, align: true });
			expect(result.attributes).toEqual({ content: { type: 'string' } });
		});

		it('should return original content for invalid JSON', () => {
			const input = 'not valid json';
			const result = transformBlockJson(input, '/path/to/block.json');
			expect(result).toBe(input);
		});

		it('should return empty content as-is', () => {
			expect(transformBlockJson('', '/path/to/block.json')).toBe('');
			expect(transformBlockJson('   ', '/path/to/block.json')).toBe('   ');
		});
	});
});
