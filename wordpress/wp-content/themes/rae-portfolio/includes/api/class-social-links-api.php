<?php
/**
 * Social Links REST API
 * Provides REST endpoints for social links data
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class RAE_Social_Links_API extends RAE_API_Base {

    /**
     * API endpoint path
     */
    protected string $endpoint = 'social-links';

    /**
     * API namespace
     */
    const API_NAMESPACE = 'wp/v2';

    /**
     * Constructor
     */
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes(): void {
        register_rest_route(
            self::API_NAMESPACE,
            '/' . $this->endpoint,
            array(
                'methods' => 'GET',
                'callback' => array($this, 'get_social_links'),
                'permission_callback' => array($this, 'public_permission_callback'),
                'args' => array(
                    'enabled_only' => array(
                        'description' => 'Return only enabled social links',
                        'type' => 'boolean',
                        'default' => true,
                        'sanitize_callback' => 'rest_sanitize_boolean',
                    ),
                    'limit' => array(
                        'description' => 'Maximum number of links to return',
                        'type' => 'integer',
                        'default' => 9,
                        'minimum' => 1,
                        'maximum' => 9,
                        'sanitize_callback' => 'absint',
                    ),
                ),
            )
        );
    }

    /**
     * Get social links endpoint
     */
    public function get_social_links(WP_REST_Request $request): WP_REST_Response {
        try {
            // Get request parameters
            $enabled_only = $request->get_param('enabled_only');
            $limit = $request->get_param('limit');

            // Get social links from WordPress options
            $options = get_option(RAE_Social_Links_Options::OPTION_NAME, array());
            $social_links_data = $options['social_links'] ?? array();

            // Prepare social links array
            $social_links = array();

            foreach ($social_links_data as $link_id => $link_data) {
                // Skip if enabled_only is true and link is disabled
                if ($enabled_only && !($link_data['enabled'] ?? false)) {
                    continue;
                }

                // Skip if label or URL is empty
                if (empty($link_data['label']) || empty($link_data['url'])) {
                    continue;
                }

                // Validate URL
                if (!filter_var($link_data['url'], FILTER_VALIDATE_URL)) {
                    continue;
                }

                // Add to response array
                $social_links[] = array(
                    'id' => sanitize_key($link_id),
                    'label' => sanitize_text_field($link_data['label']),
                    'url' => esc_url_raw($link_data['url']),
                    'platform' => sanitize_text_field($link_data['platform'] ?? 'generic'),
                    'order' => intval($link_data['order'] ?? 0),
                    'enabled' => (bool) ($link_data['enabled'] ?? false)
                );
            }

            // Sort by order
            usort($social_links, function($a, $b) {
                return $a['order'] <=> $b['order'];
            });

            // Apply limit
            if ($limit > 0 && count($social_links) > $limit) {
                $social_links = array_slice($social_links, 0, $limit);
            }

            // Prepare response data
            $response_data = array(
                'social_links' => $social_links,
                'total' => count($social_links),
                'max_allowed' => RAE_Social_Links_Options::MAX_LINKS,
                'enabled_only' => $enabled_only,
                'limit_applied' => $limit
            );

            // Create response
            $response = new WP_REST_Response($response_data, 200);

            // Add caching headers
            $response->header('Cache-Control', 'public, max-age=300'); // 5 minutes
            $response->header('Expires', gmdate('D, d M Y H:i:s', time() + 300) . ' GMT');

            return $response;

        } catch (Exception $e) {
            return new WP_REST_Response(
                array(
                    'error' => true,
                    'message' => 'Failed to retrieve social links',
                    'code' => 'social_links_error'
                ),
                500
            );
        }
    }

    /**
     * Get social links for internal use (non-REST)
     */
    public static function get_social_links_data($enabled_only = true): array {
        $options = get_option(RAE_Social_Links_Options::OPTION_NAME, array());
        $social_links_data = $options['social_links'] ?? array();

        $social_links = array();

        foreach ($social_links_data as $link_id => $link_data) {
            // Skip if enabled_only is true and link is disabled
            if ($enabled_only && !($link_data['enabled'] ?? false)) {
                continue;
            }

            // Skip if label or URL is empty
            if (empty($link_data['label']) || empty($link_data['url'])) {
                continue;
            }

            // Validate URL
            if (!filter_var($link_data['url'], FILTER_VALIDATE_URL)) {
                continue;
            }

            $social_links[] = array(
                'id' => sanitize_key($link_id),
                'label' => sanitize_text_field($link_data['label']),
                'url' => esc_url_raw($link_data['url']),
                'platform' => sanitize_text_field($link_data['platform'] ?? 'generic'),
                'order' => intval($link_data['order'] ?? 0),
                'enabled' => (bool) ($link_data['enabled'] ?? false)
            );
        }

        // Sort by order
        usort($social_links, function($a, $b) {
            return $a['order'] <=> $b['order'];
        });

        return $social_links;
    }

    /**
     * Get single social link by ID
     */
    public static function get_social_link_by_id($link_id): ?array {
        $social_links = self::get_social_links_data(false);

        foreach ($social_links as $link) {
            if ($link['id'] === $link_id) {
                return $link;
            }
        }

        return null;
    }

    /**
     * Get social links count
     */
    public static function get_social_links_count($enabled_only = true): int {
        return count(self::get_social_links_data($enabled_only));
    }

    /**
     * Check if social links are configured
     */
    public static function has_social_links($enabled_only = true): bool {
        return self::get_social_links_count($enabled_only) > 0;
    }

    /**
     * Get platforms summary
     */
    public static function get_platforms_summary(): array {
        $social_links = self::get_social_links_data(true);
        $platforms = array();

        foreach ($social_links as $link) {
            $platform = $link['platform'];
            if (!isset($platforms[$platform])) {
                $platforms[$platform] = 0;
            }
            $platforms[$platform]++;
        }

        return $platforms;
    }

    /**
     * Validate social link data
     */
    public static function validate_social_link_data(array $link_data): array {
        $errors = array();

        // Check required fields
        if (empty($link_data['label'])) {
            $errors[] = 'Label is required';
        }

        if (empty($link_data['url'])) {
            $errors[] = 'URL is required';
        }

        // Validate URL format
        if (!empty($link_data['url']) && !filter_var($link_data['url'], FILTER_VALIDATE_URL)) {
            $errors[] = 'Invalid URL format';
        }

        // Check label length
        if (!empty($link_data['label']) && strlen($link_data['label']) > 50) {
            $errors[] = 'Label must be 50 characters or less';
        }

        return $errors;
    }

    /**
     * Clear social links cache
     */
    public static function clear_cache(): void {
        // Clear any WordPress object cache if needed
        wp_cache_delete(RAE_Social_Links_Options::OPTION_NAME, 'options');

        // Trigger action for external cache clearing
        do_action('rae_social_links_cache_cleared');
    }
}

// Initialize the API if the options class exists
if (class_exists('RAE_Social_Links_Options')) {
    // This will be initialized by the theme loader
}