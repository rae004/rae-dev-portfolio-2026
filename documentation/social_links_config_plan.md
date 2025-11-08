# Social Links Configuration Implementation Plan

## Project Requirements

### Complete Feature Specifications
1. **Documentation First**: Create documentation/social_links_config_plan.md with detailed implementation plan
2. **WordPress Settings Tab**: Configure social links under the "Settings" tab in WP Admin as "Social Links"
3. **Maximum Limit**: Limit the number of "Social Links" entities to a maximum of 9 at a time
4. **Label + Link Creation**: "Social Links" page should allow creating new entities with a label and a link value
5. **Frontend Integration**: Frontend contact page uses these values in the "Connect With Me" section
6. **Modular Architecture**: Follow existing modular WordPress architecture
7. **Icon System**: Leverage current icon system and component patterns
8. **API Patterns**: Use established API and state management patterns
9. **DaisyUI Styling**: Maintain DaisyUI styling consistency
10. **Detailed Planning**: Create a detailed plan that is clear, concise, and meets all requirements

## Current State Analysis

### Contact Page Current Implementation
- Location: `frontend/src/pages/ContactPage.tsx` lines 264-277
- Current "Connect With Me" section has hardcoded social links:
  ```tsx
  <div className="flex items-center space-x-3">
    <span className="text-2xl">💼</span>
    <a href="#" className="link link-primary">LinkedIn Profile</a>
  </div>
  <div className="flex items-center space-x-3">
    <span className="text-2xl">🐙</span>
    <a href="#" className="link link-primary">GitHub Profile</a>
  </div>
  ```
- Uses emoji icons (💼, 🐙) instead of proper social platform icons
- Links point to "#" (placeholder URLs)
- Hardcoded labels without any dynamic content

### WordPress Architecture Patterns
- **Theme Loader**: `wordpress/wp-content/themes/rae-portfolio/includes/class-theme-loader.php`
- **Post Types**: Follow `class-*-post-type.php` pattern
- **API Classes**: Extend `RAE_API_Base` in `includes/api/`
- **Admin Meta Boxes**: Located in `includes/admin/meta-boxes/`
- **WordPress Options**: No existing options system, need to create

### Frontend Architecture Patterns
- **Types**: Defined in `frontend/src/types/wordpress.ts`
- **Services**: WordPress API calls in `frontend/src/services/wordpress.ts`
- **Hooks**: React Query hooks in `frontend/src/hooks/useWordPress.ts`
- **Components**: Reusable components in `frontend/src/components/`
- **Styling**: DaisyUI + Tailwind CSS throughout

## Implementation Phases

### Phase 1: WordPress Backend - Options System

#### 1.1 Social Links Options Class
**File**: `wordpress/wp-content/themes/rae-portfolio/includes/admin/class-social-links-options.php`

**Features**:
- WordPress Settings API integration
- Settings page under "Settings" > "Social Links"
- Maximum 9 social links validation
- Fields per social link:
  - Platform Label (text input)
  - URL (URL input with validation)
  - Enabled/Disabled (checkbox)
  - Display Order (number input)
- Drag-and-drop reordering interface
- Real-time URL validation
- Platform detection from URL/label
- Bulk enable/disable options

**Data Structure**:
```php
$social_links_options = [
    'social_links' => [
        'link_1' => [
            'label' => 'LinkedIn Profile',
            'url' => 'https://linkedin.com/in/username',
            'enabled' => true,
            'order' => 1,
            'platform' => 'linkedin' // auto-detected
        ],
        'link_2' => [
            'label' => 'GitHub Profile',
            'url' => 'https://github.com/username',
            'enabled' => true,
            'order' => 2,
            'platform' => 'github'
        ]
        // ... up to 9 total links
    ],
    'max_links' => 9,
    'version' => '1.0'
];
```

**Admin Interface Features**:
- Clear indication of maximum 9 links limit
- Visual feedback when limit reached
- Sortable list with drag handles
- Platform icon preview in admin
- Live URL validation with feedback
- Save confirmation with success/error messages

