<?php
/**
 * Contact API Class
 * Handles contact form submissions with reCAPTCHA verification and AWS Lambda integration
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Contact API Class
 *
 * Provides REST API endpoint for contact form submissions.
 * Handles validation, reCAPTCHA verification, and triggers AWS Lambda for email processing.
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */
class RAE_Contact_API extends RAE_API_Base {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the API routes
	 */
	public function register_routes(): void {
		register_rest_route(
			'wp/v2',
			'/contact',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'submit_contact_form' ),
					'permission_callback' => array( $this, 'contact_permission_callback' ),
					'args'                => $this->get_contact_form_args(),
				),
			)
		);

		register_rest_route(
			'wp/v2',
			'/contact/status',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_contact_status' ),
					'permission_callback' => array( $this, 'public_permission_callback' ),
				),
			)
		);
	}

	/**
	 * Handle contact form submission
	 *
	 * @param WP_REST_Request $request The REST request object
	 *
	 * @return WP_REST_Response|WP_Error Response object
	 */
	public function submit_contact_form( $request ) {
		try {
			// Get and validate form data
			$form_data = $this->validate_contact_data( $request );
			if ( is_wp_error( $form_data ) ) {
				return $form_data;
			}

			// Verify reCAPTCHA token
			$recaptcha_result = $this->verify_recaptcha_token( $form_data['recaptcha_token'] );
			if ( is_wp_error( $recaptcha_result ) ) {
				return $recaptcha_result;
			}

			// Check if contact form is enabled
			$contact_enabled = get_option( 'rae_contact_enabled', true );
			if ( ! $contact_enabled ) {
				return new WP_Error(
					'contact_disabled',
					'Contact form is currently disabled.',
					array( 'status' => 503 )
				);
			}

			// Prepare contact submission data
			$submission_data = array(
				'name'            => $form_data['name'],
				'email'           => $form_data['email'],
				'subject'         => $form_data['subject'],
				'message'         => $form_data['message'],
				'timestamp'       => current_time( 'c' ),
				'ip_address'      => $this->get_client_ip(),
				'user_agent'      => $this->get_user_agent(),
				'recaptcha_score' => $recaptcha_result['score'] ?? null,
			);

			// Send to AWS Lambda for email processing
			$lambda_result = $this->send_to_lambda( $submission_data );
			if ( is_wp_error( $lambda_result ) ) {
				if ( WP_DEBUG ) {
					// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
					error_log( 'Contact form Lambda error: ' . $lambda_result->get_error_message() );
				}

				return new WP_Error(
					'submission_failed',
					'Failed to process contact form submission. Please try again later.',
					array( 'status' => 500 )
				);
			}

			if ( WP_DEBUG ) {
				// Log successful submission (for debugging)
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log(
					sprintf(
						'Contact form submission successful: %s <%s> - %s',
						$form_data['name'],
						$form_data['email'],
						$form_data['subject']
					)
				);
			}

			return rest_ensure_response(
				array(
					'success' => true,
					'message' => 'Your message has been sent successfully. Thank you for contacting me!',
					'data'    => array(
						'submission_id' => uniqid( 'contact_', true ),
						'timestamp'     => $submission_data['timestamp'],
					),
				)
			);

		} catch ( Exception $e ) {
			if ( WP_DEBUG ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( 'Contact form submission exception: ' . $e->getMessage() );
			}
			return new WP_Error(
				'internal_error',
				'An internal error occurred. Please try again later.',
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Get contact form status
	 *
	 * @param WP_REST_Request $request The REST request object
	 *
	 * @return WP_REST_Response Response object
	 */
	public function get_contact_status( $request ) {
		$contact_enabled = get_option( 'rae_contact_enabled', true );
		$lambda_endpoint = get_option( 'rae_contact_lambda_endpoint', '' );

		return rest_ensure_response(
			array(
				'enabled'           => $contact_enabled,
				'lambda_configured' => ! empty( $lambda_endpoint ),
				'recaptcha_enabled' => get_option( 'rae_recaptcha_enabled', false ),
			)
		);
	}

	/**
	 * Validate contact form data
	 *
	 * @param WP_REST_Request $request The REST request object
	 *
	 * @return array|WP_Error Validated data or error
	 */
	private function validate_contact_data( $request ) {
		$errors = array();

		// Name validation
		$name = sanitize_text_field( $request->get_param( 'name' ) );
		if ( empty( $name ) || strlen( $name ) < 2 ) {
			$errors['name'] = 'Name must be at least 2 characters long.';
		}

		// Email validation
		$email = sanitize_email( $request->get_param( 'email' ) );
		if ( empty( $email ) || ! is_email( $email ) ) {
			$errors['email'] = 'Please enter a valid email address.';
		}

		// Subject validation
		$subject = sanitize_text_field( $request->get_param( 'subject' ) );
		if ( empty( $subject ) || strlen( $subject ) < 3 ) {
			$errors['subject'] = 'Subject must be at least 3 characters long.';
		}

		// Message validation
		$message = sanitize_textarea_field( $request->get_param( 'message' ) );
		if ( empty( $message ) || strlen( $message ) < 10 ) {
			$errors['message'] = 'Message must be at least 10 characters long.';
		}

		// reCAPTCHA token validation
		$recaptcha_token = sanitize_text_field( $request->get_param( 'recaptcha_token' ) );
		if ( empty( $recaptcha_token ) ) {
			$errors['recaptcha_token'] = 'reCAPTCHA verification is required.';
		}

		// Return errors if any
		if ( ! empty( $errors ) ) {
			return new WP_Error(
				'validation_failed',
				'Form validation failed.',
				array(
					'status' => 400,
					'errors' => $errors,
				)
			);
		}

		return array(
			'name'            => $name,
			'email'           => $email,
			'subject'         => $subject,
			'message'         => $message,
			'recaptcha_token' => $recaptcha_token,
		);
	}

	/**
	 * Verify reCAPTCHA token using existing verification system
	 *
	 * @param string $token The reCAPTCHA token
	 *
	 * @return array|WP_Error Verification result or error
	 */
	private function verify_recaptcha_token( $token ) {
		// Check if reCAPTCHA API exists
		if ( ! class_exists( 'RAE_ReCaptcha_API' ) ) {
			return new WP_Error(
				'recaptcha_unavailable',
				'reCAPTCHA verification service is not available.',
				array( 'status' => 503 )
			);
		}

		// Create reCAPTCHA API instance and verify token
		$recaptcha_api = new RAE_ReCaptcha_API();

		// Use the existing verify_token method for contact_form action
		$fake_request = new WP_REST_Request( 'POST', '/wp/v2/recaptcha/verify' );
		$fake_request->set_param( 'token', $token );
		$fake_request->set_param( 'action', 'contact_form' );

		$result = $recaptcha_api->verify_v3_token( $fake_request );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// Extract verification data
		$response_data = $result->get_data();
		if ( ! $response_data['success'] ) {
			return new WP_Error(
				'recaptcha_failed',
				'reCAPTCHA verification failed. Please try again.',
				array( 'status' => 400 )
			);
		}

		return $response_data;
	}

	/**
	 * Send contact data to AWS Lambda for email processing
	 *
	 * @param array $data Contact submission data
	 *
	 * @return array|WP_Error Lambda response or error
	 */
	private function send_to_lambda( $data ) {
		$lambda_endpoint = get_option( 'rae_contact_lambda_endpoint', '' );
		$lambda_api_key  = get_option( 'rae_contact_lambda_api_key', '' );

		// For local development, skip Lambda and simulate success
		if ( empty( $lambda_endpoint ) || strpos( home_url(), 'localhost' ) !== false ) {
			if ( WP_DEBUG ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( 'Contact form: Lambda endpoint not configured or running on localhost.' );
			}

			return array(
				'success'   => true,
				'message'   => 'Local development: Contact form would be sent via AWS Lambda',
				'messageId' => 'local-dev-' . uniqid(),
			);
		}

		// Prepare request data
		$request_data = array(
			'source'    => 'wordpress',
			'site_url'  => home_url(),
			'timestamp' => current_time( 'c' ),
			'contact'   => $data,
		);

		// Prepare request headers
		$headers = array(
			'Content-Type' => 'application/json',
			'User-Agent'   => 'RAE-Portfolio-Contact/1.0',
		);

		// Add API key if configured
		if ( ! empty( $lambda_api_key ) ) {
			$headers['X-API-Key'] = $lambda_api_key;
		}

		// Make HTTP request to Lambda
		$response = wp_remote_post(
			$lambda_endpoint,
			array(
				'timeout' => 30,
				'headers' => $headers,
				'body'    => wp_json_encode( $request_data ),
			)
		);

		// Check for HTTP errors
		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'lambda_request_failed',
				'Failed to send contact form to processing service: ' . $response->get_error_message(),
				array( 'status' => 500 )
			);
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		$response_body = wp_remote_retrieve_body( $response );

		// Check response status
		if ( $response_code < 200 || $response_code >= 300 ) {
			return new WP_Error(
				'lambda_processing_failed',
				sprintf( 'Contact form processing failed with status %d', $response_code ),
				array( 'status' => 500 )
			);
		}

		// Parse response
		$lambda_data = json_decode( $response_body, true );
		if ( null === $lambda_data ) {
			return new WP_Error(
				'lambda_invalid_response',
				'Invalid response from contact form processing service',
				array( 'status' => 500 )
			);
		}

		return $lambda_data;
	}

	/**
	 * Get client IP address
	 *
	 * @return string Client IP address
	 */
	private function get_client_ip(): string {
		// Check for shared internet/proxy
		if ( ! empty( $_SERVER['HTTP_CLIENT_IP'] ) ) {
			return sanitize_text_field( wp_unslash( $_SERVER['HTTP_CLIENT_IP'] ) );
		}
		// Check for IP passed from proxy
		if ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
			// Can contain multiple IPs, get the first one
			$ips = explode( ',', sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) );
			return trim( $ips[0] );
		}
		// Check for IP from remote address
		if ( ! empty( $_SERVER['REMOTE_ADDR'] ) ) {
			return sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) );
		}

		return 'unknown';
	}

	/**
	 * Get user agent
	 *
	 * @return string User agent string
	 */
	private function get_user_agent(): string {
		return ! empty( $_SERVER['HTTP_USER_AGENT'] )
			? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) )
			: 'unknown';
	}

	/**
	 * Permission callback for contact form submission
	 */
	public function contact_permission_callback(): bool {
		// Allow public access but could add rate limiting here
		return true;
	}

	/**
	 * Get contact form argument schema
	 *
	 * @return array Argument schema
	 */
	private function get_contact_form_args(): array {
		return array(
			'name'            => array(
				'required'          => true,
				'type'              => 'string',
				'description'       => 'Contact name',
				'sanitize_callback' => 'sanitize_text_field',
				'validate_callback' => function ( $param ) {
					return ! empty( $param ) && strlen( $param ) >= 2;
				},
			),
			'email'           => array(
				'required'          => true,
				'type'              => 'string',
				'format'            => 'email',
				'description'       => 'Contact email address',
				'sanitize_callback' => 'sanitize_email',
				'validate_callback' => function ( $param ) {
					return ! empty( $param ) && is_email( $param );
				},
			),
			'subject'         => array(
				'required'          => true,
				'type'              => 'string',
				'description'       => 'Message subject',
				'sanitize_callback' => 'sanitize_text_field',
				'validate_callback' => function ( $param ) {
					return ! empty( $param ) && strlen( $param ) >= 3;
				},
			),
			'message'         => array(
				'required'          => true,
				'type'              => 'string',
				'description'       => 'Contact message',
				'sanitize_callback' => 'sanitize_textarea_field',
				'validate_callback' => function ( $param ) {
					return ! empty( $param ) && strlen( $param ) >= 10;
				},
			),
			'recaptcha_token' => array(
				'required'          => true,
				'type'              => 'string',
				'description'       => 'reCAPTCHA verification token',
				'sanitize_callback' => 'sanitize_text_field',
				'validate_callback' => function ( $param ) {
					return ! empty( $param );
				},
			),
		);
	}
}
