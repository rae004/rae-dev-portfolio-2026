import React from 'react'
import { Link } from '@tanstack/react-router'
import { useBlogPosts, useSoftwareProjects, useMediaProjects } from '../hooks/useWordPress'
import { decodeHtml } from '../utils/decodeHtml'

const HomePage: React.FC = () => {
  // Get recent blog posts for featured content
  const { data: recentPosts, isLoading: postsLoading } = useBlogPosts({
    per_page: 3,
    orderby: 'date',
    order: 'desc',
  })

  // Get recent projects for featured content
  const { data: softwareProjects, isLoading: softwareLoading } = useSoftwareProjects({
    per_page: 2,
    orderby: 'date',
    order: 'desc',
  })

  const { data: mediaProjects, isLoading: mediaLoading } = useMediaProjects({
    per_page: 2,
    orderby: 'date',
    order: 'desc',
  })

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <div className='hero min-h-screen bg-base-200'>
        <div className='hero-content text-center'>
          <div className='max-w-md'>
            <h1 className='text-5xl font-bold'>Hello there</h1>
            <p className='py-6'>
              Welcome to Robert Engel's portfolio - showcasing a unique journey from music
              production to cloud engineering, with expertise spanning multiple industries and
              technologies.
            </p>
            <Link to='/resume' className='btn btn-primary'>
              View Resume
            </Link>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section className='py-16 bg-base-100'>
        <div className='container mx-auto px-4'>
          <div className='max-w-4xl mx-auto'>
            <h2 className='text-3xl font-bold text-center mb-8'>About</h2>
            <p className='text-lg text-center mb-8'>
              Software Engineer, life long learner, and adventurer with a diverse background in
              music industry, customer service leadership, e-commerce development, and cloud
              engineering.
            </p>

            <div className='grid md:grid-cols-3 gap-6'>
              <div className='card bg-base-200 shadow-lg'>
                <div className='card-body text-center'>
                  <h3 className='card-title justify-center'>🎵 Music Industry</h3>
                  <p>Recording, mixing, and studio management experience</p>
                </div>
              </div>

              <div className='card bg-base-200 shadow-lg'>
                <div className='card-body text-center'>
                  <h3 className='card-title justify-center'>💻 Software Development</h3>
                  <p>Full-stack development with modern technologies</p>
                </div>
              </div>

              <div className='card bg-base-200 shadow-lg'>
                <div className='card-body text-center'>
                  <h3 className='card-title justify-center'>☁️ Cloud Engineering</h3>
                  <p>AWS certified with Infrastructure as Code expertise</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Blog Posts Section */}
      {recentPosts && recentPosts.length > 0 && (
        <section className='py-16 bg-base-100'>
          <div className='container mx-auto px-4'>
            <div className='max-w-4xl mx-auto'>
              <h2 className='text-3xl font-bold text-center mb-8'>Latest Posts</h2>

              {postsLoading ? (
                <div className='flex justify-center'>
                  <span className='loading loading-spinner loading-lg'></span>
                </div>
              ) : (
                <div className='grid md:grid-cols-3 gap-6'>
                  {recentPosts.slice(0, 3).map((post, index) => (
                    <div key={post.id || index} className='card bg-base-200 shadow-lg'>
                      <div className='card-body'>
                        <h3 className='card-title text-lg'>{decodeHtml(post.title.rendered)}</h3>
                        <p className='text-sm text-base-content/70'>
                          {post.excerpt.rendered
                            ? post.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 100) +
                              '...'
                            : 'Read this latest blog post...'}
                        </p>
                        <div className='card-actions justify-end'>
                          <Link to='/blog' className='btn btn-primary btn-sm'>
                            Read More
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Recent Projects Section */}
      {((softwareProjects && softwareProjects.length > 0) ||
        (mediaProjects && mediaProjects.length > 0)) && (
        <section className='py-16 bg-base-200'>
          <div className='container mx-auto px-4'>
            <div className='max-w-6xl mx-auto'>
              <h2 className='text-3xl font-bold text-center mb-8'>Recent Projects</h2>

              {softwareLoading || mediaLoading ? (
                <div className='flex justify-center'>
                  <span className='loading loading-spinner loading-lg'></span>
                </div>
              ) : (
                <div className='grid md:grid-cols-2 gap-8'>
                  {/* Software Projects */}
                  {softwareProjects && softwareProjects.length > 0 && (
                    <div>
                      <h3 className='text-xl font-semibold mb-4 flex items-center'>
                        💻 Software Projects
                        <Link to='/projects' className='btn btn-ghost btn-sm ml-auto'>
                          View All →
                        </Link>
                      </h3>
                      <div className='space-y-4'>
                        {softwareProjects.slice(0, 2).map((project, index) => (
                          <div key={project.id || index} className='card bg-base-100 shadow-lg'>
                            <div className='card-body'>
                              <h4 className='card-title text-lg'>{decodeHtml(project.title.rendered)}</h4>
                              <p className='text-sm text-base-content/70'>
                                {project.excerpt.rendered
                                  ? project.excerpt.rendered
                                      .replace(/<[^>]*>/g, '')
                                      .substring(0, 120) + '...'
                                  : 'Explore this software project...'}
                              </p>
                              <div className='card-actions justify-end'>
                                <Link to='/projects' className='btn btn-primary btn-sm'>
                                  Learn More
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Media Projects */}
                  {mediaProjects && mediaProjects.length > 0 && (
                    <div>
                      <h3 className='text-xl font-semibold mb-4 flex items-center'>
                        🎵 Media Projects
                        <Link to='/media' className='btn btn-ghost btn-sm ml-auto'>
                          View All →
                        </Link>
                      </h3>
                      <div className='space-y-4'>
                        {mediaProjects.slice(0, 2).map((project, index) => (
                          <div key={project.id || index} className='card bg-base-100 shadow-lg'>
                            <div className='card-body'>
                              <h4 className='card-title text-lg'>{decodeHtml(project.title.rendered)}</h4>
                              <p className='text-sm text-base-content/70'>
                                {project.excerpt.rendered
                                  ? project.excerpt.rendered
                                      .replace(/<[^>]*>/g, '')
                                      .substring(0, 120) + '...'
                                  : 'Discover this media project...'}
                              </p>
                              <div className='card-actions justify-end'>
                                <Link to='/media' className='btn btn-primary btn-sm'>
                                  Learn More
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Quick Links Section */}
      <section className='py-16 bg-base-200'>
        <div className='container mx-auto px-4'>
          <div className='max-w-4xl mx-auto text-center'>
            <h2 className='text-3xl font-bold mb-8'>Explore My Work</h2>
            <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <Link to='/resume' className='btn btn-outline btn-lg'>
                Resume
              </Link>
              <Link to='/projects' className='btn btn-outline btn-lg'>
                Software Projects
              </Link>
              <Link to='/media' className='btn btn-outline btn-lg'>
                Media Projects
              </Link>
              <Link to='/contact' className='btn btn-outline btn-lg'>
                Contact
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className='py-6 bg-base-200 border-t border-base-300'>
        <div className='container mx-auto px-4 text-center'>
          <span
            className='badge badge-ghost text-xs text-base-content/60'
            aria-label='Frontend build version and environment'
          >
            v{__APP_VERSION__} · {shortEnvLabel(__APP_ENV__)}
          </span>
        </div>
      </footer>
    </div>
  )
}

const shortEnvLabel = (env: string | undefined): string => {
  switch (env) {
    case 'development':
      return 'dev'
    case 'production':
      return 'prod'
    case 'local':
      return 'local'
    default:
      return env ?? 'unknown'
  }
}

export default HomePage
