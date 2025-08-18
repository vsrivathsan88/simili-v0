// Adaptive problem system - visual first, no math language until mastery
export interface VisualProblem {
  id: string;
  lessonId: string;
  level: 'explore' | 'practice' | 'extend'; // Not "easy/medium/hard"
  visualPrompt: string; // What they see
  spokenPrompt: string; // What Pi says
  manipulatives: string[]; // Suggested tools
  successCriteria: string[]; // What indicates understanding
  nextSteps: {
    onSuccess: string;
    onStruggle: string;
  };
}

export const adaptiveProblems: VisualProblem[] = [
  // Introduction to Fractions - EXPLORE level
  {
    id: 'pizza-explore',
    lessonId: 'intro-fractions',
    level: 'explore',
    visualPrompt: '🍕 🍕',
    spokenPrompt: 'Look at these pizzas! If you wanted to share them fairly with your friends, how would you do it? Show me!',
    manipulatives: ['fraction-circles', 'pencil'],
    successCriteria: ['draws equal parts', 'shows fair sharing'],
    nextSteps: {
      onSuccess: 'pizza-practice',
      onStruggle: 'pizza-explore-guided'
    }
  },
  {
    id: 'pizza-explore-guided',
    lessonId: 'intro-fractions',
    level: 'explore',
    visualPrompt: '🍕 👦👧👦👧',
    spokenPrompt: 'Here\'s one pizza and four friends. Can you draw lines to show how each friend gets the same amount?',
    manipulatives: ['fraction-circles', 'pencil'],
    successCriteria: ['creates 4 equal parts'],
    nextSteps: {
      onSuccess: 'pizza-practice',
      onStruggle: 'pizza-explore-guided'
    }
  },
  
  // PRACTICE level - building understanding
  {
    id: 'pizza-practice',
    lessonId: 'intro-fractions',
    level: 'practice',
    visualPrompt: '🍕🍕🍕 👦👦👦',
    spokenPrompt: 'Now we have 3 pizzas and 3 friends. Each friend ate some pizza. Can you show me different ways they could have eaten?',
    manipulatives: ['fraction-circles', 'fraction-bar'],
    successCriteria: ['shows multiple solutions', 'demonstrates part-whole understanding'],
    nextSteps: {
      onSuccess: 'pizza-extend',
      onStruggle: 'pizza-practice-support'
    }
  },
  
  // EXTEND level - deeper thinking
  {
    id: 'pizza-extend',
    lessonId: 'intro-fractions',
    level: 'extend',
    visualPrompt: '🍕🍕 + 🍰',
    spokenPrompt: 'At the party, there were 2 pizzas and 1 cake. More friends came! How would you share everything fairly? There\'s no right answer - show me your thinking!',
    manipulatives: ['fraction-circles', 'fraction-bar', 'pencil'],
    successCriteria: ['creative problem solving', 'explains reasoning'],
    nextSteps: {
      onSuccess: 'equivalent-explore',
      onStruggle: 'pizza-extend-discuss'
    }
  },

  // Equivalent Fractions - EXPLORE
  {
    id: 'chocolate-explore',
    lessonId: 'equivalent-fractions',
    level: 'explore',
    visualPrompt: '🍫',
    spokenPrompt: 'Look at this chocolate bar! Can you show me the same amount of chocolate in different ways?',
    manipulatives: ['fraction-bar', 'area-model'],
    successCriteria: ['shows same amount different ways'],
    nextSteps: {
      onSuccess: 'chocolate-practice',
      onStruggle: 'chocolate-explore-guided'
    }
  },

  // Number Line - Visual First
  {
    id: 'jump-explore',
    lessonId: 'fractions-number-line',
    level: 'explore',
    visualPrompt: '🐸 ___________',
    spokenPrompt: 'A frog is jumping! Each jump is the same size. Where will the frog land after different numbers of jumps?',
    manipulatives: ['visual-number-line', 'pencil'],
    successCriteria: ['shows equal jumps', 'marks landing spots'],
    nextSteps: {
      onSuccess: 'jump-practice',
      onStruggle: 'jump-explore-guided'
    }
  },

  // Comparing - Visual Only
  {
    id: 'water-explore',
    lessonId: 'comparing-fractions',
    level: 'explore',
    visualPrompt: '🥤🥤',
    spokenPrompt: 'Two cups have different amounts of water. Which has more? Show me how you know!',
    manipulatives: ['fraction-bar', 'pencil'],
    successCriteria: ['visual comparison', 'explains which is more'],
    nextSteps: {
      onSuccess: 'water-practice',
      onStruggle: 'water-explore-guided'
    }
  }
];

// Function to get next problem based on performance
export function getNextProblem(
  currentProblemId: string,
  wasSuccessful: boolean,
  attemptCount: number
): VisualProblem | undefined {
  const currentProblem = adaptiveProblems.find(p => p.id === currentProblemId);
  if (!currentProblem) return undefined;

  // After 3 attempts, always move to struggle path
  if (attemptCount >= 3 && !wasSuccessful) {
    const struggleId = currentProblem.nextSteps.onStruggle;
    return adaptiveProblems.find(p => p.id === struggleId);
  }

  const nextId = wasSuccessful 
    ? currentProblem.nextSteps.onSuccess 
    : currentProblem.nextSteps.onStruggle;
    
  return adaptiveProblems.find(p => p.id === nextId);
}

// Get starting problem for a lesson
export function getStartingProblem(lessonId: string): VisualProblem | undefined {
  return adaptiveProblems.find(p => p.lessonId === lessonId && p.level === 'explore');
}