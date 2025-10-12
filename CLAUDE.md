# Claude Memory - Rae Dev Portfolio 2026 Project

## Project Overview
Building a modern portfolio website for Robert Engel showcasing his diverse career journey from music industry to cloud engineering. The site follows modern software development best practices with a headless WordPress backend and React frontend.

## Current Status: ✅ PHASE 4 IN PROGRESS - AWS CDK Infrastructure + LightSail Automation 
**Phases 1-3 COMPLETE**: Frontend Foundation, WordPress Integration, Dynamic Integration
**Phase 4 ACTIVE**: AWS CDK deployment with automated LightSail WordPress configuration

## Architecture Status
- **Frontend**: React + TypeScript + Vite + TanStack Router + DaisyUI ✅ COMPLETE
- **Backend**: WordPress CMS (Headless) with custom post types ✅ COMPLETE  
- **Data Layer**: TanStack Query + WordPress REST API integration ✅ COMPLETE
- **Infrastructure**: AWS CDK v2 with S3, CloudFront, LightSail ✅ 90% COMPLETE
- **Automation**: LightSail static IP attachment via Lambda ✅ IMPLEMENTED
- **Development**: Docker Compose for local WordPress ✅ WORKING

## Technology Stack (Current Working Setup)
- **React**: 19.1.1 with TypeScript
- **Build Tool**: Vite 7.1.7 (Current Node.js: v18.16.0, works fine, v22+ recommended)
- **Package Manager**: PNPM v8.6.0+
- **Routing**: TanStack Router 1.132.41 with route generation via `pnpm routes:generate`
- **Styling**: Tailwind CSS 3.4.18 + DaisyUI 4.12.10 (CRITICAL: v4.x only, v5.x broken)
- **Themes**: 29+ DaisyUI themes working perfectly with smooth transitions
- **State Management**: TanStack Query 5.90.2 ✅ IMPLEMENTED + Devtools working
- **Backend**: WordPress 6.8.3 with custom theme and post types ✅
- **Database**: MySQL 8.0 in Docker container ✅
- **Development Tools**: React Query Devtools 5.90.2, phpMyAdmin, WP-CLI 2.8.1 ✅

## Critical Technical Decisions Made
1. **DaisyUI Version**: MUST use v4.12.10 - v5.x has breaking theme compatibility issues
2. **Tailwind CSS**: v3.4.18 works perfectly with DaisyUI v4.x
3. **Node Version**: Currently v18.16.0 works fine, v22+ recommended for optimal Vite 7.x
4. **Module System**: CommonJS for Tailwind config, ES modules for React components
5. **WordPress API**: Uses query parameter format `/?rest_route=` (not pretty permalinks)
6. **ACF Dependency**: Removed - caused 500 errors, now using native WordPress features only

## Directory Structure Completed
```
├── .github/workflows/     # GitHub Actions CI/CD - EMPTY
├── infrastructure/        # AWS CDK code - EMPTY  
├── frontend/             # React TypeScript application - ✅ COMPLETE + INTEGRATED
│   ├── src/
│   │   ├── lib/queryClient.ts          # TanStack Query configuration
│   │   ├── services/wordpress.ts       # WordPress API service layer
│   │   ├── hooks/useWordPress.ts       # React Query hooks
│   │   ├── types/wordpress.ts          # WordPress API TypeScript types
│   │   └── pages/                      # Route components with dynamic data
├── wordpress/            # WordPress CMS files - ✅ COMPLETE + CONFIGURED
│   ├── wp-content/themes/rae-portfolio/  # Custom headless theme
│   │   ├── functions.php               # Custom post types, CORS, REST API
│   │   ├── style.css                   # Theme stylesheet
│   │   └── index.php                   # Custom dashboard
│   └── wp-config.php                   # WordPress configuration
├── scripts/              # Bash automation scripts - EMPTY
├── docker-compose.yml    # WordPress + MySQL + phpMyAdmin - ✅ WORKING
├── Dockerfile.wordpress  # Custom WordPress container with WP-CLI 2.8.1 ✅
└── documentation/        # Project documentation
    ├── rae_dev_portfolio_2026_prompt.md
    ├── rae_dev_portfolio_2026_generated_plan.md
    └── rea_dev_resume.pdf
```

