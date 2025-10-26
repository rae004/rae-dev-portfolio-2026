<?php
/**
 * Skills Meta Box
 * Handles the skill details meta box for skill post type
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class RAE_Skills_Meta_Box {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('add_meta_boxes', array($this, 'add_meta_box'));
        add_action('save_post', array($this, 'save_meta_data'));
    }
    
    /**
     * Add skills meta box
     */
    public function add_meta_box() {
        add_meta_box(
            'rae_skills_details',
            'Skill Details',
            array($this, 'meta_box_callback'),
            'skill',
            'normal',
            'high'
        );
    }
    
    /**
     * Skills meta box callback
     */
    public function meta_box_callback($post) {
        // Add nonce for security
        wp_nonce_field('rae_skills_nonce', 'rae_skills_nonce_field');
        
        // Get current values
        $skill_type = get_post_meta($post->ID, '_skill_type', true);
        $skill_value = get_post_meta($post->ID, '_skill_value', true);
        $skill_weight = get_post_meta($post->ID, '_skill_weight', true);
        $skill_info_url = get_post_meta($post->ID, '_skill_info_url', true);
        
        // Common skill categories
        $common_categories = array(
            'Programming Languages',
            'Frontend Frameworks',
            'Backend Frameworks',
            'Databases',
            'Cloud Platforms',
            'DevOps Tools',
            'Audio Software',
            'Audio Engineering',
            'Music Production',
            'Audio Post Production',
            'Technical Skills',
            'Project Management',
            'Soft Skills',
            'Other'
        );
        ?>
        <div class="rae-skills-meta-box">
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="skill_type">Skill Category</label>
                    </th>
                    <td>
                        <input type="text" 
                               id="skill_type" 
                               name="skill_type" 
                               value="<?php echo esc_attr($skill_type); ?>" 
                               list="skill_categories"
                               placeholder="e.g., Programming Languages, Audio Software, etc."
                               style="width: 100%; max-width: 400px;" />
                        <datalist id="skill_categories">
                            <?php foreach ($common_categories as $category): ?>
                                <option value="<?php echo esc_attr($category); ?>">
                            <?php endforeach; ?>
                        </datalist>
                        <p class="description">Category or type of skill. Start typing to see suggestions.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="skill_value">Display Name</label>
                    </th>
                    <td>
                        <input type="text" 
                               id="skill_value" 
                               name="skill_value" 
                               value="<?php echo esc_attr($skill_value); ?>" 
                               placeholder="How this skill should be displayed (optional - defaults to post title)"
                               style="width: 100%; max-width: 400px;" />
                        <p class="description">The name shown to visitors. Leave blank to use the post title.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="skill_weight">Skill Weight</label>
                    </th>
                    <td>
                        <input type="number" 
                               id="skill_weight" 
                               name="skill_weight" 
                               value="<?php echo esc_attr($skill_weight); ?>" 
                               min="0" 
                               max="10" 
                               step="1"
                               placeholder="0"
                               style="width: 100px;" />
                        <p class="description">Weight for sorting (0-10). Higher numbers appear first. Use 0 for alphabetical sorting.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="skill_info_url">Information URL</label>
                    </th>
                    <td>
                        <input type="url" 
                               id="skill_info_url" 
                               name="skill_info_url" 
                               value="<?php echo esc_attr($skill_info_url); ?>" 
                               placeholder="https://example.com/more-info"
                               style="width: 100%; max-width: 400px;" />
                        <p class="description">Optional URL for more information about this skill (official website, documentation, etc.).</p>
                    </td>
                </tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 3px;">
                <h4 style="margin-top: 0;">Usage Tips:</h4>
                <ul style="margin-bottom: 0;">
                    <li><strong>Category:</strong> Group similar skills together for better organization</li>
                    <li><strong>Display Name:</strong> Use for brand names (e.g., "React" instead of "React.js")</li>
                    <li><strong>Weight:</strong> Use to prioritize most important/current skills</li>
                    <li><strong>Info URL:</strong> Link to official documentation or learning resources</li>
                </ul>
            </div>
        </div>
        
        <style>
            .rae-skills-meta-box .form-table th {
                width: 150px;
                vertical-align: top;
                padding-top: 10px;
            }
            
            .rae-skills-meta-box .form-table td {
                padding-top: 10px;
            }
            
            .rae-skills-meta-box .description {
                font-style: italic;
                color: #666;
                margin-top: 5px;
                font-size: 13px;
            }
        </style>
        <?php
    }
    
    /**
     * Save skills meta data
     */
    public function save_meta_data($post_id) {
        // Check if nonce is valid
        if (!isset($_POST['rae_skills_nonce_field']) || 
            !wp_verify_nonce($_POST['rae_skills_nonce_field'], 'rae_skills_nonce')) {
            return;
        }
        
        // Check if user has permission to edit post
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }
        
        // Check if this is an autosave
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        
        // Only save for skill post type
        if (get_post_type($post_id) !== 'skill') {
            return;
        }
        
        // Save skill type
        if (isset($_POST['skill_type'])) {
            update_post_meta($post_id, '_skill_type', sanitize_text_field($_POST['skill_type']));
        } else {
            delete_post_meta($post_id, '_skill_type');
        }
        
        // Save skill value
        if (isset($_POST['skill_value'])) {
            update_post_meta($post_id, '_skill_value', sanitize_text_field($_POST['skill_value']));
        } else {
            delete_post_meta($post_id, '_skill_value');
        }
        
        // Save skill weight
        if (isset($_POST['skill_weight']) && $_POST['skill_weight'] !== '') {
            $weight = intval($_POST['skill_weight']);
            update_post_meta($post_id, '_skill_weight', max(0, min(10, $weight)));
        } else {
            update_post_meta($post_id, '_skill_weight', 0);
        }
        
        // Save skill info URL
        if (isset($_POST['skill_info_url'])) {
            $url = sanitize_url($_POST['skill_info_url']);
            if (filter_var($url, FILTER_VALIDATE_URL)) {
                update_post_meta($post_id, '_skill_info_url', $url);
            } else {
                delete_post_meta($post_id, '_skill_info_url');
            }
        } else {
            delete_post_meta($post_id, '_skill_info_url');
        }
    }
}