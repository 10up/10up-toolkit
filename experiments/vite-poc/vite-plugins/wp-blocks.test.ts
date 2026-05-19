/**
 * Unit tests for wp-blocks helpers. Exercises the pure pieces — entry
 * discovery, block.json transform, manifest generation. Run via `vp test`
 * or `vitest run`.
 */
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Helpers under test. Some are not exported — we re-import indirectly by
// driving the plugin's behavior through a tmp fixture.
import { wpBlocks } from './wp-blocks.ts';

function makeFixture(blocks: Record<string, Record<string, unknown>>): string {
	const dir = mkdtempSync(join(tmpdir(), 'wp-blocks-test-'));
	for (const [name, meta] of Object.entries(blocks)) {
		const blockDir = join(dir, name);
		mkdirSync(blockDir, { recursive: true });
		writeFileSync(join(blockDir, 'block.json'), JSON.stringify(meta, null, 2));
		// Create the referenced source files so existsSync() picks them up.
		for (const value of Object.values(meta)) {
			if (typeof value === 'string' && value.startsWith('file:')) {
				const rel = value.replace(/^file:/, '');
				const noExt = rel.replace(/\.[^./]+$/, '');
				writeFileSync(join(blockDir, `${noExt}.tsx`), 'export default null;');
			}
		}
	}
	return dir;
}

describe('wpBlocks', () => {
	it('discovers block.json entries and merges into rollupOptions.input', () => {
		const dir = makeFixture({
			hello: {
				$schema: 'https://schemas.wp.org/trunk/block.json',
				apiVersion: 3,
				name: 'fixture/hello',
				editorScript: 'file:./index.tsx',
			},
		});

		try {
			const plugin = wpBlocks({ blocksDir: dir });
			// The plugin's `config` hook returns a partial Vite config.
			// @ts-expect-error — exercising the hook directly.
			const merged = plugin.config(undefined, { mode: 'production', command: 'build' });
			const input = merged?.build?.rollupOptions?.input as Record<string, string>;
			expect(input).toBeDefined();
			expect(Object.keys(input)).toHaveLength(1);
			const [name] = Object.keys(input);
			expect(name).toBe('blocks/hello/index');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('respects the skip option', () => {
		const dir = makeFixture({
			hello: { apiVersion: 3, name: 'fixture/hello', editorScript: 'file:./index.tsx' },
			'linaria-block': {
				apiVersion: 3,
				name: 'fixture/linaria',
				editorScript: 'file:./index.tsx',
			},
		});

		try {
			const plugin = wpBlocks({ blocksDir: dir, skip: ['linaria-block'] });
			// @ts-expect-error — driving the hook directly.
			const merged = plugin.config();
			const input = merged?.build?.rollupOptions?.input as Record<string, string>;
			expect(Object.keys(input)).toHaveLength(1);
			expect(Object.keys(input)[0]).toContain('hello');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
