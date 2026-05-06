<?php
/**
 * Social Links REST API
 * Provides REST endpoints for social links data
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Social Links API
 *
 * REST API endpoints for social links functionality.
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */
class RAE_Social_Links_API extends RAE_API_Base {

	/**
	 * API endpoint path
	 *
	 * @var string
	 */
	protected string $endpoint = 'social-links';

	/**
	 * API namespace
	 */
	const API_NAMESPACE = 'wp/v2';

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST API routes
	 */
	public function register_routes(): void {
		register_rest_route(
			self::API_NAMESPACE,
			'/' . $this->endpoint,
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_social_links' ),
				'permission_callback' => array( $this, 'public_permission_callback' ),
				'args'                => array(
					'enabled_only' => array(
						'description'       => 'Return only enabled social links',
						'type'              => 'boolean',
						'default'           => true,
						'sanitize_callback' => 'rest_sanitize_boolean',
					),
					'limit'        => array(
						'description'       => 'Maximum number of links to return',
						'type'              => 'integer',
						'default'           => 9,
						'minimum'           => 1,
						'maximum'           => 9,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);
	}

	/**
	 * Get social links endpoint
	 *
	 * @param WP_REST_Request $request The REST request object.
	 */
	public function get_social_links( WP_REST_Request $request ): WP_REST_Response {
		try {
			// Get request parameters
			$enabled_only = $request->get_param( 'enabled_only' );
			$limit        = $request->get_param( 'limit' );

			// Get social links from WordPress options
			$options           = get_option( RAE_Social_Links_Options::OPTION_NAME, array() );
			$social_links_data = $options['social_links'] ?? array();

			// Prepare social links array
			$social_links = array();

			foreach ( $social_links_data as $link_id => $link_data ) {
				// Skip if enabled_only is true and link is disabled
				if ( $enabled_only && ! ( $link_data['enabled'] ?? false ) ) {
					continue;
				}

				// Skip if label or URL is empty
				if ( empty( $link_data['label'] ) || empty( $link_data['url'] ) ) {
					continue;
				}

				// Validate URL
				if ( ! filter_var( $link_data['url'], FILTER_VALIDATE_URL ) ) {
					continue;
				}

				// Add to response array
				$social_links[] = array(
					'id'       => sanitize_key( $link_id ),
					'label'    => sanitize_text_field( $link_data['label'] ),
					'url'      => esc_url_raw( $link_data['url'] ),
					'platform' => sanitize_text_field( $link_data['platform'] ?? 'generic' ),
					'order'    => intval( $link_data['order'] ?? 0 ),
					'enabled'  => (bool) ( $link_data['enabled'] ?? false ),
				);
			}

			// Sort by order
			usort(
				$social_links,
				function ( $a, $b ) {
					return $a['order'] <=> $b['order'];
				}
			);

			// Apply limit
			if ( $limit > 0 && count( $social_links ) > $limit ) {
				$social_links = array_slice( $social_links, 0, $limit );
			}

			// Prepare response data
			$response_data = array(
				'social_links'  => $social_links,
				'total'         => count( $social_links ),
				'max_allowed'   => RAE_Social_Links_Options::MAX_LINKS,
				'enabled_only'  => $enabled_only,
				'limit_applied' => $limit,
			);

			// Create response
			$response = new WP_REST_Response( $response_data, 200 );

			// Add caching headers
			$response->header( 'Cache-Control', 'public, max-age=300' ); // 5 minutes
			$response->header( 'Expires', gmdate( 'D, d M Y H:i:s', time() + 300 ) . ' GMT' );

			return $response;

		} catch ( Exception ) {
			return new WP_REST_Response(
				array(
					'error'   => true,
					'message' => 'Failed to retrieve social links',
					'code'    => 'social_links_error',
				),
				500
			);
		}
	}
}
