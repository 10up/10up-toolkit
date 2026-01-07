# @10up/build

> Fast esbuild-powered build tool for WordPress block development

## Overview

`@10up/build` is a modern build tool that provides **10-100x faster builds** than webpack-based alternatives. It's designed as a drop-in replacement for 10up-toolkit's build system, using the same configuration schema while leveraging esbuild's speed.

### Key Features

- **Lightning Fast** - ~150ms builds vs 15-30s with webpack
- **WordPress Native** - Full support for block.json, script modules, and dependency extraction
- **Drop-in Compatible** - Uses same `package.json["10up-toolkit"]` configuration
- **Modern CSS Pipeline** - SCSS + PostCSS + lightningcss
- **Hot Module Replacement** - React Fast Refresh support for development

## Installation

```bash
npm install @10up/build --save-dev
```

## Quick Start

```bash
# Production build
npx 10up-build build

# Development with watch mode + HMR
npx 10up-build start

# Watch mode only (no HMR server)
npx 10up-build watch
```

Or add scripts to your `package.json`:

```json
{
  "scripts": {
    "build": "10up-build build",
    "start": "10up-build start",
    "watch": "10up-build watch"
  }
}
```

## Configuration

Configuration is read from `package.json` under the `10up-toolkit` field, maintaining full compatibility with existing 10up-toolkit projects.

### Basic Configuration

