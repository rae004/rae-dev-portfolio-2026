# AWS CDK Deployment Guide

## Environment Setup

### 1. Configure Environment Variables

Create a `.env` file in the `infrastructure/` directory:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```bash
# Development Environment
DEV_CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/your-dev-cert-id
DEV_DOMAIN=dev.rae-dev.com

# Production Environment  
PROD_CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/your-prod-cert-id
PROD_DOMAIN=raeengel.dev

# AWS Configuration
AWS_REGION=us-east-1
CDK_DEFAULT_ACCOUNT=123456789012
CDK_DEFAULT_REGION=us-east-1
```

### 2. Alternative: Export Environment Variables

Instead of using `.env`, you can export environment variables:

```bash
export DEV_CERTIFICATE_ARN="arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id"
export CDK_DEFAULT_ACCOUNT="123456789012"
export CDK_DEFAULT_REGION="us-east-1"
```

## Deployment Commands

### Development Environment

```bash
# With AWS profile
npm run cdk deploy RaePortfolioDev -- --profile rae_dev

# With default AWS credentials
npm run cdk deploy RaePortfolioDev
```

### Production Environment

```bash
# With AWS profile
npm run cdk deploy RaePortfolioProd -- --profile rae_prod

# With default AWS credentials
npm run cdk deploy RaePortfolioProd
```

## Certificate Setup

### Option 1: Deploy Without Certificate (CloudFront default domain)

If you don't have an SSL certificate yet, you can deploy without setting `DEV_CERTIFICATE_ARN`:

- The stack will deploy successfully
- CloudFront will use its default domain (e.g., `d1234567890123.cloudfront.net`)
- No Route 53 records will be created

### Option 2: Deploy With Custom Domain

1. **Create SSL Certificate in AWS Certificate Manager (ACM)**:
   ```bash
   aws acm request-certificate \
     --domain-name dev.rae-dev.com \
     --validation-method DNS \
     --profile rae_dev
   ```

2. **Get the Certificate ARN**:
   ```bash
   aws acm list-certificates --profile rae_dev
   ```

3. **Set the Certificate ARN** in your `.env` file or export it:
   ```bash
   export DEV_CERTIFICATE_ARN="arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id"
   ```

4. **Deploy the stack**:
   ```bash
   npm run cdk deploy RaePortfolioDev -- --profile rae_dev
   ```

## Stack Outputs

After deployment, the stack will output:

- **WebsiteBucketName**: S3 bucket for static assets
- **DistributionId**: CloudFront distribution ID
- **DistributionDomainName**: CloudFront domain name
- **WordPressPublicIP**: LightSail WordPress instance IP
- **WebsiteURL**: Custom domain URL (if certificate provided)

## Troubleshooting

### Certificate ARN Not Found

If you see "Dev Certificate ARN: Not set", ensure:

1. `.env` file exists in `infrastructure/` directory
2. `DEV_CERTIFICATE_ARN` is set in `.env` or exported
3. Certificate exists in the correct AWS region (us-east-1 for CloudFront)

### AWS Credentials

Ensure AWS credentials are configured:

```bash
# Check current credentials
aws sts get-caller-identity --profile rae_dev

# Configure if needed
aws configure --profile rae_dev
```

### LightSail Static IP Attachment

The static IP attachment for LightSail must be done manually:

```bash
aws lightsail attach-static-ip \
  --static-ip-name rae-portfolio-wp-ip-dev \
  --instance-name rae-portfolio-wp-dev \
  --region us-east-1 \
  --profile rae_dev
```

## Cleanup

To destroy the stack:

```bash
npm run cdk destroy RaePortfolioDev -- --profile rae_dev
```

**Note**: The S3 bucket will be retained if `envName === 'prod'`.