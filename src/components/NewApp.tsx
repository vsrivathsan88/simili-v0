import React, { useState, useEffect } from 'react';
import { LiveAPIProvider } from '../contexts/LiveAPIContext';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { PI_SYSTEM_INSTRUCTION } from '../config/piTutor';
import { VoiceInput } from './VoiceInput';
import OnboardingFlow from './OnboardingFlow';
import AdventureHub from './AdventureHub';
import LessonTransition from './LessonTransition';
import LessonEntryPopup from './LessonEntryPopup';
import AdventureExperience from './AdventureExperience';
import './NewApp.scss';

type AppScreen = 'onboarding' | 'hub' | 'transition' | 'adventure-entry' | 'adventure';

interface UserProgress {
  hasCompletedOnboarding: boolean;
  childName: string;
  adventures: {
    [adventureId: string]: {
      isUnlocked: boolean;
      problemsCompleted: number;
      totalProblems: number;
    };
  };
}

// Inner component that has access to LiveAPI context
const NewAppContent: React.FC = () => {
  const { setConfig } = useLiveAPIContext();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('onboarding');
  const [selectedAdventure, setSelectedAdventure] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    hasCompletedOnboarding: false,
    childName: '',
    adventures: {
      'cookie-factory': {
        isUnlocked: true,
        problemsCompleted: 0,
        totalProblems: 7
      },
      'space-station': {
        isUnlocked: false,
        problemsCompleted: 0,
        totalProblems: 6
      },
      'underwater-city': {
        isUnlocked: false,
        problemsCompleted: 0,
        totalProblems: 5
      },
      'enchanted-forest': {
        isUnlocked: false,
        problemsCompleted: 0,
        totalProblems: 8
      }
    }
  });

  // Configure Gemini Live based on current screen
  useEffect(() => {
    const childNameText = userProgress.childName ? `The child's name is ${userProgress.childName}. ` : '';

    let systemText = '';

    if (currentScreen === 'adventure') {
      // Adventure mode - Pi uses Dan Meyer three-act math framework
      systemText = `You are Pi, a mathematical adventure guide for kids aged 6-10 using Dan Meyer's three-act storytelling approach! You're helping ${userProgress.childName || 'your friend'} discover math through exciting narrative conflicts.

${childNameText}MULTIMODAL AWARENESS:
You receive THREE types of input simultaneously:
1. **Voice**: ${userProgress.childName || 'The child'}'s spoken words, questions, and mathematical thinking
2. **Problem Image**: The current adventure scenario that creates mathematical conflict
3. **Canvas State**: What they've drawn, erased, or created with manipulatives

CORE PERSONALITY:
- Speak like their coolest adventure buddy: "Whoa!", "No way!", "That's so cool!", "Amazing!"
- Get genuinely excited about mathematical discoveries and their thinking process
- Use ${userProgress.childName || 'their name'} frequently - kids love hearing their name!
- Be patient, encouraging, and celebrate mistakes as learning opportunities

CANVAS INTERACTION PROTOCOL:
- Monitor when they draw, use manipulatives, or interact with tools
- Reference their visual work: "I see you drew circles!" "Cool pizza slices!"
- Connect their canvas work to mathematical concepts
- Suggest canvas tools only when pedagogically appropriate for current act

CONVERSATION PATTERN:
- Keep responses 1-2 enthusiastic sentences maximum
- Ask one focusing question at a time
- Use conversational, age-appropriate language
- Focus on their thinking process, not just correct answers
- Match their energy level while guiding mathematical discovery

THREE-ACT FRAMEWORK:
Your behavior adapts based on context messages that specify:
- Current Act (Hook/Development/Resolution)
- Canvas status (view-only vs. active)
- Available tools and when to mention them
- Mathematical conflict and adventure theme
- Specific pedagogical focus for this moment

RESPONSE PRIORITY:
1. Reference canvas activity if they just drew/manipulated something
2. Ask wonder/focusing questions appropriate to current act
3. Maintain adventure narrative while serving mathematical learning
4. Keep it short, enthusiastic, and student-centered`;
    } else {
      // Onboarding mode - Pi is meeting them for the first time
      systemText = `You are Pi, a quirky and magical adventure buddy for kids aged 6-10! You're meeting a new friend for the very first time during onboarding. You wear headphones and love to chat!

${childNameText}Your personality:
- Super excited, a bit silly, and LOVES making friends
- Talk like their coolest friend with lots of "Whoa!", "Amazing!", "That's so cool!"
- Use fun expressions like "No way!", "You bet!", "Oh my gosh!", "That's awesome!"
- Get genuinely excited when kids talk to you - like a puppy meeting someone new
- Be a little dramatic and over-the-top in the best way

During onboarding:
1. When you first connect, be SUPER excited: "WHOA! Hi there! I'm Pi and OH MY GOSH I'm SO excited to meet you!"
2. Ask their name with enthusiasm: "What's your name, my new adventure buddy?"
3. When they tell you their name, repeat it back with excitement: "Sarah?! That's such a cool name! Hi Sarah!"
4. Ask them to say something fun so you can test if you can hear them properly
5. When they respond, be amazed: "Whoa! I can hear you perfectly! That's so awesome!"
6. Get excited about adventures together: "We're gonna have the BEST adventures together!"

IMPORTANT:
- Always use their name once you learn it - kids LOVE hearing their name!
- Keep it short but enthusiastic - 1-2 excited sentences
- Don't mention math or lessons - this is about friendship and adventures
- Be genuine in your excitement - kids can tell when you're really excited to talk to them

Your catchphrases: "No way!", "That's so cool!", "Oh my gosh!", "Amazing!", "You bet!"`;
    }

    setConfig({
      systemInstruction: {
        parts: [{ text: systemText }]
      },
      tools: []
    });
  }, [setConfig, userProgress.childName, currentScreen]);

  // Check for existing user progress on load
  useEffect(() => {
    const savedProgress = localStorage.getItem('simili-user-progress');
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setUserProgress(progress);

        // Skip onboarding if user has completed it
        if (progress.hasCompletedOnboarding) {
          setCurrentScreen('hub');
        }
      } catch (error) {
        console.error('Failed to parse saved progress:', error);
      }
    }
  }, []);

  // Save progress whenever it changes
  useEffect(() => {
    localStorage.setItem('simili-user-progress', JSON.stringify(userProgress));
  }, [userProgress]);

  const handleNameCapture = (name: string) => {
    setUserProgress(prev => ({
      ...prev,
      childName: name
    }));
  };

  const handleProgressUpdate = (adventureId: string, progress: { problemsCompleted: number }) => {
    setUserProgress(prev => ({
      ...prev,
      adventures: {
        ...prev.adventures,
        [adventureId]: {
          ...prev.adventures[adventureId],
          problemsCompleted: progress.problemsCompleted
        }
      }
    }));
  };

  const handleOnboardingComplete = () => {
    setUserProgress(prev => ({
      ...prev,
      hasCompletedOnboarding: true
    }));
    setCurrentScreen('hub');
  };

  const handleAdventureSelect = (adventureId: string) => {
    setSelectedAdventure(adventureId);
    setCurrentScreen('transition');
  };

  const handleTransitionComplete = () => {
    setCurrentScreen('adventure-entry');
  };

  const handleAdventureStart = () => {
    setCurrentScreen('adventure');
  };

  const handleAdventureComplete = (completedProblems: number) => {
    if (selectedAdventure) {
      // Update progress with completed problems
      handleProgressUpdate(selectedAdventure, { problemsCompleted: completedProblems });
    }
    setSelectedAdventure(null);
    setCurrentScreen('hub');
  };

  const handleAdventureExit = () => {
    setSelectedAdventure(null);
    setCurrentScreen('hub');
  };

  const handleAdventureCancel = () => {
    setSelectedAdventure(null);
    setCurrentScreen('hub');
  };

  const getAdventureTitle = (adventureId: string): string => {
    const adventureTitles: { [key: string]: string } = {
      'cookie-factory': 'Cookie Factory Adventure',
      'space-station': 'Space Station Mission',
      'underwater-city': 'Underwater City',
      'enchanted-forest': 'Enchanted Forest'
    };
    return adventureTitles[adventureId] || 'Adventure';
  };

  return (
    <div className="new-app">
        {/* Voice Input - Always active when connected to enable 2-way communication */}
        <VoiceInput />

        {/* Onboarding Flow - First time users only */}
        {currentScreen === 'onboarding' && (
          <OnboardingFlow
            onComplete={handleOnboardingComplete}
            onNameCapture={handleNameCapture}
            childName={userProgress.childName}
          />
        )}

        {/* Adventure Hub - Main experience */}
        {currentScreen === 'hub' && (
          <AdventureHub
            onAdventureSelect={handleAdventureSelect}
            userProgress={userProgress}
            onProgressUpdate={handleProgressUpdate}
          />
        )}

        {/* Transition Animation */}
        {currentScreen === 'transition' && selectedAdventure && (
          <LessonTransition
            isActive={true}
            lessonTitle={getAdventureTitle(selectedAdventure)}
            onComplete={handleTransitionComplete}
          />
        )}

        {/* Adventure Entry Popup */}
        {currentScreen === 'adventure-entry' && selectedAdventure && (
          <LessonEntryPopup
            isOpen={true}
            lessonTitle={getAdventureTitle(selectedAdventure)}
            onStart={handleAdventureStart}
            onCancel={handleAdventureCancel}
          />
        )}

        {/* Adventure Experience */}
        {currentScreen === 'adventure' && selectedAdventure && (
          <AdventureExperience
            adventureId={selectedAdventure}
            childName={userProgress.childName}
            onComplete={handleAdventureComplete}
            onExit={handleAdventureExit}
          />
        )}

        {/* Debug Info (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-panel">
            <h4>Debug Info</h4>
            <p>Current Screen: {currentScreen}</p>
            <p>Selected Adventure: {selectedAdventure || 'None'}</p>
            <p>Child Name: {userProgress.childName || 'Not set'}</p>
            <p>Onboarding Complete: {userProgress.hasCompletedOnboarding ? 'Yes' : 'No'}</p>

            <div className="debug-progress">
              <h5>Adventure Progress:</h5>
              {Object.entries(userProgress.adventures).map(([id, progress]) => (
                <div key={id} style={{ marginBottom: '8px' }}>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}>
                    {id}: {progress.problemsCompleted}/{progress.totalProblems}
                    {progress.isUnlocked ? ' 🔓' : ' 🔒'}
                  </p>
                  <button
                    onClick={() => handleProgressUpdate(id, { problemsCompleted: progress.totalProblems })}
                    style={{ fontSize: '10px', padding: '2px 6px', marginRight: '4px' }}
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => handleProgressUpdate(id, { problemsCompleted: 0 })}
                    style={{ fontSize: '10px', padding: '2px 6px' }}
                  >
                    Reset
                  </button>
                </div>
              ))}
            </div>

            <button onClick={() => {
              localStorage.removeItem('simili-user-progress');
              window.location.reload();
            }}>
              Reset All Progress
            </button>
          </div>
        )}
      </div>
  );
};

// Wrapper component that provides LiveAPI context
const NewApp: React.FC = () => {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';

  return (
    <LiveAPIProvider options={{ apiKey }}>
      <NewAppContent />
    </LiveAPIProvider>
  );
};

export default NewApp;