#### 1.2 Social Links REST API
**File**: `wordpress/wp-content/themes/rae-portfolio/includes/api/class-social-links-api.php`

**Class Structure**:
```php
class RAE_Social_Links_API extends RAE_API_Base {
    protected string $endpoint = 'social-links';

    public function register_routes(): void {
        register_rest_route(self::API_NAMESPACE, $this->endpoint, [
            'methods' => 'GET',
            'callback' => [$this, 'get_social_links'],
            'permission_callback' => '__return_true'
        ]);
    }

    public function get_social_links(): array {
        // Return enabled social links in display order
        // Include platform detection for frontend icons
    }
}
```

**API Response Format**:
```json
{
    "social_links": [
        {
            "id": "link_1",
            "label": "LinkedIn Profile",
            "url": "https://linkedin.com/in/username",
            "platform": "linkedin",
            "order": 1
        },
        {
            "id": "link_2",
            "label": "GitHub Profile",
            "url": "https://github.com/username",
            "platform": "github",
            "order": 2
        }
    ],
    "total": 2,
    "max_allowed": 9
}
```

#### 1.3 Theme Loader Integration
**File**: `wordpress/wp-content/themes/rae-portfolio/includes/class-theme-loader.php`

**Updates Needed**:
- Load social links options class
- Initialize social links API
- Follow existing class loading pattern

```php
// Add to load_theme_modules()
$this->load_file($includes_path . 'admin/class-social-links-options.php');
$this->load_file($includes_path . 'api/class-social-links-api.php');

// Add to initialize_classes()
if (class_exists('RAE_Social_Links_Options')) {
    new RAE_Social_Links_Options();
}

if (class_exists('RAE_Social_Links_API')) {
    new RAE_Social_Links_API();
}
```

### Phase 2: Frontend Infrastructure

#### 2.1 TypeScript Type Definitions
**File**: `frontend/src/types/wordpress.ts`

**Add Social Link Interface**:
```typescript
export interface SocialLink {
  id: string
  label: string
  url: string
  platform: string
  order: number
}

export interface SocialLinksResponse {
  social_links: SocialLink[]
  total: number
  max_allowed: number
}
```

#### 2.2 WordPress Service Extension
**File**: `frontend/src/services/wordpress.ts`

**Add Social Links Function**:
```typescript
export const fetchSocialLinks = async (): Promise<SocialLinksResponse> => {
  const baseUrl = getCurrentApiUrl()
  const response = await fetch(`${baseUrl}/?rest_route=/wp/v2/social-links`)

  if (!response.ok) {
    throw new Error(`Failed to fetch social links: ${response.statusText}`)
  }

  return response.json()
}
```

#### 2.3 React Query Hook
**File**: `frontend/src/hooks/useWordPress.ts`

**Add Social Links Hook**:
```typescript
export const useSocialLinks = () => {
  return useQuery({
    queryKey: ['social-links'],
    queryFn: fetchSocialLinks,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}
```

### Phase 3: Social Platform Icons System

#### 3.1 Platform Icon Detection
**Approach**: Create utility function to detect platform from URL or label

**Supported Platforms**:
- LinkedIn (linkedin.com)
- GitHub (github.com)
- Twitter/X (twitter.com, x.com)
- Facebook (facebook.com)
- Instagram (instagram.com)
- YouTube (youtube.com)
- Website/Blog (generic link icon)
- Email (mailto:)

**Detection Logic**:
1. Parse URL domain for known platforms
2. Fallback to label keyword matching
3. Default to generic external link icon

#### 3.2 Icon Implementation Options
**Option A**: SVG Icons in Component
- Inline SVG components for each platform
- Consistent with existing icon patterns
- Easy to maintain and customize

**Option B**: Icon Font/Library Integration
- Use existing icon library if available
- Ensure consistency with current design system

### Phase 4: Frontend Components

#### 4.1 SocialLinks Component
**File**: `frontend/src/components/SocialLinks.tsx`

