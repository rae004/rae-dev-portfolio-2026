<?php
/**
 * Theme Setup
 * Handles theme configuration and WordPress features
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class RAE_Theme_Setup {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('after_setup_theme', array($this, 'setup_theme'));
        add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'));
    }
    
    /**
     * Theme setup
     */
    public function setup_theme() {
        // Add theme support for featured images
        add_theme_support('post-thumbnails');
        
        // Add theme support for title tag
        add_theme_support('title-tag');
        
        // Add theme support for automatic feed links
        add_theme_support('automatic-feed-links');
        
        // Add theme support for HTML5
        add_theme_support('html5', array(
            'search-form',
            'comment-form',
            'comment-list',
            'gallery',
            'caption',
            'style',
            'script'
        ));
        
        // Add theme support for custom logo
        add_theme_support('custom-logo', array(
            'height'      => 100,
            'width'       => 400,
            'flex-height' => true,
            'flex-width'  => true,
        ));
        
        // Add theme support for custom header
        add_theme_support('custom-header', array(
            'default-image' => '',
            'width'         => 1200,
            'height'        => 300,
            'flex-height'   => true,
            'flex-width'    => true,
        ));
        
        // Add theme support for custom background
        add_theme_support('custom-background', array(
            'default-color' => 'ffffff',
        ));
    }
    
    /**
     * Enqueue admin scripts and styles
     */
    public function admin_enqueue_scripts($hook) {
        // Only load on post edit pages
        if ('post.php' === $hook || 'post-new.php' === $hook) {
            // Enqueue WordPress date picker
            wp_enqueue_script('jquery-ui-datepicker');
            wp_enqueue_style('jquery-ui-datepicker-style', 'https://code.jquery.com/ui/1.12.1/themes/ui-lightness/jquery-ui.css');
        }
    }
}