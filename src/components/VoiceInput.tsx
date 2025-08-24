import { useEffect, useState } from 'react';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { AudioRecorder } from '../lib/audio-recorder';

export function VoiceInput() {
  const { client, connected } = useLiveAPIContext();
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

    // Always recording when connected (ambient mode)
    if (connected && audioRecorder) {
      audioRecorder
        .on("data", onData)
        .on("volume", onVolume)
        .start()
        .catch((error) => {
          console.error('Failed to start recording:', error);
        });
    } else {
      audioRecorder.stop();
    }

    return () => {
      audioRecorder
        .off("data", onData)
        .off("volume", onVolume)
        .stop();
    };
  }, [connected, client, audioRecorder]);

  if (!connected) return null;

  // Just show listening status, no button
  return (
    <span className="voice-status-text">
      Pi is listening...
    </span>
  );
}