<?php
/**
 * reCAPTCHA REST API
 * Provides REST endpoints for reCAPTCHA v3 and v2 verification
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class RAE_ReCaptcha_API extends RAE_API_Base {

    /**
     * API endpoint path
     */
    protected string $endpoint = 'recaptcha';

    /**
     * API namespace
     */
    const API_NAMESPACE = 'wp/v2';

    /**
     * Google reCAPTCHA verify URL
     */
    const GOOGLE_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

    /**
     * Rate limiting settings
     */
    const RATE_LIMIT_ATTEMPTS = 10;
    const RATE_LIMIT_WINDOW = 300; // 5 minutes

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
        // Configuration status endpoint
        register_rest_route(
            self::API_NAMESPACE,
            '/' . $this->endpoint . '/status',
            array(
                'methods' => 'GET',
                'callback' => array($this, 'get_status'),
                'permission_callback' => array($this, 'public_permission_callback'),
            )
        );

        // reCAPTCHA v3 verification endpoint
        register_rest_route(
            self::API_NAMESPACE,
            '/' . $this->endpoint . '/verify',
            array(
                'methods' => 'POST',
                'callback' => array($this, 'verify_v3_token'),
                'permission_callback' => array($this, 'public_permission_callback'),
                'args' => array(
                    'token' => array(
                        'required' => true,
                        'type' => 'string',
                        'description' => 'reCAPTCHA v3 response token',
                        'sanitize_callback' => 'sanitize_text_field',
                        'validate_callback' => array($this, 'validate_token'),
                    ),
                    'action' => array(
                        'required' => true,
                        'type' => 'string',
                        'description' => 'Action name for verification',
                        'sanitize_callback' => 'sanitize_text_field',
                        'validate_callback' => array($this, 'validate_action'),
                    ),
                ),
            )
        );

    }

    /**
     * Get reCAPTCHA configuration status
     */
    public function get_status(WP_REST_Request $request): WP_REST_Response {
        try {
            $settings = RAE_ReCaptcha_Options::get_settings();
            
            $status_data = array(
                'enabled' => RAE_ReCaptcha_Options::is_enabled(),
                'v3_configured' => !empty($settings['v3_site_key']),
                'threshold' => RAE_ReCaptcha_Options::get_threshold(),
                'badge_position' => $settings['badge_position'],
                'site_keys' => array(
                    'v3' => !empty($settings['v3_site_key']) ? $settings['v3_site_key'] : null,
                ),
            );

            $response = new WP_REST_Response($status_data, 200);
            
            // Add caching headers
            $response->header('Cache-Control', 'public, max-age=300'); // 5 minutes
            $response->header('Expires', gmdate('D, d M Y H:i:s', time() + 300) . ' GMT');

            return $response;

        } catch (Exception $e) {
            return new WP_REST_Response(
                array(
                    'error' => true,
                    'message' => 'Failed to retrieve reCAPTCHA status',
                    'code' => 'recaptcha_status_error'
                ),
                500
            );
        }
    }

    /**
     * Verify reCAPTCHA v3 token
     */
    public function verify_v3_token(WP_REST_Request $request): WP_REST_Response {
        try {
            // Check rate limiting
            if (!$this->check_rate_limit()) {
                return new WP_REST_Response(
                    array(
                        'success' => false,
                        'error' => 'rate_limit_exceeded',
                        'message' => 'Too many verification attempts. Please try again later.',
                    ),
                    429
                );
            }

            $token = $request->get_param('token');
            $action = $request->get_param('action');
            
            // Get settings
            $settings = RAE_ReCaptcha_Options::get_settings();
            
            if (!RAE_ReCaptcha_Options::is_enabled()) {
                return new WP_REST_Response(
                    array(
                        'success' => false,
                        'error' => 'recaptcha_disabled',
                        'message' => 'reCAPTCHA verification is disabled.',
                    ),
                    400
                );
            }

            // Verify token with Google
            $verification_result = $this->call_google_verify_api(
                $token,
                $settings['v3_secret_key'],
                'v3'
            );

            if (!$verification_result['success']) {
                $this->log_verification_attempt($token, 0, false, $action, 'v3');
                
                return new WP_REST_Response(
                    array(
                        'success' => false,
                        'error' => 'verification_failed',
                        'message' => 'reCAPTCHA verification failed.',
                        'google_errors' => $verification_result['error-codes'] ?? array(),
                    ),
                    400
                );
            }

            $score = floatval($verification_result['score']);
            $threshold = RAE_ReCaptcha_Options::get_threshold();
            
            // Evaluate score
            $score_passed = $this->evaluate_v3_score($score, $threshold);
            
            // Log verification attempt
            $this->log_verification_attempt($token, $score, $score_passed, $action, 'v3');

            // If score is below threshold, return failure instead of suggesting challenge
            if (!$score_passed) {
                $this->log_verification_attempt($token, $score, false, $action, 'v3');
                
                return new WP_REST_Response(
                    array(
                        'success' => false,
                        'error' => 'score_too_low',
                        'message' => 'reCAPTCHA verification failed due to low score.',
                        'score' => $score,
                        'threshold' => $threshold,
                    ),
                    400
                );
            }

            $response_data = array(
                'success' => true,
                'score' => $score,
                'threshold' => $threshold,
                'score_passed' => $score_passed,
                'action' => $verification_result['action'],
                'hostname' => $verification_result['hostname'] ?? null,
                'timestamp' => current_time('mysql'),
            );

            return new WP_REST_Response($response_data, 200);

        } catch (Exception $e) {
            error_log('reCAPTCHA v3 Verification Error: ' . $e->getMessage());
            
            return new WP_REST_Response(
                array(
                    'success' => false,
                    'error' => 'server_error',
                    'message' => 'Server error during verification. Please try again.',
                ),
                500
            );
        }
    }


    /**
     * Call Google reCAPTCHA verify API
     */
    private function call_google_verify_api(string $token, string $secret_key, string $version): array {
        $user_ip = $this->get_user_ip();
        
        $body = array(
            'secret' => $secret_key,
            'response' => $token,
            'remoteip' => $user_ip,
        );

        $response = wp_remote_post(self::GOOGLE_VERIFY_URL, array(
            'body' => $body,
            'timeout' => 10,
            'headers' => array(
                'Content-Type' => 'application/x-www-form-urlencoded',
                'User-Agent' => 'WordPress/' . get_bloginfo('version') . '; ' . home_url(),
            ),
            'sslverify' => true,
        ));

        if (is_wp_error($response)) {
            error_log('reCAPTCHA API Error: ' . $response->get_error_message());
            throw new Exception('Failed to contact reCAPTCHA verification service');
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);

        if ($response_code !== 200) {
            error_log("reCAPTCHA API HTTP Error: {$response_code}");
            throw new Exception('reCAPTCHA verification service returned an error');
        }

        $result = json_decode($response_body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('reCAPTCHA API JSON Error: ' . json_last_error_msg());
            throw new Exception('Invalid response from reCAPTCHA verification service');
        }

        return $result;
    }

    /**
     * Evaluate reCAPTCHA v3 score
     */
    private function evaluate_v3_score(float $score, float $threshold): bool {
        return $score >= $threshold;
    }

    /**
     * Check rate limiting
     */
    private function check_rate_limit(): bool {
        $user_ip = $this->get_user_ip();
        $rate_limit_key = "recaptcha_attempts_" . md5($user_ip);
        
        $attempts = get_transient($rate_limit_key);
        
        if ($attempts === false) {
            $attempts = 0;
        }
        
        if ($attempts >= self::RATE_LIMIT_ATTEMPTS) {
            return false;
        }
        
        // Increment attempts
        set_transient($rate_limit_key, $attempts + 1, self::RATE_LIMIT_WINDOW);
        
        return true;
    }

    /**
     * Get user IP address
     */
    private function get_user_ip(): string {
        // Check for various headers that might contain the real IP
        $headers = array(
            'HTTP_CF_CONNECTING_IP',     // Cloudflare
            'HTTP_X_REAL_IP',            // Nginx proxy
            'HTTP_X_FORWARDED_FOR',      // Load balancers, proxies
            'HTTP_X_FORWARDED',          // Proxies
            'HTTP_X_CLUSTER_CLIENT_IP',  // Cluster environments
            'HTTP_FORWARDED_FOR',        // Proxies
            'HTTP_FORWARDED',            // Proxies
            'REMOTE_ADDR'                // Standard
        );

        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
                
                // Handle comma-separated list (X-Forwarded-For can contain multiple IPs)
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                
                // Validate IP address
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }

        // Fallback to REMOTE_ADDR
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }

    /**
     * Log verification attempt
     */
    private function log_verification_attempt(string $token, ?float $score, bool $success, string $action, string $version): void {
        $log_entry = array(
            'timestamp' => current_time('mysql'),
            'ip' => $this->get_user_ip(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'version' => $version,
            'action' => $action,
            'score' => $score,
            'success' => $success,
            'token_hash' => hash('sha256', $token), // Log hash, not actual token
        );

        // Log to WordPress debug log if enabled
        if (WP_DEBUG_LOG) {
            $log_message = sprintf(
                'reCAPTCHA %s: %s | Action: %s | Score: %s | Success: %s | IP: %s',
                strtoupper($version),
                $success ? 'PASS' : 'FAIL',
                $action,
                $score !== null ? number_format($score, 2) : 'N/A',
                $success ? 'YES' : 'NO',
                $log_entry['ip']
            );
            
            error_log($log_message);
        }

        // Store in option for admin review (keep last 100 entries)
        $log_option = 'rae_recaptcha_verification_log';
        $existing_log = get_option($log_option, array());
        
        array_unshift($existing_log, $log_entry);
        
        // Keep only last 100 entries
        if (count($existing_log) > 100) {
            $existing_log = array_slice($existing_log, 0, 100);
        }
        
        update_option($log_option, $existing_log, false);

        // Trigger action for external integrations
        do_action('rae_recaptcha_verification_logged', $log_entry);
    }

    /**
     * Validate token parameter
     */
    public function validate_token($value, $request, $param): bool {
        return !empty($value) && is_string($value) && strlen($value) > 10;
    }

    /**
     * Validate action parameter
     */
    public function validate_action($value, $request, $param): bool {
        $valid_actions = array('contact_form', 'newsletter_signup', 'login', 'comment');
        return !empty($value) && is_string($value) && in_array($value, $valid_actions);
    }

    /**
     * Get verification statistics for admin
     */
    public static function get_verification_stats(): array {
        $log_option = 'rae_recaptcha_verification_log';
        $log_entries = get_option($log_option, array());
        
        $stats = array(
            'total_attempts' => count($log_entries),
            'successful_attempts' => 0,
            'failed_attempts' => 0,
            'v3_attempts' => 0,
            'average_score' => 0,
            'score_distribution' => array(
                '0.0-0.2' => 0,
                '0.2-0.4' => 0,
                '0.4-0.6' => 0,
                '0.6-0.8' => 0,
                '0.8-1.0' => 0,
            ),
            'recent_attempts' => array_slice($log_entries, 0, 20),
        );

        $total_score = 0;
        $score_count = 0;

        foreach ($log_entries as $entry) {
            if ($entry['success']) {
                $stats['successful_attempts']++;
            } else {
                $stats['failed_attempts']++;
            }

            if ($entry['version'] === 'v3') {
                $stats['v3_attempts']++;
                
                if ($entry['score'] !== null) {
                    $total_score += $entry['score'];
                    $score_count++;
                    
                    // Score distribution
                    $score = $entry['score'];
                    if ($score >= 0.8) {
                        $stats['score_distribution']['0.8-1.0']++;
                    } elseif ($score >= 0.6) {
                        $stats['score_distribution']['0.6-0.8']++;
                    } elseif ($score >= 0.4) {
                        $stats['score_distribution']['0.4-0.6']++;
                    } elseif ($score >= 0.2) {
                        $stats['score_distribution']['0.2-0.4']++;
                    } else {
                        $stats['score_distribution']['0.0-0.2']++;
                    }
                }
            }
        }

        if ($score_count > 0) {
            $stats['average_score'] = round($total_score / $score_count, 3);
        }

        return $stats;
    }

    /**
     * Clear verification logs
     */
    public static function clear_verification_logs(): bool {
        return delete_option('rae_recaptcha_verification_log');
    }

    /**
     * Check if reCAPTCHA verification is required for given action
     */
    public static function is_verification_required(string $action = 'contact_form'): bool {
        if (!RAE_ReCaptcha_Options::is_enabled()) {
            return false;
        }

        // Add action-specific logic here if needed
        $required_actions = array('contact_form', 'newsletter_signup');
        
        return in_array($action, $required_actions);
    }

    /**
     * Get reCAPTCHA configuration for frontend
     */
    public static function get_frontend_config(): array {
        if (!RAE_ReCaptcha_Options::is_enabled()) {
            return array(
                'enabled' => false,
            );
        }

        $settings = RAE_ReCaptcha_Options::get_settings();
        
        return array(
            'enabled' => true,
            'v3_site_key' => $settings['v3_site_key'],
            'threshold' => RAE_ReCaptcha_Options::get_threshold(),
            'badge_position' => $settings['badge_position'],
        );
    }
}

// Initialize the API if the options class exists
if (class_exists('RAE_ReCaptcha_Options')) {
    // This will be initialized by the theme loader
}