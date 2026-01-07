/**
 * Tests for WordPress externals handling
 */
import { describe, it, expect } from 'vitest';
import {
	vendorExternals,
	wpPackageToHandle,
	wpPackageToGlobal,
	resolveExternal,
	getExternalPatterns,
} from '../src/utils/externals.js';
import type { BuildConfig } from '../src/types.js';

describe('WordPress Externals', () => {
	describe('vendorExternals', () => {
		it('should include React packages', () => {
			expect(vendorExternals.react).toEqual({ global: 'React', handle: 'react' });
			expect(vendorExternals['react-dom']).toEqual({ global: 'ReactDOM', handle: 'react-dom' });
			expect(vendorExternals['react/jsx-runtime']).toEqual({
				global: 'ReactJSXRuntime',
				handle: 'react-jsx-runtime',
			});
		});

		it('should include lodash packages', () => {
			expect(vendorExternals.lodash).toEqual({ global: 'lodash', handle: 'lodash' });
			expect(vendorExternals['lodash-es']).toEqual({ global: 'lodash', handle: 'lodash' });
		});

		it('should include moment', () => {
			expect(vendorExternals.moment).toEqual({ global: 'moment', handle: 'moment' });
		});

		it('should include jQuery', () => {
			expect(vendorExternals.jquery).toEqual({ global: 'jQuery', handle: 'jquery' });
		});
	});

	describe('wpPackageToHandle', () => {
		it('should convert @wordpress/blocks to wp-blocks', () => {
			expect(wpPackageToHandle('@wordpress/blocks')).toBe('wp-blocks');
		});

		it('should convert @wordpress/element to wp-element', () => {
			expect(wpPackageToHandle('@wordpress/element')).toBe('wp-element');
		});

		it('should convert @wordpress/i18n to wp-i18n', () => {
			expect(wpPackageToHandle('@wordpress/i18n')).toBe('wp-i18n');
		});

		it('should convert @wordpress/block-editor to wp-block-editor', () => {
			expect(wpPackageToHandle('@wordpress/block-editor')).toBe('wp-block-editor');
		});

		it('should convert @wordpress/interactivity to wp-interactivity', () => {
			expect(wpPackageToHandle('@wordpress/interactivity')).toBe('wp-interactivity');
		});
	});

	describe('wpPackageToGlobal', () => {
		it('should convert @wordpress/blocks to wp.blocks', () => {
			expect(wpPackageToGlobal('@wordpress/blocks')).toBe('wp.blocks');
		});

		it('should convert @wordpress/element to wp.element', () => {
			expect(wpPackageToGlobal('@wordpress/element')).toBe('wp.element');
		});

		it('should convert @wordpress/block-editor to wp.blockEditor (camelCase)', () => {
			expect(wpPackageToGlobal('@wordpress/block-editor')).toBe('wp.blockEditor');
		});

		it('should convert @wordpress/dom-ready to wp.domReady (camelCase)', () => {
			expect(wpPackageToGlobal('@wordpress/dom-ready')).toBe('wp.domReady');
		});
	});

	describe('resolveExternal', () => {
		const baseConfig: Partial<BuildConfig> = {
			externalNamespaces: {},
		};

		it('should resolve vendor externals', () => {
			expect(resolveExternal('react', baseConfig)).toEqual({
				global: 'React',
				handle: 'react',
			});
			expect(resolveExternal('react-dom', baseConfig)).toEqual({
				global: 'ReactDOM',
				handle: 'react-dom',
			});
			expect(resolveExternal('lodash', baseConfig)).toEqual({
				global: 'lodash',
				handle: 'lodash',
			});
		});

		it('should resolve @wordpress packages', () => {
			const result = resolveExternal('@wordpress/blocks', baseConfig);
			// Use toMatchObject to ignore _isInstalled which is an implementation detail
			expect(result).toMatchObject({
				global: 'wp.blocks',
				handle: 'wp-blocks',
			});
		});

		it('should resolve @wordpress/block-editor with camelCase', () => {
			const result = resolveExternal('@wordpress/block-editor', baseConfig);
			expect(result).toMatchObject({
				global: 'wp.blockEditor',
				handle: 'wp-block-editor',
			});
		});

		it('should return null for unknown packages', () => {
			expect(resolveExternal('some-random-package', baseConfig)).toBeNull();
			expect(resolveExternal('@unknown/package', baseConfig)).toBeNull();
		});

		describe('with custom external namespaces', () => {
			const configWithNamespaces: Partial<BuildConfig> = {
				externalNamespaces: {
					'@woocommerce': {
						global: 'wc',
						handlePrefix: 'wc',
					},
					'@my-plugin': {
						global: 'myPlugin',
						handlePrefix: 'my-plugin',
					},
				},
			};

			it('should resolve @woocommerce packages', () => {
				const result = resolveExternal('@woocommerce/components', configWithNamespaces);
				expect(result).toEqual({
					global: 'wc.components',
					handle: 'wc-components',
				});
			});

			it('should resolve @woocommerce/data with camelCase', () => {
				const result = resolveExternal('@woocommerce/csv-export', configWithNamespaces);
				expect(result).toEqual({
					global: 'wc.csvExport',
					handle: 'wc-csv-export',
				});
			});

			it('should resolve custom plugin namespace', () => {
				const result = resolveExternal('@my-plugin/utils', configWithNamespaces);
				expect(result).toEqual({
					global: 'myPlugin.utils',
					handle: 'my-plugin-utils',
				});
			});

			it('should still resolve @wordpress packages with custom namespaces', () => {
				const result = resolveExternal('@wordpress/blocks', configWithNamespaces);
				expect(result).toMatchObject({
					global: 'wp.blocks',
					handle: 'wp-blocks',
				});
			});

			it('should resolve packages with multiple hyphens correctly', () => {
				const result = resolveExternal(
					'@woocommerce/product-editor-component',
					configWithNamespaces,
				);
				expect(result).toEqual({
					global: 'wc.productEditorComponent',
					handle: 'wc-product-editor-component',
				});
			});

			it('should resolve single-word package names', () => {
				const result = resolveExternal('@woocommerce/data', configWithNamespaces);
				expect(result).toEqual({
					global: 'wc.data',
					handle: 'wc-data',
				});
			});

			it('should not resolve bare namespace without sub-package', () => {
				const result = resolveExternal('@woocommerce', configWithNamespaces);
				expect(result).toBeNull();
			});

			it('should not resolve packages from unregistered namespaces', () => {
				const result = resolveExternal('@unregistered/package', configWithNamespaces);
				expect(result).toBeNull();
			});

			it('should still resolve vendor externals with custom namespaces', () => {
				expect(resolveExternal('react', configWithNamespaces)).toEqual({
					global: 'React',
					handle: 'react',
				});
				expect(resolveExternal('lodash', configWithNamespaces)).toEqual({
					global: 'lodash',
					handle: 'lodash',
				});
			});
		});

		describe('with agency namespace configuration', () => {
			const agencyConfig: Partial<BuildConfig> = {
				externalNamespaces: {
					'@10up': {
						global: 'tenUp',
						handlePrefix: '10up',
					},
					'@developer': {
						global: 'dev',
						handlePrefix: 'developer',
					},
				},
			};

			it('should resolve @10up packages with numeric prefix', () => {
				const result = resolveExternal('@10up/block-components', agencyConfig);
				expect(result).toEqual({
					global: 'tenUp.blockComponents',
					handle: '10up-block-components',
				});
			});

			it('should resolve multiple packages from same namespace', () => {
				const utils = resolveExternal('@10up/utils', agencyConfig);
				const hooks = resolveExternal('@10up/hooks', agencyConfig);
				const components = resolveExternal('@10up/components', agencyConfig);

				expect(utils).toEqual({ global: 'tenUp.utils', handle: '10up-utils' });
				expect(hooks).toEqual({ global: 'tenUp.hooks', handle: '10up-hooks' });
				expect(components).toEqual({ global: 'tenUp.components', handle: '10up-components' });
			});

			it('should handle different global naming conventions', () => {
				const result = resolveExternal('@developer/api-client', agencyConfig);
				expect(result).toEqual({
					global: 'dev.apiClient',
					handle: 'developer-api-client',
				});
			});
		});

		describe('edge cases for external namespaces', () => {
			it('should handle empty externalNamespaces object', () => {
				const result = resolveExternal('@custom/package', { externalNamespaces: {} });
				expect(result).toBeNull();
			});

			it('should handle undefined externalNamespaces', () => {
				const result = resolveExternal('@custom/package', {});
				expect(result).toBeNull();
			});

			it('should prioritize @wordpress over custom namespaces', () => {
				const configWithWordPressOverride: Partial<BuildConfig> = {
					externalNamespaces: {
						'@wordpress': {
							global: 'customWp',
							handlePrefix: 'custom-wp',
						},
					},
				};
				// @wordpress packages should still use the built-in resolution
				const result = resolveExternal('@wordpress/blocks', configWithWordPressOverride);
				expect(result).toMatchObject({
					global: 'wp.blocks',
					handle: 'wp-blocks',
				});
			});

			it('should handle namespace with trailing slash in package name', () => {
				const config: Partial<BuildConfig> = {
					externalNamespaces: {
						'@test': { global: 'test', handlePrefix: 'test' },
					},
				};
				// This tests internal handling - the slash after namespace is expected
				const result = resolveExternal('@test/my-component', config);
				expect(result).toEqual({
					global: 'test.myComponent',
					handle: 'test-my-component',
				});
			});
		});
	});

	describe('getExternalPatterns', () => {
		it('should include all vendor externals', () => {
			const patterns = getExternalPatterns();
			expect(patterns).toContain('react');
			expect(patterns).toContain('react-dom');
			expect(patterns).toContain('lodash');
			expect(patterns).toContain('jquery');
		});

		it('should include @wordpress/* pattern', () => {
			const patterns = getExternalPatterns();
			expect(patterns).toContain('@wordpress/*');
		});

		it('should include custom namespace patterns', () => {
			const patterns = getExternalPatterns({
				externalNamespaces: {
					'@woocommerce': { global: 'wc', handlePrefix: 'wc' },
					'@my-plugin': { global: 'myPlugin', handlePrefix: 'my-plugin' },
				},
			});
			expect(patterns).toContain('@woocommerce/*');
			expect(patterns).toContain('@my-plugin/*');
		});
	});
});
