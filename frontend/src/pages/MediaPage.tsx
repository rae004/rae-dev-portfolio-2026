import React from 'react'

const MediaPage: React.FC = () => {
  const mediaProjects = [
    {
      title: "Album Production",
      artist: "Various Artists",
      role: "Recording & Mixing Engineer",
      description: "Recorded and mixed full-length albums for independent artists and labels",
      year: "2010-2015"
    },
    {
      title: "Studio Management",
      artist: "World-Class Recording Studios",
      role: "Studio Manager",
      description: "Managed day-to-day operations of professional recording facilities",
      year: "2012-2016"
    },
    {
      title: "Single Productions",
      artist: "Multiple Artists",
      role: "Audio Engineer",
      description: "Produced and engineered singles across various genres",
      year: "2010-2018"
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Media Projects</h1>
        
        <div className="hero bg-base-200 rounded-lg mb-12">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h2 className="text-2xl font-bold">Music Industry Experience</h2>
              <p className="py-4">
                From recording and mixing albums to managing world-class studios, 
                my journey in the music industry provided foundational skills in 
                project management, attention to detail, and creative problem-solving.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {mediaProjects.map((project, index) => (
            <div key={index} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="card-title text-xl">{project.title}</h3>
                    <p className="text-base-content/70 font-medium">{project.artist}</p>
                    <p className="text-sm text-base-content/60 mb-3">{project.role}</p>
                    <p className="text-base">{project.description}</p>
                  </div>
                  <div className="badge badge-outline">{project.year}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="card bg-base-100 shadow-xl mt-12">
          <div className="card-body">
            <h2 className="card-title text-2xl">Skills Developed</h2>
            <div className="divider"></div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Technical Skills</h3>
                <ul className="space-y-2">
                  <li>• Pro Tools & Digital Audio Workstations</li>
                  <li>• Audio Signal Processing</li>
                  <li>• Studio Equipment Management</li>
                  <li>• Quality Control & Standards</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Soft Skills</h3>
                <ul className="space-y-2">
                  <li>• Project Management</li>
                  <li>• Client Relations</li>
                  <li>• Team Leadership</li>
                  <li>• Creative Problem Solving</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MediaPage