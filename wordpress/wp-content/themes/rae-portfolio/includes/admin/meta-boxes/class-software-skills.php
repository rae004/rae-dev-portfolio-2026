<?php
/**
 * Software Project Skills Meta Box
 * Handles the skills selection interface for software projects
 * This follows the exact pattern from media projects and resume items
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class RAE_Software_Skills_Meta_Box {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('add_meta_boxes', array($this, 'add_meta_box'));
        add_action('save_post', array($this, 'save_meta_data'));
    }
    
    /**
     * Add software project skills meta box
     */
    public function add_meta_box(): void {
        add_meta_box(
            'rae_software_project_skills',
            'Related Skills',
            array($this, 'meta_box_callback'),
            'software-project',
            'normal',
            'high'
        );
    }
    
    /**
     * Software project skills meta box callback
     */
    public function meta_box_callback($post): void {
        // Add nonce for security
        wp_nonce_field('rae_software_project_skills_nonce', 'rae_software_project_skills_nonce_field');
        
        // Get current selected skills
        $selected_skills = get_post_meta($post->ID, '_software_project_related_skills', true);
        if (!is_array($selected_skills)) {
            $selected_skills = array();
        }
        
        // Get all skills grouped by category
        $args = array(
            'post_type' => 'skill',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC'
        );
        
        $skills_query = new WP_Query($args);
        $skills_by_category = array();
        
        if ($skills_query->have_posts()) {
            while ($skills_query->have_posts()) {
                $skills_query->the_post();
                $skill_id = get_the_ID();
                $skill_type = get_post_meta($skill_id, '_skill_type', true) ?: 'Other';
                $skill_value = get_post_meta($skill_id, '_skill_value', true) ?: get_the_title();
                $skill_weight = get_post_meta($skill_id, '_skill_weight', true) ?: 0;
                
                if (!isset($skills_by_category[$skill_type])) {
                    $skills_by_category[$skill_type] = array();
                }
                
                $skills_by_category[$skill_type][] = array(
                    'id' => $skill_id,
                    'title' => get_the_title(),
                    'value' => $skill_value,
                    'weight' => $skill_weight
                );
            }
        }
        wp_reset_postdata();
        
        // Sort categories and skills within categories by weight
        ksort($skills_by_category);
        foreach ($skills_by_category as &$skills) {
            usort($skills, function($a, $b) {
                $weight_diff = $b['weight'] - $a['weight'];
                return $weight_diff !== 0 ? $weight_diff : strcmp($a['value'], $b['value']);
            });
        }
        
        $this->render_skills_interface($skills_by_category, $selected_skills);
    }
    
    /**
     * Render the skills selection interface
     */
    private function render_skills_interface($skills_by_category, $selected_skills): void {
        ?>
        <div class="rae-software-skills-selector">
            <div class="skills-search-container" style="margin-bottom: 20px;">
                <label><input type="text"
                    id="software-skills-search"
                    placeholder="Search skills..."
                    style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;" />
                </label>
                <p class="description">Search and select skills related to this software project. Selected skills will appear highlighted.</p>
            </div>
            
            <div class="selected-skills-container" style="margin-bottom: 20px; min-height: 40px; padding: 10px; border: 1px solid #ddd; border-radius: 3px; background: #f9f9f9;">
                <strong>Selected Skills:</strong>
                <div id="software-selected-skills-display" style="margin-top: 10px;">
                    <?php if (empty($selected_skills)): ?>
                        <span class="no-skills-selected" style="color: #666; font-style: italic;">No skills selected</span>
                    <?php else: ?>
                        <?php foreach ($selected_skills as $skill_id): ?>
                            <?php 
                            $skill_post = get_post($skill_id);
                            if ($skill_post):
                                $skill_value = get_post_meta($skill_id, '_skill_value', true) ?: $skill_post->post_title;
                            ?>
                                <span class="selected-skill-pill" data-skill-id="<?php echo $skill_id; ?>" 
                                      style="display: inline-block; margin: 2px 5px 2px 0; padding: 4px 8px; background: #0073aa; color: white; border-radius: 3px; font-size: 12px;">
                                    <?php echo esc_html($skill_value); ?> 
                                    <span class="remove-skill" style="cursor: pointer; margin-left: 5px; font-weight: bold;">&times;</span>
                                </span>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
            
            <div class="skills-by-category" style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 15px;">
                <?php foreach ($skills_by_category as $category => $skills): ?>
                    <div class="category-group" style="margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #23282d; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
                            <?php echo esc_html($category); ?>
                            <span class="category-select-all" data-category="<?php echo esc_attr($category); ?>" 
                                  style="float: right; font-size: 12px; color: #0073aa; cursor: pointer; font-weight: normal;">
                                Select All
                            </span>
                        </h4>
                        <div class="skills-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 5px;">
                            <?php foreach ($skills as $skill): ?>
                                <label class="skill-checkbox-label" data-skill-id="<?php echo $skill['id']; ?>" 
                                       data-skill-value="<?php echo esc_attr($skill['value']); ?>"
                                       data-skill-category="<?php echo esc_attr($category); ?>"
                                       style="display: flex; align-items: center; padding: 5px; border: 1px solid transparent; border-radius: 3px; cursor: pointer; font-size: 13px;
                                              <?php echo in_array($skill['id'], $selected_skills) ? 'background: #e7f3ff; border-color: #0073aa;' : ''; ?>">
                                    <input type="checkbox" 
                                           name="software_project_related_skills[]" 
                                           value="<?php echo $skill['id']; ?>"
                                           <?php checked(in_array($skill['id'], $selected_skills)); ?>
                                           style="margin-right: 8px;" />
                                    <span class="skill-name"><?php echo esc_html($skill['value']); ?></span>
                                    <?php if ($skill['weight'] != 0): ?>
                                        <span class="skill-weight" style="margin-left: auto; font-size: 11px; color: #666;">
                                            (<?php echo $skill['weight']; ?>)
                                        </span>
                                    <?php endif; ?>
                                </label>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
            
            <?php if (empty($skills_by_category)): ?>
                <p style="text-align: center; color: #666; font-style: italic; padding: 20px;">
                    No skills found. <a href="<?php echo admin_url('post-new.php?post_type=skill'); ?>">Create some skills</a> first.
                </p>
            <?php endif; ?>
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
                const $searchInput = $('#software-skills-search');
                const $selectedDisplay = $('#software-selected-skills-display');
                
                // Search functionality
                $searchInput.on('input', function() {
                    const searchTerm = $(this).val().toLowerCase();
                    
                    $('.rae-software-skills-selector .skill-checkbox-label').each(function() {
                        const skillName = $(this).data('skill-value').toLowerCase();
                        const categoryName = $(this).data('skill-category').toLowerCase();
                        
                        if (skillName.includes(searchTerm) || categoryName.includes(searchTerm)) {
                            $(this).show();
                        } else {
                            $(this).hide();
                        }
                    });
                    
                    // Show/hide category headers
                    $('.rae-software-skills-selector .category-group').each(function() {
                        const $group = $(this);
                        const hasVisibleSkills = $group.find('.skill-checkbox-label:visible').length > 0;
                        $group.toggle(hasVisibleSkills);
                    });
                });
                
                // Checkbox change handler
                $('input[name="software_project_related_skills[]"]').on('change', function() {
                    updateSelectedSkillsDisplay();
                    highlightSelectedSkills();
                });
                
                // Remove skill functionality
                $('.rae-software-skills-selector').on('click', '.remove-skill', function() {
                    const skillId = $(this).closest('.selected-skill-pill').data('skill-id');
                    $('input[value="' + skillId + '"]').prop('checked', false).trigger('change');
                });
                
                // Select all in category
                $('.rae-software-skills-selector .category-select-all').on('click', function() {
                    const $categoryGroup = $(this).closest('.category-group');
                    const $checkboxes = $categoryGroup.find('input[type="checkbox"]');
                    const allChecked = $checkboxes.filter(':checked').length === $checkboxes.length;
                    
                    $checkboxes.prop('checked', !allChecked).trigger('change');
                    $(this).text(allChecked ? 'Select All' : 'Deselect All');
                });
                
                function updateSelectedSkillsDisplay() {
                    const selectedSkills = [];
                    $('input[name="software_project_related_skills[]"]:checked').each(function() {
                        const $label = $(this).closest('.skill-checkbox-label');
                        selectedSkills.push({
                            id: $(this).val(),
                            name: $label.data('skill-value')
                        });
                    });
                    
                    if (selectedSkills.length === 0) {
                        $selectedDisplay.html('<span class="no-skills-selected" style="color: #666; font-style: italic;">No skills selected</span>');
                    } else {
                        let html = '';
                        selectedSkills.forEach(function(skill) {
                            html += '<span class="selected-skill-pill" data-skill-id="' + skill.id + '" ' +
                                   'style="display: inline-block; margin: 2px 5px 2px 0; padding: 4px 8px; background: #0073aa; color: white; border-radius: 3px; font-size: 12px;">' +
                                   skill.name + ' <span class="remove-skill" style="cursor: pointer; margin-left: 5px; font-weight: bold;">&times;</span></span>';
                        });
                        $selectedDisplay.html(html);
                    }
                }
                
                function highlightSelectedSkills() {
                    $('.rae-software-skills-selector .skill-checkbox-label').each(function() {
                        const $label = $(this);
                        const $checkbox = $label.find('input[type="checkbox"]');
                        
                        if ($checkbox.is(':checked')) {
                            $label.css({
                                'background': '#e7f3ff',
                                'border-color': '#0073aa'
                            });
                        } else {
                            $label.css({
                                'background': '',
                                'border-color': 'transparent'
                            });
                        }
                    });
                }
                
                // Update category select all text
                function updateSelectAllText() {
                    $('.rae-software-skills-selector .category-group').each(function() {
                        const $group = $(this);
                        const $checkboxes = $group.find('input[type="checkbox"]');
                        const $selectAll = $group.find('.category-select-all');
                        const checkedCount = $checkboxes.filter(':checked').length;
                        
                        $selectAll.text(checkedCount === $checkboxes.length ? 'Deselect All' : 'Select All');
                    });
                }
                
                // Initial setup
                highlightSelectedSkills();
                updateSelectAllText();
            });
        </script>
        
        <style>
            .rae-software-skills-selector .skill-checkbox-label:hover {
                background: #f0f0f0 !important;
            }
            
            .rae-software-skills-selector .skill-checkbox-label input[type="checkbox"]:checked + .skill-name {
                font-weight: bold;
            }
            
            .rae-software-skills-selector .selected-skill-pill:hover .remove-skill {
                color: #ff6b6b !important;
            }
            
            .rae-software-skills-selector .category-select-all:hover {
                text-decoration: underline;
            }
        </style>
        <?php
    }
    
    /**
     * Save software project skills meta data
     */
    public function save_meta_data($post_id): void {
        // Check if user has permission to edit the post
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }
        
        // Verify nonce
        if (!isset($_POST['rae_software_project_skills_nonce_field']) || 
            !wp_verify_nonce($_POST['rae_software_project_skills_nonce_field'], 'rae_software_project_skills_nonce')) {
            return;
        }
        
        // Don't save during autosave
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        
        // Only save for software-project post type
        if (get_post_type($post_id) !== 'software-project') {
            return;
        }
        
        // Save related skills
        if (isset($_POST['software_project_related_skills']) && is_array($_POST['software_project_related_skills'])) {
            $skill_ids = array_map('intval', $_POST['software_project_related_skills']);
            // Validate that all IDs are valid skill posts
            $validated_skills = array();
            foreach ($skill_ids as $skill_id) {
                $skill_post = get_post($skill_id);
                if ($skill_post && $skill_post->post_type === 'skill' && $skill_post->post_status === 'publish') {
                    $validated_skills[] = $skill_id;
                }
            }
            update_post_meta($post_id, '_software_project_related_skills', $validated_skills);
        } else {
            // No skills selected, save empty array
            update_post_meta($post_id, '_software_project_related_skills', array());
        }
    }
}