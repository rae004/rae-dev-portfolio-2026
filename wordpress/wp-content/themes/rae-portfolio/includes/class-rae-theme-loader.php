<?php
/**
 * Rae Portfolio Theme Loader
 * Auto-loads all theme functionality modules
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * RAE Theme Loader
 *
 * Autoloads all theme functionality modules and initializes the RAE Portfolio theme.
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */
class RAE_Theme_Loader {

	/**
	 * Instance of this class
	 *
	 * @var ?RAE_Theme_Loader
	 */
	private static ?RAE_Theme_Loader $instance = null;

	/**
	 * Get instance
	 */
	public static function get_instance(): ?RAE_Theme_Loader {
		if ( null === self::$instance ) {
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
		$this->load_file( $includes_path . 'theme/class-rae-theme-setup.php' );
		$this->load_file( $includes_path . 'theme/class-rae-cors-handler.php' );

		// Load utilities
		$this->load_file( $includes_path . 'utilities/class-rae-date-formatter.php' );
		$this->load_file( $includes_path . 'utilities/class-rae-meta-utilities.php' );
		$this->load_file( $includes_path . 'utilities/class-rae-related-skill-provider.php' );

		// Load post types
		$this->load_file( $includes_path . 'post-types/class-rae-resume-post-type.php' );
		$this->load_file( $includes_path . 'post-types/class-rae-skills-post-type.php' );
		$this->load_file( $includes_path . 'post-types/class-rae-media-projects-post-type.php' );
		$this->load_file( $includes_path . 'post-types/class-rae-software-projects-post-type.php' );

		// Load API classes
		$this->load_file( $includes_path . 'api/class-rae-api-base.php' );
		$this->load_file( $includes_path . 'api/class-rae-resume-api.php' );
		$this->load_file( $includes_path . 'api/class-rae-skills-api.php' );
		$this->load_file( $includes_path . 'api/class-rae-media-projects-api.php' );
		$this->load_file( $includes_path . 'api/class-rae-software-projects-api.php' );
		$this->load_file( $includes_path . 'api/class-rae-social-links-api.php' );
		$this->load_file( $includes_path . 'api/class-rae-recaptcha-api.php' );
		$this->load_file( $includes_path . 'api/class-rae-contact-api.php' );

		// Load admin functionality
		$this->load_file( $includes_path . 'admin/class-rae-meta-boxes.php' );
		$this->load_file( $includes_path . 'admin/class-rae-social-links-options.php' );
		$this->load_file( $includes_path . 'admin/class-rae-recaptcha-options.php' );
		$this->load_file( $includes_path . 'admin/class-rae-contact-options.php' );
		$this->load_file( $includes_path . 'admin/meta-boxes/class-rae-employment-dates-meta-box.php' );
		$this->load_file( $includes_path . 'admin/meta-boxes/class-rae-resume-skills-meta-box.php' );
		$this->load_file( $includes_path . 'admin/meta-boxes/class-rae-media-skills-meta-box.php' );
		$this->load_file( $includes_path . 'admin/meta-boxes/class-rae-software-details-meta-box.php' );
		$this->load_file( $includes_path . 'admin/meta-boxes/class-rae-software-skills-meta-box.php' );
		$this->load_file( $includes_path . 'admin/meta-boxes/class-rae-skills-meta-box.php' );
		$this->load_file( $includes_path . 'admin/meta-boxes/class-rae-media-project-details.php' );

		// Initialize all classes after loading
		$this->initialize_classes();
	}

	/**
	 * Load a file if it exists
	 *
	 * @param string $file_path The absolute path to the file to load.
	 */
	private function load_file( string $file_path ): void {
		if ( file_exists( $file_path ) ) {
			require_once $file_path;
		}
	}

	/**
	 * Initialize all classes that need instantiation
	 */
	private function initialize_classes(): void {
		// Theme setup
		if ( class_exists( 'RAE_Theme_Setup' ) ) {
			new RAE_Theme_Setup();
		}

		if ( class_exists( 'RAE_CORS_Handler' ) ) {
			new RAE_CORS_Handler();
		}

		// Post types
		if ( class_exists( 'RAE_Resume_Post_Type' ) ) {
			new RAE_Resume_Post_Type();
		}

		if ( class_exists( 'RAE_Skills_Post_Type' ) ) {
			new RAE_Skills_Post_Type();
		}

		if ( class_exists( 'RAE_Media_Projects_Post_Type' ) ) {
			new RAE_Media_Projects_Post_Type();
		}

		if ( class_exists( 'RAE_Software_Projects_Post_Type' ) ) {
			new RAE_Software_Projects_Post_Type();
		}

		// API classes
		if ( class_exists( 'RAE_Resume_API' ) ) {
			new RAE_Resume_API();
		}

		if ( class_exists( 'RAE_Skills_API' ) ) {
			new RAE_Skills_API();
		}

		if ( class_exists( 'RAE_Media_Projects_API' ) ) {
			new RAE_Media_Projects_API();
		}

		if ( class_exists( 'RAE_Software_Projects_API' ) ) {
			new RAE_Software_Projects_API();
		}

		if ( class_exists( 'RAE_Social_Links_API' ) ) {
			new RAE_Social_Links_API();
		}

		if ( class_exists( 'RAE_ReCaptcha_API' ) ) {
			new RAE_ReCaptcha_API();
		}

		if ( class_exists( 'RAE_Contact_API' ) ) {
			new RAE_Contact_API();
		}

		// Admin functionality
		if ( class_exists( 'RAE_Meta_Boxes' ) ) {
			new RAE_Meta_Boxes();
		}

		if ( class_exists( 'RAE_Social_Links_Options' ) ) {
			new RAE_Social_Links_Options();
		}

		if ( class_exists( 'RAE_ReCaptcha_Options' ) ) {
			new RAE_ReCaptcha_Options();
		}

		if ( class_exists( 'RAE_Contact_Options' ) ) {
			new RAE_Contact_Options();
		}

		if ( class_exists( 'RAE_Employment_Dates_Meta_Box' ) ) {
			new RAE_Employment_Dates_Meta_Box();
		}

		if ( class_exists( 'RAE_Resume_Skills_Meta_Box' ) ) {
			new RAE_Resume_Skills_Meta_Box();
		}

		if ( class_exists( 'RAE_Media_Skills_Meta_Box' ) ) {
			new RAE_Media_Skills_Meta_Box();
		}

		if ( class_exists( 'RAE_Software_Details_Meta_Box' ) ) {
			new RAE_Software_Details_Meta_Box();
		}

		if ( class_exists( 'RAE_Software_Skills_Meta_Box' ) ) {
			new RAE_Software_Skills_Meta_Box();
		}

		if ( class_exists( 'RAE_Skills_Meta_Box' ) ) {
			new RAE_Skills_Meta_Box();
		}

		if ( class_exists( 'Rae_Media_Project_Details' ) ) {
			new Rae_Media_Project_Details();
		}
	}
}

// Initialize the theme loader
RAE_Theme_Loader::get_instance();
