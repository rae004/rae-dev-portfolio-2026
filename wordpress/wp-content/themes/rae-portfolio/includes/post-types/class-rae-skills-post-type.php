<?php
/**
 * Skills Post Type
 * Handles registration and configuration of the skills custom post type
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Skills Post Type
 *
 * Registers and manages skills custom post type.
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */
class RAE_Skills_Post_Type {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register_post_type' ) );
	}

	/**
	 * Register the skills post type
	 */
	public function register_post_type(): void {
		register_post_type(
			'skill',
			array(
				'labels'       => array(
					'name'               => 'Skills',
					'singular_name'      => 'Skill',
					'add_new'            => 'Add New Skill',
					'add_new_item'       => 'Add New Skill',
					'edit_item'          => 'Edit Skill',
					'new_item'           => 'New Skill',
					'view_item'          => 'View Skill',
					'search_items'       => 'Search Skills',
					'not_found'          => 'No skills found',
					'not_found_in_trash' => 'No skills found in trash',
				),
				'public'       => true,
				'show_in_rest' => false, // Disable Block Editor to prevent auto-save 404 errors
				'rest_base'    => 'skills',
				'supports'     => array( 'title', 'editor', 'excerpt', 'custom-fields', 'thumbnail' ),
				'menu_icon'    => 'dashicons-star-filled',
				'rewrite'      => array( 'slug' => 'skills' ),
				'has_archive'  => true,
			)
		);
	}
}
