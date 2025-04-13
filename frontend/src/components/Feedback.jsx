import React, { useState, useEffect } from 'react';
import GrammarFeedback from './GrammarFeedback';
import PronunciationFeedback from './PronunciationFeedback';

const Feedback = ({ transcript, corrections, pronunciationScores, userId }) => {
  const [activeTab, setActiveTab] = useState('grammar');
  const [feedbackList, setFeedbackList] = useState([]);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch(`http://localhost:8000/feedback/${userId}`);
        const data = await response.json();
        if (data.success) {
          setFeedbackList(data.feedback.documents);
        } else {
          console.error(data.error);
        }
      } catch (error) {
        console.error('Error fetching feedback:', error);
      }
    };

    fetchFeedback();
  }, [userId]);
  
  return (
    <div className="card bg-base-100 shadow-xl mt-4">
      <div className="card-body">
        <h2 className="card-title">Language Feedback</h2>
        <div className="divider"></div>
        
        {transcript ? (
          <>
            <div role="tablist" className="tabs tabs-bordered">
              <a 
                role="tab" 
                className={`tab ${activeTab === 'grammar' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('grammar')}
              >
                Grammar & Usage
              </a>
              <a 
                role="tab" 
                className={`tab ${activeTab === 'pronunciation' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('pronunciation')}
              >
                Pronunciation
              </a>
            </div>
            
            <div className="mt-4">
              {activeTab === 'grammar' ? (
                <GrammarFeedback 
                  transcript={transcript} 
                  corrections={corrections} 
                />
              ) : (
                <PronunciationFeedback 
                  transcript={transcript} 
                  pronunciationScores={pronunciationScores}
                />
              )}
            </div>
          </>
        ) : (
          <div className="alert shadow-lg bg-base-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 className="font-bold">No feedback available</h3>
              <div className="text-xs">Start a conversation to receive language feedback</div>
            </div>
          </div>
        )}

        <div className="feedback-section mt-4">
          <h2>User Feedback</h2>
          {feedbackList.length > 0 ? (
            <ul>
              {feedbackList.map((item) => (
                <li key={item.$id}>{item.feedback}</li>
              ))}
            </ul>
          ) : (
            <p>No feedback available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feedback;