## Phase 1: Frontend Implementation Status ✅
- **Setup**: React + TypeScript + Vite project initialized ✅
- **Routing**: TanStack Router with all routes configured ✅
- **Styling**: Tailwind CSS + DaisyUI v4.12.10 working perfectly ✅
- **Theme System**: 29+ themes with switching, persistence, smooth transitions ✅
- **Navigation**: Responsive navbar with mobile dropdown ✅
- **Pages Created**: Home, Resume, Projects, Media, Contact, Blog, Accessibility ✅
- **Components**: Navigation, ThemeSwitcher with detailed theme detection ✅

## Phase 2: WordPress Integration Status ✅
- **Docker Environment**: WordPress 6.8.3, MySQL 8.0, phpMyAdmin running ✅
- **Custom Theme**: `rae-portfolio` theme active and configured ✅
- **Custom Post Types**: Resume, Software Projects, Media Projects registered ✅
- **REST API**: Endpoints working with CORS for frontend access ✅
- **TanStack Query**: Client configured with caching, retry logic, devtools ✅
- **TypeScript Integration**: Complete WordPress API type definitions ✅
- **Service Layer**: Clean API abstraction with error handling ✅
- **React Query Hooks**: Custom hooks for all WordPress data operations ✅
- **Dynamic Pages**: Resume page now loads WordPress data with fallbacks ✅
- **Error Handling**: Graceful degradation and user-friendly error messages ✅
- **Loading States**: Professional spinners and loading feedback ✅

## WordPress Custom Post Types & REST API (All Working ✅)
- **Resume Items**: `http://localhost:8080/?rest_route=/wp/v2/resume` ✅ (3 items available)
- **Software Projects**: `http://localhost:8080/?rest_route=/wp/v2/software-projects` ✅
- **Media Projects**: `http://localhost:8080/?rest_route=/wp/v2/media-projects` ✅  
- **Blog Posts**: `http://localhost:8080/?rest_route=/wp/v2/posts` ✅
- **API Discovery**: `http://localhost:8080/?rest_route=/wp/v2/` ✅

## WordPress Theme Functions (functions.php)
- Custom post type registration with REST API support
- CORS headers for frontend development (localhost:5173)
- Featured image URL exposure in REST API (ACF dependency removed)
- Theme support for post thumbnails and menus
- **CRITICAL**: No ACF (Advanced Custom Fields) dependencies - uses native WordPress only

## Key Files & Configurations

### Package Dependencies (frontend/package.json)
```json
"dependencies": {
  "@tanstack/react-form": "^1.23.5",
  "@tanstack/react-query": "^5.90.2", 
  "@tanstack/react-router": "^1.132.41",
  "daisyui": "4.12.10",
  "react": "^19.1.1",
  "tailwindcss": "^3.4.18"
},
"devDependencies": {
  "@tanstack/react-query-devtools": "^5.90.2"
}
```

### Critical Configuration (frontend/tailwind.config.js)
- Uses CommonJS syntax: `module.exports = {}`
- DaisyUI v4.x compatible config with explicit theme array
- All 29 themes explicitly listed

### Theme System Architecture
- **ThemeSwitcher Component**: Enhanced with theme detection and visual indicators
- **Theme Persistence**: localStorage with immediate HTML script initialization
- **Debug Utilities**: `themeDebug.ts` for CSS variable inspection
- **Smooth Transitions**: CSS transitions for theme changes

## Development Environment
- **Local WordPress**: Docker Compose ready (`docker-compose.yml` created)
- **Environment**: `.env.example` with all necessary variables
- **Scripts**: Package.json includes routes:generate and routes:watch

## Recent Major Issues Resolved
1. **DaisyUI v5.x Compatibility**: Downgraded to v4.12.10 after v5.x failed to generate theme CSS
2. **Theme Detection**: Created comprehensive CSS variable inspection system
3. **PostCSS Configuration**: Fixed for Tailwind CSS v3.x compatibility
4. **Route Generation**: TanStack Router route tree properly configured

