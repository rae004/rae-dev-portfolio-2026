# Rae Dev Portfolio 2026

A modern portfolio website showcasing Robert Engel's diverse career journey from music industry to cloud engineering. Built with React frontend and headless WordPress backend, featuring 29+ beautiful themes and full WordPress integration.

## 🏗️ Architecture

- **Frontend**: React 19.1.1 + TypeScript + Vite 7.1.7 + TanStack Router + DaisyUI v4.12.10
- **Backend**: WordPress 6.8.3 CMS (Headless) with custom post types
- **Data Layer**: TanStack Query + WordPress REST API
- **Infrastructure**: AWS (LightSail, S3, CloudFront, CDK) - *Coming Soon*
- **Development**: Docker Compose with WordPress, MySQL, and phpMyAdmin

## ✨ Current Status: Phase 2 Complete

### ✅ Frontend Foundation (Phase 1)
- React + TypeScript setup with Vite
- TanStack Router with all routes configured
- DaisyUI v4.12.10 with 29+ working themes
- Responsive design with mobile-first approach
- Theme persistence with smooth transitions

### ✅ WordPress Integration (Phase 2)
- Docker Compose environment with WordPress 6.8.3
- Custom theme with REST API enhancements
- Custom post types: `resume`, `software-project`, `media-project`
- CORS configuration for frontend communication
- TanStack Query integration with error handling and loading states
- Dynamic data loading on Resume page with fallback content

### 🚧 Coming Next (Phase 3)
- AWS infrastructure deployment using CDK
- CI/CD with GitHub Actions
- Performance optimization
- Complete WordPress content management

## Quick Start

### Prerequisites

- **Node.js**: 22.12+ (required for Vite 7.x)
- **PNPM**: Package manager
- **Docker & Docker Compose**: For WordPress backend
- **NVM**: Recommended for Node version management

### 🚀 Quick Start (Full Stack)

```bash
# 1. Start WordPress backend
docker-compose up -d

# 2. Start React frontend
cd frontend
nvm use 22  # Ensure Node.js 22+
pnpm install
pnpm dev
```

### 🌐 Access Points

- **React Frontend**: http://localhost:5173
- **WordPress Admin**: http://localhost:8080/wp-admin (admin/admin123456)
- **WordPress Frontend**: http://localhost:8080
- **phpMyAdmin**: http://localhost:8081
- **WordPress REST API**: http://localhost:8080/?rest_route=/wp/v2/

### 📊 WordPress API Endpoints

- **Resume Items**: `/?rest_route=/wp/v2/resume`
- **Software Projects**: `/?rest_route=/wp/v2/software-projects`
- **Media Projects**: `/?rest_route=/wp/v2/media-projects`
- **Blog Posts**: `/?rest_route=/wp/v2/posts`
- **API Discovery**: `/?rest_route=/wp/v2/`

## Project Structure

```
├── .github/workflows/     # GitHub Actions CI/CD
├── infrastructure/        # AWS CDK code
├── frontend/             # React TypeScript application
├── wordpress/            # WordPress CMS files
├── scripts/              # Bash automation scripts
└── documentation/        # Project documentation
```

## 🎯 Features

### ✅ Frontend Capabilities
- **Modern React**: 19.1.1 with TypeScript and Vite 7.1.7
- **Routing**: TanStack Router with file-based routing
- **UI Framework**: DaisyUI v4.12.10 with 29+ beautiful themes
- **Responsive Design**: Mobile-first with breakpoints for all devices
- **Accessibility**: WCAG 2.2 AA compliance with dedicated accessibility page
- **Theme System**: Persistent theme switching with smooth transitions
- **State Management**: TanStack Query for server state management

### ✅ Backend Integration
- **Headless WordPress**: 6.8.3 with custom theme and post types
- **REST API**: Full integration with custom endpoints and CORS support
- **Custom Post Types**: Resume, Software Projects, Media Projects
- **Data Fetching**: TanStack Query hooks with error handling and loading states
- **Development Environment**: Docker Compose with WordPress, MySQL, phpMyAdmin

