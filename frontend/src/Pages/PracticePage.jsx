import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import VoiceInput from '../components/VoiceInput';
// Import chart.js properly
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  RadialLinearScale,
  ArcElement 
} from 'chart.js';
import { Bar, Line, Radar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  RadialLinearScale,
  ArcElement, 
  Title, 
  Tooltip, 
  Legend
);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  const [pronunciationFeedback, setPronunciationFeedback] = useState(null);
  const [sessionFeedback, setSessionFeedback] = useState(null); // Initialize sessionFeedback state properly
  const [aiQuestions, setAiQuestions] = useState(null); // Add state for AI-generated questions
  const [feedbackLoading, setFeedbackLoading] = useState(false); // Add state for feedback loading
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get tab from URL if available
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['intro', 'cuecard', 'discussion', 'pronunciation', 'grammar'].includes(tab)) {
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
      // Removed auto-generation of feedback on timer end. Feedback is generated after recording stops.
      // generateSessionFeedback(); 
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  // Removed the manual generateSessionFeedback function as getAIFeedback will be used.
  // const generateSessionFeedback = () => { ... };

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
    setPronunciationFeedback(null); // Reset pronunciation feedback
    setSessionFeedback(null); // Reset session feedback
    setFeedbackLoading(false); // Reset feedback loading state
  };

  // Highlight speech issues in the transcript
  const highlightSpeechIssues = (text, issues) => {
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
      
      if (start !== undefined && end !== undefined && start < end && end <= highlightedText.length) {
        // Handle start/end indices (e.g., for grammar)
        // Ensure indices are valid
        const original = highlightedText.substring(start, end);
        const highlighted = `<span class="${highlightClass} px-1 rounded cursor-help tooltip" data-tip="${suggestion || 'Issue detected'}">${original}</span>`;
        
        // Replace the segment in the text
        highlightedText = 
          highlightedText.substring(0, start) + 
          highlighted + 
          highlightedText.substring(end);
      } else if (start !== undefined && end !== undefined) {
          console.warn(`Invalid indices for highlighting: start=${start}, end=${end}, textLength=${highlightedText.length}`);
      }
    }
    
    return highlightedText;
  };

  // Handle transcription data received from VoiceInput
  const handleTranscriptionReceived = async (data) => {
    if (!data || typeof data.text === 'undefined') {
      console.error("Received invalid data structure:", data);
      setTranscript("Error: Received invalid data.");
      setHighlightedTranscript("Error: Received invalid data.");
      setPronunciationFeedback({ error: "Received invalid data from server." });
      setIsLoading(false);
      return;
    }

    const newTranscript = data.text; // Use a different variable name to avoid confusion with state
    setTranscript(newTranscript);
    setIsLoading(true); // Keep loading while processing feedback display

    try {
      // Clear previous specific feedback
      setCorrections([]);
      setPronunciationFeedback(null);
      setSessionFeedback(null); // Clear previous session feedback first
      setHighlightedTranscript(newTranscript); // Start with plain transcript
      setFeedbackLoading(false); // Reset feedback loading

      // Store the pronunciation analysis received from the backend
      if (data.pronunciation_analysis) {
         if (data.pronunciation_analysis.error) {
            console.warn("Pronunciation analysis error:", data.pronunciation_analysis.error);
            setPronunciationFeedback({ error: data.pronunciation_analysis.error });
         } else {
            setPronunciationFeedback(data.pronunciation_analysis);
         }
      } else {
         // Don't set an error here if it's missing, might be generated later
         // setPronunciationFeedback({ error: "Pronunciation analysis data missing in response." });
      }

      let aiFeedbackPresent = false;
      // If AI feedback was provided directly from the voice input component
      if (data.ai_feedback && data.ai_feedback.success) {
        console.log("Received AI feedback with transcription:", data.ai_feedback);
        setSessionFeedback(data.ai_feedback); // Set the AI feedback directly
        aiFeedbackPresent = true;
      } else if (data.ai_feedback && !data.ai_feedback.success) {
        console.warn("AI feedback generation failed initially:", data.ai_feedback.error);
        // Set error feedback to display immediately
        setSessionFeedback({ error: data.ai_feedback.error });
        aiFeedbackPresent = true; // Treat as present to avoid re-fetching immediately
      }

      // Process grammar check if on grammar tab and AI feedback wasn't already successful
      if (activeTab === 'grammar' && !aiFeedbackPresent) {
        await checkGrammar(newTranscript); // This will update highlightedTranscript and corrections
      } else if (corrections.length > 0) { // Apply existing corrections if grammar check ran
         const grammarIssues = corrections.map(correction => ({
           start: correction.start,
           end: correction.end,
           type: 'grammar',
           suggestion: correction.suggestion
         }));
         setHighlightedTranscript(highlightSpeechIssues(newTranscript, grammarIssues));
      } else {
         // For other tabs or if no grammar check needed, just use plain transcript for now
         setHighlightedTranscript(newTranscript);
      }

      // If detailed AI feedback wasn't received with the transcription, fetch it now
      // unless we are on the report tab (where it's fetched on demand)
      if (!aiFeedbackPresent && activeTab !== 'report' && newTranscript) {
        await getAIFeedback(newTranscript); // Fetch detailed feedback
      }

    } catch (error) {
      console.error("Error processing transcription feedback:", error);
      setHighlightedTranscript(newTranscript); // Show plain transcript on error
      setPronunciationFeedback({ error: `Error processing feedback: ${error.message}` });
      setSessionFeedback({ error: `Error processing feedback: ${error.message}` }); // Show error in feedback area
    } finally {
      setIsLoading(false); // Stop loading indicator for transcription processing
      // Note: feedbackLoading might still be true if getAIFeedback was called
    }
  };

  // Check grammar using the backend endpoint
  const checkGrammar = async (text) => {
    // No change needed here, but ensure setIsLoading(false) is removed from its finally block
    // as the main loading state is handled by handleTranscriptionReceived
    // setIsLoading(true); // This might be redundant if handleTranscriptionReceived sets it
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
      const currentCorrections = data.corrections || [];
      setCorrections(currentCorrections); // Ensure corrections is always an array

      // Create highlighted transcript based on grammar corrections
      const grammarIssues = currentCorrections.map(correction => ({
        start: correction.start,
        end: correction.end,
        type: 'grammar',
        suggestion: correction.suggestion
      }));

      setHighlightedTranscript(highlightSpeechIssues(text, grammarIssues));

    } catch (error) {
      console.error('Error checking grammar:', error);
      setHighlightedTranscript(highlightSpeechIssues(text, [])); // Fallback to no highlights on error
      setCorrections([]); // Clear previous corrections
      // Optionally show an error message to the user in the feedback area
      setSessionFeedback(prev => ({ ...prev, grammar_error: error.message }));
    } finally {
      // setIsLoading(false); // Remove this - handled by caller
    }
  };


  // Get AI feedback from backend using Gemini
  const getAIFeedback = async (textToAnalyze = transcript) => { // Accept transcript as argument
    if (!textToAnalyze) return;
    // Removed check for existing sessionFeedback - let it refetch if called explicitly or needed
    // if (sessionFeedback && !sessionFeedback.error) { ... }

    setFeedbackLoading(true);
    // Ensure sessionFeedback is cleared before fetching new feedback unless merging
    // setSessionFeedback(null); // Clear previous feedback before fetching new one

    try {
      // Determine the current practice type based on active tab
      const practiceType = activeTab === 'intro' ? 'introduction' :
                          activeTab === 'cuecard' ? 'cue_card' :
                          activeTab === 'discussion' ? 'discussion' :
                          activeTab === 'pronunciation' ? 'pronunciation' :
                          activeTab === 'grammar' ? 'grammar' : 'general';

      // Construct the request payload with context
      const requestPayload = {
        practice_type: practiceType,
        text: textToAnalyze, // Use the provided text
        question: activeTab === 'intro' ? currentQuestion :
                activeTab === 'cuecard' ? currentCueCard.title :
                activeTab === 'discussion' ? currentDiscussionQuestion :
                activeTab === 'pronunciation' ? currentPronunciationChallenge :
                activeTab === 'grammar' ? currentGrammarChallenge : '',
        proficiency_level: "Intermediate" // Default level, ideally get this from user profile
      };

      // If we have grammar corrections, include them (use state directly)
      if (corrections && corrections.length > 0) {
        requestPayload.corrections = corrections;
      }

      // If we have pronunciation feedback, include it (use state directly)
      if (pronunciationFeedback && !pronunciationFeedback.error) {
        requestPayload.pronunciation_analysis = pronunciationFeedback;
      }

      // Call the backend AI analysis endpoint
      const response = await fetch(`${API_URL}/practice/session/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'AI feedback generation failed with status ' + response.status }));
        throw new Error(errorData.detail || 'Failed to generate feedback');
      }

      const data = await response.json();

      // Set the AI-generated feedback
      setSessionFeedback(data);

      // Removed navigation to report tab
      // handleTabChange('report');

    } catch (error) {
      console.error('Error getting AI feedback:', error);
      // Create a more robust feedback object with error information
      setSessionFeedback({
        error: `AI analysis failed: ${error.message}. Please try again.`,
        // Provide default/empty values for other fields to prevent crashes in rendering
        overall_score: null,
        grammar_score: null,
        pronunciation_score: null,
        fluency_score: null,
        vocabulary_score: null,
        strengths: [],
        areas_to_improve: ["AI analysis could not be completed."],
        suggested_exercises: ["Check your connection or try recording again."]
      });
      // Removed navigation to report tab
      // handleTabChange('report');
    } finally {
      setFeedbackLoading(false); // Ensure loading is always stopped
    }
  };

  // Generate comprehensive feedback button click handler (now primarily for report tab)
  const handleGenerateFeedback = () => {
    // If on report tab, fetch feedback if needed. Otherwise, just switch to report tab.
    if (activeTab === 'report') {
       if (!sessionFeedback || sessionFeedback.error) {
         getAIFeedback(); // Fetch new feedback if on report tab and needed
       }
    } else {
       handleTabChange('report'); // Switch to report tab
       // Optionally trigger feedback generation if needed after switching
       // setTimeout(() => { if (!sessionFeedback || sessionFeedback.error) getAIFeedback(); }, 100);
    }
  };

  const startCueCardTimer = () => {
    setIsTimerRunning(true);
    setTimer(0);
  };

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
    }
  };

  // Generate more practical dynamic question sets
  const generateQuestions = () => {
    // Introduction questions based on different contexts
    const introQuestionSets = [
      // Personal background
      [
        "Could you tell me your name and where you're from?",
        "How long have you been living in your current city/country?",
        "What do you do for work or study?",
        "Can you describe your hometown and what makes it special?"
      ],
      // Hobbies and interests
      [
        "What activities do you enjoy in your free time?",
        "How did you become interested in your hobbies?",
        "Do you prefer indoor or outdoor activities? Why?",
        "How often do you get to practice your favorite activities?"
      ],
      // Daily routine
      [
        "Could you describe a typical day in your life?",
        "How do you usually start your morning?",
        "What's your favorite time of day and why?",
        "How do you balance work/study with your personal life?"
      ],
      // Future plans
      [
        "What are your plans for the future?",
        "Where do you see yourself five years from now?",
        "Are you planning to pursue further education or career advancement?",
        "What personal goals would you like to achieve in the next few years?"
      ]
    ];

    // Cue Card topics with detailed prompts
    const cueCardTopicSets = [
      {
        title: "Describe a memorable trip",
        prompts: [
          "Where and when you went",
          "Who you went with",
          "What activities you did during the trip",
          "Why it was memorable for you",
          "How you felt about this experience"
        ]
      },
      {
        title: "Describe an important skill you learned",
        prompts: [
          "What the skill is",
          "When and where you learned it",
          "How you learned it",
          "Why you decided to learn this skill",
          "How this skill has been useful to you"
        ]
      },
      {
        title: "Describe a person who has influenced you positively",
        prompts: [
          "Who this person is and your relationship to them",
          "When you first met this person",
          "What qualities this person has that you admire",
          "How this person has influenced you",
          "Why their influence has been important in your life"
        ]
      },
      {
        title: "Describe a book or movie that made a strong impression on you",
        prompts: [
          "What the book/movie was about",
          "When and where you read/watched it",
          "What parts were most memorable",
          "How it affected your thoughts or feelings",
          "Why you would recommend it to others"
        ]
      },
      {
        title: "Describe a challenge you overcame",
        prompts: [
          "What the challenge was",
          "When and where you faced this challenge",
          "How you dealt with it",
          "What help you received (if any)",
          "What you learned from this experience"
        ]
      }
    ];

    // Discussion questions on contemporary topics
    const discussionQuestionSets = [
      // Technology and society
      [
        "How has technology changed the way we communicate with each other?",
        "Do you think social media has more positive or negative effects on society?",
        "Should there be more regulations on technology companies? Why or why not?",
        "How has technology affected education and learning?"
      ],
      // Environment and sustainability
      [
        "What do you think are the most effective ways to address climate change?",
        "Should individuals or governments take more responsibility for environmental issues?",
        "How can cities be designed to be more environmentally sustainable?",
        "Do you think economic growth and environmental protection can coexist?"
      ],
      // Education and learning
      [
        "How has the education system changed in your lifetime?",
        "What skills do you think will be most valuable in the future job market?",
        "Do you think online education can replace traditional classroom learning?",
        "How can educational systems better prepare students for real-world challenges?"
      ],
      // Health and wellbeing
      [
        "How has the concept of health and wellbeing evolved in recent years?",
        "What role should governments play in healthcare?",
        "How has the pandemic changed people's attitudes toward health?",
        "What measures do you think are most effective for maintaining good mental health?"
      ],
      // Culture and identity
      [
        "How important is it to preserve cultural traditions in a globalized world?",
        "How do you think technology has affected cultural identity?",
        "What aspects of your own culture do you find most meaningful?",
        "Do you think cultural exchange between countries has more benefits or drawbacks?"
      ]
    ];

    // Grammar challenge sentences
    const grammarChallengeSets = [
      // Past tense issues
      [
        "She go to school yesterday.",
        "They not finished the project last week.",
        "He don't called me back after the meeting.",
        "We was very tired after the long journey."
      ],
      // Subject-verb agreement
      [
        "The team are playing very well this season.",
        "Everyone have different opinions on this topic.",
        "The data shows interesting results.",
        "The number of students in the class increase every year."
      ],
      // Articles and determiners
      [
        "I bought car last month.",
        "She's university student.",
        "Please give me advice about my application.",
        "This is most beautiful city I have ever visited."
      ],
      // Prepositions
      [
        "I arrived at London yesterday.",
        "She's been working there since three years.",
        "We're waiting for the bus since 30 minutes.",
        "He's interested about science and technology."
      ]
    ];

    // Pronunciation challenge phrases
    const pronunciationChallengeSets = [
      // Minimal pairs
      [
        "The sheep is sleeping on the ship.",
        "Can you feel the heat on your feet?",
        "The bat flew past the bed.",
        "Don't slip on the wet slope."
      ],
      // Consonant clusters
      [
        "She strictly structured the strength training.",
        "The sixth sheikh's sixth sheep is sick.",
        "Fresh fried fly flesh.",
        "Truly rural pronunciation is particularly hard."
      ],
      // Intonation patterns
      [
        "Are you coming to the party tonight?",
        "Could you please pass the salt?",
        "What a beautiful day it is!",
        "You didn't tell me you were going to be late."
      ],
      // Word stress patterns
      [
        "The photograph was photographed by a photographer.",
        "I need to present my presentation to present my research.",
        "They will record the record at the recording studio.",
        "Could you elaborate on your elaboration of the subject?"
      ]
    ];

    return {
      introQuestions: introQuestionSets[Math.floor(Math.random() * introQuestionSets.length)],
      cueCardTopics: cueCardTopicSets,
      discussionQuestions: discussionQuestionSets[Math.floor(Math.random() * discussionQuestionSets.length)],
      grammarChallenges: grammarChallengeSets[Math.floor(Math.random() * grammarChallengeSets.length)],
      pronunciationChallenges: pronunciationChallengeSets[Math.floor(Math.random() * pronunciationChallengeSets.length)]
    };
  };

  // Dynamic questions and challenges
  const [dynamicContent, setDynamicContent] = useState(() => generateQuestions());
  
  // Function to refresh questions when needed
  const refreshQuestions = (section) => {
    const newDynamicContent = generateQuestions();
    setDynamicContent(newDynamicContent);
    
    // Update current selections based on section
    if (section === 'intro' || !section) {
      setCurrentQuestion(getRandomItem(newDynamicContent.introQuestions));
    }
    if (section === 'cuecard' || !section) {
      setCurrentCueCard(getRandomItem(newDynamicContent.cueCardTopics));
    }
    if (section === 'discussion' || !section) {
      setCurrentDiscussionQuestion(getRandomItem(newDynamicContent.discussionQuestions));
    }
    if (section === 'pronunciation' || !section) {
      setCurrentPronunciationChallenge(getRandomItem(newDynamicContent.pronunciationChallenges));
    }
    if (section === 'grammar' || !section) {
      setCurrentGrammarChallenge(getRandomItem(newDynamicContent.grammarChallenges));
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

  // Current selected items - updating to use dynamic content
  const [currentCueCard, setCurrentCueCard] = useState(() => 
    getRandomItem(dynamicContent?.cueCardTopics || cueCardTopics));
  const [currentQuestion, setCurrentQuestion] = useState(() => 
    getRandomItem(dynamicContent?.introQuestions || introQuestions));
  const [currentDiscussionQuestion, setCurrentDiscussionQuestion] = useState(() => 
    getRandomItem(dynamicContent?.discussionQuestions || discussionQuestions));
  const [currentPronunciationChallenge, setCurrentPronunciationChallenge] = useState(() => 
    getRandomItem(dynamicContent?.pronunciationChallenges || ["The quick brown fox jumps over the lazy dog."]));
  const [currentGrammarChallenge, setCurrentGrammarChallenge] = useState(() => 
    getRandomItem(dynamicContent?.grammarChallenges || ["She go to school yesterday."]));
    
  // Button to get new questions/challenges
  const getNewQuestion = (type) => {
    switch(type) {
      case 'intro':
        setCurrentQuestion(getRandomItem(dynamicContent.introQuestions));
        break;
      case 'cuecard':
        setCurrentCueCard(getRandomItem(dynamicContent.cueCardTopics));
        break;
      case 'discussion':
        setCurrentDiscussionQuestion(getRandomItem(dynamicContent.discussionQuestions));
        break;
      case 'pronunciation':
        setCurrentPronunciationChallenge(getRandomItem(dynamicContent.pronunciationChallenges));
        break;
      case 'grammar':
        setCurrentGrammarChallenge(getRandomItem(dynamicContent.grammarChallenges));
        break;
      default:
        // Refresh all
        refreshQuestions();
        break;
    }
    // Reset input/response states when changing questions
    setTranscript('');
    setHighlightedTranscript(null);
    setCorrections([]);
    setPronunciationFeedback(null);
    setSessionFeedback(null);
  };

  // Legend component for speech issues
  const SpeechIssuesLegend = () => (
    <div className="flex flex-wrap gap-2 mt-2 text-xs">
      <span className="bg-warning text-warning-content px-1 rounded">Grammar</span>
      {/* Add pronunciation legend if highlighting is implemented */}
      {/* <span className="bg-error text-error-content px-1 rounded">Pronunciation</span> */}
      {/* <span className="bg-info text-info-content px-1 rounded">Fluency</span> */}
    </div>
  );

  // Component to display summarized feedback within tabs
  const SummarizedFeedback = ({ feedback, loading }) => {
    if (loading) {
      return (
        <div className="mt-4 p-4 bg-base-300 rounded-lg flex items-center justify-center">
          <span className="loading loading-dots loading-md mr-2"></span> Generating Feedback...
        </div>
      );
    }

    if (!feedback) {
      return null; // Don't show anything if no feedback and not loading
    }

    if (feedback.error) {
      return (
        <div className="mt-4 alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>Feedback Error: {feedback.error}</span>
        </div>
      );
    }

    // Determine overall score, handling potential variations in feedback structure
    const overallScore = feedback.overall_score; // Expecting 1-9 scale
    const grammarScore = feedback.grammar_score; // Expecting 0-100 scale
    const vocabScore = feedback.vocabulary_score; // Expecting 0-100 scale
    const pronScore = feedback.pronunciation_score; // Expecting 0-100 scale
    const fluencyScore = feedback.fluency_score; // Expecting 0-100 scale

    return (
      <div className="mt-6 p-4 bg-base-300 rounded-lg space-y-4">
        <h3 className="font-bold text-lg">Feedback Summary</h3>

        {/* Scores Summary - Display scores out of 100 where applicable */}
        {(grammarScore !== null || vocabScore !== null || pronScore !== null || fluencyScore !== null) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
            {grammarScore !== null && <div className="stat bg-base-100 rounded p-2"><div className="stat-title text-xs">Grammar</div><div className="stat-value text-lg">{grammarScore}/100</div></div>}
            {vocabScore !== null && <div className="stat bg-base-100 rounded p-2"><div className="stat-title text-xs">Vocabulary</div><div className="stat-value text-lg">{vocabScore}/100</div></div>}
            {pronScore !== null && <div className="stat bg-base-100 rounded p-2"><div className="stat-title text-xs">Pronunciation</div><div className="stat-value text-lg">{pronScore}/100</div></div>}
            {fluencyScore !== null && <div className="stat bg-base-100 rounded p-2"><div className="stat-title text-xs">Fluency</div><div className="stat-value text-lg">{fluencyScore}/100</div></div>}
          </div>
        )}

        {/* Strengths */}
        {feedback.strengths && feedback.strengths.length > 0 && (
          <div>
            <h4 className="font-semibold mb-1 text-success">Strengths:</h4>
            <ul className="list-disc pl-5 text-sm">
              {feedback.strengths.slice(0, 2).map((strength, index) => ( // Show max 2
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas to Improve */}
        {feedback.areas_to_improve && feedback.areas_to_improve.length > 0 && (
          <div>
            <h4 className="font-semibold mb-1 text-warning">Areas to Improve:</h4>
            <ul className="list-disc pl-5 text-sm">
              {feedback.areas_to_improve.slice(0, 2).map((area, index) => ( // Show max 2
                <li key={index}>{area}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Exercises / Tips */}
        {feedback.suggested_exercises && feedback.suggested_exercises.length > 0 && (
          <div>
            <h4 className="font-semibold mb-1 text-info">Quick Tip:</h4>
            <p className="text-sm italic">{feedback.suggested_exercises[0]}</p>
          </div>
        )}


      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-7xl">
      {/* Header area without topic selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Speaking Practice</h1>
          <p className="text-base-content/70 mt-1">Improve your English speaking skills through structured practice</p>
        </div>
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
                        transcript // Show plain transcript if no highlighting
                      )}
                    </div>
                  </div>
                )}
                
                {/* Show legend only if there are highlights */}
                {highlightedTranscript && highlightedTranscript !== transcript && <SpeechIssuesLegend />}

                {/* Display Summarized Feedback */}
                <SummarizedFeedback feedback={sessionFeedback} loading={feedbackLoading} />

              </div>

              <div className="mt-auto pt-4 border-t border-base-300">
                 {/* ... voice input ... */}
                 <div className="flex gap-2 items-center mb-4">
                   <div className="badge badge-lg badge-primary">{tabInfo.intro.icon}</div>
                   <span>Respond to the question naturally as you would in a real conversation</span>
                 </div>
                 <VoiceInput
                   onTranscriptionReceived={handleTranscriptionReceived}
                   isLoading={isLoading || feedbackLoading} // Show loading if transcription or feedback is processing
                   setIsLoading={setIsLoading} // Still needed for VoiceInput internal state
                   apiUrl={API_URL}
                   practiceType="introduction"
                   question={currentQuestion}
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
                

                
                {transcript && (
                  <div className="mt-4 p-3 bg-base-300 rounded-lg">
                    <h4 className="font-semibold mb-1">Your Response:</h4>
                    {highlightedTranscript ? (
                      <div dangerouslySetInnerHTML={{ __html: highlightedTranscript }} />
                    ) : (
                      <p>{transcript}</p>
                    )}
                    {highlightedTranscript && highlightedTranscript !== transcript && <SpeechIssuesLegend />}
                  </div>
                )}

                {/* Display Summarized Feedback */}
                <SummarizedFeedback feedback={sessionFeedback} loading={feedbackLoading} />

              </div>

              {/* Conditionally render VoiceInput based on timer? Or always show? */}
              {/* Assuming VoiceInput handles its own start/stop based on external state if needed */}
              <div className="mt-auto pt-4 border-t border-base-300">
                 {/* ... voice input ... */}
                 <div className="flex gap-2 items-center mb-4">
                   <div className="badge badge-lg badge-secondary">{tabInfo.cuecard.icon}</div>
                   <span>Press Start Speaking when you're ready (timer starts automatically with recording)</span>
                 </div>
                 <VoiceInput
                   onTranscriptionReceived={handleTranscriptionReceived}
                   isLoading={isLoading || feedbackLoading}
                   setIsLoading={setIsLoading}
                   apiUrl={API_URL}
                   practiceType="cue_card"
                   question={currentCueCard.title} // Pass cue card title as context
                   maxRecordingTime={120}
                   // Consider adding props to sync with isTimerRunning if needed
                 />
              </div>
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
                {highlightedTranscript && highlightedTranscript !== transcript && <SpeechIssuesLegend />}

                {/* Display Summarized Feedback */}
                <SummarizedFeedback feedback={sessionFeedback} loading={feedbackLoading} />

              </div>

              <div className="mt-auto pt-4 border-t border-base-300">
                 {/* ... voice input ... */}
                 <div className="flex gap-2 items-center mb-4">
                   <div className="badge badge-lg badge-secondary">{tabInfo.discussion.icon}</div>
                   <span>Respond to the discussion question with your opinion and reasoning</span>
                 </div>
                 <VoiceInput
                   onTranscriptionReceived={handleTranscriptionReceived}
                   isLoading={isLoading || feedbackLoading}
                   setIsLoading={setIsLoading}
                   apiUrl={API_URL}
                   practiceType="discussion"
                   question={currentDiscussionQuestion}
                 />
              </div>
            </div>
          )}

          {/* Pronunciation Drills Section */}
          {activeTab === 'pronunciation' && (
            <>
              <div className="flex flex-col h-[65vh]">
                <div className="flex-1 overflow-y-auto mb-4 bg-base-200 p-4 rounded-lg">
                  <div className="bg-accent/10 p-4 rounded-lg border border-accent/30 mb-4">
                    <h3 className="font-bold text-lg mb-2">Pronunciation Challenge</h3>
                    <p className="mb-4">Please repeat the following phrase clearly:</p>
                    <div className="text-xl font-medium bg-base-100 p-3 rounded text-center">
                      "{currentPronunciationChallenge}"
                    </div>
                  </div>

                  {transcript && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-1">Your Response:</h4>
                      <div className="bg-base-300 p-3 rounded-lg">
                        {transcript}
                      </div>
                    </div>
                  )}

                  {/* Display Specific Pronunciation Feedback (if available) */}
                  {pronunciationFeedback && !pronunciationFeedback.error && (
                    <div className="mt-4 p-4 bg-base-300 rounded-lg">
                       {/* ... existing detailed pronunciation feedback display ... */}
                       <h3 className="font-bold text-lg mb-2">Pronunciation Analysis</h3>
                       {/* ... score, challenges, tips ... */}
                    </div>
                  )}
                  {pronunciationFeedback && pronunciationFeedback.error && (
                     <div className="mt-4 alert alert-warning">
                       <span>Pronunciation analysis error: {pronunciationFeedback.error}</span>
                     </div>
                  )}


                  {/* Display Summarized AI Feedback (might overlap with above, consider refining) */}
                  <SummarizedFeedback feedback={sessionFeedback} loading={feedbackLoading} />

                </div>

                <div className="mt-auto pt-4 border-t border-base-300">
                   {/* ... voice input ... */}
                   <div className="flex gap-2 items-center mb-4">
                     <div className="badge badge-lg badge-accent">{tabInfo.pronunciation.icon}</div>
                     <span>Record yourself pronouncing the phrase above</span>
                   </div>
                   <VoiceInput
                     onTranscriptionReceived={handleTranscriptionReceived}
                     isLoading={isLoading || feedbackLoading}
                     setIsLoading={setIsLoading}
                     apiUrl={API_URL}
                     practiceType="pronunciation"
                     question={currentPronunciationChallenge}
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
                    "{currentGrammarChallenge}"
                  </div>
                </div>

                {transcript && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-1">Your Spoken Correction Attempt:</h4>
                    <div className="bg-base-300 p-3 rounded-lg">
                      {highlightedTranscript ? (
                        <div dangerouslySetInnerHTML={{ __html: highlightedTranscript }} />
                      ) : (
                        transcript
                      )}
                    </div>
                    {highlightedTranscript && highlightedTranscript !== transcript && <SpeechIssuesLegend />}
                  </div>
                )}

                {/* Display Grammar Corrections Table (if available) */}
                {corrections && corrections.length > 0 && (
                  <div className="mt-4 p-4 bg-base-300 rounded-lg">
                    {/* ... existing corrections table ... */}
                    <h3 className="font-bold text-lg mb-2">Grammar Analysis of Your Attempt</h3>
                    {/* ... table ... */}
                  </div>
                )}

                {/* Display Summarized AI Feedback */}
                <SummarizedFeedback feedback={sessionFeedback} loading={feedbackLoading} />

              </div>

              <div className="mt-auto pt-4 border-t border-base-300">
                 {/* ... voice input ... */}
                 <div className="flex gap-2 items-center mb-4">
                   <div className="badge badge-lg badge-primary">{tabInfo.grammar.icon}</div>
                   <span>Speak the corrected version of the sentence</span>
                 </div>
                 <VoiceInput
                   onTranscriptionReceived={handleTranscriptionReceived}
                   isLoading={isLoading || feedbackLoading}
                   setIsLoading={setIsLoading}
                   apiUrl={API_URL}
                   practiceType="grammar"
                   question={currentGrammarChallenge}
                 />
              </div>
            </div>
          )}


          {/* Feedback & Report Card Section (Full Report) */}
          {activeTab === 'report' && (
            <div className="flex flex-col h-[65vh] overflow-y-auto">
              <div className="bg-base-200 p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Your Speaking Performance Report</h2>

                {/* Add button to generate feedback if missing */}
                 {!transcript && (
                   <div className="alert">
                     <span>Please record speech in another tab first to generate a report.</span>
                   </div>
                 )}
                 {transcript && !sessionFeedback && !feedbackLoading && (
                   <div className="flex justify-center my-6">
                     <button
                       className="btn btn-primary"
                       onClick={handleGenerateFeedback} // Uses the updated handler
                       disabled={feedbackLoading}
                     >
                       Generate Full Report
                     </button>
                   </div>
                 )}

                {/* Loading state for AI feedback generation */}
                {feedbackLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="loading loading-spinner loading-lg text-primary"></div>
                    <p className="mt-4">Analyzing your speech using AI...</p>
                  </div>
                ) : sessionFeedback && sessionFeedback.error ? ( // Display error if feedback generation failed
                  <div className="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Error generating AI feedback: {sessionFeedback.error}. Please try again.</span>
                  </div>
                ) : !transcript ? ( // Show message if no transcript exists yet
                  <div className="alert">
                    <span>Please record your speech first to get feedback.</span>
                  </div>
                ) : !sessionFeedback ? ( // Show message if feedback hasn't been loaded/generated yet
                  <div className="alert alert-info">
                    <span>Generating feedback or click the button below...</span>
                  </div>
                ) : ( // Display the feedback if available and no error
                  <>
                    {/* Speech Transcript Section - Show what the person actually said */}
                    {transcript && (
                      <div className="bg-base-100 p-4 rounded-lg shadow-sm mb-6">
                        <h3 className="font-bold text-lg mb-2">Your Speech Sample</h3>
                        <div className="bg-base-200 p-3 rounded-lg italic">
                          "{transcript}"
                        </div>
                      </div>
                    )}
                    
                    {/* Different visualizations based on session type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Left column - Performance Metrics */}
                      <div className="bg-base-100 p-4 rounded-lg shadow-sm">
                        <h3 className="font-bold text-lg mb-3">Performance Metrics</h3>
                        
                        {/* Different chart visualizations based on practice type */}
                        {sessionFeedback?.practice_type === 'pronunciation' ? (
                          // Radar chart for pronunciation showing different aspects
                          <div className="h-64">
                            <Radar 
                              data={{
                                labels: ['Vowels', 'Consonants', 'Intonation', 'Stress', 'Fluency', 'Clarity'],
                                datasets: [
                                  {
                                    label: 'Your Score',
                                    // Use specific scores if available, otherwise fallback or omit
                                    data: [
                                      sessionFeedback?.vowel_score ?? 70, // Example fallback
                                      sessionFeedback?.consonant_score ?? 75,
                                      sessionFeedback?.intonation_score ?? 65,
                                      sessionFeedback?.stress_score ?? 72,
                                      sessionFeedback?.fluency_score ?? 78, // Use general fluency score
                                      sessionFeedback?.pronunciation_score ?? 70 // Use overall pronunciation score for clarity
                                    ],
                                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                    borderColor: 'rgba(54, 162, 235, 1)',
                                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                                  }
                                ]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  r: {
                                    min: 0,
                                    max: 100,
                                    pointLabels: {
                                      font: {
                                        size: 12
                                      }
                                    }
                                  }
                                },
                                plugins: {
                                  legend: {
                                    display: false
                                  },
                                  tooltip: {
                                    callbacks: {
                                      label: function(context) {
                                        return context.raw + '/100';
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        ) : sessionFeedback?.practice_type === 'grammar' ? (
                          // Bar chart for grammar showing different aspects
                          <div className="h-64">
                            <Bar
                              data={{
                                labels: ['Verb Forms', 'Agreement', 'Articles', 'Prepositions', 'Word Order', 'Overall Grammar'],
                                datasets: [
                                  {
                                    label: 'Your Score',
                                    data: [
                                      sessionFeedback?.verb_forms_score ?? 0,
                                      sessionFeedback?.agreement_score ?? 0,
                                      sessionFeedback?.articles_score ?? 0,
                                      sessionFeedback?.prepositions_score ?? 0,
                                      sessionFeedback?.word_order_score ?? 0,
                                      sessionFeedback?.grammar_score ?? 0 // Overall grammar score
                                    ],
                                    backgroundColor: [
                                      'rgba(255, 99, 132, 0.6)',
                                      'rgba(54, 162, 235, 0.6)',
                                      'rgba(255, 206, 86, 0.6)',
                                      'rgba(75, 192, 192, 0.6)',
                                      'rgba(153, 102, 255, 0.6)'
                                    ],
                                    borderWidth: 1
                                  }
                                ]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    max: 100
                                  }
                                },
                                plugins: {
                                  legend: {
                                    display: false
                                  }
                                }
                              }}
                            />
                          </div>
                        ) : (
                          // Doughnut chart for general speaking aspects
                          <div className="h-64">
                            <Doughnut
                              data={{
                                labels: ['Grammar', 'Vocabulary', 'Pronunciation', 'Fluency'],
                                datasets: [
                                  {
                                    data: [
                                      sessionFeedback?.grammar_score ?? 0,
                                      sessionFeedback?.vocabulary_score ?? 0,
                                      sessionFeedback?.pronunciation_score ?? 0, // Use the 0-100 score
                                      sessionFeedback?.fluency_score ?? 0
                                    ],
                                    backgroundColor: [
                                      'rgba(255, 99, 132, 0.6)',
                                      'rgba(54, 162, 235, 0.6)',
                                      'rgba(255, 206, 86, 0.6)',
                                      'rgba(75, 192, 192, 0.6)'
                                    ],
                                    borderWidth: 1
                                  }
                                ]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'bottom'
                                  },
                                  tooltip: {
                                    callbacks: {
                                      label: function(context) {
                                        return context.label + ': ' + context.raw + '/100';
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Word count and other analytics */}
                        {transcript && (
                          <div className="stats stats-vertical lg:stats-horizontal shadow mt-4 w-full">
                            <div className="stat">
                              <div className="stat-title">Words Spoken</div>
                              <div className="stat-value text-lg">{transcript.split(/\s+/).filter(Boolean).length}</div>
                            </div>
                            {/* Add other stats like WPM if available */}
                            {sessionFeedback?.words_per_minute && (
                              <div className="stat">
                                <div className="stat-title">Words/Min</div>
                                <div className="stat-value text-lg">{Math.round(sessionFeedback.words_per_minute)}</div>
                              </div>
                            )}
                            {sessionFeedback?.practice_type === 'grammar' && corrections && (
                              <div className="stat">
                                <div className="stat-title">Grammar Issues</div>
                                <div className="stat-value text-lg">{corrections?.length || 0}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Right column - Overall Assessment */}
                      <div className="bg-base-100 p-4 rounded-lg shadow-sm">
                        <h3 className="font-bold text-lg mb-3">Overall Assessment</h3>
                        
                        {sessionFeedback?.overall_score !== null ? (
                          // Display radial progress based on the 1-9 overall score
                          <div className="flex items-center justify-center h-32 mb-4">
                            <div className="text-center">
                              {/* Convert 1-9 score to percentage for radial display */}
                              <div className="radial-progress text-primary" style={{"--value": ((sessionFeedback.overall_score / 9) * 100), "--size": "8rem", "--thickness": "0.8rem"}}>
                                <span className="text-4xl font-bold">{sessionFeedback.overall_score.toFixed(1)}</span>
                              </div>
                              <p className="text-sm mt-2">Estimated Speaking Score (1-9)</p>
                              <p className="text-xs text-base-content/70 mt-1">Based on your current response</p>
                            </div>
                          </div>
                        ) : (
                           <div className="alert alert-sm"><span>Overall score not available.</span></div>
                        )}

                        <div className="text-center mt-4">
                          <div className="badge badge-lg">
                            {sessionFeedback?.band_descriptor || 'Assessment Pending'}
                          </div>
                        </div>

                        {transcript && sessionFeedback?.overall_score !== null && (
                          <div className="mt-4 text-sm">
                            <p>Your response to <span className="font-medium">{
                              sessionFeedback?.question || (tabInfo[activeTab]?.title || "the prompt")
                            }</span> demonstrated {
                              sessionFeedback.overall_score >= 7 ? 'good' :
                              sessionFeedback.overall_score >= 6 ? 'competent' :
                              sessionFeedback.overall_score >= 5 ? 'modest' : 'limited'
                            } language skills.</p>
                          </div>
                        )}
                        
                        {/* AI-generated Next Step button */}
                        <div className="flex justify-center mt-6">
                          <button 
                            className="btn btn-primary"
                            onClick={() => getNewQuestion(activeTab)}
                          >
                            Try New Question
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Left column - Strengths */}
                      <div className="bg-base-100 p-4 rounded-lg shadow-sm">
                        <h3 className="font-bold text-lg mb-3">Strengths</h3>
                        {sessionFeedback?.strengths && sessionFeedback.strengths.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {sessionFeedback.strengths.map((strength, index) => (
                              <li key={index} className="mb-2">{strength}</li>
                            ))}
                          </ul>
                        ) : (
                          <div className="alert alert-sm">
                            <span>No specific strengths identified or analysis pending.</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Right column - Areas for Improvement */}
                      <div className="bg-base-100 p-4 rounded-lg shadow-sm">
                        <h3 className="font-bold text-lg mb-3">Areas for Improvement</h3>
                        {sessionFeedback?.areas_to_improve && sessionFeedback.areas_to_improve.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {sessionFeedback.areas_to_improve.map((area, index) => (
                              <li key={index} className="mb-2">{area}</li>
                            ))}
                          </ul>
                        ) : (
                          <div className="alert alert-sm">
                            <span>No specific areas for improvement identified or analysis pending.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detailed Feedback: Punctuation & Sentence Structure */}
                    {(sessionFeedback?.punctuation_feedback || sessionFeedback?.sentence_structure_feedback) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {sessionFeedback?.punctuation_feedback && (
                          <div className="bg-base-100 p-4 rounded-lg shadow-sm">
                            <h3 className="font-bold text-lg mb-3">Punctuation Feedback</h3>
                            <p className="text-sm">{sessionFeedback.punctuation_feedback}</p>
                          </div>
                        )}
                        {sessionFeedback?.sentence_structure_feedback && (
                          <div className="bg-base-100 p-4 rounded-lg shadow-sm">
                            <h3 className="font-bold text-lg mb-3">Sentence Structure Feedback</h3>
                            <p className="text-sm">{sessionFeedback.sentence_structure_feedback}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Detailed Feedback based on practice type */}
                    <div className="bg-base-100 p-4 rounded-lg shadow-sm mb-6">
                      <h3 className="font-bold text-lg mb-3">Detailed Analysis</h3>
                      {/* Pronunciation Details */}
                      {sessionFeedback?.practice_type === 'pronunciation' && pronunciationFeedback && !pronunciationFeedback.error ? (
                        <div>
                          <h4 className="font-semibold mb-1">Pronunciation Details</h4>
                          {/* Consider embedding PronunciationFeedback component here or similar display */}
                          <ul className="list-disc pl-5">
                            {pronunciationFeedback.pronunciation_tips?.map((tip, index) => (
                              <li key={index} className="mb-1">{tip}</li>
                            )) || <li>Review words with lower scores.</li>}
                          </ul>
                        </div>
                      ) : sessionFeedback?.practice_type === 'grammar' && corrections && corrections.length > 0 ? (
                        <div>
                          <h4 className="font-semibold mb-1">Grammar Correction Details</h4>
                          {/* Consider embedding GrammarFeedback component here or similar display */}
                          <div className="overflow-x-auto">
                            <table className="table table-zebra w-full table-sm">
                              <thead>
                                <tr>
                                  <th>Incorrect</th>
                                  <th>Suggestion</th>
                                  <th>Reason (if available)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {corrections.map((correction, index) => (
                                  <tr key={index}>
                                    <td className="text-error">{transcript.substring(correction.start, correction.end)}</td>
                                    <td className="text-success">{correction.suggestion}</td>
                                    <td>{correction.explanation || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : sessionFeedback?.practice_type === 'discussion' || sessionFeedback?.practice_type === 'cue_card' || sessionFeedback?.practice_type === 'introduction' ? (
                        <div>
                          <h4 className="font-semibold mb-1">Content & Cohesion</h4>
                          {/* Display content/cohesion scores if available */}
                          {sessionFeedback?.content_score !== null && <p>Content Score: {sessionFeedback.content_score}/100</p>}
                          {sessionFeedback?.organization_score !== null && <p>Organization Score: {sessionFeedback.organization_score}/100</p>}
                          {sessionFeedback?.task_completion_score !== null && <p>Task Completion Score: {sessionFeedback.task_completion_score}/100</p>}
                          {sessionFeedback?.coherence_score !== null && <p>Coherence Score: {sessionFeedback.coherence_score}/100</p>}
                          {/* Add more relevant details if provided by backend */}
                          <p className="mt-2 text-sm italic">Focus on developing your ideas clearly and connecting them logically.</p>
                        </div>
                      ) : (
                        <div className="alert alert-sm">
                          <span>Detailed analysis specific to this practice type is not available.</span>
                        </div>
                      )}
                    </div>

                    {/* AI-generated tips and exercises */}
                    <div className="bg-base-100 p-4 rounded-lg shadow-sm">
                      <h3 className="font-bold text-lg mb-3">Recommended Exercises</h3>
                      {sessionFeedback?.suggested_exercises && sessionFeedback.suggested_exercises.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {sessionFeedback.suggested_exercises.map((exercise, index) => (
                            <li key={index} className="mb-2">{exercise}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="alert alert-sm">
                          <span>No specific exercises suggested or analysis pending.</span>
                        </div>
                      )}
                    </div>

                    {/* Get AI Feedback button - Show only if transcript exists and feedback hasn't been loaded/generated yet */}
                    {/* This button might be less necessary now feedback is generated automatically, but keep for manual refresh */}
                    {transcript && (!sessionFeedback || sessionFeedback.error) && (
                      <div className="flex justify-center mt-6">
                        <button
                          className="btn btn-primary"
                          onClick={handleGenerateFeedback}
                          disabled={feedbackLoading}
                        >
                          {feedbackLoading ? (
                            <>
                              <span className="loading loading-spinner loading-xs"></span>
                              Generating AI Feedback
                            </>
                          ) : (
                            <>
                              Refresh Detailed AI Feedback
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer actions */}
      <div className="flex justify-end mt-8"> {/* Changed from justify-between */}
        {/* Removed Back to Home button */}
        {/* Removed View Your Progress button */}
      </div>
    </div>
  );
};

export default PracticePage;