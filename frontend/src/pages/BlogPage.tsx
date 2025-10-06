import React from 'react'

const BlogPage: React.FC = () => {
  const blogPosts = [
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        
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