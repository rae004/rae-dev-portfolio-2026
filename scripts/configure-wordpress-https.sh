#!/bin/bash

# WordPress HTTPS Configuration Script for CloudFront
# This script configures WordPress to use HTTPS URLs via CloudFront

set -euo pipefail

# Configuration variables
HTTPS_DOMAIN="https://api-dev.rae-dev.com"
WP_ROOT="/opt/bitnami/wordpress"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as bitnami user or with sudo
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root. This is OK for this script."
    elif [[ $(whoami) == "bitnami" ]]; then
        log "Running as bitnami user. Will use sudo for WordPress commands."
    else
        error "Please run this script as bitnami user or with sudo privileges"
        exit 1
    fi
}

# Check if WP-CLI is available
check_wp_cli() {
    if command -v wp >/dev/null 2>&1; then
        success "WP-CLI is available"
        wp --version --allow-root 2>/dev/null || wp --version
    else
        error "WP-CLI not found. Please ensure WordPress is properly installed."
        exit 1
    fi
}

# Navigate to WordPress directory
setup_environment() {
    log "Setting up environment..."
    
    if [[ -d "$WP_ROOT" ]]; then
        cd "$WP_ROOT"
        success "Changed to WordPress directory: $WP_ROOT"
    else
        error "WordPress directory not found: $WP_ROOT"
        error "Please verify your WordPress installation path"
        exit 1
    fi
}

# Display current WordPress configuration
show_current_config() {
    log "Current WordPress URL configuration:"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if command -v wp >/dev/null 2>&1; then
        HOME_URL=$(sudo wp option get home --allow-root 2>/dev/null || echo "Failed to retrieve")
        SITE_URL=$(sudo wp option get siteurl --allow-root 2>/dev/null || echo "Failed to retrieve")
        
        echo "Current Home URL:    $HOME_URL"
        echo "Current Site URL:    $SITE_URL"
        
        if [[ "$HOME_URL" == *"https://"* ]] && [[ "$SITE_URL" == *"https://"* ]]; then
            success "URLs are already configured for HTTPS"
        else
            warning "URLs are using HTTP - need to update to HTTPS"
        fi
    else
        error "Cannot retrieve current URLs - WP-CLI not available"
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Check for wp-config.php constants that might override database settings
check_wp_config_constants() {
    log "Checking wp-config.php for URL constants..."
    
    if [[ -f "wp-config.php" ]]; then
        # Check for existing WP_HOME and WP_SITEURL constants
        if grep -q "define.*WP_HOME" wp-config.php; then
            warning "Found WP_HOME constant in wp-config.php - this overrides database settings"
            # Comment out existing WP_HOME
            sudo sed -i.bak 's/^\([^#]*define.*WP_HOME.*\)/\/\/ \1/' wp-config.php && success "Commented out WP_HOME constant"
        fi
        
        if grep -q "define.*WP_SITEURL" wp-config.php; then
            warning "Found WP_SITEURL constant in wp-config.php - this overrides database settings"
            # Comment out existing WP_SITEURL
            sudo sed -i.bak 's/^\([^#]*define.*WP_SITEURL.*\)/\/\/ \1/' wp-config.php && success "Commented out WP_SITEURL constant"
        fi
        
        # Add HTTPS detection for when behind CloudFront
        if ! grep -q "HTTP_X_FORWARDED_PROTO" wp-config.php; then
            log "Adding CloudFront HTTPS detection to wp-config.php..."
            
            # Add after the opening PHP tag but before database settings
            sudo sed -i.bak '/<?php/a\
\
// CloudFront HTTPS detection - must be early in wp-config.php\
if (isset($_SERVER['\''HTTP_X_FORWARDED_PROTO'\'']) && $_SERVER['\''HTTP_X_FORWARDED_PROTO'\''] === '\''https'\'') {\
    $_SERVER['\''HTTPS'\''] = '\''on'\'';\
    $_SERVER['\''SERVER_PORT'\''] = 443;\
}\
if (isset($_SERVER['\''HTTP_X_FORWARDED_HOST'\''])) {\
    $_SERVER['\''HTTP_HOST'\''] = $_SERVER['\''HTTP_X_FORWARDED_HOST'\''];\
}\
\
// Force WordPress to recognize HTTPS when behind CloudFront\
if (isset($_SERVER['\''HTTP_X_FORWARDED_PROTO'\'']) && $_SERVER['\''HTTP_X_FORWARDED_PROTO'\''] === '\''https'\'') {\
    define('\''FORCE_SSL_ADMIN'\'', true);\
    $env_https = '\''on'\'';\
}\
' wp-config.php && success "Added CloudFront HTTPS detection"
        else
            log "CloudFront HTTPS detection already exists in wp-config.php"
            # Update existing detection to be more comprehensive
            warning "Updating existing CloudFront detection..."
            sudo sed -i.bak '/CloudFront HTTPS detection/,+8d' wp-config.php
            sudo sed -i.bak '/<?php/a\
\
// CloudFront HTTPS detection - must be early in wp-config.php\
if (isset($_SERVER['\''HTTP_X_FORWARDED_PROTO'\'']) && $_SERVER['\''HTTP_X_FORWARDED_PROTO'\''] === '\''https'\'') {\
    $_SERVER['\''HTTPS'\''] = '\''on'\'';\
    $_SERVER['\''SERVER_PORT'\''] = 443;\
}\
if (isset($_SERVER['\''HTTP_X_FORWARDED_HOST'\''])) {\
    $_SERVER['\''HTTP_HOST'\''] = $_SERVER['\''HTTP_X_FORWARDED_HOST'\''];\
}\
\
// Force WordPress to recognize HTTPS when behind CloudFront\
if (isset($_SERVER['\''HTTP_X_FORWARDED_PROTO'\'']) && $_SERVER['\''HTTP_X_FORWARDED_PROTO'\''] === '\''https'\'') {\
    define('\''FORCE_SSL_ADMIN'\'', true);\
    $env_https = '\''on'\'';\
}\
' wp-config.php && success "Updated CloudFront HTTPS detection"
        fi
        
        success "wp-config.php constants checked and updated"
    else
        warning "wp-config.php not found in current directory"
    fi
}

