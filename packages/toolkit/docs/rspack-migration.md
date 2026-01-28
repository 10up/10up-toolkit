# RSPack Migration Guide

10up-toolkit now uses [RSPack](https://rspack.dev/) as its default bundler, providing significantly faster build times while maintaining full compatibility with existing projects.

## Overview

RSPack is a high-performance JavaScript bundler written in Rust that provides a webpack-compatible API. This migration brings faster builds to 10up-toolkit while preserving all existing functionality.

### Key Benefits

- **~20% faster builds** on average for WordPress projects
- **Faster HMR** (Hot Module Replacement) during development
- **Lower memory usage** compared to webpack
- **Full backwards compatibility** - existing projects work without changes
- **Webpack fallback** available if needed

## Usage

### Default Behavior (RSPack)

RSPack is now the default bundler. No configuration changes are required:

```bash
# These commands now use RSPack by default
npx 10up-toolkit build
npx 10up-toolkit start
npx 10up-toolkit start --hot
```

You'll see this message confirming RSPack is being used:

```
10up-toolkit: Using RSPack for faster builds
```

### Using Webpack (Fallback)

If you need to use webpack (for compatibility or debugging), you have two options:

#### Option 1: Environment Variable

```bash
BUNDLER=webpack npx 10up-toolkit build
BUNDLER=webpack npx 10up-toolkit start
```

#### Option 2: Package.json Configuration

```json
{
  "10up-toolkit": {
    "bundler": "webpack"
  }
}
```

## Performance Benchmarks

Tested on macOS with webpack 5.95.0 vs RSPack 1.7.4:

| Project Type | webpack | RSPack | Improvement |
|--------------|---------|--------|-------------|
| WordPress Block Project (5 entries) | 584ms | 485ms | ~17% faster |
| Vanilla Extract CSS-in-JS | 382ms | 315ms | ~18% faster |
| Linaria CSS-in-JS | 391ms | 317ms | ~19% faster |
| NPM Package Build | 880ms | 677ms | ~23% faster |

**Note**: Larger projects with more entry points will see even greater improvements.

## Technical Details

### What Changed

1. **New Dependencies**
   - `@rspack/core` - Core RSPack bundler
   - `@rspack/plugin-react-refresh` - React Fast Refresh for RSPack
   - `eslint-rspack-plugin` - ESLint integration for RSPack

2. **Bundler Abstraction Layer**
   - New `config/bundler.js` provides unified API for both bundlers
   - Automatically selects appropriate plugins based on bundler type

3. **Plugin Replacements** (automatic, no action needed)

   | webpack | RSPack |
   |---------|--------|
   | `mini-css-extract-plugin` | `CssExtractRspackPlugin` (built-in) |
   | `copy-webpack-plugin` | `CopyRspackPlugin` (built-in) |
   | `terser-webpack-plugin` | `SwcJsMinimizerRspackPlugin` (built-in) |
   | `eslint-webpack-plugin` | `eslint-rspack-plugin` |
   | `@pmmmwh/react-refresh-webpack-plugin` | `@rspack/plugin-react-refresh` |

4. **Forked Dependency Extraction Plugin**
   - Custom RSPack-compatible version of `@wordpress/dependency-extraction-webpack-plugin`
   - Maintains full compatibility with WordPress dependency management
   - Generates `.asset.php` files correctly

### WordPress Compatibility

For WordPress projects, 10up-toolkit continues to use **babel-loader** (not SWC) to ensure:

- Proper `@wordpress/element` injection for React usage
- Correct dependency extraction for `wp_enqueue_script()`
- Full compatibility with `@10up/babel-preset-default`

This is why WordPress projects see ~20% improvement rather than the 10-20x improvements sometimes cited for RSPack - the babel transform step is preserved for compatibility.

### When SWC is Used

The faster SWC loader is used only for:
- Non-WordPress package builds (`wordpress: false`)
- Projects without custom babel configuration

## Compatibility

### Fully Supported

- All existing 10up-toolkit features
- WordPress block development
- CSS/SCSS/Sass compilation
- PostCSS processing
- React Fast Refresh / HMR
- TypeScript compilation
- Vanilla Extract CSS-in-JS
- Linaria CSS-in-JS
- Bundle analysis (`--analyze`)
- Source maps
- Image optimization

### Known Considerations

1. **Custom webpack plugins**: Most webpack plugins work with RSPack, but some that rely on internal webpack APIs may need the webpack fallback.

2. **Custom webpack configuration**: If you have a custom `webpack.config.js`, it should work with RSPack. If not, use the webpack fallback.

3. **Snapshot tests**: If you have snapshot tests that capture webpack config output, they may need updating as plugin names differ slightly.

## Troubleshooting

### Build Fails with RSPack

If you encounter build errors specific to RSPack:

1. **Try the webpack fallback**:
   ```bash
   BUNDLER=webpack npx 10up-toolkit build
   ```

2. **Check for incompatible plugins**: Custom webpack plugins may need updates for RSPack compatibility.

3. **Report the issue**: Open an issue at [10up-toolkit GitHub](https://github.com/10up/10up-toolkit/issues) with:
   - Error message
   - Your `package.json` configuration
   - Whether webpack fallback works

### Missing Dependencies in `.asset.php`

If your `.asset.php` files are missing expected dependencies:

1. Ensure you're importing from the correct packages (e.g., `@wordpress/element` for React)
2. Check that `wpDependencyExternals` is not disabled in your config
3. Try the webpack fallback to compare outputs

### HMR Not Working

If Hot Module Replacement isn't working:

1. Ensure you're using `--hot` flag: `npx 10up-toolkit start --hot`
2. Check your `devURL` configuration
3. Verify the dev server port isn't blocked

## Migration Checklist

For existing projects upgrading to the RSPack version:

- [ ] Update `10up-toolkit` to the latest version
- [ ] Run `npm install` to get new dependencies
- [ ] Test your build: `npx 10up-toolkit build`
- [ ] Test development server: `npx 10up-toolkit start`
- [ ] Test HMR if used: `npx 10up-toolkit start --hot`
- [ ] Verify `.asset.php` files contain expected dependencies
- [ ] Update any snapshot tests if needed

## API Reference

### Environment Variables

| Variable | Values | Description |
|----------|--------|-------------|
| `BUNDLER` | `rspack` (default), `webpack` | Select which bundler to use |

### Package.json Configuration

```json
{
  "10up-toolkit": {
    "bundler": "rspack"
  }
}
```

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `bundler` | `"rspack"`, `"webpack"` | `"rspack"` | Select which bundler to use |

### Programmatic API

The bundler abstraction is available for advanced use cases:

```javascript
const {
  getBundlerType,  // Returns 'rspack' or 'webpack'
  isRspack,        // Returns true if using RSPack
  isWebpack,       // Returns true if using webpack
  getBundler,      // Returns the bundler module
} = require('10up-toolkit/config/bundler');
```

## Further Reading

- [RSPack Documentation](https://rspack.dev/)
- [RSPack webpack Compatibility](https://rspack.dev/guide/compatibility/webpack)
- [10up-toolkit Documentation](https://github.com/10up/10up-toolkit)