### ✅ Developer Experience
- **TypeScript**: Full type safety with WordPress API types
- **Hot Reload**: Fast development with Vite HMR
- **Query Devtools**: React Query devtools for debugging
- **Error Handling**: Graceful fallbacks and user-friendly error messages
- **Code Quality**: ESLint configuration with React best practices

### 🚧 Planned Features
- **AWS Infrastructure**: CDK deployment with LightSail, S3, CloudFront
- **CI/CD Pipeline**: GitHub Actions for automated deployment
- **Performance**: Bundle optimization (<13KB target)
- **CMS Integration**: Complete WordPress admin workflow

## 💻 Development Commands

### Frontend Development
```bash
cd frontend
nvm use 22              # Switch to Node.js 22+
pnpm install           # Install dependencies
pnpm dev              # Start dev server with HMR
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm routes:generate  # Regenerate TanStack Router routes
```

### Backend Development
```bash
# WordPress & Database
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f wordpress  # View WordPress logs
docker-compose restart            # Restart services

# Database Access
docker exec -it rae-portfolio-db mysql -u wordpress -pwordpress
```

### Troubleshooting
```bash
# Reset WordPress (if needed)
docker-compose down -v    # Remove volumes
docker-compose up -d      # Fresh start

# Check container status
docker ps                 # View running containers
docker-compose logs       # View all logs
```

## 🏛️ Technical Architecture

### Data Flow
```
React Frontend (localhost:5173)
    ↕️ TanStack Query
WordPress REST API (localhost:8080/?rest_route=/wp/v2/)
    ↕️ Custom Theme Functions
WordPress Database (MySQL)
```

### Key Components

#### Frontend (`/frontend/`)
- **App.tsx**: QueryClient provider and router setup
- **lib/queryClient.ts**: TanStack Query configuration
- **services/wordpress.ts**: WordPress API service layer
- **hooks/useWordPress.ts**: React Query hooks for WordPress data
- **types/wordpress.ts**: TypeScript definitions for WordPress API
- **pages/**: Route components with dynamic data loading

#### WordPress (`/wordpress/`)
- **wp-content/themes/rae-portfolio/**: Custom headless theme
- **functions.php**: Custom post types, CORS, REST API enhancements
- **Custom Post Types**: `resume`, `software-project`, `media-project`

#### Docker Environment
- **WordPress**: Latest version with custom theme
- **MySQL 8.0**: Database with persistent volumes
- **phpMyAdmin**: Database management interface

### Critical Configuration Notes
- **DaisyUI Version**: MUST use v4.12.10 (v5.x breaks theme system)
- **Node.js Version**: Requires 22+ for Vite 7.x compatibility
- **WordPress REST API**: Uses query parameter format for development
- **CORS Configuration**: Enabled for localhost:5173 in theme functions

## 🐛 Known Issues & Solutions

### WordPress API Returns HTML Instead of JSON
- **Cause**: Pretty permalinks not fully configured in Docker
- **Solution**: Use query parameter format: `/?rest_route=/wp/v2/endpoint`
- **Status**: Working as designed for development

### Theme Switching Not Working
- **Cause**: Likely DaisyUI v5.x upgrade
- **Solution**: Ensure DaisyUI v4.12.10 in package.json
- **Prevention**: Never upgrade DaisyUI to v5.x

### WordPress Critical Errors
- **Cause**: Database content without proper WordPress metadata
- **Solution**: Use WordPress admin or REST API for content creation
- **Workaround**: Static fallback content in components

## 📚 Resources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [DaisyUI v4 Documentation](https://v4.daisyui.com/)
- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [TanStack Router Guide](https://tanstack.com/router/latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (both frontend and WordPress integration)
5. Submit a pull request

## License

Private portfolio project - All rights reserved.