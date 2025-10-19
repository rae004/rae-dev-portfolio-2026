# Claude Memory - Rae Dev Portfolio 2026

## Project Overview
Modern portfolio website for Robert Engel showcasing career journey from music industry to cloud engineering. Headless WordPress backend with React frontend, deployed on AWS infrastructure.

## Current Status: ✅ ALL FEATURES COMPLETE
- **Frontend**: React + TypeScript + Vite + TanStack Router + DaisyUI ✅
- **Backend**: WordPress CMS with custom post types + REST API ✅  
- **Infrastructure**: AWS CDK + CloudFront + ACM SSL + LightSail ✅
- **Integration**: Full end-to-end data flow working ✅
- **Custom Features**: Skills system, employment dates, dynamic content ✅
- **Resume Detail Pages**: Complete with skill relationships ✅

## Architecture
- **Frontend**: `https://dev.rae-dev.com` → CloudFront → S3
- **WordPress**: `https://api-dev.rae-dev.com` → CloudFront → LightSail HTTP  
- **SSL**: ACM wildcard certificate (`*.rae-dev.com`)
- **DNS**: Route 53 ALIAS records
- **Development**: Docker Compose (WordPress + MySQL + phpMyAdmin)

## Technology Stack
- **React**: 19.1.1 + TypeScript + Vite 7.1.7
- **Routing**: TanStack Router 1.132.41 with route generation
- **Styling**: Tailwind CSS 3.4.18 + DaisyUI 4.12.10 (CRITICAL: v4.x only, v5.x broken)
- **State**: TanStack Query 5.90.2 + React Query Devtools
- **WordPress**: 6.8.3 + MySQL 8.0 + WP-CLI 2.8.1
- **Infrastructure**: AWS CDK v2 + CloudFront + ACM + Route 53 + LightSail
- **Package Manager**: PNPM v8.6.0+

## Directory Structure
```
├── frontend/             # React TypeScript application ✅
│   ├── src/
│   │   ├── lib/queryClient.ts          # TanStack Query config
│   │   ├── services/wordpress.ts       # WordPress API service
│   │   ├── hooks/useWordPress.ts       # React Query hooks
│   │   ├── types/wordpress.ts          # WordPress API types
│   │   ├── components/                 # SkillPill, SkillsGroup, etc.
│   │   └── pages/                      # Route components
├── wordpress/            # WordPress CMS ✅
│   ├── wp-content/themes/rae-portfolio/
│   │   ├── functions.php               # Custom post types, CORS, REST API
│   │   └── style.css, index.php
│   └── wp-config.php
├── infrastructure/       # AWS CDK code ✅
│   ├── lib/rae-portfolio-stack.ts      # Main stack
│   └── lambda/                         # LightSail automation
├── docker-compose.yml    # Local WordPress stack ✅
└── Dockerfile.wordpress  # Custom WordPress container ✅
```

## WordPress Custom Post Types & REST API
- **Resume Items**: `/wp/v2/resume` (with employment dates)
- **Software Projects**: `/wp/v2/software-projects`
- **Media Projects**: `/wp/v2/media-projects`
- **Skills**: `/wp/v2/skills` (with categories and grouping)
- **Blog Posts**: `/wp/v2/posts`

## Critical Technical Decisions
1. **DaisyUI v4.12.10**: MUST stay on v4.x - v5.x breaks themes
2. **WordPress API**: Query parameter format `/?rest_route=` (no pretty permalinks)
3. **Environment Management**: Vite define-based system (no .env files)
4. **Classic Editor**: Disabled Block Editor to prevent 404 errors on custom post types
5. **CORS**: Two-layer protection (WordPress + CloudFront response headers)
6. **CloudFront Origins**: Uses nip.io for IP-to-domain resolution
7. **No ACF**: Native WordPress features only (ACF caused 500 errors)

## Key Configurations

### Environment Variables (infrastructure/.env)
```bash
DEV_CERTIFICATE_ARN=arn:aws:acm:us-east-1:233416806179:certificate/da62c8c8-1aa9-4e36-8995-735e93c827f6
DEV_DOMAIN=rae-dev.com
CDK_DEFAULT_ACCOUNT=233416806179
CDK_DEFAULT_REGION=us-east-1
```

### Build Scripts (frontend/package.json)
```bash
pnpm dev              # Local development (localhost:8080)
pnpm build:dev        # AWS development (api-dev.rae-dev.com)
pnpm build:prod       # AWS production (api.rae-dev.com)
```

