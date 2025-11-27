<?php
/**
 * API Base Class
 * Shared functionality for all custom REST API endpoints
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * API Base Class
 *
 * Shared functionality for all custom REST API endpoints.
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */
class RAE_API_Base {

	/**
	 * Get sanitized parameters from request
	 *
	 * @param WP_REST_Request $request  The REST request object
	 * @param array           $defaults Default parameter values
	 *
	 * @return array Sanitized parameters
	 */
	protected function get_sanitized_params( $request, $defaults = array() ): array {
		$params = array();

		// Common parameters
		$per_page_param     = $request->get_param( 'per_page' );
		$params['per_page'] = absint( $per_page_param ? $per_page_param : ( $defaults['per_page'] ?? 10 ) );
		$params['page']     = absint( $request->get_param( 'page' ) ? $request->get_param( 'page' ) : ( $defaults['page'] ?? 1 ) );
		$orderby_param      = $request->get_param( 'orderby' );
		$params['orderby']  = sanitize_text_field( $orderby_param ? $orderby_param : ( $defaults['orderby'] ?? 'date' ) );
		$order_param        = $request->get_param( 'order' );
		$params['order']    = sanitize_text_field( $order_param ? $order_param : ( $defaults['order'] ?? 'desc' ) );

		return $params;
	}

	/**
	 * Format WP_Query arguments
	 *
	 * @param string $post_type The post type to query
	 * @param array  $params    Query parameters
	 *
	 * @return array Formatted WP_Query arguments
	 */
	protected function format_query_args( $post_type, $params ): array {
		return array(
			'post_type'      => $post_type,
			'post_status'    => 'publish',
			'posts_per_page' => $params['per_page'],
			'paged'          => $params['page'],
			'orderby'        => $params['orderby'],
			'order'          => strtoupper( $params['order'] ),
		);
	}

	/**
	 * Standard permission callback for public endpoints
	 */
	public function public_permission_callback(): true {
		return true;
	}
}
