# Rae Dev portfolio site 2026 build Specification

## Description

Robert Engel needs a new portfolio website to showcase his development work. One that highlights his unique career and skill set he's built over the years. From working in the music industry, recording and mixing albums and singles for artists and labels, managing world-class recording studios, leading teams of customer service reps in a call center, developing software engineering skills with PHP and JavaScript by building e-commerce sites with Magento, Shopify, and WordPress, to becoming a certified cloud engineer deploying workloads to the cloud using proper IAC and CI/CD practices, working with TypeScript and Python.

The portfolio site will follow modern software, AWS, and web development best practices. It is being built with a headless WordPress backend, deployed to AWS Light Sail, to be used purely as a CMS. A frontend built using React, utilizing TanStack Router for page routing, TanStack Query for data fetching and caching, TanStack form for user submissions on the front end, and DaisyUI for styling and theming components.

The site will be hosted on AWS, utilizing LightSail for WordPress CMS, CloudFront for a CDN, and S3 for the static hosting of front-end files. The files repository will be hosted on GitHub and utilize GitHub Actions for CI/CD. All infrastructure and AWS resources will be created using IAC best practices with AWS CDK.

The site will consist of a home page, a resume page, a software projects page, a media projects page, a contact us page, and a blog (list and individual post pages). The home page will feature a hero section with a full-width image, followed by a description of the site's purpose.

## Architecture

This section covers details about individual pieces of the site's architecture.

### WordPress CMS -

- Uses the latest version of WordPress, configured with automatic security updates only.
- Start with three custom post types: resume, software-project, and media-project.
- Will receive theme updates from a private S3 bucket, using a signed URL good for 7 days, with functionality to regenerate the signed URL if it expires.
- Has unit tests for known cases using PHPUnit.
- Utilizes PHPCS for linting and formatting to WordPress standard and PHPStan for static analysis.
- Deployed to AWS LightSail with locked-down security groups, only allowing access from specific IPs.
- Media will be offloaded to AWS S3.

### Front End site -

- Uses the latest stable version of Typescript and React and follows modern best practices for Static Sites in React.
- Utilizes TanStack Router for page routing.
- Utilizes TanStack Query for fetching data from WP CMS and caching efficiently on the client side.
- Utilizes TanStack Form for any user form interactions.
- All pages, sections, and components will be themed and styled using DaisyUI themes and components, allowing users to select their preferred theme from the full list of themes available with DaisyUI.
- The design will be mobile-first, also including breakpoints for small tablets, large tablets, and desktop screen sizes. All site features need to be visible and usable across all these device sizes.
- Utilizes Eslint for linting with React recommendations, Prettier for code formatting, and Jest for any JavaScript unit tests needed.
- The app will use Vite as the bundler and PNPM as the package manager.
- Minimize the bundle size as much as possible by ensuring only the necessary JavaScript and styles are delivered to the front-end client, with the goal of keeping the initial payload size under 13KB.
- Ensure the front-end complies with modern accessibility (A11y) practices and adheres to WCAG 2.2 AA standards, including an A11y statement page.
- All pages of this site are required to maintain a score of 100 for all categories in the Google Lighthouse page speed insights scans.

### AWS Cloud Infrastructure -

- All infrastructure and resource creation and destruction will be automated using AWS CDK.
- All AWS CDK Code will be Typescript, including lambdas, and adhere to AWS CDK NAG Pack AwsSolutionsChecks.
- Use L1 constructs with CfnInstance for LightSail resources created by AWS CDK.
- Use Origin Access Control (OAC) to create a future-proof solution for securing S3 origins with CloudFront.
- Use aggressive caching for static assets served over CloudFront with durations of 365 days, and disable caching behaviors for headers, cookies, or query strings. Enable Gzip and Brotli compression.
- Use shorter cache durations for HTML files, with a default TTL of 5 minutes, a maximum TTL of 24 hours, and a minimum TTL of 0. Disable cache behaviors for headers and cookies and enable all query string cache behaviors. Enable Gzip and Brotli compression.
- Use strict security headers for CloudFront response headers policy.
- Uses SSL certificate from ACM, configured in AWS CDK config.
- Uses a domain registered with AWS Route 53 with a hosted zone.
- Able to deploy multiple environments based on configurations (e.g. development, staging, production).
- Deploy and destroy infrastructure using a Bash script that adheres to all shell check best practices for modern Bash scripts.
- Use TypeScript Config Files for environment settings in development, staging, and production environments, utilizing getConfig and validateConfig helper functions.
- Adheres to ALL pillars of the AWS Well-Architected Framework.

### CI/CD details -

- Use Git Hub actions and run CI on all PRs
- CI includes running all linters, formatters, and tests mentioned in this document for WordPress back-end, Typescript front-end, and bash scripts.
- Deploy to LightSail and S3 and invalidate CloudFront when PR is merged.

### Local Development -

- Local WordPress runs in Docker, and the environment is built using Docker Compose, with the needed ports exposed to allow the front-end to fetch data.
- The local React front-end runs on the host and uses an environment file to retrieve values of the exposed Docker resources for the back-end CMS.
- Can run all linters, formatters, and tests with a Bash script that adheres to all shell check best practices for modern Bash scripts.

### Repo Root Directory Structure -

- .github/
  - workflows/
- infrastructure/ - all cdk code
- frontend/ - all React code
- wordpress/ - all WordPress code
- scripts/ - all Bash scripts
- documentation/ - all documentation, including this file.

### Notes for Claude -

- Review this document thoroughly and develop an implementation plan.
- After you review this document ./documentation/rea_dev_resume.pdf for resume details.
- After receiving the resume details, please review all pages on the current portfolio site at <https://rae-dev.com>.
- After a thorough review of all documents and resources, please create a detailed plan for implementing this portfolio website.
