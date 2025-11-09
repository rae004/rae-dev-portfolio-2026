<?php
/**
 * Media Project Details Meta Boxes
 *
 * Handles meta boxes for media project custom fields including:
 * - Project type selection (Music/Audio Post Production)
 * - Music project specific fields
 * - Audio post production specific fields
 * - Save handler for all media project meta data
 *
 * @package RaePortfolio
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class Rae_Media_Project_Details {

	/**
	 * Initialize the media project details functionality
	 */
	public function __construct() {
		add_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ) );
		add_action( 'save_post', array( $this, 'save_meta_data' ) );
	}

	/**
	 * Add media project meta boxes
	 */
	public function add_meta_boxes(): void {
		add_meta_box(
			'rae_media_project_type',
			'Project Type',
			array( $this, 'project_type_meta_box_callback' ),
			'media-project',
			'normal',
			'high'
		);

		add_meta_box(
			'rae_music_project_details',
			'Music Project Details',
			array( $this, 'music_project_details_meta_box_callback' ),
			'media-project',
			'normal',
			'high'
		);

		add_meta_box(
			'rae_audio_post_project_details',
			'Audio Post Production Details',
			array( $this, 'audio_post_project_details_meta_box_callback' ),
			'media-project',
			'normal',
			'high'
		);
	}

	/**
	 * Project type selection meta box callback
	 */
	public function project_type_meta_box_callback( $post ): void {
		wp_nonce_field( 'rae_media_project_nonce', 'rae_media_project_nonce_field' );

		$project_type = get_post_meta( $post->ID, '_media_project_type', true );
		?>
		<table class="form-table">
			<tr>
				<th scope="row">
					<label for="media_project_type">Project Type</label>
				</th>
				<td>
					<select id="media_project_type" name="media_project_type" style="width: 300px;">
						<option value="">Select Project Type</option>
						<option value="Music" <?php selected( $project_type, 'Music' ); ?>>Music Project</option>
						<option value="Audio_Post_Production" <?php selected( $project_type, 'Audio_Post_Production' ); ?>>Audio Post Production</option>
					</select>
					<p class="description">Select the type of media project. This determines which fields are available below.</p>
				</td>
			</tr>
		</table>
		
		<script type="text/javascript">
			jQuery(document).ready(function($) {
				const projectTypeElement = $('#media_project_type');
				function toggleProjectFields() {
					const projectType = projectTypeElement.val();
					
					if (projectType === 'Music') {
						$('#rae_music_project_details').show();
						$('#rae_audio_post_project_details').hide();
					} else if (projectType === 'Audio_Post_Production') {
						$('#rae_music_project_details').hide();
						$('#rae_audio_post_project_details').show();
					} else {
						$('#rae_music_project_details').hide();
						$('#rae_audio_post_project_details').hide();
					}
				}
				
				// Initial state
				toggleProjectFields();
				
				// On change
				projectTypeElement.change(function() {
					toggleProjectFields();
				});
			});
		</script>
		<?php
	}

	/**
	 * Music project details meta box callback
	 */
	public function music_project_details_meta_box_callback( $post ): void {
		// Get current values
		$artist_name    = get_post_meta( $post->ID, '_music_artist_name', true );
		$album_names    = get_post_meta( $post->ID, '_music_album_names', true );
		$songs_list     = get_post_meta( $post->ID, '_music_songs_list', true );
		$release_date   = get_post_meta( $post->ID, '_music_release_date', true );
		$artist_website = get_post_meta( $post->ID, '_music_artist_website', true );
		$online_links   = get_post_meta( $post->ID, '_music_online_links', true );
		$genre          = get_post_meta( $post->ID, '_music_genre', true );
		$record_label   = get_post_meta( $post->ID, '_music_record_label', true );
		$duration       = get_post_meta( $post->ID, '_music_duration', true );
		$studio         = get_post_meta( $post->ID, '_music_studio', true );
		$producer       = get_post_meta( $post->ID, '_music_producer', true );
		$collaborators  = get_post_meta( $post->ID, '_music_collaborators', true );

		?>
		<table class="form-table">
			<tr>
				<th scope="row"><label for="music_artist_name">Artist Name</label></th>
				<td>
					<input type="text" id="music_artist_name" name="music_artist_name" value="<?php echo esc_attr( $artist_name ); ?>" style="width: 100%;" />
					<p class="description">Name of the artist or band</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_album_names">Album Names</label></th>
				<td>
					<input type="text" id="music_album_names" name="music_album_names" value="<?php echo esc_attr( $album_names ); ?>" style="width: 100%;" />
					<p class="description">Album names (comma-separated if multiple)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_songs_list">Songs List</label></th>
				<td>
					<textarea id="music_songs_list" name="music_songs_list" rows="3" style="width: 100%;"><?php echo esc_textarea( $songs_list ); ?></textarea>
					<p class="description">List of songs (comma-separated)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_release_date">Release Date</label></th>
				<td>
					<input type="date" id="music_release_date" name="music_release_date" value="<?php echo esc_attr( $release_date ); ?>" />
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_artist_website">Artist Website</label></th>
				<td>
					<input type="url" id="music_artist_website" name="music_artist_website" value="<?php echo esc_attr( $artist_website ); ?>" style="width: 100%;" />
					<p class="description">Official artist website URL</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_genre">Genre</label></th>
				<td>
					<input type="text" id="music_genre" name="music_genre" value="<?php echo esc_attr( $genre ); ?>" style="width: 100%;" />
					<p class="description">Music genre (for filtering)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_record_label">Record Label</label></th>
				<td>
					<input type="text" id="music_record_label" name="music_record_label" value="<?php echo esc_attr( $record_label ); ?>" style="width: 100%;" />
					<p class="description">Record label (for filtering)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_duration">Duration</label></th>
				<td>
					<input type="text" id="music_duration" name="music_duration" value="<?php echo esc_attr( $duration ); ?>" style="width: 200px;" />
					<p class="description">Project duration (e.g., "3:45", "45 minutes")</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_studio">Recording Studio</label></th>
				<td>
					<input type="text" id="music_studio" name="music_studio" value="<?php echo esc_attr( $studio ); ?>" style="width: 100%;" />
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_producer">Producer</label></th>
				<td>
					<input type="text" id="music_producer" name="music_producer" value="<?php echo esc_attr( $producer ); ?>" style="width: 100%;" />
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_collaborators">Collaborators</label></th>
				<td>
					<input type="text" id="music_collaborators" name="music_collaborators" value="<?php echo esc_attr( $collaborators ); ?>" style="width: 100%;" />
					<p class="description">Other collaborators (comma-separated)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_online_links">Streaming Links</label></th>
				<td>
					<textarea id="music_online_links" name="music_online_links" rows="4" style="width: 100%;" placeholder='[{"platform": "Spotify", "url": "https://...", "type": "audio"}, {"platform": "YouTube", "url": "https://...", "type": "video"}]'><?php echo esc_textarea( $online_links ); ?></textarea>
					<p class="description">JSON array of streaming links with platform, url, and type (audio/video)</p>
				</td>
			</tr>
		</table>
		<?php
	}

	/**
	 * Audio post production details meta box callback
	 */
	public function audio_post_project_details_meta_box_callback( $post ): void {
		// Get current values
		$project_name   = get_post_meta( $post->ID, '_audio_project_name', true );
		$director       = get_post_meta( $post->ID, '_audio_director', true );
		$writers        = get_post_meta( $post->ID, '_audio_writers', true );
		$producers      = get_post_meta( $post->ID, '_audio_producers', true );
		$actors         = get_post_meta( $post->ID, '_audio_actors', true );
		$studios        = get_post_meta( $post->ID, '_audio_studios', true );
		$genre          = get_post_meta( $post->ID, '_audio_genre', true );
		$release_date   = get_post_meta( $post->ID, '_audio_release_date', true );
		$project_type   = get_post_meta( $post->ID, '_audio_project_type', true );
		$duration       = get_post_meta( $post->ID, '_audio_duration', true );
		$language       = get_post_meta( $post->ID, '_audio_language', true );
		$engineer       = get_post_meta( $post->ID, '_audio_engineer', true );
		$sound_designer = get_post_meta( $post->ID, '_audio_sound_designer', true );
		$awards         = get_post_meta( $post->ID, '_audio_awards', true );
		$distribution   = get_post_meta( $post->ID, '_audio_distribution', true );

		?>
		<table class="form-table">
			<tr>
				<th scope="row"><label for="audio_project_name">Project Name</label></th>
				<td>
					<input type="text" id="audio_project_name" name="audio_project_name" value="<?php echo esc_attr( $project_name ); ?>" style="width: 100%;" />
					<p class="description">Name of the film, TV show, podcast, etc.</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_director">Director</label></th>
				<td>
					<input type="text" id="audio_director" name="audio_director" value="<?php echo esc_attr( $director ); ?>" style="width: 100%;" />
					<p class="description">Director name (for filtering)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_writers">Writers</label></th>
				<td>
					<input type="text" id="audio_writers" name="audio_writers" value="<?php echo esc_attr( $writers ); ?>" style="width: 100%;" />
					<p class="description">Writer names (comma-separated)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_producers">Producers</label></th>
				<td>
					<input type="text" id="audio_producers" name="audio_producers" value="<?php echo esc_attr( $producers ); ?>" style="width: 100%;" />
					<p class="description">Producer names (comma-separated)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_actors">Actors</label></th>
				<td>
					<input type="text" id="audio_actors" name="audio_actors" value="<?php echo esc_attr( $actors ); ?>" style="width: 100%;" />
					<p class="description">Main actors (comma-separated)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_studios">Studios</label></th>
				<td>
					<input type="text" id="audio_studios" name="audio_studios" value="<?php echo esc_attr( $studios ); ?>" style="width: 100%;" />
					<p class="description">Production studios (comma-separated, for filtering)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_genre">Genre</label></th>
				<td>
					<input type="text" id="audio_genre" name="audio_genre" value="<?php echo esc_attr( $genre ); ?>" style="width: 100%;" />
					<p class="description">Genre (for filtering)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_release_date">Release Date</label></th>
				<td>
					<input type="date" id="audio_release_date" name="audio_release_date" value="<?php echo esc_attr( $release_date ); ?>" />
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_project_type">Project Type</label></th>
				<td>
					<select id="audio_project_type" name="audio_project_type" style="width: 300px;">
						<option value="">Select Type</option>
						<option value="Film" <?php selected( $project_type, 'Film' ); ?>>Film</option>
						<option value="TV" <?php selected( $project_type, 'TV' ); ?>>TV</option>
						<option value="Podcast" <?php selected( $project_type, 'Podcast' ); ?>>Podcast</option>
						<option value="Documentary" <?php selected( $project_type, 'Documentary' ); ?>>Documentary</option>
						<option value="Commercial" <?php selected( $project_type, 'Commercial' ); ?>>Commercial</option>
						<option value="Other" <?php selected( $project_type, 'Other' ); ?>>Other</option>
					</select>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_duration">Duration</label></th>
				<td>
					<input type="text" id="audio_duration" name="audio_duration" value="<?php echo esc_attr( $duration ); ?>" style="width: 200px;" />
					<p class="description">Project duration (e.g., "90 minutes", "6 episodes")</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_language">Language</label></th>
				<td>
					<input type="text" id="audio_language" name="audio_language" value="<?php echo esc_attr( $language ); ?>" style="width: 200px;" />
					<p class="description">Original language</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_engineer">Audio Engineer</label></th>
				<td>
					<input type="text" id="audio_engineer" name="audio_engineer" value="<?php echo esc_attr( $engineer ); ?>" style="width: 100%;" />
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_sound_designer">Sound Designer</label></th>
				<td>
					<input type="text" id="audio_sound_designer" name="audio_sound_designer" value="<?php echo esc_attr( $sound_designer ); ?>" style="width: 100%;" />
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_awards">Awards</label></th>
				<td>
					<input type="text" id="audio_awards" name="audio_awards" value="<?php echo esc_attr( $awards ); ?>" style="width: 100%;" />
					<p class="description">Awards or recognition received</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_distribution">Distribution Platform</label></th>
				<td>
					<input type="text" id="audio_distribution" name="audio_distribution" value="<?php echo esc_attr( $distribution ); ?>" style="width: 100%;" />
					<p class="description">Where the project was distributed (Netflix, theaters, etc.)</p>
				</td>
			</tr>
		</table>
		<?php
	}

	/**
	 * Save media project meta data
	 */
	public function save_meta_data( $post_id ): void {
		// Check if nonce is valid
		if ( ! isset( $_POST['rae_media_project_nonce_field'] ) ||
			! wp_verify_nonce( $_POST['rae_media_project_nonce_field'], 'rae_media_project_nonce' ) ) {
			return;
		}

		// Check if user has permission to edit post
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		// Check if this is an autosave
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		// Only save for media-project post type
		if ( get_post_type( $post_id ) !== 'media-project' ) {
			return;
		}

		// Save project type
		if ( isset( $_POST['media_project_type'] ) ) {
			$project_type = sanitize_text_field( $_POST['media_project_type'] );
			if ( ! empty( $project_type ) ) {
				update_post_meta( $post_id, '_media_project_type', $project_type );
			} else {
				delete_post_meta( $post_id, '_media_project_type' );
			}
		}

		// Save music project fields
		$music_fields = array(
			'music_artist_name'    => '_music_artist_name',
			'music_album_names'    => '_music_album_names',
			'music_songs_list'     => '_music_songs_list',
			'music_release_date'   => '_music_release_date',
			'music_artist_website' => '_music_artist_website',
			'music_online_links'   => '_music_online_links',
			'music_genre'          => '_music_genre',
			'music_record_label'   => '_music_record_label',
			'music_duration'       => '_music_duration',
			'music_studio'         => '_music_studio',
			'music_producer'       => '_music_producer',
			'music_collaborators'  => '_music_collaborators',
		);

		foreach ( $music_fields as $field => $meta_key ) {
			if ( isset( $_POST[ $field ] ) ) {
				$value = sanitize_text_field( $_POST[ $field ] );
				if ( $field === 'music_artist_website' && ! empty( $value ) ) {
					$value = esc_url_raw( $value );
				}
				if ( ! empty( $value ) ) {
					update_post_meta( $post_id, $meta_key, $value );
				} else {
					delete_post_meta( $post_id, $meta_key );
				}
			}
		}

		// Save audio post production fields
		$audio_fields = array(
			'audio_project_name'   => '_audio_project_name',
			'audio_director'       => '_audio_director',
			'audio_writers'        => '_audio_writers',
			'audio_producers'      => '_audio_producers',
			'audio_actors'         => '_audio_actors',
			'audio_studios'        => '_audio_studios',
			'audio_genre'          => '_audio_genre',
			'audio_release_date'   => '_audio_release_date',
			'audio_project_type'   => '_audio_project_type',
			'audio_duration'       => '_audio_duration',
			'audio_language'       => '_audio_language',
			'audio_engineer'       => '_audio_engineer',
			'audio_sound_designer' => '_audio_sound_designer',
			'audio_awards'         => '_audio_awards',
			'audio_distribution'   => '_audio_distribution',
		);

		foreach ( $audio_fields as $field => $meta_key ) {
			if ( isset( $_POST[ $field ] ) ) {
				$value = sanitize_text_field( $_POST[ $field ] );
				if ( ! empty( $value ) ) {
					update_post_meta( $post_id, $meta_key, $value );
				} else {
					delete_post_meta( $post_id, $meta_key );
				}
			}
		}
	}
}

// Initialize the class
new Rae_Media_Project_Details();