**Component Features**:
- Dynamic rendering from WordPress data
- Platform icon detection and display
- Loading state with skeleton placeholders
- Error state with retry functionality
- External link security attributes
- DaisyUI styling matching current card design
- Responsive layout (vertical on mobile, horizontal on desktop)

**Component Structure**:
```tsx
interface SocialLinksProps {
  className?: string
  maxDisplay?: number
  showLabels?: boolean
}

const SocialLinks: React.FC<SocialLinksProps> = ({
  className = '',
  maxDisplay = 9,
  showLabels = true
}) => {
  const { data, isLoading, error, refetch } = useSocialLinks()

  // Platform icon rendering logic
  // Loading state handling
  // Error state with retry
  // Social links rendering
}
```

#### 4.2 Contact Page Integration
**File**: `frontend/src/pages/ContactPage.tsx`

**Replace Lines 264-277**:
```tsx
// BEFORE (lines 264-277)
<div className='space-y-4'>
  <div className='flex items-center space-x-3'>
    <span className='text-2xl'>💼</span>
    <a href='#' className='link link-primary'>LinkedIn Profile</a>
  </div>
  <div className='flex items-center space-x-3'>
    <span className='text-2xl'>🐙</span>
    <a href='#' className='link link-primary'>GitHub Profile</a>
  </div>
</div>

// AFTER
<div className='space-y-4'>
  <SocialLinks
    className="space-y-4"
    showLabels={true}
    maxDisplay={6}
  />
</div>
```

**Integration Requirements**:
- Maintain existing card layout and spacing
- Preserve responsive design
- Add loading states for social links
- Handle empty state gracefully
- Error handling with fallback message

### Phase 5: Enhanced Admin Experience

#### 5.1 Advanced Admin Features
**WordPress Admin Enhancements**:
- Visual drag-and-drop reordering
- Platform icon previews in admin list
- Live URL validation with visual feedback
- Bulk actions (enable/disable, delete)
- Import/export functionality for link sets
- Usage analytics (click tracking)

#### 5.2 User Experience Improvements
**Frontend Enhancements**:
- Hover animations on social links
- Click tracking and analytics
- Social sharing integration
- SEO meta tags for social platforms
- Accessibility improvements (ARIA labels, keyboard navigation)

## Security & Validation

### WordPress Security
- **Nonce Verification**: All form submissions protected with WordPress nonces
- **Capability Checks**: Admin access restricted to appropriate user roles
- **Input Sanitization**: All URLs and labels sanitized with WordPress functions
- **XSS Prevention**: Proper escaping with `esc_url()`, `esc_html()`, `sanitize_text_field()`
- **CSRF Protection**: WordPress built-in CSRF protection via nonces

### Frontend Security
- **External Links**: All social links use `rel="noopener noreferrer"`
- **URL Validation**: Client-side URL validation before rendering
- **Content Sanitization**: Proper escaping of user-generated content
- **API Security**: No sensitive data exposure in REST endpoints

### Validation Rules
- **URL Format**: Valid HTTP/HTTPS URLs only
- **Label Length**: Maximum 50 characters for labels
- **Character Restrictions**: Sanitize special characters in labels
- **Maximum Links**: Hard limit of 9 links enforced server-side
- **Duplicate Prevention**: Check for duplicate URLs

## Technical Standards

### WordPress Coding Standards
- Follow WordPress PHP Coding Standards
- Use WordPress API functions (get_option, update_option, etc.)
- Proper class naming conventions (RAE_Social_Links_*)
- WordPress action/filter hook usage
- Translation-ready with text domains

### Frontend Standards
- TypeScript strict mode compliance
- React functional components with hooks
- DaisyUI component consistency
- Tailwind CSS utility classes
- Responsive design principles
- Accessibility (WCAG 2.1 compliance)

### Performance Considerations
- **Caching**: WordPress transients for API responses
- **Lazy Loading**: Defer social links loading on page
- **Bundle Size**: Minimize JavaScript bundle impact
- **Database**: Efficient option storage and retrieval
- **API Calls**: React Query caching and deduplication

## Quality Assurance

