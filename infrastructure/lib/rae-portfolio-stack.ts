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

    // CloudFront Distribution with Origin Access Control (OAC) - AWS Best Practice
    const apiFqdn = envName === 'prod' ? `api.${domainName}` : `api-dev.${domainName}`;
    const frontendFqdn = envName === 'prod' ? domainName : `${envName}.${domainName}`;
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket), // Modern OAC approach
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        compress: true,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(apiFqdn, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
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
      comment: `CloudFront distribution for ${frontendFqdn}`,
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
        # Simplified Bitnami-compatible WordPress setup script
        set -euo pipefail
        
        # Logging setup
        LOG_FILE="/var/log/wordpress-setup.log"
        exec 1> >(tee -a "$LOG_FILE")
        exec 2> >(tee -a "$LOG_FILE" >&2)
        echo "$(date): Starting simplified WordPress setup for Bitnami"
        
        # Wait for Bitnami initialization to complete (critical!)
        echo "Waiting for Bitnami services to initialize completely..."
        sleep 180  # 3 minutes minimum for full Bitnami initialization
        
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
        
        # Check if services are running
        check_service() {
            local service="$1"
            if /opt/bitnami/ctlscript.sh status "$service" | grep -q "already running"; then
                echo "$service is running"
                return 0
            else
                echo "WARNING: $service is not running"
                return 1
            fi
        }
        
        # Wait for services to be ready
        echo "Checking Bitnami service status..."
        check_service apache || echo "Apache status check failed"
        check_service mysql || echo "MySQL status check failed"
        
        # Basic WordPress accessibility test
        echo "Testing WordPress accessibility..."
        for i in {1..5}; do
            if curl -f -s -o /dev/null "http://localhost/"; then
                echo "WordPress is accessible via HTTP"
                break
            elif [ $i -eq 5 ]; then
                echo "WARNING: WordPress not accessible after 5 attempts"
            else
                echo "Attempt $i: WordPress not accessible, waiting 30s..."
                sleep 30
            fi
        done
        
        # Configure WordPress URL using WP-CLI (if available)
        echo "Configuring WordPress..."
        cd "$WP_ROOT" || exit 1
        
        # Get public IP
        PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
        echo "Public IP: $PUBLIC_IP"
        
        # Use WP-CLI if available, otherwise skip configuration
        if command -v wp >/dev/null 2>&1; then
            echo "WP-CLI found, configuring WordPress URLs..."
            wp option update home "http://$PUBLIC_IP" --allow-root --quiet || echo "Failed to update home URL"
            wp option update siteurl "http://$PUBLIC_IP" --allow-root --quiet || echo "Failed to update site URL"
        else
            echo "WP-CLI not found, skipping URL configuration"
        fi
        
        # Create simple health check endpoint
        cat > health-check.php << 'EOF'
<?php
// Simple health check for Bitnami WordPress
header('Content-Type: application/json');
$health = ['status' => 'ok', 'timestamp' => date('c')];

// Basic WordPress check
if (file_exists('wp-config.php')) {
    $health['wordpress'] = 'detected';
} else {
    $health['wordpress'] = 'missing';
    $health['status'] = 'error';
}

http_response_code($health['status'] === 'ok' ? 200 : 503);
echo json_encode($health, JSON_PRETTY_PRINT);
?>
EOF
        
        echo "$(date): WordPress setup completed"
        echo "Health check: http://$PUBLIC_IP/health-check.php"
        echo "WordPress admin: http://$PUBLIC_IP/wp-admin/"
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

    // Lambda function for LightSail automation
    const lightsailAutomationFunction = new lambda.Function(this, 'LightsailAutomationFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
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
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./lambda/wordpress-config'),
      timeout: cdk.Duration.minutes(15), // Maximum allowed Lambda timeout
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

      // A Record for root domain
      new route53.ARecord(this, 'AliasRecord', {
        zone: hostedZone,
        recordName: frontendFqdn,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(distribution)
        ),
      });

      if (envName === 'prod') {
        // CNAME for www subdomain
        new route53.CnameRecord(this, 'WwwRecord', {
          zone: hostedZone,
          recordName: `www.${frontendFqdn}`,
          domainName: distribution.distributionDomainName,
        });
      }

      // CNAME for API subdomain pointing to WordPress
      new route53.CnameRecord(this, 'ApiRecord', {
        zone: hostedZone,
        recordName: apiFqdn,
        domainName: staticIp.attrIpAddress,
      });
    }

    // S3 Deployment for frontend assets (will be added later via CI/CD)
    // Commented out for initial deployment - will be handled by GitHub Actions
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('../frontend/dist')],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
      retainOnDelete: envName === 'prod',
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      description: 'S3 bucket name for website hosting',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID',
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
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