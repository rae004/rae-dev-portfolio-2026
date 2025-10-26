// WordPress REST API types
export interface WordPressPost {
  id: number
  date: string
  date_gmt: string
  guid: {
    rendered: string
  }
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  excerpt: {
    rendered: string
    protected: boolean
  }
  author: number
  featured_media: number
  comment_status: string
  ping_status: string
  sticky: boolean
  template: string
  format: string
  meta: Record<string, unknown>
  categories: number[]
  tags: number[]
  acf_fields?: Record<string, unknown>
  featured_image_url?: string
  _links: {
    self: Array<{ href: string }>
    collection: Array<{ href: string }>
    about: Array<{ href: string }>
    author: Array<{ embeddable: boolean; href: string }>
    replies: Array<{ embeddable: boolean; href: string }>
    'version-history': Array<{ count: number; href: string }>
    'predecessor-version': Array<{ id: number; href: string }>
    'wp:attachment': Array<{ href: string }>
    'wp:term': Array<{ taxonomy: string; embeddable: boolean; href: string }>
    curies: Array<{ name: string; href: string; templated: boolean }>
  }
}

// Employment date information for resume items
export interface EmploymentDates {
  start_date: string | null
  end_date: string | null
  currently_employed: boolean
  start_date_raw: string | null
  end_date_raw: string | null
  formatted_range: string | null
}

// Specific types for our custom post types
export interface ResumeItem extends WordPressPost {
  type: 'resume'
  employment_dates?: EmploymentDates
  related_skills: SkillItem[] // New field for explicit skill relationships
}

export interface SoftwareProject extends WordPressPost {
  type: 'software-project'
}

export interface MediaProject extends WordPressPost {
  type: 'media-project'
}

// Flexible Skills type for dynamic categorization
export interface SkillItem extends WordPressPost {
  type: 'skill'
  skills_type: string // Dynamic category name (e.g., "Languages & Frameworks", "Cloud & DevOps")
  skills_value: string // Actual skill name (e.g., "TypeScript", "AWS", "Docker")
  skills_weight: number // Weight for sorting (higher numbers appear first, default: 0)
  skills_info_url?: string // Optional URL to documentation or information about the skill
}

// WordPress API Error Response
export interface WordPressError {
  code: string
  message: string
  data: {
    status: number
  }
  additional_errors?: unknown[]
}

// Query parameters for WordPress API
export interface WordPressQueryParams {
  page?: number
  per_page?: number
  search?: string
  orderby?: 'date' | 'id' | 'include' | 'modified' | 'parent' | 'relevance' | 'slug' | 'title'
  order?: 'asc' | 'desc'
  status?: 'publish' | 'future' | 'draft' | 'pending' | 'private'
  author?: number[]
  exclude?: number[]
  include?: number[]
}