### Testing Requirements
1. **WordPress Admin Testing**
   - Social links CRUD operations
   - Maximum limit enforcement
   - URL validation accuracy
   - Drag-and-drop reordering
   - Data persistence across sessions

2. **REST API Testing**
   - Endpoint response format validation
   - Error handling for malformed requests
   - Performance under load
   - CORS header validation

3. **Frontend Integration Testing**
   - Component rendering with various data states
   - Loading state transitions
   - Error state handling and recovery
   - Responsive design validation
   - Cross-browser compatibility

4. **End-to-End Testing**
   - Complete data flow from WordPress to frontend
   - Social link clicks and external navigation
   - Admin changes reflected on frontend
   - Mobile device testing

### Success Metrics
- ✅ WordPress Settings page with intuitive social links management
- ✅ Maximum 9 links limit enforced with clear user feedback
- ✅ Professional platform icons replacing emoji placeholders
- ✅ Dynamic frontend updates from WordPress admin changes
- ✅ Maintained responsive design and DaisyUI styling consistency
- ✅ Zero breaking changes to existing Contact page functionality
- ✅ Complete TypeScript type coverage with no errors
- ✅ Comprehensive loading states and error handling
- ✅ Security compliance with WordPress and web standards
- ✅ Accessibility compliance (keyboard navigation, screen readers)

## Implementation Timeline

### Phase 1: Backend Foundation (WordPress)
- **Day 1**: Social Links Options class with admin interface
- **Day 2**: REST API implementation and testing
- **Day 3**: Theme loader integration and WordPress testing

### Phase 2: Frontend Foundation
- **Day 4**: TypeScript types and WordPress service updates
- **Day 5**: React Query hooks and testing

### Phase 3: UI Components
- **Day 6**: Platform icon system and SocialLinks component
- **Day 7**: Contact page integration and styling

### Phase 4: Polish & Testing
- **Day 8**: Enhanced admin UX and validation
- **Day 9**: Comprehensive testing and bug fixes
- **Day 10**: Documentation and deployment

## File Creation/Update Summary

### New Files (4)
1. `documentation/social_links_config_plan.md` - This implementation plan
2. `wordpress/wp-content/themes/rae-portfolio/includes/admin/class-social-links-options.php` - WordPress options system
3. `wordpress/wp-content/themes/rae-portfolio/includes/api/class-social-links-api.php` - REST API endpoint
4. `frontend/src/components/SocialLinks.tsx` - Social links React component

### Updated Files (5)
1. `wordpress/wp-content/themes/rae-portfolio/includes/class-theme-loader.php` - Load new classes
2. `frontend/src/types/wordpress.ts` - Add SocialLink interfaces
3. `frontend/src/services/wordpress.ts` - Add fetchSocialLinks function
4. `frontend/src/hooks/useWordPress.ts` - Add useSocialLinks hook
5. `frontend/src/pages/ContactPage.tsx` - Replace hardcoded social links

## Risk Mitigation

### Potential Risks & Solutions
1. **WordPress Version Compatibility**: Test with minimum supported WordPress version
2. **Frontend Bundle Size**: Monitor and optimize component size
3. **API Performance**: Implement caching and rate limiting
4. **User Experience**: Provide clear feedback and error messages
5. **Data Migration**: Plan for existing hardcoded links if needed

### Rollback Strategy
- Feature flag for social links (fallback to hardcoded)
- Database backup before options implementation
- Git branching for safe development and testing
- Staging environment validation before production

---

## Conclusion

This plan provides a comprehensive roadmap for implementing configurable social links that meets all 10 specified requirements. The implementation follows established patterns in the codebase while introducing new functionality that enhances the user experience for both WordPress administrators and website visitors.

The modular approach ensures maintainability, the security measures protect against common vulnerabilities, and the testing strategy ensures reliability across different usage scenarios. Upon completion, the portfolio website will have a professional, dynamic social links system that can be easily managed through the WordPress admin interface.

**Status**: Ready for implementation
**Last Updated**: 2025-11-08
**Next Step**: Begin Phase 1 WordPress backend implementation