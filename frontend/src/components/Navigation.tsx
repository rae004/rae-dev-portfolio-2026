import React from 'react'
import { Link } from '@tanstack/react-router'
import ThemeSwitcher from './ThemeSwitcher'

const Navigation: React.FC = () => {
  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><Link to="/" className="[&.active]:font-bold">Home</Link></li>
            <li><Link to="/resume" className="[&.active]:font-bold">Resume</Link></li>
            <li><Link to="/projects" className="[&.active]:font-bold">Projects</Link></li>
            <li><Link to="/media" className="[&.active]:font-bold">Media</Link></li>
            <li><Link to="/blog" className="[&.active]:font-bold">Blog</Link></li>
            <li><Link to="/contact" className="[&.active]:font-bold">Contact</Link></li>
          </ul>
        </div>
        <Link to="/" className="btn btn-ghost text-xl">Rae Dev</Link>
      </div>
      
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link to="/" className="[&.active]:font-bold">Home</Link></li>
          <li><Link to="/resume" className="[&.active]:font-bold">Resume</Link></li>
          <li><Link to="/projects" className="[&.active]:font-bold">Projects</Link></li>
          <li><Link to="/media" className="[&.active]:font-bold">Media</Link></li>
          <li><Link to="/blog" className="[&.active]:font-bold">Blog</Link></li>
          <li><Link to="/contact" className="[&.active]:font-bold">Contact</Link></li>
        </ul>
      </div>
      
      <div className="navbar-end">
        <ThemeSwitcher />
      </div>
    </div>
  )
}

export default Navigation