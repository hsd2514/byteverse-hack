import React, { useState, useEffect } from 'react';
import VoiceInput from '../components/VoiceInput';
import ChatInterface from '../components/ChatInterface';
import GrammarFeedback from '../components/GrammarFeedback';
import PronunciationFeedback from '../components/PronunciationFeedback';
import TopicSelector from '../components/TopicSelector';
import { useNavigate, useLocation } from 'react-router-dom';

const API_URL = 'http://localhost:8000'; // Base URL for backend API

const PracticePage = () => {
  const [activeTab, setActiveTab] = useState('intro');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [highlightedTranscript, setHighlightedTranscript] = useState(null);
  const [corrections, setCorrections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionFeedback, setSessionFeedback] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get tab from URL if available
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['intro', 'cuecard', 'discussion', 'pronunciation', 'grammar', 'report'].includes(tab)) {
      setActiveTab(tab);
    }

    // Get topic from URL if available
    const topicId = params.get('topic');
    if (topicId) {
      // Mock topic data - in a real app, you'd fetch this from an API
      const mockTopic = {
        id: parseInt(topicId),
        title: ["Travel Conversations", "Ordering Food", "Job Interviews", 
               "Weather Small Talk", "Shopping Experience", "Business Networking"][parseInt(topicId) - 1],
        level: ["Intermediate", "Beginner", "Advanced", 
                "Beginner", "Intermediate", "Advanced"][parseInt(topicId) - 1]
      };
      setSelectedTopic(mockTopic);
    }
  }, [location]);

  // Timer effect for cue card practice
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timer < 120) { // 2 minute timer
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    } else if (timer >= 120) {
      setIsTimerRunning(false);
      // Auto-generate feedback when time's up
      generateSessionFeedback();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Update URL with tab parameter, keeping other params
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    navigate(`/practice?${params.toString()}`, { replace: true });
    // Reset certain states when changing tabs
    setTranscript('');
    setHighlightedTranscript(null);
    setCorrections([]);
    setTimer(0);
    setIsTimerRunning(false);
    setSessionFeedback(null);
  };

  // Highlight speech issues in the transcript
  // Added useRegex flag for pronunciation highlighting
  const highlightSpeechIssues = (text, issues, useRegex = false) => {
    if (!text || !issues || issues.length === 0) {
      return text;
    }
    
    let highlightedText = text;
    // Sort issues by start index descending to avoid index shifts during replacement
    const sortedIssues = issues.sort((a, b) => (b.start ?? Infinity) - (a.start ?? Infinity));
    
    for (const issue of sortedIssues) {
      const { start, end, type, suggestion, pattern } = issue;
      const highlightClass = 
        type === 'grammar' ? 'bg-warning text-warning-content' :
        type === 'pronunciation' ? 'bg-error text-error-content' :
        type === 'fluency' ? 'bg-info text-info-content' : 
        'bg-accent text-accent-content';
      
      if (useRegex && pattern) {
        // Handle regex patterns (e.g., for pronunciation word highlighting)
        const regex = new RegExp(pattern, 'gi'); // Use global and case-insensitive flags
        highlightedText = highlightedText.replace(regex, (match) => 
          `<span class="${highlightClass} px-1 rounded cursor-help tooltip" data-tip="${suggestion || 'Issue detected'}">${match}</span>`
        );
      } else if (start !== undefined && end !== undefined) {
        // Handle start/end indices (e.g., for grammar)
        const original = highlightedText.substring(start, end);
        const highlighted = `<span class="${highlightClass} px-1 rounded cursor-help tooltip" data-tip="${suggestion || 'Issue detected'}">${original}</span>`;
        
        // Replace the segment in the text
        highlightedText = 
          highlightedText.substring(0, start) + 
          highlighted + 
          highlightedText.substring(end);
      }
    }
    
    return highlightedText;
  };

  // Updated to accept data object from VoiceInput
  const handleTranscriptionReceived = async (data) => {
    const transcript = data.text;
    setTranscript(transcript);
    setIsLoading(true); // Keep loading while processing feedback
    
    try {
      if (activeTab === 'grammar') {
        await checkGrammar(transcript); // Assumes checkGrammar updates highlightedTranscript and corrections
      } else if (activeTab === 'pronunciation') {
        // Use pronunciation analysis data if available
        if (data.pronunciation_analysis) {
          const analysis = data.pronunciation_analysis;
          setPronunciationFeedback({
            score: analysis.overall_score || 0,
            feedback: analysis.word_scores || []
          });
          
          // Generate highlighted transcript based on pronunciation issues
          const pronunciationIssuesForHighlight = analysis.word_scores
            ?.filter(word => word.score < 80) // Example threshold for highlighting
            .map(word => ({
              pattern: `\\b${word.word.replace(/[^a-zA-Z0-9]/g, '')}\\b`, // Basic word boundary match, remove punctuation
              type: 'pronunciation',
              suggestion: word.phoneme_analysis?.map(p => `${p.phoneme}: ${p.issue}`).join('\n') || `Score: ${word.score}/100`
            })) || [];
          setHighlightedTranscript(highlightSpeechIssues(transcript, pronunciationIssuesForHighlight, true)); // Pass true for regex
          
        } else {
          // Handle case where pronunciation analysis failed or wasn't requested
          console.warn("Pronunciation analysis data not found.");
          setPronunciationFeedback(null); // Clear previous feedback
          setHighlightedTranscript(transcript); // Show plain transcript
          // Optionally show an error message to the user
        }
      } else {
        // For other tabs (intro, cuecard, discussion)
        // TODO: Replace mock feedback generation with calls to appropriate backend endpoints if available
        const mockIssues = generateMockSpeechIssues(transcript);
        setHighlightedTranscript(highlightSpeechIssues(transcript, mockIssues));
        
        // Clear previous feedback and generate new mock feedback
        setSessionFeedback(null);
        generateSessionFeedback(); // This is still the mock feedback generator
      }
    } catch (error) {
      console.error("Error processing transcription feedback:", error);
      setHighlightedTranscript(transcript); // Show plain transcript on error
      // Optionally show an error message to the user
    } finally {
      setIsLoading(false); // Stop loading indicator
    }
  };

  // Generate mock issues for demonstration (Keep for tabs without real feedback yet)
  const generateMockSpeechIssues = (text) => {
    // ... existing generateMockSpeechIssues code ...
    const issues = [];
    
    // Common grammar mistakes to detect
    const grammarPatterns = [
      { pattern: /\b(me|him|her|them|us) (is|are|am|was|were)\b/i, type: 'grammar', suggestion: 'Subject-verb agreement: Use "I am", "he/she is", "they are", etc.' },
      { pattern: /\b(go|goes) to school yesterday\b/i, type: 'grammar', suggestion: 'Use the past tense: "went to school yesterday"' },
      { pattern: /\bmore (good|bad)\b/i, type: 'grammar', suggestion: 'Use comparative forms: "better" or "worse"' },
    ];
    
    // Common pronunciation words (mock)
    const pronunciationWords = [
      { word: 'three', type: 'pronunciation', suggestion: 'Practice the "th" sound.' },
      { word: 'world', type: 'pronunciation', suggestion: 'Focus on the "rl" sound combination.' },
    ];

    // Common fluency issues (mock)
    const fluencyPatterns = [
      { pattern: /\b(um|uh|like|you know)\b/gi, type: 'fluency', suggestion: 'Try to reduce filler words.' },
      { pattern: /(\w+\s+)\1{2,}/gi, type: 'fluency', suggestion: 'Avoid repeating words.' }, // Detects word repetition
    ];

    // Add grammar issues based on patterns
    grammarPatterns.forEach(({ pattern, type, suggestion }) => {
      const matches = [...text.matchAll(new RegExp(pattern, 'gi'))];
      matches.forEach(match => {
        issues.push({
          start: match.index,
          end: match.index + match[0].length,
          type,
          suggestion
        });
      });
    });

    // Add pronunciation issues based on specific words (simple matching)
    pronunciationWords.forEach(({ word, type, suggestion }) => {
      const pattern = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        // Avoid adding duplicate highlights for the same word type
        if (!issues.some(i => i.start === match.index && i.type === type)) {
          issues.push({
            start: match.index,
            end: match.index + match[0].length,
            type,
            suggestion
          });
        }
      });
    });
    
    // Check for fluency issues
    fluencyPatterns.forEach(({ pattern, type, suggestion }) => {
      const matches = [...text.matchAll(pattern)]; // Regex already has 'gi'
      matches.forEach(match => {
        issues.push({
          start: match.index,
          end: match.index + match[0].length,
          type,
          suggestion
        });
      });
    });
    
    return issues;
  };

  const checkGrammar = async (text) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/grammar/correct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: text,
          strict_mode: true // Or make this configurable
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Grammar check failed with status ' + response.status }));
        throw new Error(errorData.detail || 'Grammar check failed');
      }
      
      const data = await response.json();
      setCorrections(data.corrections || []); // Ensure corrections is always an array
      
      // Create highlighted transcript based on grammar corrections
      const grammarIssues = (data.corrections || []).map(correction => ({
        start: correction.start,
        end: correction.end,
        type: 'grammar',
        suggestion: correction.suggestion
      }));
      
      setHighlightedTranscript(highlightSpeechIssues(text, grammarIssues));
      
    } catch (error) {
      console.error('Error checking grammar:', error);
      // On error, maybe show plain text or mock issues
      const mockIssues = generateMockSpeechIssues(text); // Fallback to mock issues on error
      setHighlightedTranscript(highlightSpeechIssues(text, mockIssues));
      setCorrections([]); // Clear previous corrections
      // Optionally show an error message to the user
    } finally {
      // setIsLoading(false); // Loading is stopped in handleTranscriptionReceived
    }
  };

  const generateSessionFeedback = () => {
    // In a real app, this would call the backend for AI-generated feedback
    setIsLoading(true);
    setTimeout(() => {
      setSessionFeedback({
        grammarScore: Math.floor(Math.random() * 30) + 70,
        pronunciationScore: Math.floor(Math.random() * 20) + 75,
        fluencyScore: Math.floor(Math.random() * 25) + 70,
        vocabularyScore: Math.floor(Math.random() * 25) + 65,
        suggestions: [
          "Try using more connecting phrases between ideas",
          "Work on reducing hesitation markers like 'um' and 'uh'",
          "Consider using a wider range of tenses in your responses",
          "Your intonation on questions needs improvement"
        ],
        strengths: [
          "Good use of topic-specific vocabulary",
          "Clear organization of ideas",
          "Natural rhythm in most sentences"
        ]
      });
      setIsLoading(false);
    }, 1500);
  };

  const startCueCardTimer = () => {
    setIsTimerRunning(true);
    setTimer(0);
  };

  const [pronunciationFeedback, setPronunciationFeedback] = useState(null);

  const tabInfo = {
    intro: {
      icon: "👋",
      title: "Introduction & Interview",
      description: "Answer friendly questions about yourself, your hobbies and daily life"
    },
    cuecard: {
      icon: "🗣️",
      title: "Long Turn (Cue Card)",
      description: "Speak for 1-2 minutes about a given topic with preparation time"
    },
    discussion: {
      icon: "💬",
      title: "Discussion",
      description: "Engage in a deeper conversation about abstract topics related to your cue card"
    },
    pronunciation: {
      icon: "🎙️",
      title: "Pronunciation Drills",
      description: "Practice specific sounds and receive detailed pronunciation feedback"
    },
    grammar: {
      icon: "📝",
      title: "Grammar Challenges",
      description: "Identify and fix grammar mistakes in spoken sentences"
    },
    report: {
      icon: "📊",
      title: "Feedback & Report",
      description: "Review your performance and get personalized improvement suggestions"
    }
  };

  // Mock cue card topics
  const cueCardTopics = [
    {
      title: "Describe a memorable trip",
      prompts: [
        "Where you went",
        "What you did",
        "Why it was memorable",
        "How you felt about it"
      ]
    },
    {
      title: "Describe a skill you would like to learn",
      prompts: [
        "What the skill is",
        "How you would learn it",
        "Why you want to learn it",
        "How it would be useful to you"
      ]
    },
    {
      title: "Describe a person who has influenced you",
      prompts: [
        "Who this person is",
        "How you know them",
        "What qualities they have",
        "Why they influenced you"
      ]
    }
  ];

  // Mock introduction questions
  const introQuestions = [
    "Can you tell me your name and where you're from?",
    "What do you do for work or study?",
    "Do you prefer living in the city or countryside? Why?",
    "What kind of hobbies or interests do you have?",
    "How often do you practice speaking English?"
  ];

  // Mock discussion questions (more abstract/opinion-based)
  const discussionQuestions = [
    "Do you think technology has improved communication between people?",
    "How important is it for people to learn about other cultures?",
    "In what ways has social media changed how people interact?",
    "Do you believe traditional education systems prepare students for the modern workplace?",
    "How has transportation changed the way people travel compared to the past?"
  ];

  // Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Random selection helper
  const getRandomItem = (array) => {
    return array[Math.floor(Math.random() * array.length)];
  };

  // Current selected items
  const [currentCueCard, setCurrentCueCard] = useState(getRandomItem(cueCardTopics));
  const [currentQuestion, setCurrentQuestion] = useState(getRandomItem(introQuestions));
  const [currentDiscussionQuestion, setCurrentDiscussionQuestion] = useState(getRandomItem(discussionQuestions));

  // Legend component for speech issues
  const SpeechIssuesLegend = () => (
    <div className="flex flex-wrap gap-2 mt-2 text-xs">
      <span className="bg-warning text-warning-content px-1 rounded">Grammar</span>
      <span className="bg-error text-error-content px-1 rounded">Pronunciation</span>
      <span className="bg-info text-info-content px-1 rounded">Fluency</span>
      <span className="text-sm ml-2">Hover over highlighted words for suggestions</span>
    </div>
  );

  return (
    <div className="container mx-auto max-w-7xl">
      {/* Header area with topic selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Speaking Practice</h1>
          <p className="text-base-content/70 mt-1">Improve your English speaking skills through structured practice</p>
        </div>
        <TopicSelector onSelectTopic={setSelectedTopic} selectedTopic={selectedTopic} />
      </div>

      {/* Practice mode selection */}
      <div className="tabs tabs-boxed mb-6 inline-block">
        {Object.keys(tabInfo).map(tab => (
          <a 
            key={tab}
            className={`tab gap-2 ${activeTab === tab ? 'tab-active' : ''}`} 
            onClick={() => handleTabChange(tab)}
          >
            <span>{tabInfo[tab].icon}</span>
            {tabInfo[tab].title}
          </a>
        ))}
      </div>

      {/* Description for the current tab */}
      <div className="alert mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>{tabInfo[activeTab].description}</span>
      </div>

      {/* Main content area */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Introduction & Interview Section */}
          {activeTab === 'intro' && (
            <div className="flex flex-col h-[65vh]">
              <div className="flex-1 overflow-y-auto mb-4 bg-base-200 p-4 rounded-lg">
                <div className="chat chat-start">
                  <div className="chat-bubble chat-bubble-primary">
                    <strong>AI Examiner:</strong> {currentQuestion}
                  </div>
                </div>
                
                {transcript && (
                  <div className="chat chat-end mt-4">
                    <div className="chat-bubble relative">
                      {highlightedTranscript ? (
                        <div dangerouslySetInnerHTML={{ __html: highlightedTranscript }} />
                      ) : (
                        transcript
                      )}
                    </div>
                  </div>
                )}
                
                {highlightedTranscript && <SpeechIssuesLegend />}
                
                {sessionFeedback && (
                  <div className="mt-4 p-4 bg-base-300 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">Quick Feedback</h3>
                    <div className="flex justify-between mb-2">
                      <span>Grammar: {sessionFeedback.grammarScore}/100</span>
                      <progress className="progress progress-primary w-56" value={sessionFeedback.grammarScore} max="100"></progress>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Pronunciation: {sessionFeedback.pronunciationScore}/100</span>
                      <progress className="progress progress-accent w-56" value={sessionFeedback.pronunciationScore} max="100"></progress>
                    </div>
                    {sessionFeedback.suggestions.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Tip: {sessionFeedback.suggestions[0]}</p>
                      </div>
                    )}
                    <button 
                      className="btn btn-sm btn-outline mt-2"
                      onClick={() => {
                        setCurrentQuestion(getRandomItem(introQuestions));
                        setTranscript('');
                        setHighlightedTranscript(null);
                        setSessionFeedback(null);
                      }}
                    >
                      Try Another Question
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mt-auto pt-4 border-t border-base-300">
                <div className="flex gap-2 items-center mb-4">
                  <div className="badge badge-lg badge-primary">{tabInfo.intro.icon}</div>
                  <span>Respond to the question naturally as you would in a real conversation</span>
                </div>
                <VoiceInput 
                  onTranscriptionReceived={handleTranscriptionReceived} 
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  apiUrl={API_URL}
                  practiceType="introduction"
                  // maxRecordingTime={120} // Example: Allow longer recording for intro
                />
              </div>
            </div>
          )}
          
          {/* Cue Card (Long Turn) Section */}
          {activeTab === 'cuecard' && (
            <div className="flex flex-col h-[65vh]">
              <div className="flex-1 overflow-y-auto mb-4 bg-base-200 p-4 rounded-lg">
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/30 mb-4">
                  <h3 className="font-bold text-lg mb-2">{currentCueCard.title}</h3>
                  <p className="text-base-content/70 mb-2">You should talk about:</p>
                  <ul className="list-disc pl-5 mb-4">
                    {currentCueCard.prompts.map((prompt, index) => (
                      <li key={index} className="mb-1">{prompt}</li>
                    ))}
                  </ul>
                  <p className="text-sm italic">You will have up to 2 minutes to speak.</p>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-mono">{formatTime(timer)}</span>
                    {isTimerRunning ? (
                      <div className="badge badge-accent">Recording</div>
                    ) : (
                      <div className="badge badge-outline">Ready</div>
                    )}
                  </div>
                  <button
                    className={`btn ${isTimerRunning ? 'btn-error' : 'btn-success'}`}
                    onClick={isTimerRunning ? () => setIsTimerRunning(false) : startCueCardTimer}
                  >
                    {isTimerRunning ? 'Stop' : 'Start Speaking'}
                  </button>
                </div>
                
                {transcript && (
                  <div className="mt-4 p-3 bg-base-300 rounded-lg">
                    <h4 className="font-semibold mb-1">Your Response:</h4>
                    {highlightedTranscript ? (
                      <div dangerouslySetInnerHTML={{ __html: highlightedTranscript }} />
                    ) : (
                      <p>{transcript}</p>
                    )}
                    
                    {highlightedTranscript && <SpeechIssuesLegend />}
                  </div>
                )}
                
                {sessionFeedback && (
                  <div className="mt-4 p-4 bg-base-300 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">Your Performance</h3>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="flex justify-between mb-2">
                        <span>Fluency: {sessionFeedback.fluencyScore}/100</span>
                        <progress className="progress progress-success w-36" value={sessionFeedback.fluencyScore} max="100"></progress>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>Grammar: {sessionFeedback.grammarScore}/100</span>
                        <progress className="progress progress-primary w-36" value={sessionFeedback.grammarScore} max="100"></progress>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>Vocabulary: {sessionFeedback.vocabularyScore}/100</span>
                        <progress className="progress progress-warning w-36" value={sessionFeedback.vocabularyScore} max="100"></progress>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>Pronunciation: {sessionFeedback.pronunciationScore}/100</span>
                        <progress className="progress progress-accent w-36" value={sessionFeedback.pronunciationScore} max="100"></progress>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-semibold mb-1">Strengths:</h4>
                      <ul className="list-disc pl-5">
                        {sessionFeedback.strengths.map((item, index) => (
                          <li key={index} className="mb-1">{item}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-1">Areas for Improvement:</h4>
                      <ul className="list-disc pl-5">
                        {sessionFeedback.suggestions.map((item, index) => (
                          <li key={index} className="mb-1">{item}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <button 
                      className="btn btn-sm btn-outline mt-4"
                      onClick={() => {
                        setCurrentCueCard(getRandomItem(cueCardTopics));
                        setTimer(0);
                        setTranscript('');
                        setHighlightedTranscript(null);
                        setSessionFeedback(null);
                      }}
                    >
                      Try Another Topic
                    </button>
                  </div>
                )}
              </div>
              
              {!isTimerRunning && !sessionFeedback && (
                <div className="mt-auto pt-4 border-t border-base-300">
                  <div className="flex gap-2 items-center mb-4">
                    <div className="badge badge-lg badge-secondary">{tabInfo.cuecard.icon}</div>
                    <span>Press Start Speaking when you're ready to begin your response</span>
                  </div>
                  <VoiceInput 
                    onTranscriptionReceived={handleTranscriptionReceived} 
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    apiUrl={API_URL}
                    // disabled={!isTimerRunning} // Logic might need adjustment if recording starts/stops VoiceInput
                    practiceType="cue_card"
                    maxRecordingTime={120} // Cue cards often have 1-2 min speaking time
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Discussion Section */}
          {activeTab === 'discussion' && (
            <div className="flex flex-col h-[65vh]">
              <div className="flex-1 overflow-y-auto mb-4 bg-base-200 p-4 rounded-lg">
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/30 mb-4">
                  <h3 className="font-bold text-lg mb-2">{currentDiscussionQuestion}</h3>
                </div>
                
                {transcript && (
                  <div className="chat chat-end mt-4">
                    <div className="chat-bubble relative">
                      {highlightedTranscript ? (
                        <div dangerouslySetInnerHTML={{ __html: highlightedTranscript }} />
                      ) : (
                        <p>{transcript}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {highlightedTranscript && <SpeechIssuesLegend />}
                
                {sessionFeedback && (
                  <div className="mt-4 p-4 bg-base-300 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">Discussion Feedback</h3>
                    <div className="flex justify-between mb-2">
                      <span>Critical Thinking: {Math.floor(Math.random() * 15) + 80}/100</span>
                      <progress className="progress progress-secondary w-56" value={Math.floor(Math.random() * 15) + 80} max="100"></progress>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Vocabulary Range: {sessionFeedback.vocabularyScore}/100</span>
                      <progress className="progress progress-warning w-56" value={sessionFeedback.vocabularyScore} max="100"></progress>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Grammar: {sessionFeedback.grammarScore}/100</span>
                      <progress className="progress progress-primary w-56" value={sessionFeedback.grammarScore} max="100"></progress>
                    </div>
                    
                    {sessionFeedback.suggestions.length > 0 && (
                      <div className="mt-3">
                        <p className="font-semibold">Tip: {sessionFeedback.suggestions[0]}</p>
                      </div>
                    )}
                    
                    <button 
                      className="btn btn-sm btn-outline mt-3"
                      onClick={() => {
                        setCurrentDiscussionQuestion(getRandomItem(discussionQuestions));
                        setTranscript('');
                        setHighlightedTranscript(null);
                        setSessionFeedback(null);
                      }}
                    >
                      Next Question
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mt-auto pt-4 border-t border-base-300">
                <div className="flex gap-2 items-center mb-4">
                  <div className="badge badge-lg badge-secondary">{tabInfo.discussion.icon}</div>
                  <span>Respond to the discussion question with your opinion and reasoning</span>
                </div>
                <VoiceInput 
                  onTranscriptionReceived={handleTranscriptionReceived} 
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  apiUrl={API_URL}
                  practiceType="discussion"
                />
              </div>
            </div>
          )}
          
          {/* Pronunciation Drills Section */}
          {activeTab === 'pronunciation' && (
            <> {/* Add opening fragment tag */}
              <div className="flex flex-col h-[65vh]">
                <div className="flex-1 overflow-y-auto mb-4 bg-base-200 p-4 rounded-lg">
                  <div className="bg-accent/10 p-4 rounded-lg border border-accent/30 mb-4">
                    <h3 className="font-bold text-lg mb-2">Pronunciation Challenge</h3>
                    <p className="mb-4">Please repeat the following phrase clearly:</p>
                    <div className="text-xl font-medium bg-base-100 p-3 rounded text-center">
                      "The quick brown fox jumps over the lazy dog."
                    </div>
                  </div>
                  
                  {transcript && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-1">Your Response:</h4>
                      <div className="bg-base-300 p-3 rounded-lg">
                        {highlightedTranscript ? (
                          <div dangerouslySetInnerHTML={{ __html: highlightedTranscript }} />
                        ) : (
                          transcript
                        )}
                      </div>
                      
                      {highlightedTranscript && <SpeechIssuesLegend />}
                    </div>
                  )}
                  
                  {pronunciationFeedback && (
                    <div className="mt-4 p-4 bg-base-300 rounded-lg">
                      <h3 className="font-bold text-lg mb-2">Pronunciation Analysis</h3>
                      <div className="flex justify-between items-center mb-4">
                        <span>Overall Score:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xl">{pronunciationFeedback.score}/100</span>
                          <progress className="progress progress-accent w-32" value={pronunciationFeedback.score} max="100"></progress>
                        </div>
                      </div>
                      
                      <h4 className="font-semibold mb-2">Word-by-Word Feedback:</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {pronunciationFeedback.feedback.map((item, index) => (
                          <div key={index} className="flex flex-col p-2 bg-base-200 rounded">
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">{item.word}</span>
                              <div className="badge badge-sm" style={{
                                backgroundColor: item.score > 80 ? '#22c55e' : item.score > 60 ? '#f59e0b' : '#ef4444',
                                color: 'white'
                              }}>{item.score}/100</div>
                            </div>
                            <p className="text-sm">{item.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-auto pt-4 border-t border-base-300">
                  <div className="flex gap-2 items-center mb-4">
                    <div className="badge badge-lg badge-accent">{tabInfo.pronunciation.icon}</div>
                    <span>Record yourself pronouncing the phrase above</span>
                  </div>
                  <VoiceInput 
                    onTranscriptionReceived={handleTranscriptionReceived}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    apiUrl={API_URL}
                  />
                </div>
              </div>
            </>
          )}
          
          {/* Grammar Challenges Section */}
          {activeTab === 'grammar' && (
            <div className="flex flex-col h-[65vh]">
              <div className="flex-1 overflow-y-auto mb-4 bg-base-200 p-4 rounded-lg">
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/30 mb-4">
                  <h3 className="font-bold text-lg mb-2">Grammar Correction</h3>
                  <p className="mb-4">Correct this sentence:</p>
                  <div className="text-xl font-medium bg-base-100 p-3 rounded text-center">
                    "She go to school yesterday."
                  </div>
                </div>
                
                {transcript && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-1">Your Response:</h4>
                    <div className="bg-base-300 p-3 rounded-lg">
                      {highlightedTranscript ? (
                        <div dangerouslySetInnerHTML={{ __html: highlightedTranscript }} />
                      ) : (
                        transcript
                      )}
                    </div>
                    
                    {highlightedTranscript && <SpeechIssuesLegend />}
                  </div>
                )}
                
                {corrections && corrections.length > 0 && (
                  <div className="mt-4 p-4 bg-base-300 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">Grammar Corrections</h3>
                    <div className="overflow-x-auto">
                      <table className="table w-full">
                        <thead>
                          <tr>
                            <th>Original</th>
                            <th>Suggestion</th>
                            <th>Explanation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {corrections.map((correction, index) => (
                            <tr key={index}>
                              <td className="text-error">{correction.original}</td>
                              <td className="text-success">{correction.suggestion}</td>
                              <td>{correction.explanation || "Grammar correction"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-auto pt-4 border-t border-base-300">
                <div className="flex gap-2 items-center mb-4">
                  <div className="badge badge-lg badge-primary">{tabInfo.grammar.icon}</div>
                  <span>Speak the corrected version of the sentence</span>
                </div>
                <VoiceInput 
                  onTranscriptionReceived={handleTranscriptionReceived} 
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  apiUrl={API_URL}
                />
              </div>
            </div>
          )}
          
          {/* Feedback & Report Card Section */}
          {activeTab === 'report' && (
            <div className="flex flex-col h-[65vh] overflow-y-auto">
              <div className="bg-base-200 p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Your Speaking Performance Report</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-base-100 p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-lg mb-3">Language Skills</h3>
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Grammar Accuracy</span>
                          <span className="font-bold">77/100</span>
                        </div>
                        <progress className="progress progress-primary w-full" value="77" max="100"></progress>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Vocabulary Range</span>
                          <span className="font-bold">82/100</span>
                        </div>
                        <progress className="progress progress-warning w-full" value="82" max="100"></progress>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Pronunciation</span>
                          <span className="font-bold">68/100</span>
                        </div>
                        <progress className="progress progress-accent w-full" value="68" max="100"></progress>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Fluency & Coherence</span>
                          <span className="font-bold">75/100</span>
                        </div>
                        <progress className="progress progress-success w-full" value="75" max="100"></progress>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-base-100 p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-lg mb-3">Overall Rating</h3>
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <span className="text-5xl font-bold text-primary">6.5</span>
                        <p className="text-sm mt-2">Estimated Speaking Score</p>
                        <p className="text-xs text-base-content/70 mt-1">Based on your recent practice sessions</p>
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <div className="badge badge-outline">Competent User</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-base-100 p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-lg mb-3">Strengths</h3>
                    <ul className="list-disc pl-5">
                      <li className="mb-2">Good use of topic-specific vocabulary</li>
                      <li className="mb-2">Effective organization of ideas</li>
                      <li className="mb-2">Natural rhythm in most sentences</li>
                      <li className="mb-2">Clear responses to direct questions</li>
                    </ul>
                  </div>
                  
                  <div className="bg-base-100 p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-lg mb-3">Areas for Improvement</h3>
                    <ul className="list-disc pl-5">
                      <li className="mb-2">Work on reducing hesitation markers</li>
                      <li className="mb-2">Practice using more complex sentence structures</li>
                      <li className="mb-2">Focus on clearer pronunciation of consonant clusters</li>
                      <li className="mb-2">Expand vocabulary for abstract discussions</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-base-100 p-4 rounded-lg shadow-sm mb-6">
                  <h3 className="font-bold text-lg mb-3">Recent Practice Activity</h3>
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Practice Type</th>
                          <th>Topic</th>
                          <th>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Today</td>
                          <td>Cue Card</td>
                          <td>Memorable Trip</td>
                          <td>78/100</td>
                        </tr>
                        <tr>
                          <td>Yesterday</td>
                          <td>Discussion</td>
                          <td>Technology</td>
                          <td>82/100</td>
                        </tr>
                        <tr>
                          <td>3 days ago</td>
                          <td>Introduction</td>
                          <td>Personal Info</td>
                          <td>75/100</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="bg-base-100 p-4 rounded-lg shadow-sm">
                  <h3 className="font-bold text-lg mb-3">Personalized Learning Plan</h3>
                  <div className="mb-3">
                    <p className="font-medium mb-1">Recommendation 1:</p>
                    <p>Practice more with Discussion topics to improve critical thinking and complex vocabulary usage.</p>
                  </div>
                  <div className="mb-3">
                    <p className="font-medium mb-1">Recommendation 2:</p>
                    <p>Focus on pronunciation drills for sounds like 'th', 'r', and final consonants.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Recommendation 3:</p>
                    <p>Practice using more linking words and connective phrases to improve flow.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer actions */}
      <div className="flex justify-between mt-8">
        <button 
          className="btn btn-outline"
          onClick={() => navigate('/')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/progress')}
        >
          View Your Progress
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19l7-7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PracticePage;