import React from 'react'
import { useResumeItems } from '../hooks/useWordPress'
import type { ResumeItem } from '../types/wordpress.ts'

const ResumePage: React.FC = () => {
  const {
    data: resumeItems,
    isLoading,
    error,
  } = useResumeItems({
    status: 'publish',
    orderby: 'date',
    order: 'desc',
  })

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-4xl font-bold mb-8'>Resume</h1>

        <div className='card bg-base-100 shadow-xl mb-8'>
          <div className='card-body'>
            <h2 className='card-title text-2xl'>Professional Experience</h2>
            <div className='divider'></div>

            {isLoading && (
              <div className='flex justify-center items-center py-8'>
                <span className='loading loading-spinner loading-lg'></span>
                <span className='ml-3'>Loading resume data...</span>
              </div>
            )}

            {error && (
              <div className='alert alert-error'>
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
                    d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <span>Error loading resume data: {error.message}</span>
              </div>
            )}

            {resumeItems && resumeItems.length > 0 ? (
              <div className='space-y-6'>
                {resumeItems.sort(sortResumeItems).map(item => (
                  <div key={item.id}>
                    <h3 className='text-xl font-semibold'>{item.title.rendered}</h3>
                    {item.employment_dates?.formatted_range && (
                      <p className='text-base-content/70'>
                        {item.employment_dates.formatted_range}
                      </p>
                    )}
                    <div
                      className='mt-2 prose prose-sm max-w-none'
                      dangerouslySetInnerHTML={{ __html: item.content.rendered }}
                    />
                  </div>
                ))}
              </div>
            ) : resumeItems && resumeItems.length === 0 ? (
              <div className='text-center py-8'>
                <p className='text-base-content/70'>
                  No resume items found. Please add some content in WordPress.
                </p>
              </div>
            ) : null}

            {/* Fallback static content if WordPress is not available */}
            {error && (
              <div className='space-y-6 opacity-60'>
                <div>
                  <h3 className='text-xl font-semibold'>Cloud Engineer</h3>
                  <p className='text-base-content/70'>Cloud Engineering • Current</p>
                  <p className='mt-2'>
                    Certified cloud engineer deploying workloads to AWS using Infrastructure as Code
                    (IaC) and CI/CD best practices with TypeScript and Python.
                  </p>
                </div>

                <div>
                  <h3 className='text-xl font-semibold'>Software Engineer</h3>
                  <p className='text-base-content/70'>Web Development • PHP & JavaScript</p>
                  <p className='mt-2'>
                    Developed e-commerce solutions using Magento, Shopify, and WordPress, building
                    custom features and integrations.
                  </p>
                </div>

                <div>
                  <h3 className='text-xl font-semibold'>Team Lead</h3>
                  <p className='text-base-content/70'>Customer Service Management</p>
                  <p className='mt-2'>
                    Led teams of customer service representatives in call center environments,
                    focusing on operational excellence and team development.
                  </p>
                </div>

                <div>
                  <h3 className='text-xl font-semibold'>Audio Engineer</h3>
                  <p className='text-base-content/70'>Music Industry</p>
                  <p className='mt-2'>
                    Recorded and mixed albums and singles for artists and labels, managed
                    world-class recording studios.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='card bg-base-100 shadow-xl'>
          <div className='card-body'>
            <h2 className='card-title text-2xl'>Technical Skills</h2>
            <div className='divider'></div>

            <div className='grid md:grid-cols-2 gap-6'>
              <div>
                <h3 className='text-lg font-semibold mb-3'>Languages & Frameworks</h3>
                <div className='flex flex-wrap gap-2'>
                  <span className='badge badge-primary'>TypeScript</span>
                  <span className='badge badge-primary'>JavaScript</span>
                  <span className='badge badge-primary'>Python</span>
                  <span className='badge badge-primary'>PHP</span>
                  <span className='badge badge-primary'>React</span>
                </div>
              </div>

              <div>
                <h3 className='text-lg font-semibold mb-3'>Cloud & DevOps</h3>
                <div className='flex flex-wrap gap-2'>
                  <span className='badge badge-secondary'>AWS</span>
                  <span className='badge badge-secondary'>CDK</span>
                  <span className='badge badge-secondary'>CI/CD</span>
                  <span className='badge badge-secondary'>Docker</span>
                  <span className='badge badge-secondary'>IaC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumePage

function sortResumeItems(a: ResumeItem, b: ResumeItem) {
  // Items with "Present" end date go first
  if (a.employment_dates?.end_date === 'Present' && b.employment_dates?.end_date !== 'Present') {
    return -1
  }
  if (b.employment_dates?.end_date === 'Present' && a.employment_dates?.end_date !== 'Present') {
    return 1
  }

  // If both are "Present" or both are not "Present", sort by end_date_raw desc
  const aEndDate = a.employment_dates?.end_date_raw || ''
  const bEndDate = b.employment_dates?.end_date_raw || ''

  return bEndDate.localeCompare(aEndDate)
}
