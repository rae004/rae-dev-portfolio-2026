<?php
/**
 * Resume Post Type
 * Handles registration and configuration of the resume custom post type
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class RAE_Resume_Post_Type {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register_post_type' ) );
	}

	/**
	 * Register the resume post type
	 */
	public function register_post_type(): void {
		register_post_type(
			'resume',
			array(
				'labels'       => array(
					'name'               => 'Resume Items',
					'singular_name'      => 'Resume Item',
					'add_new'            => 'Add New Resume Item',
					'add_new_item'       => 'Add New Resume Item',
					'edit_item'          => 'Edit Resume Item',
					'new_item'           => 'New Resume Item',
					'view_item'          => 'View Resume Item',
					'search_items'       => 'Search Resume Items',
					'not_found'          => 'No resume items found',
					'not_found_in_trash' => 'No resume items found in trash',
				),
				'public'       => true,
				'show_in_rest' => false, // Disable Block Editor to prevent auto-save 404 errors
				'supports'     => array( 'title', 'editor', 'excerpt', 'custom-fields', 'thumbnail' ),
				'menu_icon'    => 'dashicons-businessman',
				'rewrite'      => array( 'slug' => 'resume' ),
				'has_archive'  => true,
			)
		);
	}
}
