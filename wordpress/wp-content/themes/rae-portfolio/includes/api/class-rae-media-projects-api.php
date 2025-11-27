<?php
/**
 * Media Projects API
 * Handles REST API endpoints for media projects
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * RAE Media Projects API
 *
 * Handles REST API endpoints for media projects
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */
class RAE_Media_Projects_API extends RAE_API_Base {

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
		// Media projects collection endpoint
		register_rest_route(
			'wp/v2',
			'/media-projects',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_items' ),
				'permission_callback' => array( $this, 'public_permission_callback' ),
				'args'                => array(
					'per_page' => array(
						'default'           => 100,
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

		// Individual media project endpoint
		register_rest_route(
			'wp/v2',
			'/media-projects/(?P<id>\d+)',
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
	 * Get media projects
	 *
	 * @param WP_REST_Request $request The REST request object
	 *
	 * @return WP_Error|WP_REST_Response|WP_HTTP_Response
	 */
	public function get_items( WP_REST_Request $request ): WP_Error|WP_REST_Response|WP_HTTP_Response {
		$params = $this->get_sanitized_params( $request, array( 'per_page' => 100 ) );
		$args   = $this->format_query_args( 'media-project', $params );

		$posts = get_posts( $args );
		$data  = array();

		foreach ( $posts as $post ) {
			$data[] = $this->prepare_item( $post );
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Get single media project
	 *
	 * @param WP_REST_Request $request The REST request object
	 *
	 * @return WP_Error|WP_REST_Response|WP_HTTP_Response
	 */
	public function get_item( WP_REST_Request $request ): WP_Error|WP_REST_Response|WP_HTTP_Response {
		$id   = $request->get_param( 'id' );
		$post = get_post( $id );

		if ( empty( $post ) || 'media-project' !== $post->post_type || 'publish' !== $post->post_status ) {
			return new WP_Error( 'not_found', 'Media project not found', array( 'status' => 404 ) );
		}

		$data = $this->prepare_item( $post );
		return rest_ensure_response( $data );
	}

	/**
	 * Prepare media project item data for REST API response
	 *
	 * @param WP_Post $post The media project post object
	 *
	 * @return array Formatted media project data
	 */
	public function prepare_item( WP_Post $post ): array {
		// Get featured image
		$featured_image_id  = get_post_thumbnail_id( $post->ID );
		$featured_image_url = $featured_image_id ? wp_get_attachment_image_url( $featured_image_id, 'full' ) : null;

		// Get project type meta
		$project_type = get_post_meta( $post->ID, '_media_project_type', true );

		// Base item structure
		$item = array(
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
			'project_type'       => $project_type ? $project_type : null,
		);

		// Add project-specific metadata based on type
		if ( 'Music' === $project_type ) {
			$item = array_merge( $item, $this->get_music_project_data( $post->ID ) );
		} elseif ( 'Audio_Post_Production' === $project_type ) {
			$item = array_merge( $item, $this->get_audio_post_project_data( $post->ID ) );
		}

		// Get related skills
		$item['related_skills'] = RAE_Related_Skill_Provider::get_related_skills( $post->ID, '_media_project_related_skills' );

		// Add links
		$item['_links'] = array(
			'self'       => array(
				array(
					'href' => rest_url( 'wp/v2/media-projects/' . $post->ID ),
				),
			),
			'collection' => array(
				array(
					'href' => rest_url( 'wp/v2/media-projects' ),
				),
			),
		);

		return $item;
	}

	/**
	 * Get music project specific data
	 *
	 * @param int $post_id The post ID
	 *
	 * @return array Music project data
	 */
	private function get_music_project_data( int $post_id ): array {
		return array(
			'music_artist_name'    => get_post_meta( $post_id, '_music_artist_name', true )
				? get_post_meta( $post_id, '_music_artist_name', true )
				: null,
			'music_genre'          => get_post_meta( $post_id, '_music_genre', true )
				? get_post_meta( $post_id, '_music_genre', true )
				: null,
			'music_record_label'   => get_post_meta( $post_id, '_music_record_label', true )
				? get_post_meta( $post_id, '_music_record_label', true )
				: null,
			'music_release_date'   => get_post_meta( $post_id, '_music_release_date', true )
				? get_post_meta( $post_id, '_music_release_date', true )
				: null,
			'music_album_title'    => get_post_meta( $post_id, '_music_album_title', true )
				? get_post_meta( $post_id, '_music_album_title', true )
				: null,
			'music_role'           => get_post_meta( $post_id, '_music_role', true )
				? get_post_meta( $post_id, '_music_role', true )
				: null,
			'music_credits'        => RAE_Meta_Utilities::get_list_meta( $post_id, '_music_credits' ),
			'music_equipment_used' => RAE_Meta_Utilities::get_list_meta( $post_id, '_music_equipment_used' ),
			'music_studios'        => RAE_Meta_Utilities::get_list_meta( $post_id, '_music_studios' ),
			'music_collaborators'  => RAE_Meta_Utilities::get_list_meta( $post_id, '_music_collaborators' ),
		);
	}

	/**
	 * Get audio post production project specific data
	 *
	 * @param int $post_id The post ID
	 *
	 * @return array Audio post production project data
	 */
	private function get_audio_post_project_data( int $post_id ): array {
		return array(
			'audio_director'           => get_post_meta( $post_id, '_audio_director', true )
				? get_post_meta( $post_id, '_audio_director', true )
				: null,
			'audio_genre'              => get_post_meta( $post_id, '_audio_genre', true )
				? get_post_meta( $post_id, '_audio_genre', true )
				: null,
			'audio_release_date'       => get_post_meta( $post_id, '_audio_release_date', true )
				? get_post_meta( $post_id, '_audio_release_date', true )
				: null,
			'audio_production_company' => get_post_meta( $post_id, '_audio_production_company', true )
				? get_post_meta( $post_id, '_audio_production_company', true )
				: null,
			'audio_role'               => get_post_meta( $post_id, '_audio_role', true )
				? get_post_meta( $post_id, '_audio_role', true )
				: null,
			'audio_credits'            => RAE_Meta_Utilities::get_list_meta( $post_id, '_audio_credits' ),
			'audio_equipment_used'     => RAE_Meta_Utilities::get_list_meta( $post_id, '_audio_equipment_used' ),
			'audio_studios'            => RAE_Meta_Utilities::get_list_meta( $post_id, '_audio_studios' ),
			'audio_collaborators'      => RAE_Meta_Utilities::get_list_meta( $post_id, '_audio_collaborators' ),
		);
	}
}
