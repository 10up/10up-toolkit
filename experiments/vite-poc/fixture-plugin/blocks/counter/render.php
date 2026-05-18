<?php
/**
 * Server-side render for `fixture/counter`.
 *
 * @var array    $attributes  Block attributes.
 * @var string   $content     Saved content (empty — save() returns null).
 * @var WP_Block $block       Block instance.
 */

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'data-wp-interactive' => 'fixture/counter',
		'data-wp-context'     => wp_json_encode( array( 'count' => 0 ) ),
	)
);
?>
<div <?php echo $wrapper_attributes; ?>>
	<button type="button" aria-label="<?php esc_attr_e( 'Decrement', 'fixture' ); ?>" data-wp-on--click="actions.decrement">−</button>
	<span class="count" data-wp-text="context.count">0</span>
	<button type="button" aria-label="<?php esc_attr_e( 'Increment', 'fixture' ); ?>" data-wp-on--click="actions.increment">+</button>
</div>