## Pages Implemented
1. **HomePage**: Hero section + about + quick links with proper DaisyUI styling
2. **ResumePage**: Professional experience + technical skills with cards/badges
3. **ProjectsPage**: Software project showcase with status indicators
4. **MediaPage**: Music industry experience with skills breakdown
5. **ContactPage**: Contact form + social links + collaboration info
6. **BlogPage**: Blog post list with newsletter signup
7. **AccessibilityPage**: WCAG 2.2 AA compliance statement

## Phase 3 Priorities (Next Steps)
1. **Complete Dynamic Pages**: Update Projects, Media, Blog, and Home pages to use WordPress data
2. **TanStack Form Integration**: Implement contact form with validation
3. **AWS Infrastructure**: Deploy using CDK with LightSail, S3, CloudFront
4. **CI/CD Pipeline**: GitHub Actions for automated deployment
5. **Performance Optimization**: Bundle size optimization (<13KB target)
6. **Content Management**: Complete WordPress admin workflow setup

## Commands to Resume Development (Full Stack)
```bash
# Start WordPress backend (if not running)
docker-compose up -d

# Start React frontend
cd frontend
nvm use 22  # Or use current v18.16.0 (works fine)
pnpm install
pnpm dev  # Starts dev server on http://localhost:5173

# Access points:
# - React app: http://localhost:5173 ✅
# - WordPress admin: http://localhost:8080/wp-admin (admin/admin123456) ✅
# - phpMyAdmin: http://localhost:8081 ✅
# - WordPress REST API: http://localhost:8080/?rest_route=/wp/v2/ ✅

# WP-CLI Commands for debugging:
docker exec rae-portfolio-wp wp theme list --allow-root
docker exec rae-portfolio-wp wp post-type list --allow-root
docker exec rae-portfolio-wp wp post list --post_type=resume --allow-root
```

## Critical Notes for Development
- **DaisyUI Version**: MUST stay on v4.12.10 - DO NOT upgrade to v5.x (breaks themes)
- **Node Version**: Currently v18.16.0 works fine, v22+ recommended for optimal Vite 7.x
- **WordPress API Format**: Use query parameter format `/?rest_route=` (pretty permalinks not configured)
- **Database Access**: WordPress admin credentials are admin/admin123456
- **Container Names**: wordpress: `rae-portfolio-wp`, database: `rae-portfolio-db`, phpmyadmin: `rae-portfolio-phpmyadmin`
- **WP-CLI**: Available in container for debugging: `docker exec rae-portfolio-wp wp --allow-root`
- **ACF Dependencies**: REMOVED - caused 500 errors, using native WordPress features only

## Major Issues Resolved ✅
1. **WordPress API 500 Errors on Custom Endpoints** ✅ FIXED
   - **Root Cause**: ACF (Advanced Custom Fields) function calls without plugin installed
   - **Solution**: Removed all ACF dependencies, using native WordPress features only
   - **Result**: All custom post type endpoints now working perfectly

2. **Missing React Query Devtools** ✅ FIXED  
   - **Issue**: @tanstack/react-query-devtools package missing
   - **Solution**: Installed v5.90.2 as dev dependency
   - **Result**: Devtools working in development mode

3. **WordPress Management Difficulty** ✅ ENHANCED
   - **Enhancement**: Added WP-CLI 2.8.1 to Docker container
   - **Implementation**: Custom Dockerfile.wordpress with WP-CLI installation
   - **Benefit**: Easy WordPress debugging and content management

## Current Working State
- All WordPress REST API endpoints responding with JSON data ✅
- React frontend loading dynamic WordPress content ✅  
- Resume page fully integrated with fallback content ✅
- Error handling and loading states working ✅
- TanStack Query caching and retry logic active ✅
- React Query devtools available for debugging ✅

## Major Achievements Summary
✅ **Phase 1**: Complete React frontend with 29+ working themes
✅ **Phase 2**: Full WordPress integration with TanStack Query
✅ **Architecture**: End-to-end data flow from WordPress to React working
✅ **Developer Experience**: React Query devtools, error handling, loading states
✅ **Type Safety**: Complete TypeScript integration for WordPress API

