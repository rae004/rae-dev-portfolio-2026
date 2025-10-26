import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { useMemo } from 'react'
import { wordpressApi, WordPressAPIError } from '../services/wordpress'
import type {
  ResumeItem,
  SoftwareProject,
  MediaProject,
  MediaProjectQueryParams,
  MusicProject,
  AudioPostProject,
  SkillItem,
  WordPressPost,
  WordPressQueryParams,
} from '../types/wordpress'
import {
  separateProjectsByType,
  getMusicProjectFilters,
  getAudioPostProjectFilters,
  getProjectCounts,
} from '../utils/mediaProjectUtils'

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
    list: (params?: WordPressQueryParams) =>
      [...queryKeys.softwareProjects.lists(), params] as const,
    details: () => [...queryKeys.softwareProjects.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.softwareProjects.details(), id] as const,
  },
  mediaProjects: {
    all: ['media-projects'] as const,
    lists: () => [...queryKeys.mediaProjects.all, 'list'] as const,
    list: (params?: MediaProjectQueryParams) =>
      [...queryKeys.mediaProjects.lists(), params] as const,
    details: () => [...queryKeys.mediaProjects.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.mediaProjects.details(), id] as const,
  },
  skills: {
    all: ['skills'] as const,
    lists: () => [...queryKeys.skills.all, 'list'] as const,
    list: (params?: WordPressQueryParams) => [...queryKeys.skills.lists(), params] as const,
    details: () => [...queryKeys.skills.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.skills.details(), id] as const,
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
  params?: MediaProjectQueryParams,
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

// Skills hooks
export function useSkills(
  params?: WordPressQueryParams,
  options?: Omit<UseQueryOptions<SkillItem[], WordPressAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.skills.list(params),
    queryFn: () => wordpressApi.getSkills(params),
    ...options,
  })
}

export function useSkill(
  id: number,
  options?: Omit<UseQueryOptions<SkillItem, WordPressAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.skills.detail(id),
    queryFn: () => wordpressApi.getSkill(id),
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
  options?: Omit<
    UseQueryOptions<{ namespace: string; routes: Record<string, unknown> }, WordPressAPIError>,
    'queryKey' | 'queryFn'
  >
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

// Enhanced media project hooks with filtering and project type separation
export interface UseMediaProjectsWithSeparationResult {
  data?: {
    all: MediaProject[]
    musicProjects: MusicProject[]
    audioPostProjects: AudioPostProject[]
    uncategorizedProjects: MediaProject[]
    counts: {
      total: number
      music: number
      audioPost: number
      uncategorized: number
    }
  }
  isLoading: boolean
  error: WordPressAPIError | null
}

export function useMediaProjectsWithSeparation(
  params?: MediaProjectQueryParams,
  options?: Omit<UseQueryOptions<MediaProject[], WordPressAPIError>, 'queryKey' | 'queryFn'>
): UseMediaProjectsWithSeparationResult {
  const query = useMediaProjects(params, options)

  const processedData = useMemo(() => {
    if (!query.data) return undefined

    const separated = separateProjectsByType(query.data)
    const counts = getProjectCounts(query.data)

    return {
      all: query.data,
      ...separated,
      counts,
    }
  }, [query.data])

  return {
    data: processedData,
    isLoading: query.isLoading,
    error: query.error,
  }
}

export interface UseMediaProjectFiltersResult {
  musicFilters: {
    artists: string[]
    genres: string[]
    recordLabels: string[]
  }
  audioPostFilters: {
    directors: string[]
    studios: string[]
    genres: string[]
  }
}

export function useMediaProjectFilters(
  params?: MediaProjectQueryParams,
  options?: Omit<UseQueryOptions<MediaProject[], WordPressAPIError>, 'queryKey' | 'queryFn'>
): UseMediaProjectFiltersResult {
  const { data } = useMediaProjectsWithSeparation(params, options)

  const filters = useMemo(() => {
    if (!data) {
      return {
        musicFilters: { artists: [], genres: [], recordLabels: [] },
        audioPostFilters: { directors: [], studios: [], genres: [] },
      }
    }

    return {
      musicFilters: getMusicProjectFilters(data.musicProjects),
      audioPostFilters: getAudioPostProjectFilters(data.audioPostProjects),
    }
  }, [data])

  return filters
}
