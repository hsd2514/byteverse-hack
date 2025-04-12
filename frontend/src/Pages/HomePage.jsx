import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = ({ username }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('popular');
  
  // Single practice option for speaking exam practice
  const practiceOption = {
    title: "Speaking Exam Practice",
    description: "Structured speaking practice with real-time feedback on pronunciation, grammar, and fluency",
    icon: "🎯",
    path: "/practice?tab=intro",
    color: "primary"
  };

  const popularTopics = [
    { id: 1, title: "Travel Conversations", level: "Intermediate", duration: "15 min" },
    { id: 2, title: "Ordering Food", level: "Beginner", duration: "10 min" },
    { id: 3, title: "Job Interviews", level: "Advanced", duration: "20 min" }
  ];

  const recommendedTopics = [
    { id: 4, title: "Weather Small Talk", level: "Beginner", duration: "10 min" },
    { id: 5, title: "Shopping Experience", level: "Intermediate", duration: "15 min" },
    { id: 6, title: "Business Networking", level: "Advanced", duration: "20 min" }
  ];
  
  return (
    <div className="container mx-auto max-w-7xl page-transition">
      {/* Hero Section */}
      <div className="hero min-h-[50vh] rounded-box hero-gradient backdrop-blur-sm mb-8 overflow-hidden">
        <div className="hero-content flex-col lg:flex-row-reverse gap-8">
          <img 
            src="https://placehold.co/600x400?text=Speaking+Practice" 
            className="max-w-sm rounded-lg shadow-2xl object-cover" 
            alt="Speaking Practice" 
          />
          <div className="text-left">
            <h1 className="text-5xl font-bold mb-2">
              Welcome back, <span className="text-primary">{username}</span>!
            </h1>
            <p className="py-6 text-lg opacity-90">Ready to improve your speaking skills? Structured practice with instant feedback.</p>
            <div className="flex flex-wrap gap-4">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/practice')}
              >
                Start Practice
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button 
                className="btn btn-outline btn-primary"
                onClick={() => navigate('/progress')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 100 2h10a1 1 0 100-2H3z" clipRule="evenodd" />
                </svg>
                View Progress
              </button>
            </div>
            <div className="mt-6">
              <div className="w-full bg-base-200 rounded-full h-4 shadow-inner overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full animate-pulse" 
                  style={{ width: '60%' }}
                ></div>
              </div>
              <p className="text-sm mt-2 opacity-75">4 of 7 days completed this week</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Practice Option */}
      <h2 className="text-3xl font-bold mb-6 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        Speaking Exam Practice
      </h2>
      <div className="card bg-base-100 shadow-xl border-t-4 border-primary hover:shadow-2xl transition-all mb-12">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row items-start gap-4">
            <div className="text-4xl p-4 bg-primary bg-opacity-10 inline-block rounded-xl mb-4">{practiceOption.icon}</div>
            <div className="flex-1">
              <h2 className="card-title text-2xl">{practiceOption.title}</h2>
              <p className="opacity-75 mt-2">{practiceOption.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <div className="badge badge-outline">Introduction Questions</div>
                <div className="badge badge-outline">Long-form Speaking</div>
                <div className="badge badge-outline">Discussion Topics</div>
                <div className="badge badge-outline">Real-time Feedback</div>
              </div>
              <div className="mt-6">
                <h3 className="font-semibold mb-2">How it works:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm opacity-75">
                  <li>Answer introduction questions about yourself</li>
                  <li>Speak for 1-2 minutes on assigned topics</li>
                  <li>Engage in follow-up discussions</li>
                  <li>Get instant feedback on pronunciation, grammar, and fluency</li>
                  <li>Track your progress over time</li>
                </ol>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                className="btn btn-primary btn-lg"
                onClick={() => navigate(practiceOption.path)}
              >
                Start Practice
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => navigate('/practice?tab=report')}
              >
                View past results
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Topic Recommendations */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-3xl font-bold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-secondary" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            Practice Topics
          </h2>
          <div className="tabs tabs-boxed p-1 bg-base-200 rounded-full">
            <a 
              className={`tab transition-all px-6 ${activeTab === 'popular' ? 'tab-active' : ''}`} 
              onClick={() => setActiveTab('popular')}
            >
              Popular
            </a>
            <a 
              className={`tab transition-all px-6 ${activeTab === 'recommended' ? 'tab-active' : ''}`} 
              onClick={() => setActiveTab('recommended')}
            >
              Recommended
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(activeTab === 'popular' ? popularTopics : recommendedTopics).map(topic => (
            <div key={topic.id} className="card bg-base-100 shadow-xl hover:shadow-lg transition-all">
              <div className="card-body">
                <h2 className="card-title">
                  {topic.title}
                  <div className={`badge ${
                    topic.level === 'Beginner' ? 'badge-success' : 
                    topic.level === 'Intermediate' ? 'badge-warning' : 'badge-error'
                  } badge-outline`}>
                    {topic.level}
                  </div>
                </h2>
                <div className="flex justify-between items-center mt-4">
                  <div className="badge badge-neutral gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {topic.duration}
                  </div>
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => navigate(`/practice?topic=${topic.id}`)}
                  >
                    Practice
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Stats */}
      <h2 className="text-3xl font-bold mb-6 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-accent" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
        Your Progress
      </h2>
      <div className="stats stats-vertical lg:stats-horizontal shadow w-full mb-12 rounded-2xl">
        <div className="stat">
          <div className="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
          </div>
          <div className="stat-title">Total Sessions</div>
          <div className="stat-value text-primary">25</div>
          <div className="stat-desc flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-success" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            21% more than last month
          </div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <div className="stat-title">Grammar Accuracy</div>
          <div className="stat-value text-secondary">86%</div>
          <div className="stat-desc flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-success" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            14% improved
          </div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-accent">
            <div className="avatar online">
              <div className="w-16 rounded-full ring ring-accent ring-offset-2 ring-offset-base-100">
                <img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" alt={username} />
              </div>
            </div>
          </div>
          <div className="stat-value">7 days</div>
          <div className="stat-title">Current Streak</div>
          <div className="stat-desc text-accent">Keep it going!</div>
        </div>
      </div>

      {/* Focus Areas Section */}
      <div className="bg-base-200 p-6 rounded-2xl mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Areas to Focus On
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-base-100">
            <div className="card-body p-4">
              <h3 className="card-title text-sm">Pronunciation</h3>
              <p className="text-xl font-bold text-error">"Th" sounds</p>
              <p className="text-sm opacity-75">Practice "thin" vs "tin" distinction</p>
            </div>
          </div>
          <div className="card bg-base-100">
            <div className="card-body p-4">
              <h3 className="card-title text-sm">Grammar</h3>
              <p className="text-xl font-bold text-warning">Past tense verbs</p>
              <p className="text-sm opacity-75">Focus on irregular verb forms</p>
            </div>
          </div>
          <div className="card bg-base-100">
            <div className="card-body p-4">
              <h3 className="card-title text-sm">Fluency</h3>
              <p className="text-xl font-bold text-success">Fewer "umm" pauses</p>
              <p className="text-sm opacity-75">Try transition phrases instead</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;