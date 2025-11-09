<?php
/**
 * Date Formatter Utility
 * Handles date formatting functionality
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class RAE_Date_Formatter {

	/**
	 * Format employment date range
	 */
	public static function format_employment_date_range( $start_date, $end_date, $currently_employed ) {
		if ( empty( $start_date ) ) {
			return null;
		}

		$formatted_range = $start_date;

		if ( $currently_employed ) {
			$formatted_range .= ' - Present';
		} elseif ( ! empty( $end_date ) ) {
			$formatted_range .= ' - ' . $end_date;
		}

		return $formatted_range;
	}
}
