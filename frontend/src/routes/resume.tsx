import { createFileRoute } from '@tanstack/react-router'
import ResumePage from '../pages/ResumePage'

export const Route = createFileRoute('/resume')({
  component: ResumePage,
})
