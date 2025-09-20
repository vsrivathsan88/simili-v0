import React, { useState, useEffect } from 'react';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import './AdventureExperience.scss';

interface AdventureExperienceProps {
  adventureId: string;
  childName: string;
  onComplete: (completedProblems: number) => void;
  onExit: () => void;
}

type AdventureAct = 'hook' | 'development' | 'resolution';
type ProblemType = 'notice-wonder' | 'explore' | 'showcase';

interface AdventureProblem {
  id: string;
  act: AdventureAct;
  type: ProblemType;
  title: string;
  description: string;
  piIntroduction: string;
  expectedAnswer?: string;
  hints: string[];
  encouragement: string[];
}

const AdventureExperience: React.FC<AdventureExperienceProps> = ({
  adventureId,
  childName,
  onComplete,
  onExit
}) => {
  const { client, connected } = useLiveAPIContext();
  const [currentAct, setCurrentAct] = useState<AdventureAct>('hook');
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [completedProblems, setCompletedProblems] = useState<string[]>([]);
  const [showActTransition, setShowActTransition] = useState(false);

  // Dan Meyer Three-Act Adventure Structure - Cookie Factory
  const adventureProblems: AdventureProblem[] = [
    // Act I: The Hook - Create curiosity and mathematical conflict
    {
      id: 'hook-1',
      act: 'hook',
      type: 'notice-wonder',
      title: 'The Cookie Factory Mystery',
      description: 'A compelling visual problem that sparks mathematical curiosity',
      piIntroduction: `${childName ? `${childName}, ` : ''}look at my cookie factory! Something interesting is happening here. What do you notice?`,
      hints: [], // No hints in Act I - pure observation
      encouragement: ['I love how you\'re observing!', 'Your noticing is so important!', 'Keep wondering!']
    },

    // Act II: Development - Student-driven resource discovery
    {
      id: 'develop-1',
      act: 'development',
      type: 'explore',
      title: 'Tools for Cookie Sharing',
      description: 'Students discover they need tools to resolve the mathematical conflict',
      piIntroduction: `You\'re wondering about fair sharing! What tools might help you figure this out?`,
      hints: ['What could help you make equal parts?', 'Would drawing help you think about this?'],
      encouragement: ['Great exploration!', 'I see you thinking!', 'You\'re discovering tools!']
    },
    {
      id: 'develop-2',
      act: 'development',
      type: 'explore',
      title: 'Solving the Cookie Conflict',
      description: 'Active problem-solving with newfound tools and strategies',
      piIntroduction: `Now you have tools! Let\'s work together to solve our cookie factory problem.`,
      hints: ['Use what you discovered', 'Your drawing is helping you think'],
      encouragement: ['Amazing problem solving!', 'You\'re figuring it out!', 'Look at that progress!']
    },

    // Act III: Resolution - Satisfying conclusion and extensions
    {
      id: 'resolve-1',
      act: 'resolution',
      type: 'showcase',
      title: 'The Big Reveal',
      description: 'Celebrating discoveries and explaining thinking',
      piIntroduction: `${childName ? `${childName}, ` : ''}you solved the cookie factory mystery! How did you figure that out?`,
      hints: [], // No hints needed - celebration time
      encouragement: ['Incredible thinking!', 'You\'re a mathematical detective!', 'That was brilliant!']
    },
    {
      id: 'resolve-2',
      act: 'resolution',
      type: 'showcase',
      title: 'Cookie Factory Sequel',
      description: 'Extension problems that continue the adventure',
      piIntroduction: `You mastered fair sharing! Ready for the next cookie factory adventure?`,
      hints: [], // Extensions are for exploration, not directed hints
      encouragement: ['Ready for more adventures!', 'You\'re becoming a cookie expert!', 'Let\'s keep exploring!']
    }
  ];

  const currentProblem = adventureProblems[currentProblemIndex];
  const totalProblems = adventureProblems.length;
  const progressPercentage = (completedProblems.length / totalProblems) * 100;

  // Act transition detection
  useEffect(() => {
    if (currentProblem && completedProblems.length > 0) {
      const lastCompletedIndex = adventureProblems.findIndex(p => p.id === completedProblems[completedProblems.length - 1]);
      const lastCompleted = adventureProblems[lastCompletedIndex];

      if (lastCompleted && currentProblem.act !== lastCompleted.act) {
        setShowActTransition(true);
        setTimeout(() => setShowActTransition(false), 3000);
      }
    }
  }, [currentProblem, completedProblems, adventureProblems]);

  // Send Dan Meyer context to Pi with problem introduction
  useEffect(() => {
    if (connected && currentProblem) {
      setTimeout(() => {
        const danMeyerContext = getDanMeyerContext(currentProblem.act, currentProblem);
        client.send({
          text: `${danMeyerContext}

${currentProblem.piIntroduction}`
        });
      }, 1000);
    }
  }, [connected, currentProblem, client]);

  const getDanMeyerContext = (act: AdventureAct, problem: AdventureProblem): string => {
    switch (act) {
      case 'hook':
        return `[ACT I: THE HOOK - CURIOSITY MODE]
Current Adventure: Cookie Factory Fractions
Mathematical Conflict: Fair sharing problem that needs resolution

CANVAS STATUS: View-only (student can observe, not interact)
TOOLS AVAILABLE: None - DO NOT mention any tools or manipulatives
GOAL: Create intellectual conflict and genuine mathematical curiosity

YOUR FOCUS:
- Ask wonder questions: "What do you notice?" "What makes you curious?"
- Reference the cookie factory story to create emotional connection
- Build suspense about the mathematical conflict
- NEVER give solutions or suggest problem-solving strategies

FORBIDDEN PHRASES: "Let's use...", "Try drawing...", "The answer is...", "We need to..."`;

      case 'development':
        return `[ACT II: DEVELOPMENT - EXPLORATION MODE]
Mathematical Conflict Established: Fair cookie sharing
Student Curiosity Level: Engaged and wondering

CANVAS STATUS: Active - student can draw, manipulate, and explore
TOOLS AVAILABLE: Drawing tools, fraction manipulatives, pizza slicer
CANVAS STATE: Monitor for drawings and manipulative use

GOAL: Guide student-driven discovery of tools and strategies

YOUR FOCUS:
- Monitor canvas activity: "I see you drew something! Tell me about your thinking."
- Suggest tools only when student expresses need or confusion
- Use focusing questions (95%): "What are you thinking?" "How does that help?"
- Use funneling questions (5%) only if student shows anxiety

CANVAS INTEGRATION:
- Reference their visual work to validate thinking
- Connect drawings/manipulatives to mathematical concepts
- Celebrate attempts and iterations

IF STUDENT IS STUCK: Guide them to express what they need, then suggest appropriate tools`;

      case 'resolution':
        return `[ACT III: RESOLUTION - SHOWCASE MODE]
Problem Status: Student has made discoveries about fair sharing
Student Journey: Used tools and thinking to explore the conflict
Tools Used: Drawing, manipulatives, and mathematical reasoning

CANVAS STATUS: Showcase mode - highlight final work
GOAL: Celebrate process, create satisfying resolution, offer extensions

YOUR FOCUS:
- Metacognition: "How did you figure that out?" "Walk me through your thinking."
- Process celebration: Highlight their strategies, not just correct answers
- Visual resolution: "Look what you discovered! Let's see the big picture."
- Extensions: "Ready for the next adventure? What if we had 3 friends instead of 2?"

CELEBRATION LEVELS:
- Good Try: "You explored so many ideas! I love how you kept thinking."
- Solid Work: "Amazing problem solving! You really figured that out step by step."
- Breakthrough: "Incredible! You just discovered something mathematicians use all the time!"`;
    }
  };

  const handleProblemComplete = () => {
    if (currentProblem && !completedProblems.includes(currentProblem.id)) {
      const newCompleted = [...completedProblems, currentProblem.id];
      setCompletedProblems(newCompleted);

      if (currentProblemIndex < adventureProblems.length - 1) {
        setCurrentProblemIndex(currentProblemIndex + 1);
      } else {
        // Adventure complete!
        setTimeout(() => {
          onComplete(newCompleted.length);
        }, 2000);
      }
    }
  };

  const getActTitle = (act: AdventureAct): string => {
    switch (act) {
      case 'hook': return 'Act I: The Hook';
      case 'development': return 'Act II: Development';
      case 'resolution': return 'Act III: Resolution';
    }
  };

  const getActDescription = (act: AdventureAct): string => {
    switch (act) {
      case 'hook': return 'What do you notice? What are you wondering?';
      case 'development': return 'Discovering tools to solve the mathematical conflict';
      case 'resolution': return 'Celebrating discoveries and extending learning';
    }
  };

  if (!currentProblem) {
    return (
      <div className="adventure-experience adventure-complete">
        <div className="completion-celebration">
          <h1>🎉 Adventure Complete! 🎉</h1>
          <p>{childName ? `Congratulations ${childName}!` : 'Congratulations!'} You completed all {totalProblems} problems!</p>
          <button onClick={() => onComplete(completedProblems.length)}>
            Return to Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="adventure-experience">
      {/* Act Transition Overlay */}
      {showActTransition && (
        <div className="act-transition-overlay">
          <div className="act-transition-content">
            <h2>{getActTitle(currentProblem.act)}</h2>
            <p>{getActDescription(currentProblem.act)}</p>
            <div className="transition-animation">✨</div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="adventure-header">
        <div className="progress-section">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="progress-text">
            {completedProblems.length}/{totalProblems} completed
          </span>
        </div>

        <button className="exit-btn" onClick={onExit}>
          Exit Adventure
        </button>
      </header>

      {/* Current Problem */}
      <main className="adventure-main">
        <div className="problem-container">
          <div className="act-indicator">
            <span className="act-badge">{getActTitle(currentProblem.act)}</span>
            <span className="problem-type">{currentProblem.type}</span>
          </div>

          <div className="problem-content">
            <h1 className="problem-title">{currentProblem.title}</h1>
            <p className="problem-description">{currentProblem.description}</p>

            {/* Canvas Area - Placeholder for now */}
            <div className="problem-workspace">
              <div className="canvas-placeholder">
                <div className="pi-avatar">
                  <img
                    src="/assets/pi-headphones.png"
                    alt="Pi is here to help"
                    className="pi-image talking"
                  />
                </div>
                <div className="workspace-content">
                  <h3>Work on your problem here!</h3>
                  <p>Draw, talk to Pi, and solve the challenge together.</p>
                  <p className="pi-hint">💡 Pi is listening and ready to help!</p>
                </div>
              </div>
            </div>

            {/* Problem Actions - Dan Meyer Framework */}
            <div className="problem-actions">
              {currentProblem.act === 'hook' && (
                <button
                  className="wonder-btn"
                  onClick={() => {
                    if (connected) {
                      client.send({ text: `The child is engaging with the visual problem. Ask a follow-up wonder question to deepen their curiosity about the mathematical conflict.` });
                    }
                  }}
                >
                  🤔 Tell Pi what you're wondering
                </button>
              )}

              {currentProblem.act === 'development' && (
                <>
                  <button
                    className="hint-btn"
                    onClick={() => {
                      if (connected) {
                        client.send({ text: `The child is asking for help. Use a focusing question to guide their thinking: "What are you thinking about?" or "What might help you explore this?"` });
                      }
                    }}
                  >
                    💡 Ask Pi for guidance
                  </button>

                  <button
                    className="canvas-btn"
                    onClick={() => {
                      if (connected) {
                        client.send({ text: `[CANVAS ALERT] Student wants to use drawing tools. Acknowledge their initiative: "Great idea to draw! What are you thinking about sketching?"` });
                      }
                    }}
                  >
                    ✏️ I want to draw something
                  </button>
                </>
              )}

              {currentProblem.act === 'resolution' && (
                <button
                  className="explain-btn"
                  onClick={() => {
                    if (connected) {
                      client.send({ text: `The child is ready to explain their thinking. Ask them to walk you through their mathematical journey: "How did you figure that out? Tell me about your thinking!"` });
                    }
                  }}
                >
                  🎯 Explain my thinking
                </button>
              )}

              <button
                className="complete-btn"
                onClick={handleProblemComplete}
              >
                ✅ Ready for next part!
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdventureExperience;