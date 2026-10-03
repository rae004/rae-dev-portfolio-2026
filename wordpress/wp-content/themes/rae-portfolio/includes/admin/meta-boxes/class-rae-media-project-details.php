<?php
/**
 * Media Project Details Meta Boxes
 *
 * Handles meta boxes for media project custom fields including:
 * - Project type selection (Music/Audio Post Production)
 * - Music project specific fields
 * - Audio post-production specific fields
 * - Save handler for all media project metadata
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

/**
 * Media Project Details
 *
 * Manages media project meta box functionality.
 *
 * @package RAE_Portfolio
 * @since 1.0.0
 */
class Rae_Media_Project_Details {

	/**
	 * Initialize the media project details functionality
	 */
	public function __construct() {
		add_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ) );
		add_action( 'save_post', array( $this, 'save_meta_data' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Allowed values for a streaming link's type.
	 *
	 * @var string[]
	 */
	private const LINK_TYPES = array( 'audio', 'video' );

	/**
	 * Suggested platform names for the streaming-link repeater. Free text is
	 * still allowed; the frontend matches platforms by substring.
	 *
	 * @var string[]
	 */
	private const PLATFORM_SUGGESTIONS = array(
		'Spotify',
		'Apple Music',
		'YouTube',
		'YouTube Music',
		'SoundCloud',
		'Bandcamp',
		'Tidal',
		'Amazon Music',
		'Deezer',
	);

	/**
	 * Read the streaming links for a post as a normalised list.
	 *
	 * Accepts the current array storage and the legacy JSON-string storage
	 * (the old textarea), returning an empty array for anything else.
	 *
	 * @param int $post_id The post ID.
	 *
	 * @return array<int, array{platform: string, url: string, type: string}>
	 */
	public static function get_streaming_links( int $post_id ): array {
		$raw = get_post_meta( $post_id, '_music_online_links', true );

		if ( is_string( $raw ) && '' !== $raw ) {
			$decoded = json_decode( $raw, true );
			$raw     = is_array( $decoded ) ? $decoded : array();
		}

		if ( ! is_array( $raw ) ) {
			return array();
		}

		return self::sanitize_streaming_links( $raw );
	}

	/**
	 * Sanitize a list of streaming links. Rows without a valid URL are dropped.
	 *
	 * @param array $links Raw rows, each with platform/url/type keys.
	 *
	 * @return array<int, array{platform: string, url: string, type: string}>
	 */
	private static function sanitize_streaming_links( array $links ): array {
		$clean = array();

		foreach ( $links as $link ) {
			if ( ! is_array( $link ) ) {
				continue;
			}

			$url = isset( $link['url'] ) ? esc_url_raw( trim( (string) $link['url'] ) ) : '';
			if ( '' === $url ) {
				continue;
			}

			$platform = isset( $link['platform'] ) ? sanitize_text_field( (string) $link['platform'] ) : '';
			if ( '' === $platform ) {
				$platform = self::guess_platform( $url );
			}

			$type = isset( $link['type'] ) ? strtolower( sanitize_key( (string) $link['type'] ) ) : 'audio';
			if ( ! in_array( $type, self::LINK_TYPES, true ) ) {
				$type = 'audio';
			}

			$clean[] = array(
				'platform' => $platform,
				'url'      => $url,
				'type'     => $type,
			);
		}

		return $clean;
	}

	/**
	 * Derive a platform label from a URL when the editor leaves it blank.
	 *
	 * @param string $url The link URL.
	 *
	 * @return string
	 */
	private static function guess_platform( string $url ): string {
		$host = strtolower( (string) wp_parse_url( $url, PHP_URL_HOST ) );
		$host = preg_replace( '/^(www|open|music|play)\./', '', $host );

		$known = array(
			'spotify.com'    => 'Spotify',
			'apple.com'      => 'Apple Music',
			'youtube.com'    => 'YouTube',
			'youtu.be'       => 'YouTube',
			'soundcloud.com' => 'SoundCloud',
			'bandcamp.com'   => 'Bandcamp',
			'tidal.com'      => 'Tidal',
			'amazon.com'     => 'Amazon Music',
			'deezer.com'     => 'Deezer',
		);

		foreach ( $known as $domain => $label ) {
			if ( $host === $domain || str_ends_with( $host, '.' . $domain ) ) {
				return $label;
			}
		}

		return $host ? $host : 'Listen';
	}

	/**
	 * Enqueue the repeater's script/styles on the media-project edit screen only.
	 *
	 * @param string $hook The current admin page hook.
	 */
	public function enqueue_admin_scripts( string $hook ): void {
		if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}

		$screen = get_current_screen();
		if ( ! $screen || 'media-project' !== $screen->post_type ) {
			return;
		}

		wp_enqueue_script( 'jquery-ui-sortable' );
		wp_add_inline_style( 'wp-admin', $this->get_streaming_links_styles() );
		wp_add_inline_script( 'jquery-ui-sortable', $this->get_streaming_links_javascript() );
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
	 *
	 * @param WP_Post $post The current post object
	 */
	public function project_type_meta_box_callback( WP_Post $post ): void {
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
						<option value="Audio_Post_Production"
								<?php selected( $project_type, 'Audio_Post_Production' ); ?>>
							Audio Post Production
						</option>
					</select>
					<p class="description">
						Select the type of media project. This determines which fields are available below.
					</p>
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
	 *
	 * @param WP_Post $post The current post object
	 */
	public function music_project_details_meta_box_callback( WP_Post $post ): void {
		// Get current values
		$artist_name     = get_post_meta( $post->ID, '_music_artist_name', true );
		$album_names     = get_post_meta( $post->ID, '_music_album_names', true );
		$songs_list      = get_post_meta( $post->ID, '_music_songs_list', true );
		$release_date    = get_post_meta( $post->ID, '_music_release_date', true );
		$artist_website  = get_post_meta( $post->ID, '_music_artist_website', true );
		$genre           = get_post_meta( $post->ID, '_music_genre', true );
		$record_label    = get_post_meta( $post->ID, '_music_record_label', true );
		$duration        = get_post_meta( $post->ID, '_music_duration', true );
		$studio          = get_post_meta( $post->ID, '_music_studio', true );
		$producer        = get_post_meta( $post->ID, '_music_producer', true );
		$collaborators   = get_post_meta( $post->ID, '_music_collaborators', true );
		$streaming_links = self::get_streaming_links( $post->ID );

		?>
		<table class="form-table">
			<tr>
				<th scope="row"><label for="music_artist_name">Artist Name</label></th>
				<td>
					<input type="text"
							id="music_artist_name"
							name="music_artist_name"
							value="<?php echo esc_attr( $artist_name ); ?>"
							style="width: 100%;" />
					<p class="description">Name of the artist or band</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_album_names">Album Names</label></th>
				<td>
					<input type="text"
							id="music_album_names"
							name="music_album_names"
							value="<?php echo esc_attr( $album_names ); ?>"
							style="width: 100%;" />
					<p class="description">Album names (comma-separated if multiple)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_songs_list">Songs List</label></th>
				<td>
					<textarea id="music_songs_list"
							name="music_songs_list"
							rows="3"
							style="width: 100%;">
						<?php echo esc_textarea( $songs_list ); ?>
					</textarea>
					<p class="description">List of songs (comma-separated)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_release_date">Release Date</label></th>
				<td>
					<input type="date"
							id="music_release_date"
							name="music_release_date"
							value="<?php echo esc_attr( $release_date ); ?>" />
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_artist_website">Artist Website</label></th>
				<td>
					<input type="url"
							id="music_artist_website"
							name="music_artist_website"
							value="<?php echo esc_attr( $artist_website ); ?>"
							style="width: 100%;" />
					<p class="description">Official artist website URL</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_genre">Genre</label></th>
				<td>
					<input type="text"
							id="music_genre"
							name="music_genre"
							value="<?php echo esc_attr( $genre ); ?>"
							style="width: 100%;" />
					<p class="description">Music genre (for filtering)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_record_label">Record Label</label></th>
				<td>
					<input type="text"
							id="music_record_label"
							name="music_record_label"
							value="<?php echo esc_attr( $record_label ); ?>"
							style="width: 100%;" />
					<p class="description">Record label (for filtering)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_duration">Duration</label></th>
				<td>
					<input type="text"
							id="music_duration"
							name="music_duration"
							value="<?php echo esc_attr( $duration ); ?>"
							style="width: 200px;" />
					<p class="description">Project duration (e.g., "3:45", "45 minutes")</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_studio">Recording Studio</label></th>
				<td>
					<input type="text"
							id="music_studio"
							name="music_studio"
							value="<?php echo esc_attr( $studio ); ?>"
							style="width: 100%;" />
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_producer">Producer</label></th>
				<td>
					<input type="text"
							id="music_producer"
							name="music_producer"
							value="<?php echo esc_attr( $producer ); ?>"
							style="width: 100%;" />
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="music_collaborators">Collaborators</label></th>
				<td>
					<input type="text"
							id="music_collaborators"
							name="music_collaborators"
							value="<?php echo esc_attr( $collaborators ); ?>"
							style="width: 100%;" />
					<p class="description">Other collaborators (comma-separated)</p>
				</td>
			</tr>
			<tr>
				<th scope="row">Streaming Links</th>
				<td>
					<div id="rae-streaming-links" class="rae-streaming-links">
						<div class="rae-streaming-links__header" aria-hidden="true">
							<span></span>
							<span>Platform</span>
							<span>URL</span>
							<span>Type</span>
							<span></span>
						</div>
						<div class="rae-streaming-links__rows">
							<?php foreach ( $streaming_links as $index => $link ) : ?>
								<?php $this->render_streaming_link_row( $index, $link ); ?>
							<?php endforeach; ?>
						</div>
						<p class="rae-streaming-links__empty" <?php echo $streaming_links ? 'hidden' : ''; ?>>
							No streaming links yet.
						</p>
						<p>
							<button type="button" class="button" id="rae-add-streaming-link">+ Add link</button>
						</p>
						<datalist id="rae-streaming-platforms">
							<?php foreach ( self::PLATFORM_SUGGESTIONS as $suggestion ) : ?>
								<option value="<?php echo esc_attr( $suggestion ); ?>"></option>
							<?php endforeach; ?>
						</datalist>
						<template id="rae-streaming-link-template">
							<?php
							$this->render_streaming_link_row(
								'__INDEX__',
								array(
									'platform' => '',
									'url'      => '',
									'type'     => 'audio',
								)
							);
							?>
						</template>
					</div>
					<p class="description">
						Where listeners can find this project. Drag the handle to reorder. Leave
						Platform blank to fill it in from the URL.
					</p>
				</td>
			</tr>
		</table>
		<?php
	}

	/**
	 * Render one row of the streaming-link repeater.
	 *
	 * @param int|string $index Row index, or the literal "__INDEX__" for the template.
	 * @param array      $link  Row values (platform, url, type).
	 */
	private function render_streaming_link_row( int|string $index, array $link ): void {
		$name = 'music_online_links[' . $index . ']';
		?>
		<div class="rae-streaming-links__row">
			<span class="rae-streaming-links__handle dashicons dashicons-menu" title="Drag to reorder"></span>
			<input type="text"
					name="<?php echo esc_attr( $name ); ?>[platform]"
					value="<?php echo esc_attr( $link['platform'] ); ?>"
					list="rae-streaming-platforms"
					placeholder="Spotify"
					aria-label="Platform" />
			<input type="url"
					name="<?php echo esc_attr( $name ); ?>[url]"
					value="<?php echo esc_attr( $link['url'] ); ?>"
					placeholder="https://"
					aria-label="URL" />
			<select name="<?php echo esc_attr( $name ); ?>[type]" aria-label="Type">
				<?php foreach ( self::LINK_TYPES as $type ) : ?>
					<option value="<?php echo esc_attr( $type ); ?>" <?php selected( $link['type'], $type ); ?>>
						<?php echo esc_html( ucfirst( $type ) ); ?>
					</option>
				<?php endforeach; ?>
			</select>
			<button type="button" class="button-link rae-streaming-links__remove" aria-label="Remove link">
				<span class="dashicons dashicons-no-alt"></span>
			</button>
		</div>
		<?php
	}

	/**
	 * Styles for the streaming-link repeater.
	 *
	 * @return string
	 */
	private function get_streaming_links_styles(): string {
		return '
			.rae-streaming-links__header,
			.rae-streaming-links__row {
				display: grid;
				grid-template-columns: 24px 1fr 2fr 110px 32px;
				gap: 8px;
				align-items: center;
			}
			.rae-streaming-links__header {
				font-weight: 600;
				color: #50575e;
				margin-bottom: 4px;
			}
			.rae-streaming-links__row {
				padding: 6px 0;
				border-top: 1px solid #dcdcde;
			}
			.rae-streaming-links__row input,
			.rae-streaming-links__row select {
				width: 100%;
				margin: 0;
			}
			.rae-streaming-links__handle {
				cursor: grab;
				color: #8c8f94;
			}
			.rae-streaming-links__row.ui-sortable-helper {
				background: #fff;
				box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
			}
			.rae-streaming-links__placeholder {
				height: 44px;
				border: 1px dashed #c3c4c7;
				background: #f6f7f7;
			}
			.rae-streaming-links__remove {
				color: #b32d2e;
				text-decoration: none;
			}
			.rae-streaming-links__remove:hover {
				color: #8a2424;
			}
			.rae-streaming-links__empty {
				color: #646970;
				font-style: italic;
				margin: 8px 0;
			}
		';
	}

	/**
	 * Behaviour for the streaming-link repeater: add, remove, reorder, and
	 * re-index field names so PHP receives a dense array.
	 *
	 * @return string
	 */
	private function get_streaming_links_javascript(): string {
		return '
			jQuery(function ($) {
				const $root = $("#rae-streaming-links");
				if (!$root.length) {
					return;
				}

				const $rows = $root.find(".rae-streaming-links__rows");
				const $empty = $root.find(".rae-streaming-links__empty");
				const template = document.getElementById("rae-streaming-link-template").innerHTML;

				const refresh = () => {
					$rows.children(".rae-streaming-links__row").each(function (index) {
						$(this).find("[name]").each(function () {
							this.name = this.name.replace(/music_online_links\\[[^\\]]*\\]/, "music_online_links[" + index + "]");
						});
					});
					$empty.prop("hidden", $rows.children().length > 0);
				};

				$("#rae-add-streaming-link").on("click", () => {
					const $row = $(template.replace(/__INDEX__/g, String($rows.children().length)));
					$rows.append($row);
					refresh();
					$row.find("input[type=url]").trigger("focus");
				});

				$root.on("click", ".rae-streaming-links__remove", function () {
					$(this).closest(".rae-streaming-links__row").remove();
					refresh();
				});

				$rows.sortable({
					handle: ".rae-streaming-links__handle",
					axis: "y",
					placeholder: "rae-streaming-links__placeholder",
					update: refresh,
				});

				refresh();
			});
		';
	}

	/**
	 * Audio post production details meta box callback
	 *
	 * @param WP_Post $post The current post object
	 */
	public function audio_post_project_details_meta_box_callback( WP_Post $post ): void {
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
					<input type="text"
							id="audio_project_name"
							name="audio_project_name"
							value="<?php echo esc_attr( $project_name ); ?>"
							style="width: 100%;" />
					<p class="description">Name of the film, TV show, podcast, etc.</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_director">Director</label></th>
				<td>
					<input type="text"
							id="audio_director"
							name="audio_director"
							value="<?php echo esc_attr( $director ); ?>"
							style="width: 100%;" />
					<p class="description">Director name (for filtering)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_writers">Writers</label></th>
				<td>
					<input type="text"
							id="audio_writers"
							name="audio_writers"
							value="<?php echo esc_attr( $writers ); ?>"
							style="width: 100%;" />
					<p class="description">Writer names (comma-separated)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_producers">Producers</label></th>
				<td>
					<input type="text"
							id="audio_producers"
							name="audio_producers"
							value="<?php echo esc_attr( $producers ); ?>"
							style="width: 100%;" />
					<p class="description">Producer names (comma-separated)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_actors">Actors</label></th>
				<td>
					<input type="text"
							id="audio_actors"
							name="audio_actors"
							value="<?php echo esc_attr( $actors ); ?>"
							style="width: 100%;" />
					<p class="description">Main actors (comma-separated)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_studios">Studios</label></th>
				<td>
					<input type="text"
							id="audio_studios"
							name="audio_studios"
							value="<?php echo esc_attr( $studios ); ?>"
							style="width: 100%;" />
					<p class="description">Production studios (comma-separated, for filtering)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_genre">Genre</label></th>
				<td>
					<input type="text"
							id="audio_genre"
							name="audio_genre"
							value="<?php echo esc_attr( $genre ); ?>"
							style="width: 100%;" />
					<p class="description">Genre (for filtering)</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_release_date">Release Date</label></th>
				<td>
					<input type="date"
							id="audio_release_date"
							name="audio_release_date"
							value="<?php echo esc_attr( $release_date ); ?>" />
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
					<input type="text"
							id="audio_duration"
							name="audio_duration"
							value="<?php echo esc_attr( $duration ); ?>"
							style="width: 200px;" />
					<p class="description">Project duration (e.g., "90 minutes", "6 episodes")</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_language">Language</label></th>
				<td>
					<input type="text"
							id="audio_language"
							name="audio_language"
							value="<?php echo esc_attr( $language ); ?>"
							style="width: 200px;" />
					<p class="description">Original language</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_engineer">Audio Engineer</label></th>
				<td>
					<input type="text"
							id="audio_engineer"
							name="audio_engineer"
							value="<?php echo esc_attr( $engineer ); ?>"
							style="width: 100%;" />
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_sound_designer">Sound Designer</label></th>
				<td>
					<input type="text"
							id="audio_sound_designer"
							name="audio_sound_designer"
							value="<?php echo esc_attr( $sound_designer ); ?>"
							style="width: 100%;" />
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_awards">Awards</label></th>
				<td>
					<input type="text"
							id="audio_awards"
							name="audio_awards"
							value="<?php echo esc_attr( $awards ); ?>"
							style="width: 100%;" />
					<p class="description">Awards or recognition received</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="audio_distribution">Distribution Platform</label></th>
				<td>
					<input type="text"
							id="audio_distribution"
							name="audio_distribution"
							value="<?php echo esc_attr( $distribution ); ?>"
							style="width: 100%;" />
					<p class="description">Where the project was distributed (Netflix, theaters, etc.)</p>
				</td>
			</tr>
		</table>
		<?php
	}

	/**
	 * Save media project meta data
	 *
	 * @param int $post_id The post ID to save metadata for
	 */
	public function save_meta_data( int $post_id ): void {
		// Check if nonce is valid
		if ( ! isset( $_POST['rae_media_project_nonce_field'] ) ||
			! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['rae_media_project_nonce_field'] ) ), 'rae_media_project_nonce' ) ) {
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
		if ( 'media-project' !== get_post_type( $post_id ) ) {
			return;
		}

		// Save project type
		if ( isset( $_POST['media_project_type'] ) ) {
			$project_type = sanitize_text_field( wp_unslash( $_POST['media_project_type'] ) );
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
			'music_genre'          => '_music_genre',
			'music_record_label'   => '_music_record_label',
			'music_duration'       => '_music_duration',
			'music_studio'         => '_music_studio',
			'music_producer'       => '_music_producer',
			'music_collaborators'  => '_music_collaborators',
		);

		foreach ( $music_fields as $field => $meta_key ) {
			if ( isset( $_POST[ $field ] ) ) {
				$value = sanitize_text_field( wp_unslash( $_POST[ $field ] ) );
				if ( 'music_artist_website' === $field && ! empty( $value ) ) {
					$value = esc_url_raw( $value );
				}
				if ( ! empty( $value ) ) {
					update_post_meta( $post_id, $meta_key, $value );
				} else {
					delete_post_meta( $post_id, $meta_key );
				}
			}
		}

		// Save streaming links (structured array from the repeater). The field is
		// absent from the request when every row has been removed, which must
		// clear the stored value rather than leave stale links behind.
		$raw_links = array();
		if ( isset( $_POST['music_online_links'] ) && is_array( $_POST['music_online_links'] ) ) {
			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitised per field in sanitize_streaming_links().
			$raw_links = wp_unslash( $_POST['music_online_links'] );
		}
		$links = self::sanitize_streaming_links( $raw_links );
		if ( $links ) {
			update_post_meta( $post_id, '_music_online_links', $links );
		} else {
			delete_post_meta( $post_id, '_music_online_links' );
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
				$value = sanitize_text_field( wp_unslash( $_POST[ $field ] ) );
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