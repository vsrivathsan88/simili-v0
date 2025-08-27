import { useEffect, useState } from 'react';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { useLiveAPIContext } from './contexts/LiveAPIContext';
import { PI_SYSTEM_INSTRUCTION, piToolDeclarations } from './config/piTutor';
import { designSystem } from './config/designSystem';
import { VoiceInput } from './components/VoiceInput';
import UnifiedCanvas from './components/UnifiedCanvas';
import ProblemDisplay from './components/ProblemDisplay';
import TeacherPanel from './components/TeacherPanel';
import VoicePermissionModal from './components/VoicePermissionModal';
import LessonHomepage from './components/LessonHomepage';
import LessonTransition from './components/LessonTransition';
import LessonEntryPopup from './components/LessonEntryPopup';
import { ToolCallFeedback } from './components/ToolCallFeedback';
import { PiCharacter, Tool, FRACTION_TOOLS, PiState } from './components/PiCharacter';
import { ManipulativeStamp } from './components/ManipulativeStamp';
import { useSmartSuggestions } from './hooks/useSmartSuggestions';
import { handleToolCall } from './lib/toolImplementations';
import { useConnectionRetry } from './hooks/useConnectionRetry';
import { useDebounce } from './hooks/useDebounce';
import { sessionRecorder } from './lib/sessionRecorder';
import { Modality } from '@google/genai';
import './App.scss';

