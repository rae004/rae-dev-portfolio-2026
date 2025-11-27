<?php
/**
 * Date Formatter Utility
 * Handles date formatting functionality
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * RAE Date Formatter
 *
 * Provides date formatting utilities for the RAE Portfolio theme.
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */
class RAE_Date_Formatter {

	/**
	 * Format employment date range
	 *
	 * @param string $start_date        The start date
	 * @param string $end_date          The end date
	 * @param bool   $currently_employed Whether currently employed
	 *
	 * @return string|null Formatted date range or null if no start date
	 */
	public static function format_employment_date_range( string $start_date, string $end_date, bool $currently_employed ): ?string {
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
