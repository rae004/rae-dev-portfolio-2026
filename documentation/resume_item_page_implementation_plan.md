# Resume Item Detail Pages with Skill Relationships - Implementation Plan

## Overview
This document outlines the implementation of individual resume item detail pages with skill relationships for the Rae Dev Portfolio 2026 project. The feature enables users to view complete details of each resume entry with related skills grouped by category.

## Phase 1: WordPress Backend Enhancement

### 1.1 Skills Relationship Meta Field
- **Meta Field**: `_resume_related_skills` stores array of skill IDs as serialized data
- **Data Type**: Array of integers (skill post IDs)
- **Validation**: Ensures all IDs reference valid, published skill posts
- **Default**: Empty array for backward compatibility

### 1.2 WordPress Admin UI
- **Meta Box**: "Related Skills" section in resume edit page
- **Interface**: Searchable multiselect dropdown grouped by skill categories
- **Features**:
  - Real-time search and filtering
  - Visual feedback for selected skills
  - Bulk select/deselect by category
  - Auto-save with AJAX validation

### 1.3 REST API Enhancement
- **New Field**: `related_skills` in resume REST API response
- **Data Structure**: Array of complete SkillItem objects
- **Sorting**: Skills sorted by weight (descending) within categories
- **Performance**: Efficient queries with proper caching

## Phase 2: Frontend Implementation

### 2.1 TypeScript Interface Updates
```typescript
// Enhanced ResumeItem interface
export interface ResumeItem extends WordPressPost {
  type: 'resume'
  employment_dates?: EmploymentDates
  related_skills: SkillItem[] // New field for explicit relationships
}
```

### 2.2 Dynamic Routing
- **Route Pattern**: `/resume/$resumeId` using TanStack Router
- **Parameters**: `resumeId` as number (WordPress post ID)
- **Error Handling**: 404 pages for invalid IDs
- **SEO**: Dynamic meta tags with position title and description

### 2.3 Component Architecture
```
ResumeDetailPage
├── BreadcrumbNavigation
├── ResumeItemCard (detailed view)
│   ├── Employment dates
│   ├── Full content
│   └── SkillsGroup (related skills)
└── ResumeNavigation (prev/next)
```

## Implementation Approach

### Content-Based Skill Matching (Phase 1 - Immediate)
- **Method**: Parse resume content for skill names
- **Matching**: Case-insensitive substring matching
- **Fallback**: Ensures functionality with existing data
- **Performance**: Client-side filtering with memoization

### Explicit Skill Relationships (Phase 2 - Enhanced)
- **Method**: WordPress admin interface for manual skill selection
- **Storage**: Meta field with skill post IDs
- **Benefits**: Precise control, better performance, richer relationships

## File Structure

### New Files
```
documentation/
└── resume_item_page_implementation_plan.md

frontend/src/
├── routes/resume/$resumeId.tsx
├── pages/ResumeDetailPage.tsx
├── components/
│   ├── ResumeItemCard.tsx
│   ├── BreadcrumbNavigation.tsx
│   └── ResumeNavigation.tsx
└── utils/skillMatching.ts
```

### Modified Files
```
wordpress/wp-content/themes/rae-portfolio/functions.php
frontend/src/types/wordpress.ts
frontend/src/pages/ResumePage.tsx
```

## URL Structure
- **Resume List**: `/resume` (existing)
- **Resume Detail**: `/resume/123` (new - where 123 is resume item ID)
- **Navigation**: Breadcrumbs with proper schema markup

## Key Features

### 1. Skill Relationships
- **Visual Display**: Skills grouped by category with weight-based sorting
- **Interactive**: Click skill to filter other resumes
- **Responsive**: Adapts to all screen sizes

### 2. Navigation
- **Breadcrumbs**: Home > Resume > [Position Title]
- **Previous/Next**: Chronological navigation between positions
- **Back to List**: Return with scroll position memory

### 3. Performance
- **Prefetching**: Hover-based loading of detail pages
- **Caching**: TanStack Query optimization
- **Code Splitting**: Dynamic imports for detail components

### 4. SEO & Accessibility
- **Meta Tags**: Dynamic title, description, and Open Graph
- **Schema Markup**: Structured data for job positions
- **ARIA Labels**: Full screen reader support
- **Keyboard Navigation**: Complete keyboard accessibility

## Technical Implementation Details

### WordPress Meta Box HTML
```php
// Skills selection interface
<div class="rae-skills-selector">
    <input type="text" placeholder="Search skills..." />
    <div class="skills-by-category">
        <?php foreach ($skill_categories as $category => $skills): ?>
            <div class="category-group">
                <h4><?php echo esc_html($category); ?></h4>
                <?php foreach ($skills as $skill): ?>
                    <label>
                        <input type="checkbox" name="related_skills[]" 
                               value="<?php echo $skill->ID; ?>" />
                        <?php echo esc_html($skill->skills_value); ?>
                    </label>
                <?php endforeach; ?>
            </div>
        <?php endforeach; ?>
    </div>
</div>
```

### React Component Structure
```typescript
// ResumeDetailPage component
const ResumeDetailPage: React.FC = () => {
  const { resumeId } = useParams({ from: '/resume/$resumeId' })
  const { data: resumeItem, isLoading, error } = useResumeItem(Number(resumeId))
  const groupedSkills = useGroupedSkills(resumeItem?.related_skills || [])

  return (
    <div className="container mx-auto px-4 py-8">
      <BreadcrumbNavigation 
        items={[
          { label: 'Home', href: '/' },
          { label: 'Resume', href: '/resume' },
          { label: resumeItem?.title.rendered }
        ]} 
      />
      
      <ResumeItemCard 
        resumeItem={resumeItem}
        showSkills={true}
        layout="detailed"
      />
      
      <ResumeNavigation 
        currentId={resumeId}
        resumeItems={allResumeItems}
      />
    </div>
  )
}
```

## Benefits

### User Experience
- **Detailed View**: Complete information about each position
- **Skill Discovery**: Easy exploration of related technologies
- **Navigation**: Intuitive browsing between positions
- **Mobile Optimized**: Seamless experience on all devices

### Developer Experience
- **Type Safety**: Full TypeScript support throughout
- **Component Reuse**: Flexible components for multiple contexts
- **Performance**: Optimized queries and caching
- **Maintainability**: Follows existing architecture patterns

### SEO Benefits
- **Individual URLs**: Each position has its own shareable URL
- **Rich Meta Data**: Proper title, description, and Open Graph tags
- **Schema Markup**: Structured data for better search visibility
- **Internal Linking**: Improved site architecture and crawlability

## Implementation Timeline
1. **Documentation** (5 minutes) ✅
2. **WordPress Backend** (35 minutes)
3. **TypeScript Updates** (20 minutes)
4. **React Router** (15 minutes)
5. **React Components** (45 minutes)
6. **Resume List Enhancement** (20 minutes)

**Total Estimated Time**: 140 minutes (2 hours 20 minutes)

## Testing Strategy
- **Unit Tests**: Component rendering and utility functions
- **Integration Tests**: API data flow and routing
- **Manual Testing**: All user interactions and error states
- **Performance Testing**: Load times and caching effectiveness

## Future Enhancements
- **Skill-Based Filtering**: Filter resumes by selected skills
- **Timeline View**: Visual timeline of career progression
- **Skill Relationships**: Show skill progression across positions
- **Export Features**: PDF generation of detailed resume