import React, { useState, useEffect, useRef } from 'react'; // Added useEffect, useRef
import VoiceInput from './VoiceInput';

const ChatInterface = ({ topic, apiUrl }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const messagesEndRef = useRef(null); // Ref for scrolling

  // Scroll to bottom effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to add a message to the state
  const addMessage = (text, sender) => {
    const newMessage = {
      id: Date.now() + Math.random(), // Ensure unique ID
      text,
      sender,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
  };

  const handleSendMessage = async (textToSend = inputText) => { // Allow passing text directly (e.g., from voice)
    const trimmedText = textToSend.trim();
    if (trimmedText === '') return;
    
    addMessage(trimmedText, 'user');
    setInputText(''); // Clear input field
    setIsProcessing(true);
    
    // Prepare message history for the API
    const messageHistory = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    // Add the new user message to the history being sent
    messageHistory.push({ role: 'user', content: trimmedText });

    try {
      // --- API Call ---
      const response = await fetch(`${apiUrl}/conversation/chat`, { // Assuming this is the endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messageHistory,
          // Optionally include topic context if needed by the backend
          // topic: topic ? { title: topic.title, level: topic.level } : null, 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to get response from AI' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add AI response to chat
      if (data.response) {
        addMessage(data.response, 'ai');
      } else {
        throw new Error("No response text found in API data");
      }
      // --- End API Call ---

    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to chat
      addMessage(`Sorry, I encountered an error: ${error.message}. Please try again.`, 'ai');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle transcription received from VoiceInput
  const handleVoiceInput = (data) => {
    if (data && data.text) {
      setInputText(data.text); // Populate input field
      handleSendMessage(data.text); // Directly send the transcribed text
    } else {
      console.warn("Received empty or invalid transcription data:", data);
      // Optionally inform the user
    }
  };

  const ChatMessage = ({ message }) => (
    // ... existing ChatMessage component ...
    <div className={`chat ${message.sender === 'user' ? 'chat-end' : 'chat-start'}`}>
      <div className="chat-image avatar">
        <div className="w-10 rounded-full">
          <img 
            src={message.sender === 'user' ? 'https://i.pravatar.cc/100?img=32' : 'https://placehold.co/100x100/7E57C2/FFFFFF?text=AI'} // Changed AI avatar color
            alt={message.sender === 'user' ? 'User Avatar' : 'AI Tutor'} 
          />
        </div>
      </div>
      <div className="chat-header">
        {message.sender === 'user' ? 'You' : 'AI Tutor'}
        <time className="text-xs opacity-50 ml-2">{message.timestamp}</time>
      </div>
      <div className={`chat-bubble ${message.sender === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'}`}> {/* Changed AI bubble color */}
        {message.text}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Topic info */}
      {topic && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="badge badge-primary">Topic</div>
            <h3 className="font-bold">{topic.title}</h3>
          </div>
          <div className={`badge ${
            topic.level === 'Beginner' ? 'badge-success' :
            topic.level === 'Intermediate' ? 'badge-warning' : 'badge-error'
          }`}>
            {topic.level}
          </div>
        </div>
      )}
      
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-2">Start a conversation</h3>
            <p className="text-sm max-w-md">
              {topic 
                ? `Ask questions about "${topic.title}" or start a conversation on this topic.` 
                : "Choose a topic or start an open conversation with the AI language tutor."}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        
        {isProcessing && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="w-10 rounded-full">
                <img src="https://placehold.co/100x100/7E57C2/FFFFFF?text=AI" alt="AI Avatar" />
              </div>
            </div>
            <div className="chat-bubble chat-bubble-secondary">
              <span className="loading loading-dots loading-md"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} /> {/* Anchor for scrolling */}
      </div>
      
      {/* Input area */}
      <div className="mt-auto border-t border-base-300 pt-4">
        <div className="join w-full">
          <VoiceInput 
            onTranscriptionReceived={handleVoiceInput} // Use updated handler
            isLoading={isVoiceLoading}
            setIsLoading={setIsVoiceLoading}
            apiUrl={apiUrl}
            // Add practiceType if relevant for chat context
            // practiceType="conversation" 
          />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleSendMessage()} // Prevent sending while processing
            placeholder={isProcessing ? "AI is thinking..." : "Type your message or use voice..."}
            className="input input-bordered join-item flex-1"
            disabled={isProcessing} // Disable input while processing
          />
          <button 
            onClick={() => handleSendMessage()} // Use default inputText
            className="btn btn-primary join-item"
            disabled={inputText.trim() === '' || isProcessing} // Disable if empty or processing
          >
            {isProcessing ? <span className="loading loading-spinner loading-sm"></span> : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;