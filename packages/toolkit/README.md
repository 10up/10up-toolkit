# 10up-toolkit

A collection of bundled scripts for 10up development.

1. [Introduction](#introduction)
2. [Authoring Projects](#projects)
3. [HMR and Fast Refresh](#fast-refresh)
4. [Linting](#linting)
5. [Authoring Libraries](#libraries)
6. [Customizations](#customizations)
7. [CLI Options](#cli)
8. [10up Projects](PROJECTS.md)
9. [TypeScript Support](#typescript)
10. [React & WordPress](#react)

## <a id="introduction"></a>Introduction

10up-toolkit is 10up's official asset bundling tool. Since version 8 it runs on [Vite+](https://viteplus.dev) (Vite 8 with the Rolldown bundler) and [`@10up/wp-vite-plugins`](https://github.com/10up/wp-vite-plugins). It comes with support for many things commonly used across 10up's projects such as:

- JavaScript, TypeScript and JSX (including JSX in `.js` files)
- `block.json` asset discovery, `.asset.php` dependency files and the blocks manifest
- Script Modules and the Interactivity API
- PostCSS and Sass
- A Vite dev server with hot reloading for WordPress
- Oxlint, Oxfmt and Stylelint
- Vitest

With 10up-toolkit, engineers can quickly and easily bundle assets for both production and development without having
to worry about config files. The `"10up-toolkit"` config in `package.json` works as it did in version 7, and the
dist layout stays the same. **Upgrading from version 7? Read [UPGRADING.md](./UPGRADING.md).**

`10up-toolkit` is inspired in tools like `react-scripts`, `kcd-scripts` and `wp-scripts`.

### Installation

To install 10up-toolkit simply run

```bash{showPrompt}
npm install --save-dev 10up-toolkit
```

Version 8 requires Node.js `^22.18.0` or `>=24.11.0`, the versions Vite+ supports.

### Setting it up

In order to get `10up-toolkit` up and running simply define the `source` and `main` properties in your `package.json` file.
You can also specify a `style` property to tell `10up-toolkit` where to output your compiled css.

```json
{
	"name": "your-package-name",
	"version": "1.0.0",
	"main": "./dist/index.js",
	"source": "./src/index.js",
	"style": "./dist/index.css",
	"scripts": {
		"build": "10up-toolkit build",
		"dev": "10up-toolkit build --watch"
	}
}
```

Then, the following code:

```javascript
// src/index.js
import "./styles.css";

export default () => {
	/* my awesome js code */
};
```

will generate a `index.js` and a `index.css` file in the `dist` folder after running `npm run build`.

10up-toolkit can run in two different modes: package mode and project mode:

- **Project Mode**: Allows bundling multiple entry points and automatically includes core-js polyfills.
- **Package Mode**: Does not include core-js polyfills automatically, assumes one entry point and doesn't include dependencies in the bundle.

By default, it will run in package mode (like in the example above) and it works
well when you're building a package for distribution.

## <a id="projects"></a>Authoring Projects

When running in **project mode** 10up-toolkit will automatically inject core-js polyfills and also allow for multiple entry points.

10up's [wp-scaffold](https://github.com/10up/wp-scaffold/blob/trunk/themes/10up-theme/package.json) is a good example of 10up-toolkit being used in project mode.

Here's how a `package.json` would look like for using 10up-toolkit this way:

```json
{
	"name": "tenup-theme",
	"version": "1.0.0",
	"scripts": {
		"start": "10up-toolkit build --watch",
		"build": "10up-toolkit build",
		"format-js": "10up-toolkit format-js",
		"lint-js": "10up-toolkit lint-js",
		"lint-style": "10up-toolkit lint-style",
		"test": "10up-toolkit test"
	},
	"devDependencies": {
		"10up-toolkit": "^1.0.0"
	},
	"dependencies": {
		"normalize.css": "^8.0.1",
		"prop-types": "^15.7.2"
	},
	"10up-toolkit": {
		"devURL": "https://my-project.test",
		"entry": {
			"admin": "./assets/js/admin/admin.js",
			"blocks": "./includes/blocks/blocks.js",
			"frontend": "./assets/js/frontend/frontend.js",
			"shared": "./assets/js/shared/shared.js",
			"styleguide": "./assets/js/styleguide/styleguide.js",
			"admin-style": "./assets/css/admin/admin-style.css",
			"editor-style": "./assets/css/frontend/editor-style.css",
			"shared-style": "./assets/css/shared/shared-style.css",
			"style": "./assets/css/frontend/style.css",
			"styleguide-style": "./assets/css/styleguide/styleguide.css",
			"core-block-overrides": "./includes/core-block-overrides.js",
			"example-block": "./includes/blocks/example-block/index.js"
		}
	}
}
```

Note the `10up-toolkit` object in `package.json`. It exposes a few options to configure 10up-toolkit behavior.
The most important is the `entry` option. It's an object where you can specify all the entry points you need in your project. You can specify both JavaScript/TypeScript files or CSS/PostCSS/SASS files.

When you run `10up-toolkit build` with this configuration, 10up-toolkit will generate compiled assets for every entry point in the dist folder.

By default, the compiled assets will be generated on the following directories:

- `dist/css` - for all CSS files
- `dist/js` - for all JS files.
- `dist/blocks` - for all WordPress Gutenberg blocks.
- `dist/[images,fonts,svg]` - all assets under `assets/images`, `asset/fonts` and `assets/svg` with the following extensions `jpg,jpeg,png,gif,ico,svg,eot,ttf,woff,woff2,otf` are copied, even those not referenced in code (this behavior is specific to building in project mode).

See the [Customizing build paths](#customize-build-paths) section for changing the structure of the dist folder.

### <a id="customize-build-paths"></a> Customizing build paths

To change where assets are generated in the `dist` folder, you can create a `filenames.config.js` at the root of your project.

```javascript
// filenames.config.js
module.exports = {
	js: "js/[name].js",
	jsChunk: "js/[name].[contenthash].chunk.js",
	css: "css/[name].css",
	// changing where gutenberg blocks assets are stored.
	block: "js/blocks/[name]/editor.js",
	blockCSS: "css/blocks/[name]/editor.css",
};
```

Alternatively you can specify the paths in `package.json`

```json
"10up-toolkit": {
	"devURL": "https://my-project.test",
	"entry": {
		//...
	},
	"filenames": {
		"block": "js/blocks/[name]/editor.js",
		"blockCSS": "css/blocks/[name]/editor.css",
	}
}
```

Note that when overriding via the `filenames.config.js` you must export the filenames for all file types.

### <a id="customize-public-path"></a> Customizing public path

When using toolkit in a React application, you might want to customize the public path so lazy loaded components know where the assets are.

This can be tweaked in the options within `package.json`:

```json
"10up-toolkit": {
	"publicPath": "/my/custom/path"
}
```

Alternatively, you can set up `process.env.ASSET_PATH` to whatever path (or CDN) you want it to be.

> **Warning**
> Please note that using `process.env.ASSET_PATH` will override the `publicPath`

### WordPress Block Asset Handling

_NOTE: Since 10up-toolkit@6 this `useBlockAssets` is on by default_

If your project includes blocks there are quite a few assets that need to be added to the list of entry points. This can get quite cumbersome and repetitive. To make this easier toolkit has a special mode where it scans the source path for any `block.json` files and automatically adds any assets that are defined in there via the `script`, `editorScript`, `viewScript`, `style`, `editorStyle` keys. `scriptModule` and `viewScriptModule` assets build in a second pass as Script Modules.

It also automatically moves all files including the `block.json` and PHP files to the `dist/blocks/` folder.

Since 10up-toolkit@6 this mode is on by default. To opt out of this mode you need to set the `useBlockAssets` option to your toolkit configuration to false:

```json
"10up-toolkit": {
    "devURL": "https://my-project.test",
    "useBlockAssets": false
}
```

By default, the source directory for blocks is `./includes/blocks/`. This can be customized via the `blocksDir` key in the paths' config.

### WordPress Block Metadata Collections

WordPress 6.7 introduced the [Block Metadata Collections API](https://make.wordpress.org/core/2024/10/17/new-block-type-registration-apis-to-improve-performance-in-wordpress-6-7/), which significantly improves block registration performance by reading metadata from a single PHP manifest file instead of multiple `block.json` files.

10up-toolkit can automatically generate this manifest file during the build process. When enabled, it scans all built blocks in `dist/blocks/` and creates a `blocks-manifest.php` file containing all block metadata.

#### Enabling Block Manifest Generation

Enable via package.json configuration (always generates manifest):

```json
{
  "10up-toolkit": {
    "useBlockAssets": true,
    "useBlockManifest": true
  }
}
```

Or use the CLI flag for one-time generation:

```bash
10up-toolkit build --block-manifest
10up-toolkit start --block-manifest
10up-toolkit watch --block-manifest
```

#### WordPress Integration

Once the manifest is generated, register the collection and your block types. Add this to your theme's `functions.php` or plugin entry point.

**Recommended approach (automatic registration):**

```php
// Register the block metadata collection
$blocks_dir = get_template_directory() . '/dist/blocks';
$manifest_path = get_template_directory() . '/dist/blocks-manifest.php';

wp_register_block_metadata_collection( $blocks_dir, $manifest_path );

// Automatically register all blocks from the manifest
$manifest = require $manifest_path;
foreach ( array_keys( $manifest ) as $block_dir ) {
    register_block_type_from_metadata( $blocks_dir . '/' . $block_dir );
}
```

**For plugins:**

```php
// Register the block metadata collection
$blocks_dir = plugin_dir_path( __FILE__ ) . 'dist/blocks';
$manifest_path = plugin_dir_path( __FILE__ ) . 'dist/blocks-manifest.php';

wp_register_block_metadata_collection( $blocks_dir, $manifest_path );

// Automatically register all blocks from the manifest
$manifest = require $manifest_path;
foreach ( array_keys( $manifest ) as $block_dir ) {
    register_block_type_from_metadata( $blocks_dir . '/' . $block_dir );
}
```

**Manual registration (if you need more control):**

```php
wp_register_block_metadata_collection(
    get_template_directory() . '/dist/blocks',
    get_template_directory() . '/dist/blocks-manifest.php'
);

// Register specific blocks only
register_block_type_from_metadata( get_template_directory() . '/dist/blocks/example-block' );
register_block_type_from_metadata( get_template_directory() . '/dist/blocks/another-block' );
```

The `wp_register_block_metadata_collection()` function tells WordPress about the manifest file. WordPress will then use the manifest data when you register individual block types with `register_block_type_from_metadata()`, avoiding the need to read each `block.json` file separately. The automatic registration approach loops through all blocks in the manifest, making it easier to maintain as you add or remove blocks.

#### How It Works

The manifest generation integrates seamlessly with the existing build pipeline:

1. Vite builds all blocks (TypeScript, SCSS, etc.)
2. `@10up/wp-vite-plugins` copies `block.json` files to `dist/blocks/` and rewrites asset paths (`.ts` → `.js`, `.scss` → `.css`)
3. BuildBlocksManifestPlugin scans `dist/blocks/` for all transformed `block.json` files
4. Generates `dist/blocks-manifest.php` containing all block metadata with the already-transformed asset paths

In watch mode, the manifest automatically regenerates whenever block files change, preserving any path transformations from the build process.

#### Performance Benefits

The Block Metadata Collections API provides significant performance improvements:

- Reduced filesystem I/O operations
- Better opcode caching for block metadata
- Single file read instead of multiple `block.json` files
- Particularly beneficial for projects with 50+ blocks

The manifest file structure matches WordPress's expectations, with block identifiers (directory names) as keys and complete block metadata as values.

### WordPress Script Module Handling

Since WordPress 6.5 ESM scripts are now officially supported. In fact, they are required in order to use some new features such as the Interactivity API. In WordPress these script modules need to coexist with commonJs scripts though. So it's not as easy as just switching the entire toolkit mode to output ESM instead of commonJS.

Since Toolkit 6.1 it is possible to enable `useScriptModules` in the toolkit config. This mode allows you to have both CommonJS and ESM scripts at the same time. Any existing entrypoints will continue to work as before. But a new `moduleEntry` key now allows for adding any additional ESM entrypoints to the toolkit config. Additionally any `scriptModule` & `viewScriptModule` files references inside `block.json` files will also get picked up and built as ESM scripts.

### WordPress Editor Styles

By default, 10up-toolkit will scope any css file named `editor-style.css` files with the
`.editor-styles-wrapper` class. Take a look at the default [postcss config](https://github.com/10up/10up-toolkit/blob/develop/packages/toolkit/config/postcss.config.js#L21) for more information.

## Handling of Global postCSS settings

With the introduction of block-specific stylesheets, we've started to break out our CSS from one bog monolithic `frontend.css` file into smaller individual files that only get loaded when the specific block is used on the page.

One downside to this approach however was that any postcss globals such as custom media queries, custom selectors, variables, and mixins defined in the main css file are not available to all the other block-specific stylesheets.

To fix this 10up-toolkit 6.1 introduces a new way to handle these global settings. There are now two special folders that toolkit watches for. `./assets/css/globals/` and `./assets/css/mixins/`. Any CSS files within these folders or nested within these folders get automatically loaded for all CSS files toolkit builds. So if you define your custom breakpoints in a `./assets/css/globals/breakpoints.css` file that breakpoint will be available everywhere.

> [!WARNING]
> Please note that [PostCSS Global Data](https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-global-data) does not add anything to the output of your CSS. It only injects data into PostCSS so that other plugins can actually use it.

If you need to customize the path of these global folders you can do so by modifying the `paths` in the tookit config.

```json
{
	"10up-toolkit": {
		"paths": {
			"globalStylesDir": "./assets/css/globals/",
			"globalMixinsDir": "./assets/css/mixins/"
		}
	}
}
```

## <a id="fast-refresh"></a>Dev server and hot reloading

`10up-toolkit start --hot` (or `10up-toolkit dev`) starts a Vite dev server instead of rebuilding files. Every build
writes `dist/dev-server.php`. Load it from your theme's `functions.php` or your plugin's entry point:

```php
if ( file_exists( __DIR__ . '/dist/dev-server.php' ) ) {
	require_once __DIR__ . '/dist/dev-server.php';
}
```

While the dev server runs, that file points WordPress's script, style and Script Module URLs at it. CSS changes apply
without a reload. When the dev server stops, WordPress loads the built files again, so the file is safe to ship.

The dev server listens on port 8000 by default. Change it with `--port`:

```
10up-toolkit start --hot --port=5010
```

Projects set up for version 7 load `dist/fast-refresh.php` and call `TenUpToolkit\set_dist_url_path()`. Version 8
still writes that file as a shim that loads `dev-server.php`, so that code keeps working. Replace it with the snippet
above when you can.

If WordPress runs on a different host than the dev server (Docker, a `.test` domain over https), set `server.origin`
and `server.cors` in a project `vite.config.mjs` (see [Customizing the Vite config](#customizations)). The
[`wpDevServer` documentation](https://github.com/10up/wp-vite-plugins/blob/trunk/docs/wp-dev-server.md) covers every
setup.

## <a id="linting"></a> Linting

10up-toolkit lints JavaScript and TypeScript with [Oxlint](https://oxc.rs/docs/guide/usage/linter), formats it with
[Oxfmt](https://oxc.rs/docs/guide/usage/formatter), and lints CSS with Stylelint and
[10up's stylelint config](https://github.com/10up/10up-toolkit/tree/develop/packages/stylelint-config). Oxlint and
Oxfmt ship with Vite+, so there is nothing else to install.

```json
{
    "scripts": {
        "lint-js": "10up-toolkit lint-js",
        "format-js": "10up-toolkit format-js",
        "lint-style": "10up-toolkit lint-style"
    }
}
```

Which config each command uses:

| Command | Project has a `vite.config.*` | Project has its own tool config | Neither |
| --- | --- | --- | --- |
| `lint-js` | `vp lint` (the `lint` block) | `.oxlintrc.json` | toolkit's `config/oxlintrc.json` |
| `format-js` | `vp fmt` (the `fmt` block) | `.oxfmtrc.json` | toolkit's `config/oxfmtrc.json` (10up house style) |
| `lint-style` | — | `stylelint.config.js` etc. | toolkit's `config/stylelint.config.js` |

A project that still has an ESLint config and installs `eslint` itself keeps running ESLint for `lint-js`, and
`eslint --fix` for `format-js`, so upgrading does not change its rules. Delete the ESLint config to switch to Oxlint.

For editor integration, install the [Oxc extension](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode)
and the Stylelint extension.

### Pre-commit hooks

With a root `vite.config.ts`, Vite+ runs checks on staged files with `vp staged` (it replaces lint-staged):

```ts
import { defineConfig } from 'vite-plus';

export default defineConfig({
	staged: {
		'*.{js,jsx,ts,tsx}': 'vp check --fix',
		'*.css': 'stylelint --fix',
	},
});
```

Run `vp staged` from your husky `pre-commit` hook.

## <a id="testing"></a>Testing

`10up-toolkit test` runs unit tests with [Vitest](https://vitest.dev). Without a project Vite or Vitest config it uses
the jsdom environment, Jest-style globals (`describe`, `it`, `expect`, and `jest` as an alias of `vi`) and the file
patterns version 7 used: `__tests__/**`, `test/*` and `*.test.*`. Pass `--watch` to keep watching.
`test-unit-jest` still works as an alias.

## <a id="libraries"></a>Authoring Libraries/Packages

10up-toolkit leverages standard package.json fields when running in package mode. Below is a list of all fields 10up-toolkit supports and how it's used.

- **name**: It's used to generate a valid library name to expose the library via a global variable (for UMD builds).
  We recommend always specifying `libraryName` manually when creating UMD builds via `--name=your-library-name` or `10up-toolkit.libraryName` config.
- **source**: It's used to define your package entry point.
- **main**: Where the bundled JavaScript should go. Note that this field is used by NPM to specify your package entry point for consumption.
- **style**: If set, will define where the CSS will be generated.
- **umd:main** or **unpkg**: 10up-toolkit generates a separate umd build by default. This field is used by 10up-toolkit to specify where the UMD bundle should go. The benefit of generating a separate UMD bundle is to avoid including boilerplate code.

```json
{
	"name": "your-package-name",
	"version": "1.0.0",
	"main": "./dist/index.js",
	"source": "./src/index.js",
	"style": "./dist/index.css",
	"umd:main": "./dist/index.umd.js",
	"scripts": {
		"build": "10up-toolkit build",
		"dev": "10up-toolkit build --watch"
	},
	"10up-toolkit": {
		"libraryName": "MyLibraryName"
	}
}
```

Then, the following code:

```javascript
// src/index.js
import "./styles.css";

export default () => {
	/* my awesome js code */
};
```

will generate a `index.js`, `index.umd.js` and a `index.css` file in the `dist` folder after running `npm run build`.

Since version `4.0.0` you can specify multiple entry points in package mode with the `entry` field.

```json
  "10up-toolkit": {
    "libraryName": "TenUpAccordion",
    "entry": {
      "index": "./src/index.ts",
      "config": "./src/config/inde.ts",
      "util": "./src/util/index.ts"
    }
  }
```

Note that you still need to declare `main` and `source` to enable package mode.

### Understanding Package Mode

It's important to understand how 10up-toolkit behaves when running in package mode. First and foremost, core-js polyfills **will not** be added automatically.

If your package should support older browsers, and you want to include core-js polyfills you will need to declare core-js as a dependency, and manually include the polyfills you need, e.g:

```javascript
import "core-js/es/array/from";
import "core-js/web/dom-collections";
```

The second difference is that 10up-toolkit **will not** include the dependencies (or peer dependencies) in the final bundle.
The reason for this is that, it's responsibility of the consumer bundle to resolve and include dependencies in the final bundle. Doing otherwise could lead to duplication of packages in the application final bundle.

This behavior is inspired in [how microbundle](https://github.com/developit/microbundle/wiki/How-Microbundle-decides-which-dependencies-to-bundle) handle bundling packages.

## <a id="customizations"></a>Customizations

### Customizing the Vite config

Toolkit builds a Vite config from the `"10up-toolkit"` block of `package.json`. To change it, add a `vite.config.mjs`
to the project and start from toolkit's config:

```js
// vite.config.mjs
import { toolkit } from '10up-toolkit/vite';

export default toolkit({
	server: { port: 5200 },
});
```

`toolkit()` takes a Vite config, or a function of `{ mode, command }` that returns one, and merges it on top. The
build runs twice into one `dist/`: once for classic scripts and styles, and once with `mode === 'modules'` for Script
Modules. Toolkit uses the project config whenever one exists, and the `--config` flag picks another file.

You can also write a config from scratch with `@10up/wp-vite-plugins`. See its
[README](https://github.com/10up/wp-vite-plugins#readme).

### Customizing Stylelint

Add a `stylelint.config.js` to the project:

```javascript
const config = {
	extends: ['@10up/stylelint-config'],
};

module.exports = config;
```

### Customizing PostCSS

Without a PostCSS config in the project, toolkit applies the same PostCSS setup as version 7: global data from
`paths.globalStylesDir`, mixins from `paths.globalMixinsDir`, `postcss-preset-env` at stage 0, and the editor styles
wrapper for `editor-style.css`. Vite handles `@import` and minification.

Add a `postcss.config.js` to replace it completely:

```javascript
module.exports = {
	plugins: {
		'postcss-preset-env': { stage: 0 },
	},
};
```

## <a id="cli"></a> CLI Options

10up-toolkit supports several CLI options that can be used to override settings.

### Production Sourcemaps

> This option was added in 10up-toolkit v6.

All development builds ship source maps by default, if you wish to ship source maps to production builds you can use the `--sourcemap` cli flag to force the generation of source maps even in production builds.
Alternatively, you can set this up in `package.json`.

```json
{
	"name": "tenup-theme",
	"version": "1.0.0",
	"scripts": {
		"start": "10up-toolkit build --watch",
		"build": "10up-toolkit build",
		"format-js": "10up-toolkit format-js",
		"lint-js": "10up-toolkit lint-js",
		"lint-style": "10up-toolkit lint-style",
		"test": "10up-toolkit test"
	},
	"devDependencies": {
		"10up-toolkit": "^6.0.0"
	},
	"10up-toolkit": {
		"sourcemap": true,
		"entry": {
			"admin": "./assets/js/admin/admin.js"
		}
	}
}
```

### Block Manifest

> This option was added in 10up-toolkit v6.6.

The `--block-manifest` flag enables generation of a PHP manifest file for WordPress's Block Metadata Collections API (WordPress 6.7+). This improves block registration performance by consolidating all block metadata into a single file.

```bash
10up-toolkit build --block-manifest
10up-toolkit start --block-manifest
10up-toolkit watch --block-manifest
```

When enabled, toolkit generates `dist/blocks-manifest.php` containing all block metadata. In watch mode, the manifest regenerates automatically when block files change.

Alternatively, enable permanently in `package.json`:

```json
{
  "10up-toolkit": {
    "useBlockAssets": true,
    "useBlockManifest": true
  }
}
```

See the [WordPress Block Metadata Collections](#wordpress-block-metadata-collections) section for usage details.

### Source and Output

To set the source and main/output path via the CLI you can use the `-i` and `-o` (or `--input` and `--output` options)

```bash
10up-toolkit build -i=src/index.js -o=dist/index.js
```

This can be useful if you have multiple entry points if you want to create a test application for your package.

```javascript
// app.js
// index is the entry point of the package
import { Accordion } from "./index";

new Accordion(".accordion");
```

Then you can instruct 10up-toolkit to use your app.js file and spin up a dev server in a separate npm script.

```json
"start": "10up-toolkit start -i=src/app.js --dev-server",
```

### Target

> Released in 3.1.0

The `--target` option was a webpack setting and has no effect in version 8. Library builds target modern browsers; set `build.target` in a project `vite.config.mjs` to change it.

### Dev Server

<blockquote>This option was added in 10up-toolkit 1.0.8</blockquote>

The `--dev-server` allows you to quickly spin up a development server. The default port is 8000 and can be changed via `--port`.

If you need to override the default html template, create a `index.html` file under a `public` dir.

```html
<!-- public/index.html -->
<!doctype html>
<html>
	<head>
		<meta charset="utf-8" />
		<title>Library Test</title>
	</head>
	<body>
		<!-- You can add any custom markup --->
	</body>
</html>
```

**Note**: In version 8 the dev server serves an `index.html` at the project root. Reference your script from it with `<script type="module" src="/src/app.js"></script>`.

### WP Mode

10up-toolkit is optimized for WordPress development and by default will include several WordPress specific settings. To disable this behavior
you can pass `--wp=false`.

### Format

The format option controls the bundle format. The supported options are:

- all (default)
- commonjs
- umd
- none

The default value will generate both a CommonJS bundle and a UMD bundle (if the umd entry in package.json is defined).

"none" disables bundling for distribution making the bundled code to be added to a page without being imported through a bundler.

To override, use the `-f` or `--format` option

```bash
10up-toolkit build -f=commonjs
```

There also is a special mode for outputting both CommonJS and ESM assets at the same time. It can be enabled via the `useScriptModules` flag in the toolkit settings and enables you to define any module entrypoints via the `moduleEntry` key in the settings. At the same time enabling this flag also means that the `scriptModule` & `viewScriptModule` keys in `block.json` files automatically get built as modules.

> [!NOTE]
> Toolkit runs a second Vite build with `mode === 'modules'` for Script Modules. Keep that in mind in a custom `vite.config.mjs`.

### Externals

This option is only useful in package mode and is used to override the externals. In package mode, the
default externals will be set based on your dependencies and peer dependencies.

```bash
10up-toolkit build --external=react,react-dom
```

An interesting use case for this is when you want to generate a UMD bundle that ships with all dependencies so that it
can be used by simply loading the JavaScript in the browser.

As an example, consider the following `package.json`

```json
{
	"name": "@10up/component-accordion",
	"version": "2.0.1",
	"author": "10up",
	"description": "Accessible accordion component.",
	"main": "dist/index.js",
	"umd:main": "dist/index.umd.js",
	"source": "src/index.js",
	"style": "./dist/index.css",
	"scripts": {
		"watch": "concurrently \"npm run build:modern -- --watch\" \"npm run build:umd -- --watch\"",
		"start": "10up-toolkit start -i=src/app.js --dev-server",
		"build": "npm run build:modern && npm run build:umd",
		"build:modern": "10up-toolkit build -f=commonjs",
		"build:umd": "10up-toolkit build -f=umd -i=src/index.umd.js --name=TenUpAccordion --external=none"
	},
	"dependencies": {
		"core-js": "^3.0.0"
	},
	"devDependencies": {
		"10up-toolkit": "1.0.7",
		"concurrently": "^5.3.0"
	}
}
```

Running `npm run build:modern` will only generate a bundle suitable for bundlers consumption and `npm run build:umd` will generate
a bundle that's suitable for both bundlers and direct inclusion in browsers, note that `---external=none` is being passed and that effectively tells
10up-toolkit to inline all the dependencies. So someone loading `index.umd.js` don't need to load `core-js`.

The UMD bundle could then be used like so:

```html
<script src="https://unpkg.com/@10up/component-accordion@2.0.1/dist/index.umd.js"></script>
<script type="text/javascript">
	const myAccordion = new window.TenUpAccordion.Accordion(".accordion", {
		onCreate: function () {
			console.log("onCreated");
		},
		onOpen: function () {
			console.log("onOpen");
		},
		onClose: function () {
			console.log("onClose");
		},
		onToggle: function () {
			console.log("onToggle");
		},
	});
</script>
```

### include

The `--include` option is useful if you want to instruct 10up-toolkit to transpile a npm package (which are excluded by default) as part of your build process.

This can be useful in situations where you're maintaining an internal package, and you don't want to bother about setting up a build pipeline for the package.

```bash
10up-toolkit build --include=package-name,other-package
```

## <a id="typescript"></a> TypeScript Support

10up-toolkit provides support for TypeScript out of the box. Simply create files with `.ts` or `.tsx` (for react components) and 10up-toolkit will
compile them just fine as well as lint and format them.

Type checking is not part of the build. Run `tsc --noEmit` (or `tsgo --noEmit`) in CI.

## <a id="react"></a> React & WordPress

There are two ways you can work with React in 10up-toolkit. When "WordPress" mode is turned on (the default behavior) 10up-toolkit will assume React is coming from WordPress and therefore will use `@wordpress/element`.

This is the default and expected behavior for writing custom gutenberg blocks for instance.

If you're writing React code on the front-end of your theme you can still use the bundled React that comes with WordPress. 10up-toolkit will automatically add `react`, `react-dom` and `wp-element` as dependencies of your front-end script that contains react code.

For instance, given the following React code

```javascript
import ReactDOM from "react-dom";
import { useState } from "react";

const App = () => {
	const [state] = useState(1);

	return <p>This is a react app {state}</p>;
};

ReactDOM.render(<App />, document.getElementById("root"));
```

The following `asset.php` file will be generated

```php
<?php
return array('dependencies' =>
  array('react-dom', 'wp-element'), 'version' =>    'a285714cd60121ad20a470c3b859c6b0'
);
```

If you're not supporting IE 11, it is strongly recommend to remove `wp-polyfill` from the front-end. Additionally, `lodash` is also not require if you're just sticking to standard react apis.

```php
add_action( 'wp_default_scripts', 'remove_deps' );

function remove_deps( $scripts ) {
	if ( is_admin() ) {
		return;
	}

	$deps_to_remove = [ 'wp-polyfill', 'lodash' ];

	$wp_element = $scripts->query( 'wp-element' );
	if ( $wp_element ) {
		$wp_element->deps = array_diff( $wp_element->deps, $deps_to_remove );
	}

	$wp_escape_html = $scripts->query( 'wp-escape-html' );
	if ( $wp_escape_html ) {
		$wp_escape_html->deps = array_diff( $wp_escape_html->deps, $deps_to_remove );
	}

	$react = $scripts->query( 'react' );
	if ( $react ) {
		$react->deps = array_diff( $react->deps, $deps_to_remove );
	}
}
```

By disabling "WordPress" mode, you will need to install both react and react-dom yourself and include in your final bundle.

## Support Level

**Active:** 10up is actively working on this, and we expect to continue work for the foreseeable future including keeping tested up to the most recent version of WordPress. Bug reports, feature requests, questions, and pull requests are welcome.

## Like what you see?

<a href="http://10up.com/contact/"><img src="https://10up.com/uploads/2016/10/10up-Github-Banner.png" alt="Work with 10up, we create amazing websites and tools that make content management simple and fun using open source tools and platforms"></a>
