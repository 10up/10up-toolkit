<?php
/**
 * Vite dev-server bridge for Fast Refresh.
 *
 * Mirrors the *role* of toolkit's fast-refresh.php — make HMR work when the
 * editor is reloading — but the underlying mechanism is different because
 * Vite's HMR is ESM-native (no injected webpack runtime). When
 * `SCRIPT_DEBUG` is on AND `VITE_DEV_SERVER` is defined, this file:
 *
 *   1. Rewrites this plugin's `dist/*.js` script URLs to point at the
 *      Vite dev server (which serves transformed source).
 *   2. Marks those scripts as `type="module"` so the browser treats them
 *      as ESM.
 *   3. Enqueues `<dev-server>/@vite/client` — Vite's HMR runtime —
 *      ahead of plugin scripts so it can wire up the WebSocket connection
 *      for hot updates.
 *
 * Activate by adding to wp-config.php for local development:
 *
 *   define( 'SCRIPT_DEBUG', true );
 *   define( 'VITE_DEV_SERVER', 'http://localhost:5173' );
 *
 * And running `npm run dev` (or `vp dev`) in `experiments/vite-poc/`.
 *
 * No-op in production: returns early when SCRIPT_DEBUG is off.
 */

namespace FixturePOC\FastRefresh;

if ( ! defined( 'SCRIPT_DEBUG' ) || ! SCRIPT_DEBUG ) {
	return;
}
if ( ! defined( 'VITE_DEV_SERVER' ) ) {
	return;
}

$dev_server = rtrim( \VITE_DEV_SERVER, '/' );
$plugin_url = plugins_url( 'dist/', __FILE__ );

/**
 * Register Vite's HMR client. WP enqueues this on every page that loads
 * a Vite-served script; the client opens a WebSocket back to the dev
 * server and applies HMR updates as they arrive.
 */
add_action(
	'init',
	function () use ( $dev_server ) {
		wp_register_script( 'vite-hmr-client', $dev_server . '/@vite/client', array(), null, false );
	},
	1
);

/**
 * Force `type="module"` on Vite-served scripts so the browser parses them
 * as native ESM. Without this WP emits classic `<script src>` which
 * silently fails on `import` statements.
 */
add_filter(
	'script_loader_tag',
	function ( $tag, $handle, $src ) use ( $dev_server ) {
		if ( strpos( $src, $dev_server ) === 0 ) {
			return str_replace( '<script ', '<script type="module" ', $tag );
		}
		return $tag;
	},
	10,
	3
);

/**
 * Rewrite this plugin's dist URLs to the dev server. Vite's dev server
 * accepts `/blocks/hello/index.js` and resolves to the source file
 * (index.tsx) on the fly, so we don't need to munge the extension.
 */
add_filter(
	'script_loader_src',
	function ( $src ) use ( $dev_server, $plugin_url ) {
		if ( strpos( $src, $plugin_url ) !== 0 ) {
			return $src;
		}
		$rel = substr( $src, strlen( $plugin_url ) );
		// Strip any `?ver=...` query — Vite manages its own cache busting.
		$rel = preg_replace( '/\?.*$/', '', $rel );
		return $dev_server . '/' . $rel;
	},
	10,
	1
);

/**
 * Make sure the HMR client lands ahead of plugin scripts on both
 * frontend and the block editor (admin).
 */
add_action(
	'wp_enqueue_scripts',
	function () {
		wp_enqueue_script( 'vite-hmr-client' );
	},
	1
);
add_action(
	'admin_enqueue_scripts',
	function () {
		wp_enqueue_script( 'vite-hmr-client' );
	},
	1
);
add_action(
	'enqueue_block_assets',
	function () {
		wp_enqueue_script( 'vite-hmr-client' );
	}
);
