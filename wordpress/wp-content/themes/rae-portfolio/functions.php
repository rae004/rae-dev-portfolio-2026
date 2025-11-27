<?php
/**
 * Rae Portfolio Theme Functions
 *
 * This file has been refactored into modular components for better maintainability.
 * All functionality is now organized in the /includes directory structure.
 *
 * For the original monolithic version, see functions-backup.php
 *
 * @package RaeDevPortfolio
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Define theme constants
 */
define( 'RAE_THEME_PATH', get_template_directory() );
define( 'RAE_THEME_URL', get_template_directory_uri() );
const RAE_INCLUDES_PATH = RAE_THEME_PATH . '/includes/';

/**
 * Load the theme loader which handles all modular components
 */
require_once RAE_INCLUDES_PATH . 'class-rae-theme-loader.php';

/**
 * Theme activation hook
 */
function rae_theme_activation(): void {
	// Flush rewrite rules to ensure custom post types work
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'rae_theme_activation' );

/**
 * Theme deactivation hook
 */
function rae_theme_deactivation(): void {
	// Flush rewrite rules on deactivation
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'rae_theme_deactivation' );
