<?php
/**
 * Gutenberg Blocks setup
 *
 * @package TenUpScaffold\Core
 */

namespace TenUpTheme\Blocks;

use TenUpTheme\Blocks\Example;


/**
 * Set up blocks
 *
 * @return void
 */
function setup() {
	$n = function( $function ) {
		return __NAMESPACE__ . "\\$function";
	};

	add_action( 'enqueue_block_editor_assets', $n( 'blocks_editor_styles' ) );

	add_filter( 'block_categories_all ', $n( 'blocks_categories' ), 10, 2 );

	add_action( 'init', $n( 'register_theme_blocks' ) );

	add_action( 'init', $n( 'block_patterns_and_categories') );

	/*
	If you are using the block library, remove the blocks you don't need.

	add_filter( 'tenup_available_blocks', function ( $blocks ) {
		if ( ! empty( $blocks['integrated-hero'] ) ) {
			unset( $blocks['integrated-hero'] );
		}

		return $blocks;
	} );
	*/
}

/**
 * Add in blocks that are registered in this theme
 *
 * @return void
 */
function register_theme_blocks() {

	// Register all the blocks in the theme
	if ( file_exists( TENUP_THEME_BLOCK_DIST_DIR ) ) {
		$block_json_files = glob( TENUP_THEME_BLOCK_DIST_DIR . '*/block.json' );

		// auto register all blocks that were found.
		foreach ( $block_json_files as $filename ) {

			$block_folder = dirname( $filename );

			$block_options = [];

			$markup_file_path = $block_folder . '/markup.php';
			if ( file_exists( $markup_file_path ) ) {

				// only add the render callback if the block has a file called markdown.php in it's directory
				$block_options['render_callback'] = function( $attributes, $content, $block ) use ( $block_folder ) {

					// create helpful variables that will be accessible in markup.php file
					$context = $block->context;

					// get the actual markup from the markup.php file
					ob_start();
					include $block_folder . '/markup.php';
					return ob_get_clean();
				};
			};

			register_block_type_from_metadata( $block_folder, $block_options );
		};
	};

}

/**
 * Enqueue editor-only JavaScript/CSS for blocks.
 *
 * @return void
 */
function blocks_editor_styles() {
	wp_enqueue_style(
		'editor-style',
		TENUP_THEME_TEMPLATE_URL . '/dist/css/editor-style.css',
		[],
		TENUP_THEME_VERSION
	);

}

/**
 * Filters the registered block categories.
 *
 * @param array  $categories Registered categories.
 * @param object $post       The post object.
 *
 * @return array Filtered categories.
 */
function blocks_categories( $categories, $post ) {
	if ( ! in_array( $post->post_type, array( 'post', 'page' ), true ) ) {
		return $categories;
	}

	return array_merge(
		$categories,
		array(
			array(
				'slug'  => 'tenup-scaffold-blocks',
				'title' => __( 'Custom Blocks', 'tenup-theme' ),
			),
		)
	);
}

/**
 * Manage block patterns and block pattern categories
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-patterns/
 *
 * @return void
 */
function block_patterns_and_categories() {

	/*
	## Examples

	// Register block pattern
	register_block_pattern(
		'tenup/block-pattern',
		array(
        	'title'       => __( 'Two buttons', 'tenup' ),
        	'description' => _x( 'Two horizontal buttons, the left button is filled in, and the right button is outlined.', 'Block pattern description', 'wpdocs-my-plugin' ),
        	'content'     => "<!-- wp:buttons {\"align\":\"center\"} -->\n<div class=\"wp-block-buttons aligncenter\"><!-- wp:button {\"backgroundColor\":\"very-dark-gray\",\"borderRadius\":0} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-background has-very-dark-gray-background-color no-border-radius\">" . esc_html__( 'Button One', 'wpdocs-my-plugin' ) . "</a></div>\n<!-- /wp:button -->\n\n<!-- wp:button {\"textColor\":\"very-dark-gray\",\"borderRadius\":0,\"className\":\"is-style-outline\"} -->\n<div class=\"wp-block-button is-style-outline\"><a class=\"wp-block-button__link has-text-color has-very-dark-gray-color no-border-radius\">" . esc_html__( 'Button Two', 'wpdocs-my-plugin' ) . "</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->",
    	)
	);

	// Unregister a block pattern
	unregister_block_pattern( 'tenup/block-pattern' );

	// Register a block pattern category
	register_block_pattern_category(
		'client-name',
			array( 'label' => __( 'Client Name', 'tenup' ) )
	);

	// Unregister a block pattern category
	unregister_block_pattern('client-name')

	*/
}
