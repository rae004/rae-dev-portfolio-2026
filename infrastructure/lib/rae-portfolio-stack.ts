import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as lightsail from 'aws-cdk-lib/aws-lightsail';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'node:path';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2int from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';

export interface RaePortfolioStackProps extends cdk.StackProps {
  envName: string;
  domainName: string;
  certificateArn?: string;
  // Prod only. When false, the stack skips the apex (`domainName`) and
  // `www.` records so it can be deployed while another host still owns
  // those names in Route 53 (the Vercel → AWS cutover window). Every other
  // record (api., media.) is still created. Defaults to true.
  manageApexDns?: boolean;
  // Lightsail blueprint for the WordPress instance. Defaults to the
  // Lightsail-packaged `wordpress_ls_1_0`. CHANGING THIS ON A DEPLOYED STACK
  // REPLACES THE INSTANCE (and its database) — only do it as a planned
  // migration. Dev pins the legacy Bitnami `wordpress` until then.
  wordpressBlueprintId?: string;
}

export const DEFAULT_WORDPRESS_BLUEPRINT = 'wordpress_ls_1_0';

export class RaePortfolioStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RaePortfolioStackProps) {
    super(scope, id, props);

    const {
      envName,
      domainName,
      certificateArn,
      manageApexDns = true,
      wordpressBlueprintId = DEFAULT_WORDPRESS_BLUEPRINT,
    } = props;

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
      // Prod also answers on www.: the stack creates that CNAME, and
      // CloudFront 403s any hostname not listed here.
      domainNames: certificate
        ? envName === 'prod'
          ? [frontendFqdn, `www.${frontendFqdn}`]
          : [frontendFqdn]
        : undefined,
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
    //
    // Blueprint: the Bitnami-packaged `wordpress` blueprint is deprecated
    // (no updates since 2026-05-19; can't create instances from it after
    // 2026-11-19). New instances use the Lightsail-packaged
    // `wordpress_ls_1_0`. Layout differs — see the setup script below — so
    // it detects which one it's on. Dev still pins the legacy blueprint
    // (bin/infrastructure.ts) until it's migrated; changing a running
    // instance's blueprint REPLACES the instance and its database.
    //
    // The setup script is written to disk and run with bash explicitly.
    // Lightsail wraps user-data in its own `#!/bin/sh` prelude, so a bash
    // shebang here is cosmetic and the script would otherwise run under dash
    // (which is exactly how the first prod deploy died: `set -o pipefail` is
    // illegal in dash → exit 2 at 0.6 s, silently, before any configuration).
    const wordpressSetupScript = `#!/bin/bash
set -euo pipefail
# cloud-init's PATH lacks /usr/local/bin, where the Lightsail image installs wp-cli.
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
LOG_FILE=/var/log/wordpress-setup.log
exec 1> >(tee -a "$LOG_FILE") 2>&1
echo "$(date): starting WordPress setup for https://${apiFqdn}"

# ---- Detect blueprint layout ---------------------------------------------
if [ -d /opt/bitnami/wordpress ]; then
  FLAVOR=bitnami
  WP_ROOT=/opt/bitnami/wordpress
  WP_OWNER=bitnami:bitnami
  restart_web() { /opt/bitnami/ctlscript.sh restart apache; }
elif [ -f /var/www/html/wp-load.php ]; then
  FLAVOR=lightsail
  WP_ROOT=/var/www/html
  WP_OWNER=admin:www-data
  restart_web() { systemctl restart apache2; }
  # The image's default vhost 301s every plain-HTTP request to https:// on
  # a self-signed cert. CloudFront reaches this origin over plain HTTP and
  # already enforces HTTPS for visitors, and the config Lambda's health
  # probes are plain HTTP — so the instance-level redirect must go.
  # No reload here: on first boot Apache may not be up yet (reload fails,
  # and set -e would abort the whole script). restart_web at the end
  # applies it.
  sed -i -E '/^[[:space:]]*Rewrite(Engine|Cond|Rule)/ s|^|# rae-disabled (CloudFront terminates TLS): |' /etc/apache2/sites-available/000-default.conf
  echo "disabled Apache HTTP->HTTPS redirect (applied on restart below)"
  # Pretty permalinks: the image ships without mod_rewrite or AllowOverride,
  # so WordPress's .htaccess rules (and WPS Hide Login's slug) would 404 at
  # Apache. Same steps as wordpress/scripts/configure-instance.sh.
  a2enmod -q rewrite
  cat > /etc/apache2/conf-available/rae-wordpress.conf <<'CONF'
# Managed by rae-dev-portfolio (CDK setup script / configure-instance.sh).
<Directory /var/www/html>
    AllowOverride All
</Directory>
# 10 prefork workers (image default: 5) and a short keep-alive — CloudFront
# keeps origin connections open and wp-admin fans out many parallel requests.
MaxRequestWorkers 10
ServerLimit 10
KeepAliveTimeout 2
CONF
  a2enconf -q rae-wordpress
  apache2ctl -t
  # Daily Debian security updates.
  export DEBIAN_FRONTEND=noninteractive
  apt-get install -y -qq unattended-upgrades >/dev/null 2>&1 || echo "WARN: unattended-upgrades install failed"
  cat > /etc/apt/apt.conf.d/20auto-upgrades <<'APT'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
APT
  systemctl enable -q --now unattended-upgrades || true
else
  echo "ERROR: no WordPress installation found"
  exit 1
fi
if [ -f "$WP_ROOT/wp-config.php" ]; then
  WP_CONFIG="$WP_ROOT/wp-config.php"
else
  WP_CONFIG="$(dirname "$WP_ROOT")/wp-config.php"
fi
echo "layout=$FLAVOR root=$WP_ROOT config=$WP_CONFIG"
WP="wp --allow-root --path=$WP_ROOT"

# ---- Wait until WordPress is installed and answering (max 10 min) ---------
for i in $(seq 1 60); do
  if [ -f "$WP_CONFIG" ] && $WP core is-installed >/dev/null 2>&1 && curl -fs -o /dev/null http://localhost/; then
    echo "WordPress ready (check $i)"
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "ERROR: WordPress not ready after 10 minutes"
    exit 1
  fi
  sleep 10
done

# ---- Public IP for the log (IMDSv2 — v1 is disabled on Lightsail images) --
TOKEN=$(curl -s -m 5 -X PUT http://169.254.169.254/latest/api/token -H "X-aws-ec2-metadata-token-ttl-seconds: 60" || true)
PUBLIC_IP=$(curl -s -m 5 -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4 || echo unknown)
echo "public ip: $PUBLIC_IP  cloudfront: ${apiFqdn}"

# ---- wp-config.php: make WordPress CloudFront/HTTPS aware -----------------
MODE=$(stat -c %a "$WP_CONFIG")
OWNER_USER=$(stat -c %U "$WP_CONFIG")
OWNER_GROUP=$(stat -c %G "$WP_CONFIG")
cp -p "$WP_CONFIG" "$WP_CONFIG.original"

# Both blueprints ship WP_HOME/WP_SITEURL derived from HTTP_HOST. Remove them
# so the definitions inserted below are authoritative rather than a
# "constant already defined" no-op.
sed -i "/^define( *'WP_HOME'/d; /^define( *'WP_SITEURL'/d" "$WP_CONFIG"

cat > /tmp/rae-head.php <<'PHP'
<?php
// CloudFront terminates TLS; let WordPress see the original scheme and host.
if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
    $_SERVER['HTTPS'] = 'on';
    $_SERVER['SERVER_PORT'] = 443;
    $_SERVER['REQUEST_SCHEME'] = 'https';
}
if (isset($_SERVER['HTTP_X_FORWARDED_HOST']) && $_SERVER['HTTP_X_FORWARDED_HOST'] === '${apiFqdn}') {
    $_SERVER['HTTP_HOST'] = '${apiFqdn}';
    $_SERVER['HTTPS'] = 'on';
    $_SERVER['SERVER_PORT'] = 443;
    $_SERVER['REQUEST_SCHEME'] = 'https';
}
if (!isset($_SERVER['HTTP_HOST'])) {
    $_SERVER['HTTP_HOST'] = '${apiFqdn}';
}
PHP

cat > /tmp/rae-constants.php <<'PHP'
// Canonical public URLs (behind CloudFront). Override the database options.
define( 'WP_HOME', 'https://${apiFqdn}' );
define( 'WP_SITEURL', 'https://${apiFqdn}' );
define( 'WP_CONTENT_URL', 'https://${apiFqdn}/wp-content' );
define( 'FORCE_SSL_ADMIN', true );
// WP-CLI runs without a request; give it the same view of the world.
if ( defined( 'WP_CLI' ) ) {
    $_SERVER['HTTP_HOST'] = '${apiFqdn}';
    $_SERVER['HTTPS'] = 'on';
    $_SERVER['SERVER_PORT'] = 443;
    $_SERVER['REQUEST_SCHEME'] = 'https';
}

PHP

# Prepend the header (dropping the original <?php line), then insert the
# constants just before WordPress's "stop editing" marker.
{ cat /tmp/rae-head.php; tail -n +2 "$WP_CONFIG"; } > /tmp/rae-wp-config-1.php
awk -v f=/tmp/rae-constants.php '/That.s all, stop editing/ { while ((getline l < f) > 0) print l } { print }' /tmp/rae-wp-config-1.php > /tmp/rae-wp-config-2.php
php -l /tmp/rae-wp-config-2.php
install -m "$MODE" -o "$OWNER_USER" -g "$OWNER_GROUP" /tmp/rae-wp-config-2.php "$WP_CONFIG"
rm -f /tmp/rae-head.php /tmp/rae-constants.php /tmp/rae-wp-config-1.php /tmp/rae-wp-config-2.php
echo "wp-config.php updated"

# ---- Database URL options -------------------------------------------------
$WP option update home "https://${apiFqdn}"
$WP option update siteurl "https://${apiFqdn}"
echo "home=$($WP option get home) siteurl=$($WP option get siteurl)"
# WordPress's standard .htaccess so pretty permalinks work (needs the Apache
# config above). Written directly: WP-CLI can't detect mod_rewrite from the
# command line, so \`wp rewrite flush --hard\` silently skips the file.
if [ ! -f "$WP_ROOT/.htaccess" ]; then
  cat > "$WP_ROOT/.htaccess" <<'HTACCESS'
# BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>
# END WordPress
HTACCESS
  chown "$WP_OWNER" "$WP_ROOT/.htaccess"
  chmod 664 "$WP_ROOT/.htaccess"
fi
$WP rewrite flush --quiet || true

# ---- Health check endpoint (used by the WordPressConfig custom resource) --
cat > "$WP_ROOT/health-check.php" <<'PHP'
<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
$health = [
    "status" => "ok",
    "timestamp" => date("c"),
    "server_ip" => $_SERVER["SERVER_ADDR"] ?? "unknown",
];
if (file_exists(__DIR__ . "/wp-load.php")) {
    $health["wordpress"] = "detected";
    define("WP_USE_THEMES", false);
    require_once(__DIR__ . "/wp-load.php");
    $expected = "https://${apiFqdn}";
    $health["wordpress_home"] = home_url();
    $health["wordpress_siteurl"] = site_url();
    $health["https_configured"] = (strpos(home_url(), "https://") === 0);
    $health["ssl_admin_enabled"] = defined("FORCE_SSL_ADMIN") && FORCE_SSL_ADMIN;
    $health["urls_correctly_configured"] = (home_url() === $expected && site_url() === $expected);
    $health["wp_home_constant"] = defined("WP_HOME") ? WP_HOME : "not defined";
    $health["wp_siteurl_constant"] = defined("WP_SITEURL") ? WP_SITEURL : "not defined";
} else {
    $health["wordpress"] = "missing";
    $health["status"] = "error";
}
http_response_code($health["status"] === "ok" ? 200 : 503);
echo json_encode($health, JSON_PRETTY_PRINT);
PHP
chown "$WP_OWNER" "$WP_ROOT/health-check.php"
chmod 644 "$WP_ROOT/health-check.php"

restart_web
echo "$(date): WordPress setup complete — https://${apiFqdn}/health-check.php"
`;

