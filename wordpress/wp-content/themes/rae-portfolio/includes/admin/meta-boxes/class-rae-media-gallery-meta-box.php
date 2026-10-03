<?php
/**
 * Media Project Gallery Meta Box
 *
 * Lets an editor attach an ordered set of media-library images to a media
 * project. Stored as attachment IDs in `_media_project_gallery`; the REST API
 * resolves them to URLs via RAE_Media_Gallery_Meta_Box::get_gallery().
 *
 * The featured image is deliberately separate: it is the album artwork shown
 * at the top of the project page, while the gallery holds everything else.
 *
 * @package RAE_Portfolio
 * @since 1.9.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

/**
 * Media Project Gallery Meta Box
 *
 * @package RAE_Portfolio
 * @since 1.9.0
 */
class RAE_Media_Gallery_Meta_Box {

	/**
	 * Post meta key holding the ordered attachment IDs.
	 */
	public const META_KEY = '_media_project_gallery';

	/**
	 * Initialize the meta box.
	 */
	public function __construct() {
		add_action( 'add_meta_boxes', array( $this, 'add_meta_box' ) );
		add_action( 'save_post', array( $this, 'save_meta_data' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Resolve a post's gallery to image data for the REST API.
	 *
	 * Attachments that have since been deleted (or are not images) are skipped.
	 *
	 * @param int $post_id The post ID.
	 *
	 * @return array<int, array{id: int, url: string, thumbnail_url: string, alt: string, caption: string, width: int, height: int}>
	 */
	public static function get_gallery( int $post_id ): array {
		$images = array();

		foreach ( self::get_gallery_ids( $post_id ) as $attachment_id ) {
			$full = wp_get_attachment_image_src( $attachment_id, 'full' );
			if ( ! $full ) {
				continue;
			}

			$thumb = wp_get_attachment_image_src( $attachment_id, 'large' );

			$images[] = array(
				'id'            => $attachment_id,
				'url'           => $full[0],
				'thumbnail_url' => $thumb ? $thumb[0] : $full[0],
				'alt'           => (string) get_post_meta( $attachment_id, '_wp_attachment_image_alt', true ),
				'caption'       => (string) wp_get_attachment_caption( $attachment_id ),
				'width'         => (int) $full[1],
				'height'        => (int) $full[2],
			);
		}

		return $images;
	}

	/**
	 * Read the stored attachment IDs as a clean list of positive integers.
	 *
	 * @param int $post_id The post ID.
	 *
	 * @return int[]
	 */
	public static function get_gallery_ids( int $post_id ): array {
		$raw = get_post_meta( $post_id, self::META_KEY, true );

		return self::sanitize_ids( is_array( $raw ) ? $raw : array() );
	}

	/**
	 * Keep only positive, unique integers that are image attachments.
	 *
	 * @param array $ids Raw ID list.
	 *
	 * @return int[]
	 */
	private static function sanitize_ids( array $ids ): array {
		$clean = array();

		foreach ( $ids as $id ) {
			$id = absint( $id );
			if ( $id > 0 && ! in_array( $id, $clean, true ) && wp_attachment_is_image( $id ) ) {
				$clean[] = $id;
			}
		}

		return $clean;
	}

	/**
	 * Register the meta box on media projects.
	 */
	public function add_meta_box(): void {
		add_meta_box(
			'rae_media_project_gallery',
			'Project Gallery',
			array( $this, 'meta_box_callback' ),
			'media-project',
			'normal',
			'default'
		);
	}

	/**
	 * Enqueue the media picker and the gallery script on the edit screen only.
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

		wp_enqueue_media();
		wp_enqueue_script( 'jquery-ui-sortable' );
		wp_add_inline_style( 'wp-admin', $this->get_styles() );
		wp_add_inline_script( 'jquery-ui-sortable', $this->get_javascript() );
	}

	/**
	 * Render the meta box.
	 *
	 * @param WP_Post $post The current post.
	 */
	public function meta_box_callback( WP_Post $post ): void {
		wp_nonce_field( 'rae_media_gallery_nonce', 'rae_media_gallery_nonce_field' );
		$ids = self::get_gallery_ids( $post->ID );
		?>
		<div id="rae-media-gallery" class="rae-media-gallery">
			<ul class="rae-media-gallery__list">
				<?php foreach ( $ids as $attachment_id ) : ?>
					<?php $this->render_item( $attachment_id ); ?>
				<?php endforeach; ?>
			</ul>
			<p class="rae-media-gallery__empty" <?php echo $ids ? 'hidden' : ''; ?>>
				No gallery images yet.
			</p>
			<p>
				<button type="button" class="button" id="rae-media-gallery-add">+ Add images</button>
			</p>
			<p class="description">
				Images shown in the project gallery, in this order. Drag to reorder. The
				featured image (album artwork) is set separately in the sidebar and is not
				repeated here.
			</p>
		</div>
		<?php
	}

	/**
	 * Render one gallery thumbnail with its hidden ID field.
	 *
	 * @param int $attachment_id The attachment ID.
	 */
	private function render_item( int $attachment_id ): void {
		$thumb = wp_get_attachment_image_src( $attachment_id, 'thumbnail' );
		if ( ! $thumb ) {
			return;
		}
		?>
		<li class="rae-media-gallery__item" data-id="<?php echo esc_attr( (string) $attachment_id ); ?>">
			<img src="<?php echo esc_url( $thumb[0] ); ?>" alt="" />
			<input type="hidden" name="media_project_gallery[]" value="<?php echo esc_attr( (string) $attachment_id ); ?>" />
			<button type="button" class="rae-media-gallery__remove" aria-label="Remove image">
				<span class="dashicons dashicons-no-alt"></span>
			</button>
		</li>
		<?php
	}

	/**
	 * Save the gallery. An empty or missing list clears the meta.
	 *
	 * @param int $post_id The post ID.
	 */
	public function save_meta_data( int $post_id ): void {
		if ( ! isset( $_POST['rae_media_gallery_nonce_field'] ) ||
			! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['rae_media_gallery_nonce_field'] ) ), 'rae_media_gallery_nonce' ) ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		if ( 'media-project' !== get_post_type( $post_id ) ) {
			return;
		}

		$ids = array();
		if ( isset( $_POST['media_project_gallery'] ) && is_array( $_POST['media_project_gallery'] ) ) {
			$ids = self::sanitize_ids( array_map( 'absint', wp_unslash( $_POST['media_project_gallery'] ) ) );
		}

		if ( $ids ) {
			update_post_meta( $post_id, self::META_KEY, $ids );
		} else {
			delete_post_meta( $post_id, self::META_KEY );
		}
	}

	/**
	 * Styles for the gallery grid.
	 *
	 * @return string
	 */
	private function get_styles(): string {
		return '
			.rae-media-gallery__list {
				display: flex;
				flex-wrap: wrap;
				gap: 10px;
				margin: 0 0 8px;
				padding: 0;
				list-style: none;
			}
			.rae-media-gallery__item {
				position: relative;
				width: 110px;
				height: 110px;
				margin: 0;
				border: 1px solid #dcdcde;
				border-radius: 3px;
				overflow: hidden;
				background: #f6f7f7;
				cursor: grab;
			}
			.rae-media-gallery__item img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				display: block;
			}
			.rae-media-gallery__item.ui-sortable-helper {
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
			}
			.rae-media-gallery__placeholder {
				width: 110px;
				height: 110px;
				border: 1px dashed #c3c4c7;
				background: #f0f0f1;
			}
			.rae-media-gallery__remove {
				position: absolute;
				top: 4px;
				right: 4px;
				width: 24px;
				height: 24px;
				padding: 0;
				border: 0;
				border-radius: 50%;
				background: rgba(0, 0, 0, 0.6);
				color: #fff;
				cursor: pointer;
				line-height: 1;
			}
			.rae-media-gallery__remove:hover {
				background: #b32d2e;
			}
			.rae-media-gallery__remove .dashicons {
				font-size: 18px;
				width: 24px;
				height: 24px;
				line-height: 24px;
			}
			.rae-media-gallery__empty {
				color: #646970;
				font-style: italic;
				margin: 8px 0;
			}
		';
	}

