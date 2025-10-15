import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as lightsail from 'aws-cdk-lib/aws-lightsail';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export interface RaePortfolioStackProps extends cdk.StackProps {
  envName: string;
  domainName: string;
  certificateArn?: string;
}

export class RaePortfolioStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RaePortfolioStackProps) {
    super(scope, id, props);

    const { envName, domainName, certificateArn } = props;

    // S3 Bucket for hosting static website
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `rae-portfolio-${envName}-${cdk.Aws.ACCOUNT_ID}`,
      publicReadAccess: false, // Will be accessed through CloudFront only
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: envName !== 'prod',
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [{
        id: 'DeleteOldVersions',
        noncurrentVersionExpiration: cdk.Duration.days(30),
      }],
    });

    // SSL Certificate (if provided)
    let certificate: acm.ICertificate | undefined;
    if (certificateArn) {
      certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', certificateArn);
    }

    // Frontend CloudFront Distribution with Origin Access Control (OAC) - AWS Best Practice
    const apiFqdn = envName === 'prod' ? `api.${domainName}` : `api-dev.${domainName}`;
    const frontendFqdn = envName === 'prod' ? domainName : `${envName}.${domainName}`;
    const frontendDistribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket), // Modern OAC approach
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        compress: true,
      },
      domainNames: certificate ? [frontendFqdn] : undefined,
      certificate,
      defaultRootObject: 'index.html',
      errorResponses: [{
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: cdk.Duration.minutes(5),
      }, {
        httpStatus: 403,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: cdk.Duration.minutes(5),
      }],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe
      enabled: true,
      comment: `Frontend CloudFront distribution for ${frontendFqdn}`,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    // Note: S3BucketOrigin.withOriginAccessControl() automatically handles the bucket policy

    // WordPress LightSail Instance
    const wordpressInstance = new lightsail.CfnInstance(this, 'WordPressInstance', {
      instanceName: `rae-portfolio-wp-${envName}`,
      blueprintId: 'wordpress',
      bundleId: envName === 'prod' ? 'micro_3_0' : 'nano_3_0', // Prod: $5/month, Dev: $3.50/month
      availabilityZone: `${this.region}a`,
      userData: `#!/bin/bash
        # Enhanced WordPress setup script with CloudFront HTTPS configuration
        set -euo pipefail
        
        # Logging setup
        LOG_FILE="/var/log/wordpress-setup.log"
        exec 1> >(tee -a "$LOG_FILE")
        exec 2> >(tee -a "$LOG_FILE" >&2)
        echo "$(date): Starting WordPress setup with HTTPS configuration"
        
        # Set WordPress URL environment variables
        export WP_HOME="https://${apiFqdn}"
        export WP_SITEURL="https://${apiFqdn}"
        echo "WordPress URLs will be set to: $WP_HOME"
        
        # Wait for Bitnami initialization to complete (critical!)
        echo "Waiting for Bitnami services to initialize completely..."
        sleep 300  # 5 minutes for full initialization (increased from 3)
        
        # Auto-detect WordPress directory structure (modern vs legacy Bitnami)
        if [ -d "/opt/bitnami/wordpress" ]; then
            WP_ROOT="/opt/bitnami/wordpress"
            echo "Detected modern Bitnami structure: $WP_ROOT"
        elif [ -d "/opt/bitnami/apps/wordpress/htdocs" ]; then
            WP_ROOT="/opt/bitnami/apps/wordpress/htdocs"
            echo "Detected legacy Bitnami structure: $WP_ROOT"
        else
            echo "ERROR: Could not detect WordPress installation directory"
            exit 1
        fi
        
        # Enhanced service checking with retries
        check_service() {
            local service="$1"
            local max_attempts=10
            for attempt in $(seq 1 $max_attempts); do
                if /opt/bitnami/ctlscript.sh status "$service" | grep -q "already running"; then
                    echo "$service is running (attempt $attempt)"
                    return 0
                fi
                echo "Waiting for $service... (attempt $attempt/$max_attempts)"
                sleep 15
            done
            echo "WARNING: $service failed to start after $max_attempts attempts"
            return 1
        }
        
        # Wait for services to be ready
        echo "Checking Bitnami service status..."
        check_service apache || echo "Apache status check failed"
        check_service mysql || echo "MySQL status check failed"
        
        # Enhanced WordPress accessibility test
        echo "Testing WordPress accessibility..."
        for i in {1..10}; do
            if curl -f -s -o /dev/null "http://localhost/" && curl -f -s -o /dev/null "http://localhost/wp-admin/"; then
                echo "WordPress is accessible via HTTP (attempt $i)"
                break
            elif [ $i -eq 10 ]; then
                echo "WARNING: WordPress not accessible after 10 attempts"
            else
                echo "Attempt $i: WordPress not accessible, waiting 30s..."
                sleep 30
            fi
        done
        
        # Get public IP for logging
        PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
        echo "Public IP: $PUBLIC_IP"
        echo "CloudFront Domain: ${apiFqdn}"
        
        # Enhanced wp-config.php configuration for CloudFront HTTPS
        echo "Configuring wp-config.php for CloudFront HTTPS..."
        cd "$WP_ROOT" || exit 1
        
        # Backup original wp-config.php
        cp wp-config.php wp-config.php.original
        
        # Create CloudFront-optimized wp-config.php
        cat > wp-config-cloudfront.php << 'WPCONFIG'
<?php
// CloudFront HTTPS detection - MUST be at the top before any WordPress loads
if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
    $_SERVER['HTTPS'] = 'on';
    $_SERVER['SERVER_PORT'] = 443;
    $_SERVER['REQUEST_SCHEME'] = 'https';
}

// Force correct host for CloudFront
if (isset($_SERVER['HTTP_X_FORWARDED_HOST']) && $_SERVER['HTTP_X_FORWARDED_HOST'] === '${apiFqdn}') {
    $_SERVER['HTTP_HOST'] = '${apiFqdn}';
    $_SERVER['REQUEST_SCHEME'] = 'https';
    $_SERVER['HTTPS'] = 'on';
    $_SERVER['SERVER_PORT'] = 443;
}

// Ensure HTTP_HOST is always set for all requests
if (!isset($_SERVER['HTTP_HOST'])) {
    $_SERVER['HTTP_HOST'] = '${apiFqdn}';
}
WPCONFIG
        
        # Insert CloudFront detection at the beginning of wp-config.php
        {
            cat wp-config-cloudfront.php
            echo ""
            tail -n +2 wp-config.php  # Skip the <?php opening tag from original
        } > wp-config-new.php
        
        # Add HTTPS constants before the "stop editing" line
        sed -i '/\/\* That.s all, stop editing! Happy publishing\. \*\//i\\n// FORCE HTTPS URLs - These override database options and ensure HTTPS everywhere\ndefine( '\''WP_HOME'\'', '\''https://${apiFqdn}'\'' );\ndefine( '\''WP_SITEURL'\'', '\''https://${apiFqdn}'\'' );\n\n// Force SSL for admin area\ndefine( '\''FORCE_SSL_ADMIN'\'', true );\n\n// Allow WordPress to detect proper HTTPS behind reverse proxy/CloudFront\ndefine( '\''WP_CONTENT_URL'\'', '\''https://${apiFqdn}/wp-content'\'' );\n\n// WP-CLI compatibility\nif ( defined( '\''WP_CLI'\'' ) ) {\n\t$_SERVER['\''HTTP_HOST'\''] = '\''${apiFqdn}'\'';\n\t$_SERVER['\''REQUEST_SCHEME'\''] = '\''https'\'';\n\t$_SERVER['\''HTTPS'\''] = '\''on'\'';\n\t$_SERVER['\''SERVER_PORT'\''] = 443;\n}\n' wp-config-new.php
        
        # Replace the original wp-config.php
        mv wp-config-new.php wp-config.php
        chown bitnami:bitnami wp-config.php
        chmod 644 wp-config.php
        
        # Clean up temporary files
        rm -f wp-config-cloudfront.php
        
        echo "wp-config.php updated for CloudFront HTTPS support"
        
        # Enhanced WordPress URL configuration with retries
        if command -v wp >/dev/null 2>&1; then
            echo "WP-CLI found, configuring WordPress for HTTPS..."
            
            # Wait longer for WordPress database to be fully ready
            sleep 60
            
            # Multiple attempts to update WordPress URLs
            for attempt in {1..5}; do
                echo "Attempt $attempt to update WordPress URLs..."
                
                if wp option update home "$WP_HOME" --allow-root --quiet && \
                   wp option update siteurl "$WP_SITEURL" --allow-root --quiet; then
                    echo "Successfully updated WordPress URLs"
                    break
                elif [ $attempt -eq 5 ]; then
                    echo "Failed to update WordPress URLs after 5 attempts"
                else
                    echo "URL update failed, waiting 30s before retry..."
                    sleep 30
                fi
            done
            
            # Verify the configuration
            echo "Verifying WordPress URL configuration..."
            HOME_URL=$(wp option get home --allow-root --quiet 2>/dev/null || echo "failed")
            SITE_URL=$(wp option get siteurl --allow-root --quiet 2>/dev/null || echo "failed")
            echo "Configured home URL: $HOME_URL"
            echo "Configured site URL: $SITE_URL"
            
            # Additional WordPress configuration
            wp option update FORCE_SSL_ADMIN 1 --allow-root --quiet || echo "Failed to set FORCE_SSL_ADMIN"
            
        else
            echo "WP-CLI not found, skipping WordPress URL configuration"
        fi
        
        # Create enhanced health check endpoint  
        echo "Creating enhanced health check endpoint..."
        cat > "$WP_ROOT/health-check.php" << 'HEALTHEOF'
<?php
/**
 * WordPress Health Check Endpoint for CloudFront
 */
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$health = [
    "status" => "ok",
    "timestamp" => date("c"),
    "server_ip" => $_SERVER["SERVER_ADDR"] ?? "unknown",
    "client_ip" => $_SERVER["REMOTE_ADDR"] ?? "unknown"
];

if (file_exists("wp-config.php")) {
    $health["wordpress"] = "detected";
    
    define("WP_USE_THEMES", false);
    require_once("wp-load.php");
    
    $health["wordpress_home"] = home_url();
    $health["wordpress_siteurl"] = site_url();
    $health["https_configured"] = (strpos(home_url(), "https://") === 0);
    $health["ssl_admin_enabled"] = get_option("FORCE_SSL_ADMIN") ? true : false;
    
    $expected_domain = "https://${apiFqdn}";
    $health["urls_correctly_configured"] = (
        home_url() === $expected_domain && 
        site_url() === $expected_domain
    );
    
    $health["wp_home_constant"] = defined("WP_HOME") ? WP_HOME : "not defined";
    $health["wp_siteurl_constant"] = defined("WP_SITEURL") ? WP_SITEURL : "not defined";
    
} else {
    $health["wordpress"] = "missing";
    $health["status"] = "error";
}

http_response_code($health["status"] === "ok" ? 200 : 503);
echo json_encode($health, JSON_PRETTY_PRINT);
?>
HEALTHEOF
        
        # Set proper permissions for health check
        chmod 644 "$WP_ROOT/health-check.php"
        chown bitnami:bitnami "$WP_ROOT/health-check.php" 2>/dev/null || echo "Could not set health-check.php ownership"
        
        # Restart Apache to ensure all changes take effect
        echo "Restarting Apache to apply configuration changes..."
        /opt/bitnami/ctlscript.sh restart apache
        
        echo "$(date): Enhanced WordPress setup completed successfully"
        echo "Health check: https://${apiFqdn}/health-check.php"
        echo "WordPress admin: https://${apiFqdn}/wp-admin/"
        echo "Direct IP access: http://$PUBLIC_IP/wp-admin/"
        echo "Setup log: $LOG_FILE"
      `,
      tags: [{
        key: 'Environment',
        value: envName,
      }, {
        key: 'Project',
        value: 'RaePortfolio',
      }],
    });

    // Static IP for WordPress
    const staticIp = new lightsail.CfnStaticIp(this, 'WordPressStaticIP', {
      staticIpName: `rae-portfolio-wp-ip-${envName}`,
    });

    // WordPress CloudFront Distribution for HTTPS API access
    const wordpressDistribution = new cloudfront.Distribution(this, 'WordPressDistribution', {
      defaultBehavior: {
        origin: new origins.HttpOrigin(`${staticIp.attrIpAddress}.nip.io`, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          customHeaders: {
            'X-Forwarded-Host': apiFqdn, // Pass the custom domain to WordPress
            'X-Forwarded-Proto': 'https', // Tell WordPress the request came via HTTPS
          },
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // WordPress is dynamic content
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        compress: true,
      },
      domainNames: certificate ? [apiFqdn] : undefined,
      certificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe
      enabled: true,
      comment: `WordPress CloudFront distribution for ${apiFqdn}`,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });


    // Lambda function for LightSail automation
    const lightsailAutomationFunction = new lambda.Function(this, 'LightsailAutomationFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./lambda/lightsail-automation'),
      timeout: cdk.Duration.minutes(15),
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
      },
    });

    // IAM role for LightSail operations
    lightsailAutomationFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'lightsail:AttachStaticIp',
        'lightsail:DetachStaticIp', 
        'lightsail:GetInstance',
        'lightsail:GetStaticIp',
        'lightsail:GetInstances',
        'lightsail:GetStaticIps',
      ],
      resources: ['*'], // LightSail doesn't support resource-level permissions
    }));

    // Custom resource to attach static IP automatically
    const staticIpAttachment = new cr.Provider(this, 'StaticIpAttachmentProvider', {
      onEventHandler: lightsailAutomationFunction,
      logRetention: 14, // Keep logs for 14 days
    });

    const staticIpAttachmentResource = new cdk.CustomResource(this, 'StaticIpAttachment', {
      serviceToken: staticIpAttachment.serviceToken,
      properties: {
        InstanceName: wordpressInstance.instanceName,
        StaticIpName: staticIp.staticIpName,
        Region: this.region,
      },
    });

    // Lambda function for WordPress configuration validation
    const wordpressConfigFunction = new lambda.Function(this, 'WordPressConfigFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./lambda/wordpress-config'),
      timeout: cdk.Duration.minutes(5), // Reduced timeout
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
      },
    });

    // IAM permissions for WordPress configuration function
    wordpressConfigFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'lightsail:GetInstance',
        'lightsail:GetInstances',
        'lightsail:GetCertificate',
        'lightsail:GetCertificates',
        'lightsail:AttachCertificateToInstance',
        'lightsail:DetachCertificateFromInstance',
      ],
      resources: ['*'],
    }));

    // Custom resource provider for WordPress configuration
    const wordpressConfigProvider = new cr.Provider(this, 'WordPressConfigProvider', {
      onEventHandler: wordpressConfigFunction,
      logRetention: 14,
    });

    // WordPress configuration custom resource (depends on static IP attachment)
    const wordpressConfigResource = new cdk.CustomResource(this, 'WordPressConfiguration', {
      serviceToken: wordpressConfigProvider.serviceToken,
      properties: {
        InstanceName: wordpressInstance.instanceName,
        StaticIpAddress: staticIp.attrIpAddress,
        Domain: domainName,
        Environment: envName,
        CloudFrontDomain: apiFqdn,
      },
    });

    // Ensure WordPress configuration happens after static IP attachment
    wordpressConfigResource.node.addDependency(staticIpAttachmentResource);

    // Route 53 Hosted Zone (only for production)
    let hostedZone: route53.IHostedZone | undefined;
    if (certificate) {
      console.log('Setting up custom domain with certificate',  certificate.certificateArn);
      hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
        domainName: domainName,
      });

      // A Record for frontend domain
      new route53.ARecord(this, 'FrontendAliasRecord', {
        zone: hostedZone,
        recordName: frontendFqdn,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(frontendDistribution)
        ),
      });

      if (envName === 'prod') {
        // CNAME for www subdomain
        new route53.CnameRecord(this, 'WwwRecord', {
          zone: hostedZone,
          recordName: `www.${frontendFqdn}`,
          domainName: frontendDistribution.distributionDomainName,
        });
      }

      // A Record for API subdomain pointing to WordPress CloudFront
      new route53.ARecord(this, 'ApiAliasRecord', {
        zone: hostedZone,
        recordName: apiFqdn,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(wordpressDistribution)
        ),
      });
    }

    // S3 Deployment for frontend assets (will be added later via CI/CD)
    // Commented out for initial deployment - will be handled by GitHub Actions
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('../frontend/dist')],
      destinationBucket: websiteBucket,
      distribution: frontendDistribution,
      distributionPaths: ['/*'],
      retainOnDelete: envName === 'prod',
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      description: 'S3 bucket name for website hosting',
    });

    new cdk.CfnOutput(this, 'FrontendDistributionId', {
      value: frontendDistribution.distributionId,
      description: 'Frontend CloudFront distribution ID',
    });

    new cdk.CfnOutput(this, 'FrontendDistributionDomainName', {
      value: frontendDistribution.distributionDomainName,
      description: 'Frontend CloudFront distribution domain name',
    });

    new cdk.CfnOutput(this, 'WordPressDistributionId', {
      value: wordpressDistribution.distributionId,
      description: 'WordPress CloudFront distribution ID',
    });

    new cdk.CfnOutput(this, 'WordPressDistributionDomainName', {
      value: wordpressDistribution.distributionDomainName,
      description: 'WordPress CloudFront distribution domain name',
    });

    new cdk.CfnOutput(this, 'WordPressPublicIP', {
      value: staticIp.attrIpAddress,
      description: 'WordPress LightSail public IP address',
    });

    new cdk.CfnOutput(this, 'WordPressInstanceName', {
      value: wordpressInstance.instanceName,
      description: 'WordPress LightSail instance name',
    });

    new cdk.CfnOutput(this, 'WordPressHealthCheckURL', {
      value: `http://${staticIp.attrIpAddress}/health-check.php`,
      description: 'WordPress health check endpoint',
    });

    new cdk.CfnOutput(this, 'WordPressAdminURL', {
      value: `http://${staticIp.attrIpAddress}/wp-admin/`,
      description: 'WordPress admin dashboard',
    });

    if (certificate) {
      new cdk.CfnOutput(this, 'WebsiteURL', {
        value: `https://${frontendFqdn}`,
        description: 'Website URL',
      });

      new cdk.CfnOutput(this, 'WordPressAPIURL', {
        value: `https://${apiFqdn}`,
        description: 'WordPress API URL',
      });
    }
  }
}