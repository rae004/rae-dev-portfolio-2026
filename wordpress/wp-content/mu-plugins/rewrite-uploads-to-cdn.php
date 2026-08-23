<?php
/**
 * Plugin Name: Rae Portfolio - Rewrite Uploads to CDN
 * Description: Rewrites WP Offload Media's S3 URLs to our CloudFront CDN host
 *              so uploads served through a private S3 bucket (with OAC) reach
 *              the browser via media-${env}.rae-dev.com instead of the raw
 *              S3 endpoint. Compensates for WP Offload Media Lite not
 *              supporting Custom Domain (CNAME) delivery — that's a Pro
 *              feature, and we don't need the rest of Pro.
 *
 * The bucket name + CDN host are passed through filters so future-you can
 * override per-environment via a tiny drop-in or wp-config constant set.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * S3 bucket the offload plugin writes to. Filterable via
 * `rae_media_s3_bucket`. Defaults to the dev bucket.
 */
function rae_media_s3_bucket(): string {
	return (string) apply_filters( 'rae_media_s3_bucket', 'rae-portfolio-media-dev-233416806179' );
}

/**
 * CDN host (CloudFront → S3 via OAC) that serves the bucket publicly.
 * Filterable via `rae_media_cdn_host`.
 */
function rae_media_cdn_host(): string {
	return (string) apply_filters( 'rae_media_cdn_host', 'media-dev.rae-dev.com' );
}

/**
 * Build the list of S3 origin hosts whose URLs we'll rewrite. Covers both
 * virtual-hosted style (bucket.s3.amazonaws.com) and path-style
 * (s3.amazonaws.com/bucket), with and without region in the hostname.
 */
function rae_s3_origin_hosts(): array {
	$bucket = rae_media_s3_bucket();
	return array(
		"{$bucket}.s3.amazonaws.com",
		"{$bucket}.s3.us-east-1.amazonaws.com",
		"s3.amazonaws.com/{$bucket}",
		"s3.us-east-1.amazonaws.com/{$bucket}",
	);
}

/**
 * Rewrite a single URL. Returns the original if it doesn't match any of the
 * S3 origin patterns.
 */
function rae_rewrite_media_url( $url ) {
	if ( ! is_string( $url ) || empty( $url ) ) {
		return $url;
	}

	$cdn = rae_media_cdn_host();
	foreach ( rae_s3_origin_hosts() as $origin ) {
		if ( false !== strpos( $url, $origin ) ) {
			return preg_replace(
				'#https?://' . preg_quote( $origin, '#' ) . '#',
				'https://' . $cdn,
				$url
			);
		}
	}

	return $url;
}

// ---------- Hooks ----------

// Single attachment URL (most common path — used by featured_image_url, REST API).
add_filter(
	'wp_get_attachment_url',
	function ( $url ) {
		return rae_rewrite_media_url( $url );
	},
	999
);

// Image src array (wp_get_attachment_image_src, wp_get_attachment_image, etc.).
add_filter(
	'wp_get_attachment_image_src',
	function ( $image ) {
		if ( is_array( $image ) && isset( $image[0] ) ) {
			$image[0] = rae_rewrite_media_url( $image[0] );
		}
		return $image;
	},
	999
);

// Responsive image srcsets — each source has its own URL.
add_filter(
	'wp_calculate_image_srcset',
	function ( $sources ) {
		if ( ! is_array( $sources ) ) {
			return $sources;
		}
		foreach ( $sources as $key => $source ) {
			if ( isset( $source['url'] ) ) {
				$sources[ $key ]['url'] = rae_rewrite_media_url( $source['url'] );
			}
		}
		return $sources;
	},
	999
);
