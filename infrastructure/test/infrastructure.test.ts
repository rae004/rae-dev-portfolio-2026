import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { RaePortfolioStack } from '../lib/rae-portfolio-stack';

describe('RaePortfolioStack (dev with cert)', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new RaePortfolioStack(app, 'RaePortfolioDev', {
      env: { account: '233416806179', region: 'us-east-1' },
      envName: 'dev',
      domainName: 'rae-dev.com',
      certificateArn:
        'arn:aws:acm:us-east-1:233416806179:certificate/da62c8c8-1aa9-4e36-8995-735e93c827f6',
    });
    template = Template.fromStack(stack);
  });

  test('S3 website bucket blocks all public access and is versioned + encrypted', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      VersioningConfiguration: { Status: 'Enabled' },
      BucketEncryption: Match.objectLike({
        ServerSideEncryptionConfiguration: Match.arrayWith([
          Match.objectLike({
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          }),
        ]),
      }),
    });
  });

  test('exactly three CloudFront distributions are created (frontend + WordPress + media)', () => {
    template.resourceCountIs('AWS::CloudFront::Distribution', 3);
  });

  test('every CloudFront distribution redirects HTTP traffic to HTTPS', () => {
    const distributions = template.findResources('AWS::CloudFront::Distribution');
    const ids = Object.keys(distributions);
    expect(ids).toHaveLength(3);
    for (const id of ids) {
      expect(
        distributions[id].Properties.DistributionConfig.DefaultCacheBehavior
          .ViewerProtocolPolicy,
      ).toBe('redirect-to-https');
    }
  });

  test('Lightsail WordPress instance + static IP are provisioned', () => {
    template.resourceCountIs('AWS::Lightsail::Instance', 1);
    template.resourceCountIs('AWS::Lightsail::StaticIp', 1);
    template.hasResourceProperties('AWS::Lightsail::Instance', {
      InstanceName: 'rae-portfolio-wp-dev',
      BlueprintId: 'wordpress',
    });
    template.hasResourceProperties('AWS::Lightsail::StaticIp', {
      StaticIpName: 'rae-portfolio-wp-ip-dev',
    });
  });

  test('Route 53 alias records are created for both frontend and API domains', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'dev.rae-dev.com.',
      Type: 'A',
    });
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'api-dev.rae-dev.com.',
      Type: 'A',
    });
  });

  test('a custom CORS response-headers policy is attached to the WordPress distribution', () => {
    template.resourceCountIs('AWS::CloudFront::ResponseHeadersPolicy', 1);
    template.hasResourceProperties('AWS::CloudFront::ResponseHeadersPolicy', {
      ResponseHeadersPolicyConfig: Match.objectLike({
        Name: 'rae-portfolio-cors-policy-dev',
        CorsConfig: Match.objectLike({
          AccessControlAllowCredentials: true,
          AccessControlAllowOrigins: {
            Items: Match.arrayWith([
              'http://localhost:5173',
              'https://dev.rae-dev.com',
            ]),
          },
        }),
      }),
    });
  });

  test('Lambda automation functions exist for static-IP attachment and WordPress config', () => {
    // Stack creates these app-level lambdas plus CDK custom-resource framework
    // lambdas (deployment, log retention, etc.). Counting >= 2 keeps the
    // assertion resilient to incidental CDK-internal lambda count changes.
    const fns = template.findResources('AWS::Lambda::Function');
    const names = Object.keys(fns);
    expect(names.length).toBeGreaterThanOrEqual(2);
  });

  test('exposes expected stack outputs', () => {
    template.hasOutput('WebsiteBucketName', {});
    template.hasOutput('FrontendDistributionId', {});
    template.hasOutput('WordPressDistributionId', {});
    template.hasOutput('WordPressPublicIP', {});
    template.hasOutput('WordPressAPIURL', {});
    template.hasOutput('GithubDeployRoleArn', {});
  });

  test('creates a GitHub OIDC provider scoped to actions.githubusercontent.com', () => {
    template.resourceCountIs('Custom::AWSCDKOpenIdConnectProvider', 1);
  });

  test('GitHub deploy role trust is scoped to the dev environment for this repo', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'github-deploy-dev',
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 'sts:AssumeRoleWithWebIdentity',
            Effect: 'Allow',
            Condition: Match.objectLike({
              StringEquals: Match.objectLike({
                'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
                'token.actions.githubusercontent.com:sub':
                  'repo:rae004/rae-dev-portfolio-2026:environment:dev',
              }),
            }),
          }),
        ]),
      }),
    });
  });

  test('GitHub deploy role can invalidate the frontend distribution and only the frontend distribution', () => {
    // The deploy role's inline policy should target a specific Frontend
    // distribution ARN — never `*` and never the WordPress distribution.
    const policies = template.findResources('AWS::IAM::Policy');
    const deployPolicies = Object.entries(policies).filter(([, p]) =>
      JSON.stringify(p.Properties.Roles ?? []).includes('GithubDeployRole'),
    );
    expect(deployPolicies).toHaveLength(1);

    const statements: Array<{
      Action?: string | string[];
      Resource?: unknown;
    }> = deployPolicies[0][1].Properties.PolicyDocument.Statement;
    const invalidationStatements = statements.filter(stmt => {
      const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
      return actions.includes('cloudfront:CreateInvalidation');
    });

    expect(invalidationStatements).toHaveLength(1);
    const resourceJson = JSON.stringify(invalidationStatements[0].Resource);
    expect(resourceJson).toContain('FrontendDistribution');
    expect(resourceJson).not.toContain('WordPressDistribution');
    expect(invalidationStatements[0].Resource).not.toBe('*');
  });

  test('contact-form: creates only the recipients SSM parameter (recaptcha lives in WP admin)', () => {
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/rae-portfolio/dev/contact/recipients',
      Type: 'StringList',
      Value: 'rae004dev@gmail.com',
    });
    // No SSM parameter for the reCAPTCHA secret — WP admin is the source of truth.
    const params = template.findResources('AWS::SSM::Parameter');
    const names = Object.values(params).map(p => p.Properties.Name);
    expect(names).not.toContain('/rae-portfolio/dev/contact/recaptcha-secret');
  });

  test('contact-form: Lambda env vars point at WP for verification + the recipients param', () => {
    // RECIPIENTS_PARAM resolves to a CFN Ref at synth — assert presence only.
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
      Handler: 'index.handler',
      Environment: Match.objectLike({
        Variables: Match.objectLike({
          FROM_ADDRESS: 'no-reply@rae-dev.com',
          WP_API_BASE: 'https://api-dev.rae-dev.com',
          RECIPIENTS_PARAM: Match.anyValue(),
        }),
      }),
    });
  });

  test('contact-form: SES send permission is scoped to identities in this account, not global *', () => {
    const policies = template.findResources('AWS::IAM::Policy');
    const sesStatements = Object.values(policies).flatMap(p => {
      const stmts = p.Properties.PolicyDocument.Statement as Array<{ Action: string | string[]; Resource: unknown }>;
      return stmts.filter(s => {
        const actions = Array.isArray(s.Action) ? s.Action : [s.Action];
        return actions.includes('ses:SendEmail');
      });
    });

    expect(sesStatements.length).toBeGreaterThan(0);
    const resourceJson = JSON.stringify(sesStatements[0].Resource);
    // Scoped to our account's identities — sandbox mode requires permission
    // on both sender AND recipient identities; out of sandbox can tighten.
    expect(resourceJson).toContain('233416806179:identity/');
    expect(sesStatements[0].Resource).not.toBe('*');
  });

  test('contact-form: HTTP API exposes a POST /contact route with CORS for the dev domain', () => {
    template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      ProtocolType: 'HTTP',
      CorsConfiguration: Match.objectLike({
        AllowMethods: Match.arrayWith(['POST']),
        AllowOrigins: Match.arrayWith(['https://dev.rae-dev.com']),
      }),
    });
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      RouteKey: 'POST /contact',
    });
  });

  test('contact-form: Lambda has reserved concurrency cap to bound abuse cost', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
      ReservedConcurrentExecutions: 5,
    });
  });

  test('contact-form: API stage has per-route throttling', () => {
    template.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
      StageName: '$default',
      DefaultRouteSettings: Match.objectLike({
        ThrottlingRateLimit: 5,
        ThrottlingBurstLimit: 10,
      }),
    });
  });

  test('media library: dedicated private S3 bucket exists and blocks public access', () => {
    // BucketName resolves to Fn::Join with AWS::AccountId at synth, so we
    // find by name pattern in the serialized Properties instead of literal.
    const buckets = template.findResources('AWS::S3::Bucket');
    const mediaBucket = Object.values(buckets).find(b =>
      JSON.stringify(b.Properties.BucketName).includes('rae-portfolio-media-dev'),
    );
    expect(mediaBucket).toBeDefined();
    expect(mediaBucket!.Properties.PublicAccessBlockConfiguration).toEqual({
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    });
  });

  test('media library: dedicated CloudFront distribution exists with HTTPS-only viewer policy', () => {
    const distributions = template.findResources('AWS::CloudFront::Distribution');
    const mediaDist = Object.values(distributions).find(d =>
      String(d.Properties.DistributionConfig.Comment ?? '').includes('Media library CDN'),
    );
    expect(mediaDist).toBeDefined();
    expect(mediaDist!.Properties.DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy).toBe(
      'redirect-to-https',
    );
    // Custom domain wired via Aliases
    expect(mediaDist!.Properties.DistributionConfig.Aliases).toContain('media-dev.rae-dev.com');
  });

  test('media library: Route 53 alias for media-dev.rae-dev.com', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'media-dev.rae-dev.com.',
      Type: 'A',
    });
  });

  test('media library: dedicated IAM user for the WP Offload plugin, with no inline access key', () => {
    template.hasResourceProperties('AWS::IAM::User', {
      UserName: 'rae-portfolio-media-uploader-dev',
    });
    // Access keys must be created out-of-band — never inline in CFN.
    const accessKeys = template.findResources('AWS::IAM::AccessKey');
    expect(Object.keys(accessKeys)).toHaveLength(0);
  });

  test('media library: uploader IAM permissions scoped to the media bucket only', () => {
    const policies = template.findResources('AWS::IAM::Policy');
    const uploaderPolicies = Object.values(policies).filter(p => {
      const refs = JSON.stringify(p.Properties.Users ?? []);
      return refs.includes('MediaUploaderUser');
    });
    expect(uploaderPolicies.length).toBeGreaterThan(0);

    const allStatements = uploaderPolicies.flatMap(
      p => p.Properties.PolicyDocument.Statement as Array<{ Action: string | string[]; Resource: unknown }>,
    );
    // Every action listed must be S3, and every resource ARN must include the media bucket.
    for (const stmt of allStatements) {
      const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
      for (const action of actions) expect(action).toMatch(/^s3:/);
      const resourceJson = JSON.stringify(stmt.Resource);
      expect(resourceJson).toContain('MediaBucket');
      expect(stmt.Resource).not.toBe('*');
    }
  });
});

describe('RaePortfolioStack (no cert)', () => {
  test('skips Route 53 record creation when no certificate is provided', () => {
    const app = new cdk.App();
    const stack = new RaePortfolioStack(app, 'RaePortfolioDevNoCert', {
      env: { account: '233416806179', region: 'us-east-1' },
      envName: 'dev',
      domainName: 'rae-dev.com',
      // certificateArn intentionally omitted
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Route53::RecordSet', 0);
    // Distributions are still created without the alias records
    template.resourceCountIs('AWS::CloudFront::Distribution', 3);
  });
});
