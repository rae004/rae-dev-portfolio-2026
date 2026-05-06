import { createFileRoute } from '@tanstack/react-router'
import BlockedPage from '../pages/BlockedPage'

export const Route = createFileRoute('/blocked')({
  component: BlockedPage,
})
