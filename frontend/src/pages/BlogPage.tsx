import React from 'react'
import { useBlogPosts } from '../hooks/useWordPress'
import type { WordPressPost } from '../types/wordpress'

const BlogPage: React.FC = () => {
  const { 
    data: wpBlogPosts, 
    isLoading, 
    error 
  } = useBlogPosts({
    per_page: 20,
    orderby: 'date',
    order: 'desc'
  })

  // Fallback blog posts for when WordPress is unavailable
  const fallbackPosts = [
    {
      title: "From Audio Engineering to Cloud Engineering",
      excerpt: "My journey transitioning from the music industry to cloud computing and the transferable skills that made it possible.",
      date: "2024-03-15",
      readTime: "5 min read",
      tags: ["Career", "Cloud", "Music"]
    },
    {
      title: "Building Modern React Applications with TanStack",
      excerpt: "Exploring the power of TanStack Router, Query, and Form for building performant React applications.",
      date: "2024-02-28",
      readTime: "8 min read",
      tags: ["React", "TanStack", "Frontend"]
    },
    {
      title: "AWS CDK Best Practices for Production",
      excerpt: "Lessons learned from deploying cloud infrastructure using AWS CDK in production environments.",
      date: "2024-02-10",
      readTime: "12 min read",
      tags: ["AWS", "CDK", "Infrastructure"]
    }
  ]

  // Transform WordPress data to match component expectations
  const transformWpBlogPost = (wp: WordPressPost) => {
    const content = wp.content.rendered.replace(/<[^>]*>/g, '') // Strip HTML
    const wordCount = content.split(/\s+/).length
    const readTime = Math.max(1, Math.ceil(wordCount / 200)) // ~200 words per minute
    
    // Try to extract tags from content or use defaults
    const tagsMatch = content.match(/Tags?:?\s*([^.]+)/i)
    
    return {
      title: wp.title.rendered,
      excerpt: wp.excerpt.rendered ? 
        wp.excerpt.rendered.replace(/<[^>]*>/g, '').trim() : 
        content.substring(0, 200) + '...',
      date: new Date(wp.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit'
      }),
      readTime: `${readTime} min read`,
      tags: tagsMatch ? 
        tagsMatch[1].split(/[,;]/).map(t => t.trim()).filter(Boolean) : 
        ["Blog"]
    }
  }

  // Use WordPress data if available, otherwise fallback
  const blogPosts = error || !wpBlogPosts ? 
    fallbackPosts : 
    wpBlogPosts.map(transformWpBlogPost)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {/* Error State with Fallback Content */}
        {error && (
          <div className="alert alert-warning mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.876a2 2 0 001.789-2.894l-6.938-13.856a2 2 0 00-3.578 0L.394 16.106A2 2 0 002.183 19z" />
            </svg>
            <span>Unable to load blog posts from CMS. Showing featured posts instead.</span>
          </div>
        )}
        
        <div className="hero bg-base-200 rounded-lg mb-12">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h2 className="text-2xl font-bold">Sharing Knowledge & Experiences</h2>
              <p className="py-4">
                Insights from my journey across multiple industries, technical tutorials, 
                and thoughts on modern software development practices.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-8">
          {blogPosts.map((post, index) => (
            <article key={index} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="card-title text-2xl mb-2">{post.title}</h2>
                    <p className="text-base-content/70 mb-4">{post.excerpt}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="badge badge-outline">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-base-content/60">
                    <span>{post.date}</span> • <span>{post.readTime}</span>
                  </div>
                  <button className="btn btn-primary btn-sm">Read More</button>
                </div>
              </div>
            </article>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-lg mb-4">More articles coming soon!</p>
          <div className="join">
            <input 
              className="input input-bordered join-item" 
              placeholder="Subscribe to newsletter"
            />
            <button className="btn btn-primary join-item">Subscribe</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlogPage