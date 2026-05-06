# infrastructure

AWS CDK v2 (TypeScript) app for the Rae Dev portfolio. Defines two stacks — `RaePortfolioDev` and `RaePortfolioProd` — both produced by the single `RaePortfolioStack` construct in `lib/rae-portfolio-stack.ts`. Only the dev stack is currently deployed.

For the full deployment workflow (including the manual WordPress URL/HTTPS reconciliation steps), see `../documentation/AWS_DEPLOYMENT_GUIDE.md` and `./DEPLOYMENT.md`.

## What the stack creates

- **S3** website bucket (`rae-portfolio-<env>-<account>`), private, OAC-locked
- **CloudFront** distribution for the SPA, aliased to `<env>.<domain>` (e.g. `dev.rae-dev.com`)
- **Lightsail** WordPress instance + static IP, with a `StaticIpAttachment` custom resource backed by a Lambda that ensures the IP stays attached
- **CloudFront** distribution for WordPress, aliased to `api-<env>.<domain>` (e.g. `api-dev.rae-dev.com`), with a custom CORS response-headers policy
- **Lambda** `WordPressConfigFunction` custom resource for post-deploy URL/HTTPS configuration on the Lightsail instance
- **Route 53** A-aliases for both CloudFront distributions in the existing hosted zone

## Configuration

`bin/infrastructure.ts` reads from `.env` (via `dotenv`). Copy `.env.example` and fill in:

```
DEV_CERTIFICATE_ARN=arn:aws:acm:us-east-1:<account>:certificate/<id>   # us-east-1, wildcard for the domain
DEV_DOMAIN=rae-dev.com
PROD_CERTIFICATE_ARN=...
PROD_DOMAIN=raeengel.dev
CDK_DEFAULT_ACCOUNT=<account>
CDK_DEFAULT_REGION=us-east-1
```

The certificate must live in `us-east-1` (CloudFront requirement).

## Commands

The package uses PNPM. The `cdk` script in `package.json` pins `--profile rae_dev`; pass `-- --profile <other>` to override.

```bash
pnpm install
pnpm build           # tsc
pnpm cdk:synth RaePortfolioDev
pnpm cdk:diff  RaePortfolioDev
pnpm cdk:deploy RaePortfolioDev
pnpm cdk:destroy RaePortfolioDev   # S3 bucket retained when envName === 'prod'
pnpm test            # jest (currently no project tests)
```

## Stack outputs (dev)

After `cdk deploy RaePortfolioDev` the stack exposes:

- `WebsiteBucketName`, `FrontendDistributionId`, `FrontendDistributionDomainName`, `WebsiteURL`
- `WordPressInstanceName`, `WordPressPublicIP`, `WordPressAdminURL`, `WordPressHealthCheckURL`
- `WordPressDistributionId`, `WordPressDistributionDomainName`, `WordPressAPIURL`

## Lambda code

`lambda/` contains the handlers used by the custom resources:

- `lightsail-automation/` — attaches/detaches the static IP idempotently
- `wordpress-config/` — drives the post-deploy WordPress URL/HTTPS configuration on the running Lightsail instance

Both are bundled with the stack and have minimal runtime dependencies.
