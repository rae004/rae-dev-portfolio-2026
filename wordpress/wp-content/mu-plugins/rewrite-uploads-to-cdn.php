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
 * S3 bucket the offload plugin writes to. Set per environment with the
 * RAE_MEDIA_S3_BUCKET constant in wp-config.php (prod:
 * rae-portfolio-media-prod-<account>); defaults to the dev bucket.
 * Filterable via `rae_media_s3_bucket`.
 */
function rae_media_s3_bucket(): string {
	$default = defined( 'RAE_MEDIA_S3_BUCKET' ) ? RAE_MEDIA_S3_BUCKET : 'rae-portfolio-media-dev-233416806179';
	return (string) apply_filters( 'rae_media_s3_bucket', $default );
}

/**
 * CDN host (CloudFront → S3 via OAC) that serves the bucket publicly. Set
 * per environment with the RAE_MEDIA_CDN_HOST constant in wp-config.php
 * (prod: media.rae-dev.com); defaults to dev. Filterable via
 * `rae_media_cdn_host`.
 */
function rae_media_cdn_host(): string {
	$default = defined( 'RAE_MEDIA_CDN_HOST' ) ? RAE_MEDIA_CDN_HOST : 'media-dev.rae-dev.com';
	return (string) apply_filters( 'rae_media_cdn_host', $default );
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

// Intermediate sizes resolved through image_downsize() directly (bypassing
// wp_get_attachment_image_src), which is what the admin media grid/modal and
// the REST media endpoint use to build per-size URLs.
add_filter(
	'image_downsize',
	function ( $out ) {
		if ( is_array( $out ) && isset( $out[0] ) ) {
			$out[0] = rae_rewrite_media_url( $out[0] );
		}
		return $out;
	},
	999
);

// Attachment payload for the admin media modal / grid: url, icon and every
// size URL. Belt and braces over the filters above.
add_filter(
	'wp_prepare_attachment_for_js',
	function ( $response ) {
		if ( ! is_array( $response ) ) {
			return $response;
		}
		foreach ( array( 'url', 'icon' ) as $key ) {
			if ( isset( $response[ $key ] ) ) {
				$response[ $key ] = rae_rewrite_media_url( $response[ $key ] );
			}
		}
		if ( isset( $response['sizes'] ) && is_array( $response['sizes'] ) ) {
			foreach ( $response['sizes'] as $size => $data ) {
				if ( isset( $data['url'] ) ) {
					$response['sizes'][ $size ]['url'] = rae_rewrite_media_url( $data['url'] );
				}
			}
		}
		return $response;
	},
	999
);