# Update WordPress URLs to use HTTPS
update_wordpress_urls() {
    log "Updating WordPress URLs to: $HTTPS_DOMAIN"
    
    # Show current URLs before update
    log "Current URLs before update:"
    CURRENT_HOME=$(sudo wp option get home --allow-root 2>/dev/null || echo "unknown")
    CURRENT_SITE=$(sudo wp option get siteurl --allow-root 2>/dev/null || echo "unknown")
    echo "  Home URL: $CURRENT_HOME"
    echo "  Site URL: $CURRENT_SITE"
    
    # Check WordPress database connection first
    log "Testing WordPress database connection..."
    if ! wp db check --allow-root >/dev/null 2>&1; then
        error "WordPress database connection failed"
        log "Attempting to restart MySQL service..."
        sudo /opt/bitnami/ctlscript.sh restart mysql
        sleep 5
        if ! wp db check --allow-root >/dev/null 2>&1; then
            error "Database still not accessible after MySQL restart"
            return 1
        fi
        success "Database connection restored"
    else
        success "Database connection OK"
    fi
    
    # Update home URL
    log "Updating home URL..."
    if wp option update home "$HTTPS_DOMAIN" --allow-root; then
        success "Updated home URL to $HTTPS_DOMAIN"
    else
        warning "WP-CLI option update failed, trying direct database update..."
        
        # Get database credentials from wp-config.php
        DB_NAME=$(grep "DB_NAME" wp-config.php | cut -d "'" -f 4)
        DB_USER=$(grep "DB_USER" wp-config.php | cut -d "'" -f 4)
        DB_PASSWORD=$(grep "DB_PASSWORD" wp-config.php | cut -d "'" -f 4)
        DB_PREFIX=$(grep "table_prefix" wp-config.php | cut -d "'" -f 2)
        
        log "Database info: DB=$DB_NAME, User=$DB_USER, Prefix=$DB_PREFIX"
        
        # Try direct database update
        if mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "UPDATE ${DB_PREFIX}options SET option_value = '$HTTPS_DOMAIN' WHERE option_name = 'home';"; then
            success "Updated home URL via direct database query"
        else
            error "Failed to update home URL via database"
            return 1
        fi
    fi
    
    # Update site URL
    log "Updating site URL..."
    if wp option update siteurl "$HTTPS_DOMAIN" --allow-root; then
        success "Updated site URL to $HTTPS_DOMAIN"
    else
        warning "WP-CLI siteurl update failed, trying direct database update..."
        
        # Try direct database update for siteurl
        if mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "UPDATE ${DB_PREFIX}options SET option_value = '$HTTPS_DOMAIN' WHERE option_name = 'siteurl';"; then
            success "Updated site URL via direct database query"
        else
            error "Failed to update site URL via database"
            return 1
        fi
    fi
    
    # Enable SSL admin
    log "Enabling FORCE_SSL_ADMIN..."
    if sudo wp option update FORCE_SSL_ADMIN 1 --allow-root; then
        success "Enabled FORCE_SSL_ADMIN"
    else
        warning "Failed to set FORCE_SSL_ADMIN (this may be OK)"
    fi
    
    # Also update any additional URL-related options that might exist
    log "Checking for additional URL options..."
    
    # Some WordPress installations have these additional options
    sudo wp option update WP_HOME "$HTTPS_DOMAIN" --allow-root 2>/dev/null && success "Updated WP_HOME" || true
    sudo wp option update WP_SITEURL "$HTTPS_DOMAIN" --allow-root 2>/dev/null && success "Updated WP_SITEURL" || true
    
    # Check for wp-config.php constants that might override database settings
    check_wp_config_constants
    
    # Force WordPress to regenerate .htaccess with HTTPS URLs
    sudo wp rewrite flush --allow-root 2>/dev/null && success "Flushed rewrite rules" || warning "Could not flush rewrite rules"
    
    # Restart Apache to ensure new wp-config.php settings take effect
    log "Restarting Apache to apply wp-config.php changes..."
    if sudo /opt/bitnami/ctlscript.sh restart apache >/dev/null 2>&1; then
        success "Apache restarted successfully"
    else
        warning "Could not restart Apache (this may be OK)"
    fi
    
    # Verify URLs were actually updated
    log "Verifying URL updates..."
    UPDATED_HOME=$(sudo wp option get home --allow-root 2>/dev/null || echo "unknown")
    UPDATED_SITE=$(sudo wp option get siteurl --allow-root 2>/dev/null || echo "unknown")
    
    if [[ "$UPDATED_HOME" == "$HTTPS_DOMAIN" ]] && [[ "$UPDATED_SITE" == "$HTTPS_DOMAIN" ]]; then
        success "URL updates verified successfully!"
    else
        error "URL updates failed verification:"
        echo "  Expected: $HTTPS_DOMAIN"
        echo "  Home URL: $UPDATED_HOME"
        echo "  Site URL: $UPDATED_SITE"
        return 1
    fi
}

