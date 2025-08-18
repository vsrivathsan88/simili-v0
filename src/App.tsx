import { useEffect, useState } from 'react';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { useLiveAPIContext } from './contexts/LiveAPIContext';
import { PI_SYSTEM_INSTRUCTION, piToolDeclarations } from './config/piTutor';
import { designSystem } from './config/designSystem';
import { SketchyButton } from './components/ui/SketchyButton';
import { VoiceInput } from './components/VoiceInput';
import StudentNotebook from './components/StudentNotebook';
import ProblemDisplay from './components/ProblemDisplay';
import ReasoningTrace from './components/ReasoningTrace';
import { ToolCallFeedback } from './components/ToolCallFeedback';
import { handleToolCall } from './lib/toolImplementations';
import { useConnectionRetry } from './hooks/useConnectionRetry';
import { sessionRecorder } from './lib/sessionRecorder';
import { Modality } from '@google/genai';
import './App.scss';

// Main Simili App Component
function SimiliApp() {
  const { client, setConfig, setModel, connect, disconnect, connected } = useLiveAPIContext();
  // Remove local isConnected state - use connected from context
  const [isConnecting, setIsConnecting] = useState(false);
  const [canvasImageData, setCanvasImageData] = useState<string>('');
  const [problemImage, setProblemImage] = useState<string>('');

  useEffect(() => {
    // Configure Pi tutor with Gemini Live model
    setModel("gemini-2.0-flash-live-001");
    setConfig({
      systemInstruction: {
        parts: [{ text: PI_SYSTEM_INSTRUCTION }]
      },
      tools: [{ functionDeclarations: piToolDeclarations }],
      responseModalities: [Modality.AUDIO]
    });
  }, [setConfig, setModel]);

  useEffect(() => {
    if (!client) return;

    // Set up event listeners
    const handleOpen = () => {
      setIsConnecting(false);
      console.log('Connected to Gemini Live');
      // Start session recording
      sessionRecorder.startSession('pizza-fractions-1');
    };

    const handleClose = (event: any) => {
      // Connection state handled by context
      console.log('Disconnected from Gemini Live', event);
    };
    
    const handleError = (error: any) => {
      console.error('Gemini Live error:', error);
    };
    
    const handleSetupComplete = () => {
      console.log('Gemini Live setup complete');
    };

    const handleToolCallEvent = async (toolCall: any) => {
      console.log('Tool call received:', toolCall);
      
      // Handle multiple function calls
      if (toolCall.functionCalls && toolCall.functionCalls.length > 0) {
        const responses = [];
        
        for (const functionCall of toolCall.functionCalls) {
          const result = await handleToolCall(functionCall);
          
          if (result.response) {
            responses.push({
              id: functionCall.id,
              name: functionCall.name,
              response: result.response
            });
          }
        }
        
        // Send all responses back to Gemini
        if (responses.length > 0) {
          client.sendToolResponse({
            functionResponses: responses
          });
        }
      }
    };

    client.on('open', handleOpen);
    client.on('close', handleClose);
    client.on('error', handleError);
    client.on('setupcomplete', handleSetupComplete);
    client.on('toolcall', handleToolCallEvent);

    return () => {
      client.off('open', handleOpen);
      client.off('close', handleClose);
      client.off('error', handleError);
      client.off('setupcomplete', handleSetupComplete);
      client.off('toolcall', handleToolCallEvent);
    };
  }, [client]);

  const { connectWithRetry, isRetrying, retryCount, reset } = useConnectionRetry(
    connect,
    3, // max retries
    2000 // initial delay
  );

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      console.log('Attempting to connect to Gemini Live...');
      await connectWithRetry();
      console.log('Connection initiated');
    } catch (error) {
      setIsConnecting(false);
      alert('Failed to connect after multiple attempts. Please check your API key and internet connection.');
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = () => {
    reset(); // Reset retry logic
    const session = sessionRecorder.endSession();
    if (session) {
      console.log('Session saved:', session);
      console.log(`Total reasoning steps: ${session.reasoningSteps.length}`);
      console.log(`Total misconceptions: ${session.misconceptions.length}`);
    }
    disconnect();
  };

  const handleCanvasChange = (imageData: string) => {
    setCanvasImageData(imageData);
    // TODO: Implement vision sync with Gemini
    // For now, just log it
    console.log('Canvas updated');
  };

  const handleProblemImageUpload = (imageData: string) => {
    setProblemImage(imageData);
    // TODO: Send to Gemini vision API
    console.log('Problem image uploaded');
  };

  return (
    <div className="simili-app" style={{ backgroundColor: designSystem.colors.paper }}>
      {connected && <ToolCallFeedback />}
      <header className="simili-header">
        <h1 className="simili-title">Simili Math Tutor</h1>
        <p className="simili-subtitle">Let's explore fractions together!</p>
      </header>

      <main className="simili-main">
        {!connected ? (
          <div className="simili-welcome">
            <h2>Welcome to Simili!</h2>
            <p>I'm Pi, your friendly math tutor. Ready to learn about fractions?</p>
            
            <SketchyButton 
              onClick={handleConnect}
              size="large"
              variant="primary"
              disabled={isConnecting}
            >
              {isConnecting 
                ? isRetrying 
                  ? `Retrying... (${retryCount}/3)`
                  : 'Connecting...' 
                : 'Start Learning!'}
            </SketchyButton>
          </div>
        ) : (
          <div className="simili-workspace">
            <div className="workspace-grid">
              {/* Left Column: Problem & Reasoning */}
              <div className="left-column">
                <ProblemDisplay onImageUpload={handleProblemImageUpload} />
                <ReasoningTrace />
              </div>

              {/* Center: Student Notebook */}
              <div className="center-column">
                <StudentNotebook onCanvasChange={handleCanvasChange} />
              </div>

              {/* Right Column: Voice & Controls */}
              <div className="right-column">
                <div className="voice-section">
                  <VoiceInput />
                  <div className="tutor-status">
                    <span className="status-indicator active"></span>
                    <span className="status-text">Pi is listening...</span>
                  </div>
                </div>
                
                <div className="session-controls">
                  <SketchyButton onClick={handleDisconnect} variant="secondary" size="small">
                    End Session
                  </SketchyButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// App wrapper with LiveAPI provider
function App() {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

  if (!apiKey) {
    return (
      <div className="simili-error">
        <h1>Configuration Error</h1>
        <p>Please add your Gemini API key to the .env file:</p>
        <code>REACT_APP_GEMINI_API_KEY=your_api_key_here</code>
      </div>
    );
  }

  return (
    <LiveAPIProvider options={{ apiKey }}>
      <SimiliApp />
    </LiveAPIProvider>
  );
}

export default App;