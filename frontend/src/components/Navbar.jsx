import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout, onThemeChange }) => {
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Apply theme when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (onThemeChange) {
      onThemeChange(theme === 'dark');
    }
  }, [theme, onThemeChange]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: 'home' },
    { to: '/practice', label: 'Practice', icon: 'message-circle' },
    { to: '/progress', label: 'Progress', icon: 'activity' },
    { to: '/profile', label: 'Profile', icon: 'user' },
  ];

  const renderIcon = (name) => {
    const icons = {
      home: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      'message-circle': (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      activity: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      user: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      moon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
      sun: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      logout: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      )
    };

    return icons[name] || null;
  };

  return (
    <div className="navbar bg-base-100 shadow-md sticky top-0 z-50 border-b border-base-200">
      <div className="navbar-start">
        <div className="dropdown">
          <label 
            tabIndex={0} 
            className="btn btn-ghost lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </label>
          <ul tabIndex={0} className={`menu menu-sm dropdown-content mt-3 z-50 p-2 shadow bg-base-100 rounded-box w-52 ${isMenuOpen ? 'block' : 'hidden'}`}>
            {user && navLinks.map((link) => (
              <li key={link.to}>
                <Link 
                  to={link.to} 
                  className={location.pathname === link.to ? 'active font-medium bg-base-200' : ''} 
                  onClick={() => setIsMenuOpen(false)}
                >
                  {renderIcon(link.icon)}
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <Link to="/" className="btn btn-ghost normal-case text-xl">
          <span className="text-primary font-bold">Lingua</span>
          <span className="gradient-text bg-clip-text text-transparent bg-gradient-to-r from-secondary to-accent">Learn</span>
        </Link>
      </div>
      
      <div className="navbar-center hidden lg:flex">
        {user && (
          <ul className="menu menu-horizontal px-1">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link 
                  to={link.to} 
                  className={`rounded-lg mx-1 ${location.pathname === link.to ? 'bg-base-200 font-medium' : ''}`}
                >
                  {renderIcon(link.icon)}
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="navbar-end">
        <label className="swap swap-rotate btn btn-ghost btn-circle">
          <input 
            type="checkbox" 
            checked={theme === 'dark'} 
            onChange={toggleTheme} 
            className="theme-controller"
            value="dark"
          />
          <div className="swap-on">{renderIcon('sun')}</div>
          <div className="swap-off">{renderIcon('moon')}</div>
        </label>
        
        {user ? (
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar online border border-primary">
              <div className="w-10 rounded-full">
                <img src="https://i.pravatar.cc/150?img=32" alt={user} />
              </div>
            </label>
            <ul tabIndex={0} className="mt-3 z-50 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li className="font-medium text-sm p-2 pb-1">
                Signed in as <span className="font-bold text-primary">{user}</span>
              </li>
              <div className="divider my-0"></div>
              <li><Link to="/profile" className="flex gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Profile Settings</Link></li>
              <li><Link to="/progress" className="flex gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Learning Progress</Link></li>
              <div className="divider my-0"></div>
              <li>
                <button onClick={onLogout} className="text-error flex gap-2">
                  {renderIcon('logout')}
                  Logout
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <Link to="/" className="btn btn-primary">
            Login
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;