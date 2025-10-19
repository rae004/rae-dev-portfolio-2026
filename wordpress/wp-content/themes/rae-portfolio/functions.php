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
        'show_in_rest' => false, // Disable Block Editor to prevent auto-save 404 errors
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

    // Skills Post Type
    register_post_type('skill', array(
        'labels' => array(
            'name' => 'Skills',
            'singular_name' => 'Skill',
            'add_new' => 'Add New Skill',
            'add_new_item' => 'Add New Skill',
            'edit_item' => 'Edit Skill',
            'new_item' => 'New Skill',
            'view_item' => 'View Skill',
            'search_items' => 'Search Skills',
            'not_found' => 'No skills found',
            'not_found_in_trash' => 'No skills found in trash'
        ),
        'public' => true,
        'show_in_rest' => false, // Disable Block Editor to prevent auto-save 404 errors
        'rest_base' => 'skills',
        'supports' => array('title', 'editor', 'excerpt', 'custom-fields', 'thumbnail'),
        'menu_icon' => 'dashicons-star-filled',
        'rewrite' => array('slug' => 'skills'),
        'has_archive' => true,
    ));
}
add_action('init', 'rae_register_custom_post_types');

/**
 * Add CORS headers for frontend across all environments
 */
function rae_add_cors_headers() {
    // Get the origin from the request
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

    // Define allowed origins for all environments
    $allowed_origins = array(
        'http://localhost:5173',           // Local development
        'https://dev.rae-dev.com',         // AWS development environment
        'https://rae-dev.com'              // Production environment (future)
    );

    // Check if origin is in allowed list
    if (in_array($origin, $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } else {
        // Fallback for development - allow localhost variations
        if (strpos($origin, 'localhost') !== false || strpos($origin, '127.0.0.1') !== false) {
            header('Access-Control-Allow-Origin: ' . $origin);
        }
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400'); // Cache preflight for 24 hours
    
    // Handle preflight OPTIONS requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        status_header(200);
        exit(0);
    }
}
add_action('rest_api_init', 'rae_add_cors_headers');

/**
 * Add featured image URL to REST API responses
 */
function rae_add_featured_image_to_rest() {
    
    // Add featured image URL to all post types
    $post_types = array('post', 'resume', 'software-project', 'media-project', 'skill');
    
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
 * Add employment date fields to REST API for resume post type
 */
function rae_add_employment_dates_to_rest() {

    // Add employment date fields specifically to resume post type
    register_rest_field('resume', 'employment_dates', array(
        'get_callback' => function($post) {
            $start_date = get_post_meta($post['id'], '_resume_start_date', true);
            $end_date = get_post_meta($post['id'], '_resume_end_date', true);
            $currently_employed = get_post_meta($post['id'], '_resume_currently_employed', true);
            $start_date_raw = get_post_meta($post['id'], '_resume_start_date_raw', true);
            $end_date_raw = get_post_meta($post['id'], '_resume_end_date_raw', true);

            return array(
                'start_date' => $start_date ?: null,
                'end_date' => $end_date ?: null,
                'currently_employed' => $currently_employed === '1',
                'start_date_raw' => $start_date_raw ?: null,
                'end_date_raw' => $end_date_raw ?: null,
                'formatted_range' => rae_format_employment_date_range($start_date, $end_date, $currently_employed === '1')
            );
        },
        'update_callback' => function($value, $post) {
            // This allows the employment_dates field to be updated via REST API
            // But we'll handle the actual saving in our save_post hook
            return true;
        },
        'schema' => array(
            'description' => 'Employment date information',
            'type' => 'object',
            'properties' => array(
                'start_date' => array(
                    'description' => 'Employment start date (formatted)',
                    'type' => 'string'
                ),
                'end_date' => array(
                    'description' => 'Employment end date (formatted) or "Present"',
                    'type' => 'string'
                ),
                'currently_employed' => array(
                    'description' => 'Whether this is current employment',
                    'type' => 'boolean'
                ),
                'start_date_raw' => array(
                    'description' => 'Employment start date (YYYY-MM-DD format)',
                    'type' => 'string'
                ),
                'end_date_raw' => array(
                    'description' => 'Employment end date (YYYY-MM-DD format)',
                    'type' => 'string'
                ),
                'formatted_range' => array(
                    'description' => 'Full formatted date range (e.g., "June 2020 - Present")',
                    'type' => 'string'
                )
            )
        )
    ));

    // Register individual meta fields for Block Editor support
    register_meta('resume', '_resume_start_date', array(
        'type' => 'string',
        'description' => 'Resume employment start date',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));

    register_meta('resume', '_resume_start_date_raw', array(
        'type' => 'string',
        'description' => 'Resume employment start date (raw)',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));

    register_meta('resume', '_resume_end_date', array(
        'type' => 'string',
        'description' => 'Resume employment end date',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));

    register_meta('resume', '_resume_end_date_raw', array(
        'type' => 'string',
        'description' => 'Resume employment end date (raw)',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));

    register_meta('resume', '_resume_currently_employed', array(
        'type' => 'string',
        'description' => 'Resume currently employed status',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));
}
add_action('rest_api_init', 'rae_add_employment_dates_to_rest');

/**
 * Add skills fields to REST API for skill post type
 */
function rae_add_skills_to_rest() {
    
    // Add skills_type field to skill post type
    register_rest_field('skill', 'skills_type', array(
        'get_callback' => function($post) {
            return get_post_meta($post['id'], '_skill_type', true) ?: null;
        },
        'update_callback' => function($value, $post) {
            return update_post_meta($post->ID, '_skill_type', sanitize_text_field($value));
        },
        'schema' => array(
            'description' => 'Skill category (e.g., "Languages & Frameworks", "Cloud & DevOps")',
            'type' => 'string'
        )
    ));
    
    // Add skills_value field to skill post type
    register_rest_field('skill', 'skills_value', array(
        'get_callback' => function($post) {
            return get_post_meta($post['id'], '_skill_value', true) ?: null;
        },
        'update_callback' => function($value, $post) {
            return update_post_meta($post->ID, '_skill_value', sanitize_text_field($value));
        },
        'schema' => array(
            'description' => 'Actual skill name (e.g., "TypeScript", "AWS", "Docker")',
            'type' => 'string'
        )
    ));
    
    // Add skills_weight field to skill post type
    register_rest_field('skill', 'skills_weight', array(
        'get_callback' => function($post) {
            $weight = get_post_meta($post['id'], '_skill_weight', true);
            return $weight !== '' ? (int)$weight : 0;
        },
        'update_callback' => function($value, $post) {
            $weight = is_numeric($value) ? (int)$value : 0;
            // Validate weight range (-999 to 999)
            $weight = max(-999, min(999, $weight));
            return update_post_meta($post->ID, '_skill_weight', $weight);
        },
        'schema' => array(
            'description' => 'Skill weight for sorting (higher numbers appear first, default: 0)',
            'type' => 'integer',
            'minimum' => -999,
            'maximum' => 999
        )
    ));
    
    // Register meta fields for Block Editor support
    register_meta('skill', '_skill_type', array(
        'type' => 'string',
        'description' => 'Skill category',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));
    
    register_meta('skill', '_skill_value', array(
        'type' => 'string',
        'description' => 'Skill name',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));
    
    register_meta('skill', '_skill_weight', array(
        'type' => 'integer',
        'description' => 'Skill weight for sorting',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));
}
add_action('rest_api_init', 'rae_add_skills_to_rest');

/**
 * Helper function to format employment date range
 */
function rae_format_employment_date_range($start_date, $end_date, $currently_employed) {
    if (empty($start_date)) {
        return null;
    }

    $formatted_range = $start_date;

    if ($currently_employed) {
        $formatted_range .= ' - Present';
    } elseif (!empty($end_date)) {
        $formatted_range .= ' - ' . $end_date;
    }

    return $formatted_range;
}

/**
 * Custom REST API endpoint for resume items (since show_in_rest is disabled)
 */
function rae_register_custom_resume_endpoint() {
    register_rest_route('wp/v2', '/resume', array(
        'methods' => WP_REST_Server::READABLE,
        'callback' => 'rae_get_resume_items',
        'permission_callback' => '__return_true', // Public endpoint for frontend
        'args' => array(
            'per_page' => array(
                'default' => 10,
                'sanitize_callback' => 'absint',
            ),
            'page' => array(
                'default' => 1,
                'sanitize_callback' => 'absint',
            ),
            'orderby' => array(
                'default' => 'date',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'order' => array(
                'default' => 'desc',
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    ));
    
    // Individual resume item endpoint
    register_rest_route('wp/v2', '/resume/(?P<id>\d+)', array(
        'methods' => WP_REST_Server::READABLE,
        'callback' => 'rae_get_single_resume_item',
        'permission_callback' => '__return_true', // Public endpoint for frontend
        'args' => array(
            'id' => array(
                'validate_callback' => function($param, $request, $key) {
                    return is_numeric($param);
                }
            ),
        ),
    ));
}
add_action('rest_api_init', 'rae_register_custom_resume_endpoint');

/**
 * Custom REST API endpoint for skills (since show_in_rest is disabled)
 */
function rae_register_custom_skills_endpoint() {
    register_rest_route('wp/v2', '/skills', array(
        'methods' => WP_REST_Server::READABLE,
        'callback' => 'rae_get_skills',
        'permission_callback' => '__return_true', // Public endpoint for frontend
        'args' => array(
            'per_page' => array(
                'default' => 100,
                'sanitize_callback' => 'absint',
            ),
            'page' => array(
                'default' => 1,
                'sanitize_callback' => 'absint',
            ),
            'orderby' => array(
                'default' => 'date',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'order' => array(
                'default' => 'desc',
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    ));
    
    // Individual skill endpoint
    register_rest_route('wp/v2', '/skills/(?P<id>\d+)', array(
        'methods' => WP_REST_Server::READABLE,
        'callback' => 'rae_get_single_skill',
        'permission_callback' => '__return_true', // Public endpoint for frontend
        'args' => array(
            'id' => array(
                'validate_callback' => function($param, $request, $key) {
                    return is_numeric($param);
                }
            ),
        ),
    ));
}
add_action('rest_api_init', 'rae_register_custom_skills_endpoint');

/**
 * Callback function to get skills
 */
function rae_get_skills($request) {
    $args = array(
        'post_type' => 'skill',
        'post_status' => 'publish',
        'posts_per_page' => $request->get_param('per_page'),
        'paged' => $request->get_param('page'),
        'orderby' => $request->get_param('orderby'),
        'order' => $request->get_param('order'),
    );
    
    $posts = get_posts($args);
    $data = array();
    
    foreach ($posts as $post) {
        $data[] = rae_prepare_skill_item($post);
    }
    
    return rest_ensure_response($data);
}

/**
 * Callback function to get single skill
 */
function rae_get_single_skill($request) {
    $id = $request->get_param('id');
    $post = get_post($id);
    
    if (empty($post) || $post->post_type !== 'skill' || $post->post_status !== 'publish') {
        return new WP_Error('not_found', 'Skill not found', array('status' => 404));
    }
    
    $data = rae_prepare_skill_item($post);
    return rest_ensure_response($data);
}

/**
 * Helper function to prepare skill item data for REST API response
 */
function rae_prepare_skill_item($post) {
    // Get skill meta
    $skills_type = get_post_meta($post->ID, '_skill_type', true);
    $skills_value = get_post_meta($post->ID, '_skill_value', true);
    $skills_weight = get_post_meta($post->ID, '_skill_weight', true);
    
    // Get featured image
    $featured_image_id = get_post_thumbnail_id($post->ID);
    $featured_image_url = $featured_image_id ? wp_get_attachment_image_url($featured_image_id, 'full') : null;
    
    return array(
        'id' => $post->ID,
        'date' => $post->post_date,
        'date_gmt' => $post->post_date_gmt,
        'guid' => array(
            'rendered' => get_permalink($post->ID)
        ),
        'modified' => $post->post_modified,
        'modified_gmt' => $post->post_modified_gmt,
        'slug' => $post->post_name,
        'status' => $post->post_status,
        'type' => $post->post_type,
        'link' => get_permalink($post->ID),
        'title' => array(
            'rendered' => get_the_title($post->ID)
        ),
        'content' => array(
            'rendered' => apply_filters('the_content', $post->post_content),
            'protected' => false
        ),
        'excerpt' => array(
            'rendered' => get_the_excerpt($post),
            'protected' => false
        ),
        'featured_media' => $featured_image_id ?: 0,
        'template' => '',
        'meta' => array(),
        'class_list' => get_post_class('', $post->ID),
        'featured_image_url' => $featured_image_url,
        'skills_type' => $skills_type ?: null,
        'skills_value' => $skills_value ?: null,
        'skills_weight' => $skills_weight !== '' ? (int)$skills_weight : 0,
        '_links' => array(
            'self' => array(
                array(
                    'href' => rest_url('wp/v2/skills/' . $post->ID)
                )
            ),
            'collection' => array(
                array(
                    'href' => rest_url('wp/v2/skills')
                )
            )
        )
    );
}

/**
 * Callback function to get resume items
 */
function rae_get_resume_items($request) {
    $args = array(
        'post_type' => 'resume',
        'post_status' => 'publish',
        'posts_per_page' => $request->get_param('per_page'),
        'paged' => $request->get_param('page'),
        'orderby' => $request->get_param('orderby'),
        'order' => $request->get_param('order'),
    );
    
    $posts = get_posts($args);
    $data = array();
    
    foreach ($posts as $post) {
        $data[] = rae_prepare_resume_item($post);
    }
    
    return rest_ensure_response($data);
}

/**
 * Callback function to get single resume item
 */
function rae_get_single_resume_item($request) {
    $id = $request->get_param('id');
    $post = get_post($id);
    
    if (empty($post) || $post->post_type !== 'resume' || $post->post_status !== 'publish') {
        return new WP_Error('not_found', 'Resume item not found', array('status' => 404));
    }
    
    $data = rae_prepare_resume_item($post);
    return rest_ensure_response($data);
}

/**
 * Helper function to prepare resume item data for REST API response
 */
function rae_prepare_resume_item($post) {
    // Get employment date meta
    $start_date = get_post_meta($post->ID, '_resume_start_date', true);
    $end_date = get_post_meta($post->ID, '_resume_end_date', true);
    $currently_employed = get_post_meta($post->ID, '_resume_currently_employed', true);
    $start_date_raw = get_post_meta($post->ID, '_resume_start_date_raw', true);
    $end_date_raw = get_post_meta($post->ID, '_resume_end_date_raw', true);
    
    // Get featured image
    $featured_image_id = get_post_thumbnail_id($post->ID);
    $featured_image_url = $featured_image_id ? wp_get_attachment_image_url($featured_image_id, 'full') : null;
    
    // Get related skills
    $related_skill_ids = get_post_meta($post->ID, '_resume_related_skills', true);
    $related_skills = array();
    
    if (is_array($related_skill_ids) && !empty($related_skill_ids)) {
        foreach ($related_skill_ids as $skill_id) {
            $skill_post = get_post($skill_id);
            if ($skill_post && $skill_post->post_type === 'skill' && $skill_post->post_status === 'publish') {
                $related_skills[] = rae_prepare_skill_item($skill_post);
            }
        }
        
        // Sort skills by weight (descending) then alphabetically
        usort($related_skills, function($a, $b) {
            $weight_diff = $b['skills_weight'] - $a['skills_weight'];
            if ($weight_diff !== 0) {
                return $weight_diff;
            }
            return strcmp($a['skills_value'] ?: $a['title']['rendered'], $b['skills_value'] ?: $b['title']['rendered']);
        });
    }
    
    return array(
        'id' => $post->ID,
        'date' => $post->post_date,
        'date_gmt' => $post->post_date_gmt,
        'guid' => array(
            'rendered' => get_permalink($post->ID)
        ),
        'modified' => $post->post_modified,
        'modified_gmt' => $post->post_modified_gmt,
        'slug' => $post->post_name,
        'status' => $post->post_status,
        'type' => $post->post_type,
        'link' => get_permalink($post->ID),
        'title' => array(
            'rendered' => get_the_title($post->ID)
        ),
        'content' => array(
            'rendered' => apply_filters('the_content', $post->post_content),
            'protected' => false
        ),
        'excerpt' => array(
            'rendered' => get_the_excerpt($post),
            'protected' => false
        ),
        'featured_media' => $featured_image_id ?: 0,
        'template' => '',
        'meta' => array(),
        'class_list' => get_post_class('', $post->ID),
        'featured_image_url' => $featured_image_url,
        'employment_dates' => array(
            'start_date' => $start_date ?: null,
            'end_date' => $end_date ?: null,
            'currently_employed' => $currently_employed === '1',
            'start_date_raw' => $start_date_raw ?: null,
            'end_date_raw' => $end_date_raw ?: null,
            'formatted_range' => rae_format_employment_date_range($start_date, $end_date, $currently_employed === '1')
        ),
        'related_skills' => $related_skills,
        '_links' => array(
            'self' => array(
                array(
                    'href' => rest_url('wp/v2/resume/' . $post->ID)
                )
            ),
            'collection' => array(
                array(
                    'href' => rest_url('wp/v2/resume')
                )
            )
        )
    );
}

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
 * Add employment dates meta box to resume post type
 */
function rae_add_employment_dates_meta_box() {
    add_meta_box(
        'rae_employment_dates',
        'Employment Dates',
        'rae_employment_dates_meta_box_callback',
        'resume',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'rae_add_employment_dates_meta_box');

/**
 * Add related skills meta box to resume post type
 */
function rae_add_resume_skills_meta_box() {
    add_meta_box(
        'rae_resume_skills',
        'Related Skills',
        'rae_resume_skills_meta_box_callback',
        'resume',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'rae_add_resume_skills_meta_box');

/**
 * Add skills meta box to skills post type
 */
function rae_add_skills_meta_box() {
    add_meta_box(
        'rae_skills_details',
        'Skill Details',
        'rae_skills_meta_box_callback',
        'skill',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'rae_add_skills_meta_box');

/**
 * Employment dates meta box callback
 */
function rae_employment_dates_meta_box_callback($post) {
    // Add nonce for security
    wp_nonce_field('rae_employment_dates_nonce', 'rae_employment_dates_nonce_field');
    
    // Get current values
    $start_date = get_post_meta($post->ID, '_resume_start_date', true);
    $end_date = get_post_meta($post->ID, '_resume_end_date', true);
    $currently_employed = get_post_meta($post->ID, '_resume_currently_employed', true);
    
    // Get raw dates for HTML5 date input (YYYY-MM-DD format)
    $start_date_raw = get_post_meta($post->ID, '_resume_start_date_raw', true);
    $end_date_raw = get_post_meta($post->ID, '_resume_end_date_raw', true);
    
    // Use raw dates for the form inputs
    $start_date_formatted = $start_date_raw ?: '';
    $end_date_formatted = ($end_date_raw && $end_date !== 'Present') ? $end_date_raw : '';
    
    ?>
    <table class="form-table">
        <tr>
            <th scope="row">
                <label for="resume_start_date">Start Date</label>
            </th>
            <td>
                <input type="date" 
                       id="resume_start_date" 
                       name="resume_start_date" 
                       value="<?php echo esc_attr($start_date_formatted); ?>" 
                       style="width: 200px;" />
                <p class="description">Select the employment start date</p>
            </td>
        </tr>
        <tr>
            <th scope="row">
                <label for="resume_currently_employed">Currently Employed</label>
            </th>
            <td>
                <input type="checkbox" 
                       id="resume_currently_employed" 
                       name="resume_currently_employed" 
                       value="1" 
                       <?php checked($currently_employed, '1'); ?> />
                <label for="resume_currently_employed">Check if this is your current position</label>
            </td>
        </tr>
        <tr id="end_date_row">
            <th scope="row">
                <label for="resume_end_date">End Date</label>
            </th>
            <td>
                <input type="date" 
                       id="resume_end_date" 
                       name="resume_end_date" 
                       value="<?php echo esc_attr($end_date_formatted); ?>" 
                       style="width: 200px;" />
                <p class="description">Select the employment end date (leave blank if currently employed)</p>
            </td>
        </tr>
    </table>
    
    <script type="text/javascript">
        jQuery(document).ready(function($) {
            // Function to toggle end date field
            function toggleEndDateField() {
                var isCurrentlyEmployed = $('#resume_currently_employed').is(':checked');
                if (isCurrentlyEmployed) {
                    $('#end_date_row').hide();
                    $('#resume_end_date').val('');
                } else {
                    $('#end_date_row').show();
                }
            }
            
            // Initial state
            toggleEndDateField();
            
            // On checkbox change
            $('#resume_currently_employed').change(function() {
                toggleEndDateField();
            });
        });
    </script>
    
    <style>
        .form-table th {
            width: 150px;
        }
        
        .form-table input[type="date"] {
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 3px;
        }
        
        .form-table .description {
            font-style: italic;
            color: #666;
            margin-top: 5px;
        }
    </style>
    <?php
}

/**
 * Save employment dates meta data
 */
function rae_save_employment_dates_meta($post_id) {
    // Check if nonce is valid
    if (!isset($_POST['rae_employment_dates_nonce_field']) || 
        !wp_verify_nonce($_POST['rae_employment_dates_nonce_field'], 'rae_employment_dates_nonce')) {
        return;
    }
    
    // Check if user has permission to edit post
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    // Check if this is an autosave
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    // Only save for resume post type
    if (get_post_type($post_id) !== 'resume') {
        return;
    }
    
    // Save start date
    if (isset($_POST['resume_start_date']) && !empty($_POST['resume_start_date'])) {
        $start_date = sanitize_text_field($_POST['resume_start_date']);
        // Convert to readable format and store
        $start_date_formatted = date('F Y', strtotime($start_date));
        update_post_meta($post_id, '_resume_start_date', $start_date_formatted);
        update_post_meta($post_id, '_resume_start_date_raw', $start_date); // Keep raw date for sorting
    } else {
        delete_post_meta($post_id, '_resume_start_date');
        delete_post_meta($post_id, '_resume_start_date_raw');
    }
    
    // Save currently employed status
    $currently_employed = isset($_POST['resume_currently_employed']) ? '1' : '0';
    update_post_meta($post_id, '_resume_currently_employed', $currently_employed);
    
    // Save end date (only if not currently employed)
    if ($currently_employed === '0' && isset($_POST['resume_end_date']) && !empty($_POST['resume_end_date'])) {
        $end_date = sanitize_text_field($_POST['resume_end_date']);
        // Convert to readable format and store
        $end_date_formatted = date('F Y', strtotime($end_date));
        update_post_meta($post_id, '_resume_end_date', $end_date_formatted);
        update_post_meta($post_id, '_resume_end_date_raw', $end_date); // Keep raw date for sorting
    } else {
        // If currently employed, clear end date and set to "Present"
        if ($currently_employed === '1') {
            update_post_meta($post_id, '_resume_end_date', 'Present');
            delete_post_meta($post_id, '_resume_end_date_raw');
        } else {
            delete_post_meta($post_id, '_resume_end_date');
            delete_post_meta($post_id, '_resume_end_date_raw');
        }
    }
}
add_action('save_post', 'rae_save_employment_dates_meta');

/**
 * Resume skills meta box callback for selecting related skills
 */
function rae_resume_skills_meta_box_callback($post) {
    // Add nonce for security
    wp_nonce_field('rae_resume_skills_nonce', 'rae_resume_skills_nonce_field');
    
    // Get current selected skills
    $selected_skills = get_post_meta($post->ID, '_resume_related_skills', true);
    if (!is_array($selected_skills)) {
        $selected_skills = array();
    }
    
    // Get all skills grouped by category
    $args = array(
        'post_type' => 'skill',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'ASC'
    );
    
    $skills_query = new WP_Query($args);
    $skills_by_category = array();
    
    if ($skills_query->have_posts()) {
        while ($skills_query->have_posts()) {
            $skills_query->the_post();
            $skill_id = get_the_ID();
            $skill_type = get_post_meta($skill_id, '_skill_type', true) ?: 'Other';
            $skill_value = get_post_meta($skill_id, '_skill_value', true) ?: get_the_title();
            $skill_weight = get_post_meta($skill_id, '_skill_weight', true) ?: 0;
            
            if (!isset($skills_by_category[$skill_type])) {
                $skills_by_category[$skill_type] = array();
            }
            
            $skills_by_category[$skill_type][] = array(
                'id' => $skill_id,
                'title' => get_the_title(),
                'value' => $skill_value,
                'weight' => $skill_weight
            );
        }
    }
    wp_reset_postdata();
    
    // Sort categories and skills within categories by weight
    ksort($skills_by_category);
    foreach ($skills_by_category as $category => &$skills) {
        usort($skills, function($a, $b) {
            $weight_diff = $b['weight'] - $a['weight'];
            return $weight_diff !== 0 ? $weight_diff : strcmp($a['value'], $b['value']);
        });
    }
    
    ?>
    <div class="rae-resume-skills-selector">
        <div class="skills-search-container" style="margin-bottom: 20px;">
            <input type="text" 
                   id="skills-search" 
                   placeholder="Search skills..." 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;" />
            <p class="description">Search and select skills related to this resume item. Selected skills will appear highlighted.</p>
        </div>
        
        <div class="selected-skills-container" style="margin-bottom: 20px; min-height: 40px; padding: 10px; border: 1px solid #ddd; border-radius: 3px; background: #f9f9f9;">
            <strong>Selected Skills:</strong>
            <div id="selected-skills-display" style="margin-top: 10px;">
                <?php if (empty($selected_skills)): ?>
                    <span class="no-skills-selected" style="color: #666; font-style: italic;">No skills selected</span>
                <?php else: ?>
                    <?php foreach ($selected_skills as $skill_id): ?>
                        <?php 
                        $skill_post = get_post($skill_id);
                        if ($skill_post):
                            $skill_value = get_post_meta($skill_id, '_skill_value', true) ?: $skill_post->post_title;
                            $skill_type = get_post_meta($skill_id, '_skill_type', true) ?: 'Other';
                        ?>
                            <span class="selected-skill-pill" data-skill-id="<?php echo $skill_id; ?>" 
                                  style="display: inline-block; margin: 2px 5px 2px 0; padding: 4px 8px; background: #0073aa; color: white; border-radius: 3px; font-size: 12px;">
                                <?php echo esc_html($skill_value); ?> 
                                <span class="remove-skill" style="cursor: pointer; margin-left: 5px; font-weight: bold;">&times;</span>
                            </span>
                        <?php endif; ?>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
        
        <div class="skills-by-category" style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 15px;">
            <?php unset($skills);
            foreach ($skills_by_category as $category => $skills): ?>
                <div class="category-group" style="margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #23282d; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
                        <?php echo esc_html($category); ?>
                        <span class="category-select-all" data-category="<?php echo esc_attr($category); ?>" 
                              style="float: right; font-size: 12px; color: #0073aa; cursor: pointer; font-weight: normal;">
                            Select All
                        </span>
                    </h4>
                    <div class="skills-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 5px;">
                        <?php foreach ($skills as $skill): ?>
                            <label class="skill-checkbox-label" data-skill-id="<?php echo $skill['id']; ?>" 
                                   data-skill-value="<?php echo esc_attr($skill['value']); ?>"
                                   data-skill-category="<?php echo esc_attr($category); ?>"
                                   style="display: flex; align-items: center; padding: 5px; border: 1px solid transparent; border-radius: 3px; cursor: pointer; font-size: 13px;
                                          <?php echo in_array($skill['id'], $selected_skills) ? 'background: #e7f3ff; border-color: #0073aa;' : ''; ?>">
                                <input type="checkbox" 
                                       name="resume_related_skills[]" 
                                       value="<?php echo $skill['id']; ?>"
                                       <?php checked(in_array($skill['id'], $selected_skills)); ?>
                                       style="margin-right: 8px;" />
                                <span class="skill-name"><?php echo esc_html($skill['value']); ?></span>
                                <?php if ($skill['weight'] != 0): ?>
                                    <span class="skill-weight" style="margin-left: auto; font-size: 11px; color: #666;">
                                        (<?php echo $skill['weight']; ?>)
                                    </span>
                                <?php endif; ?>
                            </label>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
        
        <?php if (empty($skills_by_category)): ?>
            <p style="text-align: center; color: #666; font-style: italic; padding: 20px;">
                No skills found. <a href="<?php echo admin_url('post-new.php?post_type=skill'); ?>">Create some skills</a> first.
            </p>
        <?php endif; ?>
    </div>
    
    <script type="text/javascript">
        jQuery(document).ready(function($) {
            var $searchInput = $('#skills-search');
            var $selectedDisplay = $('#selected-skills-display');
            var $noSkillsMessage = $('.no-skills-selected');
            
            // Search functionality
            $searchInput.on('input', function() {
                var searchTerm = $(this).val().toLowerCase();
                
                $('.skill-checkbox-label').each(function() {
                    var skillName = $(this).data('skill-value').toLowerCase();
                    var categoryName = $(this).data('skill-category').toLowerCase();
                    
                    if (skillName.includes(searchTerm) || categoryName.includes(searchTerm)) {
                        $(this).show();
                    } else {
                        $(this).hide();
                    }
                });
                
                // Show/hide category headers
                $('.category-group').each(function() {
                    var $group = $(this);
                    var hasVisibleSkills = $group.find('.skill-checkbox-label:visible').length > 0;
                    $group.toggle(hasVisibleSkills);
                });
            });
            
            // Checkbox change handler
            $('input[name="resume_related_skills[]"]').on('change', function() {
                updateSelectedSkillsDisplay();
                highlightSelectedSkills();
            });
            
            // Remove skill functionality
            $(document).on('click', '.remove-skill', function() {
                var skillId = $(this).closest('.selected-skill-pill').data('skill-id');
                $('input[value="' + skillId + '"]').prop('checked', false).trigger('change');
            });
            
            // Select all in category
            $('.category-select-all').on('click', function() {
                var category = $(this).data('category');
                var $categoryGroup = $(this).closest('.category-group');
                var $checkboxes = $categoryGroup.find('input[type="checkbox"]');
                var allChecked = $checkboxes.filter(':checked').length === $checkboxes.length;
                
                $checkboxes.prop('checked', !allChecked).trigger('change');
                $(this).text(allChecked ? 'Select All' : 'Deselect All');
            });
            
            function updateSelectedSkillsDisplay() {
                var selectedSkills = [];
                $('input[name="resume_related_skills[]"]:checked').each(function() {
                    var $label = $(this).closest('.skill-checkbox-label');
                    selectedSkills.push({
                        id: $(this).val(),
                        name: $label.data('skill-value')
                    });
                });
                
                if (selectedSkills.length === 0) {
                    $selectedDisplay.html('<span class="no-skills-selected" style="color: #666; font-style: italic;">No skills selected</span>');
                } else {
                    var html = '';
                    selectedSkills.forEach(function(skill) {
                        html += '<span class="selected-skill-pill" data-skill-id="' + skill.id + '" ' +
                               'style="display: inline-block; margin: 2px 5px 2px 0; padding: 4px 8px; background: #0073aa; color: white; border-radius: 3px; font-size: 12px;">' +
                               skill.name + ' <span class="remove-skill" style="cursor: pointer; margin-left: 5px; font-weight: bold;">&times;</span></span>';
                    });
                    $selectedDisplay.html(html);
                }
            }
            
            function highlightSelectedSkills() {
                $('.skill-checkbox-label').each(function() {
                    var $label = $(this);
                    var $checkbox = $label.find('input[type="checkbox"]');
                    
                    if ($checkbox.is(':checked')) {
                        $label.css({
                            'background': '#e7f3ff',
                            'border-color': '#0073aa'
                        });
                    } else {
                        $label.css({
                            'background': '',
                            'border-color': 'transparent'
                        });
                    }
                });
            }
            
            // Update category select all text
            function updateSelectAllText() {
                $('.category-group').each(function() {
                    var $group = $(this);
                    var $checkboxes = $group.find('input[type="checkbox"]');
                    var $selectAll = $group.find('.category-select-all');
                    var checkedCount = $checkboxes.filter(':checked').length;
                    
                    $selectAll.text(checkedCount === $checkboxes.length ? 'Deselect All' : 'Select All');
                });
            }
            
            // Initial setup
            highlightSelectedSkills();
            updateSelectAllText();
        });
    </script>
    
    <style>
        .rae-resume-skills-selector .skill-checkbox-label:hover {
            background: #f0f0f0 !important;
        }
        
        .rae-resume-skills-selector .skill-checkbox-label input[type="checkbox"]:checked + .skill-name {
            font-weight: bold;
        }
        
        .selected-skill-pill:hover .remove-skill {
            color: #ff6b6b !important;
        }
        
        .category-select-all:hover {
            text-decoration: underline;
        }
    </style>
    <?php
}

/**
 * Save resume related skills meta data
 */
function rae_save_resume_skills_meta($post_id) {
    // Check if nonce is valid
    if (!isset($_POST['rae_resume_skills_nonce_field']) || 
        !wp_verify_nonce($_POST['rae_resume_skills_nonce_field'], 'rae_resume_skills_nonce')) {
        return;
    }
    
    // Check if user has permission to edit post
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    // Check if this is an autosave
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    // Only save for resume post type
    if (get_post_type($post_id) !== 'resume') {
        return;
    }
    
    // Save related skills
    if (isset($_POST['resume_related_skills']) && is_array($_POST['resume_related_skills'])) {
        $skill_ids = array_map('intval', $_POST['resume_related_skills']);
        // Validate that all IDs are valid skill posts
        $validated_skills = array();
        foreach ($skill_ids as $skill_id) {
            $skill_post = get_post($skill_id);
            if ($skill_post && $skill_post->post_type === 'skill' && $skill_post->post_status === 'publish') {
                $validated_skills[] = $skill_id;
            }
        }
        update_post_meta($post_id, '_resume_related_skills', $validated_skills);
    } else {
        // No skills selected, save empty array
        update_post_meta($post_id, '_resume_related_skills', array());
    }
}
add_action('save_post', 'rae_save_resume_skills_meta');

/**
 * Skills meta box callback with dynamic text inputs and autocomplete
 */
function rae_skills_meta_box_callback($post) {
    // Add nonce for security
    wp_nonce_field('rae_skills_details_nonce', 'rae_skills_details_nonce_field');
    
    // Get current values
    $skills_type = get_post_meta($post->ID, '_skill_type', true);
    $skills_value = get_post_meta($post->ID, '_skill_value', true);
    $skills_weight = get_post_meta($post->ID, '_skill_weight', true);
    
    // Get existing skill types and values for autocomplete
    global $wpdb;
    $existing_types = $wpdb->get_col(
        "SELECT DISTINCT meta_value FROM {$wpdb->postmeta} 
         WHERE meta_key = '_skill_type' 
         AND meta_value != '' 
         ORDER BY meta_value"
    );
    $existing_values = $wpdb->get_col(
        "SELECT DISTINCT meta_value FROM {$wpdb->postmeta} 
         WHERE meta_key = '_skill_value' 
         AND meta_value != '' 
         ORDER BY meta_value"
    );
    
    ?>
    <table class="form-table">
        <tr>
            <th scope="row">
                <label for="skill_type">Skill Category</label>
            </th>
            <td>
                <input type="text" 
                       id="skill_type" 
                       name="skill_type" 
                       value="<?php echo esc_attr($skills_type); ?>" 
                       style="width: 300px;" 
                       list="skill_type_list"
                       placeholder="e.g., Languages & Frameworks, Cloud & DevOps" />
                <datalist id="skill_type_list">
                    <?php foreach ($existing_types as $type): ?>
                        <option value="<?php echo esc_attr($type); ?>">
                    <?php endforeach; ?>
                </datalist>
                <p class="description">Enter the skill category (e.g., "Languages & Frameworks", "Cloud & DevOps"). Use existing categories for consistency.</p>
            </td>
        </tr>
        <tr>
            <th scope="row">
                <label for="skill_value">Skill Name</label>
            </th>
            <td>
                <input type="text" 
                       id="skill_value" 
                       name="skill_value" 
                       value="<?php echo esc_attr($skills_value); ?>" 
                       style="width: 300px;" 
                       list="skill_value_list"
                       placeholder="e.g., TypeScript, AWS, Docker" />
                <datalist id="skill_value_list">
                    <?php foreach ($existing_values as $value): ?>
                        <option value="<?php echo esc_attr($value); ?>">
                    <?php endforeach; ?>
                </datalist>
                <p class="description">Enter the actual skill name (e.g., "TypeScript", "AWS", "Docker"). This is what will be displayed on the frontend.</p>
            </td>
        </tr>
        <tr>
            <th scope="row">
                <label for="skill_weight">Skill Weight</label>
            </th>
            <td>
                <input type="number" 
                       id="skill_weight" 
                       name="skill_weight" 
                       value="<?php echo esc_attr($skills_weight); ?>" 
                       style="width: 100px;" 
                       min="-999" 
                       max="999" 
                       step="1"
                       placeholder="0" />
                <p class="description">Weight for sorting (higher numbers appear first). Default: 0. Range: -999 to 999.</p>
                <p class="description"><strong>Examples:</strong> Primary skills: 10, Standard skills: 0, Learning skills: -5</p>
            </td>
        </tr>
    </table>
    
    <script type="text/javascript">
        jQuery(document).ready(function($) {
            // Enhanced autocomplete and validation
            $('#skill_type, #skill_value').on('input', function() {
                // Add visual feedback for new vs existing values
                var $input = $(this);
                var value = $input.val();
                var datalistId = $input.attr('list');
                var existsInList = false;
                
                $('#' + datalistId + ' option').each(function() {
                    if ($(this).val() === value) {
                        existsInList = true;
                        return false;
                    }
                });
                
                if (existsInList) {
                    $input.css('border-color', '#00a32a'); // Green for existing
                } else if (value.length > 0) {
                    $input.css('border-color', '#dba617'); // Yellow for new
                } else {
                    $input.css('border-color', ''); // Default
                }
            });
            
            // Auto-populate title field if empty
            $('#skill_value').on('blur', function() {
                var skillValue = $(this).val();
                var $titleField = $('#title');
                
                if (skillValue && !$titleField.val()) {
                    $titleField.val(skillValue);
                }
            });
        });
    </script>
    
    <style>
        .form-table th {
            width: 150px;
        }
        
        .form-table input[type="text"] {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 3px;
            font-size: 14px;
        }
        
        .form-table .description {
            font-style: italic;
            color: #666;
            margin-top: 5px;
            max-width: 400px;
        }
        
        .form-table input[type="text"]:focus {
            border-color: #0073aa;
            box-shadow: 0 0 2px rgba(0, 115, 170, 0.3);
            outline: none;
        }
    </style>
    <?php
}

/**
 * Save skills meta data with validation
 */
function rae_save_skills_meta($post_id) {
    // Check if nonce is valid
    if (!isset($_POST['rae_skills_details_nonce_field']) || 
        !wp_verify_nonce($_POST['rae_skills_details_nonce_field'], 'rae_skills_details_nonce')) {
        return;
    }
    
    // Check if user has permission to edit post
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    // Check if this is an autosave
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    // Only save for skill post type
    if (get_post_type($post_id) !== 'skill') {
        return;
    }
    
    // Save skill type (category)
    if (isset($_POST['skill_type'])) {
        $skill_type = sanitize_text_field(trim($_POST['skill_type']));
        if (!empty($skill_type)) {
            update_post_meta($post_id, '_skill_type', $skill_type);
        } else {
            delete_post_meta($post_id, '_skill_type');
        }
    }
    
    // Save skill value (actual skill name)
    if (isset($_POST['skill_value'])) {
        $skill_value = sanitize_text_field(trim($_POST['skill_value']));
        if (!empty($skill_value)) {
            update_post_meta($post_id, '_skill_value', $skill_value);
            
            // Auto-update title if it's empty or matches the old skill value
            $current_title = get_the_title($post_id);
            if (empty($current_title) || $current_title === 'Auto Draft') {
                wp_update_post(array(
                    'ID' => $post_id,
                    'post_title' => $skill_value
                ));
            }
        } else {
            delete_post_meta($post_id, '_skill_value');
        }
    }
    
    // Save skill weight
    if (isset($_POST['skill_weight'])) {
        $skill_weight = intval($_POST['skill_weight']);
        // Validate weight range (-999 to 999)
        $skill_weight = max(-999, min(999, $skill_weight));
        update_post_meta($post_id, '_skill_weight', $skill_weight);
    } else {
        // Default to 0 if not provided
        update_post_meta($post_id, '_skill_weight', 0);
    }
}
add_action('save_post', 'rae_save_skills_meta');

/**
 * Enqueue admin styles and scripts
 */
function rae_admin_enqueue_scripts($hook) {
    // Only load on post edit pages
    if ($hook === 'post.php' || $hook === 'post-new.php') {
        wp_enqueue_script('jquery');
        wp_enqueue_style('rae-admin-style', get_template_directory_uri() . '/style.css');
    }
}
add_action('admin_enqueue_scripts', 'rae_admin_enqueue_scripts');