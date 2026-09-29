import { createFileRoute, redirect } from '@tanstack/react-router'
import BlogPage from '../pages/BlogPage'
import { FEATURES } from '../config/features'

export const Route = createFileRoute('/blog')({
  // While the blog is switched off, a direct visit to /blog goes home
  // instead of showing an unfinished page. Route stays registered so
  // re-enabling is a one-flag change.
  beforeLoad: () => {
    if (!FEATURES.blog) throw redirect({ to: '/' })
  },
  component: BlogPage,
})
