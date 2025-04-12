import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    // Show loading state
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin(username);
    }, 800);
  };
  
  return (
    <div className="hero min-h-screen hero-gradient">
      <div className="hero-content flex-col lg:flex-row-reverse gap-8 max-w-5xl">
        <div className="text-center lg:text-left lg:ml-8 w-full lg:w-1/2">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-primary">Lingua</span>
            <span className="gradient-text bg-clip-text text-transparent bg-gradient-to-r from-secondary to-accent">Learn</span>
          </h1>
          <p className="py-6 max-w-md opacity-80">Improve your language skills with our interactive AI-powered platform. Practice conversation, grammar, and pronunciation with personalized feedback.</p>
          
          <div className="stats stats-vertical shadow bg-base-100/40 backdrop-blur-sm w-full my-8">
            <div className="stat">
              <div className="stat-figure text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="stat-title">Happy Students</div>
              <div className="stat-value text-primary">25.6K</div>
              <div className="stat-desc">21% more than last year</div>
            </div>
            <div className="stat">
              <div className="stat-figure text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="stat-title">Languages Available</div>
              <div className="stat-value text-secondary">12</div>
              <div className="stat-desc">Learn at your own pace</div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
            <div className="badge badge-lg p-4">AI-powered learning</div>
            <div className="badge badge-lg p-4">Personalized feedback</div>
            <div className="badge badge-lg p-4">Voice recognition</div>
          </div>
        </div>
        
        <div className="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100/80 backdrop-blur-sm border border-base-300">
          <div className="card-body">
            <div className="tabs tabs-boxed p-1 bg-base-200 rounded-full">
              <a 
                className={`tab transition-all px-6 ${!isRegister ? 'tab-active' : ''}`}
                onClick={() => setIsRegister(false)}
              >
                Login
              </a>
              <a 
                className={`tab transition-all px-6 ${isRegister ? 'tab-active' : ''}`}
                onClick={() => setIsRegister(true)}
              >
                Register
              </a>
            </div>
            
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="alert alert-error mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{error}</span>
                </div>
              )}
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <input 
                  type="text" 
                  placeholder="username" 
                  className="input input-bordered focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input 
                  type="password" 
                  placeholder="password" 
                  className="input input-bordered focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {!isRegister && (
                  <label className="label">
                    <a href="#" className="label-text-alt link link-hover text-primary">Forgot password?</a>
                  </label>
                )}
              </div>
              
              {isRegister && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Confirm Password</span>
                  </label>
                  <input 
                    type="password" 
                    placeholder="confirm password" 
                    className="input input-bordered focus:border-primary focus:ring-2 focus:ring-primary/20" 
                    required
                  />
                </div>
              )}
              
              <div className="form-control mt-6">
                <button 
                  className="btn btn-primary"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      {isRegister ? 'Creating Account...' : 'Logging in...'}
                    </>
                  ) : (
                    isRegister ? 'Create Account' : 'Login'
                  )}
                </button>
              </div>
            </form>
            
            <div className="divider">OR</div>
            
            <div className="flex flex-col gap-2">
              <button className="btn btn-outline gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                </svg>
                Continue with Google
              </button>
              
              <button className="btn btn-outline gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#039BE5" d="M24 5A19 19 0 1 0 24 43A19 19 0 1 0 24 5Z" />
                  <path fill="#FFFFFF" d="M26.572,29.036h4.917l0.772-4.995h-5.69v-2.73c0-2.075,0.678-3.915,2.619-3.915h3.119v-4.359c-0.548-0.074-1.707-0.236-3.897-0.236c-4.573,0-7.254,2.415-7.254,7.917v3.323h-4.701v4.995h4.701v13.729C22.089,42.905,23.032,43,24,43c0.875,0,1.729-0.08,2.572-0.194V29.036z" />
                </svg>
                Continue with Facebook
              </button>

              <button className="btn btn-outline gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm opacity-70">
                By {isRegister ? 'registering' : 'logging in'}, you agree to our 
                <a href="#" className="link link-primary ml-1">Terms of Service</a> and
                <a href="#" className="link link-primary ml-1">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;