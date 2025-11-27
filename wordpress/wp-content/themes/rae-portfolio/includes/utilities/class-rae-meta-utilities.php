<?php
/**
 * Meta Utilities
 * Helper functions for WordPress metadata handling
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * RAE Meta Utilities
 *
 * Provides utility functions for handling WordPress post metadata.
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */
class RAE_Meta_Utilities {

	/**
	 * Get list meta (handles both array and newline-separated string formats)
	 *
	 * @param int    $post_id  The post ID
	 * @param string $meta_key The meta key to retrieve
	 *
	 * @return array Parsed list of values
	 */
	public static function get_list_meta( int $post_id, string $meta_key ): array {
		$meta_value = get_post_meta( $post_id, $meta_key, true );

		if ( empty( $meta_value ) ) {
			return array();
		}

		// If it's already an array, return it
		if ( is_array( $meta_value ) ) {
			return array_filter( $meta_value ); // Remove empty values
		}

		// If it's a string, split by newlines
		if ( is_string( $meta_value ) ) {
			$lines = explode( "\n", $meta_value );
			return array_filter( array_map( 'trim', $lines ) ); // Remove empty lines and trim
		}

		return array();
	}
}
