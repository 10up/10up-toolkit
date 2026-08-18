---
"10up-toolkit": minor
---

Add WordPress Block Metadata Collections API support

Integrate automatic generation of block metadata manifest files to improve block registration performance in WordPress 6.7+. When enabled, toolkit generates a PHP file (`blocks-manifest.php`) containing all block metadata from a single source, eliminating the need to read multiple `block.json` files at runtime.

**New Features:**
- Add `useBlockManifest` configuration option (boolean, default: `false`)
- Add `--block-manifest` CLI flag for one-time manifest generation
- Add `BuildBlocksManifestPlugin` webpack plugin that hooks into build completion
- Automatic manifest regeneration in watch mode when blocks change

**Configuration:**

Enable via package.json:
```json
{
  "10up-toolkit": {
    "useBlockAssets": true,
    "useBlockManifest": true
  }
}
```

Or via CLI flag:
```bash
10up-toolkit build --block-manifest
10up-toolkit start --block-manifest
10up-toolkit watch --block-manifest
```

**WordPress Integration:**

Register the collection and automatically register all blocks:
```php
$blocks_dir = get_template_directory() . '/dist/blocks';
$manifest_path = get_template_directory() . '/dist/blocks-manifest.php';

wp_register_block_metadata_collection( $blocks_dir, $manifest_path );

// Automatically register all blocks from the manifest
$manifest = require $manifest_path;
foreach ( array_keys( $manifest ) as $block_dir ) {
    register_block_type_from_metadata( $blocks_dir . '/' . $block_dir );
}
```

**Benefits:**
- Improved performance for projects with many blocks (50+)
- Reduced filesystem I/O operations
- Better opcode caching for block metadata
- Preserves transformed asset paths from the build process (TS→JS, SCSS→CSS)

The manifest is generated in `dist/blocks-manifest.php` and works seamlessly with the existing `useBlockAssets` workflow.
