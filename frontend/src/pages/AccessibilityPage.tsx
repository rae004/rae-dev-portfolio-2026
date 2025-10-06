import React from 'react'

const AccessibilityPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Accessibility Statement</h1>
        
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl">Our Commitment</h2>
            <div className="divider"></div>
            <p className="text-lg mb-4">
              This website is committed to ensuring digital accessibility for people with disabilities. 
              We are continually improving the user experience for everyone and applying the relevant 
              accessibility standards.
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Conformance Status</h3>
            <p className="mb-4">
              This website strives to conform to the Web Content Accessibility Guidelines (WCAG) 2.2 
              at the AA level. These guidelines explain how to make web content more accessible to 
              people with disabilities.
            </p>
            
            <div className="alert alert-success">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>This website is designed to meet WCAG 2.2 AA standards</span>
            </div>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl">Accessibility Features</h2>
            <div className="divider"></div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Navigation & Structure</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Semantic HTML elements for screen readers</li>
                  <li>• Logical heading hierarchy (H1-H6)</li>
                  <li>• Skip navigation links</li>
                  <li>• Consistent navigation structure</li>
                  <li>• Descriptive page titles</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Visual & Interactive</h3>
                <ul className="space-y-2 text-sm">
                  <li>• High contrast color schemes</li>
                  <li>• Scalable text up to 200%</li>
                  <li>• Focus indicators for keyboard navigation</li>
                  <li>• Alternative text for images</li>
                  <li>• Multiple theme options</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl">Keyboard Navigation</h2>
            <div className="divider"></div>
            <p className="mb-4">This website can be fully navigated using only a keyboard:</p>
            
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><kbd className="kbd kbd-sm">Tab</kbd></td>
                    <td>Move to next interactive element</td>
                  </tr>
                  <tr>
                    <td><kbd className="kbd kbd-sm">Shift</kbd> + <kbd className="kbd kbd-sm">Tab</kbd></td>
                    <td>Move to previous interactive element</td>
                  </tr>
                  <tr>
                    <td><kbd className="kbd kbd-sm">Enter</kbd> / <kbd className="kbd kbd-sm">Space</kbd></td>
                    <td>Activate buttons and links</td>
                  </tr>
                  <tr>
                    <td><kbd className="kbd kbd-sm">Esc</kbd></td>
                    <td>Close modals and dropdowns</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl">Feedback & Support</h2>
            <div className="divider"></div>
            <p className="mb-4">
              We welcome your feedback on the accessibility of this website. If you encounter 
              any accessibility barriers or have suggestions for improvement, please contact us:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📧</span>
                <span>Email: accessibility@rae-dev.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">💬</span>
                <span>Contact form: <a href="/contact" className="link link-primary">Contact Page</a></span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-base-200 rounded-lg">
              <p className="text-sm">
                <strong>Response Time:</strong> We aim to respond to accessibility feedback within 2 business days 
                and will work to address any issues as quickly as possible.
              </p>
            </div>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl">Technical Specifications</h2>
            <div className="divider"></div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Compatibility</h3>
                <p className="text-sm mb-3">This website is designed to be compatible with:</p>
                <ul className="space-y-1 text-sm">
                  <li>• Screen readers (NVDA, JAWS, VoiceOver)</li>
                  <li>• Speech recognition software</li>
                  <li>• Keyboard-only navigation</li>
                  <li>• Browser zoom up to 200%</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Technologies Used</h3>
                <ul className="space-y-1 text-sm">
                  <li>• HTML5 with semantic elements</li>
                  <li>• ARIA labels and descriptions</li>
                  <li>• CSS for visual design</li>
                  <li>• JavaScript for interactive features</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccessibilityPage