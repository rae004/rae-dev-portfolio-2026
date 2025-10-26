<?php
/**
 * Skill Utilities
 * Helper functions for skill-related operations
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class RAE_Skill_Utilities {
    
    /**
     * Get skills by category
     */
    public static function get_skills_by_category($category = null): array {
        $args = array(
            'post_type' => 'skill',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC'
        );
        
        if ($category) {
            $args['meta_query'] = array(
                array(
                    'key' => '_skill_type',
                    'value' => $category,
                    'compare' => '='
                )
            );
        }
        
        return get_posts($args);
    }
    
    /**
     * Get all skill categories
     */
    public static function get_skill_categories(): array {
        global $wpdb;
        
        $categories = $wpdb->get_col($wpdb->prepare("
            SELECT DISTINCT meta_value 
            FROM {$wpdb->postmeta} pm
            INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
            WHERE pm.meta_key = '_skill_type' 
            AND p.post_type = 'skill' 
            AND p.post_status = 'publish'
            AND pm.meta_value != ''
            ORDER BY pm.meta_value ASC
        "));
        
        return array_filter($categories);
    }
    
    /**
     * Validate skill ID
     */
    public static function is_valid_skill($skill_id) {
        $skill_post = get_post($skill_id);
        return $skill_post && $skill_post->post_type === 'skill' && $skill_post->post_status === 'publish';
    }
}