### Critical Dependencies
```json
"daisyui": "4.12.10",                    // MUST stay v4.x
"tailwindcss": "^3.4.18",
"@tanstack/react-query": "^5.90.2",
"@tanstack/react-router": "^1.132.41"
```

## Development Commands

### Start Full Stack
```bash
# WordPress backend
docker-compose up -d

# React frontend  
cd frontend
pnpm install && pnpm dev
```

### Access Points
- **React App**: http://localhost:5173
- **WordPress Admin**: http://localhost:8080/wp-admin (admin/admin123456)
- **phpMyAdmin**: http://localhost:8081
- **WordPress API**: http://localhost:8080/?rest_route=/wp/v2/

### AWS Deployment
```bash
# Build for development environment
cd frontend && pnpm build:dev
cd ../infrastructure && npm run cdk deploy RaePortfolioDev -- --profile rae_dev

# Verify deployment
curl -I https://api-dev.rae-dev.com/wp-admin/
curl -I https://dev.rae-dev.com
```

### WordPress Management
```bash
# WP-CLI commands
docker exec rae-portfolio-wp wp theme list --allow-root
docker exec rae-portfolio-wp wp post list --post_type=resume --allow-root
docker exec rae-portfolio-wp wp post create --post_type=skill --post_title="React" --allow-root

# Test API endpoints
curl -s "http://localhost:8080/?rest_route=/wp/v2/skills" | jq
```

## Current Infrastructure State
- **Static IP**: 34.198.95.27 (LightSail WordPress instance)
- **WordPress HTTPS**: https://api-dev.rae-dev.com/wp-admin/ ✅
- **Frontend HTTPS**: https://dev.rae-dev.com ✅
- **CloudFront Distributions**: Frontend + WordPress both deployed ✅
- **SSL Certificate**: Wildcard `*.rae-dev.com` attached ✅

## Special Features Implemented

### Skills System
- **WordPress Admin**: Category + skill autocomplete with visual feedback
- **REST API**: `/wp/v2/skills` with skills_type and skills_value fields
- **Frontend**: Dynamic grouping with hash-based category colors
- **Components**: SkillPill, SkillsGroup with grid/inline layouts

### Resume Detail Pages with Skills ✅ Complete
- **WordPress Backend**: Resume-skills relationships with admin UI and enhanced REST API
- **Frontend**: Detail pages with breadcrumbs, skill grouping, and navigation
- **Routing**: TanStack Router nested routes with proper outlet functionality

### Employment Dates
- **WordPress Admin**: Date pickers with "Currently Employed" checkbox
- **Data Storage**: Human-readable + raw formats for sorting
- **Frontend Display**: "Title - Date Range" format with chronological sorting
- **API Structure**: Complete employment_dates object in resume items

### Environment Management
- **Three Environments**: Local (localhost:8080), Development (api-dev.rae-dev.com), Production (api.rae-dev.com)
- **Build-Time Injection**: Vite define-based constants (no runtime env loading)
- **Type Safety**: Full TypeScript integration with validation

## Critical Notes
- **DaisyUI**: NEVER upgrade to v5.x - breaks theme system completely
- **Node Version**: v18.16.0+ works, v22+ recommended for Vite 7.x
- **Container Names**: `rae-portfolio-wp`, `rae-portfolio-db`, `rae-portfolio-phpmyadmin`
- **WordPress Credentials**: admin/admin123456
- **ACF**: Removed completely - caused API 500 errors
- **Block Editor**: Disabled for custom post types to prevent 404 errors
- **CORS**: Multi-environment origins configured in functions.php + CloudFront
- **CloudFront**: Uses nip.io DNS resolution for IP-based origins

## Working Features
- ✅ All WordPress REST API endpoints responding with JSON
- ✅ React frontend loading dynamic WordPress content
- ✅ Resume page with employment dates and chronological sorting
- ✅ Skills system with dynamic categories and grouping
- ✅ Contact form with TanStack Form validation
- ✅ Error handling, loading states, and graceful fallbacks
- ✅ HTTPS on both frontend and WordPress admin
- ✅ CORS resolved for all environments
- ✅ React Query caching and devtools
- ✅ Theme switching with 29+ DaisyUI themes
- ✅ Resume detail pages with full content and skill relationships
- ✅ Dynamic routing between resume list and detail views
- ✅ Breadcrumb navigation and skill grouping

## Next Development Opportunities
1. **Content Population**: More WordPress content (projects, blog posts)
2. **Production Environment**: Set up production stack and CI/CD
3. **Performance**: Bundle optimization, caching, PWA features
4. **SEO**: Meta tags, Open Graph, structured data
5. **Advanced Features**: Search, analytics, skill filtering