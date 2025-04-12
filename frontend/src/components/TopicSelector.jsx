import React, { useState } from 'react';

const TopicSelector = ({ onTopicSelect }) => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  // Sample topics with difficulty levels
  const topics = [
    { id: 1, title: "Introducing Yourself", level: "Beginner", 
      description: "Practice basic greetings and personal introductions." },
    { id: 2, title: "Ordering at a Restaurant", level: "Beginner", 
      description: "Learn how to order food and drinks at restaurants." },
    { id: 3, title: "Asking for Directions", level: "Beginner", 
      description: "Practice asking for and understanding directions." },
    { id: 4, title: "Job Interview", level: "Intermediate", 
      description: "Prepare for common job interview questions and responses." },
    { id: 5, title: "Making Small Talk", level: "Intermediate", 
      description: "Learn the art of casual conversation in various settings." },
    { id: 6, title: "Business Negotiations", level: "Advanced", 
      description: "Practice vocabulary and phrases for business deals." },
    { id: 7, title: "Academic Discussions", level: "Advanced", 
      description: "Engage in debates and discussions on academic topics." },
  ];

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic.id);
    if (onTopicSelect) {
      onTopicSelect(topic);
    }
  };

  // Function to get badge color based on difficulty level
  const getLevelBadgeClass = (level) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'badge-success';
      case 'intermediate': return 'badge-warning';
      case 'advanced': return 'badge-error';
      default: return 'badge-info';
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Choose a Conversation Topic</h2>
        <div className="divider"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className={`card cursor-pointer transition-all hover:shadow-lg ${
                selectedTopic === topic.id 
                  ? 'bg-primary text-primary-content' 
                  : 'bg-base-200 hover:bg-base-300'
              }`}
              onClick={() => handleTopicClick(topic)}
            >
              <div className="card-body p-4">
                <div className="flex justify-between items-start">
                  <h3 className="card-title text-lg">{topic.title}</h3>
                  <div className={`badge ${getLevelBadgeClass(topic.level)}`}>
                    {topic.level}
                  </div>
                </div>
                <p className="text-sm">{topic.description}</p>
                
                {selectedTopic === topic.id && (
                  <div className="mt-2">
                    <span className="badge badge-outline">Selected</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopicSelector;