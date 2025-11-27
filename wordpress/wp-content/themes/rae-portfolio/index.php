<?php
/**
 * Main template file for Rae Portfolio Theme
 * This is a headless WordPress installation - frontend is served by React
 *
 * @package RAE_Portfolio
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$rest_api_available = (bool) rest_url( 'wp/v2/' );
$api_available_span = '<span style="color: #ff2222">DOWN!</span>';
if ( $rest_api_available ) {
	$api_available_span = '<span style="color: #00ba37">UP</span>';
}

$theme_name_with_version = wp_get_theme() . ' v' . wp_get_theme()->get( 'Version' );

get_header(); ?>

<div style="max-width: 800px; margin: 40px auto; padding: 20px; background: white; 
	border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
	<h1 style="color: #333; border-bottom: 3px solid #00a0d2; padding-bottom: 10px;">
		🚀 Rae Portfolio - Headless WordPress CMS
	</h1>

	<div style="background: #f0f8ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
		<h2 style="margin-top: 0; color: #0073aa;">System Status</h2>
		<p><strong>WordPress:</strong> <?php echo esc_html( get_bloginfo( 'version' ) ); ?></p>
		<p><strong>PHP:</strong> <?php echo esc_html( PHP_VERSION ); ?></p>
		<p><strong>Name:</strong> <?php echo esc_html( get_bloginfo( 'name' ) ); ?></p>
		<p><strong>Theme:</strong> <?php echo esc_html( $theme_name_with_version ); ?></p>
		<p><strong>REST API:</strong> <?php echo wp_kses_post( $api_available_span ); ?></p>
	</div>
</div>

<?php get_footer(); ?>