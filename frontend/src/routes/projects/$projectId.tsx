import { createFileRoute } from '@tanstack/react-router'
import SoftwareProjectDetailPage from '../../pages/SoftwareProjectDetailPage'

export const Route = createFileRoute('/projects/$projectId')({
  component: SoftwareProjectDetailPage,
})
