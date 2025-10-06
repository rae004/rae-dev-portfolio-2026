<?php
/**
 * Main template file for Rae Portfolio Theme
 * This is a headless WordPress installation - frontend is served by React
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

get_header(); ?>

<div style="max-width: 800px; margin: 40px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; border-bottom: 3px solid #00a0d2; padding-bottom: 10px;">
        🚀 Rae Portfolio - Headless WordPress CMS
    </h1>
    
    <div style="background: #f0f8ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <h2 style="margin-top: 0; color: #0073aa;">System Status</h2>
        <p><strong>WordPress:</strong> <?php echo get_bloginfo('version'); ?></p>
        <p><strong>PHP:</strong> <?php echo PHP_VERSION; ?></p>
        <p><strong>Theme:</strong> Rae Portfolio Theme v1.0</p>
        <p><strong>REST API:</strong> <a href="<?php echo rest_url('wp/v2/'); ?>" target="_blank">Available</a></p>
    </div>

    <div style="background: #fff8e1; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <h2 style="margin-top: 0; color: #f57900;">Custom Post Types</h2>
        <ul>
            <li><strong>Resume Items:</strong> <a href="<?php echo admin_url('edit.php?post_type=resume'); ?>">Manage Resume</a> | <a href="<?php echo rest_url('wp/v2/resume'); ?>" target="_blank">API Endpoint</a></li>
            <li><strong>Software Projects:</strong> <a href="<?php echo admin_url('edit.php?post_type=software-project'); ?>">Manage Projects</a> | <a href="<?php echo rest_url('wp/v2/software-projects'); ?>" target="_blank">API Endpoint</a></li>
            <li><strong>Media Projects:</strong> <a href="<?php echo admin_url('edit.php?post_type=media-project'); ?>">Manage Media</a> | <a href="<?php echo rest_url('wp/v2/media-projects'); ?>" target="_blank">API Endpoint</a></li>
            <li><strong>Blog Posts:</strong> <a href="<?php echo admin_url('edit.php'); ?>">Manage Posts</a> | <a href="<?php echo rest_url('wp/v2/posts'); ?>" target="_blank">API Endpoint</a></li>
        </ul>
    </div>

    <div style="background: #e8f5e8; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <h2 style="margin-top: 0; color: #2e7d32;">Frontend Development</h2>
        <p><strong>React Frontend:</strong> <a href="http://localhost:5173" target="_blank">http://localhost:5173</a></p>
        <p><strong>WordPress Admin:</strong> <a href="<?php echo admin_url(); ?>">Access Admin Dashboard</a></p>
        <p><strong>phpMyAdmin:</strong> <a href="http://localhost:8081" target="_blank">http://localhost:8081</a></p>
    </div>

    <div style="background: #f3e5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <h2 style="margin-top: 0; color: #7b1fa2;">Quick Actions</h2>
        <p>
            <a href="<?php echo admin_url('post-new.php?post_type=resume'); ?>" style="margin-right: 10px;">+ Add Resume Item</a>
            <a href="<?php echo admin_url('post-new.php?post_type=software-project'); ?>" style="margin-right: 10px;">+ Add Software Project</a>
            <a href="<?php echo admin_url('post-new.php?post_type=media-project'); ?>" style="margin-right: 10px;">+ Add Media Project</a>
            <a href="<?php echo admin_url('post-new.php'); ?>">+ Add Blog Post</a>
        </p>
    </div>
</div>

<?php get_footer(); ?>