    // The instance name carries the blueprint generation. CloudFormation
    // refuses to *replace* a custom-named resource ("Rename … and update the
    // stack again"), and changing the blueprint is a replacement — so the
    // name must change with it. Legacy Bitnami keeps the bare name.
    const blueprintTag =
      wordpressBlueprintId === 'wordpress'
        ? ''
        : `-${wordpressBlueprintId.replace(/^wordpress_?/, '').replace(/_/g, '')}`; // wordpress_ls_1_0 → -ls10
    const wordpressInstanceName = `rae-portfolio-wp-${envName}${blueprintTag}`;

    const wordpressInstance = new lightsail.CfnInstance(this, 'WordPressInstance', {
      instanceName: wordpressInstanceName,
      blueprintId: wordpressBlueprintId,
      bundleId: envName === 'prod' ? 'micro_3_0' : 'nano_3_0', // Prod: $7/month, Dev: $5/month
      availabilityZone: `${this.region}a`,
      // Declared explicitly: Lightsail-packaged blueprints restrict port 22 to
      // Lightsail's own connect ranges by default, which would lock out
      // seed.sh / rsync deploys. 80 must be world-open — CloudFront reaches
      // the origin over plain HTTP at <static-ip>.nip.io.
      networking: {
        ports: [
          { fromPort: 22, toPort: 22, protocol: 'tcp', cidrs: ['0.0.0.0/0'], ipv6Cidrs: ['::/0'] },
          { fromPort: 80, toPort: 80, protocol: 'tcp', cidrs: ['0.0.0.0/0'], ipv6Cidrs: ['::/0'] },
          { fromPort: 443, toPort: 443, protocol: 'tcp', cidrs: ['0.0.0.0/0'], ipv6Cidrs: ['::/0'] },
        ],
      },
      userData: [
        '#!/bin/sh',
        '# Lightsail prepends its own #!/bin/sh prelude; write the real script and run it with bash.',
        "cat > /root/rae-wp-setup.sh <<'RAE_SETUP_EOF'",
        wordpressSetupScript,
        'RAE_SETUP_EOF',
        'chmod 700 /root/rae-wp-setup.sh',
        'bash /root/rae-wp-setup.sh',
      ].join('\n'),
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

    // CORS Response Headers Policy for WordPress API
    const corsResponseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'WordPressCorsPolicy', {
      responseHeadersPolicyName: `rae-portfolio-cors-policy-${envName}`,
      comment: 'CORS headers policy for WordPress REST API',
      corsBehavior: {
        accessControlAllowCredentials: true,
        accessControlAllowHeaders: ['Content-Type', 'Authorization', 'X-WP-Nonce', 'X-Requested-With'],
        accessControlAllowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
        // De-duplicated: for prod `frontendFqdn` IS the apex, and CloudFront
        // rejects a policy with the same origin listed twice.
        accessControlAllowOrigins: [
          ...new Set([
            'http://localhost:5173',           // Local development
            `https://${frontendFqdn}`,         // Frontend domain (dev.rae-dev.com or rae-dev.com)
            `https://${domainName}`,           // Apex (prod frontend; also allowed from dev)
            ...(envName === 'prod' ? [`https://www.${domainName}`] : []),
          ]),
        ],
        accessControlExposeHeaders: ['X-WP-Total', 'X-WP-TotalPages'],
        accessControlMaxAge: cdk.Duration.hours(24),
        originOverride: false,
      },
    });

    // WordPress CloudFront Distribution for HTTPS API access
    const wordpressOrigin = new origins.HttpOrigin(`${staticIp.attrIpAddress}.nip.io`, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
      customHeaders: {
        'X-Forwarded-Host': apiFqdn, // Pass the custom domain to WordPress
        'X-Forwarded-Proto': 'https', // Tell WordPress the request came via HTTPS
      },
    });

