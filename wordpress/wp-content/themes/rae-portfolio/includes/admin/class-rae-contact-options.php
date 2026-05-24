<?php
/**
 * Contact Form Options
 * WordPress admin settings page for managing contact form configuration and AWS Lambda integration
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * RAE Contact Options
 *
 * Provides an admin settings page for configuring contact form settings and AWS Lambda integration.
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */
class RAE_Contact_Options {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'add_options_page' ) );
		add_action( 'admin_init', array( $this, 'init_settings' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
		add_action( 'wp_ajax_test_contact_lambda', array( $this, 'test_lambda_ajax' ) );
	}

	/**
	 * Add contact options page to WordPress admin
	 */
	public function add_options_page(): void {
		add_options_page(
			'Contact Form Settings',           // Page title
			'Contact Form Settings',           // Menu title
			'manage_options',                  // Capability
			'rae-contact-options',            // Menu slug
			array( $this, 'options_page_callback' ) // Callback
		);
	}

	/**
	 * Initialize settings using WordPress Settings API
	 */
	public function init_settings(): void {
		// General settings section
		add_settings_section(
			'rae_contact_general',
			'General Contact Form Settings',
			array( $this, 'general_settings_section_callback' ),
			'rae-contact-options'
		);

		// Enable/disable contact form
		add_settings_field(
			'rae_contact_enabled',
			'Enable Contact Form',
			array( $this, 'enabled_callback' ),
			'rae-contact-options',
			'rae_contact_general'
		);

		register_setting(
			'rae_contact_general_group',
			'rae_contact_enabled',
			array(
				'type'              => 'boolean',
				'description'       => 'Enable or disable the contact form',
				'sanitize_callback' => array( $this, 'sanitize_checkbox' ),
				'default'           => true,
			)
		);

		// Recipient email
		add_settings_field(
			'rae_contact_recipient_email',
			'Recipient Email',
			array( $this, 'recipient_email_callback' ),
			'rae-contact-options',
			'rae_contact_general'
		);

		register_setting(
			'rae_contact_general_group',
			'rae_contact_recipient_email',
			array(
				'type'              => 'string',
				'description'       => 'Email address to receive contact form submissions',
				'sanitize_callback' => 'sanitize_email',
			)
		);

		// AWS Lambda settings section
		add_settings_section(
			'rae_contact_lambda',
			'AWS Lambda Integration',
			array( $this, 'lambda_settings_section_callback' ),
			'rae-contact-options'
		);

		// Lambda endpoint URL
		add_settings_field(
			'rae_contact_lambda_endpoint',
			'Lambda Endpoint URL',
			array( $this, 'lambda_endpoint_callback' ),
			'rae-contact-options',
			'rae_contact_lambda'
		);

		register_setting(
			'rae_contact_lambda_group',
			'rae_contact_lambda_endpoint',
			array(
				'type'              => 'string',
				'description'       => 'AWS Lambda function endpoint for email processing',
				'sanitize_callback' => 'esc_url_raw',
			)
		);

		// Lambda API key
		add_settings_field(
			'rae_contact_lambda_api_key',
			'Lambda API Key',
			array( $this, 'lambda_api_key_callback' ),
			'rae-contact-options',
			'rae_contact_lambda'
		);

		register_setting(
			'rae_contact_lambda_group',
			'rae_contact_lambda_api_key',
			array(
				'type'              => 'string',
				'description'       => 'API key for authenticating with Lambda function',
				'sanitize_callback' => 'sanitize_text_field',
			)
		);

		// Email settings section
		add_settings_section(
			'rae_contact_email',
			'Email Configuration',
			array( $this, 'email_settings_section_callback' ),
			'rae-contact-options'
		);

		// From name
		add_settings_field(
			'rae_contact_from_name',
			'From Name',
			array( $this, 'from_name_callback' ),
			'rae-contact-options',
			'rae_contact_email'
		);

		register_setting(
			'rae_contact_email_group',
			'rae_contact_from_name',
			array(
				'type'              => 'string',
				'description'       => 'Name to appear as sender in emails',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => 'RAE Portfolio Contact Form',
			)
		);

		// Email subject prefix
		add_settings_field(
			'rae_contact_subject_prefix',
			'Subject Prefix',
			array( $this, 'subject_prefix_callback' ),
			'rae-contact-options',
			'rae_contact_email'
		);

		register_setting(
			'rae_contact_email_group',
			'rae_contact_subject_prefix',
			array(
				'type'              => 'string',
				'description'       => 'Prefix to add to email subjects',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => '[Portfolio Contact]',
			)
		);
	}

	/**
	 * Enqueue admin scripts and styles
	 *
	 * @param string $hook_suffix The current admin page hook suffix
	 */
	public function enqueue_admin_scripts( $hook_suffix ): void {
		// Only load on our settings page
		if ( 'settings_page_rae-contact-options' !== $hook_suffix ) {
			return;
		}

		wp_enqueue_script(
			'rae-contact-admin',
			get_template_directory_uri() . '/assets/js/contact-admin.js',
			array( 'jquery' ),
			'1.0.0',
			true
		);

		wp_localize_script(
			'rae-contact-admin',
			'raeContactAdmin',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'rae_contact_admin_nonce' ),
				'strings' => array(
					'testing'     => 'Testing connection...',
					'testSuccess' => 'Connection test successful!',
					'testFailed'  => 'Connection test failed: ',
					'testError'   => 'Error testing connection',
				),
			)
		);
	}

	/**
	 * Options page callback
	 */
	public function options_page_callback(): void {
		// Check user capabilities
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		// Display notices
		settings_errors( 'rae_contact_messages' );

		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

			<div class="notice notice-info">
				<p><strong>Contact Form Integration</strong></p>
				<p>Configure the contact form to send emails via AWS Lambda and SNS.
					The contact form uses your existing reCAPTCHA v3 configuration for spam protection.
				</p>
			</div>

			<form action="options.php" method="post">
				<?php
				settings_fields( 'rae_contact_general_group' );
				do_settings_sections( 'rae-contact-options' );
				submit_button( 'Save Contact Settings' );
				?>
			</form>

			<?php $this->display_status_section(); ?>
		</div>
		<?php
	}

	/**
	 * Display contact form status section
	 */
	private function display_status_section(): void {
		$contact_enabled   = get_option( 'rae_contact_enabled', true );
		$lambda_endpoint   = get_option( 'rae_contact_lambda_endpoint', '' );
		$recipient_email   = get_option( 'rae_contact_recipient_email', '' );
		$recaptcha_enabled = get_option( 'rae_recaptcha_enabled', false );

		?>
		<div class="card">
			<h2>Contact Form Status</h2>
			<table class="form-table">
				<tr>
					<th>Contact Form</th>
					<td>
						<span class="dashicons dashicons-<?php echo $contact_enabled ? 'yes-alt' : 'dismiss'; ?>"></span>
						<?php echo $contact_enabled ? 'Enabled' : 'Disabled'; ?>
					</td>
				</tr>
				<tr>
					<th>Lambda Integration</th>
					<td>
						<span class="dashicons dashicons-<?php echo ! empty( $lambda_endpoint ) ? 'yes-alt' : 'warning'; ?>"></span>
						<?php echo ! empty( $lambda_endpoint ) ? 'Configured' : 'Not Configured'; ?>
						<?php if ( ! empty( $lambda_endpoint ) ) : ?>
							<button type="button" id="test-lambda-connection" class="button button-secondary" style="margin-left: 10px;">
								Test Connection
							</button>
							<span id="test-lambda-result"></span>
						<?php endif; ?>
					</td>
				</tr>
				<tr>
					<th>Recipient Email</th>
					<td>
						<span class="dashicons dashicons-<?php echo ! empty( $recipient_email ) ? 'yes-alt' : 'warning'; ?>"></span>
						<?php echo ! empty( $recipient_email ) ? esc_html( $recipient_email ) : 'Not Set'; ?>
					</td>
				</tr>
				<tr>
					<th>reCAPTCHA Protection</th>
					<td>
						<span class="dashicons dashicons-<?php echo $recaptcha_enabled ? 'yes-alt' : 'warning'; ?>"></span>
						<?php echo $recaptcha_enabled ? 'Enabled' : 'Disabled'; ?>
						<?php if ( ! $recaptcha_enabled ) : ?>
							<a href="
							<?php
							echo esc_url(
								admin_url( 'options-general.php?page=rae-recaptcha-options' )
							);
							?>
							" class="button button-secondary" style="margin-left: 10px;">
								Configure reCAPTCHA
							</a>
						<?php endif; ?>
					</td>
				</tr>
			</table>
		</div>

		<div class="card">
			<h2>API Endpoint Information</h2>
			<p><strong>Contact Form Submission:</strong> <code><?php echo esc_html( home_url( '/?rest_route=/wp/v2/contact' ) ); ?></code></p>
			<p><strong>Contact Status Check:</strong> <code><?php echo esc_html( home_url( '/?rest_route=/wp/v2/contact/status' ) ); ?></code></p>
			<p><em>These endpoints are used by the frontend React application to submit contact forms.</em></p>
		</div>
		<?php
	}

	/**
	 * General settings section callback
	 */
	public function general_settings_section_callback(): void {
		echo '<p>Configure basic contact form settings and recipient information.</p>';
	}

	/**
	 * Lambda settings section callback
	 */
	public function lambda_settings_section_callback(): void {
		echo '<p>Configure AWS Lambda integration for email processing. The Lambda function will receive contact form data and send emails via SNS.</p>';
	}

	/**
	 * Email settings section callback
	 */
	public function email_settings_section_callback(): void {
		echo '<p>Configure email formatting and delivery settings.</p>';
	}

	/**
	 * Enable/disable contact form callback
	 */
	public function enabled_callback(): void {
		$enabled = get_option( 'rae_contact_enabled', true );
		echo '<input type="checkbox" id="rae_contact_enabled" name="rae_contact_enabled" value="1" ' . checked( 1, $enabled, false ) . ' />';
		echo '<label for="rae_contact_enabled">Enable contact form submissions</label>';
		echo '<p class="description">When disabled, the contact form will show a maintenance message.</p>';
	}

	/**
	 * Recipient email callback
	 */
	public function recipient_email_callback(): void {
		$email = get_option( 'rae_contact_recipient_email', '' );
        // phpcs:ignore Generic.Files.LineLength.TooLong
		echo '<input type="email" id="rae_contact_recipient_email" name="rae_contact_recipient_email" value="' . esc_attr( $email ) . '" class="regular-text" required />';
		echo '<p class="description">Email address where contact form submissions will be sent.</p>';
	}

	/**
	 * Lambda endpoint callback
	 */
	public function lambda_endpoint_callback(): void {
		$endpoint = get_option( 'rae_contact_lambda_endpoint', '' );
        // phpcs:ignore Generic.Files.LineLength.TooLong
		echo '<input type="url" id="rae_contact_lambda_endpoint" name="rae_contact_lambda_endpoint" value="' . esc_attr( $endpoint ) . '" class="regular-text" />';
		echo '<p class="description">AWS Lambda function URL or API Gateway endpoint for processing contact forms.</p>';
		echo '<p class="description"><strong>Example:</strong> <code>https://abc123.lambda-url.us-east-1.on.aws/</code></p>';
	}

	/**
	 * Lambda API key callback
	 */
	public function lambda_api_key_callback(): void {
		$api_key    = get_option( 'rae_contact_lambda_api_key', '' );
		$masked_key = ! empty( $api_key ) ? str_repeat( '*', strlen( $api_key ) - 4 ) . substr( $api_key, -4 ) : '';

        // phpcs:ignore Generic.Files.LineLength.MaxExceeded
		echo '<input type="password" id="rae_contact_lambda_api_key" name="rae_contact_lambda_api_key" value="' . esc_attr( $api_key ) . '" class="regular-text" autocomplete="new-password" />';
		if ( ! empty( $masked_key ) ) {
			echo '<p class="description">Current key: <code>' . esc_html( $masked_key ) . '</code></p>';
		}
		echo '<p class="description">Optional API key for securing Lambda requests. Leave blank if using AWS IAM authentication.</p>';
	}

	/**
	 * From name callback
	 */
	public function from_name_callback(): void {
		$from_name = get_option( 'rae_contact_from_name', 'RAE Portfolio Contact Form' );
		echo '<input type="text" id="rae_contact_from_name" name="rae_contact_from_name" value="' . esc_attr( $from_name ) . '" class="regular-text" />';
		echo '<p class="description">Name that appears as the sender in email notifications.</p>';
	}

	/**
	 * Subject prefix callback
	 */
	public function subject_prefix_callback(): void {
		$prefix = get_option( 'rae_contact_subject_prefix', '[Portfolio Contact]' );
        // phpcs:ignore Generic.Files.LineLength.TooLong
		echo '<input type="text" id="rae_contact_subject_prefix" name="rae_contact_subject_prefix" value="' . esc_attr( $prefix ) . '" class="regular-text" />';
		echo '<p class="description">Text to prepend to email subjects (e.g., [Portfolio Contact]).</p>';
	}

	/**
	 * Test Lambda connection via AJAX
	 */
	public function test_lambda_ajax(): void {
		// Verify nonce
		check_ajax_referer( 'rae_contact_admin_nonce', 'nonce' );

		// Check permissions
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Insufficient permissions' );
		}

		$lambda_endpoint = get_option( 'rae_contact_lambda_endpoint', '' );
		$lambda_api_key  = get_option( 'rae_contact_lambda_api_key', '' );

		if ( empty( $lambda_endpoint ) ) {
			wp_send_json_error( 'Lambda endpoint not configured' );
		}

		// Prepare test request
		$test_data = array(
			'source'    => 'wordpress_test',
			'site_url'  => home_url(),
			'timestamp' => current_time( 'c' ),
			'test'      => true,
			'contact'   => array(
				'name'    => 'Test User',
				'email'   => 'test@example.com',
				'subject' => 'Connection Test',
				'message' => 'This is a test message to verify Lambda connectivity.',
			),
		);

		$headers = array(
			'Content-Type' => 'application/json',
			'User-Agent'   => 'RAE-Portfolio-Contact-Test/1.0',
		);

		if ( ! empty( $lambda_api_key ) ) {
			$headers['X-API-Key'] = $lambda_api_key;
		}

		// Make test request
		$response = wp_remote_post(
			$lambda_endpoint,
			array(
				'timeout' => 15,
				'headers' => $headers,
				'body'    => wp_json_encode( $test_data ),
			)
		);

		if ( is_wp_error( $response ) ) {
			wp_send_json_error( $response->get_error_message() );
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		$response_body = wp_remote_retrieve_body( $response );

		if ( $response_code < 200 || $response_code >= 300 ) {
			wp_send_json_error( "HTTP {$response_code}: " . $response_body );
		}

		wp_send_json_success( 'Lambda connection successful' );
	}

	/**
	 * Sanitize checkbox value
	 *
	 * @param mixed $input Checkbox input
	 * @return bool Sanitized boolean value
	 */
	public function sanitize_checkbox( $input ): bool {
		return ! empty( $input );
	}
}