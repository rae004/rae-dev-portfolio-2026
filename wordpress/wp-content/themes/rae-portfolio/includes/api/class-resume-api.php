<?php
/**
 * Resume API
 * Handles REST API endpoints for resume items
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class RAE_Resume_API extends RAE_API_Base {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_endpoints'));
    }
    
    /**
     * Register REST API endpoints
     */
    public function register_endpoints(): void {
        // Resume collection endpoint
        register_rest_route('wp/v2', '/resume', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_items'),
            'permission_callback' => array($this, 'public_permission_callback'),
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
            'callback' => array($this, 'get_item'),
            'permission_callback' => array($this, 'public_permission_callback'),
            'args' => array(
                'id' => array(
                    'validate_callback' => function($param, $request, $key) {
                        return is_numeric($param);
                    }
                ),
            ),
        ));
    }
    
    /**
     * Get resume items
     */
    public function get_items($request): WP_Error|WP_REST_Response|WP_HTTP_Response {
        $params = $this->get_sanitized_params($request);
        $args = $this->format_query_args('resume', $params);
        
        $posts = get_posts($args);
        $data = array();
        
        foreach ($posts as $post) {
            $data[] = $this->prepare_item($post);
        }
        
        return rest_ensure_response($data);
    }
    
    /**
     * Get single resume item
     */
    public function get_item($request): WP_Error|WP_REST_Response|WP_HTTP_Response {
        $id = $request->get_param('id');
        $post = get_post($id);
        
        if (empty($post) || $post->post_type !== 'resume' || $post->post_status !== 'publish') {
            return new WP_Error('not_found', 'Resume item not found', array('status' => 404));
        }
        
        $data = $this->prepare_item($post);
        return rest_ensure_response($data);
    }
    
    /**
     * Prepare resume item data for REST API response
     */
    public function prepare_item($post): array {
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
                    // We'll need to prepare skill items - this requires the Skills API class
                    if (class_exists('RAE_Skills_API')) {
                        $skills_api = new RAE_Skills_API();
                        $related_skills[] = $skills_api->prepare_item($skill_post);
                    }
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
                'formatted_range' => RAE_Date_Formatter::format_employment_date_range($start_date, $end_date, $currently_employed === '1')
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
}