    // Static assets (core CSS/JS, theme/plugin files, uploads) are cached at
    // the edge. Without this, every wp-admin page pulled ~100 asset requests
    // through CloudFront to an Apache with 5 workers — the whole admin queued
    // behind its own stylesheets. Query strings are part of the key so
    // WordPress's `?ver=` cache-busting keeps working across updates.
    const wordpressStaticCachePolicy = new cloudfront.CachePolicy(this, 'WordPressStaticCachePolicy', {
      cachePolicyName: `rae-portfolio-wp-static-${envName}`,
      comment: 'WordPress static assets: cache at the edge, keyed on query string (?ver=)',
      defaultTtl: cdk.Duration.days(1),
      maxTtl: cdk.Duration.days(365),
      minTtl: cdk.Duration.seconds(0),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });
    const wordpressStaticBehavior: cloudfront.BehaviorOptions = {
      origin: wordpressOrigin,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: wordpressStaticCachePolicy,
      responseHeadersPolicy: corsResponseHeadersPolicy,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
      compress: true,
    };

    const wordpressDistribution = new cloudfront.Distribution(this, 'WordPressDistribution', {
      defaultBehavior: {
        origin: wordpressOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // WordPress is dynamic content
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        responseHeadersPolicy: corsResponseHeadersPolicy, // Apply CORS headers policy
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        compress: true,
      },
      additionalBehaviors: {
        '/wp-includes/*': wordpressStaticBehavior,
        '/wp-admin/css/*': wordpressStaticBehavior,
        '/wp-admin/js/*': wordpressStaticBehavior,
        '/wp-admin/images/*': wordpressStaticBehavior,
        '/wp-content/*': wordpressStaticBehavior,
      },
      domainNames: certificate ? [apiFqdn] : undefined,
      certificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe
      enabled: true,
      comment: `WordPress CloudFront distribution for ${apiFqdn}`,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });


