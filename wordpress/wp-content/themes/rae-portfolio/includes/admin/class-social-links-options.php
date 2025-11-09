<?php
/**
 * Social Links Options
 * WordPress admin settings page for managing social links
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class RAE_Social_Links_Options {

    /**
     * Option name for storing social links
     */
    const string OPTION_NAME = 'rae_social_links';

    /**
     * Maximum allowed social links
     */
    const int MAX_LINKS = 9;

    /**
     * Constructor
     */
    public function __construct() {
        add_action('admin_menu', array($this, 'add_options_page'));
        add_action('admin_init', array($this, 'init_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }

    /**
     * Add social links options page to WordPress admin
     */
    public function add_options_page(): void {
        add_options_page(
            'Social Links',           // Page title
            'Social Links',           // Menu title
            'manage_options',         // Capability
            'rae-social-links',      // Menu slug
            array($this, 'options_page_callback') // Callback
        );
    }

    /**
     * Initialize settings using WordPress Settings API
     */
    public function init_settings(): void {
        // Register setting
        register_setting(
            'rae_social_links_group',
            self::OPTION_NAME,
            array($this, 'validate_options')
        );

        // Add settings section
        add_settings_section(
            'rae_social_links_main',
            'Social Links Configuration',
            array($this, 'settings_section_callback'),
            'rae-social-links'
        );

        // Add settings field
        add_settings_field(
            'social_links',
            'Social Links',
            array($this, 'social_links_callback'),
            'rae-social-links',
            'rae_social_links_main'
        );
    }

    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook): void {
        if ($hook !== 'settings_page_rae-social-links') {
            return;
        }

        // Add WordPress sortable for drag-and-drop
        wp_enqueue_script('jquery-ui-sortable');

        // Add custom admin styles
        wp_add_inline_style('wp-admin', $this->get_admin_styles());

        // Add custom admin JavaScript
        wp_add_inline_script('jquery', $this->get_admin_javascript());
    }

    /**
     * Options page callback
     */
    public function options_page_callback(): void {
        // Check user permissions
        if (!current_user_can('manage_options')) {
            return;
        }

        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

            <div class="notice notice-info">
                <p>
                    <strong>How to use:</strong> Add up to <?php echo self::MAX_LINKS; ?> social links that will appear in the "Connect With Me" section of your contact page.
                    Drag and drop to reorder. Links must be valid URLs starting with https://.
                </p>
            </div>

            <form action="options.php" method="post">
                <?php
                settings_fields('rae_social_links_group');
                do_settings_sections('rae-social-links');
                submit_button('Save Social Links');
                ?>
            </form>

            <div class="postbox" style="margin-top: 20px;">
                <div class="postbox-header">
                    <h2 class="hndle">Supported Platforms</h2>
                </div>
                <div class="inside">
                    <p>The system automatically detects platform icons for popular social networks:</p>
                    <ul>
                        <li><strong>LinkedIn:</strong> linkedin.com links</li>
                        <li><strong>GitHub:</strong> github.com links</li>
                        <li><strong>Twitter/X:</strong> twitter.com or x.com links</li>
                        <li><strong>Facebook:</strong> facebook.com links</li>
                        <li><strong>Instagram:</strong> instagram.com links</li>
                        <li><strong>YouTube:</strong> youtube.com links</li>
                        <li><strong>Email:</strong> mailto: links</li>
                        <li><strong>Generic:</strong> All other URLs (external link icon)</li>
                    </ul>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * Settings section callback
     */
    public function settings_section_callback(): void {
        echo '<p>Configure the social links that appear on your contact page. You can add up to ' . self::MAX_LINKS . ' links.</p>';
    }

    /**
     * Social links callback
     */
    public function social_links_callback(): void {
        $options = get_option(self::OPTION_NAME, $this->get_default_options());
        $social_links = $options['social_links'] ?? array();

        // Filter out empty links and get count
        $active_links = array_filter($social_links, function($link_data) {
            return !empty($link_data['label']) || !empty($link_data['url']);
        });

        $active_count = count($active_links);
        $show_count = max(2, $active_count); // Show at least 2 rows

        ?>
        <div id="rae-social-links-container">
            <div class="social-links-header">
                <div class="social-links-counter">
                    <span id="links-count"><?php echo $active_count; ?></span> of <?php echo self::MAX_LINKS; ?> social links
                </div>
                <div class="social-links-actions">
                    <button type="button" id="add-social-link" class="button button-secondary">
                        <span class="dashicons dashicons-plus-alt"></span> Add Social Link
                    </button>
                </div>
            </div>

            <div id="social-links-list" class="sortable">
                <?php
                // Display existing social links
                $index = 0;
                foreach ($social_links as $link_data) {
                    if (!empty($link_data['label']) || !empty($link_data['url'])) {
                        $this->render_social_link_row($link_data, $index);
                        $index++;
                    }
                }

                // Add empty rows up to show_count
                while ($index < $show_count) {
                    $this->render_social_link_row(array(), $index);
                    $index++;
                }
                ?>
            </div>

            <div class="social-links-tips">
                <p class="description">
                    <strong>Tips:</strong> Drag rows to reorder. Click the "×" button to remove a link.
                    Platform icons are automatically detected from URLs. You can add up to <?php echo self::MAX_LINKS; ?> total links.
                </p>
            </div>
        </div>

        <!-- Hidden template row for adding new links -->
        <div id="social-link-template" style="display: none;">
            <?php $this->render_social_link_row(array(), 999, false); ?>
        </div>
        <?php
    }

    /**
     * Render individual social link row
     */
    private function render_social_link_row($link_data, $index, $show_remove = true): void {
        $label = isset($link_data['label']) ? esc_attr($link_data['label']) : '';
        $url = isset($link_data['url']) ? esc_attr($link_data['url']) : '';
        $enabled = $link_data['enabled'] ?? true;
        $platform = $this->detect_platform($url);

        ?>
        <div class="social-link-row" data-index="<?php echo $index; ?>">
            <div class="social-link-handle">
                <span class="dashicons dashicons-menu"></span>
            </div>

            <div class="social-link-platform">
                <span class="platform-icon platform-<?php echo esc_attr($platform); ?>" title="<?php echo esc_attr(ucfirst($platform)); ?>">
                    <?php echo $this->get_platform_icon($platform); ?>
                </span>
            </div>

            <div class="social-link-fields">
                <div class="field-group">
                    <label for="social_link_label_<?php echo $index; ?>">Label</label>
                    <input type="text"
                           id="social_link_label_<?php echo $index; ?>"
                           name="<?php echo self::OPTION_NAME; ?>[social_links][link_<?php echo $index; ?>][label]"
                           value="<?php echo $label; ?>"
                           placeholder="e.g., LinkedIn Profile"
                           maxlength="50" />
                </div>

                <div class="field-group">
                    <label for="social_link_url_<?php echo $index; ?>">URL</label>
                    <input type="url"
                           id="social_link_url_<?php echo $index; ?>"
                           name="<?php echo self::OPTION_NAME; ?>[social_links][link_<?php echo $index; ?>][url]"
                           value="<?php echo $url; ?>"
                           placeholder="https://linkedin.com/in/username"
                           class="social-url-input" />
                </div>

                <div class="field-group">
                    <label>
                        <input type="checkbox"
                               name="<?php echo self::OPTION_NAME; ?>[social_links][link_<?php echo $index; ?>][enabled]"
                               value="1"
                               <?php checked($enabled); ?> />
                        Enabled
                    </label>
                </div>

                <input type="hidden"
                       name="<?php echo self::OPTION_NAME; ?>[social_links][link_<?php echo $index; ?>][order]"
                       value="<?php echo $index; ?>"
                       class="order-input" />
            </div>

            <?php if ($show_remove): ?>
            <div class="social-link-remove">
                <button type="button" class="remove-social-link button-link" title="Remove this social link">
                    <span class="dashicons dashicons-no-alt"></span>
                </button>
            </div>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * Validate and sanitize options
     */
    public function validate_options($input) {
        $sanitized = array();
        $sanitized['social_links'] = array();

        if (isset($input['social_links']) && is_array($input['social_links'])) {
            $valid_links = 0;

            foreach ($input['social_links'] as $link_id => $link_data) {
                // Stop if we've reached the maximum
                if ($valid_links >= self::MAX_LINKS) {
                    break;
                }

                // Sanitize label
                $label = isset($link_data['label']) ? sanitize_text_field($link_data['label']) : '';

                // Sanitize and validate URL
                $url = isset($link_data['url']) ? esc_url_raw($link_data['url']) : '';

                // Skip if both label and URL are empty
                if (empty($label) && empty($url)) {
                    continue;
                }

                // Validate URL if provided
                if (!empty($url) && !filter_var($url, FILTER_VALIDATE_URL)) {
                    add_settings_error(
                        self::OPTION_NAME,
                        'invalid_url',
                        sprintf('Invalid URL provided: %s', esc_html($url))
                    );
                    continue;
                }

                // Sanitize enabled status
                $enabled = isset( $link_data['enabled'] ) && $link_data['enabled'];

                // Set order
                $order = isset($link_data['order']) ? intval($link_data['order']) : $valid_links;

                // Add to sanitized data
                $sanitized['social_links'][$link_id] = array(
                    'label' => $label,
                    'url' => $url,
                    'enabled' => $enabled,
                    'order' => $order,
                    'platform' => $this->detect_platform($url)
                );

                $valid_links++;
            }
        }

        // Add success message
        if (!empty($sanitized['social_links'])) {
            $count = count($sanitized['social_links']);
            add_settings_error(
                self::OPTION_NAME,
                'settings_updated',
                sprintf('Social links updated successfully. %d link(s) saved.', $count),
                'success'
            );
        }

        return $sanitized;
    }

    /**
     * Detect platform from URL
     */
    private function detect_platform($url): string {
        if (empty($url)) {
            return 'generic';
        }

        // Convert to lowercase for matching
        $url_lower = strtolower($url);

        // Email detection
        if ( str_starts_with( $url_lower, 'mailto:' ) ) {
            return 'email';
        }

        // Parse URL for domain matching
        $domain = parse_url($url_lower, PHP_URL_HOST);
        if (!$domain) {
            return 'generic';
        }

        // Remove www. prefix
        $domain = preg_replace('/^www\./', '', $domain);

        // Platform detection by domain
        $platforms = array(
            'linkedin.com' => 'linkedin',
            'github.com' => 'github',
            'twitter.com' => 'twitter',
            'x.com' => 'twitter',
            'facebook.com' => 'facebook',
            'instagram.com' => 'instagram',
            'youtube.com' => 'youtube',
            'youtu.be' => 'youtube'
        );

        return $platforms[ $domain ] ?? 'generic';
    }

    /**
     * Get platform icon HTML
     */
    private function get_platform_icon($platform): string {
        $icons = array(
            'linkedin' => '<span class="dashicons dashicons-linkedin"></span>',
            'github' => '<span class="dashicons dashicons-github-alt"></span>',
            'twitter' => '<span class="dashicons dashicons-twitter"></span>',
            'facebook' => '<span class="dashicons dashicons-facebook"></span>',
            'instagram' => '<span class="dashicons dashicons-instagram"></span>',
            'youtube' => '<span class="dashicons dashicons-video-alt3"></span>',
            'email' => '<span class="dashicons dashicons-email"></span>',
            'generic' => '<span class="dashicons dashicons-external"></span>'
        );

        return $icons[ $platform ] ?? $icons['generic'];
    }

    /**
     * Get default options
     */
    private function get_default_options(): array {
        return array(
            'social_links' => array()
        );
    }

    /**
     * Get admin CSS styles
     */
    private function get_admin_styles(): string {
        return '
            #rae-social-links-container {
                max-width: 900px;
            }

            .social-links-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding: 15px;
                background: #f8f9fa;
                border: 1px solid #ddd;
                border-radius: 3px;
            }

            .social-links-counter {
                font-weight: 600;
                color: #333;
            }

            #add-social-link {
                display: flex;
                align-items: center;
                gap: 5px;
            }

            #add-social-link:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .social-link-row {
                display: flex;
                align-items: center;
                padding: 15px;
                margin-bottom: 10px;
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 3px;
                cursor: move;
                position: relative;
            }

            .social-link-row:hover {
                border-color: #999;
            }

            .social-link-row.removing {
                opacity: 0.5;
                transform: scale(0.95);
                transition: all 0.3s ease;
            }

            .social-link-handle {
                margin-right: 10px;
                color: #666;
                cursor: move;
            }

            .social-link-platform {
                margin-right: 15px;
                width: 24px;
                text-align: center;
            }

            .platform-icon {
                font-size: 18px;
            }

            .platform-linkedin { color: #0077b5; }
            .platform-github { color: #333; }
            .platform-twitter { color: #1da1f2; }
            .platform-facebook { color: #1877f2; }
            .platform-instagram { color: #e4405f; }
            .platform-youtube { color: #ff0000; }
            .platform-email { color: #ea4335; }
            .platform-generic { color: #666; }

            .social-link-fields {
                display: flex;
                align-items: center;
                flex: 1;
                gap: 15px;
            }

            .social-link-remove {
                margin-left: 10px;
            }

            .remove-social-link {
                padding: 5px;
                color: #dc3232;
                border: none;
                background: none;
                cursor: pointer;
                border-radius: 3px;
                transition: background-color 0.2s;
            }

            .remove-social-link:hover {
                background-color: #f0f0f0;
                color: #a00;
            }

            .field-group {
                display: flex;
                flex-direction: column;
            }

            .field-group label {
                font-weight: 600;
                margin-bottom: 3px;
                font-size: 12px;
            }

            .field-group input[type="text"],
            .field-group input[type="url"] {
                min-width: 200px;
            }

            .field-group:first-child input {
                width: 200px;
            }

            .field-group:nth-child(2) input {
                width: 300px;
            }

            .social-links-tips {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #ddd;
            }

            .sortable .social-link-row {
                transition: all 0.3s ease;
            }

            .ui-sortable-helper {
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                transform: rotate(2deg);
            }

            .ui-sortable-placeholder {
                border: 2px dashed #ddd;
                background: #f9f9f9;
                visibility: visible !important;
                height: 60px;
                margin-bottom: 10px;
            }

            .social-link-row.slide-in {
                animation: slideIn 0.3s ease-out;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        ';
    }

    /**
     * Get admin JavaScript
     */
    private function get_admin_javascript(): string {
        return '
            jQuery(document).ready(function($) {
                const maxLinks = ' . self::MAX_LINKS . ';

                // Count active links initially
                function updateLinkCount() {
                    let activeLinks = 0;
                    $("#social-links-list .social-link-row").each(function() {
                        const label = $(this).find("input[type=text]").val();
                        const url = $(this).find("input[type=url]").val();
                        if (label || url) {
                            activeLinks++;
                        }
                    });
                    $("#links-count").text(activeLinks);

                    // Enable/disable add button
                    const totalRows = $("#social-links-list .social-link-row").length;
                    $("#add-social-link").prop("disabled", totalRows >= maxLinks);

                    return activeLinks;
                }

                // Initialize sortable
                $("#social-links-list").sortable({
                    handle: ".social-link-handle",
                    placeholder: "ui-sortable-placeholder",
                    update: function() {
                        updateIndices();
                    }
                });

                // Update indices after reordering
                function updateIndices() {
                    $("#social-links-list .social-link-row").each(function(index) {
                        const $row = $(this);
                        $row.attr("data-index", index);

                        // Update input names and IDs
                        $row.find("input, label").each(function() {
                            const $input = $(this);
                            const name = $input.attr("name");
                            const id = $input.attr("id");
                            const forAttr = $input.attr("for");

                            if (name) {
                                $input.attr("name", name.replace(/\\[link_\\d+\\]/g, "[link_" + index + "]"));
                            }
                            if (id) {
                                $input.attr("id", id.replace(/_\\d+$/, "_" + index));
                            }
                            if (forAttr) {
                                $input.attr("for", forAttr.replace(/_\\d+$/, "_" + index));
                            }
                        });

                        $row.find(".order-input").val(index);
                    });

                    updateLinkCount();
                }

                // Add social link
                $("#add-social-link").on("click", function() {
                    const currentRows = $("#social-links-list .social-link-row").length;
                    if (currentRows >= maxLinks) {
                        alert("Maximum of " + maxLinks + " social links allowed.");
                        return;
                    }

                    // Clone template row
                    const $template = $("#social-link-template .social-link-row").clone();
                    const newIndex = currentRows;

                    // Update template with new index
                    $template.attr("data-index", newIndex);
                    $template.find("input, label").each(function() {
                        const $input = $(this);
                        const name = $input.attr("name");
                        const id = $input.attr("id");
                        const forAttr = $input.attr("for");

                        if (name) {
                            $input.attr("name", name.replace(/\\[link_999\\]/g, "[link_" + newIndex + "]"));
                        }
                        if (id) {
                            $input.attr("id", id.replace(/_999$/, "_" + newIndex));
                        }
                        if (forAttr) {
                            $input.attr("for", forAttr.replace(/_999$/, "_" + newIndex));
                        }
                    });

                    $template.find(".order-input").val(newIndex);

                    // Add to list with animation
                    $template.addClass("slide-in");
                    $("#social-links-list").append($template);

                    // Bind events to new row
                    bindRowEvents($template);

                    // Update counter and indices
                    updateLinkCount();

                    // Focus on label input
                    setTimeout(function() {
                        $template.find("input[type=text]").first().focus();
                    }, 100);
                });

                // Remove social link
                function bindRowEvents($row) {
                    $row.find(".remove-social-link").on("click", function() {
                        const $rowToRemove = $(this).closest(".social-link-row");

                        // Check if we have minimum rows
                        const totalRows = $("#social-links-list .social-link-row").length;
                        if (totalRows <= 2) {
                            // Clear the row instead of removing it
                            $rowToRemove.find("input[type=text], input[type=url]").val("");
                            $rowToRemove.find("input[type=checkbox]").prop("checked", true);
                            updatePlatformIcon($rowToRemove, "");
                            updateLinkCount();
                            return;
                        }

                        // Animate removal
                        $rowToRemove.addClass("removing");
                        setTimeout(function() {
                            $rowToRemove.remove();
                            updateIndices();
                        }, 300);
                    });

                    // Platform detection on URL change
                    $row.find(".social-url-input").on("input blur", function() {
                        const url = $(this).val();
                        updatePlatformIcon($row, url);
                        updateLinkCount();
                    });

                    // Update count on label change
                    $row.find("input[type=text]").on("input", function() {
                        updateLinkCount();
                    });
                }

                // Update platform icon
                function updatePlatformIcon($row, url) {
                    const urlLower = url.toLowerCase();
                    const $icon = $row.find(".platform-icon");

                    let platform = "generic";
                    let platformClass = "platform-generic";
                    let iconHtml = \'<span class="dashicons dashicons-external"></span>\';

                    if (urlLower.indexOf("linkedin.com") !== -1) {
                        platform = "linkedin";
                        platformClass = "platform-linkedin";
                        iconHtml = \'<span class="dashicons dashicons-linkedin"></span>\';
                    } else if (urlLower.indexOf("github.com") !== -1) {
                        platform = "github";
                        platformClass = "platform-github";
                        iconHtml = \'<span class="dashicons dashicons-github-alt"></span>\';
                    } else if (urlLower.indexOf("twitter.com") !== -1 || urlLower.indexOf("x.com") !== -1) {
                        platform = "twitter";
                        platformClass = "platform-twitter";
                        iconHtml = \'<span class="dashicons dashicons-twitter"></span>\';
                    } else if (urlLower.indexOf("facebook.com") !== -1) {
                        platform = "facebook";
                        platformClass = "platform-facebook";
                        iconHtml = \'<span class="dashicons dashicons-facebook"></span>\';
                    } else if (urlLower.indexOf("instagram.com") !== -1) {
                        platform = "instagram";
                        platformClass = "platform-instagram";
                        iconHtml = \'<span class="dashicons dashicons-instagram"></span>\';
                    } else if (urlLower.indexOf("youtube.com") !== -1 || urlLower.indexOf("youtu.be") !== -1) {
                        platform = "youtube";
                        platformClass = "platform-youtube";
                        iconHtml = \'<span class="dashicons dashicons-video-alt3"></span>\';
                    } else if (urlLower.indexOf("mailto:") === 0) {
                        platform = "email";
                        platformClass = "platform-email";
                        iconHtml = \'<span class="dashicons dashicons-email"></span>\';
                    }

                    // Update icon
                    $icon.removeClass().addClass("platform-icon " + platformClass).html(iconHtml);
                }

                // Bind events to existing rows
                $("#social-links-list .social-link-row").each(function() {
                    bindRowEvents($(this));
                });

                // Initial count update
                updateLinkCount();
            });
        ';
    }
}