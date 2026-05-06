# WordPress HTTPS Configuration Scripts

This directory contains scripts to configure WordPress for HTTPS when using CloudFront SSL termination.

## Overview

When deploying WordPress behind CloudFront with SSL certificates, the WordPress instance serves HTTP traffic while CloudFront handles HTTPS termination. This requires manual configuration of WordPress URLs to prevent mixed content issues.

## Scripts Available

### `configure-wordpress-https.sh`

**Purpose**: Manually configure WordPress to use HTTPS URLs via CloudFront

**When to Use**: 
- When automated user data script fails to configure WordPress URLs
- After deploying infrastructure and WordPress is still serving HTTP assets
- When you see mixed content warnings in browser console

## Prerequisites

Before running the script:

1. **AWS Infrastructure Deployed**: Ensure your CDK stack is deployed with:
   - LightSail WordPress instance running
   - CloudFront distribution configured
   - Static IP attached to WordPress instance
   - DNS records pointing to CloudFront

2. **SSH Access**: You need SSH access to the WordPress LightSail instance:
   ```bash
   # Download SSH key from AWS Console or use existing key
   chmod 400 /path/to/your-lightsail-key.pem
   ```

3. **Instance Information**: Know your WordPress instance's public IP address

## Usage Instructions

### Step 1: SSH into WordPress Instance

```bash
# Replace with your actual key path and IP address
ssh -i /path/to/your-lightsail-key.pem bitnami@YOUR_INSTANCE_IP
```

### Step 2: Transfer the Script

Option A - Copy/paste the script content:
```bash
# On the WordPress instance
nano configure-wordpress-https.sh
# Paste the script content and save
chmod +x configure-wordpress-https.sh
```

Option B - Transfer via SCP:
```bash
# From your local machine
scp -i /path/to/your-lightsail-key.pem ./scripts/configure-wordpress-https.sh bitnami@YOUR_INSTANCE_IP:~/
```

### Step 3: Run the Script

```bash
# On the WordPress instance
./configure-wordpress-https.sh
```

The script will:
1. Show current WordPress URL configuration
2. Ask for confirmation before making changes
3. Update WordPress URLs to use HTTPS
4. Create health check endpoint
5. Clear WordPress caches
6. Verify the configuration
7. Provide test URLs and troubleshooting info

## Expected Output

```
🌐 WordPress HTTPS Configuration Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This script will configure WordPress to use HTTPS URLs
Target domain: https://api-dev.rae-dev.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[2024-01-13 10:30:15] Setting up environment...
✓ Changed to WordPress directory: /opt/bitnami/wordpress
[2024-01-13 10:30:16] Current WordPress URL configuration:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current Home URL:    http://98.91.91.176/
Current Site URL:    http://98.91.91.176/
⚠ URLs are using HTTP - need to update to HTTPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Do you want to continue with HTTPS configuration? (y/N): y

[2024-01-13 10:30:20] Starting WordPress HTTPS configuration...
[2024-01-13 10:30:21] Updating WordPress URLs to: https://api-dev.rae-dev.com
✓ Updated home URL to https://api-dev.rae-dev.com
✓ Updated site URL to https://api-dev.rae-dev.com
✓ Enabled FORCE_SSL_ADMIN
[2024-01-13 10:30:22] Creating health check endpoint...
✓ Created health check endpoint
[2024-01-13 10:30:23] Clearing WordPress caches...
✓ WordPress cache cleared
✓ WordPress transients cleared
[2024-01-13 10:30:24] Verifying WordPress configuration...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Updated Home URL:     https://api-dev.rae-dev.com
Updated Site URL:     https://api-dev.rae-dev.com
Force SSL Admin:      1
✓ WordPress URLs are correctly configured for HTTPS!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ WordPress HTTPS configuration completed successfully!

🔗 Test URLs:
   Health Check:    https://api-dev.rae-dev.com/health-check.php
   WordPress Admin: https://api-dev.rae-dev.com/wp-admin/
   WordPress Site:  https://api-dev.rae-dev.com/

🔍 What to look for:
   • Health check should return JSON with 'https_configured': true
   • WordPress admin should load with HTTPS URLs for CSS/JS
   • No mixed content warnings in browser console
```