```json
{
  "10up-toolkit": {
    "entry": {
      "admin": "./assets/js/admin/admin.js",
      "frontend": "./assets/js/frontend/frontend.js"
    },
    "paths": {
      "blocksDir": "./includes/blocks/",
      "srcDir": "./assets/",
      "copyAssetsDir": "./assets/"
    },
    "useBlockAssets": true,
    "wpDependencyExternals": true
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entry` | `object` | `{}` | Entry points for scripts and styles |
| `moduleEntry` | `object` | `{}` | Entry points for ES modules (.mjs output) |
| `paths.blocksDir` | `string` | `"./includes/blocks/"` | Directory containing block.json files |
| `paths.srcDir` | `string` | `"./assets/"` | Source directory for assets |
| `paths.copyAssetsDir` | `string` | `"./assets/"` | Directory for static assets to copy |
| `paths.globalStylesDir` | `string` | `"./assets/css/globals/"` | Directory for global CSS custom properties |
| `paths.globalMixinsDir` | `string` | `"./assets/css/mixins/"` | Directory for PostCSS mixins |
| `paths.blocksStyles` | `string` | `"./assets/css/blocks/"` | Directory for block-specific styles |
| `useBlockAssets` | `boolean` | `false` | Auto-detect entries from block.json files |
| `useScriptModules` | `boolean` | `false` | Enable ES module output |
| `wpDependencyExternals` | `boolean` | `true` | Externalize @wordpress/* packages and generate .asset.php |
| `loadBlockSpecificStyles` | `boolean` | `false` | Auto-enqueue block-specific stylesheets |
| `hot` | `boolean` | `false` | Enable Hot Module Replacement |
| `devServerPort` | `number` | `8887` | Port for HMR WebSocket server |
| `sourcemap` | `boolean` | `false` | Generate source maps (always on in development) |
| `externalNamespaces` | `object` | `{}` | Custom package namespaces to externalize |

### Configuration Files

The build tool respects these configuration files in your project root:

| File | Purpose |
|------|---------|
| `buildfiles.config.js` | Entry point configuration (alternative to package.json) |
| `postcss.config.js` | Custom PostCSS configuration |
| `tsconfig.json` | TypeScript configuration (used by esbuild) |

#### buildfiles.config.js

```javascript
module.exports = {
  admin: './assets/js/admin/admin.js',
  frontend: './assets/js/frontend/frontend.js',
  'admin-style': './assets/css/admin/admin-style.scss',
};
```

## Block Development

### Automatic Entry Detection

When `useBlockAssets: true` is enabled, the build tool automatically detects entry points from `block.json` files:

```json
{
  "name": "my-plugin/my-block",
  "editorScript": "file:./index.js",
  "editorStyle": "file:./editor.css",
  "style": "file:./style.css",
  "viewScript": "file:./view.js",
  "viewScriptModule": "file:./view-module.js"
}
```

The tool will:
1. Find source files (`.ts`, `.tsx`, `.scss` variants)
2. Compile them to the appropriate output format
3. Transform the `block.json` to reference compiled files
4. Generate `.asset.php` files with dependencies

### Supported block.json Fields

| Field | Output Format | Asset PHP |
|-------|---------------|-----------|
| `script` | IIFE (.js) | Yes |
| `editorScript` | IIFE (.js) | Yes |
| `viewScript` | IIFE (.js) | Yes |
| `scriptModule` | ESM (.mjs) | Yes (type: module) |
| `viewScriptModule` | ESM (.mjs) | Yes (type: module) |
| `style` | CSS (.css) | No |
| `editorStyle` | CSS (.css) | No |
| `viewStyle` | CSS (.css) | No |

### block.json Transformation

Source files are automatically transformed:
- `.ts` / `.tsx` → `.js`
- `.scss` / `.sass` → `.css`
- A `version` hash is added for cache busting

## WordPress Dependency Extraction

The build tool automatically externalizes WordPress packages and generates `.asset.php` files.

### How It Works

1. **Detection**: Imports from `@wordpress/*` packages are detected during bundling
2. **Externalization**: These imports are marked as external (loaded from WordPress globals)
3. **Asset Generation**: `.asset.php` files are created with dependency arrays

### Output Format

**Regular Scripts (IIFE):**
```php
<?php return array(
  'dependencies' => array('wp-blocks', 'wp-element', 'wp-i18n'),
  'version' => 'a1b2c3d4e5f6'
);
```

**ES Modules:**
```php
<?php return array(
  'dependencies' => array('@wordpress/interactivity'),
  'version' => 'a1b2c3d4e5f6',
  'type' => 'module'
);
```

### Vendor Externals

These packages are always externalized:

| Package | Global | Handle |
|---------|--------|--------|
| `react` | `React` | `react` |
| `react-dom` | `ReactDOM` | `react-dom` |
| `react/jsx-runtime` | `ReactJSXRuntime` | `react-jsx-runtime` |
| `lodash` | `lodash` | `lodash` |
| `lodash-es` | `lodash` | `lodash` |
| `moment` | `moment` | `moment` |
| `jquery` | `jQuery` | `jquery` |

### Custom External Namespaces

Externalize custom package namespaces (e.g., WooCommerce):

```json
{
  "10up-toolkit": {
    "externalNamespaces": {
      "@woocommerce": {
        "global": "wc",
        "handlePrefix": "wc"
      },
      "@my-plugin": {
        "global": "myPlugin",
        "handlePrefix": "my-plugin"
      }
    }
  }
}
```

This transforms:
- `@woocommerce/components` → `wc.components` (global) / `wc-components` (handle)
- `@my-plugin/utils` → `myPlugin.utils` (global) / `my-plugin-utils` (handle)

## CSS Pipeline

The CSS pipeline combines multiple tools for maximum compatibility and performance:

```
SCSS → Sass → PostCSS → lightningcss → Output
```

### SCSS Support

Full Sass/SCSS support with:
- `@import` and `@use` statements
- Nested selectors
- Variables and mixins
- All Sass features

### PostCSS Plugins

The following PostCSS plugins are applied:

1. **postcss-import** - Inline `@import` statements
2. **@csstools/postcss-global-data** - Inject global CSS custom properties
3. **postcss-custom-media** - Transform custom media queries
4. **postcss-mixins** - CSS mixins support

### Global Styles

Place global CSS files (custom properties, custom media queries) in `assets/css/globals/`:

```css
/* assets/css/globals/breakpoints.css */
@custom-media --bp-small (min-width: 600px);
@custom-media --bp-medium (min-width: 900px);
@custom-media --bp-large (min-width: 1200px);

