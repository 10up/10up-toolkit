<?php
/**
 * Server-side render for `fixture/hello`.
 *
 * @var array    $attributes  Block attributes.
 * @var string   $content     Saved content (empty — save() returns null).
 * @var WP_Block $block       Block instance.
 */

$wrapper_attributes = get_block_wrapper_attributes();
?>
<div <?php echo $wrapper_attributes; ?>>
	<p><?php esc_html_e( 'Hello, world!', 'fixture' ); ?></p>
	<p class="server-stamp">
		<?php
		printf(
			/* translators: %1$s: site name, %2$s: server time */
			esc_html__( 'Rendered server-side for %1$s at %2$s.', 'fixture' ),
			esc_html( get_bloginfo( 'name' ) ),
			esc_html( wp_date( 'H:i:s' ) )
		);
		?>
	</p>
</div>
