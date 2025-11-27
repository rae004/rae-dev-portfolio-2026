<?php
/**
 * Software Projects Post Type
 * Handles registration and configuration of the software projects custom post type
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Software Projects Post Type
 *
 * Registers and manages software projects custom post type.
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */
class RAE_Software_Projects_Post_Type {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register_post_type' ) );
	}

	/**
	 * Register the software projects post type
	 */
	public function register_post_type(): void {
		register_post_type(
			'software-project',
			array(
				'labels'       => array(
					'name'               => 'Software Projects',
					'singular_name'      => 'Software Project',
					'add_new'            => 'Add New Software Project',
					'add_new_item'       => 'Add New Software Project',
					'edit_item'          => 'Edit Software Project',
					'new_item'           => 'New Software Project',
					'view_item'          => 'View Software Project',
					'search_items'       => 'Search Software Projects',
					'not_found'          => 'No software projects found',
					'not_found_in_trash' => 'No software projects found in trash',
				),
				'public'       => true,
				'show_in_rest' => false, // Disable Block Editor to prevent auto-save 404 errors
				'rest_base'    => 'software-projects',
				'supports'     => array( 'title', 'editor', 'excerpt', 'custom-fields', 'thumbnail' ),
				'menu_icon'    => 'dashicons-laptop',
				'rewrite'      => array( 'slug' => 'software-projects' ),
				'has_archive'  => true,
			)
		);
	}
}
