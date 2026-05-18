<?php
/**
 * Plugin Name: Vite POC Fixture
 * Description: Minimal WP plugin used to verify the Vite POC builds produce
 *              the right files. Not meant to actually run in WordPress —
 *              this is here so reviewers can see the registration code that
 *              the build outputs are designed to feed.
 * Version: 0.0.0
 */

/**
 * Block registration via the WP 6.7+ manifest API (see #475).
 * Falls back to per-directory registration on older WP.
 */
add_action( 'init', function () {
	$blocks_dir = __DIR__ . '/dist/blocks';
	$manifest   = __DIR__ . '/dist/blocks-manifest.php';

	if ( function_exists( 'wp_register_block_types_from_metadata_collection' ) ) {
		wp_register_block_types_from_metadata_collection( $blocks_dir, $manifest );
		return;
	}

	if ( function_exists( 'wp_register_block_metadata_collection' ) ) {
		wp_register_block_metadata_collection( $blocks_dir, $manifest );
	}

	if ( file_exists( $manifest ) ) {
		$blocks = require $manifest;
		foreach ( array_keys( $blocks ) as $slug ) {
			register_block_type( $blocks_dir . '/' . $slug );
		}
	}
} );

/**
 * Per-block CSS routing (toolkit's loadBlockSpecificStyles equivalent).
 * Each file under dist/autoenqueue/ is attached to its block via
 * wp_enqueue_block_style — fires only when the block is on the page.
 */
add_action( 'init', function () {
	$auto_dir = __DIR__ . '/dist/autoenqueue';
	if ( ! is_dir( $auto_dir ) ) {
		return;
	}
	foreach ( glob( $auto_dir . '/*', GLOB_ONLYDIR ) as $block_dir ) {
		$slug = basename( $block_dir );
		foreach ( glob( $block_dir . '/*.css' ) as $css_file ) {
			$file = basename( $css_file, '.css' );
			wp_enqueue_block_style( 'core/' . $slug, array(
				'handle' => "fixture-{$slug}-{$file}",
				'src'    => plugins_url( "dist/autoenqueue/{$slug}/{$file}.css", __FILE__ ),
				'path'   => $css_file,
			) );
		}
	}
} );

/**
 * Admin script — exercises the wp-externals plugin with a non-block entry.
 */
add_action( 'admin_enqueue_scripts', function () {
	$asset_file = __DIR__ . '/dist/admin/index.asset.php';
	if ( ! file_exists( $asset_file ) ) {
		return;
	}
	$asset = require $asset_file;
	wp_enqueue_script(
		'fixture-admin',
		plugins_url( 'dist/admin/index.js', __FILE__ ),
		$asset['dependencies'],
		$asset['version'],
		true
	);
} );
