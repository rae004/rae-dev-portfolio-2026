import { createFileRoute } from '@tanstack/react-router'
import MediaDetailPage from '../../pages/MediaDetailPage'

export const Route = createFileRoute('/media/$mediaId')({
  component: MediaDetailPage,
})
