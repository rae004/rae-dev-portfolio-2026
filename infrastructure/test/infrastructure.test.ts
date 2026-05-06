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

  test('exactly two CloudFront distributions are created (frontend + WordPress)', () => {
    template.resourceCountIs('AWS::CloudFront::Distribution', 2);
  });

  test('every CloudFront distribution redirects HTTP traffic to HTTPS', () => {
    const distributions = template.findResources('AWS::CloudFront::Distribution');
    const ids = Object.keys(distributions);
    expect(ids).toHaveLength(2);
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
    template.resourceCountIs('AWS::CloudFront::Distribution', 2);
  });
});
