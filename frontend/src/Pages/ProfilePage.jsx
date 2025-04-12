import React, { useState } from 'react';

const ProfilePage = ({ username }) => {
  const [formData, setFormData] = useState({
    name: username,
    email: `${username.toLowerCase()}@example.com`,
    nativeLanguage: 'English',
    learningLanguage: 'Spanish',
    proficiencyLevel: 'Intermediate',
    dailyGoal: '15'
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 1000);
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-primary">Your Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Details Card */}
        <div className="md:col-span-2">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-primary mb-4">Personal Information</h2>
              
              {saveSuccess && (
                <div className="alert alert-success mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Profile updated successfully!</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Full Name</span>
                    </label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange}
                      className="input input-bordered focus:border-primary" 
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Email</span>
                    </label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange}
                      className="input input-bordered focus:border-primary" 
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Native Language</span>
                    </label>
                    <select 
                      name="nativeLanguage" 
                      value={formData.nativeLanguage} 
                      onChange={handleChange}
                      className="select select-bordered focus:border-primary"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Japanese">Japanese</option>
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Learning Language</span>
                    </label>
                    <select 
                      name="learningLanguage" 
                      value={formData.learningLanguage} 
                      onChange={handleChange}
                      className="select select-bordered focus:border-primary"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Japanese">Japanese</option>
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Proficiency Level</span>
                    </label>
                    <select 
                      name="proficiencyLevel" 
                      value={formData.proficiencyLevel} 
                      onChange={handleChange}
                      className="select select-bordered focus:border-primary"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Daily Practice Goal (minutes)</span>
                    </label>
                    <input 
                      type="number" 
                      name="dailyGoal" 
                      value={formData.dailyGoal} 
                      onChange={handleChange}
                      className="input input-bordered focus:border-primary" 
                      min="5"
                      max="120"
                    />
                  </div>
                </div>
                
                <div className="card-actions justify-end mt-6">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* User Stats Card */}
        <div>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-center mb-4">
                <div className="avatar">
                  <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" alt={username} />
                  </div>
                </div>
              </div>
              
              <h2 className="text-center text-xl font-bold">{username}</h2>
              <p className="text-center text-sm opacity-70 mb-4">{formData.email}</p>
              
              <div className="divider"></div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Daily Streak</span>
                    <span className="badge badge-primary">7 days</span>
                  </div>
                  <progress className="progress progress-primary w-full" value="70" max="100"></progress>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Level Progress</span>
                    <span className="badge badge-secondary">Level 4</span>
                  </div>
                  <progress className="progress progress-secondary w-full" value="60" max="100"></progress>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">XP This Week</span>
                    <span className="badge badge-accent">450 XP</span>
                  </div>
                  <progress className="progress progress-accent w-full" value="45" max="100"></progress>
                </div>
              </div>
              
              <div className="divider"></div>
              
              <div className="stats stats-vertical shadow">
                <div className="stat">
                  <div className="stat-title">Total Practice Time</div>
                  <div className="stat-value text-primary">18h 24m</div>
                  <div className="stat-desc">Since April 1, 2025</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;