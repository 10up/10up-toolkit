import { describe, test, expect, beforeAll, afterAll, vi } from 'vite-plus/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Spy before ../ (utils) loads: the utils destructure these at load time.
const crossSpawn = require('cross-spawn');
const packageModule = require('../package');

vi.spyOn(packageModule, 'getPackagePath');
vi.spyOn(packageModule, 'hasPackageProp');
vi.spyOn(packageModule, 'getPackage');
const processModule = require('../process');

vi.spyOn(processModule, 'exit');
vi.spyOn(processModule, 'getArgsFromCLI');
const fileModule = require('../file');

vi.spyOn(fileModule, 'hasProjectFile');
vi.spyOn(fileModule, 'fromProjectRoot');
vi.spyOn(fileModule, 'fromConfigRoot');

const { getPackagePath: getPackagePathMock } = packageModule;
const { exit: exitMock, getArgsFromCLI: getArgsFromCLIMock } = processModule;

const { hasArgInCLI, hasProjectFile, spawnScript } = require('..');

const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('utils', () => {
	const crossSpawnMock = vi.spyOn(crossSpawn, 'sync');

	describe('hasArgInCLI', () => {
		beforeAll(() => {
			getArgsFromCLIMock.mockReturnValue(['-a', '--b', '--config=test']);
		});

		afterAll(() => {
			getArgsFromCLIMock.mockReset();
		});

		test('should return false when no args passed', () => {
			getArgsFromCLIMock.mockReturnValueOnce([]);

			expect(hasArgInCLI('--no-args')).toBe(false);
		});

		test('should return false when checking for unrecognized arg', () => {
			expect(hasArgInCLI('--non-existent')).toBe(false);
		});

		test('should return true when CLI arg found', () => {
			expect(hasArgInCLI('-a')).toBe(true);
			expect(hasArgInCLI('--b')).toBe(true);
			expect(hasArgInCLI('--config')).toBe(true);
		});
	});

	describe('hasProjectFile', () => {
		test('should return false for the current directory and unknown file', () => {
			getPackagePathMock.mockReturnValueOnce(__dirname);

			expect(hasProjectFile('unknown-file.name')).toBe(false);
		});

		test('should return true for the current directory and this file', () => {
			getPackagePathMock.mockReturnValueOnce(__dirname);

			expect(hasProjectFile('index.js')).toBe(true);
		});
	});

	describe('spawnScript', () => {
		const scriptName = 'test-unit-js';

		beforeAll(() => {
			exitMock.mockImplementation((code) => {
				throw new Error(`Exit code: ${code}.`);
			});
		});

		afterAll(() => {
			exitMock.mockReset();
		});

		test('should exit when no script name provided', () => {
			expect(() => spawnScript()).toThrow('Exit code: 1.');
			expect(consoleLog).toHaveBeenCalledWith('Script name is missing.');
		});

		test('should exit when an unknown script name provided', () => {
			expect(() => spawnScript('unknown-script')).toThrow('Exit code: 1.');
			expect(consoleLog).toHaveBeenCalledWith(
				'Unknown script "unknown-script". Perhaps you need to update 10up-toolkit?',
			);
		});

		test('should exit when the script failed because of SIGKILL signal', () => {
			crossSpawnMock.mockReturnValueOnce({ signal: 'SIGKILL' });

			expect(() => spawnScript(scriptName)).toThrow('Exit code: 1.');
			expect(consoleLog).toHaveBeenCalled();
		});

		test('should exit when the script failed because of SIGTERM signal', () => {
			crossSpawnMock.mockReturnValueOnce({ signal: 'SIGTERM' });

			expect(() => spawnScript(scriptName)).toThrow('Exit code: 1.');
			expect(consoleLog).toHaveBeenCalled();
		});

		test('should pass inspect args to node', () => {
			crossSpawnMock.mockReturnValueOnce({ status: 0 });

			expect(() => spawnScript(scriptName, [], ['--inspect-brk'])).toThrow('Exit code: 0.');
			expect(crossSpawnMock).toHaveBeenCalledWith(
				'node',
				['--inspect-brk', expect.stringContaining(scriptName)],
				{ stdio: 'inherit' },
			);
		});

		test('should pass script args to the script', () => {
			crossSpawnMock.mockReturnValueOnce({ status: 0 });

			expect(() => spawnScript(scriptName, ['--runInBand'])).toThrow('Exit code: 0.');
			expect(crossSpawnMock).toHaveBeenCalledWith(
				'node',
				[expect.stringContaining(scriptName), '--runInBand'],
				{ stdio: 'inherit' },
			);
		});

		test('should finish successfully when the script properly executed', () => {
			crossSpawnMock.mockReturnValueOnce({ status: 0 });

			expect(() => spawnScript(scriptName)).toThrow('Exit code: 0.');
			expect(crossSpawnMock).toHaveBeenCalledWith(
				'node',
				[expect.stringContaining(scriptName)],
				{ stdio: 'inherit' },
			);
		});

		test('should finish successfully when the script properly executed with args', () => {
			crossSpawnMock.mockReturnValueOnce({ status: 0 });
			const args = ['-a', '--bbb', '-c=ccccc'];

			expect(() => spawnScript(scriptName, args)).toThrow('Exit code: 0.');
			expect(crossSpawnMock).toHaveBeenCalledWith(
				'node',
				[expect.stringContaining(scriptName), ...args],
				{ stdio: 'inherit' },
			);
		});
	});
});
