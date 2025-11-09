<?php
/**
 * Meta Utilities
 * Helper functions for WordPress metadata handling
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class RAE_Meta_Utilities {

	/**
	 * Get list meta (handles both array and newline-separated string formats)
	 */
	public static function get_list_meta( $post_id, $meta_key ) {
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
