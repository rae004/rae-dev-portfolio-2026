<?php
/**
 * Rae Portfolio Theme Functions
 * Custom post types and WordPress REST API enhancements
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register Custom Post Types
 */
function rae_register_custom_post_types() {
    
    // Resume Post Type
    register_post_type('resume', array(
        'labels' => array(
            'name' => 'Resume Items',
            'singular_name' => 'Resume Item',
            'add_new' => 'Add New Resume Item',
            'add_new_item' => 'Add New Resume Item',
            'edit_item' => 'Edit Resume Item',
            'new_item' => 'New Resume Item',
            'view_item' => 'View Resume Item',
            'search_items' => 'Search Resume Items',
            'not_found' => 'No resume items found',
            'not_found_in_trash' => 'No resume items found in trash'
        ),
        'public' => true,
        'show_in_rest' => true,
        'rest_base' => 'resume',
        'supports' => array('title', 'editor', 'excerpt', 'custom-fields', 'thumbnail'),
        'menu_icon' => 'dashicons-businessman',
        'rewrite' => array('slug' => 'resume'),
        'has_archive' => true,
    ));

    // Software Project Post Type
    register_post_type('software-project', array(
        'labels' => array(
            'name' => 'Software Projects',
            'singular_name' => 'Software Project',
            'add_new' => 'Add New Software Project',
            'add_new_item' => 'Add New Software Project',
            'edit_item' => 'Edit Software Project',
            'new_item' => 'New Software Project',
            'view_item' => 'View Software Project',
            'search_items' => 'Search Software Projects',
            'not_found' => 'No software projects found',
            'not_found_in_trash' => 'No software projects found in trash'
        ),
        'public' => true,
        'show_in_rest' => true,
        'rest_base' => 'software-projects',
        'supports' => array('title', 'editor', 'excerpt', 'custom-fields', 'thumbnail'),
        'menu_icon' => 'dashicons-laptop',
        'rewrite' => array('slug' => 'software-projects'),
        'has_archive' => true,
    ));

    // Media Project Post Type
    register_post_type('media-project', array(
        'labels' => array(
            'name' => 'Media Projects',
            'singular_name' => 'Media Project',
            'add_new' => 'Add New Media Project',
            'add_new_item' => 'Add New Media Project',
            'edit_item' => 'Edit Media Project',
            'new_item' => 'New Media Project',
            'view_item' => 'View Media Project',
            'search_items' => 'Search Media Projects',
            'not_found' => 'No media projects found',
            'not_found_in_trash' => 'No media projects found in trash'
        ),
        'public' => true,
        'show_in_rest' => true,
        'rest_base' => 'media-projects',
        'supports' => array('title', 'editor', 'excerpt', 'custom-fields', 'thumbnail'),
        'menu_icon' => 'dashicons-format-audio',
        'rewrite' => array('slug' => 'media-projects'),
        'has_archive' => true,
    ));
}
add_action('init', 'rae_register_custom_post_types');

/**
 * Add CORS headers for frontend development
 */
function rae_add_cors_headers() {
    header('Access-Control-Allow-Origin: http://localhost:5173');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce');
    header('Access-Control-Allow-Credentials: true');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
}
add_action('rest_api_init', 'rae_add_cors_headers');

/**
 * Add featured image URL to REST API responses
 */
function rae_add_featured_image_to_rest() {
    
    // Add featured image URL to all post types
    $post_types = array('post', 'resume', 'software-project', 'media-project');
    
    foreach ($post_types as $post_type) {
        register_rest_field($post_type, 'featured_image_url', array(
            'get_callback' => function($post) {
                $image_id = get_post_thumbnail_id($post['id']);
                return $image_id ? wp_get_attachment_image_url($image_id, 'full') : null;
            },
            'schema' => array(
                'description' => 'Featured image URL',
                'type' => 'string'
            )
        ));
    }
}
add_action('rest_api_init', 'rae_add_featured_image_to_rest');

/**
 * Theme setup
 */
function rae_theme_setup() {
    // Add theme support for featured images
    add_theme_support('post-thumbnails');
    
    // Add theme support for menus
    add_theme_support('menus');
}
add_action('after_setup_theme', 'rae_theme_setup');

/**
 * Enqueue admin styles and scripts
 */
function rae_admin_enqueue_scripts() {
    wp_enqueue_style('rae-admin-style', get_template_directory_uri() . '/style.css');
}
add_action('admin_enqueue_scripts', 'rae_admin_enqueue_scripts');