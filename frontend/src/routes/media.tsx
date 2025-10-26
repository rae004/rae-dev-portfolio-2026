import { createFileRoute } from '@tanstack/react-router'
import EnhancedMediaPage from '../pages/EnhancedMediaPage'

export const Route = createFileRoute('/media')({
  component: EnhancedMediaPage,
})
