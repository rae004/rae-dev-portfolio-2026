import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, CloseIcon, SearchIcon } from './icons'

interface MediaProjectGalleryProps {
  images: Array<{
    id: number
    url: string
    alt: string
    caption?: string
  }>
  title?: string
  imagesPerPage?: number
}

const MediaProjectGallery: React.FC<MediaProjectGalleryProps> = ({
  images,
  title = 'Project Gallery',
  imagesPerPage = 6,
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  const totalPages = Math.ceil(images.length / imagesPerPage)
  const startIndex = (currentPage - 1) * imagesPerPage
  const currentImages = images.slice(startIndex, startIndex + imagesPerPage)

  const openLightbox = (index: number) => {
    setSelectedImage(startIndex + index)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (selectedImage === null) return

    if (direction === 'prev') {
      setSelectedImage(selectedImage > 0 ? selectedImage - 1 : images.length - 1)
    } else {
      setSelectedImage(selectedImage < images.length - 1 ? selectedImage + 1 : 0)
    }
  }

  if (images.length === 0) {
    return null
  }

  return (
    <div className='card bg-base-100 shadow-xl'>
      <div className='card-body'>
        <h2 className='card-title text-2xl mb-4'>{title}</h2>
        <div className='divider'></div>

        {/* Gallery Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
          {currentImages.map((image, index) => (
            <div
              key={image.id}
              className='cursor-pointer group relative overflow-hidden rounded-lg aspect-square'
              onClick={() => openLightbox(index)}
            >
              <img
                src={image.url}
                alt={image.alt}
                className='w-full h-full object-cover transition-transform group-hover:scale-105'
              />
              <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center'>
                <SearchIcon
                  className='text-white opacity-0 group-hover:opacity-100 transition-opacity'
                  size='xl'
                />
              </div>
              {image.caption && (
                <div className='absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity'>
                  {image.caption}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex justify-center items-center gap-2'>
            <button
              className='btn btn-sm'
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size='sm' />
            </button>

            <div className='flex gap-1'>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className='btn btn-sm'
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size='sm' />
            </button>
          </div>
        )}

        <div className='text-center text-sm text-base-content/70 mt-2'>
          Showing {startIndex + 1}-{Math.min(startIndex + imagesPerPage, images.length)} of{' '}
          {images.length} images
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage !== null && (
        <div className='modal modal-open'>
          <div className='modal-box max-w-6xl w-full h-full max-h-screen p-4'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold'>
                Image {selectedImage + 1} of {images.length}
              </h3>
              <button className='btn btn-sm btn-circle' onClick={closeLightbox}>
                <CloseIcon size='sm' />
              </button>
            </div>

            <div className='relative flex justify-center items-center h-full'>
              <button
                className='btn btn-circle btn-primary absolute left-4 z-10'
                onClick={() => navigateLightbox('prev')}
              >
                <ChevronLeft size='md' />
              </button>

              <img
                src={images[selectedImage].url}
                alt={images[selectedImage].alt}
                className='max-w-full max-h-full object-contain'
              />

              <button
                className='btn btn-circle btn-primary absolute right-4 z-10'
                onClick={() => navigateLightbox('next')}
              >
                <ChevronRight size='md' />
              </button>
            </div>

            {images[selectedImage].caption && (
              <div className='mt-4 text-center'>
                <p className='text-base-content/70'>{images[selectedImage].caption}</p>
              </div>
            )}
          </div>
          <div className='modal-backdrop' onClick={closeLightbox}></div>
        </div>
      )}
    </div>
  )
}

export default MediaProjectGallery
