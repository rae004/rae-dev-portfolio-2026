# Portfolio Content Plan

Single source-of-truth for content to populate WordPress (Resume Items, Skills,
Software Projects, Media Projects, About blurb, Testimonials). Reviewed before
WP-CLI bulk-create.

## Source map

| Source | Used for |
|---|---|
| `~/Documents/robert_engel_resume_with_audio_2025.pdf` | Resume entries, skills, audio-era client list |
| `https://github.com/rae004` (35 repos, all-tabs scrape) | Software Projects |
| `~/Documents/Profile.csv` (LinkedIn export) | About blurb, geo, headline |
| `~/Documents/Recommendations_Received.csv` | Testimonials section (audio-era) |
| AllMusic credits (manual paste) | Media Projects (24 entries after filter) |
| `https://dev.rae-dev.com/resume` | Verified existing site is sparse — full repopulate needed |

## About / Summary

Composed from LinkedIn summary + resume PDF, refreshed for Jan 2026 role split.

> Software engineer with 10+ years of full-stack experience, currently focused
> on cloud architecture, AI/ML integration, and developer infrastructure. AWS
> Certified Solutions Architect Associate, AI Practitioner, and Cloud
> Practitioner. Career arc: studio engineer → PHP/Magento dev → full-stack →
> cloud/AI engineering. Currently Engineer III on the Enterprise
> Infrastructure & Architecture team at Mutual of Omaha (remote from St.
> Petersburg, FL), with concurrent consulting work at Apollidon Learning where
> I led the development team for 4+ years.

**Geo:** St. Petersburg, FL · Remote
**Pronouns/handle:** rae-dev / rae004
**Email:** rae004dev@gmail.com (resume) / rae004@gmail.com (personal)
**LinkedIn:** linkedin.com/in/rae-dev

## Resume Items (Custom Post Type: `resume`)

Chronological, newest first. Two concurrent "current" roles is intentional.

| # | Company | Title | Start | End | Location |
|---|---|---|---|---|---|
| 1 | Mutual of Omaha | Engineer III · Enterprise Infrastructure & Architecture Services | Jan 2026 | Current | Remote |
| 2 | Apollidon Learning | Consulting Software Engineer | Jan 2026 | Current | Tampa, FL (Remote) |
| 3 | Apollidon Learning | Principal Software Engineer | Oct 2024 | Jan 2026 | Tampa, FL |
| 4 | Apollidon Learning | Senior Software Engineer | May 2023 | Oct 2024 | Tampa, FL |
| 5 | Apollidon Learning | Full Stack Software Engineer | Jun 2021 | May 2023 | Tampa, FL |
| 6 | Lead by Sales | Web Developer | Mar 2017 | Jun 2021 | Tarpon Springs, FL |
| 7 | Lead by Sales | PHP Developer | Oct 2015 | Mar 2017 | Tarpon Springs, FL |
| 8 | Audio Work (Freelance) | Recording & Mixing Engineer | Jul 2007 | Mar 2013 | Charlotte, NC |
| 9 | Reflection Sound Studios | Studio Manager | Jan 2003 | Jul 2007 | Charlotte, NC |
| 10 | Full Sail University | A.S. Recording Arts Technology *(education)* | — | Dec 2002 | Winter Park, FL |

Description bullets verbatim from PDF for #3–#9. Need new bullets for #1 and
#2 — placeholders below, please refine.

### #1 — Mutual of Omaha · Engineer III

- Joined the Enterprise Infrastructure & Architecture Services team in January
  2026 to drive cloud platform engineering and AI enablement across the
  organization.
- Led organization-wide enablement of AWS Bedrock and Amazon Bedrock
  AgentCore, providing patterns, reference architectures, and guardrails for
  application teams adopting generative AI.
- Designed and deployed an organization-wide Bedrock Guardrail using Bedrock
  Policies, applied across ~600 AWS accounts via a three-account delegated
  administration architecture for centralized governance with distributed
  enforcement.
- Built the AI Inventory and VulnOps applications used company-wide,
  providing internal tooling for AI workload visibility and vulnerability
  operations.

### #2 — Apollidon Learning · Consulting Software Engineer

- Continuing as a consulting engineer after transitioning out of the
  full-time Principal role in January 2026.
- Providing advisory and implementation support on the Lead Processing
  Engine and Custom CMS, plus AWS account management and continued mentorship
  of the development team I previously led.

### #3–#9

Bullets pre-populated from `robert_engel_resume_with_audio_2025.pdf` — see PDF
for verbatim text; no rewrites needed.

## Skills (Custom Post Type: `skill`)

Verbatim from resume PDF SKILLS section, organized for the existing skills
system (skills_type = category, skills_value = skill name).

**Front-end** (15): React, Next.js, Vue, TypeScript, JavaScript, HTML, CSS,
SCSS, Tailwind, ShadCN, DaisyUI, Material UI, Prime React, Formik, TanStack
Query, TanStack Router, TanStack Form

