<?php
/**
 * Rae Portfolio Theme Loader
 * Auto-loads all theme functionality modules
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class RAE_Theme_Loader {
    
    /**
     * Instance of this class
     */
    private static ?RAE_Theme_Loader $instance = null;
    
    /**
     * Get instance
     */
    public static function get_instance(): ?RAE_Theme_Loader {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->load_theme_modules();
    }
    
    /**
     * Load all theme modules
     */
    private function load_theme_modules(): void {
        $includes_path = get_template_directory() . '/includes/';
        
        // Load theme setup and utilities first
        $this->load_file($includes_path . 'theme/class-theme-setup.php');
        $this->load_file($includes_path . 'theme/class-cors-handler.php');
        
        // Load utilities
        $this->load_file($includes_path . 'utilities/class-date-formatter.php');
        $this->load_file($includes_path . 'utilities/class-skill-utilities.php');
        $this->load_file($includes_path . 'utilities/class-meta-utilities.php');
        
        // Load post types
        $this->load_file($includes_path . 'post-types/class-resume.php');
        $this->load_file($includes_path . 'post-types/class-skills.php');
        $this->load_file($includes_path . 'post-types/class-media-projects.php');
        $this->load_file($includes_path . 'post-types/class-software-projects.php');
        
        // Load API classes
        $this->load_file($includes_path . 'api/class-api-base.php');
        $this->load_file($includes_path . 'api/class-resume-api.php');
        $this->load_file($includes_path . 'api/class-skills-api.php');
        $this->load_file($includes_path . 'api/class-media-projects-api.php');
        
        // Load admin functionality
        $this->load_file($includes_path . 'admin/class-meta-boxes.php');
        $this->load_file($includes_path . 'admin/meta-boxes/class-employment-dates.php');
        $this->load_file($includes_path . 'admin/meta-boxes/class-resume-skills.php');
        $this->load_file($includes_path . 'admin/meta-boxes/class-media-skills.php');
        $this->load_file($includes_path . 'admin/meta-boxes/class-skills-meta.php');
        $this->load_file($includes_path . 'admin/meta-boxes/class-media-project-details.php');
        
        // Initialize all classes after loading
        $this->initialize_classes();
    }
    
    /**
     * Load a file if it exists
     */
    private function load_file($file_path): void {
        if (file_exists($file_path)) {
            require_once $file_path;
        }
    }
    
    /**
     * Initialize all classes that need instantiation
     */
    private function initialize_classes(): void {
        // Theme setup
        if (class_exists('RAE_Theme_Setup')) {
            new RAE_Theme_Setup();
        }
        
        if (class_exists('RAE_CORS_Handler')) {
            new RAE_CORS_Handler();
        }
        
        // Post types
        if (class_exists('RAE_Resume_Post_Type')) {
            new RAE_Resume_Post_Type();
        }
        
        if (class_exists('RAE_Skills_Post_Type')) {
            new RAE_Skills_Post_Type();
        }
        
        if (class_exists('RAE_Media_Projects_Post_Type')) {
            new RAE_Media_Projects_Post_Type();
        }
        
        if (class_exists('RAE_Software_Projects_Post_Type')) {
            new RAE_Software_Projects_Post_Type();
        }
        
        // API classes
        if (class_exists('RAE_Resume_API')) {
            new RAE_Resume_API();
        }
        
        if (class_exists('RAE_Skills_API')) {
            new RAE_Skills_API();
        }
        
        if (class_exists('RAE_Media_Projects_API')) {
            new RAE_Media_Projects_API();
        }
        
        // Admin functionality
        if (class_exists('RAE_Meta_Boxes')) {
            new RAE_Meta_Boxes();
        }
        
        if (class_exists('RAE_Employment_Dates_Meta_Box')) {
            new RAE_Employment_Dates_Meta_Box();
        }
        
        if (class_exists('RAE_Resume_Skills_Meta_Box')) {
            new RAE_Resume_Skills_Meta_Box();
        }
        
        if (class_exists('RAE_Media_Skills_Meta_Box')) {
            new RAE_Media_Skills_Meta_Box();
        }
        
        if (class_exists('RAE_Skills_Meta_Box')) {
            new RAE_Skills_Meta_Box();
        }
        
        if (class_exists('RAE_Media_Project_Details_Meta_Box')) {
            new RAE_Media_Project_Details_Meta_Box();
        }
    }
}

// Initialize the theme loader
RAE_Theme_Loader::get_instance();