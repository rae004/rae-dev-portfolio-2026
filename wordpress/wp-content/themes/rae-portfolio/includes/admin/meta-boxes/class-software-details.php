<?php
/**
 * Software Project Details Meta Box
 * Handles project details fields: Release Date, Demo Link, Repository Link, Project State, and Skill Categories
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class RAE_Software_Details_Meta_Box {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'add_meta_boxes', array( $this, 'add_meta_box' ) );
		add_action( 'save_post', array( $this, 'save_meta_data' ) );
	}

	/**
	 * Add software project details meta box
	 */
	public function add_meta_box(): void {
		add_meta_box(
			'rae_software_project_details',
			'Project Details',
			array( $this, 'meta_box_callback' ),
			'software-project',
			'normal',
			'high'
		);
	}

	/**
	 * Software project details meta box callback
	 */
	public function meta_box_callback( $post ): void {
		// Add nonce for security
		wp_nonce_field( 'rae_software_project_details_nonce', 'rae_software_project_details_nonce_field' );

		// Get current values
		$release_date    = get_post_meta( $post->ID, '_software_project_release_date', true );
		$demo_link       = get_post_meta( $post->ID, '_software_project_demo_link', true );
		$repo_link       = get_post_meta( $post->ID, '_software_project_repo_link', true );
		$project_state   = get_post_meta( $post->ID, '_software_project_state', true );
		$tech_categories = get_post_meta( $post->ID, '_software_project_tech_categories', true );

		if ( ! is_array( $tech_categories ) ) {
			$tech_categories = array();
		}

		// Get all available skill categories
		$skill_categories = $this->get_skill_categories();

		$this->render_details_interface( $release_date, $demo_link, $repo_link, $project_state, $tech_categories, $skill_categories );
	}

	/**
	 * Get all available skill categories
	 */
	private function get_skill_categories(): array {
		$categories = array();

		$args = array(
			'post_type'      => 'skill',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'meta_query'     => array(
				array(
					'key'     => '_skill_type',
					'compare' => 'EXISTS',
				),
			),
		);

		$skills_query = new WP_Query( $args );

		if ( $skills_query->have_posts() ) {
			while ( $skills_query->have_posts() ) {
				$skills_query->the_post();
				$skill_type = get_post_meta( get_the_ID(), '_skill_type', true );
				if ( $skill_type && ! in_array( $skill_type, $categories ) ) {
					$categories[] = $skill_type;
				}
			}
		}
		wp_reset_postdata();

		sort( $categories );
		return $categories;
	}

	/**
	 * Render the project details interface
	 */
	private function render_details_interface( $release_date, $demo_link, $repo_link, $project_state, $tech_categories, $skill_categories ): void {
		?>
		<div class="rae-software-details-fields">
			<table class="form-table">
				<tbody>
					<!-- Project Release Date -->
					<tr>
						<th scope="row">
							<label for="software_project_release_date">Project Release Date</label>
						</th>
						<td>
							<input type="date" 
									id="software_project_release_date" 
									name="software_project_release_date" 
									value="<?php echo esc_attr( $release_date ); ?>" 
									class="regular-text" />
							<p class="description">When was this project released or completed?</p>
						</td>
					</tr>
					
					<!-- Project Demo Link -->
					<tr>
						<th scope="row">
							<label for="software_project_demo_link">Project Demo Link</label>
						</th>
						<td>
							<input type="url" 
									id="software_project_demo_link" 
									name="software_project_demo_link" 
									value="<?php echo esc_attr( $demo_link ); ?>" 
									class="regular-text" 
									placeholder="https://demo.example.com" />
							<p class="description">URL to live demo or deployed version of the project</p>
						</td>
					</tr>
					
					<!-- Project Repository Link -->
					<tr>
						<th scope="row">
							<label for="software_project_repo_link">Project Repository Link</label>
						</th>
						<td>
							<input type="url" 
									id="software_project_repo_link" 
									name="software_project_repo_link" 
									value="<?php echo esc_attr( $repo_link ); ?>" 
									class="regular-text" 
									placeholder="https://github.com/username/project" />
							<p class="description">URL to source code repository (GitHub, GitLab, etc.)</p>
						</td>
					</tr>
					
					<!-- Project State -->
					<tr>
						<th scope="row">
							<label for="software_project_state">Project State</label>
						</th>
						<td>
							<select id="software_project_state" name="software_project_state" class="regular-text">
								<option value="">Select State</option>
								<option value="Ongoing" <?php selected( $project_state, 'Ongoing' ); ?>>Ongoing</option>
								<option value="Future" <?php selected( $project_state, 'Future' ); ?>>Future</option>
								<option value="Completed" <?php selected( $project_state, 'Completed' ); ?>>Completed</option>
							</select>
							<p class="description">Current development state of the project</p>
						</td>
					</tr>
					
					<!-- Technology Categories for Card Display -->
					<tr>
						<th scope="row">
							<label>Technologies for Card Display</label>
						</th>
						<td>
							<div class="tech-categories-selection" style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 15px; background: #f9f9f9;">
								<?php if ( ! empty( $skill_categories ) ) : ?>
									<p class="description" style="margin-top: 0;">
										Select which skill categories should appear in the "Technologies:" section on project cards. 
										Skills will be sorted by weight (descending) within selected categories.
									</p>
									
									<div class="categories-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-top: 15px;">
										<?php foreach ( $skill_categories as $category ) : ?>
											<label class="category-checkbox-label" style="display: flex; align-items: center; padding: 8px; border: 1px solid #ddd; border-radius: 3px; background: white; cursor: pointer;">
												<input type="checkbox" 
														name="software_project_tech_categories[]" 
														value="<?php echo esc_attr( $category ); ?>"
														<?php checked( in_array( $category, $tech_categories ) ); ?>
														style="margin-right: 8px;" />
												<span class="category-name"><?php echo esc_html( $category ); ?></span>
											</label>
										<?php endforeach; ?>
									</div>
									
									<div class="category-controls" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
										<button type="button" id="select-all-categories" class="button button-secondary" style="margin-right: 10px;">
											Select All
										</button>
										<button type="button" id="deselect-all-categories" class="button button-secondary">
											Deselect All
										</button>
									</div>
								<?php else : ?>
									<p style="text-align: center; color: #666; font-style: italic;">
										No skill categories found. <a href="<?php echo admin_url( 'post-new.php?post_type=skill' ); ?>">Create some skills</a> first.
									</p>
								<?php endif; ?>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		
		<?php $this->add_scripts_and_styles(); ?>
		<?php
	}

	/**
	 * Add scripts and styles
	 */
	private function add_scripts_and_styles() {
		?>
		<script type="text/javascript">
			jQuery(document).ready(function($) {
				// Select All Categories
				$('#select-all-categories').on('click', function(e) {
					e.preventDefault();
					$('.tech-categories-selection input[type="checkbox"]').prop('checked', true);
					updateCategoryHighlighting();
				});
				
				// Deselect All Categories
				$('#deselect-all-categories').on('click', function(e) {
					e.preventDefault();
					$('.tech-categories-selection input[type="checkbox"]').prop('checked', false);
					updateCategoryHighlighting();
				});
				
				// Category checkbox change handler
				$('.tech-categories-selection input[type="checkbox"]').on('change', function() {
					updateCategoryHighlighting();
				});
				
				// URL validation
				$('#software_project_demo_link, #software_project_repo_link').on('blur', function() {
					const $input = $(this);
					const value = $input.val().trim();
					
					if (value && !isValidUrl(value)) {
						$input.css('border-color', '#d63638');
						if (!$input.next('.url-error-message').length) {
							$input.after('<p class="url-error-message" style="color: #d63638; margin-top: 5px;">Please enter a valid URL starting with https://</p>');
						}
					} else {
						$input.css('border-color', '');
						$input.next('.url-error-message').remove();
					}
				});
				
				function updateCategoryHighlighting() {
					$('.category-checkbox-label').each(function() {
						const $label = $(this);
						const $checkbox = $label.find('input[type="checkbox"]');
						
						if ($checkbox.is(':checked')) {
							$label.css({
								'background': '#e7f3ff',
								'border-color': '#0073aa'
							});
						} else {
							$label.css({
								'background': 'white',
								'border-color': '#ddd'
							});
						}
					});
				}
				
				function isValidUrl(string) {
					try {
						new URL(string);
						return string.startsWith('http://') || string.startsWith('https://');
					} catch (_) {
						return false;
					}
				}
				
				// Initial highlighting
				updateCategoryHighlighting();
			});
		</script>
		
		<style>
			.tech-categories-selection .category-checkbox-label:hover {
				background: #f0f0f0 !important;
			}
			
			.tech-categories-selection .category-checkbox-label input[type="checkbox"]:checked + .category-name {
				font-weight: bold;
			}
			
			.url-error-message {
				font-size: 12px !important;
				margin-bottom: 0 !important;
			}
		</style>
		<?php
	}

	/**
	 * Save software project details metadata
	 */
	public function save_meta_data( $post_id ): void {
		// Check if user has permission to edit the post
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		// Verify nonce
		if ( ! isset( $_POST['rae_software_project_details_nonce_field'] ) ||
			! wp_verify_nonce( $_POST['rae_software_project_details_nonce_field'], 'rae_software_project_details_nonce' ) ) {
			return;
		}

		// Don't save during autosave
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		// Only save for software-project post type
		if ( get_post_type( $post_id ) !== 'software-project' ) {
			return;
		}

		// Save release date
		if ( isset( $_POST['software_project_release_date'] ) ) {
			$release_date = sanitize_text_field( $_POST['software_project_release_date'] );
			update_post_meta( $post_id, '_software_project_release_date', $release_date );
		}

		// Save demo link with URL validation
		if ( isset( $_POST['software_project_demo_link'] ) ) {
			$demo_link = esc_url_raw( $_POST['software_project_demo_link'] );
			update_post_meta( $post_id, '_software_project_demo_link', $demo_link );
		}

		// Save repository link with URL validation
		if ( isset( $_POST['software_project_repo_link'] ) ) {
			$repo_link = esc_url_raw( $_POST['software_project_repo_link'] );
			update_post_meta( $post_id, '_software_project_repo_link', $repo_link );
		}

		// Save project state
		if ( isset( $_POST['software_project_state'] ) ) {
			$project_state  = sanitize_text_field( $_POST['software_project_state'] );
			$allowed_states = array( 'Ongoing', 'Future', 'Completed' );
			if ( in_array( $project_state, $allowed_states ) || empty( $project_state ) ) {
				update_post_meta( $post_id, '_software_project_state', $project_state );
			}
		}

		// Save technology categories
		if ( isset( $_POST['software_project_tech_categories'] ) && is_array( $_POST['software_project_tech_categories'] ) ) {
			$tech_categories = array_map( 'sanitize_text_field', $_POST['software_project_tech_categories'] );
			update_post_meta( $post_id, '_software_project_tech_categories', $tech_categories );
		} else {
			// No categories selected, save empty array
			update_post_meta( $post_id, '_software_project_tech_categories', array() );
		}
	}
}