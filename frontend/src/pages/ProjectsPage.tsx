import React from 'react'

const ProjectsPage: React.FC = () => {
  const projects = [
    {
      title: "Portfolio Website 2026",
      description: "Modern portfolio built with React, TypeScript, TanStack Router, and deployed on AWS",
      tech: ["React", "TypeScript", "AWS CDK", "TanStack Router"],
      status: "In Development"
    },
    {
      title: "E-commerce Solutions",
      description: "Custom e-commerce implementations using Magento, Shopify, and WordPress",
      tech: ["PHP", "JavaScript", "Magento", "Shopify"],
      status: "Completed"
    },
    {
      title: "Cloud Infrastructure",
      description: "AWS infrastructure deployments using CDK and best practices",
      tech: ["AWS", "TypeScript", "CDK", "CloudFormation"],
      status: "Ongoing"
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Software Projects</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <div key={index} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">{project.title}</h2>
                <p className="text-sm text-base-content/70 mb-4">{project.description}</p>
                
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Technologies:</h3>
                  <div className="flex flex-wrap gap-1">
                    {project.tech.map((tech, techIndex) => (
                      <span key={techIndex} className="badge badge-outline badge-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="card-actions justify-between items-center">
                  <span className={`badge ${
                    project.status === 'Completed' ? 'badge-success' : 
                    project.status === 'In Development' ? 'badge-warning' : 'badge-info'
                  }`}>
                    {project.status}
                  </span>
                  <button className="btn btn-primary btn-sm">View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-lg mb-4">More projects coming soon!</p>
          <button className="btn btn-outline">View on GitHub</button>
        </div>
      </div>
    </div>
  )
}

export default ProjectsPage