	/**
	 * Behaviour: open the WordPress media picker, append selections, remove,
	 * and drag-to-reorder. Field order in the DOM is the saved order.
	 *
	 * @return string
	 */
	private function get_javascript(): string {
		return '
			jQuery(function ($) {
				const $root = $("#rae-media-gallery");
				if (!$root.length || !window.wp || !wp.media) {
					return;
				}

				const $list = $root.find(".rae-media-gallery__list");
				const $empty = $root.find(".rae-media-gallery__empty");
				let frame = null;

				const refresh = () => {
					$empty.prop("hidden", $list.children().length > 0);
				};

				const currentIds = () =>
					$list.children().map(function () { return String($(this).data("id")); }).get();

				const addItem = (attachment) => {
					if (currentIds().includes(String(attachment.id))) {
						return;
					}
					const sizes = attachment.sizes || {};
					const src = (sizes.thumbnail || sizes.medium || sizes.full || {}).url || attachment.url;
					const $item = $("<li>", { class: "rae-media-gallery__item", "data-id": attachment.id });
					$item.append($("<img>", { src: src, alt: "" }));
					$item.append($("<input>", { type: "hidden", name: "media_project_gallery[]", value: attachment.id }));
					$item.append(
						$("<button>", { type: "button", class: "rae-media-gallery__remove", "aria-label": "Remove image" })
							.append($("<span>", { class: "dashicons dashicons-no-alt" }))
					);
					$list.append($item);
				};

				$("#rae-media-gallery-add").on("click", (event) => {
					event.preventDefault();
					if (!frame) {
						frame = wp.media({
							title: "Add gallery images",
							button: { text: "Add to gallery" },
							library: { type: "image" },
							multiple: "add",
						});
						frame.on("select", () => {
							frame.state().get("selection").toJSON().forEach(addItem);
							refresh();
						});
					}
					frame.open();
				});

				$root.on("click", ".rae-media-gallery__remove", function () {
					$(this).closest(".rae-media-gallery__item").remove();
					refresh();
				});

				$list.sortable({
					placeholder: "rae-media-gallery__placeholder",
					tolerance: "pointer",
				});

				refresh();
			});
		';
	}
}

// Initialize the class
new RAE_Media_Gallery_Meta_Box();
