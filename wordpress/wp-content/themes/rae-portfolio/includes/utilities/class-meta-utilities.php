<?php
/**
 * Meta Utilities
 * Helper functions for WordPress meta data handling
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class RAE_Meta_Utilities {
    
    /**
     * Get list meta (handles both array and newline-separated string formats)
     */
    public static function get_list_meta($post_id, $meta_key) {
        $meta_value = get_post_meta($post_id, $meta_key, true);
        
        if (empty($meta_value)) {
            return array();
        }
        
        // If it's already an array, return it
        if (is_array($meta_value)) {
            return array_filter($meta_value); // Remove empty values
        }
        
        // If it's a string, split by newlines
        if (is_string($meta_value)) {
            $lines = explode("\n", $meta_value);
            return array_filter(array_map('trim', $lines)); // Remove empty lines and trim
        }
        
        return array();
    }
    
    /**
     * Get JSON meta (handles JSON encoded meta values)
     */
    public static function get_json_meta($post_id, $meta_key) {
        $meta_value = get_post_meta($post_id, $meta_key, true);
        
        if (empty($meta_value)) {
            return null;
        }
        
        // If it's already an array/object, return it
        if (is_array($meta_value) || is_object($meta_value)) {
            return $meta_value;
        }
        
        // If it's a JSON string, decode it
        if (is_string($meta_value)) {
            $decoded = json_decode($meta_value, true);
            return json_last_error() === JSON_ERROR_NONE ? $decoded : $meta_value;
        }
        
        return $meta_value;
    }
    
    /**
     * Save list meta (converts array to newline-separated string if needed)
     */
    public static function save_list_meta($post_id, $meta_key, $value) {
        if (is_array($value)) {
            $value = array_filter($value); // Remove empty values
            update_post_meta($post_id, $meta_key, $value);
        } else {
            update_post_meta($post_id, $meta_key, $value);
        }
    }
    
    /**
     * Save JSON meta (encodes arrays/objects to JSON if needed)
     */
    public static function save_json_meta($post_id, $meta_key, $value) {
        if (is_array($value) || is_object($value)) {
            update_post_meta($post_id, $meta_key, json_encode($value));
        } else {
            update_post_meta($post_id, $meta_key, $value);
        }
    }
}