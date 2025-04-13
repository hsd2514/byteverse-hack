import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('Login successful!');
        console.log('Login successful:', data);
        // Store session info in localStorage
        localStorage.setItem('session', JSON.stringify(data.session));
        // Use the onLogin prop if provided (for backward compatibility)
        if (onLogin) {
          onLogin(email);
        }
        // Store username in localStorage
        localStorage.setItem('username', email);
        // Redirect to practice page
        setTimeout(() => {
          navigate('/practice');
        }, 1000); // Short delay to show success message
      } else {
        setMessage(`Login failed: ${data.error}`);
        console.error('Login failed:', data.error);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      console.error('Error during login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-center">Login</h2>
          
          {message && (
            <div className={`alert ${message.includes('successful') ? 'alert-success' : 'alert-error'}`}>
              <span>{message}</span>
            </div>
          )}
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="input input-bordered"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              className="input input-bordered"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="form-control mt-6">
            <button 
              className={`btn btn-primary ${isLoading ? 'loading' : ''}`} 
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <p>Don't have an account? <a href="/register" className="link link-primary">Register</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;