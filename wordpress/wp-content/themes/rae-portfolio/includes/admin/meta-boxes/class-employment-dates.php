<?php
/**
 * Employment Dates Meta Box
 * Handles the employment dates meta box for resume items
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class RAE_Employment_Dates_Meta_Box {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('add_meta_boxes', array($this, 'add_meta_box'));
        add_action('save_post', array($this, 'save_meta_data'));
    }
    
    /**
     * Add employment dates meta box
     */
    public function add_meta_box() {
        add_meta_box(
            'rae_employment_dates',
            'Employment Dates',
            array($this, 'meta_box_callback'),
            'resume',
            'normal',
            'high'
        );
    }
    
    /**
     * Employment dates meta box callback
     */
    public function meta_box_callback($post) {
        // Add nonce for security
        wp_nonce_field('rae_employment_dates_nonce', 'rae_employment_dates_nonce_field');
        
        // Get current values
        $start_date = get_post_meta($post->ID, '_resume_start_date', true);
        $end_date = get_post_meta($post->ID, '_resume_end_date', true);
        $currently_employed = get_post_meta($post->ID, '_resume_currently_employed', true);
        
        // Get raw dates for HTML5 date input (YYYY-MM-DD format)
        $start_date_raw = get_post_meta($post->ID, '_resume_start_date_raw', true);
        $end_date_raw = get_post_meta($post->ID, '_resume_end_date_raw', true);
        
        // Use raw dates for the form inputs
        $start_date_formatted = $start_date_raw ?: '';
        $end_date_formatted = ($end_date_raw && $end_date !== 'Present') ? $end_date_raw : '';
        
        ?>
        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="resume_start_date">Start Date</label>
                </th>
                <td>
                    <input type="date" 
                           id="resume_start_date" 
                           name="resume_start_date" 
                           value="<?php echo esc_attr($start_date_formatted); ?>" 
                           style="width: 200px;" />
                    <p class="description">Select the employment start date</p>
                </td>
            </tr>
            <tr>
                <th scope="row">
                    <label for="resume_currently_employed">Currently Employed</label>
                </th>
                <td>
                    <input type="checkbox" 
                           id="resume_currently_employed" 
                           name="resume_currently_employed" 
                           value="1" 
                           <?php checked($currently_employed, '1'); ?> />
                    <label for="resume_currently_employed">Check if this is your current position</label>
                </td>
            </tr>
            <tr id="end_date_row">
                <th scope="row">
                    <label for="resume_end_date">End Date</label>
                </th>
                <td>
                    <input type="date" 
                           id="resume_end_date" 
                           name="resume_end_date" 
                           value="<?php echo esc_attr($end_date_formatted); ?>" 
                           style="width: 200px;" />
                    <p class="description">Select the employment end date (leave blank if currently employed)</p>
                </td>
            </tr>
        </table>
        
        <script type="text/javascript">
            jQuery(document).ready(function($) {
                // Function to toggle end date field
                function toggleEndDateField() {
                    var isCurrentlyEmployed = $('#resume_currently_employed').is(':checked');
                    if (isCurrentlyEmployed) {
                        $('#end_date_row').hide();
                        $('#resume_end_date').val('');
                    } else {
                        $('#end_date_row').show();
                    }
                }
                
                // Initial state
                toggleEndDateField();
                
                // On checkbox change
                $('#resume_currently_employed').change(function() {
                    toggleEndDateField();
                });
            });
        </script>
        
        <style>
            .form-table th {
                width: 150px;
            }
            
            .form-table input[type="date"] {
                padding: 5px;
                border: 1px solid #ddd;
                border-radius: 3px;
            }
            
            .form-table .description {
                font-style: italic;
                color: #666;
                margin-top: 5px;
            }
        </style>
        <?php
    }
    
    /**
     * Save employment dates meta data
     */
    public function save_meta_data($post_id) {
        // Check if nonce is valid
        if (!isset($_POST['rae_employment_dates_nonce_field']) || 
            !wp_verify_nonce($_POST['rae_employment_dates_nonce_field'], 'rae_employment_dates_nonce')) {
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
        
        // Save start date
        if (isset($_POST['resume_start_date']) && !empty($_POST['resume_start_date'])) {
            $start_date = sanitize_text_field($_POST['resume_start_date']);
            // Convert to readable format and store
            $start_date_formatted = date('F Y', strtotime($start_date));
            update_post_meta($post_id, '_resume_start_date', $start_date_formatted);
            update_post_meta($post_id, '_resume_start_date_raw', $start_date); // Keep raw date for sorting
        } else {
            delete_post_meta($post_id, '_resume_start_date');
            delete_post_meta($post_id, '_resume_start_date_raw');
        }
        
        // Save currently employed status
        $currently_employed = isset($_POST['resume_currently_employed']) ? '1' : '0';
        update_post_meta($post_id, '_resume_currently_employed', $currently_employed);
        
        // Save end date (only if not currently employed)
        if ($currently_employed === '0' && isset($_POST['resume_end_date']) && !empty($_POST['resume_end_date'])) {
            $end_date = sanitize_text_field($_POST['resume_end_date']);
            // Convert to readable format and store
            $end_date_formatted = date('F Y', strtotime($end_date));
            update_post_meta($post_id, '_resume_end_date', $end_date_formatted);
            update_post_meta($post_id, '_resume_end_date_raw', $end_date); // Keep raw date for sorting
        } else {
            // If currently employed, clear end date and set to "Present"
            if ($currently_employed === '1') {
                update_post_meta($post_id, '_resume_end_date', 'Present');
                delete_post_meta($post_id, '_resume_end_date_raw');
            } else {
                delete_post_meta($post_id, '_resume_end_date');
                delete_post_meta($post_id, '_resume_end_date_raw');
            }
        }
    }
}