// Main Simili App Component
function SimiliApp() {
  const { client, setConfig, setModel, connect, disconnect, connected } = useLiveAPIContext();
  // Remove local isConnected state - use connected from context
  const [canvasImageData, setCanvasImageData] = useState<string>('');
  const debouncedCanvasData = useDebounce(canvasImageData, 2000); // Debounce canvas updates by 2 seconds
  const [problemImage, setProblemImage] = useState<string>('');
  const [showVoicePermission, setShowVoicePermission] = useState(false);
  const [showTeacherPanel, setShowTeacherPanel] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [isManualDisconnect, setIsManualDisconnect] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionLesson, setTransitionLesson] = useState<string>('');
  const [currentTool, setCurrentTool] = useState<'pencil' | 'eraser' | 'text'>('pencil');
  const [currentColor, setCurrentColor] = useState('#2D3748');
  const [showLessonEntry, setShowLessonEntry] = useState(false);
  const [isProblemMinimized, setIsProblemMinimized] = useState(false);
  
  // Pi character and manipulatives state
  const [piState, setPiState] = useState<PiState>('normal');
  const [availableTools, setAvailableTools] = useState<Tool[]>(FRACTION_TOOLS);
  const [placedManipulatives, setPlacedManipulatives] = useState<Array<{
    id: string;
    tool: Tool;
    x: number;
    y: number;
    selected: boolean;
  }>>([]);
  const [selectedManipulative, setSelectedManipulative] = useState<string | null>(null);
  
  // Smart suggestions hook
  const {
    hasSuggestion,
    currentSuggestion,
    suggestedTools,
    processDrawingForSuggestions,
    dismissSuggestion,
    acceptSuggestion
  } = useSmartSuggestions();
  
  // Session state to prevent introduction loops
  const [sessionState, setSessionState] = useState({
    hasIntroduced: false,
    firstImagesShared: false,
    lastVisionSync: 0
  });

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
      console.log('Connected to Gemini Live');
      // Start session recording
      sessionRecorder.startSession('pizza-fractions-1');
      
      // Send initial introduction only once per session
      setTimeout(() => {
        if (client && connected && !sessionState.hasIntroduced) {
          client.send({
            text: `SESSION_START: This is the beginning of a new learning session. The student just connected. Give your FIRST INTRODUCTION as specified in your instructions - be brief, welcoming, and then wait for them to start working on the problem. Do NOT introduce yourself again during this session.`
          });
          
          setSessionState(prev => ({ 
            ...prev, 
            hasIntroduced: true 
          }));
        }
      }, 1000);
    };

    const handleClose = (event: any) => {
      // Connection state handled by context
      console.log('Disconnected from Gemini Live', event);
      console.log('Close event details:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      
      // If it wasn't a manual disconnect, try to reconnect
      if (!isManualDisconnect && selectedLesson) {
        console.log('Unexpected disconnect detected, attempting to reconnect...');
        setTimeout(() => {
          if (!connected && !isManualDisconnect) {
            console.log('Attempting automatic reconnection...');
            connectWithRetry().catch(error => {
              console.error('Auto-reconnection failed:', error);
            });
          }
        }, 2000); // Wait 2 seconds before reconnecting
      }
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

  const { connectWithRetry, reset } = useConnectionRetry(
    connect,
    3, // max retries
    2000 // initial delay
  );

  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state === 'granted';
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch {
        return false;
      }
    }
  };

  const handleConnect = async () => {
    console.log('handleConnect called, current connected state:', connected);
    
    // If already connected, no need to reconnect
    if (connected) {
      console.log('Already connected, skipping connection attempt');
      return;
    }
    
    console.log('Checking microphone permission...');
    try {
      const hasPermission = await checkMicrophonePermission();
      console.log('Permission check result:', hasPermission);
      
      if (hasPermission) {
        // Permission already granted, connect directly
        try {
          console.log('Permission already granted, attempting connection...');
          
          // Add a small delay to ensure any previous connection is fully closed
          await new Promise(resolve => setTimeout(resolve, 500));
          await connectWithRetry();
          console.log('Connection initiated - session will remain active until you click End Session');
        } catch (error) {
          console.error('Connection failed:', error);
          if ((error as Error).message?.includes('CLOSING') || (error as Error).message?.includes('CLOSED')) {
            console.log('WebSocket was closing, retrying in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
              await connectWithRetry();
              console.log('Retry connection successful');
            } catch (retryError) {
              alert('Failed to connect after multiple attempts. Please check your API key and internet connection.');
              console.error('Retry connection error:', retryError);
            }
          } else {
            alert('Failed to connect. Please check your API key and internet connection.');
          }
        }
      } else {
        // Need to request permission
        console.log('Permission not granted, showing permission modal...');
        setShowVoicePermission(true);
      }
    } catch (error) {
      console.error('Error in handleConnect:', error);
      // Fallback to showing permission modal
      setShowVoicePermission(true);
    }
  };

  const handleVoiceAllow = async () => {
    setShowVoicePermission(false);
    try {
      console.log('Attempting to connect to Gemini Live...');
      await connectWithRetry();
      console.log('Connection initiated - session will remain active until you click End Session');
    } catch (error) {
      alert('Failed to connect after multiple attempts. Please check your API key and internet connection.');
      console.error('Connection error:', error);
    }
  };

  const handleVoiceDeny = () => {
    setShowVoicePermission(false);
  };

  const handleDisconnect = async () => {
    console.log('Manual disconnect requested');
    setIsManualDisconnect(true); // Prevent auto-reconnection
    reset(); // Reset retry logic
    const session = sessionRecorder.endSession();
    if (session) {
      console.log('Session saved:', session);
      console.log(`Total reasoning steps: ${session.reasoningSteps.length}`);
      console.log(`Total misconceptions: ${session.misconceptions.length}`);
    }
    
    // Disconnect and wait a moment for cleanup
    disconnect();
    console.log('Disconnecting... waiting for cleanup');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSelectedLesson(null); // Return to lesson selection
    console.log('Returned to lesson selection');
  };

  const handleCanvasChange = (imageData: string) => {
    console.log('Canvas change detected, image data length:', imageData.length);
    setCanvasImageData(imageData);
    
    // Trigger smart suggestions based on drawing
    if (imageData && selectedLesson) {
      const lessonType = selectedLesson.includes('fraction') ? 'fractions' : 'numbers';
      processDrawingForSuggestions(imageData, lessonType);
    }
  };

  // Use effect to sync debounced canvas data
  useEffect(() => {
    console.log('Vision sync check:', {
      hasCanvasData: !!debouncedCanvasData,
      hasProblemImage: !!problemImage,
      isConnected: connected,
      hasClient: !!client
    });
    
    if (debouncedCanvasData && problemImage && connected && client) {
      console.log('All conditions met - sending to vision API');
      sendToVisionAPI(problemImage, debouncedCanvasData);
    } else {
      console.log('Vision sync skipped - missing requirements');
    }
  }, [debouncedCanvasData, problemImage, connected, client]);

  const handleProblemImageUpload = (imageData: string) => {
    setProblemImage(imageData);
    if (canvasImageData && connected && client) {
      sendToVisionAPI(imageData, canvasImageData);
    }
  };

  const sendToVisionAPI = (problemImg: string, canvasImg: string) => {
    if (!client || !connected) {
      console.log('Vision API: Client not ready or not connected');
      return;
    }
    
    try {
      // Convert data URLs to base64
      const problemBase64 = problemImg.split(',')[1];
      const canvasBase64 = canvasImg.split(',')[1];
      
      if (!problemBase64 || !canvasBase64) {
        console.log('Vision API: Invalid image data', {
          hasProblemData: !!problemBase64,
          hasCanvasData: !!canvasBase64,
          problemImgStart: problemImg?.substring(0, 50),
          canvasImgStart: canvasImg?.substring(0, 50)
        });
        return;
      }
      
      console.log('Vision API: Sending problem and canvas images to Pi...');
      console.log('Problem image size:', problemBase64.length, 'bytes');
      console.log('Canvas image size:', canvasBase64.length, 'bytes');
      console.log('Problem image type:', problemImg.split(',')[0]);
      console.log('Canvas image type:', canvasImg.split(',')[0]);
      
      // Send both images with clear context
      client.sendRealtimeInput([
        {
          mimeType: 'image/jpeg',
          data: problemBase64
        },
        {
          mimeType: 'image/jpeg', 
          data: canvasBase64
        }
      ]);
      
      console.log('Vision API: Successfully sent both images to Pi');
      
      // Send clear context about what Pi is seeing with session awareness
      setTimeout(() => {
        if (client && connected) {
          const now = Date.now();
          const isFirstTime = !sessionState.firstImagesShared;
          
          if (isFirstTime) {
            // First time sharing images
            client.send({
              text: `Pi, I'm sharing two images with you: 

Image 1: The math problem I need to solve
Image 2: My current work on the student notebook/canvas

This is the first time I'm showing you my work. Please look at both images and help me get started on this problem. Focus on what I've drawn or written on my canvas and guide me based on my current progress.`
            });
            
            setSessionState(prev => ({ 
              ...prev, 
              firstImagesShared: true,
              lastVisionSync: now 
            }));
          } else {
            // Subsequent updates - only send if significant time has passed
            const timeSinceLastSync = now - sessionState.lastVisionSync;
            if (timeSinceLastSync > 3000) { // Only every 3+ seconds
              client.send({
                text: `Pi, here's an updated view of my work on the canvas. Please look at what I've drawn or changed and continue helping me with the problem. If I'm getting off track, please redirect me back to the math.`
              });
              
              setSessionState(prev => ({ 
                ...prev, 
                lastVisionSync: now 
              }));
            }
          }
        }
      }, 300);
      
    } catch (error) {
      console.error('Error sending images to vision API:', error);
    }
  };

  const handleLessonSelect = (lessonId: string) => {
    console.log('Lesson selected:', lessonId);
    const lessons = [
      { id: 'intro-fractions', title: 'Parts & Wholes' },
      { id: 'equivalent-fractions', title: 'Same Amount, Different Ways' },
      { id: 'comparing-fractions', title: 'Bigger or Smaller?' },
      { id: 'fractions-number-line', title: 'Finding Your Spot' },
      { id: 'unit-fractions', title: 'Special One-Pieces' },
      { id: 'fraction-word-problems', title: 'Real-Life Stories' }
    ];
    
    const lesson = lessons.find(l => l.id === lessonId);
    console.log('Found lesson:', lesson);
    setTransitionLesson(lesson?.title || 'Math Adventures');
    setShowTransition(true);
    setIsManualDisconnect(false);
    console.log('Starting transition for:', lesson?.title);
  };

  const handleTransitionComplete = () => {
    console.log('Transition completed, showing lesson entry popup...');
    setShowTransition(false);
    // Find the lesson ID from the title to set selected lesson properly
    const lessons = [
      { id: 'intro-fractions', title: 'Parts & Wholes' },
      { id: 'equivalent-fractions', title: 'Same Amount, Different Ways' },
      { id: 'comparing-fractions', title: 'Bigger or Smaller?' },
      { id: 'fractions-number-line', title: 'Finding Your Spot' },
      { id: 'unit-fractions', title: 'Special One-Pieces' },
      { id: 'fraction-word-problems', title: 'Real-Life Stories' }
    ];
    const lesson = lessons.find(l => l.title === transitionLesson);
    setSelectedLesson(lesson?.id || 'intro-fractions');
    // Show lesson entry popup instead of auto-connecting
    setShowLessonEntry(true);
  };

  const handleManualSendToPi = () => {
    if (canvasImageData && problemImage) {
      console.log('Manual send to Pi requested');
      sendToVisionAPI(problemImage, canvasImageData);
    } else {
      console.log('Manual send failed - missing canvas or problem image');
    }
  };

  // Kid-friendly color palette
  const colors = [
    { name: 'Dark Blue', value: '#2D3748' },
    { name: 'Red', value: '#E53E3E' },
    { name: 'Blue', value: '#3182CE' },
    { name: 'Green', value: '#38A169' }
  ];

  const handleToolChange = (tool: 'pencil' | 'eraser' | 'text') => {
    setCurrentTool(tool);
  };

  const handleClear = () => {
    // This will be handled by the UnifiedCanvas component
    console.log('Clear requested');
  };

  const handleAddManipulative = (type: 'fraction-bar' | 'number-line' | 'area-model' | 'array-grid' | 'fraction-circles' | 'visual-number-line') => {
    console.log('Add manipulative requested:', type);
    // The actual adding is handled by UnifiedCanvas
  };

  const handleLessonEntryStart = async () => {
    console.log('Starting lesson from entry popup...');
    console.log('API Key exists:', !!process.env.REACT_APP_GEMINI_API_KEY);
    console.log('Client exists:', !!client);
    console.log('Connected state:', connected);
    setShowLessonEntry(false);
    
    // Check mic permission and connect
    const hasPermission = await checkMicrophonePermission();
    if (hasPermission) {
      // Permission already granted, connect directly
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('About to call connectWithRetry...');
        await connectWithRetry();
        console.log('Connected! Pi will now give welcome message.');
      } catch (error) {
        console.error('Connection failed:', error);
        console.error('Error details:', {
          message: (error as Error).message,
          stack: (error as Error).stack
        });
        alert('Failed to connect. Please check your API key and internet connection.');
      }
    } else {
      // Need to request permission
      setShowVoicePermission(true);
    }
  };

  const handleLessonEntryCancel = () => {
    setShowLessonEntry(false);
    setSelectedLesson(null);
  };

  // Pi character handlers
  const handlePiToolRequest = () => {
    console.log('Pi tool request');
    setPiState('tools');
    setAvailableTools(FRACTION_TOOLS); // Could be dynamic based on lesson
  };

  const handleToolSelect = (tool: Tool) => {
    console.log('Tool selected:', tool.name);
    
    // Add manipulative to center of canvas
    const canvasCenter = { x: 400, y: 300 }; // Approximate canvas center
    const newManipulative = {
      id: `${tool.id}-${Date.now()}`,
      tool,
      x: canvasCenter.x + Math.random() * 100 - 50, // Add slight randomness
      y: canvasCenter.y + Math.random() * 100 - 50,
      selected: false
    };
    
    setPlacedManipulatives(prev => [...prev, newManipulative]);
    setPiState('normal');
    
    // Pi's encouraging response
    if (client && connected) {
      setTimeout(() => {
        client.send({
          text: `Great choice! I just gave you ${tool.name} to help with your thinking. You can move it around and use it however feels right to you!`
        });
      }, 500);
    }
  };

  const handleManipulativeMove = (id: string, newX: number, newY: number) => {
    setPlacedManipulatives(prev =>
      prev.map(manip =>
        manip.id === id ? { ...manip, x: newX, y: newY } : manip
      )
    );
  };

  const handleManipulativeSelect = (id: string) => {
    setSelectedManipulative(id);
    setPlacedManipulatives(prev =>
      prev.map(manip => ({
        ...manip,
        selected: manip.id === id
      }))
    );
  };

  const handleManipulativeRemove = (id: string) => {
    setPlacedManipulatives(prev => prev.filter(manip => manip.id !== id));
    setSelectedManipulative(null);
  };

  const handlePiSuggestionDismiss = () => {
    dismissSuggestion();
    setPiState('normal');
  };

  // Update Pi state based on suggestions
  useEffect(() => {
    if (hasSuggestion && piState === 'normal') {
      setPiState('suggestion');
      setAvailableTools(suggestedTools);
    }
  }, [hasSuggestion, suggestedTools, piState]);

  return (
    <div className="simili-app" style={{ backgroundColor: designSystem.colors.paper }}>
      {connected && <ToolCallFeedback />}
      <header className="simili-header">
        <h1 className="simili-title">Simili</h1>
      </header>

      <main className="simili-main">
        {!selectedLesson && !showTransition ? (
          <LessonHomepage onLessonSelect={handleLessonSelect} />
        ) : showTransition ? (
          <LessonTransition 
            isActive={showTransition}
            lessonTitle={transitionLesson}
            onComplete={handleTransitionComplete}
          />
        ) : (
          <div className="simili-workspace-optimized">
            {/* Left sidebar with problem and Pi */}
            <div className="workspace-sidebar">
              {/* Problem display */}
              <div className="sidebar-problem">
                <ProblemDisplay 
                  onImageUpload={handleProblemImageUpload}
                  lessonId={selectedLesson || undefined}
                />
              </div>

              {/* Pi character section */}
              <div className="sidebar-pi">
                <PiCharacter
                  state={piState}
                  onToolRequest={handlePiToolRequest}
                  onToolSelect={handleToolSelect}
                  onDismissSuggestion={handlePiSuggestionDismiss}
                  availableTools={availableTools}
                  suggestion={currentSuggestion}
                  className="sidebar-pi-character"
                />
                
                {/* Pi status */}
                <div className={`pi-status ${connected ? 'listening' : 'connecting'}`}>
                  {connected ? (
                    <VoiceInput />
                  ) : (
                    'Getting ready...'
                  )}
                </div>

                {/* End session button */}
                <button 
                  className="end-session-btn" 
                  onClick={() => {
                    if (window.confirm('End your adventure with Pi? 🚀\n\nYour thinking will be saved!')) {
                      handleDisconnect();
                    }
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Main canvas area */}
            <div className="workspace-main">
              <div className="canvas-container">
                <UnifiedCanvas 
                  onCanvasChange={handleCanvasChange}
                  problemImage={problemImage}
                  onSendToPi={handleManualSendToPi}
                  currentTool={currentTool}
                  currentColor={currentColor}
                  onToolChange={handleToolChange}
                  onColorChange={setCurrentColor}
                  onClear={handleClear}
                />

                {/* Manipulatives overlay */}
                <div className="manipulatives-overlay">
                  {placedManipulatives.map((manipulative) => (
                    <ManipulativeStamp
                      key={manipulative.id}
                      tool={manipulative.tool}
                      x={manipulative.x}
                      y={manipulative.y}
                      isSelected={manipulative.selected}
                      onMove={(newX, newY) => handleManipulativeMove(manipulative.id, newX, newY)}
                      onRemove={() => handleManipulativeRemove(manipulative.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom toolbar */}
            <div className="workspace-toolbar">
              {/* Drawing tools */}
              <div className="toolbar-section">
                <span className="toolbar-label">Draw:</span>
                <button 
                  className={`tool-btn ${currentTool === 'pencil' ? 'active' : ''}`}
                  onClick={() => handleToolChange('pencil')}
                  title="Pencil"
                >
                  ✏️
                </button>
                <button 
                  className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
                  onClick={() => handleToolChange('eraser')}
                  title="Eraser"
                >
                  🧽
                </button>
              </div>
              
              <div className="toolbar-divider" />
              
              {/* Colors */}
              <div className="toolbar-section">
                <span className="toolbar-label">Colors:</span>
                {colors.map((color) => (
                  <button
                    key={color.value}
                    className={`color-btn ${currentColor === color.value ? 'active' : ''}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setCurrentColor(color.value)}
                    title={color.name}
                  >
                    {currentColor === color.value ? '✓' : ''}
                  </button>
                ))}
              </div>
              
              <div className="toolbar-divider" />
              
              {/* Manipulatives from Pi's satchel */}
              <div className="toolbar-section">
                <span className="toolbar-label">From Pi's satchel:</span>
                {availableTools.slice(0, 4).map((tool) => (
                  <button
                    key={tool.id}
                    className="manipulative-btn"
                    onClick={() => handleToolSelect(tool)}
                    title={tool.name}
                  >
                    {tool.emoji}
                  </button>
                ))}
                <button 
                  className="more-tools-btn"
                  onClick={handlePiToolRequest}
                  title="More tools from Pi"
                >
                  🎒
                </button>
              </div>
              
              <div className="toolbar-divider" />
              
              {/* Clear */}
              <div className="toolbar-section">
                <button 
                  className="tool-btn clear-btn"
                  onClick={handleClear}
                  title="Clear everything"
                >
                  🗑️ Clear
                </button>
              </div>
            </div>

            {/* Teacher panel */}
            <TeacherPanel 
              isOpen={showTeacherPanel}
              onToggle={() => setShowTeacherPanel(!showTeacherPanel)}
            />
          </div>
        )}
      </main>

      <VoicePermissionModal
        isOpen={showVoicePermission}
        onAllow={handleVoiceAllow}
        onDeny={handleVoiceDeny}
      />

      <LessonEntryPopup
        isOpen={showLessonEntry}
        lessonTitle={transitionLesson}
        onStart={handleLessonEntryStart}
        onCancel={handleLessonEntryCancel}
      />
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