import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

// Non-block admin entry. Exercises the wp-externals path for entries that
// aren't discovered via block.json — they still need their .asset.php
// sidecar emitted and @wordpress/* rewritten to wp.* globals.
addFilter('admin.notice', 'fixture/admin/log', () => {
	console.log(__('Fixture admin script loaded', 'fixture'));
});
