import React from 'react'
import { Link } from '@tanstack/react-router'

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Hello there</h1>
            <p className="py-6">
              Welcome to Robert Engel's portfolio - showcasing a unique journey from music production 
              to cloud engineering, with expertise spanning multiple industries and technologies.
            </p>
            <Link to="/resume" className="btn btn-primary">View Resume</Link>
          </div>
        </div>
      </div>
      
      {/* About Section */}
      <section className="py-16 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">About</h2>
            <p className="text-lg text-center mb-8">
              Software Engineer, life long learner, and adventurer with a diverse background 
              in music industry, customer service leadership, e-commerce development, and cloud engineering.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body text-center">
                  <h3 className="card-title justify-center">🎵 Music Industry</h3>
                  <p>Recording, mixing, and studio management experience</p>
                </div>
              </div>
              
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body text-center">
                  <h3 className="card-title justify-center">💻 Software Development</h3>
                  <p>Full-stack development with modern technologies</p>
                </div>
              </div>
              
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body text-center">
                  <h3 className="card-title justify-center">☁️ Cloud Engineering</h3>
                  <p>AWS certified with Infrastructure as Code expertise</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Explore My Work</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/resume" className="btn btn-outline btn-lg">Resume</Link>
              <Link to="/projects" className="btn btn-outline btn-lg">Software Projects</Link>
              <Link to="/media" className="btn btn-outline btn-lg">Media Projects</Link>
              <Link to="/contact" className="btn btn-outline btn-lg">Contact</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage