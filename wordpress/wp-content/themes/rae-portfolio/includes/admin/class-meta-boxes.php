<?php
/**
 * Meta Boxes Manager
 * Central manager for all meta box functionality
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class RAE_Meta_Boxes {
    
    /**
     * Constructor
     */
    public function __construct() {
        // Employment dates meta box is handled by its own class
        // Skills meta boxes are handled by their own classes
        // Media project details will be handled by its own class
        
        // Add any global meta box hooks here if needed
        add_action('admin_enqueue_scripts', array($this, 'enqueue_meta_box_scripts'));
    }
    
    /**
     * Enqueue scripts and styles for meta boxes
     */
    public function enqueue_meta_box_scripts($hook) {
        // Only load on post edit pages
        if ('post.php' === $hook || 'post-new.php' === $hook) {
            // Common meta box styles
            wp_add_inline_style('wp-admin', $this->get_meta_box_styles());
            
            // Common meta box scripts
            wp_add_inline_script('jquery', $this->get_meta_box_scripts());
        }
    }
    
    /**
     * Get common meta box styles
     */
    private function get_meta_box_styles() {
        return '
            .rae-meta-box .form-table th {
                width: 150px;
                vertical-align: top;
                padding-top: 10px;
            }
            
            .rae-meta-box .form-table td {
                padding-top: 10px;
            }
            
            .rae-meta-box input[type="text"],
            .rae-meta-box input[type="url"],
            .rae-meta-box input[type="email"],
            .rae-meta-box input[type="date"],
            .rae-meta-box select,
            .rae-meta-box textarea {
                width: 100%;
                max-width: 400px;
                padding: 5px;
                border: 1px solid #ddd;
                border-radius: 3px;
            }
            
            .rae-meta-box textarea {
                height: 80px;
                resize: vertical;
            }
            
            .rae-meta-box .description {
                font-style: italic;
                color: #666;
                margin-top: 5px;
                font-size: 13px;
            }
            
            .rae-meta-box .checkbox-wrapper {
                margin: 5px 0;
            }
            
            .rae-meta-box .checkbox-wrapper input[type="checkbox"] {
                width: auto;
                margin-right: 8px;
            }
            
            .rae-skill-selector {
                max-height: 300px;
                overflow-y: auto;
                border: 1px solid #ddd;
                padding: 10px;
                background: #fafafa;
                border-radius: 3px;
            }
            
            .rae-skill-category {
                margin-bottom: 15px;
            }
            
            .rae-skill-category h4 {
                margin: 0 0 5px 0;
                color: #333;
                font-size: 14px;
            }
            
            .rae-skill-item {
                margin: 3px 0;
                display: block;
            }
            
            .rae-selected-skills {
                margin-bottom: 10px;
                min-height: 40px;
                border: 1px solid #ddd;
                padding: 10px;
                background: #fff;
                border-radius: 3px;
            }
            
            .rae-skill-pill {
                display: inline-block;
                background: #007cba;
                color: white;
                padding: 3px 8px;
                margin: 2px;
                border-radius: 12px;
                font-size: 12px;
                cursor: pointer;
            }
            
            .rae-skill-pill:hover {
                background: #005177;
            }
        ';
    }
    
    /**
     * Get common meta box scripts
     */
    private function get_meta_box_scripts() {
        return '
            // Common meta box utilities
            window.RAE_MetaBox = {
                // Utility function to toggle field visibility
                toggleField: function(checkboxId, fieldId) {
                    jQuery("#" + checkboxId).change(function() {
                        if (jQuery(this).is(":checked")) {
                            jQuery("#" + fieldId).hide();
                        } else {
                            jQuery("#" + fieldId).show();
                        }
                    }).trigger("change");
                },
                
                // Utility function for skill selection
                initSkillSelector: function(containerClass) {
                    jQuery("." + containerClass + " input[type=checkbox]").change(function() {
                        RAE_MetaBox.updateSelectedSkills(containerClass);
                    });
                },
                
                // Update selected skills display
                updateSelectedSkills: function(containerClass) {
                    var selectedSkills = [];
                    jQuery("." + containerClass + " input[type=checkbox]:checked").each(function() {
                        selectedSkills.push(jQuery(this).data("skill-name"));
                    });
                    
                    var html = "";
                    if (selectedSkills.length > 0) {
                        selectedSkills.forEach(function(skill) {
                            html += "<span class=\"rae-skill-pill\">" + skill + "</span>";
                        });
                    } else {
                        html = "<em>No skills selected</em>";
                    }
                    
                    jQuery("." + containerClass + " .rae-selected-skills").html(html);
                }
            };
        ';
    }
}