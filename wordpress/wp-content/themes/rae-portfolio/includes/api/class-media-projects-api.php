<?php
/**
 * Media Projects API
 * Handles REST API endpoints for media projects
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

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
						'validate_callback' => function ( $param, $request, $key ) {
							return is_numeric( $param );
						},
					),
				),
			)
		);
	}

	/**
	 * Get media projects
	 */
	public function get_items( $request ): WP_Error|WP_REST_Response|WP_HTTP_Response {
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
	 */
	public function get_item( $request ): WP_Error|WP_REST_Response|WP_HTTP_Response {
		$id   = $request->get_param( 'id' );
		$post = get_post( $id );

		if ( empty( $post ) || $post->post_type !== 'media-project' || $post->post_status !== 'publish' ) {
			return new WP_Error( 'not_found', 'Media project not found', array( 'status' => 404 ) );
		}

		$data = $this->prepare_item( $post );
		return rest_ensure_response( $data );
	}

	/**
	 * Prepare media project item data for REST API response
	 */
	public function prepare_item( $post ): array {
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
			'featured_media'     => $featured_image_id ?: 0,
			'template'           => '',
			'meta'               => array(),
			'class_list'         => get_post_class( '', $post->ID ),
			'featured_image_url' => $featured_image_url,
			'project_type'       => $project_type ?: null,
		);

		// Add project-specific metadata based on type
		if ( $project_type === 'Music' ) {
			$item = array_merge( $item, $this->get_music_project_data( $post->ID ) );
		} elseif ( $project_type === 'Audio_Post_Production' ) {
			$item = array_merge( $item, $this->get_audio_post_project_data( $post->ID ) );
		}

		// Get related skills
		$item['related_skills'] = $this->get_related_skills( $post->ID );

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
	 */
	private function get_music_project_data( $post_id ): array {
		return array(
			'music_artist_name'    => get_post_meta( $post_id, '_music_artist_name', true ) ?: null,
			'music_genre'          => get_post_meta( $post_id, '_music_genre', true ) ?: null,
			'music_record_label'   => get_post_meta( $post_id, '_music_record_label', true ) ?: null,
			'music_release_date'   => get_post_meta( $post_id, '_music_release_date', true ) ?: null,
			'music_album_title'    => get_post_meta( $post_id, '_music_album_title', true ) ?: null,
			'music_role'           => get_post_meta( $post_id, '_music_role', true ) ?: null,
			'music_credits'        => RAE_Meta_Utilities::get_list_meta( $post_id, '_music_credits' ),
			'music_equipment_used' => RAE_Meta_Utilities::get_list_meta( $post_id, '_music_equipment_used' ),
			'music_studios'        => RAE_Meta_Utilities::get_list_meta( $post_id, '_music_studios' ),
			'music_collaborators'  => RAE_Meta_Utilities::get_list_meta( $post_id, '_music_collaborators' ),
		);
	}

	/**
	 * Get audio post production project specific data
	 */
	private function get_audio_post_project_data( $post_id ): array {
		return array(
			'audio_director'           => get_post_meta( $post_id, '_audio_director', true ) ?: null,
			'audio_genre'              => get_post_meta( $post_id, '_audio_genre', true ) ?: null,
			'audio_release_date'       => get_post_meta( $post_id, '_audio_release_date', true ) ?: null,
			'audio_production_company' => get_post_meta( $post_id, '_audio_production_company', true ) ?: null,
			'audio_role'               => get_post_meta( $post_id, '_audio_role', true ) ?: null,
			'audio_credits'            => RAE_Meta_Utilities::get_list_meta( $post_id, '_audio_credits' ),
			'audio_equipment_used'     => RAE_Meta_Utilities::get_list_meta( $post_id, '_audio_equipment_used' ),
			'audio_studios'            => RAE_Meta_Utilities::get_list_meta( $post_id, '_audio_studios' ),
			'audio_collaborators'      => RAE_Meta_Utilities::get_list_meta( $post_id, '_audio_collaborators' ),
		);
	}

	/**
	 * Get related skills for the media project
	 */
	private function get_related_skills( $post_id ): array {
		$related_skill_ids = get_post_meta( $post_id, '_media_project_related_skills', true );
		$related_skills    = array();

		if ( is_array( $related_skill_ids ) && ! empty( $related_skill_ids ) ) {
			foreach ( $related_skill_ids as $skill_id ) {
				$skill_post = get_post( $skill_id );
				if ( $skill_post && $skill_post->post_type === 'skill' && $skill_post->post_status === 'publish' ) {
					// Use Skills API to prepare skill items
					if ( class_exists( 'RAE_Skills_API' ) ) {
						$skills_api       = new RAE_Skills_API();
						$related_skills[] = $skills_api->prepare_item( $skill_post );
					}
				}
			}

			// Sort skills by weight (descending) then alphabetically
			usort(
				$related_skills,
				function ( $a, $b ) {
					$weight_diff = $b['skills_weight'] - $a['skills_weight'];
					if ( $weight_diff !== 0 ) {
						return $weight_diff;
					}
					return strcmp( $a['skills_value'] ?: $a['title']['rendered'], $b['skills_value'] ?: $b['title']['rendered'] );
				}
			);
		}

		return $related_skills;
	}
}
