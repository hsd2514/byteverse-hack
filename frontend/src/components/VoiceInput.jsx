import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const VoiceInput = ({ 
  onTranscriptionReceived, 
  isLoading, 
  setIsLoading,
  apiUrl = 'http://localhost:8000',
  practiceType = 'general',
  disabled = false,
  maxRecordingTime = 120, // in seconds
  question = '' // Add question prop to provide context for AI
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const apiEndpoint = `${apiUrl}/practice/transcribe`;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setIsLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, preparing data...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all audio tracks to release the microphone
        stream.getAudioTracks().forEach(track => track.stop());
        
        try {
          await sendAudioForTranscription(audioBlob);
        } catch (error) {
          console.error('Error during transcription:', error);
          setIsLoading(false);
        }
        
        setIsRecording(false);
        setElapsedTime(0);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setIsLoading(false);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          
          // Auto-stop if max recording time is reached
          if (newTime >= maxRecordingTime && mediaRecorderRef.current?.state === 'recording') {
            stopRecording();
            return maxRecordingTime;
          }
          
          return newTime;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access your microphone. Please check permissions and try again.');
      setIsLoading(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsLoading(true); // Set loading to true while processing the audio
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const sendAudioForTranscription = async (audioBlob) => {
    // Create a form data object to send the audio file
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.webm');
    formData.append('practice_type', practiceType);
    
    console.log(`Sending audio blob (${audioBlob.size} bytes) to ${apiEndpoint}`);
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Transcription failed with status ' + response.status }));
        throw new Error(errorData.detail || 'Transcription failed');
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Transcription successful:', data);
        
        // Get AI feedback for this transcription automatically
        let feedbackData = data;
        
        try {
          const feedbackResponse = await fetch(`${apiUrl}/practice/session/feedback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              practice_type: practiceType,
              text: data.text,
              question: question,
              pronunciation_analysis: data.pronunciation_analysis || {},
            }),
          });
          
          if (feedbackResponse.ok) {
            const aiData = await feedbackResponse.json();
            if (aiData.success) {
              // Combine transcription with AI feedback
              feedbackData = {
                ...data,
                ai_feedback: aiData
              };
              console.log('AI feedback received:', aiData);
            }
          }
        } catch (feedbackError) {
          console.error('Error getting AI feedback:', feedbackError);
          // Continue with just the transcription data
        }
        
        // Pass transcription (and feedback if available) to parent
        onTranscriptionReceived(feedbackData);
      } else {
        throw new Error(data.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('Error during transcription:', error);
      // Inform the parent component about the error
      onTranscriptionReceived({
        error: error.message,
        text: "Sorry, there was a problem transcribing your audio. Please try again.",
        pronunciation_analysis: { error: error.message }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="voice-input">
      <div className="flex items-center gap-4">
        <button 
          className={`btn ${isRecording ? 'btn-error' : 'btn-primary'} ${disabled ? 'btn-disabled' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading || disabled}
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Processing...
            </>
          ) : isRecording ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Stop Recording
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Start Recording
            </>
          )}
        </button>
        
        {(isRecording || elapsedTime > 0) && (
          <div className={`badge ${isRecording ? 'badge-accent' : 'badge-outline'} p-3`}>
            {formatTime(elapsedTime)} {maxRecordingTime && `/ ${formatTime(maxRecordingTime)}`}
          </div>
        )}
        
        {maxRecordingTime && (
          <progress 
            className={`progress w-56 ${
              elapsedTime < maxRecordingTime * 0.5 ? 'progress-success' :
              elapsedTime < maxRecordingTime * 0.8 ? 'progress-warning' : 'progress-error'
            }`}
            value={elapsedTime} 
            max={maxRecordingTime}
            style={{opacity: isRecording ? 1 : 0.5}}
          ></progress>
        )}
      </div>
    </div>
  );
};

VoiceInput.propTypes = {
  onTranscriptionReceived: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  setIsLoading: PropTypes.func.isRequired,
  apiUrl: PropTypes.string,
  practiceType: PropTypes.string,
  disabled: PropTypes.bool,
  maxRecordingTime: PropTypes.number,
  question: PropTypes.string
};

export default VoiceInput;