# WordPress CloudFront HTTPS Troubleshooting Quick Reference

## 🚨 Emergency Commands

### WordPress Not Loading
```bash
# Check instance status
aws lightsail get-instances --profile rae_dev --query 'instances[?contains(name, `rae-portfolio-wp-dev`)].[name,state.name,publicIpAddress]' --output table

# Emergency direct access
ssh -i /path/to/your-key.pem bitnami@44.216.72.226
sudo /opt/bitnami/ctlscript.sh status
```

### Mixed Content Warnings Fix
```bash
# 1. Test health check
curl -s "https://api-dev.rae-dev.com/health-check.php" | jq '.https_configured, .urls_correctly_configured'

# 2. If false, deploy fixed wp-config.php
scp -i /path/to/your-key.pem claude-working-wp-config.php bitnami@44.216.72.226:/tmp/wp-config.php
ssh -i /path/to/your-key.pem bitnami@44.216.72.226 "sudo cp /tmp/wp-config.php /opt/bitnami/wordpress/wp-config.php && sudo /opt/bitnami/ctlscript.sh restart apache"
```

### Database URL Cleanup
```bash
# Fix HTTP URLs in database
ssh -i /path/to/your-key.pem bitnami@44.216.72.226
sudo -u root wp search-replace 'http://api-dev.rae-dev.com' 'https://api-dev.rae-dev.com' --allow-root --path=/opt/bitnami/wordpress
sudo -u root wp search-replace 'http://44.216.72.226' 'https://api-dev.rae-dev.com' --allow-root --path=/opt/bitnami/wordpress
```

## 📊 Health Check Interpretation

### Perfect Configuration ✅
```json
{
  "https_configured": true,
  "urls_correctly_configured": true,
  "wordpress_home": "https://api-dev.rae-dev.com",
  "wordpress_siteurl": "https://api-dev.rae-dev.com"
}
```

### Common Issues ❌

#### wp-config.php Not Updated
```json
{
  "https_configured": false,
  "wordpress_home": "http://api-dev.rae-dev.com"
}
```
**Fix**: Deploy claude-working-wp-config.php

#### Database URLs Wrong  
```json
{
  "wp_home_constant": "https://api-dev.rae-dev.com",
  "wordpress_home": "http://api-dev.rae-dev.com"
}
```
**Fix**: Run database search-replace commands

## 🔧 Common Fixes

### 1. WordPress Admin Broken (Mixed Content)
```bash
# Verify asset URLs are HTTPS
curl -L -s "https://api-dev.rae-dev.com/wp-admin/" | grep -E 'href=.*\.css|src=.*\.js' | head -3

# Should show: https://api-dev.rae-dev.com/wp-includes/js/...
# If showing HTTP, deploy fixed wp-config.php
```

### 2. CloudFront Distribution Issues
```bash
# Check distribution status
aws cloudfront get-distribution --id E30OWCNPNLLE11 --profile rae_dev --query 'Distribution.Status'

# Check origin configuration
aws cloudfront get-distribution --id E30OWCNPNLLE11 --profile rae_dev --query 'Distribution.DistributionConfig.Origins.Items[0].CustomHeaders'
```

### 3. Static IP Not Attached
```bash
# Check attachment
aws lightsail get-static-ip --static-ip-name rae-portfolio-wp-ip-dev --profile rae_dev

# Manual attach if needed
aws lightsail attach-static-ip --static-ip-name rae-portfolio-wp-ip-dev --instance-name rae-portfolio-wp-dev --profile rae_dev
```

## 📝 Log Files

### WordPress Setup Log
```bash
ssh -i /path/to/your-key.pem bitnami@44.216.72.226
sudo tail -50 /var/log/wordpress-setup.log
```

### Apache Error Log
```bash
sudo tail -20 /opt/bitnami/apache/logs/error_log
```

### CloudFormation Events
```bash
aws cloudformation describe-stack-events --stack-name RaePortfolioDev --profile rae_dev --query 'StackEvents[?contains(ResourceStatus, `FAILED`)]'
```

## 🎯 Validation Commands

### End-to-End Test
```bash
# 1. DNS resolution
dig +short api-dev.rae-dev.com

# 2. SSL certificate
echo | openssl s_client -connect api-dev.rae-dev.com:443 2>/dev/null | openssl x509 -noout -subject

# 3. WordPress health
curl -s "https://api-dev.rae-dev.com/health-check.php" | jq '.status'

# 4. Admin accessibility  
curl -I "https://api-dev.rae-dev.com/wp-admin/" | head -3
```

### Performance Check
```bash
# Page load time
curl -w "Connect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" -o /dev/null -s "https://api-dev.rae-dev.com/"

# Cache status
curl -I "https://api-dev.rae-dev.com/" | grep -i cache
```

## 🔄 Deployment Recovery

### Complete Re-deployment
```bash
cd infrastructure
npm run build
npm run cdk deploy RaePortfolioDev -- --profile rae_dev --require-approval never
```

### Rollback wp-config.php
```bash
ssh -i /path/to/your-key.pem bitnami@44.216.72.226
sudo cp /opt/bitnami/wordpress/wp-config.php.original /opt/bitnami/wordpress/wp-config.php
sudo /opt/bitnami/ctlscript.sh restart apache
```

## 💡 Success Indicators

1. ✅ Health check returns `https_configured: true`
2. ✅ WordPress admin loads without browser warnings
3. ✅ All assets load over HTTPS (check browser DevTools)
4. ✅ SSL Labs test shows A+ rating
5. ✅ Page loads in < 2 seconds globally

## 📞 Emergency Contacts

- **Direct IP Access**: http://44.216.72.226/wp-admin/ (bypasses CloudFront)
- **Database Access**: phpMyAdmin at http://44.216.72.226/phpmyadmin/ (if enabled)
- **SSH Access**: bitnami@44.216.72.226 (requires private key)

## 🔐 Security Notes

- Default WordPress credentials: `user` / `bitnami` (change immediately)
- SSH key location: `/Users/rae004/Desktop/portfolio-dev-us-east-1.pem`
- Never commit private keys or passwords to git
- Rotate SSH keys quarterly