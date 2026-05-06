<?php
/**
 * CORS Handler
 * Manages Cross-Origin Resource Sharing for REST API
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * RAE CORS Handler
 *
 * Manages CORS headers for REST API responses.
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */
class RAE_CORS_Handler {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'add_cors_headers' ) );
	}

	/**
	 * Add CORS headers to REST API responses
	 */
	public function add_cors_headers(): void {
		// Development domains
		$allowed_origins = array(
			'http://localhost:5173',  // Vite dev server
			'http://localhost:3000',  // Alternative dev server
			'https://dev.rae-dev.com', // Development environment
			'https://rae-dev.com',    // Production environment
		);

		// Get the origin of the request
		$origin = isset( $_SERVER['HTTP_ORIGIN'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_ORIGIN'] ) ) : '';

		// Check if the origin is in our allowed list
		if ( in_array( $origin, $allowed_origins, true ) ) {
			header( 'Access-Control-Allow-Origin: ' . $origin );
		}

		// Set other CORS headers
		header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS' );
		header( 'Access-Control-Allow-Headers: Content-Type, Authorization' );
		header( 'Access-Control-Allow-Credentials: true' );
		header( 'Access-Control-Max-Age: 86400' ); // 24 hours

		// Handle preflight OPTIONS requests
		$request_method = isset( $_SERVER['REQUEST_METHOD'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) : '';
		if ( 'OPTIONS' === $request_method ) {
			header( 'Access-Control-Allow-Origin: ' . $origin );
			header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS' );
			header( 'Access-Control-Allow-Headers: Content-Type, Authorization' );
			header( 'Access-Control-Max-Age: 86400' );
			exit( 0 );
		}
	}
}