**Back-end** (10): Node.js, Nest.js, Vite, Bun, Deno, TypeScript, PHP, Python,
Bash, Curl, Docker, Postman

**Data Storage & Transfer** (10): MySQL, Postgres, MariaDB, GraphQL, TypeORM,
Yup, Pandas, NumPy, Pydantic, API Design and Development

**Mockups/Testing** (15): Jest, React Testing Library, Supertest, Playwright,
Puppeteer, Cypress, ESLint, Prettier, PHP CodeSniffer, PHPStan, PHPUnit,
Pytest, Mypy, Black, Isort, Bandit

**UX Design & Analytics** (8): Figma, Google Analytics (GA4), Tableau, Google
Tag Manager, Confluence, Grafana, Prometheus, Jaeger

**AWS Services** (~30): Bedrock, SageMaker, CDK, CloudFormation, SDK, ECS,
Lambda, Fargate, EC2, AWS Batch, RDS, Aurora, Redshift, S3, EventBridge,
Secrets Manager, KMS, ACM, SSM, CodePipeline, CodeBuild, CloudFront,
CloudWatch, SQS, SNS, SES, VPC, Route 53, IAM, Identity Center, CloudTrail,
GuardDuty, Inspector, Trusted Advisor, Security Hub

**Tools/Practices** (10): IaC, CI/CD, DevOps, Boto3, Git, GitHub, Bitbucket,
JetBrains, VS Code, Swagger, Linux & macOS

