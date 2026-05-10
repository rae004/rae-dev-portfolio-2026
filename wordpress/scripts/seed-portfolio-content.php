<?php
/**
 * Portfolio content seeder.
 *
 * Idempotent slug-based upsert of skills, resume items, software projects,
 * and media projects from documentation/portfolio_content_plan.md.
 *
 * Run via: ./wordpress/scripts/seed.sh [local|dev]
 * Direct:  cat seed-portfolio-content.php | wp eval-file - --allow-root
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	fwrite( STDERR, "Must run via wp eval-file.\n" );
	exit( 1 );
}

// =====================================================================
// Helpers
// =====================================================================

function rae_upsert( $post_type, $slug, $args ) {
	$existing = get_posts( array(
		'post_type'      => $post_type,
		'name'           => $slug,
		'post_status'    => 'any',
		'posts_per_page' => 1,
		'fields'         => 'ids',
	) );

	$post_data = array_merge(
		array(
			'post_type'   => $post_type,
			'post_name'   => $slug,
			'post_status' => 'publish',
		),
		$args
	);

	if ( ! empty( $existing ) ) {
		$post_data['ID'] = $existing[0];
		$id              = wp_update_post( $post_data, true );
		$action          = 'updated';
	} else {
		$id     = wp_insert_post( $post_data, true );
		$action = 'created';
	}

	if ( is_wp_error( $id ) ) {
		WP_CLI::warning( "Failed to $action $post_type/$slug: " . $id->get_error_message() );
		return null;
	}

	WP_CLI::log( sprintf( '  [%-7s] %s/%s -> #%d', $action, $post_type, $slug, $id ) );
	return $id;
}

function rae_set_meta( $post_id, $meta ) {
	foreach ( $meta as $key => $value ) {
		update_post_meta( $post_id, $key, $value );
	}
}

function rae_skill_ids( $slugs ) {
	$ids = array();
	foreach ( $slugs as $slug ) {
		$existing = get_posts( array(
			'post_type'      => 'skill',
			'name'           => $slug,
			'post_status'    => 'any',
			'posts_per_page' => 1,
			'fields'         => 'ids',
		) );
		if ( ! empty( $existing ) ) {
			$ids[] = (int) $existing[0];
		} else {
			WP_CLI::warning( "Unknown skill slug referenced: $slug" );
		}
	}
	return $ids;
}

function rae_bullets( $items ) {
	$out = "<ul>\n";
	foreach ( $items as $item ) {
		$out .= '	<li>' . $item . "</li>\n";
	}
	$out .= '</ul>';
	return $out;
}

// =====================================================================
// 1. SKILLS
// =====================================================================

WP_CLI::log( '== Seeding skills ==' );

$skills = array(
	// --- Front-end ---
	array( 'react',                    'React',                    'Front-end' ),
	array( 'nextjs',                   'Next.js',                  'Front-end' ),
	array( 'vue',                      'Vue',                      'Front-end' ),
	array( 'html',                     'HTML',                     'Front-end' ),
	array( 'css',                      'CSS',                      'Front-end' ),
	array( 'scss',                     'SCSS',                     'Front-end' ),
	array( 'tailwind',                 'Tailwind',                 'Front-end' ),
	array( 'shadcn',                   'ShadCN',                   'Front-end' ),
	array( 'daisyui',                  'DaisyUI',                  'Front-end' ),
	array( 'material-ui',              'Material UI',              'Front-end' ),
	array( 'prime-react',              'Prime React',              'Front-end' ),
	array( 'formik',                   'Formik',                   'Front-end' ),
	array( 'tanstack-query',           'TanStack Query',           'Front-end' ),
	array( 'tanstack-router',          'TanStack Router',          'Front-end' ),
	array( 'tanstack-form',            'TanStack Form',            'Front-end' ),

	// --- Back-end ---
	array( 'typescript',               'TypeScript',               'Back-end' ),
	array( 'javascript',               'JavaScript',               'Back-end' ),
	array( 'nodejs',                   'Node.js',                  'Back-end' ),
	array( 'nestjs',                   'Nest.js',                  'Back-end' ),
	array( 'vite',                     'Vite',                     'Back-end' ),
	array( 'bun',                      'Bun',                      'Back-end' ),
	array( 'deno',                     'Deno',                     'Back-end' ),
	array( 'php',                      'PHP',                      'Back-end' ),
	array( 'python',                   'Python',                   'Back-end' ),
	array( 'bash',                     'Bash',                     'Back-end' ),
	array( 'curl',                     'Curl',                     'Back-end' ),
	array( 'docker',                   'Docker',                   'Back-end' ),
	array( 'postman',                  'Postman',                  'Back-end' ),

	// --- Data Storage & Transfer ---
	array( 'mysql',                    'MySQL',                    'Data Storage & Transfer' ),
	array( 'postgres',                 'Postgres',                 'Data Storage & Transfer' ),
	array( 'mariadb',                  'MariaDB',                  'Data Storage & Transfer' ),
	array( 'graphql',                  'GraphQL',                  'Data Storage & Transfer' ),
	array( 'typeorm',                  'TypeORM',                  'Data Storage & Transfer' ),
	array( 'yup',                      'Yup',                      'Data Storage & Transfer' ),
	array( 'pandas',                   'Pandas',                   'Data Storage & Transfer' ),
	array( 'numpy',                    'NumPy',                    'Data Storage & Transfer' ),
	array( 'pydantic',                 'Pydantic',                 'Data Storage & Transfer' ),
	array( 'api-design',               'API Design & Development', 'Data Storage & Transfer' ),

	// --- Mockups/Testing ---
	array( 'jest',                     'Jest',                     'Mockups/Testing' ),
	array( 'react-testing-library',    'React Testing Library',    'Mockups/Testing' ),
	array( 'supertest',                'Supertest',                'Mockups/Testing' ),
	array( 'playwright',               'Playwright',               'Mockups/Testing' ),
	array( 'puppeteer',                'Puppeteer',                'Mockups/Testing' ),
	array( 'cypress',                  'Cypress',                  'Mockups/Testing' ),
	array( 'eslint',                   'ESLint',                   'Mockups/Testing' ),
	array( 'prettier',                 'Prettier',                 'Mockups/Testing' ),
	array( 'php-codesniffer',          'PHP CodeSniffer',          'Mockups/Testing' ),
	array( 'phpstan',                  'PHPStan',                  'Mockups/Testing' ),
	array( 'phpunit',                  'PHPUnit',                  'Mockups/Testing' ),
	array( 'pytest',                   'Pytest',                   'Mockups/Testing' ),
	array( 'mypy',                     'Mypy',                     'Mockups/Testing' ),
	array( 'black',                    'Black',                    'Mockups/Testing' ),
	array( 'isort',                    'Isort',                    'Mockups/Testing' ),
	array( 'bandit',                   'Bandit',                   'Mockups/Testing' ),

	// --- UX Design & Analytics ---
	array( 'figma',                    'Figma',                    'UX Design & Analytics' ),
	array( 'google-analytics',         'Google Analytics (GA4)',   'UX Design & Analytics' ),
	array( 'tableau',                  'Tableau',                  'UX Design & Analytics' ),
	array( 'google-tag-manager',       'Google Tag Manager',       'UX Design & Analytics' ),
	array( 'confluence',               'Confluence',               'UX Design & Analytics' ),
	array( 'grafana',                  'Grafana',                  'UX Design & Analytics' ),
	array( 'prometheus',               'Prometheus',               'UX Design & Analytics' ),
	array( 'jaeger',                   'Jaeger',                   'UX Design & Analytics' ),

	// --- AWS Services ---
	array( 'aws-bedrock',              'AWS Bedrock',              'AWS Services' ),
	array( 'aws-agentcore',            'Amazon Bedrock AgentCore', 'AWS Services' ),
	array( 'aws-sagemaker',            'AWS SageMaker',            'AWS Services' ),
	array( 'aws-cdk',                  'AWS CDK',                  'AWS Services' ),
	array( 'aws-cloudformation',       'AWS CloudFormation',       'AWS Services' ),
	array( 'aws-sdk',                  'AWS SDK',                  'AWS Services' ),
	array( 'aws-ecs',                  'AWS ECS',                  'AWS Services' ),
	array( 'aws-lambda',               'AWS Lambda',               'AWS Services' ),
	array( 'aws-fargate',              'AWS Fargate',              'AWS Services' ),
	array( 'aws-ec2',                  'AWS EC2',                  'AWS Services' ),
	array( 'aws-batch',                'AWS Batch',                'AWS Services' ),
	array( 'aws-rds',                  'AWS RDS',                  'AWS Services' ),
	array( 'aws-aurora',               'AWS Aurora',               'AWS Services' ),
	array( 'aws-redshift',             'AWS Redshift',             'AWS Services' ),
	array( 'aws-glue',                 'AWS Glue',                 'AWS Services' ),
	array( 'aws-s3',                   'AWS S3',                   'AWS Services' ),
	array( 'aws-eventbridge',          'AWS EventBridge',          'AWS Services' ),
	array( 'aws-secrets-manager',      'AWS Secrets Manager',      'AWS Services' ),
	array( 'aws-kms',                  'AWS KMS',                  'AWS Services' ),
	array( 'aws-acm',                  'AWS ACM',                  'AWS Services' ),
	array( 'aws-ssm',                  'AWS SSM',                  'AWS Services' ),
	array( 'aws-codepipeline',         'AWS CodePipeline',         'AWS Services' ),
	array( 'aws-codebuild',            'AWS CodeBuild',            'AWS Services' ),
	array( 'aws-cloudfront',           'AWS CloudFront',           'AWS Services' ),
	array( 'aws-cloudwatch',           'AWS CloudWatch',           'AWS Services' ),
	array( 'aws-sqs',                  'AWS SQS',                  'AWS Services' ),
	array( 'aws-sns',                  'AWS SNS',                  'AWS Services' ),
	array( 'aws-ses',                  'AWS SES',                  'AWS Services' ),
	array( 'aws-vpc',                  'AWS VPC',                  'AWS Services' ),
	array( 'aws-route-53',             'AWS Route 53',             'AWS Services' ),
	array( 'aws-iam',                  'AWS IAM',                  'AWS Services' ),
	array( 'aws-identity-center',      'AWS Identity Center',      'AWS Services' ),
	array( 'aws-cloudtrail',           'AWS CloudTrail',           'AWS Services' ),
	array( 'aws-guardduty',            'AWS GuardDuty',            'AWS Services' ),
	array( 'aws-inspector',            'AWS Inspector',            'AWS Services' ),
	array( 'aws-trusted-advisor',      'AWS Trusted Advisor',      'AWS Services' ),
	array( 'aws-security-hub',         'AWS Security Hub',         'AWS Services' ),

	// --- Tools/Practices ---
	array( 'iac',                      'IaC',                      'Tools/Practices' ),
	array( 'ci-cd',                    'CI/CD',                    'Tools/Practices' ),
	array( 'devops',                   'DevOps',                   'Tools/Practices' ),
	array( 'boto3',                    'Boto3',                    'Tools/Practices' ),
	array( 'git',                      'Git',                      'Tools/Practices' ),
	array( 'github',                   'GitHub',                   'Tools/Practices' ),
	array( 'bitbucket',                'Bitbucket',                'Tools/Practices' ),
	array( 'jetbrains',                'JetBrains',                'Tools/Practices' ),
	array( 'vscode',                   'VS Code',                  'Tools/Practices' ),
	array( 'swagger',                  'Swagger',                  'Tools/Practices' ),
	array( 'linux-macos',              'Linux & macOS',            'Tools/Practices' ),

	// --- Audio (for pre-tech career roles & media projects) ---
	array( 'pro-tools',                'Pro Tools',                'Audio' ),
	array( 'audio-engineering',        'Audio Engineering',        'Audio' ),
	array( 'mixing',                   'Mixing',                   'Audio' ),
	array( 'recording',                'Recording',                'Audio' ),
	array( 'digital-editing',          'Digital Editing',          'Audio' ),
	array( 'producing',                'Producing',                'Audio' ),

	// --- WordPress/CMS (used in Apollidon + Lead by Sales work) ---
	array( 'wordpress',                'WordPress',                'CMS & E-commerce' ),
	array( 'magento',                  'Magento',                  'CMS & E-commerce' ),
	array( 'shopify',                  'Shopify',                  'CMS & E-commerce' ),
);

foreach ( $skills as $s ) {
	list( $slug, $title, $type ) = $s;
	$id = rae_upsert( 'skill', $slug, array(
		'post_title'   => $title,
		'post_content' => '',
	) );
	if ( $id ) {
		rae_set_meta( $id, array(
			'_skill_type'  => $type,
			'_skill_value' => $title,
		) );
	}
}

// =====================================================================
// 2. RESUME ITEMS
// =====================================================================

WP_CLI::log( '== Seeding resume items ==' );

$resume_items = array(

	array(
		'slug'          => 'mutual-of-omaha-engineer-iii',
		'title'         => 'Mutual of Omaha — Engineer III, Enterprise Infrastructure & Architecture Services',
		'bullets'       => array(
			'Joined the Enterprise Infrastructure &amp; Architecture Services team in January 2026 to drive cloud platform engineering and AI enablement across the organization.',
			'Led organization-wide enablement of AWS Bedrock and Amazon Bedrock AgentCore, providing patterns, reference architectures, and guardrails for application teams adopting generative AI.',
			'Designed and deployed an organization-wide Bedrock Guardrail using Bedrock Policies, applied across ~600 AWS accounts via a three-account delegated administration architecture for centralized governance with distributed enforcement.',
			'Built the AI Inventory and VulnOps applications used company-wide, providing internal tooling for AI workload visibility and vulnerability operations.',
		),
		'start_raw'     => '2026-01-05',
		'start_display' => 'January 2026',
		'currently'     => true,
		'skills'        => array( 'aws-bedrock', 'aws-agentcore', 'aws-cdk', 'aws-iam', 'aws-identity-center', 'typescript', 'python', 'iac', 'ci-cd', 'devops', 'github' ),
	),

	array(
		'slug'          => 'apollidon-consulting-software-engineer',
		'title'         => 'Apollidon Learning — Consulting Software Engineer',
		'bullets'       => array(
			'Continuing as a consulting engineer after transitioning out of the full-time Principal role at the end of 2025.',
			'Providing advisory and implementation support on the Lead Processing Engine and Custom CMS, plus AWS account management and continued mentorship of the development team I previously led.',
		),
		'start_raw'     => '2026-01-01',
		'start_display' => 'January 2026',
		'currently'     => true,
		'skills'        => array( 'typescript', 'nodejs', 'aws-cdk', 'aws-lambda', 'aws-ecs', 'aws-rds', 'aws-iam', 'react', 'php' ),
	),

	array(
		'slug'          => 'apollidon-principal-software-engineer',
		'title'         => 'Apollidon Learning — Principal Software Engineer',
		'bullets'       => array(
			'Enhanced a Lead Processing Engine with a new Spam detection strategy using the Generative AI model Claude 3.5, running as an agent in AWS Bedrock.',
			'Developed a data warehouse with a Postgres AWS Redshift cluster, S3, automated ETL processes using AWS Glue and AWS Lambda.',
			'Built a model to extract marketing insights using a Retrieval-Augmented Fine-tuning approach with AWS Bedrock agents and knowledge bases, utilizing TypeScript and Node.js with AWS CDK.',
			'Created a custom WordPress theme with a parent theme for core functionality and a child theme for client styles, using PHP, JavaScript, HTML, and SCSS, ensuring a consistent content editing experience across client sites.',
			'Developed a Reddit Content Sniffer in Python, Pandas, NumPy, Pydantic, and PRAW to search a list of subreddits and find matches to keywords/phrases daily, storing results in AWS S3, with workflow managed by AWS EventBridge and AWS Batch. Once a week, compile a CSV file of results and email it to a notification list using AWS EventBridge, AWS Lambda, and AWS SES.',
			'Established policies and procedures aligned with Best Practices for the Software Development Lifecycle, including unit testing, code linting and formatting, automated deployment using CI/CD, and Infrastructure as Code (IaC) methods.',
			'Developed a WordPress plugin with PHP to track custom user events and integrate with the Active Campaign API for targeted marketing efforts.',
			'Participated in leadership meetings to contribute to the company&#8217;s strategic planning as the lead of a six-person development team.',
		),
		'start_raw'     => '2024-10-01',
		'start_display' => 'October 2024',
		'end_raw'       => '2025-12-31',
		'end_display'   => 'December 2025',
		'currently'     => false,
		'skills'        => array( 'typescript', 'nodejs', 'php', 'python', 'pandas', 'numpy', 'pydantic', 'aws-bedrock', 'aws-cdk', 'aws-lambda', 'aws-redshift', 'aws-glue', 'aws-s3', 'aws-eventbridge', 'aws-batch', 'aws-ses', 'wordpress', 'scss', 'html', 'javascript', 'mysql', 'postgres', 'iac', 'ci-cd', 'devops', 'github' ),
	),

	array(
		'slug'          => 'apollidon-senior-software-engineer',
		'title'         => 'Apollidon Learning — Senior Software Engineer',
		'bullets'       => array(
			'Enhanced a Lead Processing Engine to include configurable forms with default values and integrated them with TypeScript, React, Formik, and Yup, hosted on AWS S3 and delivered via AWS CloudFront CDN using the AWS SDK.',
			'Participated in agile development of products within cross-functional teams.',
			'Modernized a Custom CMS application using TypeScript, Node.js, and GraphQL, with Infrastructure as Code (IaC) practices utilizing AWS CDK for automated multi-environment deployments.',
			'Developed a WordPress plugin using PHP to preserve query parameters across page navigation, ensuring accurate marketing attribution.',
			'Enhanced AWS Cloud observability by utilizing AWS EventBridge, CloudWatch Dashboards and Alarms, for Lead Processing Engine and Custom CMS applications.',
		),
		'start_raw'     => '2023-05-01',
		'start_display' => 'May 2023',
		'end_raw'       => '2024-09-30',
		'end_display'   => 'October 2024',
		'currently'     => false,
		'skills'        => array( 'typescript', 'nodejs', 'react', 'formik', 'yup', 'graphql', 'php', 'wordpress', 'aws-cdk', 'aws-cloudfront', 'aws-s3', 'aws-sdk', 'aws-eventbridge', 'aws-cloudwatch', 'iac' ),
	),

	array(
		'slug'          => 'apollidon-full-stack-software-engineer',
		'title'         => 'Apollidon Learning — Full Stack Software Engineer',
		'bullets'       => array(
			'Created a Lead Processing Engine that connects web forms from different websites to marketing services and filters out spam, using TypeScript, Node.js, Nest.js, MySQL, TypeORM, Next.js, SCSS, AWS Lambda, AWS CDK &amp; SDK. Containerized with Docker and hosted in AWS ECS for container orchestration and AWS RDS for the data layer.',
			'Mentored and developed junior developers and engineers to upskill and increase productivity.',
			'Drafted design objectives and system design documents in Confluence.',
			'Implemented best practices for IaC with AWS CDK, CI/CD with AWS CodePipeline and CodeBuild, and code quality standards using ESLint and Prettier in the Lead Processing Engine.',
		),
		'start_raw'     => '2021-06-01',
		'start_display' => 'June 2021',
		'end_raw'       => '2023-04-30',
		'end_display'   => 'May 2023',
		'currently'     => false,
		'skills'        => array( 'typescript', 'nodejs', 'nestjs', 'nextjs', 'mysql', 'typeorm', 'scss', 'docker', 'aws-cdk', 'aws-sdk', 'aws-lambda', 'aws-ecs', 'aws-rds', 'aws-codepipeline', 'aws-codebuild', 'eslint', 'prettier', 'confluence', 'iac', 'ci-cd' ),
	),

	array(
		'slug'          => 'lead-by-sales-web-developer',
		'title'         => 'Lead by Sales — Web Developer',
		'bullets'       => array(
			'Developed private Shopify apps using TypeScript, Node.js hosted on AWS.',
			'Migrated a PHP Magento e-commerce site and two WordPress sites to Shopify.',
			'Customized and maintained a Magento e-commerce and WordPress sites with PHP, Bash, JavaScript, HTML, and CSS.',
			'Configured and managed multiple AWS resources, including EC2, VPC, CodeBuild, and CodePipeline.',
			'Developed and maintained the PHP API integration between Magento and ShipStation.',
		),
		'start_raw'     => '2017-03-01',
		'start_display' => 'March 2017',
		'end_raw'       => '2021-05-31',
		'end_display'   => 'June 2021',
		'currently'     => false,
		'skills'        => array( 'typescript', 'nodejs', 'php', 'bash', 'javascript', 'html', 'css', 'shopify', 'magento', 'wordpress', 'aws-ec2', 'aws-vpc', 'aws-codebuild', 'aws-codepipeline', 'mysql' ),
	),

	array(
		'slug'          => 'lead-by-sales-php-developer',
		'title'         => 'Lead by Sales — PHP Developer',
		'bullets'       => array(
			'Developed web-based PHP, JavaScript, HTML, and CSS applications for deployment on the Magento platform.',
			'Maintained and customized WordPress plugins and themes using Bash and PHP.',
		),
		'start_raw'     => '2015-10-01',
		'start_display' => 'October 2015',
		'end_raw'       => '2017-02-28',
		'end_display'   => 'March 2017',
		'currently'     => false,
		'skills'        => array( 'php', 'javascript', 'html', 'css', 'bash', 'magento', 'wordpress', 'mysql' ),
	),

	array(
		'slug'          => 'audio-work-freelance-recording-mixing-engineer',
		'title'         => 'Audio Work — Freelance Recording &amp; Mixing Engineer',
		'bullets'       => array(
			'Recorded, edited, and mixed instrumental and vocal tracks.',
			'Managed setup and tear-down of sound and music equipment before and after performances to promote efficient workflow.',
			'Collaborated with producers and performers to determine and achieve the desired sound for productions and provide studio system oversight for recordings.',
			'Prepared for recording sessions by selecting and setting up microphones and sound equipment.',
			'Clients include A&amp;M, Warner Bros., HBO, and Def Jam.',
		),
		'start_raw'     => '2007-07-01',
		'start_display' => 'July 2007',
		'end_raw'       => '2013-03-31',
		'end_display'   => 'March 2013',
		'currently'     => false,
		'skills'        => array( 'pro-tools', 'audio-engineering', 'mixing', 'recording', 'digital-editing' ),
	),

	array(
		'slug'          => 'reflection-sound-studios-studio-manager',
		'title'         => 'Reflection Sound Studios — Studio Manager',
		'bullets'       => array(
			'Welcomed customers and asked open-ended questions to understand individual needs.',
			'Trained new employees and sustained high staff morale through ongoing coaching and team-building activities.',
			'Guided studio equipment repairs and services to maintain high-quality work.',
			'Assigned tasks to staff, establishing priorities and goals.',
		),
		'start_raw'     => '2003-01-01',
		'start_display' => 'January 2003',
		'end_raw'       => '2007-06-30',
		'end_display'   => 'July 2007',
		'currently'     => false,
		'skills'        => array( 'pro-tools', 'audio-engineering', 'recording' ),
	),

	array(
		'slug'          => 'full-sail-university-recording-arts-technology',
		'title'         => 'Full Sail University — A.S. Recording Arts Technology',
		'bullets'       => array(
			'Associate of Science: Recording Arts Technology, completed December 2002.',
			'Winter Park, FL.',
		),
		'start_raw'     => '2001-01-01',
		'start_display' => '',
		'end_raw'       => '2002-12-31',
		'end_display'   => 'December 2002',
		'currently'     => false,
		'skills'        => array( 'audio-engineering', 'recording' ),
	),
);

foreach ( $resume_items as $r ) {
	$id = rae_upsert( 'resume', $r['slug'], array(
		'post_title'   => $r['title'],
		'post_content' => rae_bullets( $r['bullets'] ),
	) );
	if ( ! $id ) {
		continue;
	}

	$end_raw     = isset( $r['end_raw'] ) ? $r['end_raw'] : '';
	$end_display = isset( $r['end_display'] ) ? $r['end_display'] : ( $r['currently'] ? 'Present' : '' );

	rae_set_meta( $id, array(
		'_resume_start_date'         => $r['start_display'],
		'_resume_start_date_raw'     => $r['start_raw'],
		'_resume_end_date'           => $r['currently'] ? 'Present' : $end_display,
		'_resume_end_date_raw'       => $r['currently'] ? '' : $end_raw,
		'_resume_currently_employed' => $r['currently'] ? '1' : '0',
		'_resume_related_skills'     => rae_skill_ids( $r['skills'] ),
	) );
}

// =====================================================================
// 3. SOFTWARE PROJECTS
// =====================================================================

WP_CLI::log( '== Seeding software projects ==' );

$software_projects = array(

	array(
		'slug'        => 'rae-dev-portfolio-2026',
		'title'       => 'rae-dev-portfolio-2026',
		'description' => 'This portfolio site. Headless WordPress + React/Vite SPA on AWS, fully CI/CD-deployed via GitHub Actions, OIDC, release-please, and AWS CDK. Demonstrates the full stack end-to-end: custom post types and REST API in PHP, modern React 19 frontend with TanStack Router/Query/Form, DaisyUI theming, reCAPTCHA v3 protection, and CloudFront/S3/Lightsail infrastructure-as-code.',
		'release'     => '2026-05-08',
		'repo'        => 'https://github.com/rae004/rae-dev-portfolio-2026',
		'demo'        => 'https://dev.rae-dev.com',
		'state'       => 'Ongoing',
		'categories'  => array( 'Front-end', 'Back-end', 'AWS Services' ),
		'skills'      => array( 'react', 'typescript', 'vite', 'tanstack-query', 'tanstack-router', 'tanstack-form', 'daisyui', 'tailwind', 'php', 'wordpress', 'aws-cdk', 'aws-cloudfront', 'aws-s3', 'aws-acm', 'aws-route-53', 'github', 'ci-cd', 'iac' ),
	),

	array(
		'slug'        => 'rae-time-tracker-and-invoice',
		'title'       => 'rae-time-tracker-and-invoice',
		'description' => 'Time tracker that generates client/project invoice PDFs. Built with TypeScript and React for tracking work hours across multiple clients and producing professional invoice exports.',
		'release'     => '2026-05-03',
		'repo'        => 'https://github.com/rae004/rae-time-tracker-and-invoice',
		'demo'        => '',
		'state'       => 'Ongoing',
		'categories'  => array( 'Front-end' ),
		'skills'      => array( 'typescript', 'react', 'nodejs' ),
	),

	array(
		'slug'        => 'ai-security-digest',
		'title'       => 'ai-security-digest',
		'description' => 'Serverless pipeline that scrapes RSS, NVD, and ArXiv sources, runs each item through Claude for triage and summarization, then delivers a curated digest by email via AWS SES. Orchestrated with EventBridge schedules on AWS Lambda.',
		'release'     => '2026-05-01',
		'repo'        => 'https://github.com/rae004/ai-security-digest',
		'demo'        => '',
		'state'       => 'Ongoing',
		'categories'  => array( 'AWS Services', 'Back-end' ),
		'skills'      => array( 'typescript', 'aws-lambda', 'aws-bedrock', 'aws-ses', 'aws-eventbridge', 'aws-cdk' ),
	),

	array(
		'slug'        => 'rae-budget',
		'title'       => 'rae-budget',
		'description' => 'Personal budget tracker for visualizing pay vs. spending over time.',
		'release'     => '2026-04-27',
		'repo'        => 'https://github.com/rae004/rae-budget',
		'demo'        => '',
		'state'       => 'Ongoing',
		'categories'  => array( 'Front-end' ),
		'skills'      => array( 'typescript', 'react' ),
	),

	array(
		'slug'        => 'rae-movies',
		'title'       => 'rae-movies',
		'description' => 'Movie search and detail viewer. React app for searching and viewing details about movies.',
		'release'     => '2024-09-08',
		'repo'        => 'https://github.com/rae004/rae-movies',
		'demo'        => '',
		'state'       => 'Completed',
		'categories'  => array( 'Front-end' ),
		'skills'      => array( 'typescript', 'react' ),
	),

	array(
		'slug'        => 'rae-search',
		'title'       => 'rae-search',
		'description' => 'A site to retrieve AI-free Google search results.',
		'release'     => '2024-08-25',
		'repo'        => 'https://github.com/rae004/rae-search',
		'demo'        => '',
		'state'       => 'Completed',
		'categories'  => array( 'Front-end' ),
		'skills'      => array( 'css', 'javascript', 'html' ),
	),

	array(
		'slug'        => 'rae-cdk-common-lib',
		'title'       => 'rae-cdk-common-lib',
		'description' => 'Library of reusable AWS CDK constructs for common infrastructure patterns.',
		'release'     => '2024-01-01',
		'repo'        => 'https://github.com/rae004/rae-cdk-common-lib',
		'demo'        => '',
		'state'       => 'Completed',
		'categories'  => array( 'AWS Services' ),
		'skills'      => array( 'typescript', 'aws-cdk', 'iac' ),
	),

	array(
		'slug'        => 'nextjs-serverless-aws-deploy',
		'title'       => 'nextjs-serverless-aws-deploy',
		'description' => 'Starter template for serverless Next.js deployment on AWS via a custom CDK Construct.',
		'release'     => '2022-02-16',
		'repo'        => 'https://github.com/rae004/nextjs-serverless-aws-deploy',
		'demo'        => '',
		'state'       => 'Completed',
		'categories'  => array( 'AWS Services', 'Front-end' ),
		'skills'      => array( 'typescript', 'nextjs', 'aws-cdk', 'aws-lambda', 'aws-cloudfront', 'iac' ),
	),

	array(
		'slug'        => 'rae-game-of-life',
		'title'       => 'rae-game-of-life',
		'description' => "Conway's Game of Life implementation in TypeScript.",
		'release'     => '2024-05-05',
		'repo'        => 'https://github.com/rae004/rae-game-of-life',
		'demo'        => '',
		'state'       => 'Completed',
		'categories'  => array( 'Front-end' ),
		'skills'      => array( 'typescript' ),
	),

	array(
		'slug'        => 'dumbo-rumps',
		'title'       => 'dumbo-rumps',
		'description' => 'Kruger National Park-inspired website.',
		'release'     => '2023-02-13',
		'repo'        => 'https://github.com/rae004/dumbo-rumps',
		'demo'        => '',
		'state'       => 'Completed',
		'categories'  => array( 'Front-end' ),
		'skills'      => array( 'typescript', 'react' ),
	),

	array(
		'slug'        => 'raefetch',
		'title'       => 'raefetch',
		'description' => 'Bash script for displaying Linux system information at terminal startup.',
		'release'     => '2021-11-19',
		'repo'        => 'https://github.com/rae004/raefetch',
		'demo'        => '',
		'state'       => 'Completed',
		'categories'  => array( 'Tools/Practices' ),
		'skills'      => array( 'bash', 'linux-macos' ),
	),

	array(
		'slug'        => 'docker-wordpress',
		'title'       => 'docker-wordpress',
		'description' => 'Docker Compose Bitnami WordPress quick-start setup.',
		'release'     => '2024-01-08',
		'repo'        => 'https://github.com/rae004/docker-wordpress',
		'demo'        => '',
		'state'       => 'Completed',
		'categories'  => array( 'Tools/Practices' ),
		'skills'      => array( 'docker', 'wordpress', 'php' ),
	),
);

foreach ( $software_projects as $p ) {
	$id = rae_upsert( 'software-project', $p['slug'], array(
		'post_title'   => $p['title'],
		'post_content' => $p['description'],
	) );
	if ( ! $id ) {
		continue;
	}
	rae_set_meta( $id, array(
		'_software_project_release_date'    => $p['release'],
		'_software_project_repo_link'       => $p['repo'],
		'_software_project_demo_link'       => $p['demo'],
		'_software_project_state'           => $p['state'],
		'_software_project_tech_categories' => $p['categories'],
		'_software_project_related_skills'  => rae_skill_ids( $p['skills'] ),
	) );
}

// =====================================================================
// 4. MEDIA PROJECTS
// =====================================================================

WP_CLI::log( '== Seeding media projects ==' );

$media_projects = array(

	array( 'back-to-love-anthony-hamilton',                  'Back to Love',                                                       'Anthony Hamilton',                                                  '2011', 'Assistant, Engineer' ),
	array( 'the-naked-clarinet',                             'The Naked Clarinet',                                                 'Libby Larsen / Mikl&oacute;s R&oacute;zsa / Joan Tower / Tasha Warren', '2009', 'Engineer' ),
	array( 'roadsinger-cat-stevens-yusuf',                   'Roadsinger',                                                         'Cat Stevens / Yusuf',                                               '2009', 'Audio Engineer, Assistant Engineer' ),
	array( 'living-past-mark-lassiter',                      'Living Past',                                                        'Mark Lassiter',                                                     '2009', 'Engineer' ),
	array( 'witness-protection-dave-hollister',              'Witness Protection',                                                 'Dave Hollister',                                                    '2008', 'Engineer, Mixing Assistant' ),
	array( 'the-point-of-it-all-anthony-hamilton',           'The Point of It All',                                                'Anthony Hamilton',                                                  '2008', 'Assistant' ),
	array( 'brian-vander-ark',                               'Brian Vander Ark',                                                   'Brian Vander Ark',                                                  '2008', 'Programming, Digital Editing, Assistant' ),
	array( 'tokyo-belle-lane-thaw',                          'Tokyo Belle',                                                        'Lane Thaw',                                                         '2007', 'Engineer' ),
	array( 'to-the-fallen-vol-1',                            'To the Fallen, Vol. 1',                                              'Various Artists',                                                   '2007', 'Assistant' ),
	array( 'grand-finale-encourage-yourself',                'Grand Finale: Encourage Yourself',                                   'Donald Lawrence / Tri-City Singers',                                '2007', 'Assistant' ),
	array( 'traveling-light-volatile-baby',                  'Traveling Light',                                                    'Volatile Baby',                                                     '2006', 'Engineer, Digital Editing' ),
	array( 'introducing-dewayne-woods',                      'Introducing DeWayne Woods &amp; When Singers Meet',                  'DeWayne Woods',                                                     '2006', 'Mixing Assistant' ),
	array( 'finale-act-one-donald-lawrence',                 'Final&eacute;: Act One',                                             'Donald Lawrence',                                                   '2006', 'Assistant' ),
	array( 'donald-lawrence-presents-tri-city-singers-finale', 'Donald Lawrence Presents: The Tri City Singers — Finale [DVD/CD]', 'Tri-City Singers',                                                  '2006', 'Assistant' ),
	array( 'cause-for-alarm-shadowflag',                     'Cause for Alarm',                                                    'Shadowflag',                                                        '2005', 'Assistant Engineer' ),
	array( 'soulife-anthony-hamilton',                       'Soulife',                                                            'Anthony Hamilton',                                                  '2005', 'Engineer, Digital Editing' ),
	array( 'i-know-the-truth-shirley-caesar',                'I Know the Truth',                                                   'Shirley Caesar',                                                    '2005', 'Pro-Tools' ),
	array( 'aint-nobody-worryin-anthony-hamilton',           "Ain't Nobody Worryin'",                                              'Anthony Hamilton',                                                  '2005', 'Assistant Engineer, Assistant' ),
	array( 'the-lindsey-horne-band',                         'The Lindsey Horne Band',                                             'Lindsey Horne',                                                     '2003', 'Engineer' ),
	array( 'the-last-thorn-of-summer-la-tool-and-die',       'The Last Thorn of Summer',                                           'L.A. Tool And Die',                                                 '',     'Producer, Engineer' ),
	array( 'my-name-is-tamar-tamar-davis',                   'My Name is T&aacute;mar',                                            'Tamar Davis',                                                       '',     'Producer, Musician, Composer' ),
	array( 'her-heart-anthony-hamilton',                     'Her Heart',                                                          'Anthony Hamilton',                                                  '',     'Assistant Engineer' ),
	array( 'end-of-ride-revisited-paris-keeling',            'End of Ride Revisited',                                              'Paris Keeling',                                                     '',     'Assistant Engineer' ),
	array( 'bummer-summer-flashlights',                      'Bummer Summer',                                                      'Flashlights',                                                       '',     'Engineer' ),
);

foreach ( $media_projects as $m ) {
	list( $slug, $album, $artist, $year, $role ) = $m;

	$release_date = $year ? "$year-01-01" : '';

	$content = sprintf(
		'<p><strong>Role:</strong> %s</p><p>Album <em>%s</em> by %s%s.</p>',
		esc_html( $role ),
		$album,
		$artist,
		$year ? ", released in $year" : ''
	);

	$id = rae_upsert( 'media-project', $slug, array(
		'post_title'   => $album,
		'post_content' => $content,
	) );
	if ( ! $id ) {
		continue;
	}

	// Map AllMusic role string to relevant audio skills.
	$role_lower    = strtolower( $role );
	$skill_slugs   = array( 'audio-engineering' );
	if ( str_contains( $role_lower, 'producer' ) ) {
		$skill_slugs[] = 'producing';
	}
	if ( str_contains( $role_lower, 'engineer' ) ) {
		$skill_slugs[] = 'recording';
	}
	if ( str_contains( $role_lower, 'mixing' ) ) {
		$skill_slugs[] = 'mixing';
	}
	if ( str_contains( $role_lower, 'editing' ) ) {
		$skill_slugs[] = 'digital-editing';
	}
	if ( str_contains( $role_lower, 'pro-tools' ) || str_contains( $role_lower, 'pro tools' ) ) {
		$skill_slugs[] = 'pro-tools';
	}

	// NOTE: theme has a schema fork between meta-box and REST API.
	//   - meta-box reads/writes: _music_album_names (admin UI)
	//   - REST API reads:        _music_album_title, _music_role (frontend)
	// Write to BOTH so admin and API both populate. Theme cleanup is a
	// separate task — see documentation/portfolio_content_plan.md.
	rae_set_meta( $id, array(
		'_media_project_type'           => 'Music',
		'_music_artist_name'            => $artist,
		'_music_album_names'            => $album, // admin meta-box
		'_music_album_title'            => $album, // REST API
		'_music_role'                   => $role,  // REST API
		'_music_release_date'           => $release_date,
		'_media_project_related_skills' => rae_skill_ids( array_unique( $skill_slugs ) ),
	) );
}

WP_CLI::success( 'Portfolio content seeded.' );
