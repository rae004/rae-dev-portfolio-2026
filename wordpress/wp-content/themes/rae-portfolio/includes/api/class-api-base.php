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
    protected function get_sanitized_params($request, $defaults = array()): array {
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
    protected function format_query_args($post_type, $params): array {
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
     * Standard permission callback for public endpoints
     */
    public function public_permission_callback(): true {
        return true;
    }
}