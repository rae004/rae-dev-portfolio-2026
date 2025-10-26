<?php
/**
 * API Base Class
 * Shared functionality for all custom REST API endpoints
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class RAE_API_Base {
    
    /**
     * Get sanitized parameters from request
     */
    protected function get_sanitized_params($request, $defaults = array()) {
        $params = array();
        
        // Common parameters
        $params['per_page'] = absint($request->get_param('per_page') ?: ($defaults['per_page'] ?? 10));
        $params['page'] = absint($request->get_param('page') ?: ($defaults['page'] ?? 1));
        $params['orderby'] = sanitize_text_field($request->get_param('orderby') ?: ($defaults['orderby'] ?? 'date'));
        $params['order'] = sanitize_text_field($request->get_param('order') ?: ($defaults['order'] ?? 'desc'));
        
        return $params;
    }
    
    /**
     * Format WP_Query arguments
     */
    protected function format_query_args($post_type, $params) {
        return array(
            'post_type' => $post_type,
            'post_status' => 'publish',
            'posts_per_page' => $params['per_page'],
            'paged' => $params['page'],
            'orderby' => $params['orderby'],
            'order' => strtoupper($params['order'])
        );
    }
    
    /**
     * Get formatted response with pagination
     */
    protected function get_formatted_response($query, $prepare_callback = null) {
        $posts = $query->posts;
        $items = array();
        
        foreach ($posts as $post) {
            if ($prepare_callback && is_callable($prepare_callback)) {
                $items[] = call_user_func($prepare_callback, $post);
            } else {
                $items[] = $this->prepare_basic_item($post);
            }
        }
        
        return array(
            'items' => $items,
            'total' => $query->found_posts,
            'pages' => $query->max_num_pages,
            'current_page' => max(1, absint($query->get('paged')))
        );
    }
    
    /**
     * Basic item preparation
     */
    protected function prepare_basic_item($post) {
        return array(
            'id' => $post->ID,
            'title' => array('rendered' => get_the_title($post)),
            'content' => array('rendered' => apply_filters('the_content', $post->post_content)),
            'excerpt' => array('rendered' => get_the_excerpt($post)),
            'date' => $post->post_date,
            'modified' => $post->post_modified,
            'slug' => $post->post_name,
            'status' => $post->post_status,
            'type' => $post->post_type,
        );
    }
    
    /**
     * Standard permission callback for public endpoints
     */
    public function public_permission_callback() {
        return true;
    }
}