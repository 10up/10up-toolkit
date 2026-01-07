/**
 * Type definitions for @10up/build
 *
 * This module contains all TypeScript interfaces and types used throughout
 * the build tool. These types define the configuration schema, build results,
 * and internal data structures.
 *
 * @packageDocumentation
 * @module types
 */

import type { Plugin } from 'esbuild';

/**
 * Path configuration for source and output directories.
 *
 * These paths are relative to the project root (where package.json is located).
 *
 * @example
 * ```json
 * {
 *   "paths": {
 *     "blocksDir": "./includes/blocks/",
 *     "srcDir": "./assets/",
 *     "copyAssetsDir": "./assets/",
 *     "blocksStyles": "./assets/css/blocks/",
 *     "globalStylesDir": "./assets/css/globals/",
 *     "globalMixinsDir": "./assets/css/mixins/"
 *   }
 * }
 * ```
 */
export interface PathsConfig {
	/**
	 * Directory containing block.json files for WordPress blocks.
	 * The build tool recursively searches this directory for block metadata.
	 * @default "./includes/blocks/"
	 */
	blocksDir: string;

	/**
	 * Output directory for compiled assets.
	 * @default "./dist/"
	 */
	distDir: string;

	/**
	 * Source directory for JavaScript, TypeScript, and CSS assets.
	 * @default "./assets/"
	 */
	srcDir: string;

	/**
	 * Directory containing static assets (images, fonts, etc.) to copy to output.
	 * Files with extensions like .jpg, .png, .svg, .woff2 are automatically copied.
	 * @default "./assets/"
	 */
	copyAssetsDir: string;

	/**
	 * Directory containing block-specific stylesheets for auto-enqueue feature.
	 * Used when `loadBlockSpecificStyles` is enabled.
	 * @default "./assets/css/blocks/"
	 */
	blocksStyles: string;

	/**
	 * Directory containing global CSS files with custom properties and custom media queries.
	 * These files are injected into all stylesheets via postcss-global-data.
	 * @default "./assets/css/globals/"
	 */
	globalStylesDir: string;

	/**
	 * Directory containing PostCSS mixin definition files.
	 * Mixins defined here can be used in any stylesheet with `@mixin name;`.
	 * @default "./assets/css/mixins/"
	 */
	globalMixinsDir: string;
}

/**
 * Output filename patterns for generated assets.
 *
 * Supports placeholders:
 * - `[name]` - Entry point name
 * - `[dir]` - Directory structure from entry
 * - `[hash]` - Content hash for cache busting
 * - `[contenthash]` - Content-based hash
 *
 * @example
 * ```json
 * {
 *   "filenames": {
 *     "js": "js/[name].js",
 *     "css": "css/[name].css"
 *   }
 * }
 * ```
 */
export interface FilenamesConfig {
	/**
	 * Pattern for JavaScript output files.
	 * @default "js/[name].js"
	 */
	js: string;

	/**
	 * Pattern for JavaScript chunk files (code splitting).
	 * @default "js/[name].[contenthash].chunk.js"
	 */
	jsChunk: string;

	/**
	 * Pattern for CSS output files.
	 * @default "css/[name].css"
	 */
	css: string;

	/**
	 * Pattern for block JavaScript files.
	 * @default "blocks/[name].js"
	 */
	block: string;

	/**
	 * Pattern for block CSS files.
	 * @default "blocks/[name].css"
	 */
	blockCSS: string;
}

/**
 * Configuration for externalizing custom package namespaces.
 *
 * This allows you to externalize packages from custom npm scopes
 * (like @woocommerce/* or @your-plugin/*) similar to how @wordpress/*
 * packages are handled.
 *
 * @example
 * ```json
 * {
 *   "externalNamespaces": {
 *     "@woocommerce": {
 *       "global": "wc",
 *       "handlePrefix": "wc"
 *     }
 *   }
 * }
 * ```
 *
 * This would transform:
 * - `import { Button } from '@woocommerce/components'`
 * - To use global: `wc.components`
 * - With script handle: `wc-components`
 */
export interface ExternalNamespaceConfig {
	/**
	 * The global variable prefix where the package is available at runtime.
	 * For `@woocommerce/components`, if global is "wc", the runtime reference
	 * will be `wc.components`.
	 */
	global: string;

	/**
	 * The prefix for WordPress script handles.
	 * For `@woocommerce/components`, if handlePrefix is "wc", the handle
	 * will be `wc-components`.
	 */
	handlePrefix: string;
}

/**
 * Main build configuration object.
 *
 * This interface defines all configuration options available for the build tool.
 * Configuration is typically read from `package.json["10up-toolkit"]`.
 *
 * @example
 * ```json
 * {
 *   "10up-toolkit": {
 *     "entry": {
 *       "admin": "./assets/js/admin/admin.js"
 *     },
 *     "useBlockAssets": true,
 *     "wpDependencyExternals": true
 *   }
 * }
 * ```
 */
