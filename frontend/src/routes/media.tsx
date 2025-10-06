import { createFileRoute } from '@tanstack/react-router'
import MediaPage from '../pages/MediaPage'

export const Route = createFileRoute('/media')({
  component: MediaPage,
})