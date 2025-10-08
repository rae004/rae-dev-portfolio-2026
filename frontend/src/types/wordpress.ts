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

// Specific types for our custom post types
export interface ResumeItem extends WordPressPost {
  type: 'resume'
}

export interface SoftwareProject extends WordPressPost {
  type: 'software-project'
}

export interface MediaProject extends WordPressPost {
  type: 'media-project'
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

// API Response types for collections
export type ResumeResponse = ResumeItem[]
export type SoftwareProjectResponse = SoftwareProject[]
export type MediaProjectResponse = MediaProject[]
export type BlogPostResponse = WordPressPost[]

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
