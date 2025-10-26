import type {
  MediaProject,
  MediaProjectQueryParams,
  ResumeItem,
  SkillItem,
  SoftwareProject,
  WordPressError,
  WordPressPost,
  WordPressQueryParams,
} from '../types/wordpress'
import { devLog, getWordPressApiBase, validateEnvironment } from '../config/environment'

// Initialize and validate environment configuration
const environmentConfig = validateEnvironment()

// WordPress API configuration
const WP_API_BASE = getWordPressApiBase()
const WP_API_ROUTE = '/?rest_route=/wp/v2'

// Log configuration for debugging
devLog('WordPress Service initialized:', {
  environment: environmentConfig.name,
  apiBase: WP_API_BASE,
  apiRoute: WP_API_ROUTE,
})

class WordPressAPIError extends Error {
  public code: string
  public status: number
  public data?: unknown

  constructor(message: string, code: string, status: number, data?: unknown) {
    super(message)
    this.name = 'WordPressAPIError'
    this.code = code
    this.status = status
    this.data = data
  }
}

// Helper function to build API URLs
function buildApiUrl(endpoint: string, params?: WordPressQueryParams): string {
  const url = new URL(`${WP_API_BASE}${WP_API_ROUTE}${endpoint}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(`${key}[]`, v.toString()))
        } else {
          url.searchParams.append(key, value.toString())
        }
      }
    })
  }

  return url.toString()
}

// Generic API request function
async function apiRequest<T>(endpoint: string, params?: WordPressQueryParams): Promise<T> {
  const url = buildApiUrl(endpoint, params)

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      let errorData: WordPressError
      try {
        errorData = await response.json()
      } catch {
        throw new WordPressAPIError(
          `HTTP ${response.status}: ${response.statusText}`,
          'http_error',
          response.status
        )
      }

      throw new WordPressAPIError(
        errorData.message || `HTTP ${response.status}`,
        errorData.code || 'api_error',
        errorData.data?.status || response.status,
        errorData
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof WordPressAPIError) {
      throw error
    }

    // Network or other errors
    throw new WordPressAPIError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      'network_error',
      0
    )
  }
}

// API service functions

export const wordpressApi = {
  // Resume items
  async getResumeItems(params?: WordPressQueryParams): Promise<ResumeItem[]> {
    return apiRequest<ResumeItem[]>('/resume', params)
  },

  async getResumeItem(id: number): Promise<ResumeItem> {
    return apiRequest<ResumeItem>(`/resume/${id}`)
  },

  // Software projects
  async getSoftwareProjects(params?: WordPressQueryParams): Promise<SoftwareProject[]> {
    return apiRequest<SoftwareProject[]>('/software-projects', params)
  },

  async getSoftwareProject(id: number): Promise<SoftwareProject> {
    return apiRequest<SoftwareProject>(`/software-projects/${id}`)
  },

  // Media projects
  async getMediaProjects(params?: MediaProjectQueryParams): Promise<MediaProject[]> {
    return apiRequest<MediaProject[]>('/media-projects', params)
  },

  async getMediaProject(id: number): Promise<MediaProject> {
    return apiRequest<MediaProject>(`/media-projects/${id}`)
  },

  // Skills
  async getSkills(params?: WordPressQueryParams): Promise<SkillItem[]> {
    return apiRequest<SkillItem[]>('/skills', params)
  },

  async getSkill(id: number): Promise<SkillItem> {
    return apiRequest<SkillItem>(`/skills/${id}`)
  },

  // Blog posts
  async getBlogPosts(params?: WordPressQueryParams): Promise<WordPressPost[]> {
    return apiRequest<WordPressPost[]>('/posts', params)
  },

  async getBlogPost(id: number): Promise<WordPressPost> {
    return apiRequest<WordPressPost>(`/posts/${id}`)
  },

  // Health check
  async healthCheck(): Promise<{ namespace: string; routes: Record<string, unknown> }> {
    return apiRequest<{ namespace: string; routes: Record<string, unknown> }>('/')
  },
}

export { WordPressAPIError }