**Certifications** (3, separate display):
- AWS Certified Solutions Architect — Associate ([verify](https://cp.certmetrics.com/amazon/en/public/verify/credential/6b97a2424cf34b77b29bf6ee4c465fad))
- AWS Certified AI Practitioner ([verify](https://cp.certmetrics.com/amazon/en/public/verify/credential/e0d0962f5f7344d9871ba20e43acbc87))
- AWS Certified Cloud Practitioner ([verify](https://cp.certmetrics.com/amazon/en/public/verify/credential/a3692f174d334c5499 33b6a4094555f1))

## Software Projects (Custom Post Type: `software-projects`)

Curated from 35 GitHub repos. Picked for portfolio quality — skip tutorial /
boilerplate / leetcode repos.

| Order | Repo | Pitch | Stack | Tags |
|---|---|---|---|---|
| 1 | rae-dev-portfolio-2026 | This site. Headless WordPress + React/Vite SPA on AWS, fully CI/CD-deployed. | React 19, TypeScript, Vite, TanStack, AWS CDK, WordPress, CloudFront | meta, AWS, full-stack |
| 2 | rae-time-tracker-and-invoice | Time tracker that generates client/project invoice PDFs. | TypeScript, React, Node | productivity, full-stack |
| 3 | ai-security-digest | Serverless RSS/NVD/ArXiv pipeline → Claude triage → AWS SES email digest. | TypeScript, AWS Lambda, Bedrock, SES, EventBridge | AI, AWS, automation |
| 4 | rae-budget | Pay-vs-spending tracker. | TypeScript, React | personal-finance |
| 5 | rae-movies | Movie search & detail viewer. | TypeScript, React | TMDB, full-stack |
| 6 | rae-search | AI-free Google search results UI. | CSS, JavaScript | search |
| 7 | rae-cdk-common-lib | Reusable AWS CDK constructs library (1 fork). | TypeScript, AWS CDK | infra, library |
| 8 | nextjs-serverless-aws-deploy | Next.js → AWS deployment starter via custom CDK construct (2★, 2 forks). | TypeScript, Next.js, AWS CDK | infra, starter |
| 9 | rae-game-of-life | Conway's Game of Life. | TypeScript | algorithms |
| 10 | dumbo-rumps | Kruger National Park-inspired site (1★). | TypeScript | design |
| 11 | raefetch | Linux system info bash script (1★). | Shell | tooling |
| 12 | docker-wordpress | Docker Compose Bitnami WordPress quick-start. | PHP, Docker | DevOps |

**Skipped (intentional):** algorithms, leet-code-exercises, FizzBuzz,
go-tutorials, go-tutorial-*, go-bird-encyclopedia, go-simple-web-api,
aws-cdk-workshop, nextjs-typescript, vanilla-web, aws-cli-bash-helpers,
rae-test, rae-cm-catalog (private/internal?), rae-chat-bot, rae-chat-monorepo,
test-aws-bedrock-agent-sdk, get-file-paths.

If any of these belong on the site, flag them and I'll move them up.

## Media Projects (Custom Post Type: `media-projects`)

24 credits from AllMusic after filtering out "Booking" and "Brushes" sideman
roles. Sorted newest first; year-less entries at the end.

| # | Year | Album | Primary Artist | Role |
|---|---|---|---|---|
| 1 | 2011 | Back to Love | Anthony Hamilton | Assistant, Engineer |
| 2 | 2009 | The Naked Clarinet | Libby Larsen / Miklós Rózsa / Joan Tower / Tasha Warren | Engineer |
| 3 | 2009 | Roadsinger | Cat Stevens / Yusuf | Audio Engineer, Assistant Engineer |
| 4 | 2009 | Living Past | Mark Lassiter | Engineer |
| 5 | 2008 | Witness Protection | Dave Hollister | Engineer, Mixing Assistant |
| 6 | 2008 | The Point of It All | Anthony Hamilton | Assistant |
| 7 | 2008 | Brian Vander Ark | Brian Vander Ark | Programming, Digital Editing, Assistant |
| 8 | 2007 | Tokyo Belle | Lane Thaw | Engineer |
| 9 | 2007 | To the Fallen, Vol. 1 | *(various)* | Assistant |
| 10 | 2007 | Grand Finale: Encourage Yourself | Donald Lawrence / Tri-City Singers | Assistant |
| 11 | 2006 | Traveling Light | Volatile Baby | Engineer, Digital Editing |
| 12 | 2006 | Introducing DeWayne Woods & When Singers Meet | DeWayne Woods | Mixing Assistant |
| 13 | 2006 | Finalé: Act One | Donald Lawrence | Assistant |
| 14 | 2006 | Donald Lawrence Presents: The Tri City Singers — Finale [DVD/CD] | Tri-City Singers | Assistant |
| 15 | 2005 | Cause for Alarm | Shadowflag | Assistant Engineer |
| 16 | 2005 | Soulife | Anthony Hamilton | Engineer, Digital Editing |
| 17 | 2005 | I Know the Truth | Shirley Caesar | Pro-Tools |
| 18 | 2005 | Ain't Nobody Worryin' | Anthony Hamilton | Assistant Engineer, Assistant |
| 19 | 2003 | The Lindsey Horne Band | Lindsey Horne | Engineer |
| 20 | — | The Last Thorn of Summer | L.A. Tool And Die | **Producer, Engineer** |
| 21 | — | My Name is Támar | Tamar Davis | **Producer, Musician, Composer** |
| 22 | — | Her Heart | Anthony Hamilton | Assistant Engineer |
| 23 | — | End of Ride Revisited | Paris Keeling | Assistant Engineer |
| 24 | — | Bummer Summer | Flashlights | Engineer |

Marquee credits to feature: **Anthony Hamilton (×4)**, **Cat Stevens/Yusuf**,
**Larry Graham** *(dropped — booking only)*, **Shirley Caesar**, **Donald
Lawrence (gospel × 3)**, **Tamar Davis (Prince protégée — full producer
credit)**.

Resume PDF also asserts client list: **A&M, Warner Bros., HBO, Def Jam** — use
as additional flavor copy on the Media Projects landing page.

## Testimonials

Two LinkedIn recommendations (both 2009, audio-era). Display on Media Projects
page as testimonials.

### Lane Thaw — Finance & IT Support Specialist, R.S.H Inc. (Sep 4, 2009)

> Bob Engel is a top notch Sound Engineer and has worked for me on several
> projects. He has great ears and is one of the better Pro Tools Engineers
> around. I have worked with Bob at several studios and he adapts quickly and
> his easy going personality should not be mistaken for anything less than a
> perfectionist when it comes to tracking and mixing. I really like his
> willingness to try other things and to ask the right questions. During one
> session he took the time to contact Producer Bruce Swedien to make certain
> it was exactly what Bruce wanted sound wise for that track. He never lets
> his ego get in the way. I look forward to working with Bob again on the next
> project.

*(Also note: Lane is the artist on Tokyo Belle, 2007 — direct collab.)*

### Mark Williams — Editor/Publisher, Dark Lantern Tales (Aug 28, 2009)

> Bob has assisted me on a number of recording projects and I have recommended
> him as a Pro Tools expert to several of my own clients and associates.

## Open questions / gaps

- [x] ~~Mutual of Omaha role bullets~~ — done (Bedrock + AgentCore enablement, org-wide Guardrail across ~600 accounts, AI Inventory + VulnOps apps)
- [x] ~~Apollidon consulting engagement bullets~~ — done (advisory + implementation on LPE & CMS, AWS account mgmt, team mentorship)
- [ ] Any **internal/private** GitHub work worth name-dropping (without code link)? *(deferred)*
- [ ] Media Projects: do you want **album cover art** on each? If so, where do they come from — manual upload to WordPress media library, or pull from MusicBrainz/Discogs API? *(deferred)*
- [ ] Testimonials placement — Media Projects only, or also a sitewide "what people say" section? *(deferred)*
- [ ] About-page photo / headshot — current site appears to have no photo *(deferred)*

## Next steps after sign-off

1. WP-CLI dry-run of all `wp post create` commands → review
2. Bulk-create against local Docker WordPress first, verify rendering on
   localhost:5173
3. Re-run identical script against `api-dev.rae-dev.com` (production WP)
4. Frontend should pick everything up automatically via existing TanStack
   Query hooks — no FE code changes expected
