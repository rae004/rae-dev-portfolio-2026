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