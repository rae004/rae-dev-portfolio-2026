import { createFileRoute } from '@tanstack/react-router'
import AccessibilityPage from '../pages/AccessibilityPage'

export const Route = createFileRoute('/accessibility')({
  component: AccessibilityPage,
})