# Create health check endpoint
create_health_check() {
    log "Creating health check endpoint..."
    
    cat > health-check.php << 'EOF'
<?php
/**
 * WordPress Health Check Endpoint for CloudFront
 * Provides status information about WordPress configuration
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$health = [
    'status' => 'ok',
    'timestamp' => date('c'),
    'server_ip' => $_SERVER['SERVER_ADDR'] ?? 'unknown',
    'client_ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
];

// Check WordPress installation
if (file_exists('wp-config.php')) {
    $health['wordpress'] = 'detected';
    
    // Load WordPress to get configuration
    define('WP_USE_THEMES', false);
    require_once('wp-load.php');
    
    $health['wordpress_home'] = get_option('home');
    $health['wordpress_siteurl'] = get_option('siteurl');
    $health['https_configured'] = (strpos(get_option('home'), 'https://') === 0);
    $health['ssl_admin_enabled'] = get_option('FORCE_SSL_ADMIN') ? true : false;
    
    // Check if URLs match expected HTTPS domain
    $expected_domain = 'https://api-dev.rae-dev.com';
    $health['urls_correctly_configured'] = (
        get_option('home') === $expected_domain && 
        get_option('siteurl') === $expected_domain
    );
    
} else {
    $health['wordpress'] = 'missing';
    $health['status'] = 'error';
}

http_response_code($health['status'] === 'ok' ? 200 : 503);
echo json_encode($health, JSON_PRETTY_PRINT);
?>
EOF

    # Set proper permissions
    if sudo chown bitnami:bitnami health-check.php 2>/dev/null; then
        success "Set ownership for health-check.php"
    else
        warning "Could not set ownership for health-check.php (this may be OK)"
    fi
    
    if chmod 644 health-check.php; then
        success "Set permissions for health-check.php"
    else
        warning "Could not set permissions for health-check.php"
    fi
    
    success "Created health check endpoint"
}

# Clear WordPress caches
clear_caches() {
    log "Clearing WordPress caches..."
    
    if sudo wp cache flush --allow-root >/dev/null 2>&1; then
        success "WordPress cache cleared"
    else
        warning "Could not clear WordPress cache (this may be OK)"
    fi
    
    # Clear any object cache if it exists
    if sudo wp transient delete --all --allow-root >/dev/null 2>&1; then
        success "WordPress transients cleared"
    else
        warning "Could not clear transients (this may be OK)"
    fi
}

# Verify the configuration
verify_configuration() {
    log "Verifying WordPress configuration..."
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    HOME_URL=$(sudo wp option get home --allow-root)
    SITE_URL=$(sudo wp option get siteurl --allow-root)
    SSL_ADMIN=$(sudo wp option get FORCE_SSL_ADMIN --allow-root 2>/dev/null || echo "0")
    
    echo "Updated Home URL:     $HOME_URL"
    echo "Updated Site URL:     $SITE_URL"
    echo "Force SSL Admin:      $SSL_ADMIN"
    
    if [[ "$HOME_URL" == "$HTTPS_DOMAIN" ]] && [[ "$SITE_URL" == "$HTTPS_DOMAIN" ]]; then
        success "WordPress URLs are correctly configured for HTTPS!"
    else
        error "WordPress URLs are not correctly configured"
        return 1
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Display test URLs
show_test_urls() {
    log "Configuration complete! Test these URLs:"
    
    echo ""
    echo "🔗 Test URLs:"
    echo "   Health Check:    https://api-dev.rae-dev.com/health-check.php"
    echo "   WordPress Admin: https://api-dev.rae-dev.com/wp-admin/"
    echo "   WordPress Site:  https://api-dev.rae-dev.com/"
    echo ""
    echo "🔍 What to look for:"
    echo "   • Health check should return JSON with 'https_configured': true"
    echo "   • WordPress admin should load with HTTPS URLs for CSS/JS"
    echo "   • No mixed content warnings in browser console"
    echo ""
    echo "🚨 If there are still issues:"
    echo "   • Wait 2-3 minutes for CloudFront cache to update"
    echo "   • Clear your browser cache"
    echo "   • Check browser developer tools for mixed content errors"
    echo ""
}

# Troubleshooting function
show_troubleshooting() {
    log "Troubleshooting commands (run these if issues persist):"
    
    echo ""
    echo "📋 Check WordPress database:"
    echo "   sudo wp db check --allow-root"
    echo ""
    echo "📋 List all URL-related options:"
    echo "   sudo wp option list --search='*url*' --allow-root"
    echo ""
    echo "📋 Check WordPress core:"
    echo "   sudo wp core version --allow-root"
    echo ""
    echo "📋 Restart web services:"
    echo "   sudo /opt/bitnami/ctlscript.sh restart apache"
    echo "   sudo /opt/bitnami/ctlscript.sh restart mysql"
    echo ""
}

# Main execution
main() {
    echo ""
    echo "🌐 WordPress HTTPS Configuration Script"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "This script will configure WordPress to use HTTPS URLs"
    echo "Target domain: $HTTPS_DOMAIN"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Run configuration steps
    check_permissions
    check_wp_cli
    setup_environment
    show_current_config
    
    echo ""
    read -p "Do you want to continue with HTTPS configuration? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Configuration cancelled by user"
        exit 0
    fi
    
    echo ""
    log "Starting WordPress HTTPS configuration..."
    
    update_wordpress_urls
    create_health_check  
    clear_caches
    verify_configuration
    
    echo ""
    success "WordPress HTTPS configuration completed successfully!"
    
    show_test_urls
    show_troubleshooting
}

# Run the script
main "$@"