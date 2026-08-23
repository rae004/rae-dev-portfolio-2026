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
  project_release_date?: string | null
  project_demo_link?: string | null
  project_repo_link?: string | null
  project_state?: 'Ongoing' | 'Future' | 'Completed' | null
  tech_categories?: string[]
  related_skills: SkillItem[] // New field for explicit skill relationships
}

// Streaming link interface for music projects
export interface StreamingLink {
  platform: string
  url: string
  type: 'audio' | 'video'
}

// Base media project interface
export interface MediaProject extends WordPressPost {
  type: 'media-project'
  project_type: 'Music' | 'Audio_Post_Production' | null
  related_skills: SkillItem[] // New field for explicit skill relationships

  // Music-specific fields
  music_artist_name?: string | null
  music_album_names?: string[] | null
  music_songs_list?: string[] | null
  music_release_date?: string | null
  music_artist_website?: string | null
  music_online_links?: StreamingLink[] | null
  music_genre?: string | null
  music_record_label?: string | null
  music_duration?: string | null
  music_studio?: string | null
  music_producer?: string | null
  music_collaborators?: string[] | null

  // Audio Post Production fields
  audio_project_name?: string | null
  audio_director?: string | null
  audio_writers?: string[] | null
  audio_producers?: string[] | null
  audio_actors?: string[] | null
  audio_studios?: string[] | null
  audio_genre?: string | null
  audio_release_date?: string | null
  audio_project_type?: string | null
  audio_duration?: string | null
  audio_language?: string | null
  audio_engineer?: string | null
  audio_sound_designer?: string | null
  audio_awards?: string | null
  audio_distribution?: string | null
}

// Discriminated union types for type-safe access
export interface MusicProject extends MediaProject {
  project_type: 'Music'
  related_skills: SkillItem[] // Explicit for type safety
  music_artist_name: string | null
  music_genre: string | null
  music_record_label: string | null
}

export interface AudioPostProject extends MediaProject {
  project_type: 'Audio_Post_Production'
  related_skills: SkillItem[] // Explicit for type safety
  audio_director: string | null
  audio_studios: string[] | null
  audio_genre: string | null
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
  enabled_only?: string
  limit?: string
}

// Extended query parameters for media projects
export interface MediaProjectQueryParams extends WordPressQueryParams {
  project_type?: 'Music' | 'Audio_Post_Production' | ''
}

// Type guards for media project types
export function isMusicProject(project: MediaProject): project is MusicProject {
  return project.project_type === 'Music'
}

export function isAudioPostProject(project: MediaProject): project is AudioPostProject {
  return project.project_type === 'Audio_Post_Production'
}

// Social Links types
export interface SocialLink {
  id: string
  label: string
  url: string
  platform: string
  order: number
  enabled: boolean
}

export interface SocialLinksResponse {
  social_links: SocialLink[]
  total: number
  max_allowed: number
  enabled_only: boolean
  limit_applied: number
}

// Social link platform types
export type SocialPlatform =
  'linkedin' | 'github' | 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'email' | 'generic'

// Query parameters for social links API
export interface SocialLinksQueryParams {
  enabled_only?: boolean
  limit?: number
}
