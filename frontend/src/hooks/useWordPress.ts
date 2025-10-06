import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { wordpressApi, WordPressAPIError } from '../services/wordpress'
import type {
  ResumeItem,
  SoftwareProject,
  MediaProject,
  WordPressPost,
  WordPressQueryParams,
} from '../types/wordpress'

// Query keys for consistent caching
export const queryKeys = {
  resume: {
    all: ['resume'] as const,
    lists: () => [...queryKeys.resume.all, 'list'] as const,
    list: (params?: WordPressQueryParams) => [...queryKeys.resume.lists(), params] as const,
    details: () => [...queryKeys.resume.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.resume.details(), id] as const,
  },
  softwareProjects: {
    all: ['software-projects'] as const,
    lists: () => [...queryKeys.softwareProjects.all, 'list'] as const,
    list: (params?: WordPressQueryParams) => [...queryKeys.softwareProjects.lists(), params] as const,
    details: () => [...queryKeys.softwareProjects.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.softwareProjects.details(), id] as const,
  },
  mediaProjects: {
    all: ['media-projects'] as const,
    lists: () => [...queryKeys.mediaProjects.all, 'list'] as const,
    list: (params?: WordPressQueryParams) => [...queryKeys.mediaProjects.lists(), params] as const,
    details: () => [...queryKeys.mediaProjects.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.mediaProjects.details(), id] as const,
  },
  blog: {
    all: ['blog'] as const,
    lists: () => [...queryKeys.blog.all, 'list'] as const,
    list: (params?: WordPressQueryParams) => [...queryKeys.blog.lists(), params] as const,
    details: () => [...queryKeys.blog.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.blog.details(), id] as const,
  },
  health: ['wordpress-health'] as const,
}

// Resume hooks
export function useResumeItems(
  params?: WordPressQueryParams,
  options?: Omit<UseQueryOptions<ResumeItem[], WordPressAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.resume.list(params),
    queryFn: () => wordpressApi.getResumeItems(params),
    ...options,
  })
}

export function useResumeItem(
  id: number,
  options?: Omit<UseQueryOptions<ResumeItem, WordPressAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.resume.detail(id),
    queryFn: () => wordpressApi.getResumeItem(id),
    enabled: !!id,
    ...options,
  })
}

// Software projects hooks
export function useSoftwareProjects(
  params?: WordPressQueryParams,
  options?: Omit<UseQueryOptions<SoftwareProject[], WordPressAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.softwareProjects.list(params),
    queryFn: () => wordpressApi.getSoftwareProjects(params),
    ...options,
  })
}

export function useSoftwareProject(
  id: number,
  options?: Omit<UseQueryOptions<SoftwareProject, WordPressAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.softwareProjects.detail(id),
    queryFn: () => wordpressApi.getSoftwareProject(id),
    enabled: !!id,
    ...options,
  })
}

// Media projects hooks
export function useMediaProjects(
  params?: WordPressQueryParams,
  options?: Omit<UseQueryOptions<MediaProject[], WordPressAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.mediaProjects.list(params),
    queryFn: () => wordpressApi.getMediaProjects(params),
    ...options,
  })
}

export function useMediaProject(
  id: number,
  options?: Omit<UseQueryOptions<MediaProject, WordPressAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.mediaProjects.detail(id),
    queryFn: () => wordpressApi.getMediaProject(id),
    enabled: !!id,
    ...options,
  })
}

// Blog hooks
export function useBlogPosts(
  params?: WordPressQueryParams,
  options?: Omit<UseQueryOptions<WordPressPost[], WordPressAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.blog.list(params),
    queryFn: () => wordpressApi.getBlogPosts(params),
    ...options,
  })
}

export function useBlogPost(
  id: number,
  options?: Omit<UseQueryOptions<WordPressPost, WordPressAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.blog.detail(id),
    queryFn: () => wordpressApi.getBlogPost(id),
    enabled: !!id,
    ...options,
  })
}

// WordPress health check hook
export function useWordPressHealth(
  options?: Omit<UseQueryOptions<{ namespace: string; routes: Record<string, any> }, WordPressAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => wordpressApi.healthCheck(),
    // Check health less frequently
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  })
}