    // Lambdas are bundled from their TypeScript source by esbuild at synth
    // time (aws-lambda-nodejs). They only import @aws-sdk/*, which the Node
    // 22 runtime provides and NodejsFunction leaves external by default, so
    // nothing from a lambda's node_modules ever ships — there is no
    // install-time attack surface (supply_chain_hardening.md, Phase 3).
    // Previously Code.fromAsset zipped the directory as-is and relied on
    // compiled .js happening to exist on the deploying machine; with *.js
    // gitignored that broke on any fresh checkout ("Cannot find module
    // 'index'").
    const lambdaEntry = (name: string) => path.join(__dirname, '..', 'lambda', name, 'index.ts');
    const lambdaBundling: nodejs.BundlingOptions = {
      minify: true,
      sourceMap: true,
      target: 'node22',
    };

    // Lambda function for LightSail automation
    const lightsailAutomationFunction = new nodejs.NodejsFunction(this, 'LightsailAutomationFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: lambdaEntry('lightsail-automation'),
      handler: 'handler',
      bundling: lambdaBundling,
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
        // Not read by the handler — present so a *replaced* instance (new
        // ARN, same name) changes the properties and triggers an Update,
        // re-attaching the static IP. Names alone don't change on replace.
        InstanceArn: wordpressInstance.attrInstanceArn,
        Region: this.region,
      },
    });

    // Lambda function for WordPress configuration validation
    const wordpressConfigFunction = new nodejs.NodejsFunction(this, 'WordPressConfigFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: lambdaEntry('wordpress-config'),
      handler: 'handler',
      bundling: lambdaBundling,
      // Must exceed the handler's own retry budget (~10 min of health checks
      // while a fresh instance finishes its first-boot setup).
      timeout: cdk.Duration.minutes(14),
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
        // Same reason as StaticIpAttachment: re-validate after a replacement.
        InstanceArn: wordpressInstance.attrInstanceArn,
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

      // Frontend records. For prod these are the apex + www — held back
      // during cutover via `manageApexDns` (see the prop's comment); dev's
      // `dev.` record is always managed here.
      if (envName !== 'prod' || manageApexDns) {
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

    // ---------- Media library: S3 + CloudFront + IAM uploader ----------
    //
    // Offloads WordPress media uploads to S3 served through a dedicated
    // CloudFront distribution at `media-${envName}.rae-dev.com` (or
    // `media.rae-dev.com` for prod). The WP Offload Media plugin writes to
    // the bucket via the dedicated IAM user; CloudFront serves via OAC so the
    // bucket stays private.
    const mediaFqdn = envName === 'prod' ? `media.${domainName}` : `media-${envName}.${domainName}`;

    const mediaBucket = new s3.Bucket(this, 'MediaBucket', {
      bucketName: `rae-portfolio-media-${envName}-${cdk.Aws.ACCOUNT_ID}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: envName !== 'prod',
    });

    const mediaDistribution = new cloudfront.Distribution(this, 'MediaDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(mediaBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
        compress: true,
      },
      domainNames: certificate ? [mediaFqdn] : undefined,
      certificate: certificate ?? undefined,
      comment: `Media library CDN for ${mediaFqdn}`,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    if (certificate && hostedZone) {
      new route53.ARecord(this, 'MediaAliasRecord', {
        zone: hostedZone,
        recordName: mediaFqdn,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(mediaDistribution)),
      });
    }

    // IAM user for the WP Offload Media plugin. Scoped to s3:* on this bucket
    // only. Access key must be created out-of-band after deploy with:
    //   aws iam create-access-key --user-name rae-portfolio-media-uploader-${envName}
    const mediaUploaderUser = new iam.User(this, 'MediaUploaderUser', {
      userName: `rae-portfolio-media-uploader-${envName}`,
    });

    mediaUploaderUser.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject', 's3:PutObjectAcl'],
      resources: [mediaBucket.arnForObjects('*')],
    }));

    // The bucket has ACLs disabled (BucketOwnerEnforced) and public access
    // blocked. WP Offload Media decides whether to send an ACL with each
    // upload by reading those two bucket settings; without permission to
    // read them it assumes ACLs are allowed, sends `public-read`, and every
    // upload fails with AccessControlListNotSupported.
    mediaUploaderUser.addToPolicy(new iam.PolicyStatement({
      actions: [
        's3:ListBucket',
        's3:GetBucketLocation',
        's3:GetBucketPublicAccessBlock',
        's3:GetBucketOwnershipControls',
      ],
      resources: [mediaBucket.bucketArn],
    }));

    // GitHub Actions OIDC trust + per-environment deploy role.
    //
    // Trust is scoped to a specific GitHub Environment (`environment:<envName>`)
    // rather than a branch ref so the deployment guardrails live in one place
    // (the GitHub Environment can require reviewers, restrict secrets, etc.).
    //
    // The OIDC provider is an account-level singleton — only the dev stack
    // creates it; prod (when added) imports the existing ARN.
    const githubOidcProvider = envName === 'dev'
      ? new iam.OpenIdConnectProvider(this, 'GithubOidcProvider', {
          url: 'https://token.actions.githubusercontent.com',
          clientIds: ['sts.amazonaws.com'],
        })
      : iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
          this,
          'GithubOidcProvider',
          `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`,
        );

    // Role names are account-global and this account hosts other projects:
    // `github-deploy-prod` already belongs to rae004/ai-security-digest. New
    // roles are therefore project-prefixed. Dev keeps its original unprefixed
    // name because it's live and referenced by the `dev` GitHub Environment
    // secret — renaming it replaces the role (new ARN) and would break dev
    // deploys until that secret is updated. Align it in a deliberate step.
    const githubDeployRoleName =
      envName === 'dev' ? 'github-deploy-dev' : `rae-portfolio-github-deploy-${envName}`;

    const githubDeployRole = new iam.Role(this, 'GithubDeployRole', {
      roleName: githubDeployRoleName,
      description: `Assumed by GitHub Actions to deploy the frontend SPA to ${envName}`,
      assumedBy: new iam.FederatedPrincipal(
        githubOidcProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
            'token.actions.githubusercontent.com:sub': `repo:rae004/rae-dev-portfolio-2026:environment:${envName}`,
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      maxSessionDuration: cdk.Duration.hours(1),
    });

    websiteBucket.grantReadWrite(githubDeployRole);

    githubDeployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['cloudfront:CreateInvalidation'],
      resources: [
        `arn:aws:cloudfront::${this.account}:distribution/${frontendDistribution.distributionId}`,
      ],
    }));

    // ---------- Contact form: SSM param + Lambda + HTTP API ----------

    // The reCAPTCHA secret + threshold live in WordPress admin (single source
    // of truth). Lambda delegates verification to WP's /wp/v2/recaptcha/verify
    // endpoint, so no SSM secret is needed here.
    const recipientsParam = new ssm.StringListParameter(this, 'ContactRecipients', {
      parameterName: `/rae-portfolio/${envName}/contact/recipients`,
      description: 'Comma-separated recipient emails for the contact form. Edit in SSM console to add/remove addresses.',
      stringListValue: ['rae004dev@gmail.com'],
    });

    const contactFormFunction = new nodejs.NodejsFunction(this, 'ContactFormFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: lambdaEntry('contact-form'),
      handler: 'handler',
      bundling: lambdaBundling,
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      // Cap blast radius if reCAPTCHA is somehow bypassed: at most 5
      // concurrent invocations. Excess requests get 429 from Lambda.
      reservedConcurrentExecutions: 5,
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        FROM_ADDRESS: `no-reply@${domainName}`,
        RECIPIENTS_PARAM: recipientsParam.parameterName,
        WP_API_BASE: `https://${apiFqdn}`,
      },
    });

    recipientsParam.grantRead(contactFormFunction);

    // SES send permissions. In SES sandbox mode, IAM is checked on BOTH the
    // sender identity AND each recipient identity (Gmail address etc.), so we
    // scope to `identity/*` within this account. Out of sandbox, only the
    // sender identity matters and this can be tightened to the domain ARN.
    contactFormFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: [`arn:aws:ses:${this.region}:${this.account}:identity/*`],
    }));

    const contactApi = new apigwv2.HttpApi(this, 'ContactHttpApi', {
      apiName: `rae-portfolio-contact-${envName}`,
      description: `Contact form API for the ${envName} portfolio`,
      corsPreflight: {
        allowOrigins: [
          `https://${frontendFqdn}`,
          'http://localhost:5173',
          'http://localhost:5174',
        ],
        allowMethods: [apigwv2.CorsHttpMethod.POST, apigwv2.CorsHttpMethod.OPTIONS],
        allowHeaders: ['Content-Type'],
        maxAge: cdk.Duration.minutes(10),
      },
      // Replace auto-default stage with one that has explicit throttling.
      createDefaultStage: false,
    });

    contactApi.addRoutes({
      path: '/contact',
      methods: [apigwv2.HttpMethod.POST],
      integration: new apigwv2int.HttpLambdaIntegration('ContactIntegration', contactFormFunction),
    });

    // Stage-level throttling. Nobody legitimately submits faster than this.
    new apigwv2.HttpStage(this, 'ContactHttpDefaultStage', {
      httpApi: contactApi,
      stageName: '$default',
      autoDeploy: true,
      throttle: {
        rateLimit: 5,
        burstLimit: 10,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'ContactApiUrl', {
      value: `${contactApi.apiEndpoint}/contact`,
      description: 'POST endpoint for the contact form Lambda',
    });

    new cdk.CfnOutput(this, 'MediaBucketName', {
      value: mediaBucket.bucketName,
      description: 'S3 bucket for WordPress media uploads (WP Offload Media plugin target)',
    });

    new cdk.CfnOutput(this, 'MediaCloudFrontDomain', {
      value: mediaDistribution.distributionDomainName,
      description: 'CloudFront distribution domain for media (use as fallback CDN URL if custom domain not yet propagated)',
    });

    new cdk.CfnOutput(this, 'MediaUrl', {
      value: certificate ? `https://${mediaFqdn}` : `https://${mediaDistribution.distributionDomainName}`,
      description: 'Public-facing URL for media — paste as Custom CDN URL in WP Offload Media plugin',
    });

    new cdk.CfnOutput(this, 'MediaUploaderUserName', {
      value: mediaUploaderUser.userName,
      description: 'IAM user for the WP Offload Media plugin. Create an access key after deploy with: aws iam create-access-key --user-name <this value>',
    });

    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      description: 'S3 bucket name for website hosting',
    });

    new cdk.CfnOutput(this, 'GithubDeployRoleArn', {
      value: githubDeployRole.roleArn,
      description: 'IAM role ARN for GitHub Actions to deploy the frontend SPA',
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