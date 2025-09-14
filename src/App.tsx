import { useEffect, useState } from 'react';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { useLiveAPIContext } from './contexts/LiveAPIContext';
import { PI_SYSTEM_INSTRUCTION, piToolDeclarations } from './config/piTutor';
import { designSystem } from './config/designSystem';
import { VoiceInput } from './components/VoiceInput';
import UnifiedCanvas from './components/UnifiedCanvas';
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
// useDebounce removed - now using real-time updates
import { sessionRecorder } from './lib/sessionRecorder';
import { EnhancedVisionService } from './lib/visionService';
import { RealTimeCanvasHandler } from './lib/realtimeCanvas';
import { Modality } from '@google/genai';
import { useThreeActStore } from './stores/threeActStore';
import FloatingToolbar from './components/FloatingToolbar';
import ActTransition from './components/ActTransition';
import AudioOutput from './components/AudioOutput';
import { contextCards, ContextCardSystem } from './lib/contextCards';
import { structuredOrchestrator } from './lib/orchestrator/structuredOrchestrator';
import { systemMonitor } from './lib/monitoring/systemMonitor';
import { reliabilityLayer } from './lib/reliability/reliabilityLayer';
import DebugPanel from './components/DebugPanel';
import ProblemNavigator from './components/ProblemNavigator';
import { lessons, getProblem } from './config/lessonStructure';
import { useGeminiClientEvents } from './hooks/useGeminiClientEvents';
import './App.scss';
// Import the JPEG once you've saved it
// import legoBlocksJpg from './assets/lego-blocks.jpg';