## Sample Data Available in WordPress
```json
// Resume Items (3 available):
{
  "id": 7, "title": "Music Industry Manager",
  "content": "Managed world-class recording studios..."
},
{
  "id": 6, "title": "Software Engineer", 
  "content": "Developed e-commerce solutions using PHP, JavaScript..."
},
{
  "id": 5, "title": "Senior Cloud Engineer",
  "content": "Led cloud infrastructure initiatives using AWS, Docker..."
}
```

## Phase 3: Dynamic Integration Enhancement Status ✅ COMPLETE
**Duration**: Single session completion
**Outcome**: Full dynamic integration across all pages with advanced form handling

### Tasks Completed
1. **✅ Blog Integration** - Already implemented with WordPress posts API
2. **✅ Dynamic Home Page** - Added recent projects and blog posts sections  
3. **✅ TanStack Form Contact Page** - Full validation, error handling, loading states
4. **✅ Loading States & Error Handling** - Comprehensive coverage across all pages
5. **✅ Code Quality** - All linting errors resolved, clean codebase

### Key Features Implemented
- **Enhanced Home Page**: Recent blog posts (latest 3) + recent projects showcase (software & media)
- **Advanced Contact Form**: TanStack Form v1.23.5 with real-time validation, visual error indicators
- **Professional UX**: Loading spinners, success/error feedback, form reset after submission
- **Type Safety**: Proper TypeScript implementation with ESLint compliance

## Critical Lessons Learned & False Alarms

### 🚨 FALSE ALARM: WordPress REST API "Mismatch" ✅ RESOLVED
**Initial Concern**: Apparent naming inconsistency between post types and REST endpoints
- Post type names: `software-project`, `media-project` (singular)
- REST endpoints: `/software-projects`, `/media-projects` (plural)

**Reality**: This is **INTENTIONAL WordPress design** - NOT an error!
- WordPress uses `rest_base` parameter (not post type name) for REST endpoint URLs
- This allows clean, RESTful API design: singular internal names, plural public endpoints
- Functions.php correctly configured: `'rest_base' => 'software-projects'`
- All endpoints return 200 status with valid data ✅

**Key Learning**: Always verify WordPress `rest_base` configuration before assuming API issues

### TanStack Form v1.23.5 Implementation Notes
- **Complex Types**: FieldApi requires 23+ type arguments - use `any` with ESLint disable for complex libraries
- **Error Access**: Use `field.state.meta.errors[0]` not `field.state.meta.touchedErrors`
- **Built-in States**: Form provides `isSubmitting` state - don't duplicate with local state
- **Validation**: Real-time validation works on `onChange` with proper error display

### Development Workflow Optimizations
- **Linting**: Run `pnpm run format` before `pnpm run lint` to auto-fix Prettier issues
- **Type Safety**: Use ESLint disable comments for complex third-party library types when needed
- **Error Handling**: Consistent patterns across all dynamic content with graceful fallbacks

## Phase 4: AWS CDK Infrastructure & LightSail Automation Status ✅ 90% COMPLETE
**Duration**: Active development session
**Outcome**: Production-ready AWS infrastructure with automated LightSail management

### Major Achievements
1. **✅ AWS CDK v2 Setup** - Full TypeScript infrastructure-as-code implementation
2. **✅ S3 + CloudFront + OAC** - Modern static website hosting with Origin Access Control
3. **✅ LightSail WordPress** - Automated WordPress instance with static IP
4. **✅ Custom Resource Automation** - Lambda-based static IP attachment automation
5. **✅ Environment Configuration** - Dev/prod environment management with .env support
6. **✅ Frontend Build Fixes** - Resolved TypeScript errors and build process

### Infrastructure Components Implemented
- **S3 Bucket**: Static website hosting with security best practices
- **CloudFront**: Global CDN with OAC (Origin Access Control) - AWS best practice
- **LightSail**: WordPress instance with automated static IP attachment
- **Lambda Function**: Custom resource for LightSail automation
- **Route 53**: DNS management for custom domains
- **IAM**: Least-privilege roles for Lambda execution

### File Structure Added
```
infrastructure/
├── bin/infrastructure.ts           # CDK app entry point with env config
├── lib/rae-portfolio-stack.ts      # Main stack with S3, CloudFront, LightSail
├── lambda/lightsail-automation/    # Custom resource Lambda function
│   ├── index.ts                    # Static IP attachment automation
│   ├── package.json                # AWS SDK dependencies
│   └── tsconfig.json               # TypeScript configuration
├── .env.example                    # Environment variable template
├── DEPLOYMENT.md                   # Complete deployment guide
└── package.json                    # CDK dependencies
```