export interface BuildConfig {
	/**
	 * Entry points for scripts and styles.
	 * Keys become output filenames, values are source file paths.
	 *
	 * @example
	 * ```json
	 * {
	 *   "admin": "./assets/js/admin/admin.js",
	 *   "frontend": "./assets/js/frontend/frontend.js",
	 *   "admin-style": "./assets/css/admin/admin-style.scss"
	 * }
	 * ```
	 */
	entry: Record<string, string>;

	/**
	 * Entry points for ES modules.
	 * These are built with `format: 'esm'` and support code splitting.
	 *
	 * @example
	 * ```json
	 * {
	 *   "interactivity-module": "./assets/js/interactivity/module.ts"
	 * }
	 * ```
	 */
	moduleEntry: Record<string, string>;

	/**
	 * Path configuration for source and output directories.
	 * @see {@link PathsConfig}
	 */
	paths: PathsConfig;

	/**
	 * Output filename patterns.
	 * @see {@link FilenamesConfig}
	 */
	filenames: FilenamesConfig;

	/**
	 * Enable automatic entry detection from block.json files.
	 * When enabled, the build tool scans `paths.blocksDir` for block.json
	 * files and automatically creates entries for script/style assets.
	 * @default false
	 */
	useBlockAssets: boolean;

	/**
	 * Enable ES module output for script modules.
	 * When enabled, entries in `moduleEntry` are built as ES modules.
	 * @default false
	 */
	useScriptModules: boolean;

	/**
	 * Enable WordPress dependency externalization.
	 * When enabled:
	 * - @wordpress/* imports are externalized to WordPress globals
	 * - .asset.php files are generated with dependency arrays
	 * - Vendor packages (react, lodash, etc.) are also externalized
	 * @default true
	 */
	wpDependencyExternals: boolean;

	/**
	 * Enable automatic loading of block-specific stylesheets.
	 * Scans `paths.blocksStyles` for stylesheets matching core block names.
	 * @default false
	 */
	loadBlockSpecificStyles: boolean;

	/**
	 * Enable Hot Module Replacement in watch mode.
	 * Starts a WebSocket server for live reload notifications.
	 * @default false
	 */
	hot: boolean;

	/**
	 * Port for the HMR WebSocket server.
	 * @default 8887
	 */
	devServerPort: number;

	/**
	 * Development URL for the WordPress site.
	 * Used for proxy configuration in development mode.
	 * @default ""
	 */
	devURL: string;

	/**
	 * Generate source maps for debugging.
	 * Always enabled in development mode regardless of this setting.
	 * @default false
	 */
	sourcemap: boolean;

	/**
	 * Public path for assets (used in generated URLs).
	 * @default "/dist/"
	 */
	publicPath: string;

	/**
	 * Custom package namespaces to externalize.
	 * @see {@link ExternalNamespaceConfig}
	 */
	externalNamespaces: Record<string, ExternalNamespaceConfig>;

	/**
	 * PostCSS configuration (auto-detected).
	 * @see {@link PostCSSConfig}
	 */
	postcss?: PostCSSConfig;
}

/**
 * PostCSS configuration options.
 *
 * The build tool automatically detects postcss.config.js in the project root.
 * If not found, it uses the default configuration with global styles and mixins.
 */
export interface PostCSSConfig {
	/**
	 * Path to the PostCSS configuration file.
	 * If not specified, uses the default configuration.
	 */
	configPath?: string;

	/**
	 * Directory containing global CSS files.
	 * Overrides the default from paths.globalStylesDir.
	 */
	globalStylesDir?: string;

	/**
	 * Directory containing mixin definition files.
	 * Overrides the default from paths.globalMixinsDir.
	 */
	globalMixinsDir?: string;
}

/**
 * Detected entry points categorized by type.
 *
 * The entry detection process scans:
 * 1. `buildfiles.config.js` or `config.entry`
 * 2. `config.moduleEntry` for ES modules
 * 3. block.json files (if `useBlockAssets` is enabled)
 */
export interface DetectedEntries {
	/**
	 * Regular JavaScript/TypeScript entries (IIFE output).
	 * Key is the output name, value is the source file path.
	 */
	scripts: Record<string, string>;

	/**
	 * ES Module entries.
	 * Key is the output name, value is the source file path.
	 */
	modules: Record<string, string>;

	/**
	 * Standalone CSS/SCSS entries.
	 * Key is the output name, value is the source file path.
	 */
	styles: Record<string, string>;
}

/**
 * Result of resolving an external package.
 *
 * Used by the dependency extraction plugin to determine how to
 * externalize a package and track it as a dependency.
 */
export interface ExternalResolution {
	/**
	 * The global variable path where the package is available.
	 * For @wordpress/blocks, this would be "wp.blocks".
	 */
	global: string;

	/**
	 * The WordPress script handle for the package.
	 * For @wordpress/blocks, this would be "wp-blocks".
	 */
	handle: string;
}

/**
 * Dependency information for a single entry point.
 *
 * Used internally to track which WordPress packages are imported
 * by each entry point, for .asset.php generation.
 */
