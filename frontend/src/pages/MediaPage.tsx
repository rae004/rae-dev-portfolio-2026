import React from 'react'
import { useMediaProjects } from '../hooks/useWordPress'
import type { MediaProject } from '../types/wordpress'

const MediaPage: React.FC = () => {
  const {
    data: wpMediaProjects,
    isLoading,
    error,
  } = useMediaProjects({
    per_page: 20,
    orderby: 'date',
    order: 'desc',
  })

  // Fallback projects for when WordPress is unavailable
  const fallbackProjects = [
    {
      title: 'Album Production',
      artist: 'Various Artists',
      role: 'Recording & Mixing Engineer',
      description: 'Recorded and mixed full-length albums for independent artists and labels',
      year: '2010-2015',
    },
    {
      title: 'Studio Management',
      artist: 'World-Class Recording Studios',
      role: 'Studio Manager',
      description: 'Managed day-to-day operations of professional recording facilities',
      year: '2012-2016',
    },
    {
      title: 'Single Productions',
      artist: 'Multiple Artists',
      role: 'Audio Engineer',
      description: 'Produced and engineered singles across various genres',
      year: '2010-2018',
    },
  ]

  // Transform WordPress data to match component expectations
  const transformWpMediaProject = (wp: MediaProject) => {
    const content = wp.content.rendered.replace(/<[^>]*>/g, '') // Strip HTML

    // Try to extract structured data from content
    const artistMatch = content.match(/Artist:?\s*([^.]+)/i)
    const roleMatch = content.match(/Role:?\s*([^.]+)/i)
    const yearMatch = content.match(/Year:?\s*([^.]+)/i)

    return {
      title: wp.title.rendered,
      artist: artistMatch ? artistMatch[1].trim() : 'Various Artists',
      role: roleMatch ? roleMatch[1].trim() : 'Audio Professional',
      description: wp.excerpt.rendered
        ? wp.excerpt.rendered.replace(/<[^>]*>/g, '').trim()
        : content.substring(0, 150) + '...',
      year: yearMatch ? yearMatch[1].trim() : new Date(wp.date).getFullYear().toString(),
    }
  }

  // Use WordPress data if available, otherwise fallback
  const mediaProjects =
    error || !wpMediaProjects ? fallbackProjects : wpMediaProjects.map(transformWpMediaProject)

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-4xl font-bold mb-8'>Media Projects</h1>

        {/* Loading State */}
        {isLoading && (
          <div className='flex justify-center items-center py-12'>
            <span className='loading loading-spinner loading-lg'></span>
          </div>
        )}

        {/* Error State with Fallback Content */}
        {error && (
          <div className='alert alert-warning mb-8'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='stroke-current shrink-0 h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 9v2m0 4h.01m-6.938 4h13.876a2 2 0 001.789-2.894l-6.938-13.856a2 2 0 00-3.578 0L.394 16.106A2 2 0 002.183 19z'
              />
            </svg>
            <span>Unable to load projects from CMS. Showing featured projects instead.</span>
          </div>
        )}

        <div className='hero bg-base-200 rounded-lg mb-12'>
          <div className='hero-content text-center'>
            <div className='max-w-md'>
              <h2 className='text-2xl font-bold'>Music Industry Experience</h2>
              <p className='py-4'>
                From recording and mixing albums to managing world-class studios, my journey in the
                music industry provided foundational skills in project management, attention to
                detail, and creative problem-solving.
              </p>
            </div>
          </div>
        </div>

        <div className='space-y-6'>
          {mediaProjects.map((project, index) => (
            <div key={index} className='card bg-base-100 shadow-xl'>
              <div className='card-body'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <h3 className='card-title text-xl'>{project.title}</h3>
                    <p className='text-base-content/70 font-medium'>{project.artist}</p>
                    <p className='text-sm text-base-content/60 mb-3'>{project.role}</p>
                    <p className='text-base'>{project.description}</p>
                  </div>
                  <div className='badge badge-outline'>{project.year}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className='card bg-base-100 shadow-xl mt-12'>
          <div className='card-body'>
            <h2 className='card-title text-2xl'>Skills Developed</h2>
            <div className='divider'></div>

            <div className='grid md:grid-cols-2 gap-6'>
              <div>
                <h3 className='text-lg font-semibold mb-3'>Technical Skills</h3>
                <ul className='space-y-2'>
                  <li>• Pro Tools & Digital Audio Workstations</li>
                  <li>• Audio Signal Processing</li>
                  <li>• Studio Equipment Management</li>
                  <li>• Quality Control & Standards</li>
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-semibold mb-3'>Soft Skills</h3>
                <ul className='space-y-2'>
                  <li>• Project Management</li>
                  <li>• Client Relations</li>
                  <li>• Team Leadership</li>
                  <li>• Creative Problem Solving</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MediaPage
