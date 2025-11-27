<?php
/**
 * Resume API
 * Handles REST API endpoints for resume items
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * RAE Skills API
 *
 * Provides REST API endpoints for skills.
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */
class RAE_Resume_API extends RAE_API_Base {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_endpoints' ) );
	}

	/**
	 * Register REST API endpoints
	 */
	public function register_endpoints(): void {
		// Resume collection endpoint
		register_rest_route(
			'wp/v2',
			'/resume',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_items' ),
				'permission_callback' => array( $this, 'public_permission_callback' ),
				'args'                => array(
					'per_page' => array(
						'default'           => 10,
						'sanitize_callback' => 'absint',
					),
					'page'     => array(
						'default'           => 1,
						'sanitize_callback' => 'absint',
					),
					'orderby'  => array(
						'default'           => 'date',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'order'    => array(
						'default'           => 'desc',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		// Individual resume item endpoint
		register_rest_route(
			'wp/v2',
			'/resume/(?P<id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_item' ),
				'permission_callback' => array( $this, 'public_permission_callback' ),
				'args'                => array(
					'id' => array(
						'validate_callback' => function ( $param ) {
							return is_numeric( $param );
						},
					),
				),
			)
		);
	}

	/**
	 * Get resume items
	 *
	 * @param WP_REST_Request $request The REST request object
	 *
	 * @return WP_Error|WP_REST_Response|WP_HTTP_Response
	 */
	public function get_items( WP_REST_Request $request ): WP_Error|WP_REST_Response|WP_HTTP_Response {
		$params = $this->get_sanitized_params( $request );
		$args   = $this->format_query_args( 'resume', $params );

		$posts = get_posts( $args );
		$data  = array();

		foreach ( $posts as $post ) {
			$data[] = $this->prepare_item( $post );
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Get single resume item
	 *
	 * @param WP_REST_Request $request The REST request object
	 *
	 * @return WP_Error|WP_REST_Response|WP_HTTP_Response
	 */
	public function get_item( WP_REST_Request $request ): WP_Error|WP_REST_Response|WP_HTTP_Response {
		$id   = $request->get_param( 'id' );
		$post = get_post( $id );

		if ( empty( $post ) || 'resume' !== $post->post_type || 'publish' !== $post->post_status ) {
			return new WP_Error( 'not_found', 'Resume item not found', array( 'status' => 404 ) );
		}

		$data = $this->prepare_item( $post );
		return rest_ensure_response( $data );
	}

	/**
	 * Prepare resume item data for REST API response
	 *
	 * @param WP_Post $post The resume post object
	 *
	 * @return array Formatted resume data
	 */
	public function prepare_item( WP_Post $post ): array {
		// Get employment date meta
		$start_date         = get_post_meta( $post->ID, '_resume_start_date', true );
		$end_date           = get_post_meta( $post->ID, '_resume_end_date', true );
		$currently_employed = get_post_meta( $post->ID, '_resume_currently_employed', true );
		$start_date_raw     = get_post_meta( $post->ID, '_resume_start_date_raw', true );
		$end_date_raw       = get_post_meta( $post->ID, '_resume_end_date_raw', true );

		// Get featured image
		$featured_image_id  = get_post_thumbnail_id( $post->ID );
		$featured_image_url = $featured_image_id ? wp_get_attachment_image_url( $featured_image_id, 'full' ) : null;

		$related_skills = RAE_Related_Skill_Provider::get_related_skills( $post->ID, '_resume_related_skills' );

		return array(
			'id'                 => $post->ID,
			'date'               => $post->post_date,
			'date_gmt'           => $post->post_date_gmt,
			'guid'               => array(
				'rendered' => get_permalink( $post->ID ),
			),
			'modified'           => $post->post_modified,
			'modified_gmt'       => $post->post_modified_gmt,
			'slug'               => $post->post_name,
			'status'             => $post->post_status,
			'type'               => $post->post_type,
			'link'               => get_permalink( $post->ID ),
			'title'              => array(
				'rendered' => get_the_title( $post->ID ),
			),
			'content'            => array(
				'rendered'  => apply_filters( 'the_content', $post->post_content ),
				'protected' => false,
			),
			'excerpt'            => array(
				'rendered'  => get_the_excerpt( $post ),
				'protected' => false,
			),
			'featured_media'     => $featured_image_id ? $featured_image_id : 0,
			'template'           => '',
			'meta'               => array(),
			'class_list'         => get_post_class( '', $post->ID ),
			'featured_image_url' => $featured_image_url,
			'employment_dates'   => array(
				'start_date'         => $start_date ? $start_date : null,
				'end_date'           => $end_date ? $end_date : null,
				'currently_employed' => '1' === $currently_employed,
				'start_date_raw'     => $start_date_raw ? $start_date_raw : null,
				'end_date_raw'       => $end_date_raw ? $end_date_raw : null,
				'formatted_range'    => RAE_Date_Formatter::format_employment_date_range(
					$start_date,
					$end_date,
					'1' === $currently_employed
				),
			),
			'related_skills'     => $related_skills,
			'_links'             => array(
				'self'       => array(
					array(
						'href' => rest_url( 'wp/v2/resume/' . $post->ID ),
					),
				),
				'collection' => array(
					array(
						'href' => rest_url( 'wp/v2/resume' ),
					),
				),
			),
		);
	}
}
