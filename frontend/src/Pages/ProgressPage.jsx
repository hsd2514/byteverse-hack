import React, { useState, useEffect } from 'react';

const ProgressPage = ({ username }) => {
  const [progressData, setProgressData] = useState({
    grammarAccuracy: [78, 80, 85, 82, 86, 90],
    pronunciationScores: [65, 68, 72, 75, 78, 82],
    vocabularyGrowth: [120, 150, 220, 300, 380, 420],
    sessionsCompleted: [1, 3, 5, 8, 10, 12]
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-primary">Your Progress</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grammar Progress Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-primary">Grammar Accuracy</h2>
            <div className="flex items-center justify-between">
              <div className="stats">
                <div className="stat">
                  <div className="stat-title">Current Score</div>
                  <div className="stat-value">{progressData.grammarAccuracy[progressData.grammarAccuracy.length - 1]}%</div>
                  <div className="stat-desc">↗︎ {progressData.grammarAccuracy[progressData.grammarAccuracy.length - 1] - progressData.grammarAccuracy[progressData.grammarAccuracy.length - 2]}%</div>
                </div>
              </div>
              <div className="radial-progress text-primary" style={{ "--value": progressData.grammarAccuracy[progressData.grammarAccuracy.length - 1] }}>
                {progressData.grammarAccuracy[progressData.grammarAccuracy.length - 1]}%
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full h-4 bg-base-200 rounded-full">
                {progressData.grammarAccuracy.map((score, index) => (
                  <div 
                    key={index}
                    className="h-4 bg-primary rounded-l-full" 
                    style={{ 
                      width: `${score}%`,
                      opacity: 0.3 + (index * 0.12)
                    }} 
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs mt-1 opacity-70">
                <span>Last Month</span>
                <span>Now</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pronunciation Progress Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-secondary">Pronunciation Score</h2>
            <div className="flex items-center justify-between">
              <div className="stats">
                <div className="stat">
                  <div className="stat-title">Current Score</div>
                  <div className="stat-value">{progressData.pronunciationScores[progressData.pronunciationScores.length - 1]}%</div>
                  <div className="stat-desc">↗︎ {progressData.pronunciationScores[progressData.pronunciationScores.length - 1] - progressData.pronunciationScores[progressData.pronunciationScores.length - 2]}%</div>
                </div>
              </div>
              <div className="radial-progress text-secondary" style={{ "--value": progressData.pronunciationScores[progressData.pronunciationScores.length - 1] }}>
                {progressData.pronunciationScores[progressData.pronunciationScores.length - 1]}%
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full h-4 bg-base-200 rounded-full">
                {progressData.pronunciationScores.map((score, index) => (
                  <div 
                    key={index}
                    className="h-4 bg-secondary rounded-l-full" 
                    style={{ 
                      width: `${score}%`,
                      opacity: 0.3 + (index * 0.12)
                    }} 
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs mt-1 opacity-70">
                <span>Last Month</span>
                <span>Now</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Vocabulary Growth Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-accent">Vocabulary Growth</h2>
            <div className="stats">
              <div className="stat">
                <div className="stat-title">Words Learned</div>
                <div className="stat-value">{progressData.vocabularyGrowth[progressData.vocabularyGrowth.length - 1]}</div>
                <div className="stat-desc">↗︎ {progressData.vocabularyGrowth[progressData.vocabularyGrowth.length - 1] - progressData.vocabularyGrowth[progressData.vocabularyGrowth.length - 2]} new words</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-end h-32 gap-1">
                {progressData.vocabularyGrowth.map((words, index) => (
                  <div 
                    key={index}
                    className="bg-accent rounded-t-lg w-full" 
                    style={{ 
                      height: `${(words / Math.max(...progressData.vocabularyGrowth)) * 100}%`,
                      opacity: 0.5 + (index * 0.1)
                    }} 
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs mt-1 opacity-70">
                <span>Last Month</span>
                <span>Now</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Practice Sessions Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-primary">Practice Sessions</h2>
            <div className="stats">
              <div className="stat">
                <div className="stat-title">Sessions Completed</div>
                <div className="stat-value">{progressData.sessionsCompleted[progressData.sessionsCompleted.length - 1]}</div>
                <div className="stat-desc">↗︎ {progressData.sessionsCompleted[progressData.sessionsCompleted.length - 1] - progressData.sessionsCompleted[progressData.sessionsCompleted.length - 2]} sessions</div>
              </div>
            </div>
            <div className="overflow-x-auto mt-4">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Topic</th>
                    <th>Duration</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>April 12, 2025</td>
                    <td>Ordering at a Restaurant</td>
                    <td>15 min</td>
                    <td>90%</td>
                  </tr>
                  <tr>
                    <td>April 10, 2025</td>
                    <td>Weather and Seasons</td>
                    <td>12 min</td>
                    <td>85%</td>
                  </tr>
                  <tr>
                    <td>April 8, 2025</td>
                    <td>Travel Planning</td>
                    <td>18 min</td>
                    <td>88%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <h3 className="text-xl font-bold mb-4">Keep up the good work, {username}!</h3>
        <p className="mb-4">You've been making steady progress. Continue practicing regularly to improve faster.</p>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.href = '/practice'}
        >
          Continue Practice
        </button>
      </div>
    </div>
  );
};

export default ProgressPage;