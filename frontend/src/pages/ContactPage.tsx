import React from 'react'

const ContactPage: React.FC = () => {
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-4xl font-bold mb-8'>Contact</h1>

        <div className='grid md:grid-cols-2 gap-8'>
          <div className='card bg-base-100 shadow-xl'>
            <div className='card-body'>
              <h2 className='card-title text-2xl mb-6'>Get In Touch</h2>

              <form className='space-y-4'>
                <div className='form-control'>
                  <label className='label'>
                    <span className='label-text'>Name</span>
                  </label>
                  <input
                    type='text'
                    placeholder='Your name'
                    className='input input-bordered w-full'
                    required
                  />
                </div>

                <div className='form-control'>
                  <label className='label'>
                    <span className='label-text'>Email</span>
                  </label>
                  <input
                    type='email'
                    placeholder='your.email@example.com'
                    className='input input-bordered w-full'
                    required
                  />
                </div>

                <div className='form-control'>
                  <label className='label'>
                    <span className='label-text'>Subject</span>
                  </label>
                  <input
                    type='text'
                    placeholder='Subject'
                    className='input input-bordered w-full'
                    required
                  />
                </div>

                <div className='form-control'>
                  <label className='label'>
                    <span className='label-text'>Message</span>
                  </label>
                  <textarea
                    className='textarea textarea-bordered h-32'
                    placeholder='Your message...'
                    required
                  ></textarea>
                </div>

                <div className='form-control mt-6'>
                  <button type='submit' className='btn btn-primary'>
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className='space-y-6'>
            <div className='card bg-base-100 shadow-xl'>
              <div className='card-body'>
                <h3 className='card-title'>Connect With Me</h3>
                <div className='space-y-4'>
                  <div className='flex items-center space-x-3'>
                    <span className='text-2xl'>💼</span>
                    <a href='#' className='link link-primary'>
                      LinkedIn Profile
                    </a>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <span className='text-2xl'>🐙</span>
                    <a href='#' className='link link-primary'>
                      GitHub Profile
                    </a>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <span className='text-2xl'>📧</span>
                    <span>contact@rae-dev.com</span>
                  </div>
                </div>
              </div>
            </div>

            <div className='card bg-base-100 shadow-xl'>
              <div className='card-body'>
                <h3 className='card-title'>Collaboration</h3>
                <p className='text-sm'>
                  I'm always interested in discussing new opportunities, whether it's consulting on
                  cloud architecture, full-stack development, or sharing experiences from my diverse
                  career journey.
                </p>
              </div>
            </div>

            <div className='card bg-base-100 shadow-xl'>
              <div className='card-body'>
                <h3 className='card-title'>Response Time</h3>
                <p className='text-sm'>
                  I typically respond to messages within 24-48 hours. For urgent matters, please
                  mention it in your subject line.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
