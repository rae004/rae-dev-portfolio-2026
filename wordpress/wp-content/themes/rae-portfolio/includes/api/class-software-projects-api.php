<?php
/**
 * Software Projects API
 * Handles REST API endpoints for software projects
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class RAE_Software_Projects_API extends RAE_API_Base {
    
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
        // Software projects collection endpoint
        register_rest_route('wp/v2', '/software-projects', array(
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
        
        // Individual software project endpoint
        register_rest_route('wp/v2', '/software-projects/(?P<id>\d+)', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_item'),
            'permission_callback' => array($this, 'public_permission_callback'),
            'args' => array(
                'id' => array(
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ),
            ),
        ));
    }
    
    /**
     * Get software projects collection
     */
    public function get_items($request): WP_Error|WP_REST_Response {
        try {
            $per_page = $request->get_param('per_page');
            $page = $request->get_param('page');
            $orderby = $request->get_param('orderby');
            $order = $request->get_param('order');
            
            $args = array(
                'post_type' => 'software-project',
                'post_status' => 'publish',
                'posts_per_page' => $per_page,
                'paged' => $page,
                'orderby' => $orderby,
                'order' => $order,
            );
            
            $query = new WP_Query($args);
            $projects = array();
            
            if ($query->have_posts()) {
                while ($query->have_posts()) {
                    $query->the_post();
                    $projects[] = $this->prepare_software_project_for_response(get_post());
                }
                wp_reset_postdata();
            }
            
            $response = new WP_REST_Response($projects, 200);
            
            // Add pagination headers
            $response->header('X-WP-Total', $query->found_posts);
            $response->header('X-WP-TotalPages', $query->max_num_pages);
            
            return $response;
            
        } catch (Exception $e) {
            return new WP_Error('api_error', 'Failed to retrieve software projects: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Get individual software project
     */
    public function get_item($request): WP_Error|WP_REST_Response {
        try {
            $id = (int) $request['id'];
            $post = get_post($id);
            
            if (empty($post) || $post->post_type !== 'software-project' || $post->post_status !== 'publish') {
                return new WP_Error('software_project_not_found', 'Software project not found.', array('status' => 404));
            }
            
            $project_data = $this->prepare_software_project_for_response($post);
            return new WP_REST_Response($project_data, 200);
            
        } catch (Exception $e) {
            return new WP_Error('api_error', 'Failed to retrieve software project: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Prepare software project for API response
     */
    private function prepare_software_project_for_response($post): array {
        // Get basic post data
        $data = array(
            'id' => $post->ID,
            'date' => $post->post_date,
            'date_gmt' => $post->post_date_gmt,
            'guid' => array(
                'rendered' => $post->guid
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
                'rendered' => get_the_excerpt($post->ID),
                'protected' => false
            ),
            'author' => $post->post_author,
            'featured_media' => get_post_thumbnail_id($post->ID),
            'comment_status' => $post->comment_status,
            'ping_status' => $post->ping_status,
            'sticky' => false,
            'template' => '',
            'format' => get_post_format($post->ID) ?: 'standard',
            'meta' => array(),
            'categories' => array(),
            'tags' => array(),
            'featured_image_url' => get_the_post_thumbnail_url($post->ID, 'full')
        );
        
        // Add software project specific fields
        $data['project_release_date'] = get_post_meta($post->ID, '_software_project_release_date', true) ?: null;
        $data['project_demo_link'] = get_post_meta($post->ID, '_software_project_demo_link', true) ?: null;
        $data['project_repo_link'] = get_post_meta($post->ID, '_software_project_repo_link', true) ?: null;
        $data['project_state'] = get_post_meta($post->ID, '_software_project_state', true) ?: null;
        $data['tech_categories'] = get_post_meta($post->ID, '_software_project_tech_categories', true) ?: array();
        
        // Add related skills with full skill data
        $data['related_skills'] = $this->get_software_project_skills($post->ID);
        
        return $data;
    }
    
    /**
     * Get related skills for a software project with full skill data
     */
    private function get_software_project_skills($project_id): array {
        $skill_ids = get_post_meta($project_id, '_software_project_related_skills', true);
        
        if (empty($skill_ids) || !is_array($skill_ids)) {
            return array();
        }
        
        $skills = array();
        
        foreach ($skill_ids as $skill_id) {
            $skill_post = get_post($skill_id);
            
            if (!$skill_post || $skill_post->post_type !== 'skill' || $skill_post->post_status !== 'publish') {
                continue;
            }
            
            $skill_data = array(
                'id' => $skill_post->ID,
                'date' => $skill_post->post_date,
                'date_gmt' => $skill_post->post_date_gmt,
                'guid' => array(
                    'rendered' => $skill_post->guid
                ),
                'modified' => $skill_post->post_modified,
                'modified_gmt' => $skill_post->post_modified_gmt,
                'slug' => $skill_post->post_name,
                'status' => $skill_post->post_status,
                'type' => $skill_post->post_type,
                'link' => get_permalink($skill_post->ID),
                'title' => array(
                    'rendered' => get_the_title($skill_post->ID)
                ),
                'content' => array(
                    'rendered' => apply_filters('the_content', $skill_post->post_content),
                    'protected' => false
                ),
                'excerpt' => array(
                    'rendered' => get_the_excerpt($skill_post->ID),
                    'protected' => false
                ),
                'author' => $skill_post->post_author,
                'featured_media' => get_post_thumbnail_id($skill_post->ID),
                'comment_status' => $skill_post->comment_status,
                'ping_status' => $skill_post->ping_status,
                'sticky' => false,
                'template' => '',
                'format' => get_post_format($skill_post->ID) ?: 'standard',
                'meta' => array(),
                'categories' => array(),
                'tags' => array(),
                'featured_image_url' => get_the_post_thumbnail_url($skill_post->ID, 'full'),
                
                // Add skill-specific fields
                'skills_type' => get_post_meta($skill_post->ID, '_skill_type', true) ?: 'Other',
                'skills_value' => get_post_meta($skill_post->ID, '_skill_value', true) ?: get_the_title($skill_post->ID),
                'skills_weight' => (int) get_post_meta($skill_post->ID, '_skill_weight', true),
                'skills_info_url' => get_post_meta($skill_post->ID, '_skill_info_url', true) ?: null,
                'skills_description' => get_post_meta($skill_post->ID, '_skill_description', true) ?: null,
            );
            
            $skills[] = $skill_data;
        }
        
        // Sort skills by weight descending, then by name
        usort($skills, function($a, $b) {
            $weight_diff = $b['skills_weight'] - $a['skills_weight'];
            if ($weight_diff !== 0) {
                return $weight_diff;
            }
            return strcmp($a['skills_value'], $b['skills_value']);
        });
        
        return $skills;
    }
}