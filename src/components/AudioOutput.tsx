import React, { useEffect, useRef } from 'react';

const AudioOutput: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // The audio element with id "audio-out" is used by the LiveAPI
    console.log('AudioOutput component mounted');
  }, []);

  return (
    <audio 
      ref={audioRef}
      id="audio-out"
      style={{ display: 'none' }}
      autoPlay
    />
  );
};

export default AudioOutput;