### Critical Technical Implementations
1. **Origin Access Control (OAC)**: Uses `origins.S3BucketOrigin.withOriginAccessControl()` - modern AWS best practice
2. **Custom Resource Pattern**: Lambda function handles LightSail operations not supported by CloudFormation
3. **Environment Variables**: dotenv integration for certificate ARNs and domain configuration
4. **Static IP Automation**: Retry logic with exponential backoff for reliable attachment
5. **Frontend Build**: Fixed `process.env` → `import.meta.env.DEV` and TypeScript parameter properties

### Deployment Status
- **Development Environment**: Successfully deployed to AWS
- **Frontend Build**: ✅ Production build working (dist/ folder generated)
- **Static IP Attachment**: ✅ Lambda automation implemented and tested
- **Environment Variables**: ✅ Certificate ARN loading working
- **Domain Configuration**: ✅ Route 53 setup for custom domains

### Current Todo Status
**✅ COMPLETED HIGH PRIORITY TASKS:**
- Initialize CDK TypeScript project
- Create S3 bucket construct for static website hosting  
- Implement CloudFront distribution with optimized caching
- Set up Route 53 hosted zone and domain configuration
- Configure AWS Certificate Manager for SSL/TLS
- Create LightSail WordPress instance with static IP
- Create Lambda function for LightSail static IP attachment
- Implement custom resource for static IP automation

**🔄 IN PROGRESS:**
- Enhance user data script with health checks

**⏳ PENDING:**
- Create WordPress configuration custom resource
- Add CloudWatch monitoring for LightSail instance
- Implement IAM roles and policies with least privilege
- Create GitHub Actions CI/CD pipeline
- Set up CloudWatch monitoring and alarms
- Implement Web Application Firewall (WAF) protection
- Configure access logging and audit trails

### Next Immediate Tasks (Post-Compact Context)
1. **Enhance LightSail User Data Script** - Add health checks, error handling, domain configuration
2. **WordPress Configuration Automation** - Create custom resource for WordPress setup
3. **CloudWatch Monitoring** - Add instance monitoring and alerting
4. **CI/CD Pipeline** - GitHub Actions for automated deployments

### Commands to Resume Development (Post-Compact)
```bash
# Infrastructure development
cd infrastructure
npm run build  # Test CDK build
npm run cdk deploy RaePortfolioDev -- --profile rae_dev  # Deploy dev environment

# Frontend development  
cd frontend
pnpm build  # Test frontend build
pnpm dev   # Local development server

# Local WordPress (if needed)
docker-compose up -d
```

### Environment Configuration
```bash
# Required .env file in infrastructure/ directory:
DEV_CERTIFICATE_ARN=arn:aws:acm:us-east-1:233416806179:certificate/da62c8c8-1aa9-4e36-8995-735e93c827f6
DEV_DOMAIN=rae-dev.com
CDK_DEFAULT_ACCOUNT=233416806179
CDK_DEFAULT_REGION=us-east-1
```

### Critical Success Metrics
- ✅ **Static IP Automation**: Lambda function successfully attaches static IP to LightSail instance
- ✅ **Origin Access Control**: Modern S3+CloudFront security implementation
- ✅ **Environment Management**: Dev/prod environments with proper certificate handling
- ✅ **Build Process**: Frontend builds successfully, TypeScript errors resolved
- ✅ **Deployment**: Infrastructure deploys to AWS without manual intervention

## Overall Project Status: PHASE 4 - 90% COMPLETE ✅
**All development phases substantially complete:**
✅ **Phase 1**: React frontend foundation with theme system (100%)
✅ **Phase 2**: WordPress CMS integration with TanStack Query (100%)
✅ **Phase 3**: Dynamic integration enhancement with advanced forms (100%)
🔄 **Phase 4**: AWS infrastructure + LightSail automation (90% - final automation pending)

**Next Session Priority**: Complete LightSail automation and monitoring setup