:root {
  --color-primary: #0073aa;
  --spacing-unit: 8px;
}
```

These are automatically injected into all stylesheets.

### CSS Mixins

Place mixin files in `assets/css/mixins/`:

```css
/* assets/css/mixins/typography.css */
@define-mixin heading {
  font-family: var(--font-heading);
  font-weight: 700;
  line-height: 1.2;
}
```

Use in your stylesheets:

```css
.title {
  @mixin heading;
  font-size: 2rem;
}
```

### lightningcss

Final CSS processing with lightningcss provides:
- CSS minification (production only)
- Vendor prefixing
- Modern CSS syntax transformation
- Optimized output

## Development Mode

### Watch Mode

```bash
10up-build start
```

Features:
- Fast incremental rebuilds (~50ms)
- WebSocket server for HMR notifications
- Automatic browser refresh on changes
- React Fast Refresh support (placeholder)

### HMR Configuration

```json
{
  "10up-toolkit": {
    "hot": true,
    "devServerPort": 8887
  }
}
```

## CLI Reference

### Commands

| Command | Description |
|---------|-------------|
| `10up-build build` | Production build (default) |
| `10up-build start` | Development mode with HMR |
| `10up-build watch` | Watch mode without HMR |

### Options

| Option | Description |
|--------|-------------|
| `--help`, `-h` | Show help message |
| `--version`, `-v` | Show version number |
| `--hot` | Enable hot reload |
| `--port=<port>` | HMR server port |

## Output Structure

```
dist/
├── js/
│   ├── admin.js
│   ├── admin.asset.php
│   ├── frontend.js
│   └── frontend.asset.php
├── css/
│   ├── admin-style.css
│   └── frontend-style.css
├── blocks/
│   └── my-block/
│       ├── block.json
│       ├── index.js
│       ├── index.asset.php
│       ├── editor.css
│       ├── style.css
│       ├── view.js
│       ├── view.asset.php
│       ├── view-module.mjs
│       └── view-module.asset.php
└── images/
    └── (copied static assets)
```

## TypeScript Support

TypeScript is supported out of the box via esbuild:

- `.ts` and `.tsx` files are automatically compiled
- Type checking is NOT performed (use `tsc --noEmit` separately)
- `tsconfig.json` paths and settings are respected

### Recommended tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["@wordpress/blocks", "@types/react"]
  },
  "include": ["assets/**/*", "includes/**/*"]
}
```

## Migration from 10up-toolkit

### Step 1: Install

```bash
npm install @10up/build --save-dev
```

### Step 2: Update Scripts

```json
{
  "scripts": {
    "build": "10up-build build",
    "start": "10up-build start"
  }
}
```

### Step 3: Verify Configuration

Your existing `10up-toolkit` configuration in `package.json` will work as-is.

### Key Differences

| Feature | 10up-toolkit | @10up/build |
|---------|--------------|-------------|
| Bundler | webpack | esbuild |
| Build Speed | 15-30s | ~150ms |
| HMR | webpack-dev-server | WebSocket |
| CSS Processing | PostCSS | Sass + PostCSS + lightningcss |
| Bundle Analysis | Built-in | Not yet supported |

## Troubleshooting

### "Could not resolve @wordpress/*"

Ensure `wpDependencyExternals` is enabled:

```json
{
  "10up-toolkit": {
    "wpDependencyExternals": true
  }
}
```

### "Custom media query --bp-* is not defined"

Place your custom media definitions in `assets/css/globals/`:

```css
@custom-media --bp-small (min-width: 600px);
```

### Source maps not working

Enable source maps explicitly:

```json
{
  "10up-toolkit": {
    "sourcemap": true
  }
}
```

### TypeScript errors not shown

esbuild doesn't perform type checking. Run TypeScript separately:

```bash
tsc --noEmit
```

## API Reference

### Programmatic Usage

```javascript
import { build, watch, loadConfig } from '@10up/build';

// Load configuration
const config = loadConfig();

// Run production build
const result = await build();
console.log(`Built in ${result.duration}ms`);

// Start watch mode
await watch({ hot: true, port: 8887 });
```

### Build Result

```typescript
interface BuildResult {
  success: boolean;
  duration: number;
  entries: {
    scripts: number;
    modules: number;
    styles: number;
  };
  errors?: string[];
}
```

## Contributing

See the main [10up-toolkit repository](https://github.com/10up/10up-toolkit) for contribution guidelines.

## License

MIT
