import React from 'react';

const GrammarFeedback = ({ transcript, corrections = [] }) => {
  // Helper function to highlight corrected text
  const renderHighlightedText = () => {
    if (!transcript) return null;
    
    let result = transcript;
    let offset = 0;
    
    // Sort corrections by start index to process them in order
    const sortedCorrections = [...corrections].sort((a, b) => a.start - b.start);
    
    // Apply highlighting for each correction
    sortedCorrections.forEach(correction => {
      const start = correction.start + offset;
      const end = correction.end + offset;
      
      const before = result.substring(0, start);
      const highlighted = result.substring(start, end);
      const after = result.substring(end);
      
      // Replace with highlighted version - using spans with different classes for different error types
      const highlightedText = `<span class="underline decoration-wavy decoration-error cursor-help tooltip" data-tip="${correction.suggestion}">${highlighted}</span>`;
      result = before + highlightedText + after;
      
      // Adjust offset for subsequent corrections
      offset += highlightedText.length - highlighted.length;
    });
    
    return (
      <div className="mt-4 p-4 bg-base-200 rounded-box border border-base-300" dangerouslySetInnerHTML={{ __html: result }} />
    );
  };

  // Calculate statistics
  const calculateStats = () => {
    if (!transcript || transcript.length === 0) {
      return { errorRate: 0, accuracy: 100 };
    }
    
    const wordsCount = transcript.split(/\s+/).length;
    const errorsCount = corrections.length;
    const errorRate = (errorsCount / wordsCount) * 100;
    const accuracy = 100 - errorRate;
    
    return {
      wordsCount,
      errorsCount,
      errorRate: errorRate.toFixed(1),
      accuracy: accuracy.toFixed(1)
    };
  };

  const stats = calculateStats();
  
  // Group corrections by type
  const groupCorrectionsByType = () => {
    const groups = {};
    
    corrections.forEach(correction => {
      const type = correction.type || 'Other';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(correction);
    });
    
    return groups;
  };
  
  const correctionGroups = groupCorrectionsByType();
  
  // Colors for different correction types
  const typeColors = {
    'Grammar': 'error',
    'Spelling': 'warning',
    'Punctuation': 'info',
    'Style': 'accent',
    'Other': 'neutral'
  };

  return (
    <div className="w-full">
      {!transcript ? (
        <div className="flex flex-col items-center justify-center text-center p-12 opacity-50">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-xl font-bold mb-2">Grammar Check</h3>
          <p>Record or type some text to check your grammar</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-2">Your Text</h3>
            {renderHighlightedText()}
            <div className="text-sm mt-2 text-base-content/70">
              Hover over underlined text to see suggestions
            </div>
          </div>
          
          <div className="divider"></div>
          
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4">Feedback Summary</h3>
            
            <div className="stats shadow mb-4 w-full">
              <div className="stat">
                <div className="stat-title">Accuracy</div>
                <div className="stat-value text-success">{stats.accuracy}%</div>
                <div className="stat-desc">Words: {stats.wordsCount}</div>
              </div>
              
              <div className="stat">
                <div className="stat-title">Errors Found</div>
                <div className="stat-value text-error">{stats.errorsCount}</div>
                <div className="stat-desc">Error rate: {stats.errorRate}%</div>
              </div>
            </div>
            
            {corrections.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(correctionGroups).map(([type, items]) => (
                  <div key={type} className="collapse collapse-arrow bg-base-200">
                    <input type="checkbox" defaultChecked /> 
                    <div className={`collapse-title font-medium flex items-center gap-2`}>
                      <div className={`badge badge-${typeColors[type] || 'neutral'}`}>{items.length}</div>
                      {type} Issues
                    </div>
                    <div className="collapse-content">
                      <div className="overflow-x-auto">
                        <table className="table table-zebra">
                          <thead>
                            <tr>
                              <th>Incorrect</th>
                              <th>Suggestion</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((correction, index) => (
                              <tr key={index}>
                                <td className="text-error">{transcript.substring(correction.start, correction.end)}</td>
                                <td className="text-success">{correction.suggestion}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : transcript ? (
              <div className="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Great job! No grammar errors found.</span>
              </div>
            ) : null}
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2">Improvement Tips</h3>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title">Practice Makes Perfect</h4>
                <ul className="list-disc ml-5 space-y-2">
                  <li>Try to use a variety of sentence structures</li>
                  <li>Pay attention to verb tenses and subject-verb agreement</li>
                  <li>Read your text out loud to catch awkward phrasing</li>
                  {corrections.length > 0 && (
                    <li className="text-primary">Focus on correcting {
                      Object.keys(correctionGroups)[0] || 'grammar'
                    } errors</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GrammarFeedback;