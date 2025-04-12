import React from 'react';

const PronunciationFeedback = ({ transcript, pronunciationScores }) => {
  // Mock pronunciation scores if not provided
  const mockScores = pronunciationScores || {
    overallScore: 72,
    words: [
      { word: "Hello", score: 90, confidence: 0.95 },
      { word: "this", score: 85, confidence: 0.92 },
      { word: "is", score: 95, confidence: 0.98 },
      { word: "a", score: 98, confidence: 0.99 },
      { word: "sample", score: 75, confidence: 0.85 },
      { word: "transcription", score: 65, confidence: 0.78 },
      { word: "of", score: 88, confidence: 0.91 },
      { word: "what", score: 80, confidence: 0.87 },
      { word: "the", score: 85, confidence: 0.90 },
      { word: "user", score: 78, confidence: 0.86 },
      { word: "said", score: 70, confidence: 0.81 },
      { word: "during", score: 68, confidence: 0.80 },
      { word: "the", score: 86, confidence: 0.91 },
      { word: "recording", score: 62, confidence: 0.77 },
    ]
  };

  // Function to get color class based on score
  const getScoreColor = (score) => {
    if (score >= 85) return "text-success";
    if (score >= 70) return "text-warning";
    return "text-error";
  };

  // Function to get progress bar color class based on score
  const getProgressColor = (score) => {
    if (score >= 85) return "progress-success";
    if (score >= 70) return "progress-warning";
    return "progress-error";
  };

  return (
    <div>
      <div className="bg-base-200 rounded-lg p-4">
        <h3 className="font-bold text-lg mb-2">Your Pronunciation:</h3>
        <p>{transcript}</p>
      </div>
      
      <div className="mt-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Overall Score:</h3>
          <div className={`text-2xl font-bold ${getScoreColor(mockScores.overallScore)}`}>
            {mockScores.overallScore}/100
          </div>
        </div>
        
        <progress 
          className={`progress w-full ${getProgressColor(mockScores.overallScore)}`} 
          value={mockScores.overallScore} 
          max="100"
        ></progress>
        
        <div className="divider">Word Breakdown</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockScores.words.map((item, index) => (
            <div key={index} className="card bg-base-200">
              <div className="card-body p-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{item.word}</span>
                  <div className={`badge ${getScoreColor(item.score)}`}>
                    {item.score}/100
                  </div>
                </div>
                <progress 
                  className={`progress ${getProgressColor(item.score)}`} 
                  value={item.score} 
                  max="100"
                ></progress>
                <div className="text-xs opacity-70">
                  Confidence: {Math.round(item.confidence * 100)}%
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="alert mt-4 bg-base-200">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 className="font-bold">Pronunciation Tips</h3>
            <div className="text-sm">
              Focus on words with lower scores. Try listening to native speakers and practice those sounds repeatedly.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PronunciationFeedback;