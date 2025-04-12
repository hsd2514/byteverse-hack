import React, { useState, useRef, useEffect } from 'react';

const VoiceInput = ({ 
  onTranscriptionReceived, 
  isLoading, 
  setIsLoading, 
  apiUrl,
  maxRecordingTime = 30,
  originalText = null, // For pronunciation module - the text being practiced
  proficiencyLevel = null, // User's proficiency level
  practiceType = null // Type of practice (introduction, cue_card, etc.)
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Start recording audio from the microphone
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        processAudio();
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      const interval = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      
      // Automatically stop recording after maxRecordingTime seconds
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, maxRecordingTime * 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing your microphone. Please make sure you have granted permission.');
    }
  };

  // Stop recording and process the audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
    
    // Clear timer
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setRecordingSeconds(0);
  };

  // Process recorded audio and send to backend API
  const processAudio = async () => {
    try {
      setIsLoading(true);
      
      // Create audio blob from chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      
      // Create FormData to send audio file
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.wav');
      
      // Add additional parameters if provided
      if (originalText) formData.append('original_text', originalText);
      if (proficiencyLevel) formData.append('proficiency_level', proficiencyLevel);
      if (practiceType) formData.append('practice_type', practiceType);
      
      // Call the transcription API
      const response = await fetch(`${apiUrl}/transcription/`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }
      
      const data = await response.json();
      
      // If we're doing pronunciation practice and have original text
      if (originalText && data.text) {
        // Analyze pronunciation by comparing transcription with original text
        await analyzePronunciation(data.text, originalText);
      } else {
        // Just send transcription to parent component
        onTranscriptionReceived(data);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Error processing your recording. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze pronunciation by comparing transcription with original text
  const analyzePronunciation = async (transcribedText, originalText) => {
    try {
      const response = await fetch(`${apiUrl}/pronunciation/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_text: originalText,
          user_audio_transcription: transcribedText,
          proficiency_level: proficiencyLevel || 'INTERMEDIATE'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze pronunciation');
      }
      
      const analysisData = await response.json();
      
      // Send both transcription and pronunciation analysis to parent
      onTranscriptionReceived({
        text: transcribedText,
        pronunciation_analysis: analysisData.analysis
      });
    } catch (error) {
      console.error('Error analyzing pronunciation:', error);
      // Still return the transcription even if analysis fails
      onTranscriptionReceived({ text: transcribedText, error: error.message });
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Set max recording time based on props
    const timeout = maxRecordingTime * 1000;
    
    // Cleanup function
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      
      // Stop recording if component unmounts while recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [maxRecordingTime]);

  return (
    <div className="flex items-center">
      {isRecording ? (
        <div className="flex items-center gap-4">
          <div className="badge badge-lg flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
            </span>
            <span>{formatTime(recordingSeconds)}</span>
          </div>
          
          <button
            className="btn btn-circle btn-error"
            onClick={stopRecording}
            disabled={isLoading}
            aria-label="Stop recording"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="tooltip" data-tip={originalText ? "Record pronunciation" : "Record audio"}>
          <button
            className="btn btn-circle btn-primary"
            onClick={startRecording}
            disabled={isLoading}
            aria-label="Start recording"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
      )}
      
      {isLoading && !isRecording && (
        <div className="ml-4 flex items-center gap-2 text-info">
          <span className="loading loading-spinner loading-sm"></span>
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;