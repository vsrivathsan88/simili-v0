import { useEffect, useState } from 'react';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { SketchyButton } from './ui/SketchyButton';
import { AudioRecorder } from '../lib/audio-recorder';

export function VoiceInput() {
  const { client, connected } = useLiveAPIContext();
  const [isRecording, setIsRecording] = useState(false);
  const [audioRecorder] = useState(() => new AudioRecorder(16000)); // 16kHz for Gemini Live
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    const onData = (base64: string) => {
      if (connected) {
        client.sendRealtimeInput([
          {
            mimeType: "audio/pcm;rate=16000",
            data: base64,
          },
        ]);
      }
    };

    const onVolume = (vol: number) => {
      setVolume(vol);
    };

    if (connected && isRecording && audioRecorder) {
      audioRecorder
        .on("data", onData)
        .on("volume", onVolume)
        .start()
        .catch((error) => {
          console.error('Failed to start recording:', error);
          setIsRecording(false);
        });
    } else {
      audioRecorder.stop();
    }

    return () => {
      audioRecorder
        .off("data", onData)
        .off("volume", onVolume);
    };
  }, [connected, client, isRecording, audioRecorder]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  if (!connected) return null;

  return (
    <div className="voice-input">
      <SketchyButton
        onClick={toggleRecording}
        variant={isRecording ? 'secondary' : 'primary'}
        size="large"
      >
        {isRecording ? '🔴 Stop Talking' : '🎤 Start Talking'}
      </SketchyButton>
      {isRecording && (
        <div style={{ marginTop: '8px' }}>
          <p style={{ fontSize: '14px', opacity: 0.7 }}>
            Listening... speak your answer!
          </p>
          <div 
            style={{ 
              height: '4px', 
              background: '#ddd', 
              borderRadius: '2px',
              overflow: 'hidden',
              marginTop: '4px'
            }}
          >
            <div 
              style={{ 
                height: '100%', 
                background: '#4F46E5',
                width: `${Math.min(100, volume * 300)}%`,
                transition: 'width 0.1s ease'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}