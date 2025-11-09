<?php
/**
 * Media Projects Post Type
 * Handles registration and configuration of the media projects custom post type
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class RAE_Media_Projects_Post_Type {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register_post_type' ) );
	}

	/**
	 * Register the media projects post type
	 */
	public function register_post_type(): void {
		register_post_type(
			'media-project',
			array(
				'labels'       => array(
					'name'               => 'Media Projects',
					'singular_name'      => 'Media Project',
					'add_new'            => 'Add New Media Project',
					'add_new_item'       => 'Add New Media Project',
					'edit_item'          => 'Edit Media Project',
					'new_item'           => 'New Media Project',
					'view_item'          => 'View Media Project',
					'search_items'       => 'Search Media Projects',
					'not_found'          => 'No media projects found',
					'not_found_in_trash' => 'No media projects found in trash',
				),
				'public'       => true,
				'show_in_rest' => false, // Disable Block Editor to prevent auto-save 404 errors
				'rest_base'    => 'media-projects',
				'supports'     => array( 'title', 'editor', 'excerpt', 'custom-fields', 'thumbnail' ),
				'menu_icon'    => 'dashicons-format-audio',
				'rewrite'      => array( 'slug' => 'media-projects' ),
				'has_archive'  => true,
			)
		);
	}
}
