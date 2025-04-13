import React, { useState, useRef, useEffect } from 'react';

const QAAvatar = () => {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [messages, setMessages] = useState([
    { 
      type: 'assistant', 
      content: "Hello! I'm your AI language assistant. Ask me anything about language learning or practice!"
    }
  ]);
  const chatContainerRef = useRef(null);
  
  // Options for the avatar display
  const avatarOptions = [
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Dusty",
    "https://api.dicebear.com/7.x/personas/svg?seed=Cleo"
  ];
  
  // Randomly select an avatar
  const [avatarUrl] = useState(avatarOptions[Math.floor(Math.random() * avatarOptions.length)]);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) return;
    
    const userQuestion = question.trim();
    setQuestion('');
    setIsAsking(true);
    
    // Add user's question to messages
    setMessages(prev => [...prev, { type: 'user', content: userQuestion }]);
    
    try {
      // Here we'd normally call an actual API
      // For demonstration, we're using a mock response with a delay
      
      // Replace this with your preferred API call (e.g., OpenAI, Azure AI, or any other Q&A service)
      // const response = await fetch('https://your-qa-api-endpoint.com/query', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ question: userQuestion })
      // });
      // const data = await response.json();
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock responses based on keywords in the question
      let responseText = '';
      const lowerQuestion = userQuestion.toLowerCase();
      
      if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi')) {
        responseText = "Hi there! How can I help with your language learning today?";
      } else if (lowerQuestion.includes('learn') || lowerQuestion.includes('study')) {
        responseText = "The best way to learn a language is through consistent practice. I recommend 20-30 minutes daily of active speaking and listening!";
      } else if (lowerQuestion.includes('practice') || lowerQuestion.includes('exercise')) {
        responseText = "Try shadow speaking - repeat after native speakers in videos or podcasts. It's great for improving pronunciation and rhythm.";
      } else if (lowerQuestion.includes('grammar') || lowerQuestion.includes('rule')) {
        responseText = "Grammar is best learned in context. Instead of memorizing rules, try to notice patterns in authentic materials and practice using them yourself.";
      } else if (lowerQuestion.includes('vocabulary') || lowerQuestion.includes('words')) {
        responseText = "To remember vocabulary, use spaced repetition and try to learn words in context or in thematic groups rather than random lists.";
      } else {
        responseText = "That's a great question! Consistent practice and immersion are key to language mastery. Is there a specific aspect of language learning I can help with?";
      }
      
      // Add response to messages
      setMessages(prev => [...prev, { type: 'assistant', content: responseText }]);
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: "I'm sorry, I couldn't process your question. Please try again later."
      }]);
    } finally {
      setIsAsking(false);
    }
  };
  
  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex items-center mb-4">
        <div className="avatar">
          <div className="w-12 rounded-full">
            <img src={avatarUrl} alt="AI Assistant" />
          </div>
        </div>
        <div className="ml-4">
          <h3 className="font-bold">Language Assistant</h3>
          <div className="text-sm opacity-50">Online</div>
        </div>
      </div>
      
      {/* Chat messages container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mb-4 p-4 bg-base-200 rounded-box"
      >
        {messages.map((msg, index) => (
          <div key={index} className={`chat ${msg.type === 'user' ? 'chat-end' : 'chat-start'} mb-4`}>
            <div className="chat-image avatar">
              <div className="w-10 rounded-full">
                <img src={msg.type === 'user' ? "https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" : avatarUrl} />
              </div>
            </div>
            <div className={`chat-bubble ${msg.type === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isAsking && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="w-10 rounded-full">
                <img src={avatarUrl} />
              </div>
            </div>
            <div className="chat-bubble chat-bubble-secondary">
              <span className="loading loading-dots loading-sm"></span>
            </div>
          </div>
        )}
      </div>
      
      {/* Question input form */}
      <form onSubmit={handleSubmit} className="join w-full">
        <input 
          type="text" 
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask a language learning question..." 
          className="input input-bordered join-item w-full focus:outline-none" 
          disabled={isAsking}
        />
        <button 
          type="submit"
          className="btn btn-primary join-item"
          disabled={isAsking || !question.trim()}
        >
          {isAsking ? <span className="loading loading-spinner loading-sm"></span> : 'Ask'}
        </button>
      </form>
    </div>
  );
};

export default QAAvatar;