export interface DependencyInfo {
	/**
	 * Set of WordPress script handles that this entry depends on.
	 * Example: Set(['wp-blocks', 'wp-element', 'wp-i18n'])
	 */
	dependencies: Set<string>;

	/**
	 * Content hash for cache busting.
	 * Generated from the output file content.
	 */
	version: string;
}

/**
 * Result returned from the build function.
 *
 * Contains information about the build success, timing, and any errors.
 *
 * @example
 * ```typescript
 * const result = await build();
 * if (result.success) {
 *   console.log(`Built in ${result.duration}ms`);
 * } else {
 *   console.error('Build failed:', result.errors);
 * }
 * ```
 */
export interface BuildResult {
	/**
	 * Whether the build completed successfully.
	 */
	success: boolean;

	/**
	 * Build duration in milliseconds.
	 */
	duration: number;

	/**
	 * Count of entries built by type.
	 */
	entries: {
		/** Number of IIFE script entries built */
		scripts: number;
		/** Number of ES module entries built */
		modules: number;
		/** Number of stylesheet entries built */
		styles: number;
	};

	/**
	 * Error messages if the build failed.
	 * Only present when `success` is false.
	 */
	errors?: string[];
}

/**
 * Options for watch mode.
 *
 * @example
 * ```typescript
 * await watch({
 *   hot: true,
 *   port: 8887,
 *   onRebuild: (result) => {
 *     console.log('Rebuilt:', result.success);
 *   }
 * });
 * ```
 */
export interface WatchOptions {
	/**
	 * Enable Hot Module Replacement.
	 * When enabled, starts a WebSocket server for live reload.
	 * @default false (uses config.hot)
	 */
	hot?: boolean;

	/**
	 * Port for the HMR WebSocket server.
	 * @default 8887 (uses config.devServerPort)
	 */
	port?: number;

	/**
	 * Callback invoked after each rebuild.
	 * Useful for custom notifications or logging.
	 */
	onRebuild?: (result: BuildResult) => void;
}

/**
 * CLI command handler function type.
 *
 * Each CLI command (build, start, watch) is implemented as a handler
 * that receives command-line arguments and returns a Promise.
 *
 * @param args - Command-line arguments (excluding the command name)
 */
export type CommandHandler = (args: string[]) => Promise<void>;

/**
 * Map of CLI commands to their handlers.
 *
 * @see {@link CommandHandler}
 */
export interface Commands {
	/** Production build command */
	build: CommandHandler;
	/** Development mode with HMR */
	start: CommandHandler;
	/** Watch mode without HMR */
	watch: CommandHandler;
	/** Sync @wordpress dependencies from source imports */
	'sync-wp-deps': CommandHandler;
	/** Update @wordpress dependencies to a new version tag */
	'update-wp-deps': CommandHandler;
	/** List installed @wordpress dependencies */
	'list-wp-deps': CommandHandler;
	/** Cache wpScript flags for CI environments */
	'cache-wp-scripts': CommandHandler;
}

/**
 * WordPress block.json metadata structure.
 *
 * This interface represents the relevant fields from block.json
 * that the build tool uses for entry detection and transformation.
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/}
 *
 * @example
 * ```json
 * {
 *   "name": "my-plugin/my-block",
 *   "editorScript": "file:./index.js",
 *   "editorStyle": "file:./editor.css",
 *   "style": "file:./style.css",
 *   "viewScript": "file:./view.js",
 *   "viewScriptModule": "file:./view-module.js"
 * }
 * ```
 */
export interface BlockMetadata {
	/**
	 * Block name in namespace/block-name format.
	 */
	name?: string;

	/**
	 * Block version for cache busting.
	 * Auto-generated from style file hashes if not provided.
	 */
	version?: string;

	/**
	 * Script loaded on both editor and frontend.
	 * Can be a handle, URL, or file: path.
	 */
	script?: string | string[];

	/**
	 * Script loaded only in the editor.
	 * Typically the main block registration script.
	 */
	editorScript?: string | string[];

	/**
	 * Script loaded only on the frontend.
	 * For interactive functionality.
	 */
	viewScript?: string | string[];

	/**
	 * ES Module loaded on both editor and frontend.
	 * Used for WordPress Script Modules API.
	 */
	scriptModule?: string | string[];

	/**
	 * ES Module loaded only on the frontend.
	 * For WordPress Interactivity API usage.
	 */
	viewScriptModule?: string | string[];

	/**
	 * Stylesheet loaded on both editor and frontend.
	 */
	style?: string | string[];

	/**
	 * Stylesheet loaded only in the editor.
	 */
	editorStyle?: string | string[];

	/**
	 * Stylesheet loaded only on the frontend.
	 */
	viewStyle?: string | string[];
}

/**
 * Extended esbuild plugin interface with dependency tracking.
 *
 * Used by the WordPress dependency extraction plugin to expose
 * tracked dependencies for testing and debugging.
 */
export interface DependencyExtractionPlugin extends Plugin {
	/**
	 * Get all tracked dependencies across entry points.
	 * @returns Map of entry point paths to their dependency info
	 */
	getDependencies: () => Map<string, DependencyInfo>;
}