## Testing the Configuration

After running the script, test these URLs:

### 1. Health Check Endpoint
```bash
curl -s "https://api-dev.rae-dev.com/health-check.php" | jq
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-13T15:30:25+00:00",
  "server_ip": "98.91.91.176",
  "client_ip": "1.2.3.4",
  "wordpress": "detected",
  "wordpress_home": "https://api-dev.rae-dev.com",
  "wordpress_siteurl": "https://api-dev.rae-dev.com",
  "https_configured": true,
  "ssl_admin_enabled": true,
  "urls_correctly_configured": true
}
```

### 2. WordPress Admin
Visit `https://api-dev.rae-dev.com/wp-admin/` in your browser:
- Should load without mixed content warnings
- CSS and JS files should load over HTTPS
- Check browser developer tools for any HTTP resource warnings

### 3. Frontend API Integration
Test your React frontend API calls:
```bash
curl -s "https://api-dev.rae-dev.com/?rest_route=/wp/v2/posts" | jq '.[] | .title'
```

## Troubleshooting

### Common Issues

**1. Permission Denied**
```bash
chmod +x configure-wordpress-https.sh
sudo ./configure-wordpress-https.sh
```

**2. WP-CLI Not Found**
```bash
# Check WP-CLI availability
which wp
wp --version

# If missing, WP-CLI should be pre-installed in Bitnami WordPress
```

**3. MySQL Connection Errors**
```bash
# Check MySQL service
sudo /opt/bitnami/ctlscript.sh status mysql
sudo /opt/bitnami/ctlscript.sh restart mysql
```

**4. Still Getting HTTP Assets**
- Clear browser cache completely
- Wait 2-3 minutes for CloudFront cache invalidation
- Check WordPress database directly:
```bash
sudo wp db query "SELECT option_name, option_value FROM wp_options WHERE option_name IN ('home', 'siteurl');" --allow-root
```

### Manual Verification Commands

If the script fails, run these commands individually:

```bash
# Check current WordPress URLs
sudo wp option get home --allow-root
sudo wp option get siteurl --allow-root

# Update URLs manually
sudo wp option update home "https://api-dev.rae-dev.com" --allow-root
sudo wp option update siteurl "https://api-dev.rae-dev.com" --allow-root

# Enable SSL for admin
sudo wp option update FORCE_SSL_ADMIN 1 --allow-root

# Clear caches
sudo wp cache flush --allow-root
sudo wp transient delete --all --allow-root
```

## Configuration Details

### WordPress URL Settings Updated

| Setting | Value | Purpose |
|---------|-------|---------|
| `home` | `https://api-dev.rae-dev.com` | Frontend site URL |
| `siteurl` | `https://api-dev.rae-dev.com` | WordPress installation URL |
| `FORCE_SSL_ADMIN` | `1` | Force HTTPS for admin area |

### Files Created

- `health-check.php` - Health monitoring endpoint for CloudFront
- WordPress database options updated to use HTTPS URLs

## Integration with Infrastructure

This script complements the AWS CDK infrastructure in `/infrastructure/`:

- **LightSail Instance**: WordPress serves HTTP on port 80
- **CloudFront Distribution**: Terminates SSL and forwards to LightSail
- **Route 53**: DNS points `api-dev.rae-dev.com` to CloudFront
- **ACM Certificate**: Provides SSL certificate for CloudFront

## Security Notes

- Script requires `sudo` privileges for WordPress modifications
- All WordPress admin access is forced to use HTTPS
- Health check endpoint provides minimal system information
- No sensitive information is logged or exposed

## Support

If you encounter issues:

1. Check the full script output for specific error messages
2. Verify AWS infrastructure is properly deployed
3. Confirm CloudFront distribution is active and healthy
4. Test direct IP access: `http://YOUR_INSTANCE_IP/wp-admin/`
5. Review WordPress error logs: `/opt/bitnami/wordpress/wp-content/debug.log`

For additional debugging, the script provides detailed troubleshooting commands and test URLs.