<?php
/**
 * Related Skill Provider
 *
 * @package RAE_Portfolio
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * RAE Related Skill Provider
 *
 * Provides functionality to retrieve related skills for resume items.
 *
 * @package RAE_Portfolio
 */
class RAE_Related_Skill_Provider {

	/**
	 * Get related skills for a given post item ID.
	 *
	 * @param int    $post_id The post item ID.
	 * @param string $related_skill_meta_keys Meta key for related skills.
	 *
	 * @return array List of related skills.
	 */
	public static function get_related_skills( int $post_id, string $related_skill_meta_keys ): array {
		$related_skill_ids = get_post_meta( $post_id, $related_skill_meta_keys, true );
		$related_skills    = array();

		if ( is_array( $related_skill_ids ) && ! empty( $related_skill_ids ) ) {
			$skill_provider = new RAE_Related_Skill_Provider();

			foreach ( $related_skill_ids as $skill_id ) {
				$related_skills[] = $skill_provider->get_skill_item( $skill_id );
			}

			// Sort skills by weight (descending) then alphabetically
			$related_skills = self::sort_skills( $related_skills );
		}

		return $related_skills;
	}

	/**
	 * Sort skills by weight (descending) then alphabetically
	 *
	 * @param array $skills List of skills to sort.
	 * @return array Sorted list of skills.
	 */
	public static function sort_skills( array $skills ): array {
		usort(
			$skills,
			function ( $a, $b ) {
				$weight_diff = $b['skills_weight'] - $a['skills_weight'];
				if ( 0 !== $weight_diff ) {
					return $weight_diff;
				}

				return strcmp(
					$a['skills_value']
						? $a['skills_value']
						: $a['title']['rendered'],
					$b['skills_value']
						? $b['skills_value']
						: $b['title']['rendered']
				);
			}
		);

		return $skills;
	}

	/**
	 * Get Skill Item
	 *
	 * @param int $skill_id The skill post ID.
	 * @return array|null The skill item data or null if not found.
	 * */
	private function get_skill_item( int $skill_id ): ?array {
		$skill_post = get_post( $skill_id );
		if ( $skill_post && 'skill' === $skill_post->post_type && 'publish' === $skill_post->post_status ) {
			if ( class_exists( 'RAE_Skills_API' ) ) {
				$skills_api = new RAE_Skills_API();
				return $skills_api->prepare_item( $skill_post );
			}
		}
		return null;
	}

	/**
	 * Prevent instantiation
	 */
	private function __construct() {}
}
