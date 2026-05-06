<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the website, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/
 *
 * @package WordPress
 */

// CloudFront HTTPS detection - MUST be at the top before any WordPress loads
if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
    $_SERVER['HTTPS'] = 'on';
    $_SERVER['SERVER_PORT'] = 443;
    $_SERVER['REQUEST_SCHEME'] = 'https';
}

// Force correct host for CloudFront
if (isset($_SERVER['HTTP_X_FORWARDED_HOST']) && $_SERVER['HTTP_X_FORWARDED_HOST'] === 'api-dev.rae-dev.com') {
    $_SERVER['HTTP_HOST'] = 'api-dev.rae-dev.com';
    $_SERVER['REQUEST_SCHEME'] = 'https';
    $_SERVER['HTTPS'] = 'on';
    $_SERVER['SERVER_PORT'] = 443;
}

// Ensure HTTP_HOST is always set for all requests
if (!isset($_SERVER['HTTP_HOST'])) {
    $_SERVER['HTTP_HOST'] = 'api-dev.rae-dev.com';
}

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'bitnami_wordpress' );

/** Database username */
define( 'DB_USER', 'bn_wordpress' );

/** Database password */
define( 'DB_PASSWORD', '2c43b500ab40fce751b882f94758adc00591784dd1ba7555ad6c3839c86a2348' );

/** Database hostname */
define( 'DB_HOST', '127.0.0.1:3306' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         '{42)rMb?2#]LPw;+cJ}ng9tfHT$^0zj|/`?7P!~mK67U+Lzki[|-IFu~7L4av,+a' );
define( 'SECURE_AUTH_KEY',  ':;EuTMuu&t~uOL~n8~0JTGC^qS_.iUMiQxa]JGQ~5]=4*GLnyl]]2uGy-8=*QcI~' );
define( 'LOGGED_IN_KEY',    'srXKs-{}n;ty}JwWMxDT1,74)f$Ud=:lWxxRmQp-x%MmySeqLIovPm]gX%@PQ/G%' );
define( 'NONCE_KEY',        '}Jpw;Ik$!m5MG74?j7)R1bs1P;f{T8`NKCy!I%VitgG>;JHULy^d-RJ?%AXb@vMC' );
define( 'AUTH_SALT',        'OIy 6!@^jVLPdl%9cQ0-#ZBjedFD,t+$Kog5L/2G|{5mNc@PTaIzcg4c:Qe)l5Kg' );
define( 'SECURE_AUTH_SALT', 't7z[F84LmD,xNBSj-R ?KI*-dPO*t8Aq*ZZ$[O~R0PKY(xT~=C+-(fx55~ncp=6N' );
define( 'LOGGED_IN_SALT',   'FM+yyOD0g=Kr8D;48Tn18yR^Cc)?-E-oP_dY>x%k[Mux?iVbQ*zo8_N~wb-{KKbp' );
define( 'NONCE_SALT',       'r/o`D1^H:N/%JFFeHLcy.(U&TNbR/TD8,6).o>k(RXxhqVH#,;<?t7|P*p/&u1z6' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/
 */
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */

// FORCE HTTPS URLs - These override database options and ensure HTTPS everywhere
define( 'WP_HOME', 'https://api-dev.rae-dev.com' );
define( 'WP_SITEURL', 'https://api-dev.rae-dev.com' );

// Force SSL for admin area
define( 'FORCE_SSL_ADMIN', true );

// Allow WordPress to detect proper HTTPS behind reverse proxy/CloudFront
define( 'WP_CONTENT_URL', 'https://api-dev.rae-dev.com/wp-content' );

// File system method
define( 'FS_METHOD', 'direct' );

// Auto-update settings
define( 'WP_AUTO_UPDATE_CORE', 'minor' );

// WP-CLI compatibility
if ( defined( 'WP_CLI' ) ) {
	$_SERVER['HTTP_HOST'] = 'api-dev.rae-dev.com';
	$_SERVER['REQUEST_SCHEME'] = 'https';
	$_SERVER['HTTPS'] = 'on';
	$_SERVER['SERVER_PORT'] = 443;
}

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';

/**
 * Disable pingback.ping xmlrpc method to prevent WordPress from participating in DDoS attacks
 * More info at: https://docs.bitnami.com/general/apps/wordpress/troubleshooting/xmlrpc-and-pingback/
 */
if ( !defined( 'WP_CLI' ) ) {
	// remove x-pingback HTTP header
	add_filter("wp_headers", function($headers) {
		unset($headers["X-Pingback"]);
		return $headers;
	});

	// disable pingbacks
	add_filter( "xmlrpc_methods", function( $methods ) {
		unset( $methods["pingback.ping"] );
		return $methods;
	});
}