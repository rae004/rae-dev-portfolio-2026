import React from 'react'
import { useSoftwareProjects } from '../hooks/useWordPress'
import type { SoftwareProject } from '../types/wordpress'

const ProjectsPage: React.FC = () => {
  const {
    data: wpProjects,
    isLoading,
    error,
  } = useSoftwareProjects({
    per_page: 20,
    orderby: 'date',
    order: 'desc',
  })

  // Fallback projects for when WordPress is unavailable
  const fallbackProjects = [
    {
      title: 'Portfolio Website 2026',
      description:
        'Modern portfolio built with React, TypeScript, TanStack Router, and deployed on AWS',
      tech: ['React', 'TypeScript', 'AWS CDK', 'TanStack Router'],
      status: 'In Development',
    },
    {
      title: 'E-commerce Solutions',
      description: 'Custom e-commerce implementations using Magento, Shopify, and WordPress',
      tech: ['PHP', 'JavaScript', 'Magento', 'Shopify'],
      status: 'Completed',
    },
    {
      title: 'Cloud Infrastructure',
      description: 'AWS infrastructure deployments using CDK and best practices',
      tech: ['AWS', 'TypeScript', 'CDK', 'CloudFormation'],
      status: 'Ongoing',
    },
  ]

  // Transform WordPress data to match component expectations
  const transformWpProject = (wp: SoftwareProject) => {
    // Extract tech stack and status from content or use defaults
    const content = wp.content.rendered.replace(/<[^>]*>/g, '') // Strip HTML

    // Try to extract tech stack from content (basic implementation)
    const techMatch = content.match(/Technologies?:?\s*([^.]+)/i)
    const statusMatch = content.match(/Status:?\s*([^.]+)/i)

    return {
      title: wp.title.rendered,
      description: wp.excerpt.rendered
        ? wp.excerpt.rendered.replace(/<[^>]*>/g, '').trim()
        : content.substring(0, 150) + '...',
      tech: techMatch
        ? techMatch[1]
            .split(/[,;]/)
            .map(t => t.trim())
            .filter(Boolean)
        : ['Web Development'],
      status: statusMatch ? statusMatch[1].trim() : 'Completed',
    }
  }

  // Use WordPress data if available, otherwise fallback
  const projects = error || !wpProjects ? fallbackProjects : wpProjects.map(transformWpProject)

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-4xl font-bold mb-8'>Software Projects</h1>

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

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {projects.map((project, index) => (
            <div key={index} className='card bg-base-100 shadow-xl'>
              <div className='card-body'>
                <h2 className='card-title'>{project.title}</h2>
                <p className='text-sm text-base-content/70 mb-4'>{project.description}</p>

                <div className='mb-4'>
                  <h3 className='font-semibold mb-2'>Technologies:</h3>
                  <div className='flex flex-wrap gap-1'>
                    {project.tech.map((tech, techIndex) => (
                      <span key={techIndex} className='badge badge-outline badge-sm'>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className='card-actions justify-between items-center'>
                  <span
                    className={`badge ${
                      project.status === 'Completed'
                        ? 'badge-success'
                        : project.status === 'In Development'
                          ? 'badge-warning'
                          : 'badge-info'
                    }`}
                  >
                    {project.status}
                  </span>
                  <button className='btn btn-primary btn-sm'>View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className='text-center mt-12'>
          <p className='text-lg mb-4'>More projects coming soon!</p>
          <button className='btn btn-outline'>View on GitHub</button>
        </div>
      </div>
    </div>
  )
}

export default ProjectsPage
