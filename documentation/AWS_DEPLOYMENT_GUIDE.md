# AWS WordPress CMS Deployment Guide
**Complete CloudFront + ACM SSL Certificate + Route 53 Setup**

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Troubleshooting](#troubleshooting)
7. [Manual Steps Documentation](#manual-steps-documentation)
8. [Maintenance](#maintenance)

---

## Overview

This guide documents the complete deployment process for a WordPress CMS with:
- **LightSail WordPress Instance** (HTTP backend)
- **CloudFront Distribution** (HTTPS termination)
- **ACM SSL Certificate** (Wildcard certificate)
- **Route 53 DNS** (Custom domain routing)
- **Static IP Attachment** (Automated via Lambda)

**Key Achievement**: Eliminates mixed content warnings by serving all WordPress assets over HTTPS while maintaining cost-effective LightSail hosting.

---

## Prerequisites

### AWS Account Setup
```bash
# Required AWS CLI profile with permissions
aws configure --profile rae_dev

# Required permissions:
# - CloudFormation (full)
# - LightSail (full)
# - CloudFront (full)
# - Route 53 (full)
# - ACM (read)
# - Lambda (create/execute)
# - IAM (limited role creation)
```

### Domain & Certificate Requirements
- **Domain**: Registered and managed in Route 53
- **ACM Certificate**: Wildcard certificate (e.g., `*.rae-dev.com`) in `us-east-1`
- **Certificate ARN**: Store in environment variables

### Local Development Environment
```bash
# Node.js (v18.16.0+ or v22+)
# AWS CDK v2
npm install -g aws-cdk

# Verify CDK installation
cdk version
```

---

## Architecture

### Infrastructure Components

```
┌─────────────────┐    HTTPS     ┌──────────────────┐    HTTP     ┌─────────────────┐
│   User Browser  │ ────────────→ │   CloudFront     │ ──────────→ │   LightSail     │
│                 │              │   Distribution   │             │   WordPress     │
└─────────────────┘              └──────────────────┘             └─────────────────┘
                                          │                                │
                                          │                                │
                                   ┌──────▼──────┐                ┌───────▼────────┐
                                   │     ACM     │                │  Static IP     │
                                   │ Certificate │                │  44.216.72.226 │
                                   └─────────────┘                └────────────────┘
                                          │                                │
                                   ┌──────▼──────┐                ┌───────▼────────┐
                                   │   Route 53  │                │    Lambda      │
                                   │     DNS     │                │  Automation    │
                                   └─────────────┘                └────────────────┘
```

### URL Mapping
- **Frontend**: `https://dev.rae-dev.com` → S3 + CloudFront
- **WordPress API**: `https://api-dev.rae-dev.com` → CloudFront → LightSail HTTP
- **Direct Access**: `http://44.216.72.226/wp-admin/` (fallback)

---

## Deployment Steps

### 1. Environment Configuration

Create `infrastructure/.env`:
```bash
# Infrastructure environment variables
DEV_CERTIFICATE_ARN=arn:aws:acm:us-east-1:233416806179:certificate/da62c8c8-1aa9-4e36-8995-735e93c827f6
DEV_DOMAIN=rae-dev.com
CDK_DEFAULT_ACCOUNT=233416806179
CDK_DEFAULT_REGION=us-east-1
```

### 2. Build and Deploy Infrastructure

```bash
# Navigate to infrastructure directory
cd infrastructure

# Install dependencies
npm install

# Build the CDK project
npm run build

# Deploy to AWS (development environment)
npm run cdk deploy RaePortfolioDev -- --profile rae_dev
```

### 3. Monitor Deployment Progress

**Expected Deployment Time**: 15-20 minutes

**Key Resources Created**:
- LightSail WordPress instance
- Static IP allocation and attachment
- CloudFront distributions (2x)
- Route 53 DNS records
- Lambda functions for automation

### 4. Verify Infrastructure

```bash
# Check LightSail instance status
aws lightsail get-instances --profile rae_dev --query 'instances[?contains(name, `rae-portfolio-wp-dev`)].[name,state.name,publicIpAddress]' --output table

# Check CloudFront distributions
aws cloudfront list-distributions --profile rae_dev --query 'DistributionList.Items[?contains(Comment, `WordPress`)].[Id,DomainName,Comment]' --output table

# Test health endpoint
curl -s "https://api-dev.rae-dev.com/health-check.php" | jq .
```

---

## Post-Deployment Configuration

### WordPress Database URL Updates

**Critical**: The automated user data script should handle this, but manual verification is required.

```bash
# SSH into LightSail instance
ssh -i /path/to/your-key.pem bitnami@44.216.72.226

# Check current WordPress URLs
sudo -u root wp option get home --allow-root --path=/opt/bitnami/wordpress
sudo -u root wp option get siteurl --allow-root --path=/opt/bitnami/wordpress

# Update if needed (should be automated)
sudo -u root wp option update home 'https://api-dev.rae-dev.com' --allow-root --path=/opt/bitnami/wordpress
sudo -u root wp option update siteurl 'https://api-dev.rae-dev.com' --allow-root --path=/opt/bitnami/wordpress

# Search and replace URLs in database content
sudo -u root wp search-replace 'http://api-dev.rae-dev.com' 'https://api-dev.rae-dev.com' --allow-root --path=/opt/bitnami/wordpress
sudo -u root wp search-replace 'http://44.216.72.226' 'https://api-dev.rae-dev.com' --allow-root --path=/opt/bitnami/wordpress
```

### WordPress Admin Access

```bash
# Default credentials (change immediately after first login)
Username: user
Password: bitnami

# Access URLs
WordPress Admin: https://api-dev.rae-dev.com/wp-admin/
Health Check: https://api-dev.rae-dev.com/health-check.php
Direct IP: http://44.216.72.226/wp-admin/ (emergency access)
```

---

## Manual Steps Documentation

### If Automated wp-config.php Setup Fails

**Problem**: User data script may fail to configure wp-config.php properly for CloudFront HTTPS.

**Solution**: Manual wp-config.php deployment

1. **Create optimized wp-config.php locally** (already created as `claude-working-wp-config.php`)

2. **Deploy to server**:
```bash
# Copy file to server
scp -i /path/to/your-key.pem claude-working-wp-config.php bitnami@44.216.72.226:/tmp/wp-config.php

# SSH and replace
ssh -i /path/to/your-key.pem bitnami@44.216.72.226
sudo cp /tmp/wp-config.php /opt/bitnami/wordpress/wp-config.php
sudo chown bitnami:bitnami /opt/bitnami/wordpress/wp-config.php
sudo chmod 644 /opt/bitnami/wordpress/wp-config.php

# Restart Apache
sudo /opt/bitnami/ctlscript.sh restart apache
```

### Key wp-config.php Requirements

The wp-config.php file must include:

```php
// CloudFront HTTPS detection - MUST be at the top
if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
    $_SERVER['HTTPS'] = 'on';
    $_SERVER['SERVER_PORT'] = 443;
    $_SERVER['REQUEST_SCHEME'] = 'https';
}

// Force correct host for CloudFront
if (isset($_SERVER['HTTP_X_FORWARDED_HOST']) && $_SERVER['HTTP_X_FORWARDED_HOST'] === 'api-dev.rae-dev.com') {
    $_SERVER['HTTP_HOST'] = 'api-dev.rae-dev.com';
    $_SERVER['REQUEST_SCHEME'] = 'https';
    $_SERVER['HTTPS'] = 'on';
    $_SERVER['SERVER_PORT'] = 443;
}

// Ensure HTTP_HOST is always set
if (!isset($_SERVER['HTTP_HOST'])) {
    $_SERVER['HTTP_HOST'] = 'api-dev.rae-dev.com';
}

// FORCE HTTPS URLs - Override database options
define( 'WP_HOME', 'https://api-dev.rae-dev.com' );
define( 'WP_SITEURL', 'https://api-dev.rae-dev.com' );
define( 'FORCE_SSL_ADMIN', true );
define( 'WP_CONTENT_URL', 'https://api-dev.rae-dev.com/wp-content' );
```

---

## Troubleshooting

### Mixed Content Warnings

**Symptoms**: 
- Browser console shows "Mixed Content" errors
- CSS/JS files loading over HTTP instead of HTTPS
- WordPress admin appears broken or unstyled

**Diagnosis**:
```bash
# Check health endpoint
curl -s "https://api-dev.rae-dev.com/health-check.php" | jq .

# Should show:
# "https_configured": true
# "urls_correctly_configured": true
# "wordpress_home": "https://api-dev.rae-dev.com"
# "wordpress_siteurl": "https://api-dev.rae-dev.com"
```

**Solution**: Deploy corrected wp-config.php file (see Manual Steps above)

### WordPress Site Not Loading

**Symptoms**: 
- 500 Internal Server Error
- WordPress admin inaccessible
- Health check returns error

**Diagnosis**:
```bash
# Check Apache error log
ssh -i /path/to/your-key.pem bitnami@44.216.72.226
sudo tail -20 /opt/bitnami/apache/logs/error_log

# Check WordPress setup log
sudo tail -20 /var/log/wordpress-setup.log
```

**Common Issues**:
1. **PHP Syntax Error in wp-config.php**: Restore from backup and redeploy
2. **Database Connection Failed**: Check if MySQL service is running
3. **File Permissions**: Ensure bitnami user owns WordPress files

### CloudFront Distribution Issues

**Symptoms**:
- DNS resolution fails
- CloudFront returns "no distribution" errors
- SSL certificate warnings

**Diagnosis**:
```bash
# Check CloudFront distribution status
aws cloudfront get-distribution --id E30OWCNPNLLE11 --profile rae_dev --query 'Distribution.Status'

# Check Route 53 DNS
dig api-dev.rae-dev.com
nslookup api-dev.rae-dev.com
```

### Static IP Attachment Issues

**Symptoms**:
- WordPress accessible via old IP but not static IP
- CloudFront distribution shows origin errors

**Diagnosis**:
```bash
# Check static IP attachment
aws lightsail get-static-ip --static-ip-name rae-portfolio-wp-ip-dev --profile rae_dev

# Check instance details
aws lightsail get-instance --instance-name rae-portfolio-wp-dev --profile rae_dev
```

**Solution**: Manually attach static IP if Lambda automation failed:
```bash
aws lightsail attach-static-ip --static-ip-name rae-portfolio-wp-ip-dev --instance-name rae-portfolio-wp-dev --profile rae_dev
```

---

## Maintenance

### Frontend Deploys

The SPA auto-deploys to S3 + CloudFront whenever release-please cuts a tag on
`main`. The flow is:

1. Merge a conventional-commit PR (squash) into `main`.
2. `release-please.yml` opens a "release PR".
3. Merge the release PR → release-please publishes a `vX.Y.Z` tag and the
   `deploy-frontend-dev` job runs (under the `dev` GitHub Environment), assuming
   the `github-deploy-dev` IAM role via OIDC, syncing `frontend/dist/` to
   `rae-portfolio-dev-233416806179`, invalidating CloudFront, and running a
   `curl` smoke test against `https://dev.rae-dev.com`.

No long-lived AWS keys are stored in GitHub. The role's trust policy is scoped
to `repo:rae004/rae-dev-portfolio-2026:environment:dev`, so only workflow jobs
that explicitly target the `dev` environment can assume it.

### WordPress Theme Deploys (manual)

The repo's custom theme at `wordpress/wp-content/themes/rae-portfolio/` is
**not** auto-deployed. The Lightsail instance is not part of the release flow.
When you bump the theme `Version:` in `style.css` and want it live:

```bash
# from the repo root, with your Lightsail SSH key on hand
rsync -avz --delete \
  --exclude vendor --exclude .composer.lock \
  wordpress/wp-content/themes/rae-portfolio/ \
  bitnami@44.216.72.226:/opt/bitnami/wordpress/wp-content/themes/rae-portfolio/

ssh bitnami@44.216.72.226 \
  'sudo -u root wp cache flush --allow-root --path=/opt/bitnami/wordpress'
```

Plugin and core updates are applied through `wp-admin`. Database content is
hand-curated. Automating theme sync (likely via SSM Run Command, since SSH +
long-lived keys are undesirable) is a future enhancement — see the discussion
in the project's CI/CD planning history.

### Regular Tasks

1. **WordPress Updates**: Monthly security updates
2. **SSL Certificate Renewal**: ACM handles automatically
3. **Static IP Monitoring**: Ensure attachment persists
4. **Health Check Monitoring**: Set up CloudWatch alerts

### Backup Strategy

```bash
# Database backup
ssh -i /path/to/your-key.pem bitnami@44.216.72.226
sudo mysqldump -u root -p bitnami_wordpress > wordpress_backup_$(date +%Y%m%d).sql

# WordPress files backup  
sudo tar -czf wordpress_files_$(date +%Y%m%d).tar.gz /opt/bitnami/wordpress/
```

### Cost Optimization

- **LightSail Instance**: $3.50/month (nano) vs $5/month (micro)
- **CloudFront**: $0.085/GB (first 10TB)
- **Route 53**: $0.50/month per hosted zone
- **Lambda**: Minimal cost for automation functions

### Security Best Practices

1. **Change Default Credentials**: Immediately after deployment
2. **WordPress Security Plugins**: Install security hardening plugins
3. **SSH Key Management**: Rotate SSH keys regularly
4. **WordPress Updates**: Enable automatic security updates
5. **Access Control**: Limit wp-admin access via CloudFront behaviors

---

## Success Validation

### Complete Success Checklist

✅ **Infrastructure Deployed**: CDK stack deployment completed without errors  
✅ **WordPress Accessible**: `https://api-dev.rae-dev.com/wp-admin/` loads without errors  
✅ **HTTPS Enforced**: All assets (CSS, JS, images) load over HTTPS  
✅ **No Mixed Content**: Browser console shows no mixed content warnings  
✅ **Health Check Passes**: `https://api-dev.rae-dev.com/health-check.php` returns `https_configured: true`  
✅ **DNS Resolution**: `api-dev.rae-dev.com` resolves to CloudFront distribution  
✅ **SSL Certificate**: Valid ACM certificate attached with A+ rating  
✅ **Static IP Attached**: WordPress instance has consistent IP address  

### Performance Validation

```bash
# Test page load time
curl -w "@curl-format.txt" -o /dev/null -s "https://api-dev.rae-dev.com/wp-admin/"

# Test global CDN performance
curl -I "https://api-dev.rae-dev.com/wp-admin/" | grep "x-cache"
```

### Final Architecture Verification

```bash
# Verify complete end-to-end flow
echo "1. Testing DNS resolution..."
dig +short api-dev.rae-dev.com

echo "2. Testing HTTPS certificate..."
echo | openssl s_client -connect api-dev.rae-dev.com:443 -servername api-dev.rae-dev.com 2>/dev/null | openssl x509 -noout -subject

echo "3. Testing WordPress response..."
curl -I "https://api-dev.rae-dev.com/" | head -3

echo "4. Testing health endpoint..."
curl -s "https://api-dev.rae-dev.com/health-check.php" | jq '.https_configured, .urls_correctly_configured'
```

---

## Conclusion

This deployment creates a production-ready WordPress CMS with enterprise-grade HTTPS security while maintaining cost-effective hosting. The CloudFront + ACM + LightSail architecture provides:

- **Security**: Full HTTPS encryption with ACM certificates
- **Performance**: Global CDN with HTTP/2 and compression
- **Cost Efficiency**: LightSail pricing vs EC2
- **Reliability**: AWS managed services with 99.9% uptime
- **Scalability**: CloudFront handles traffic spikes automatically

The automated deployment eliminates manual configuration errors and ensures consistent, repeatable infrastructure deployment.