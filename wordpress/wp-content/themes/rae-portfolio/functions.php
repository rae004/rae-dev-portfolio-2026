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
        'show_in_rest' => false, // Disable Block Editor to prevent auto-save 404 errors
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
    
    // Add skills_info_url field to skill post type
    register_rest_field('skill', 'skills_info_url', array(
        'get_callback' => function($post) {
            return get_post_meta($post['id'], '_skill_info_url', true) ?: null;
        },
        'update_callback' => function($value, $post) {
            $url = sanitize_text_field($value);
            if (!empty($url)) {
                $url = esc_url_raw($url);
                return update_post_meta($post->ID, '_skill_info_url', $url);
            } else {
                return delete_post_meta($post->ID, '_skill_info_url');
            }
        },
        'schema' => array(
            'description' => 'Skill information URL (documentation, tutorial, etc.)',
            'type' => 'string',
            'format' => 'uri'
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
    
    register_meta('skill', '_skill_info_url', array(
        'type' => 'string',
        'description' => 'Skill information URL',
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
    $skills_info_url = get_post_meta($post->ID, '_skill_info_url', true);
    
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
        'skills_info_url' => $skills_info_url ?: null,
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
 * Add related skills meta box to media project post type
 */
function rae_add_media_project_skills_meta_box() {
    add_meta_box(
        'rae_media_project_skills',
        'Related Skills',
        'rae_media_project_skills_meta_box_callback',
        'media-project',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'rae_add_media_project_skills_meta_box');

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
    $skills_info_url = get_post_meta($post->ID, '_skill_info_url', true);
    
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
        <tr>
            <th scope="row">
                <label for="skill_info_url">Information URL</label>
            </th>
            <td>
                <input type="url" 
                       id="skill_info_url" 
                       name="skill_info_url" 
                       value="<?php echo esc_attr($skills_info_url); ?>" 
                       style="width: 400px;" 
                       placeholder="https://example.com/documentation" />
                <p class="description">Optional URL to documentation, tutorial, or information about this skill. This will make skill pills clickable on the frontend.</p>
                <p class="description"><strong>Examples:</strong> https://react.dev, https://docs.aws.amazon.com, https://docs.docker.com</p>
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
            
            // URL validation feedback
            $('#skill_info_url').on('input blur', function() {
                var $input = $(this);
                var url = $input.val().trim();
                
                if (url === '') {
                    $input.css('border-color', ''); // Default
                } else if (isValidUrl(url)) {
                    $input.css('border-color', '#00a32a'); // Green for valid URL
                } else {
                    $input.css('border-color', '#dc3545'); // Red for invalid URL
                }
            });
            
            function isValidUrl(string) {
                try {
                    new URL(string);
                    return true;
                } catch (_) {
                    return false;
                }
            }
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
    
    // Save skill information URL
    if (isset($_POST['skill_info_url'])) {
        $skill_info_url = sanitize_text_field(trim($_POST['skill_info_url']));
        if (!empty($skill_info_url)) {
            // Validate URL format
            $skill_info_url = esc_url_raw($skill_info_url);
            if (filter_var($skill_info_url, FILTER_VALIDATE_URL)) {
                update_post_meta($post_id, '_skill_info_url', $skill_info_url);
            } else {
                // Invalid URL - delete meta
                delete_post_meta($post_id, '_skill_info_url');
            }
        } else {
            delete_post_meta($post_id, '_skill_info_url');
        }
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

/**
 * Custom REST API endpoint for media projects (since show_in_rest is disabled)
 */
function rae_register_custom_media_projects_endpoint() {
    register_rest_route('wp/v2', '/media-projects', array(
        'methods' => WP_REST_Server::READABLE,
        'callback' => 'rae_get_media_projects',
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
            'project_type' => array(
                'default' => '',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'search' => array(
                'default' => '',
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    ));
    
    // Individual media project endpoint
    register_rest_route('wp/v2', '/media-projects/(?P<id>\d+)', array(
        'methods' => WP_REST_Server::READABLE,
        'callback' => 'rae_get_single_media_project',
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
add_action('rest_api_init', 'rae_register_custom_media_projects_endpoint');

/**
 * Callback function to get media projects
 */
function rae_get_media_projects($request) {
    $args = array(
        'post_type' => 'media-project',
        'post_status' => 'publish',
        'posts_per_page' => $request->get_param('per_page'),
        'paged' => $request->get_param('page'),
        'orderby' => $request->get_param('orderby'),
        'order' => $request->get_param('order'),
    );
    
    // Add project type filter
    $project_type = $request->get_param('project_type');
    if (!empty($project_type)) {
        $args['meta_query'] = array(
            array(
                'key' => '_media_project_type',
                'value' => $project_type,
                'compare' => '='
            )
        );
    }
    
    // Add search functionality
    $search = $request->get_param('search');
    if (!empty($search)) {
        $args['s'] = $search;
    }
    
    $posts = get_posts($args);
    $data = array();
    
    foreach ($posts as $post) {
        $data[] = rae_prepare_media_project_item($post);
    }
    
    return rest_ensure_response($data);
}

/**
 * Callback function to get single media project
 */
function rae_get_single_media_project($request) {
    $id = $request->get_param('id');
    $post = get_post($id);
    
    if (empty($post) || $post->post_type !== 'media-project' || $post->post_status !== 'publish') {
        return new WP_Error('not_found', 'Media project not found', array('status' => 404));
    }
    
    $data = rae_prepare_media_project_item($post);
    return rest_ensure_response($data);
}

/**
 * Helper function to prepare media project data for REST API response
 */
function rae_prepare_media_project_item($post) {
    // Get project type
    $project_type = get_post_meta($post->ID, '_media_project_type', true);
    
    // Get featured image
    $featured_image_id = get_post_thumbnail_id($post->ID);
    $featured_image_url = $featured_image_id ? wp_get_attachment_image_url($featured_image_id, 'full') : null;
    
    // Base response structure
    $response = array(
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
        'project_type' => $project_type ?: null,
        '_links' => array(
            'self' => array(
                array(
                    'href' => rest_url('wp/v2/media-projects/' . $post->ID)
                )
            ),
            'collection' => array(
                array(
                    'href' => rest_url('wp/v2/media-projects')
                )
            )
        )
    );
    
    // Add project-specific fields based on type
    if ($project_type === 'Music') {
        // Music project fields
        $response['music_artist_name'] = get_post_meta($post->ID, '_music_artist_name', true) ?: null;
        $response['music_album_names'] = rae_get_list_meta($post->ID, '_music_album_names');
        $response['music_songs_list'] = rae_get_list_meta($post->ID, '_music_songs_list');
        $response['music_release_date'] = get_post_meta($post->ID, '_music_release_date', true) ?: null;
        $response['music_artist_website'] = get_post_meta($post->ID, '_music_artist_website', true) ?: null;
        $response['music_online_links'] = rae_get_json_meta($post->ID, '_music_online_links');
        $response['music_genre'] = get_post_meta($post->ID, '_music_genre', true) ?: null;
        $response['music_record_label'] = get_post_meta($post->ID, '_music_record_label', true) ?: null;
        $response['music_duration'] = get_post_meta($post->ID, '_music_duration', true) ?: null;
        $response['music_studio'] = get_post_meta($post->ID, '_music_studio', true) ?: null;
        $response['music_producer'] = get_post_meta($post->ID, '_music_producer', true) ?: null;
        $response['music_collaborators'] = rae_get_list_meta($post->ID, '_music_collaborators');
    } elseif ($project_type === 'Audio_Post_Production') {
        // Audio Post Production fields
        $response['audio_project_name'] = get_post_meta($post->ID, '_audio_project_name', true) ?: null;
        $response['audio_director'] = get_post_meta($post->ID, '_audio_director', true) ?: null;
        $response['audio_writers'] = rae_get_list_meta($post->ID, '_audio_writers');
        $response['audio_producers'] = rae_get_list_meta($post->ID, '_audio_producers');
        $response['audio_actors'] = rae_get_list_meta($post->ID, '_audio_actors');
        $response['audio_studios'] = rae_get_list_meta($post->ID, '_audio_studios');
        $response['audio_genre'] = get_post_meta($post->ID, '_audio_genre', true) ?: null;
        $response['audio_release_date'] = get_post_meta($post->ID, '_audio_release_date', true) ?: null;
        $response['audio_project_type'] = get_post_meta($post->ID, '_audio_project_type', true) ?: null;
        $response['audio_duration'] = get_post_meta($post->ID, '_audio_duration', true) ?: null;
        $response['audio_language'] = get_post_meta($post->ID, '_audio_language', true) ?: null;
        $response['audio_engineer'] = get_post_meta($post->ID, '_audio_engineer', true) ?: null;
        $response['audio_sound_designer'] = get_post_meta($post->ID, '_audio_sound_designer', true) ?: null;
        $response['audio_awards'] = get_post_meta($post->ID, '_audio_awards', true) ?: null;
        $response['audio_distribution'] = get_post_meta($post->ID, '_audio_distribution', true) ?: null;
    }
    
    // Get related skills
    $related_skill_ids = get_post_meta($post->ID, '_media_project_related_skills', true);
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
    
    $response['related_skills'] = $related_skills;
    
    return $response;
}

/**
 * Helper function to get comma-separated list meta as array
 */
function rae_get_list_meta($post_id, $meta_key) {
    $value = get_post_meta($post_id, $meta_key, true);
    if (empty($value)) {
        return null;
    }
    
    $list = array_map('trim', explode(',', $value));
    return array_filter($list); // Remove empty items
}

/**
 * Helper function to get JSON meta as array
 */
function rae_get_json_meta($post_id, $meta_key) {
    $value = get_post_meta($post_id, $meta_key, true);
    if (empty($value)) {
        return null;
    }
    
    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : null;
}

/**
 * Add media project meta boxes
 */
function rae_add_media_project_meta_boxes() {
    add_meta_box(
        'rae_media_project_type',
        'Project Type',
        'rae_media_project_type_meta_box_callback',
        'media-project',
        'normal',
        'high'
    );
    
    add_meta_box(
        'rae_music_project_details',
        'Music Project Details',
        'rae_music_project_details_meta_box_callback',
        'media-project',
        'normal',
        'high'
    );
    
    add_meta_box(
        'rae_audio_post_project_details',
        'Audio Post Production Details',
        'rae_audio_post_project_details_meta_box_callback',
        'media-project',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'rae_add_media_project_meta_boxes');

/**
 * Project type selection meta box
 */
function rae_media_project_type_meta_box_callback($post) {
    wp_nonce_field('rae_media_project_nonce', 'rae_media_project_nonce_field');
    
    $project_type = get_post_meta($post->ID, '_media_project_type', true);
    ?>
    <table class="form-table">
        <tr>
            <th scope="row">
                <label for="media_project_type">Project Type</label>
            </th>
            <td>
                <select id="media_project_type" name="media_project_type" style="width: 300px;">
                    <option value="">Select Project Type</option>
                    <option value="Music" <?php selected($project_type, 'Music'); ?>>Music Project</option>
                    <option value="Audio_Post_Production" <?php selected($project_type, 'Audio_Post_Production'); ?>>Audio Post Production</option>
                </select>
                <p class="description">Select the type of media project. This determines which fields are available below.</p>
            </td>
        </tr>
    </table>
    
    <script type="text/javascript">
        jQuery(document).ready(function($) {
            function toggleProjectFields() {
                var projectType = $('#media_project_type').val();
                
                if (projectType === 'Music') {
                    $('#rae_music_project_details').show();
                    $('#rae_audio_post_project_details').hide();
                } else if (projectType === 'Audio_Post_Production') {
                    $('#rae_music_project_details').hide();
                    $('#rae_audio_post_project_details').show();
                } else {
                    $('#rae_music_project_details').hide();
                    $('#rae_audio_post_project_details').hide();
                }
            }
            
            // Initial state
            toggleProjectFields();
            
            // On change
            $('#media_project_type').change(function() {
                toggleProjectFields();
            });
        });
    </script>
    <?php
}

/**
 * Music project details meta box
 */
function rae_music_project_details_meta_box_callback($post) {
    // Get current values
    $artist_name = get_post_meta($post->ID, '_music_artist_name', true);
    $album_names = get_post_meta($post->ID, '_music_album_names', true);
    $songs_list = get_post_meta($post->ID, '_music_songs_list', true);
    $release_date = get_post_meta($post->ID, '_music_release_date', true);
    $artist_website = get_post_meta($post->ID, '_music_artist_website', true);
    $online_links = get_post_meta($post->ID, '_music_online_links', true);
    $genre = get_post_meta($post->ID, '_music_genre', true);
    $record_label = get_post_meta($post->ID, '_music_record_label', true);
    $duration = get_post_meta($post->ID, '_music_duration', true);
    $studio = get_post_meta($post->ID, '_music_studio', true);
    $producer = get_post_meta($post->ID, '_music_producer', true);
    $collaborators = get_post_meta($post->ID, '_music_collaborators', true);
    
    ?>
    <table class="form-table">
        <tr>
            <th scope="row"><label for="music_artist_name">Artist Name</label></th>
            <td>
                <input type="text" id="music_artist_name" name="music_artist_name" value="<?php echo esc_attr($artist_name); ?>" style="width: 100%;" />
                <p class="description">Name of the artist or band</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="music_album_names">Album Names</label></th>
            <td>
                <input type="text" id="music_album_names" name="music_album_names" value="<?php echo esc_attr($album_names); ?>" style="width: 100%;" />
                <p class="description">Album names (comma-separated if multiple)</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="music_songs_list">Songs List</label></th>
            <td>
                <textarea id="music_songs_list" name="music_songs_list" rows="3" style="width: 100%;"><?php echo esc_textarea($songs_list); ?></textarea>
                <p class="description">List of songs (comma-separated)</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="music_release_date">Release Date</label></th>
            <td>
                <input type="date" id="music_release_date" name="music_release_date" value="<?php echo esc_attr($release_date); ?>" />
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="music_artist_website">Artist Website</label></th>
            <td>
                <input type="url" id="music_artist_website" name="music_artist_website" value="<?php echo esc_attr($artist_website); ?>" style="width: 100%;" />
                <p class="description">Official artist website URL</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="music_genre">Genre</label></th>
            <td>
                <input type="text" id="music_genre" name="music_genre" value="<?php echo esc_attr($genre); ?>" style="width: 100%;" />
                <p class="description">Music genre (for filtering)</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="music_record_label">Record Label</label></th>
            <td>
                <input type="text" id="music_record_label" name="music_record_label" value="<?php echo esc_attr($record_label); ?>" style="width: 100%;" />
                <p class="description">Record label (for filtering)</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="music_duration">Duration</label></th>
            <td>
                <input type="text" id="music_duration" name="music_duration" value="<?php echo esc_attr($duration); ?>" style="width: 200px;" />
                <p class="description">Project duration (e.g., "3:45", "45 minutes")</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="music_studio">Recording Studio</label></th>
            <td>
                <input type="text" id="music_studio" name="music_studio" value="<?php echo esc_attr($studio); ?>" style="width: 100%;" />
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="music_producer">Producer</label></th>
            <td>
                <input type="text" id="music_producer" name="music_producer" value="<?php echo esc_attr($producer); ?>" style="width: 100%;" />
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="music_collaborators">Collaborators</label></th>
            <td>
                <input type="text" id="music_collaborators" name="music_collaborators" value="<?php echo esc_attr($collaborators); ?>" style="width: 100%;" />
                <p class="description">Other collaborators (comma-separated)</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="music_online_links">Streaming Links</label></th>
            <td>
                <textarea id="music_online_links" name="music_online_links" rows="4" style="width: 100%;" placeholder='[{"platform": "Spotify", "url": "https://...", "type": "audio"}, {"platform": "YouTube", "url": "https://...", "type": "video"}]'><?php echo esc_textarea($online_links); ?></textarea>
                <p class="description">JSON array of streaming links with platform, url, and type (audio/video)</p>
            </td>
        </tr>
    </table>
    <?php
}

/**
 * Audio post production details meta box
 */
function rae_audio_post_project_details_meta_box_callback($post) {
    // Get current values
    $project_name = get_post_meta($post->ID, '_audio_project_name', true);
    $director = get_post_meta($post->ID, '_audio_director', true);
    $writers = get_post_meta($post->ID, '_audio_writers', true);
    $producers = get_post_meta($post->ID, '_audio_producers', true);
    $actors = get_post_meta($post->ID, '_audio_actors', true);
    $studios = get_post_meta($post->ID, '_audio_studios', true);
    $genre = get_post_meta($post->ID, '_audio_genre', true);
    $release_date = get_post_meta($post->ID, '_audio_release_date', true);
    $project_type = get_post_meta($post->ID, '_audio_project_type', true);
    $duration = get_post_meta($post->ID, '_audio_duration', true);
    $language = get_post_meta($post->ID, '_audio_language', true);
    $engineer = get_post_meta($post->ID, '_audio_engineer', true);
    $sound_designer = get_post_meta($post->ID, '_audio_sound_designer', true);
    $awards = get_post_meta($post->ID, '_audio_awards', true);
    $distribution = get_post_meta($post->ID, '_audio_distribution', true);
    
    ?>
    <table class="form-table">
        <tr>
            <th scope="row"><label for="audio_project_name">Project Name</label></th>
            <td>
                <input type="text" id="audio_project_name" name="audio_project_name" value="<?php echo esc_attr($project_name); ?>" style="width: 100%;" />
                <p class="description">Name of the film, TV show, podcast, etc.</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="audio_director">Director</label></th>
            <td>
                <input type="text" id="audio_director" name="audio_director" value="<?php echo esc_attr($director); ?>" style="width: 100%;" />
                <p class="description">Director name (for filtering)</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="audio_writers">Writers</label></th>
            <td>
                <input type="text" id="audio_writers" name="audio_writers" value="<?php echo esc_attr($writers); ?>" style="width: 100%;" />
                <p class="description">Writer names (comma-separated)</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="audio_producers">Producers</label></th>
            <td>
                <input type="text" id="audio_producers" name="audio_producers" value="<?php echo esc_attr($producers); ?>" style="width: 100%;" />
                <p class="description">Producer names (comma-separated)</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="audio_actors">Actors</label></th>
            <td>
                <input type="text" id="audio_actors" name="audio_actors" value="<?php echo esc_attr($actors); ?>" style="width: 100%;" />
                <p class="description">Main actors (comma-separated)</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="audio_studios">Studios</label></th>
            <td>
                <input type="text" id="audio_studios" name="audio_studios" value="<?php echo esc_attr($studios); ?>" style="width: 100%;" />
                <p class="description">Production studios (comma-separated, for filtering)</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="audio_genre">Genre</label></th>
            <td>
                <input type="text" id="audio_genre" name="audio_genre" value="<?php echo esc_attr($genre); ?>" style="width: 100%;" />
                <p class="description">Genre (for filtering)</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="audio_release_date">Release Date</label></th>
            <td>
                <input type="date" id="audio_release_date" name="audio_release_date" value="<?php echo esc_attr($release_date); ?>" />
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="audio_project_type">Project Type</label></th>
            <td>
                <select id="audio_project_type" name="audio_project_type" style="width: 300px;">
                    <option value="">Select Type</option>
                    <option value="Film" <?php selected($project_type, 'Film'); ?>>Film</option>
                    <option value="TV" <?php selected($project_type, 'TV'); ?>>TV</option>
                    <option value="Podcast" <?php selected($project_type, 'Podcast'); ?>>Podcast</option>
                    <option value="Documentary" <?php selected($project_type, 'Documentary'); ?>>Documentary</option>
                    <option value="Commercial" <?php selected($project_type, 'Commercial'); ?>>Commercial</option>
                    <option value="Other" <?php selected($project_type, 'Other'); ?>>Other</option>
                </select>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="audio_duration">Duration</label></th>
            <td>
                <input type="text" id="audio_duration" name="audio_duration" value="<?php echo esc_attr($duration); ?>" style="width: 200px;" />
                <p class="description">Project duration (e.g., "90 minutes", "6 episodes")</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="audio_language">Language</label></th>
            <td>
                <input type="text" id="audio_language" name="audio_language" value="<?php echo esc_attr($language); ?>" style="width: 200px;" />
                <p class="description">Original language</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="audio_engineer">Audio Engineer</label></th>
            <td>
                <input type="text" id="audio_engineer" name="audio_engineer" value="<?php echo esc_attr($engineer); ?>" style="width: 100%;" />
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="audio_sound_designer">Sound Designer</label></th>
            <td>
                <input type="text" id="audio_sound_designer" name="audio_sound_designer" value="<?php echo esc_attr($sound_designer); ?>" style="width: 100%;" />
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="audio_awards">Awards</label></th>
            <td>
                <input type="text" id="audio_awards" name="audio_awards" value="<?php echo esc_attr($awards); ?>" style="width: 100%;" />
                <p class="description">Awards or recognition received</p>
            </td>
        </tr>
        <tr>
            <th scope="row"><label for="audio_distribution">Distribution Platform</label></th>
            <td>
                <input type="text" id="audio_distribution" name="audio_distribution" value="<?php echo esc_attr($distribution); ?>" style="width: 100%;" />
                <p class="description">Where the project was distributed (Netflix, theaters, etc.)</p>
            </td>
        </tr>
    </table>
    <?php
}

/**
 * Save media project meta data
 */
function rae_save_media_project_meta($post_id) {
    // Check if nonce is valid
    if (!isset($_POST['rae_media_project_nonce_field']) || 
        !wp_verify_nonce($_POST['rae_media_project_nonce_field'], 'rae_media_project_nonce')) {
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
    
    // Only save for media-project post type
    if (get_post_type($post_id) !== 'media-project') {
        return;
    }
    
    // Save project type
    if (isset($_POST['media_project_type'])) {
        $project_type = sanitize_text_field($_POST['media_project_type']);
        if (!empty($project_type)) {
            update_post_meta($post_id, '_media_project_type', $project_type);
        } else {
            delete_post_meta($post_id, '_media_project_type');
        }
    }
    
    // Save music project fields
    $music_fields = array(
        'music_artist_name' => '_music_artist_name',
        'music_album_names' => '_music_album_names',
        'music_songs_list' => '_music_songs_list',
        'music_release_date' => '_music_release_date',
        'music_artist_website' => '_music_artist_website',
        'music_online_links' => '_music_online_links',
        'music_genre' => '_music_genre',
        'music_record_label' => '_music_record_label',
        'music_duration' => '_music_duration',
        'music_studio' => '_music_studio',
        'music_producer' => '_music_producer',
        'music_collaborators' => '_music_collaborators'
    );
    
    foreach ($music_fields as $field => $meta_key) {
        if (isset($_POST[$field])) {
            $value = sanitize_text_field($_POST[$field]);
            if ($field === 'music_artist_website' && !empty($value)) {
                $value = esc_url_raw($value);
            }
            if (!empty($value)) {
                update_post_meta($post_id, $meta_key, $value);
            } else {
                delete_post_meta($post_id, $meta_key);
            }
        }
    }
    
    // Save audio post production fields
    $audio_fields = array(
        'audio_project_name' => '_audio_project_name',
        'audio_director' => '_audio_director',
        'audio_writers' => '_audio_writers',
        'audio_producers' => '_audio_producers',
        'audio_actors' => '_audio_actors',
        'audio_studios' => '_audio_studios',
        'audio_genre' => '_audio_genre',
        'audio_release_date' => '_audio_release_date',
        'audio_project_type' => '_audio_project_type',
        'audio_duration' => '_audio_duration',
        'audio_language' => '_audio_language',
        'audio_engineer' => '_audio_engineer',
        'audio_sound_designer' => '_audio_sound_designer',
        'audio_awards' => '_audio_awards',
        'audio_distribution' => '_audio_distribution'
    );
    
    foreach ($audio_fields as $field => $meta_key) {
        if (isset($_POST[$field])) {
            $value = sanitize_text_field($_POST[$field]);
            if (!empty($value)) {
                update_post_meta($post_id, $meta_key, $value);
            } else {
                delete_post_meta($post_id, $meta_key);
            }
        }
    }
}
add_action('save_post', 'rae_save_media_project_meta');

/**
 * Media project skills meta box callback for selecting related skills
 */
function rae_media_project_skills_meta_box_callback($post) {
    // Add nonce for security
    wp_nonce_field('rae_media_project_skills_nonce', 'rae_media_project_skills_nonce_field');
    
    // Get current selected skills
    $selected_skills = get_post_meta($post->ID, '_media_project_related_skills', true);
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
    <div class="rae-media-project-skills-selector">
        <div class="skills-search-container" style="margin-bottom: 20px;">
            <input type="text" 
                   id="media-skills-search" 
                   placeholder="Search skills..." 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;" />
            <p class="description">Search and select skills related to this media project. Selected skills will appear highlighted.</p>
        </div>
        
        <div class="selected-skills-container" style="margin-bottom: 20px; min-height: 40px; padding: 10px; border: 1px solid #ddd; border-radius: 3px; background: #f9f9f9;">
            <strong>Selected Skills:</strong>
            <div id="media-selected-skills-display" style="margin-top: 10px;">
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
                                       name="media_project_related_skills[]" 
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
            const $searchInput = $('#media-skills-search');
            const $selectedDisplay = $('#media-selected-skills-display');
            const $noSkillsMessage = $('.no-skills-selected');
            
            // Search functionality
            $searchInput.on('input', function() {
                const searchTerm = $(this).val().toLowerCase();
                
                $('.skill-checkbox-label').each(function() {
                    const skillName = $(this).data('skill-value').toLowerCase();
                    const categoryName = $(this).data('skill-category').toLowerCase();
                    
                    if (skillName.includes(searchTerm) || categoryName.includes(searchTerm)) {
                        $(this).show();
                    } else {
                        $(this).hide();
                    }
                });
                
                // Show/hide category headers
                $('.category-group').each(function() {
                    const $group = $(this);
                    const hasVisibleSkills = $group.find('.skill-checkbox-label:visible').length > 0;
                    $group.toggle(hasVisibleSkills);
                });
            });
            
            // Checkbox change handler
            $('input[name="media_project_related_skills[]"]').on('change', function() {
                updateSelectedSkillsDisplay();
                highlightSelectedSkills();
            });
            
            // Remove skill functionality
            $(document).on('click', '.remove-skill', function() {
                const skillId = $(this).closest('.selected-skill-pill').data('skill-id');
                $('input[value="' + skillId + '"]').prop('checked', false).trigger('change');
            });
            
            // Select all in category
            $('.category-select-all').on('click', function() {
                const category = $(this).data('category');
                const $categoryGroup = $(this).closest('.category-group');
                const $checkboxes = $categoryGroup.find('input[type="checkbox"]');
                const allChecked = $checkboxes.filter(':checked').length === $checkboxes.length;
                
                $checkboxes.prop('checked', !allChecked).trigger('change');
                $(this).text(allChecked ? 'Select All' : 'Deselect All');
            });
            
            function updateSelectedSkillsDisplay() {
                const selectedSkills = [];
                $('input[name="media_project_related_skills[]"]:checked').each(function() {
                    const $label = $(this).closest('.skill-checkbox-label');
                    selectedSkills.push({
                        id: $(this).val(),
                        name: $label.data('skill-value')
                    });
                });
                
                if (selectedSkills.length === 0) {
                    $selectedDisplay.html('<span class="no-skills-selected" style="color: #666; font-style: italic;">No skills selected</span>');
                } else {
                    let html = '';
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
                    const $label = $(this);
                    const $checkbox = $label.find('input[type="checkbox"]');
                    
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
                    const $group = $(this);
                    const $checkboxes = $group.find('input[type="checkbox"]');
                    const $selectAll = $group.find('.category-select-all');
                    const checkedCount = $checkboxes.filter(':checked').length;
                    
                    $selectAll.text(checkedCount === $checkboxes.length ? 'Deselect All' : 'Select All');
                });
            }
            
            // Initial setup
            highlightSelectedSkills();
            updateSelectAllText();
        });
    </script>
    
    <style>
        .rae-media-project-skills-selector .skill-checkbox-label:hover {
            background: #f0f0f0 !important;
        }
        
        .rae-media-project-skills-selector .skill-checkbox-label input[type="checkbox"]:checked + .skill-name {
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
 * Save media project skills meta when the post is saved
 */
function rae_save_media_project_skills_meta($post_id) {
    // Check if user has permission to edit the post
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    // Verify nonce
    if (!isset($_POST['rae_media_project_skills_nonce_field']) || 
        !wp_verify_nonce($_POST['rae_media_project_skills_nonce_field'], 'rae_media_project_skills_nonce')) {
        return;
    }
    
    // Don't save during autosave
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    // Only save for media-project post type
    if (get_post_type($post_id) !== 'media-project') {
        return;
    }
    
    // Save related skills
    if (isset($_POST['media_project_related_skills']) && is_array($_POST['media_project_related_skills'])) {
        $skill_ids = array_map('intval', $_POST['media_project_related_skills']);
        // Validate that all IDs are valid skill posts
        $validated_skills = array();
        foreach ($skill_ids as $skill_id) {
            $skill_post = get_post($skill_id);
            if ($skill_post && $skill_post->post_type === 'skill' && $skill_post->post_status === 'publish') {
                $validated_skills[] = $skill_id;
            }
        }
        update_post_meta($post_id, '_media_project_related_skills', $validated_skills);
    } else {
        // No skills selected, save empty array
        update_post_meta($post_id, '_media_project_related_skills', array());
    }
}
add_action('save_post', 'rae_save_media_project_skills_meta');