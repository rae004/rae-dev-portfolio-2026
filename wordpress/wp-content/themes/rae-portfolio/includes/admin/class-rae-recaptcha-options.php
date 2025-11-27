<?php
/**
 * Google reCAPTCHA v3 Options
 * WordPress admin settings page for managing reCAPTCHA v3 and v2 configuration
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * RAE reCAPTCHA Options
 *
 * Provides an admin settings page for configuring Google reCAPTCHA v3 protection.
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */
class RAE_ReCaptcha_Options {

	/**
	 * Option name for storing reCAPTCHA settings
	 */
	const OPTION_NAME = 'rae_recaptcha_settings';

	/**
	 * Default score threshold for reCAPTCHA v3
	 */
	const DEFAULT_THRESHOLD = 0.5;

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'add_options_page' ) );
		add_action( 'admin_init', array( $this, 'init_settings' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
		add_action( 'wp_ajax_test_recaptcha_connection', array( $this, 'test_connection_ajax' ) );
	}

	/**
	 * Add reCAPTCHA options page to WordPress admin
	 */
	public function add_options_page(): void {
		add_options_page(
			'Google reCAPTCHA v3 options',    // Page title
			'Google reCAPTCHA v3 options',    // Menu title
			'manage_options',                 // Capability
			'rae-recaptcha-options',         // Menu slug
			array( $this, 'options_page_callback' ) // Callback
		);
	}

	/**
	 * Initialize settings using WordPress Settings API
	 */
	public function init_settings(): void {
		// Register setting
		register_setting(
			'rae_recaptcha_group',
			self::OPTION_NAME,
			array( $this, 'validate_options' )
		);

		// Main settings section
		add_settings_section(
			'rae_recaptcha_main',
			'Google reCAPTCHA Configuration',
			array( $this, 'settings_section_callback' ),
			'rae-recaptcha-options'
		);

		// Enable/disable field
		add_settings_field(
			'enabled',
			'Enable reCAPTCHA Protection',
			array( $this, 'enabled_callback' ),
			'rae-recaptcha-options',
			'rae_recaptcha_main'
		);

		// reCAPTCHA v3 settings section
		add_settings_section(
			'rae_recaptcha_v3',
			'reCAPTCHA v3 Settings (Invisible Protection)',
			array( $this, 'v3_settings_section_callback' ),
			'rae-recaptcha-options'
		);

		// v3 Site Key field
		add_settings_field(
			'v3_site_key',
			'Site Key (v3)',
			array( $this, 'v3_site_key_callback' ),
			'rae-recaptcha-options',
			'rae_recaptcha_v3'
		);

		// v3 Secret Key field
		add_settings_field(
			'v3_secret_key',
			'Secret Key (v3)',
			array( $this, 'v3_secret_key_callback' ),
			'rae-recaptcha-options',
			'rae_recaptcha_v3'
		);

		// Score threshold field
		add_settings_field(
			'threshold',
			'Score Threshold',
			array( $this, 'threshold_callback' ),
			'rae-recaptcha-options',
			'rae_recaptcha_v3'
		);

		// Display settings section
		add_settings_section(
			'rae_recaptcha_display',
			'Display Settings',
			array( $this, 'display_settings_section_callback' ),
			'rae-recaptcha-options'
		);

		// Badge position field
		add_settings_field(
			'badge_position',
			'Badge Position',
			array( $this, 'badge_position_callback' ),
			'rae-recaptcha-options',
			'rae_recaptcha_display'
		);
	}

	/**
	 * Enqueue admin scripts and styles
	 *
	 * @param string $hook The current admin page hook
	 */
	public function enqueue_admin_scripts( string $hook ): void {
		if ( 'settings_page_rae-recaptcha-options' !== $hook ) {
			return;
		}

		// Add custom admin styles
		wp_add_inline_style( 'wp-admin', $this->get_admin_styles() );

		// Add custom admin JavaScript
		wp_add_inline_script( 'jquery', $this->get_admin_javascript() );

		// Add AJAX URL for connection testing
		wp_localize_script(
			'jquery',
			'raeRecaptchaAjax',
			array(
				'ajaxurl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'rae_recaptcha_test' ),
			)
		);
	}

	/**
	 * Options page callback
	 */
	public function options_page_callback(): void {
		// Check user permissions
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

			<div class="notice notice-info">
				<p>
					<strong>Google reCAPTCHA v3 Protection:</strong> Protects your contact forms from spam and bot submissions 
					using invisible scoring. Submissions with scores below the threshold are blocked.
				</p>
			</div>

			<form action="options.php" method="post">
				<?php
				settings_fields( 'rae_recaptcha_group' );
				do_settings_sections( 'rae-recaptcha-options' );
				submit_button( 'Save reCAPTCHA Settings' );
				?>
			</form>

			<div class="postbox" style="margin-top: 20px;">
				<div class="postbox-header">
					<h2 class="hndle">How It Works</h2>
				</div>
				<div class="inside">
					<ol>
						<li>
							<strong>reCAPTCHA v3:</strong>
							Runs invisibly on form submission, scoring user behavior (0.0 = bot, 1.0 = human)
						</li>
						<li><strong>Score Evaluation:</strong> Scores below threshold block form submission</li>
						<li><strong>Protection:</strong> Only submissions with acceptable scores are processed</li>
					</ol>
					<p>
						<strong> Setup:</strong> Get your keys from
						<a href="https://www.google.com/recaptcha/admin/" target="_blank">
							Google reCAPTCHA Admin Console
						</a>
						<br>
						<strong>v3 Keys:</strong> Select "reCAPTCHA v3" and add your domain
					</p>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Settings section callbacks
	 */
	public function settings_section_callback(): void {
		echo '<p>Configure Google reCAPTCHA v3 protection for your contact forms. Only v3 keys are required for protection.</p>';
	}

	/**
	 * reCAPTCHA v3 settings section callback
	 */
	public function v3_settings_section_callback(): void {
		echo '<p>reCAPTCHA v3 offiers protection by analyzing behavior. Set your v3 site and secret keys below.</p>';
	}


	/**
	 * Display settings section callback
	 */
	public function display_settings_section_callback(): void {
		echo '<p>Customize how the reCAPTCHA badge appears on your site.</p>';
	}

	/**
	 * Field callbacks
	 */
	public function enabled_callback(): void {
		$options = get_option( self::OPTION_NAME, $this->get_default_options() );
		$enabled = $options['enabled'] ?? false;
		?>
		<label>
			<input type="checkbox" 
					name="<?php echo esc_attr( self::OPTION_NAME ); ?>[enabled]" 
					value="1" 
					<?php checked( $enabled ); ?> />
			Enable reCAPTCHA protection on contact forms
		</label>
		<p class="description">
			When enabled, all form submissions will be protected by reCAPTCHA verification.
		</p>
		<?php
	}

	/**
	 * reCAPTCHA v3 site key field callback
	 */
	public function v3_site_key_callback(): void {
		$options  = get_option( self::OPTION_NAME, $this->get_default_options() );
		$site_key = $options['v3_site_key'] ?? '';
		?>
		<label>
			<input type="text"
					name="<?php echo esc_attr( self::OPTION_NAME ); ?>[v3_site_key]"
					value="<?php echo esc_attr( $site_key ); ?>"
					class="regular-text"
					placeholder="6LcXXXXXXXXXXXXXXXXXXXXXXXX" />
			<button type="button" class="button test-connection" data-version="v3" data-key-type="site">
				Test v3 Connection
			</button>
		</label>
		<p class="description">
			Your reCAPTCHA v3 Site Key (public key) from Google reCAPTCHA Admin Console.
		</p>
		<div class="test-result" id="v3-test-result" style="display: none;"></div>
		<?php
	}

	/**
	 * reCAPTCHA v3 secret key field callback
	 */
	public function v3_secret_key_callback(): void {
		$options    = get_option( self::OPTION_NAME, $this->get_default_options() );
		$secret_key = $options['v3_secret_key'] ?? '';
		?>
		<label>
			<input type="password"
					name="<?php echo esc_attr( self::OPTION_NAME ); ?>[v3_secret_key]"
					value="<?php echo esc_attr( $secret_key ); ?>"
					class="regular-text"
					placeholder="6LcXXXXXXXXXXXXXXXXXXXXXXXX"
					autocomplete="off" />
		</label>
		<p class="description">
			Your reCAPTCHA v3 Secret Key (private key). This is stored securely and never exposed to the frontend.
		</p>
		<?php
	}

	/**
	 * Score threshold field callback
	 */
	public function threshold_callback(): void {
		$options   = get_option( self::OPTION_NAME, $this->get_default_options() );
		$threshold = isset( $options['threshold'] ) ? floatval( $options['threshold'] ) : self::DEFAULT_THRESHOLD;
		?>
		<label for="threshold-slider">
			<input type="range"
				name="<?php echo esc_attr( self::OPTION_NAME ); ?>[threshold]"
				value="<?php echo esc_attr( $threshold ); ?>"
				min="0.1"
				max="0.9"
				step="0.1"
				id="threshold-slider" />
		</label>
		<span id="threshold-value"><?php echo esc_html( $threshold ); ?></span>
		<p class="description">
			Scores below this threshold will block form submission. 
			<br><strong>0.1-0.3:</strong> Very permissive (fewer blocks)
			<br><strong>0.4-0.6:</strong> Balanced (recommended)
			<br><strong>0.7-0.9:</strong> Strict (more blocks)
		</p>
		<?php
	}


	/**
	 * Badge position field callback
	 */
	public function badge_position_callback(): void {
		$options  = get_option( self::OPTION_NAME, $this->get_default_options() );
		$position = $options['badge_position'] ?? 'bottomright';

		$positions = array(
			'bottomright' => 'Bottom Right',
			'bottomleft'  => 'Bottom Left',
			'inline'      => 'Inline with Form',
		);
		?>
		<label>
			<select name="<?php echo esc_attr( self::OPTION_NAME ); ?>[badge_position]">
				<?php foreach ( $positions as $value => $label ) : ?>
					<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $position, $value ); ?>>
						<?php echo esc_html( $label ); ?>
					</option>
				<?php endforeach; ?>
			</select>
		</label>
		<p class="description">
			Choose where the reCAPTCHA badge appears on your site.
		</p>
		<?php
	}

	/**
	 * Validate and sanitize options
	 *
	 * @param array $input The input data to validate and sanitize
	 *
	 * @return array Sanitized and validated options
	 */
	public function validate_options( array $input ): array {
		$sanitized = array();

		// Validate enabled status
		$sanitized['enabled'] = isset( $input['enabled'] ) && $input['enabled'];

		// Validate and sanitize keys
		$sanitized['v3_site_key']   = isset( $input['v3_site_key'] ) ? sanitize_text_field( trim( $input['v3_site_key'] ) ) : '';
		$sanitized['v3_secret_key'] = isset( $input['v3_secret_key'] ) ? sanitize_text_field( trim( $input['v3_secret_key'] ) ) : '';

		// Validate threshold
		$threshold = isset( $input['threshold'] ) ? floatval( $input['threshold'] ) : self::DEFAULT_THRESHOLD;
		if ( $threshold < 0.1 || $threshold > 0.9 ) {
			$threshold = self::DEFAULT_THRESHOLD;
			add_settings_error(
				self::OPTION_NAME,
				'invalid_threshold',
				'Threshold must be between 0.1 and 0.9. Reset to default value.',
				'warning'
			);
		}
		$sanitized['threshold'] = $threshold;

		// Validate badge position
		$valid_positions = array( 'bottomright', 'bottomleft', 'inline' );
		$badge_position  = isset( $input['badge_position'] ) ? sanitize_text_field( $input['badge_position'] ) : 'bottomright';
		if ( ! in_array( $badge_position, $valid_positions, true ) ) {
			$badge_position = 'bottomright';
		}
		$sanitized['badge_position'] = $badge_position;

		// Validate key format (basic check)
		if ( ! empty( $sanitized['v3_site_key'] ) && ! preg_match( '/^6L[a-zA-Z0-9_-]{38}$/', $sanitized['v3_site_key'] ) ) {
			add_settings_error(
				self::OPTION_NAME,
				'invalid_v3_site_key',
				'Invalid reCAPTCHA v3 Site Key format.'
			);
		}

		// Add success message if enabled and keys are provided
		if ( $sanitized['enabled'] && ! empty( $sanitized['v3_site_key'] ) && ! empty( $sanitized['v3_secret_key'] ) ) {
			add_settings_error(
				self::OPTION_NAME,
				'settings_updated',
				'reCAPTCHA settings updated successfully. Protection is now active.',
				'success'
			);
		}

		return $sanitized;
	}

	/**
	 * AJAX handler for connection testing
	 */
	public function test_connection_ajax(): void {
		// Verify nonce
		if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce(
			sanitize_text_field(
				wp_unslash( $_POST['nonce'] )
			),
			'rae_recaptcha_test'
		)
		) {
			wp_die( 'Security check failed' );
		}

		// Check permissions
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Insufficient permissions' );
		}

		if ( ! isset( $_POST['key_type'] ) ) {
			wp_die( 'Missing key_type parameter' );
		}
		$key_type = sanitize_text_field( wp_unslash( $_POST['key_type'] ) );

		// Get current options
		$options = get_option( self::OPTION_NAME, $this->get_default_options() );

		// For site key testing, we just validate format
		if ( 'site' === $key_type ) {
			$site_key = $options['v3_site_key'];

			if ( empty( $site_key ) ) {
				wp_send_json_error( 'Site key is empty' );
			}

			if ( ! preg_match( '/^6L[a-zA-Z0-9_-]{38}$/', $site_key ) ) {
				wp_send_json_error( 'Invalid site key format' );
			}

			wp_send_json_success( 'Site key format is valid' );
		}

		// For secret key testing, we can't test without a valid token
		// So we'll just validate format and provide guidance
		$secret_key = $options['v3_secret_key'];

		if ( empty( $secret_key ) ) {
			wp_send_json_error( 'Secret key is empty' );
		}

		if ( ! preg_match( '/^6L[a-zA-Z0-9_-]{38}$/', $secret_key ) ) {
			wp_send_json_error( 'Invalid secret key format' );
		}

		wp_send_json_success( 'Configuration appears valid. Test with actual form submission to verify functionality.' );
	}

	/**
	 * Get default options
	 */
	private function get_default_options(): array {
		return array(
			'enabled'        => false,
			'v3_site_key'    => '',
			'v3_secret_key'  => '',
			'threshold'      => self::DEFAULT_THRESHOLD,
			'badge_position' => 'bottomright',
		);
	}

	/**
	 * Get admin CSS styles
	 */
	private function get_admin_styles(): string {
		return '
            .test-connection {
                margin-left: 10px;
            }

            .test-result {
                margin-top: 10px;
                padding: 10px;
                border-radius: 3px;
                font-weight: bold;
            }

            .test-result.success {
                background-color: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }

            .test-result.error {
                background-color: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }

            .test-result.loading {
                background-color: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }

            #threshold-slider {
                width: 200px;
                margin-right: 10px;
            }

            #threshold-value {
                font-weight: bold;
                background: #f1f1f1;
                padding: 2px 8px;
                border-radius: 3px;
                min-width: 30px;
                display: inline-block;
                text-align: center;
            }

            .rae-recaptcha-section {
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 20px;
                margin: 20px 0;
                background: #fafafa;
            }

            .rae-recaptcha-section h3 {
                margin-top: 0;
                color: #0073aa;
            }

            .form-table th {
                width: 200px;
            }

            .regular-text {
                width: 300px;
            }

            input[type="password"] {
                background-repeat: no-repeat;
                background-position: right 8px center;
                padding-right: 30px;
            }
        ';
	}

	/**
	 * Get admin JavaScript
	 */
	private function get_admin_javascript(): string {
		return '
            jQuery(document).ready(function($) {
                // Connection testing
                $(".test-connection").on("click", function() {
                    const $button = $(this);
                    const version = $button.data("version");
                    const keyType = $button.data("key-type");
                    const $result = $("#" + version + "-test-result");
                    
                    $button.prop("disabled", true);
                    $result.show()
                           .removeClass("success error")
                           .addClass("loading")
                           .html("Testing connection...");
                    
                    $.post(raeRecaptchaAjax.ajaxurl, {
                        action: "test_recaptcha_connection",
                        version: version,
                        key_type: keyType,
                        nonce: raeRecaptchaAjax.nonce
                    })
                    .done(function(response) {
                        if (response.success) {
                            $result.removeClass("loading error")
                                   .addClass("success")
                                   .html("✓ " + response.data);
                        } else {
                            $result.removeClass("loading success")
                                   .addClass("error")
                                   .html("✗ " + response.data);
                        }
                    })
                    .fail(function() {
                        $result.removeClass("loading success")
                               .addClass("error")
                               .html("✗ Connection test failed");
                    })
                    .always(function() {
                        $button.prop("disabled", false);
                    });
                });

                // Threshold slider
                $("#threshold-slider").on("input", function() {
                    $("#threshold-value").text($(this).val());
                });
                
                // Update threshold value on page load
                const currentThreshold = $("#threshold-slider").val();
                $("#threshold-value").text(currentThreshold);

                // Form validation
                $("form").on("submit", function(e) {
                    const enabled = $("input[name=\'" + "' . esc_js( self::OPTION_NAME ) . '[enabled]\']").is(":checked");
                    
                    if (enabled) {
                        const v3SiteKey = $("input[name=\'" + "' . esc_js( self::OPTION_NAME ) . '[v3_site_key]\']").val();
                        const v3SecretKey = $("input[name=\'" + "' . esc_js( self::OPTION_NAME ) . '[v3_secret_key]\']").val();
                        
                        if (!v3SiteKey || !v3SecretKey) {
                            alert("reCAPTCHA v3 Site Key and Secret Key are required when protection is enabled.");
                            e.preventDefault();
                            return false;
                        }
                    }
                });
            });
        ';
	}

	/**
	 * Get current settings for external use
	 */
	public static function get_settings() {
		return get_option(
			self::OPTION_NAME,
			array(
				'enabled'        => false,
				'v3_site_key'    => '',
				'v3_secret_key'  => '',
				'threshold'      => self::DEFAULT_THRESHOLD,
				'badge_position' => 'bottomright',
			)
		);
	}

	/**
	 * Check if reCAPTCHA is enabled and properly configured
	 */
	public static function is_enabled(): bool {
		$settings = self::get_settings();
		return $settings['enabled'] &&
				! empty( $settings['v3_site_key'] ) &&
				! empty( $settings['v3_secret_key'] );
	}


	/**
	 * Get threshold for external use
	 */
	public static function get_threshold(): float {
		$settings = self::get_settings();
		return floatval( $settings['threshold'] );
	}
}