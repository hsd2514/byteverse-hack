import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
// import HomePage from './Pages/HomePage'; // Removed HomePage import
import PracticePage from './Pages/PracticePage';


// import ProtectedRoute from './components/ProtectedRoute.jsx'; // Removed ProtectedRoute import
import './App.css';

function App() {
  const [user, setUser] = useState(localStorage.getItem('username'));
  // Removed theme state and useEffect

  const handleLogin = (username) => {
    localStorage.setItem('username', username);
    setUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    setUser(null);
  };

  // Removed handleThemeChange function

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-base-100 transition-all duration-300">
        {/* Removed onThemeChange prop */}
        <Navbar user={user} onLogout={handleLogout} />
        <div className="flex-grow container mx-auto p-4">
          <Routes>
            <Route
              path="/"
              // If user is logged in, redirect to /practice, otherwise show Login
              element={user ? <Navigate to="/practice" replace /> : <Login onLogin={handleLogin} />}
            />
            <Route
              path="/login"
              element={user ? <Navigate to="/practice" replace /> : <Login onLogin={handleLogin} />}
            />
            <Route
              path="/register"
              element={user ? <Navigate to="/practice" replace /> : <Register />}
            />
            <Route
              path="/practice"
              // Removed ProtectedRoute wrapper
              element={<PracticePage username={user} />}
            />

            {/* Add a fallback route for any unmatched paths */}
            <Route path="*" element={<Navigate to={user ? "/practice" : "/"} replace />} />
          </Routes>
        </div>
        {/* Footer can remain if needed */}
      </div>
    </Router>
  );
}

export default App;
