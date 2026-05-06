import { createFileRoute } from '@tanstack/react-router'
import ResumeDetailPage from '../../pages/ResumeDetailPage'

export const Route = createFileRoute('/resume/$resumeId')({
  component: ResumeDetailPage,
})
