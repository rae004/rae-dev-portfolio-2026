<?php
/**
 * Skills API
 * Handles REST API endpoints for skills
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class RAE_Skills_API extends RAE_API_Base {
    
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
        // Skills collection endpoint
        register_rest_route('wp/v2', '/skills', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_items'),
            'permission_callback' => array($this, 'public_permission_callback'),
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
     * Get skills
     */
    public function get_items($request): WP_Error|WP_REST_Response|WP_HTTP_Response {
        $params = $this->get_sanitized_params($request, array('per_page' => 100));
        $args = $this->format_query_args('skill', $params);
        
        $posts = get_posts($args);
        $data = array();
        
        foreach ($posts as $post) {
            $data[] = $this->prepare_item($post);
        }
        
        return rest_ensure_response($data);
    }
    
    /**
     * Get single skill
     */
    public function get_item($request): WP_Error|WP_REST_Response|WP_HTTP_Response {
        $id = $request->get_param('id');
        $post = get_post($id);
        
        if (empty($post) || $post->post_type !== 'skill' || $post->post_status !== 'publish') {
            return new WP_Error('not_found', 'Skill not found', array('status' => 404));
        }
        
        $data = $this->prepare_item($post);
        return rest_ensure_response($data);
    }
    
    /**
     * Prepare skill item data for REST API response
     */
    public function prepare_item($post): array {
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
}