/**
 * Lesson structure with multiple problems per lesson
 * Each lesson can have 10+ problems progressing through the concept
 */

import { problemNarratives } from './problemNarratives';

export interface Problem {
  id: string;
  title: string;
  imageFile: string;
  narrativeKey: string;
  difficulty: 'easy' | 'medium' | 'hard';
  concepts: string[];
}

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  grade: string;
  description: string;
  problems: Problem[];
}

export const lessons: Record<string, Lesson> = {
  'parts-and-wholes': {
    id: 'parts-and-wholes',
    title: 'Parts and Wholes',
    subtitle: 'Introduction to Fractions',
    grade: 'Grade 3',
    description: 'Explore how things can be divided into parts!',
    problems: [
      {
        id: 'lego-blocks-intro',
        title: "Pi's Building Blocks",
        imageFile: 'lego-blocks.svg',
        narrativeKey: 'lego-blocks',
        difficulty: 'easy',
        concepts: ['counting', 'parts', 'wholes']
      },
      {
        id: 'pizza-party-1',
        title: 'Pizza Night Mystery',
        imageFile: 'pizza-party.svg',
        narrativeKey: 'pizza-party',
        difficulty: 'easy',
        concepts: ['missing parts', 'visual fractions']
      },
      {
        id: 'cookie-jar-1',
        title: 'Cookie Detective',
        imageFile: 'cookie-jar.svg',
        narrativeKey: 'cookie-sharing',
        difficulty: 'medium',
        concepts: ['parts taken', 'remaining parts']
      },
      {
        id: 'garden-flowers-1',
        title: 'Colorful Garden',
        imageFile: 'garden-flowers.svg',
        narrativeKey: 'garden-flowers',
        difficulty: 'medium',
        concepts: ['grouping by color', 'parts of collection']
      },
      {
        id: 'toy-cars-1',
        title: 'Racing Teams',
        imageFile: 'toy-cars.svg',
        narrativeKey: 'toy-cars',
        difficulty: 'medium',
        concepts: ['comparing groups', 'parts of whole']
      },
      {
        id: 'fruit-basket-1',
        title: 'Fruit Mix-Up',
        imageFile: 'fruit-basket.svg',
        narrativeKey: 'fruit-basket',
        difficulty: 'hard',
        concepts: ['multiple groups', 'parts of mixed collection']
      },
      // Additional problems - placeholders until images are created
      {
        id: 'sharing-candies',
        title: 'Candy Sharing',
        imageFile: 'lego-blocks.svg', // Placeholder - reusing image
        narrativeKey: 'lego-blocks',
        difficulty: 'medium',
        concepts: ['equal sharing', 'parts per person']
      },
      {
        id: 'book-collection',
        title: 'Library Books',
        imageFile: 'lego-blocks.svg', // Placeholder
        narrativeKey: 'lego-blocks',
        difficulty: 'medium',
        concepts: ['categorizing', 'parts of collection']
      },
      {
        id: 'art-supplies',
        title: 'Art Box Organization',
        imageFile: 'lego-blocks.svg', // Placeholder
        narrativeKey: 'lego-blocks',
        difficulty: 'hard',
        concepts: ['multiple categories', 'complex parts']
      },
      {
        id: 'playground-games',
        title: 'Playground Teams',
        imageFile: 'lego-blocks.svg', // Placeholder
        narrativeKey: 'lego-blocks',
        difficulty: 'hard',
        concepts: ['team division', 'fair sharing']
      },
      {
        id: 'music-notes',
        title: 'Musical Patterns',
        imageFile: 'lego-blocks.svg', // Placeholder
        narrativeKey: 'lego-blocks',
        difficulty: 'hard',
        concepts: ['pattern recognition', 'parts in sequence']
      }
    ]
  },
  
  'equivalent-fractions': {
    id: 'equivalent-fractions',
    title: 'Equivalent Fractions',
    subtitle: 'Same Amount, Different Ways',
    grade: 'Grade 3',
    description: 'Discover how the same amount can look different!',
    problems: [
      // Future problems for this lesson
    ]
  },
  
  'comparing-fractions': {
    id: 'comparing-fractions',
    title: 'Comparing Fractions',
    subtitle: 'Which is Bigger?',
    grade: 'Grade 3',
    description: 'Learn to compare different fractions!',
    problems: [
      // Future problems for this lesson
    ]
  }
};

/**
 * Get a specific problem from a lesson
 */
export function getProblem(lessonId: string, problemIndex: number): Problem | null {
  const lesson = lessons[lessonId];
  if (!lesson || !lesson.problems[problemIndex]) {
    return null;
  }
  return lesson.problems[problemIndex];
}

/**
 * Get the next problem in a lesson
 */
export function getNextProblem(lessonId: string, currentProblemId: string): Problem | null {
  const lesson = lessons[lessonId];
  if (!lesson) return null;
  
  const currentIndex = lesson.problems.findIndex(p => p.id === currentProblemId);
  if (currentIndex === -1 || currentIndex === lesson.problems.length - 1) {
    return null;
  }
  
  return lesson.problems[currentIndex + 1];
}

/**
 * Check if this is the last problem in a lesson
 */
export function isLastProblem(lessonId: string, problemId: string): boolean {
  const lesson = lessons[lessonId];
  if (!lesson) return true;
  
  const currentIndex = lesson.problems.findIndex(p => p.id === problemId);
  return currentIndex === lesson.problems.length - 1;
}