<?php
/**
 * Example block markup
 *
 * @package TenUpScaffold\Blocks\Example
 *
 * @var array $args {
 *     $args is provided by get_template_call.
 *
 *     @type array $attributes Block attributes.
 *     @type array $content    Block content.
 *     @type array $block      Block instance.
 * }
 */

// Set defaults.
$args = wp_parse_args(
	$args,
	[

		'class_name' => 'wp-block-{{dir}}',
	]
);

?>
<div class="<?php echo esc_attr( $args['class_name'] ); ?>">
	<h2 class="<?php echo esc_attr( $args['class_name'] ); ?>__title">
		Your content here.
	</h2>
</div>