// Main Simili App Component
function SimiliApp() {
  const { client, setConfig, setModel, connect, disconnect, connected } = useLiveAPIContext();
  // Remove local isConnected state - use connected from context
  const [canvasImageData, setCanvasImageData] = useState<string>(''); // Real-time canvas updates
  const [problemImage, setProblemImage] = useState<string>(''); // Will load on mount
  const [showVoicePermission, setShowVoicePermission] = useState(false);
  const [showTeacherPanel, setShowTeacherPanel] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [isManualDisconnect, setIsManualDisconnect] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionLesson, setTransitionLesson] = useState<string>('');
  const [currentTool, setCurrentTool] = useState<'pencil' | 'eraser' | 'text' | 'select'>('pencil');
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
  
  // Subscribe to act changes
  const currentAct = useThreeActStore(state => state.currentAct);
  
  // Update context cards when act changes
  useEffect(() => {
    contextCards.addCard(ContextCardSystem.getActCard(currentAct));
    contextCards.addCard(ContextCardSystem.getProblemCard());
    
    // Take a snapshot when act changes
    systemMonitor.snapshot(`act_change_to_${currentAct}`);
  }, [currentAct]);
  
  // Real-time vision system
  const [visionService, setVisionService] = useState<EnhancedVisionService | null>(null);
  const [realtimeCanvas, setRealtimeCanvas] = useState<RealTimeCanvasHandler | null>(null);
  const [isStudentActive, setIsStudentActive] = useState(false);

  useEffect(() => {
    // Configure Pi tutor with Gemini Live model
    setModel("gemini-2.0-flash-live-001");
    
    // Initialize enhanced vision service
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (apiKey && !visionService) {
      const vision = new EnhancedVisionService(apiKey);
      setVisionService(vision);
      console.log('Enhanced vision service initialized');
    }
    // Use structured orchestrator's minimal prompt
    setConfig({
      systemInstruction: {
        parts: [{ text: structuredOrchestrator.getSystemPrompt() }]
      },
      tools: [{ functionDeclarations: piToolDeclarations }],
      responseModalities: [Modality.AUDIO]
    });
    
    // Don't load any image yet - wait for lesson selection
    
    // Expose useThreeActStore to window for testing
    (window as any).useThreeActStore = useThreeActStore;
    console.log('Three-act store exposed to window. Test with: useThreeActStore.getState().setAct("act1")');
  }, [setConfig, setModel]);

  // Initialize real-time canvas when vision service and problem image are available
  useEffect(() => {
    if (visionService && problemImage && !realtimeCanvas) {
      const canvasHandler = new RealTimeCanvasHandler({
        visionService,
        problemImage,
        onVisionUpdate: (analysisData) => {
          console.log('Vision analysis received:', analysisData);
          
          // Send analysis results to Pi through Gemini Live
          if (client && connected) {
            client.send({
              text: `VISION_ANALYSIS: ${JSON.stringify({
                context: analysisData.context,
                analysis: analysisData.analysis,
                timestamp: analysisData.timestamp
              })}`
            });
          }
        },
        onActivityChange: (isActive) => {
          setIsStudentActive(isActive);
          console.log('Student activity changed:', isActive ? 'drawing' : 'paused');
        }
      });
      
      setRealtimeCanvas(canvasHandler);
      console.log('Real-time canvas handler initialized');
    }
  }, [visionService, problemImage, realtimeCanvas, client, connected]);

  // Event wiring moved to useGeminiClientEvents

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
    
    // Send to real-time canvas handler for immediate processing
    if (realtimeCanvas && imageData) {
      realtimeCanvas.handleCanvasEvent({
        type: 'stroke_end',
        timestamp: Date.now()
      }, imageData);
    }
    
    // Send updated canvas to Pi via Gemini Live
    if (connected && client && problemImage && imageData) {
      console.log('Sending canvas update to Pi');
      sendToVisionAPI(problemImage, imageData);
    }
  };

  // Update real-time canvas when problem image changes
  useEffect(() => {
    if (realtimeCanvas && problemImage) {
      realtimeCanvas.updateProblemImage(problemImage);
      console.log('Updated problem image in real-time canvas');
    }
  }, [realtimeCanvas, problemImage]);

  const handleProblemImageUpload = (imageData: string) => {
    setProblemImage(imageData);
    if (canvasImageData && connected && client) {
      sendToVisionAPI(imageData, canvasImageData);
    }
  };

  const sendToVisionAPI = async (problemImg: string, canvasImg: string) => {
    if (!client || !connected) {
      console.log('Vision API: Client not ready or not connected');
      return;
    }
    
    try {
      // Perform pre-flight checks
      const validation = await reliabilityLayer.preFlightCheck('Vision update', [problemImg, canvasImg]);
      if (!validation.passed) {
        console.warn('Pre-flight check failed:', validation.issues);
        systemMonitor.log({
          type: 'warning',
          level: 'warning',
          message: 'Pre-flight check failed for vision update',
          data: validation
        });
      }
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
            // Send context cards with first message
            const context = contextCards.buildContextMessage(true);
            
            client.send({
              text: `${context}

[VISION UPDATE]
You can now see:
- Image 1: LEGO blocks (6 total: 2 blue, 4 gray)
- Image 2: Student's blank canvas

The student is viewing the LEGO blocks problem.`
            });
            
            setSessionState(prev => ({ 
              ...prev, 
              firstImagesShared: true,
              lastVisionSync: now 
            }));
          } else {
            // Subsequent updates - only send new context cards
            const timeSinceLastSync = now - sessionState.lastVisionSync;
            if (timeSinceLastSync > 3000) { // Only every 3+ seconds
              const context = contextCards.buildContextMessage(false);
              const message = context 
                ? `${context}\n\nCanvas updated.`
                : 'Canvas updated - student is drawing.';
              
              client.send({ text: message });
              
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

  // Wire Gemini client events via hook
  useGeminiClientEvents({
    client,
    connected,
    selectedLesson,
    currentProblemIndex,
    isManualDisconnect,
    connectWithRetry,
    sendToVisionAPI,
    problemImage,
    sessionState,
    setSessionState,
  });

  const loadProblemImage = (imageFile: string) => {
    const imagePath = imageFile === 'lego-blocks.svg' 
      ? '/assets/lego-blocks.svg'
      : `/assets/problems/${imageFile}`;
    
    console.log('Loading problem image:', imagePath);
    
    fetch(imagePath)
      .then(res => res.text())
      .then(svgText => {
        // Convert SVG to data URL
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        // Convert to image and then to JPEG data URL
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setProblemImage(jpegDataUrl);
            console.log(`${imageFile} loaded and converted to JPEG`);
          }
          URL.revokeObjectURL(url);
        };
        img.src = url;
      })
      .catch(err => {
        console.error(`Failed to load ${imageFile}:`, err);
      });
  };

  const handleLessonSelect = (lessonId: string) => {
    console.log('Lesson selected:', lessonId);
    
    const lesson = lessons[lessonId];
    if (!lesson) {
      console.error('Lesson not found:', lessonId);
      return;
    }
    
    console.log('Found lesson:', lesson);
    
    // Reset to first problem
    setCurrentProblemIndex(0);
    
    // Load the first problem image for this lesson
    const firstProblem = lesson.problems[0];
    if (firstProblem) {
      loadProblemImage(firstProblem.imageFile);
    }
    
    setSelectedLesson(lessonId);
    setTransitionLesson(lesson.title);
    setShowTransition(true);
    setIsManualDisconnect(false);
    console.log('Starting transition for:', lesson.title);
  };

  const handleTransitionComplete = () => {
    console.log('Transition completed, showing lesson entry popup...');
    setShowTransition(false);
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

  const handleToolChange = (tool: 'pencil' | 'eraser' | 'text' | 'select') => {
    setCurrentTool(tool);
    
    // Notify real-time canvas of tool change
    if (realtimeCanvas && canvasImageData) {
      realtimeCanvas.handleCanvasEvent({
        type: 'tool_change',
        timestamp: Date.now(),
        data: { tool }
      }, canvasImageData);
    }
  };

  const handleClear = () => {
    // Clear canvas state and notify real-time system
    console.log('Clear requested');
    setCanvasImageData('');
    
    // Clear placed manipulatives from the new system
    setPlacedManipulatives([]);
    
    if (realtimeCanvas) {
      realtimeCanvas.handleCanvasEvent({
        type: 'clear',
        timestamp: Date.now()
      }, ''); // Empty canvas
    }
  };

  const handleAddManipulative = (type: 'fraction-bar' | 'number-line' | 'area-model' | 'array-grid' | 'fraction-circles' | 'visual-number-line' | 'pizza') => {
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
  
  // Problem navigation handlers
  const handleNextProblem = () => {
    if (!selectedLesson) return;
    
    const lesson = lessons[selectedLesson];
    if (currentProblemIndex < lesson.problems.length - 1) {
      const nextIndex = currentProblemIndex + 1;
      const nextProblem = lesson.problems[nextIndex];
      
      // Clear canvas for new problem
      handleClear();
      
      // Load new problem image
      loadProblemImage(nextProblem.imageFile);
      
      // Update problem index
      setCurrentProblemIndex(nextIndex);
      
      // Reset to Act 1 for new problem
      useThreeActStore.getState().setAct('act1');
      
      // Update context cards
      contextCards.addCard(ContextCardSystem.getNarrativeCard(nextProblem.narrativeKey));
      contextCards.addCard(ContextCardSystem.getActCard('act1'));
      
      // Notify Pi about new problem
      if (client && connected) {
        client.send({
          text: `[NEW PROBLEM] Moving to problem ${nextIndex + 1}: "${nextProblem.title}". Share the new story!`
        });
      }
    }
  };
  
  const handlePreviousProblem = () => {
    if (!selectedLesson || currentProblemIndex === 0) return;
    
    const lesson = lessons[selectedLesson];
    const prevIndex = currentProblemIndex - 1;
    const prevProblem = lesson.problems[prevIndex];
    
    // Clear canvas
    handleClear();
    
    // Load previous problem image
    loadProblemImage(prevProblem.imageFile);
    
    // Update problem index
    setCurrentProblemIndex(prevIndex);
    
    // Reset to Act 1
    useThreeActStore.getState().setAct('act1');
    
    // Update context cards
    contextCards.addCard(ContextCardSystem.getNarrativeCard(prevProblem.narrativeKey));
    contextCards.addCard(ContextCardSystem.getActCard('act1'));
  };
  
  const handleFinishLesson = () => {
    // End session
    handleDisconnect();
    
    // Could show a completion screen or redirect to lesson selection
    alert(`Great job completing the ${lessons[selectedLesson!].title} lesson!`);
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
    
    // Notify real-time canvas of manipulative movement
    if (realtimeCanvas && canvasImageData) {
      const manipulative = placedManipulatives.find(m => m.id === id);
      if (manipulative) {
        realtimeCanvas.handleCanvasEvent({
          type: 'manipulative_move',
          timestamp: Date.now(),
          data: { 
            type: manipulative.tool.name,
            x: newX, 
            y: newY,
            id 
          }
        }, canvasImageData);
      }
    }
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
        {process.env.REACT_APP_USE_ADK === 'true' && (
          <button
            onClick={async () => {
              const { AdkClient } = await import('./lib/adkClient');
              const adk = new AdkClient();
              adk.on((e) => console.log('[ADK]', e));
              await adk.connect();
              const rtt = await adk.ping();
              console.log(`[ADK] RTT ~${Math.round(rtt)}ms`);
              adk.sendText('Hello from Simili!');
            }}
            style={{ marginLeft: 12 }}
          >
            Connect ADK (POC)
          </button>
        )}
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

              {/* Floating Toolbar */}
              <FloatingToolbar
                currentTool={currentTool}
                currentColor={currentColor}
                onToolChange={handleToolChange}
                onColorChange={setCurrentColor}
                onClear={handleClear}
                onAddManipulative={handleAddManipulative}
              />
              
              {/* Problem Navigator */}
              {selectedLesson && (
                <ProblemNavigator
                  lessonId={selectedLesson}
                  currentProblemIndex={currentProblemIndex}
                  onNextProblem={handleNextProblem}
                  onPreviousProblem={handlePreviousProblem}
                  onFinishLesson={handleFinishLesson}
                />
              )}
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
      
      {/* Act transition overlay */}
      <ActTransition />
      
      {/* Audio output for Pi's voice */}
      <AudioOutput />
      
      {/* Microphone input for Gemini Live */}
      {connected && <VoiceInput />}
      
      {/* Debug panel (development only) */}
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
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