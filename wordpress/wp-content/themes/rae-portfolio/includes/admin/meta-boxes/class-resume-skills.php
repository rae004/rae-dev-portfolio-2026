<?php
/**
 * Resume Skills Meta Box
 * Handles the skills selection interface for resume items
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class RAE_Resume_Skills_Meta_Box {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('add_meta_boxes', array($this, 'add_meta_box'));
        add_action('save_post', array($this, 'save_meta_data'));
    }
    
    /**
     * Add resume skills meta box
     */
    public function add_meta_box() {
        add_meta_box(
            'rae_resume_skills',
            'Related Skills',
            array($this, 'meta_box_callback'),
            'resume',
            'normal',
            'high'
        );
    }
    
    /**
     * Resume skills meta box callback
     */
    public function meta_box_callback($post) {
        // Add nonce for security
        wp_nonce_field('rae_resume_skills_nonce', 'rae_resume_skills_nonce_field');
        
        // Get current selected skills
        $selected_skills = get_post_meta($post->ID, '_resume_related_skills', true);
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
        foreach ($skills_by_category as $category => &$skills) {
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
    private function render_skills_interface($skills_by_category, $selected_skills) {
        ?>
        <div class="rae-resume-skills-selector">
            <div class="skills-search-container" style="margin-bottom: 20px;">
                <input type="text" 
                       id="skills-search" 
                       placeholder="Search skills..." 
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;" />
                <p class="description">Search and select skills related to this resume item. Selected skills will appear highlighted.</p>
            </div>
            
            <div class="selected-skills-container" style="margin-bottom: 20px; min-height: 40px; padding: 10px; border: 1px solid #ddd; border-radius: 3px; background: #f9f9f9;">
                <strong>Selected Skills:</strong>
                <div id="selected-skills-display" style="margin-top: 10px;">
                    <?php if (empty($selected_skills)): ?>
                        <span class="no-skills-selected" style="color: #666; font-style: italic;">No skills selected</span>
                    <?php else: ?>
                        <?php foreach ($selected_skills as $skill_id): ?>
                            <?php 
                            $skill_post = get_post($skill_id);
                            if ($skill_post):
                                $skill_value = get_post_meta($skill_id, '_skill_value', true) ?: $skill_post->post_title;
                                $skill_type = get_post_meta($skill_id, '_skill_type', true) ?: 'Other';
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
                                           name="resume_related_skills[]" 
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
                var $searchInput = $('#skills-search');
                var $selectedDisplay = $('#selected-skills-display');
                var $noSkillsMessage = $('.no-skills-selected');
                
                // Search functionality
                $searchInput.on('input', function() {
                    var searchTerm = $(this).val().toLowerCase();
                    
                    $('.skill-checkbox-label').each(function() {
                        var skillName = $(this).data('skill-value').toLowerCase();
                        var categoryName = $(this).data('skill-category').toLowerCase();
                        
                        if (skillName.includes(searchTerm) || categoryName.includes(searchTerm)) {
                            $(this).show();
                        } else {
                            $(this).hide();
                        }
                    });
                    
                    // Show/hide category headers
                    $('.category-group').each(function() {
                        var $group = $(this);
                        var hasVisibleSkills = $group.find('.skill-checkbox-label:visible').length > 0;
                        $group.toggle(hasVisibleSkills);
                    });
                });
                
                // Checkbox change handler
                $('input[name="resume_related_skills[]"]').on('change', function() {
                    updateSelectedSkillsDisplay();
                    highlightSelectedSkills();
                });
                
                // Remove skill functionality
                $(document).on('click', '.remove-skill', function() {
                    var skillId = $(this).closest('.selected-skill-pill').data('skill-id');
                    $('input[value="' + skillId + '"]').prop('checked', false).trigger('change');
                });
                
                // Select all in category
                $('.category-select-all').on('click', function() {
                    var category = $(this).data('category');
                    var $categoryGroup = $(this).closest('.category-group');
                    var $checkboxes = $categoryGroup.find('input[type="checkbox"]');
                    var allChecked = $checkboxes.filter(':checked').length === $checkboxes.length;
                    
                    $checkboxes.prop('checked', !allChecked).trigger('change');
                    $(this).text(allChecked ? 'Select All' : 'Deselect All');
                });
                
                function updateSelectedSkillsDisplay() {
                    var selectedSkills = [];
                    $('input[name="resume_related_skills[]"]:checked').each(function() {
                        var $label = $(this).closest('.skill-checkbox-label');
                        selectedSkills.push({
                            id: $(this).val(),
                            name: $label.data('skill-value')
                        });
                    });
                    
                    if (selectedSkills.length === 0) {
                        $selectedDisplay.html('<span class="no-skills-selected" style="color: #666; font-style: italic;">No skills selected</span>');
                    } else {
                        var html = '';
                        selectedSkills.forEach(function(skill) {
                            html += '<span class="selected-skill-pill" data-skill-id="' + skill.id + '" ' +
                                   'style="display: inline-block; margin: 2px 5px 2px 0; padding: 4px 8px; background: #0073aa; color: white; border-radius: 3px; font-size: 12px;">' +
                                   skill.name + ' <span class="remove-skill" style="cursor: pointer; margin-left: 5px; font-weight: bold;">&times;</span></span>';
                        });
                        $selectedDisplay.html(html);
                    }
                }
                
                function highlightSelectedSkills() {
                    $('.skill-checkbox-label').each(function() {
                        var $label = $(this);
                        var $checkbox = $label.find('input[type="checkbox"]');
                        
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
                    $('.category-group').each(function() {
                        var $group = $(this);
                        var $checkboxes = $group.find('input[type="checkbox"]');
                        var $selectAll = $group.find('.category-select-all');
                        var checkedCount = $checkboxes.filter(':checked').length;
                        
                        $selectAll.text(checkedCount === $checkboxes.length ? 'Deselect All' : 'Select All');
                    });
                }
                
                // Initial setup
                highlightSelectedSkills();
                updateSelectAllText();
            });
        </script>
        
        <style>
            .rae-resume-skills-selector .skill-checkbox-label:hover {
                background: #f0f0f0 !important;
            }
            
            .rae-resume-skills-selector .skill-checkbox-label input[type="checkbox"]:checked + .skill-name {
                font-weight: bold;
            }
            
            .selected-skill-pill:hover .remove-skill {
                color: #ff6b6b !important;
            }
            
            .category-select-all:hover {
                text-decoration: underline;
            }
        </style>
        <?php
    }
    
    /**
     * Save resume skills meta data
     */
    public function save_meta_data($post_id) {
        // Check if nonce is valid
        if (!isset($_POST['rae_resume_skills_nonce_field']) || 
            !wp_verify_nonce($_POST['rae_resume_skills_nonce_field'], 'rae_resume_skills_nonce')) {
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
        
        // Only save for resume post type
        if (get_post_type($post_id) !== 'resume') {
            return;
        }
        
        // Save related skills
        if (isset($_POST['resume_related_skills']) && is_array($_POST['resume_related_skills'])) {
            $skill_ids = array_map('intval', $_POST['resume_related_skills']);
            // Validate that all IDs are valid skill posts
            $validated_skills = array();
            foreach ($skill_ids as $skill_id) {
                $skill_post = get_post($skill_id);
                if ($skill_post && $skill_post->post_type === 'skill' && $skill_post->post_status === 'publish') {
                    $validated_skills[] = $skill_id;
                }
            }
            update_post_meta($post_id, '_resume_related_skills', $validated_skills);
        } else {
            // No skills selected, save empty array
            update_post_meta($post_id, '_resume_related_skills', array());
        }
    }
}