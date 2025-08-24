// Sample problems for each lesson
export interface Problem {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  imageUrl?: string;
  content: string;
  hints: string[];
  targetConcepts: string[];
}

export const sampleProblems: Problem[] = [
  // Introduction to Fractions
  {
    id: 'pizza-sharing',
    lessonId: 'intro-fractions',
    title: 'Pizza Party',
    description: 'Share pizza equally among friends',
    content: 'You have 2 pizzas. You need to share them equally among 4 friends. How much pizza does each friend get?',
    hints: [
      'Think about how many total slices you need',
      'Each pizza can be cut into equal parts',
      'Draw the pizzas and show how you would cut them'
    ],
    targetConcepts: ['equal parts', 'fair sharing', 'fraction as division']
  },
  {
    id: 'chocolate-bar',
    lessonId: 'intro-fractions',
    title: 'Chocolate Bar Sharing',
    description: 'Understanding parts of a whole',
    content: 'Maya has a chocolate bar with 12 squares. She eats 3 squares. What fraction of the chocolate bar did Maya eat?',
    hints: [
      'Count the total number of squares',
      'Count how many squares Maya ate',
      'A fraction shows part over whole'
    ],
    targetConcepts: ['parts of a whole', 'numerator', 'denominator']
  },

  // Equivalent Fractions
  {
    id: 'pattern-blocks',
    lessonId: 'equivalent-fractions',
    title: 'Pattern Block Puzzle',
    description: 'Find different ways to cover the same area',
    content: 'Use pattern blocks to show that 1/2 is the same as 2/4. Draw or use manipulatives to prove it!',
    hints: [
      'Start with a shape that represents 1 whole',
      'Show 1/2 using one color',
      'Can you cover the same space with smaller pieces?'
    ],
    targetConcepts: ['equivalent fractions', 'visual models', 'same size different pieces']
  },
  {
    id: 'folding-paper',
    lessonId: 'equivalent-fractions',
    title: 'Paper Folding',
    description: 'Discover equivalent fractions by folding',
    content: 'Fold a paper in half and color one part. Now fold it in half again. How many parts do you have? What fraction is colored now?',
    hints: [
      'First fold creates 2 equal parts',
      'Second fold creates more parts',
      'The colored area stays the same size'
    ],
    targetConcepts: ['equivalent fractions', 'folding', 'conservation of area']
  },

  // Comparing Fractions
  {
    id: 'race-track',
    lessonId: 'comparing-fractions',
    title: 'Race to the Finish',
    description: 'Compare distances on a race track',
    content: 'Sam ran 3/4 of the track. Alex ran 2/3 of the track. Who ran farther? Use a number line or drawing to show your thinking.',
    hints: [
      'Draw the same track for both runners',
      'Mark where each runner stopped',
      'Which mark is closer to the finish line?'
    ],
    targetConcepts: ['comparing fractions', 'number line', 'visual comparison']
  },
  {
    id: 'water-bottles',
    lessonId: 'comparing-fractions',
    title: 'Water Bottle Challenge',
    description: 'Compare amounts of water',
    content: 'Bottle A is 5/8 full. Bottle B is 3/4 full. Which bottle has more water? Both bottles are the same size.',
    hints: [
      'Draw both bottles the same size',
      'Show the water level in each',
      'You might need to find a common denominator'
    ],
    targetConcepts: ['comparing fractions', 'same whole', 'common denominators']
  },

  // Adding and Subtracting Fractions
  {
    id: 'recipe-mixing',
    lessonId: 'add-subtract-fractions',
    title: 'Making Trail Mix',
    description: 'Combine ingredients using fractions',
    content: 'A recipe calls for 1/4 cup of raisins and 2/4 cup of nuts. How many cups of ingredients is that in total?',
    hints: [
      'The denominators are already the same',
      'Add the numerators',
      'Can you simplify your answer?'
    ],
    targetConcepts: ['adding fractions', 'like denominators', 'simplifying']
  },
  {
    id: 'paint-mixing',
    lessonId: 'add-subtract-fractions',
    title: 'Art Class Paint',
    description: 'Calculate remaining paint',
    content: 'You had 7/8 of a tube of blue paint. You used 3/8 for your ocean picture. How much blue paint is left?',
    hints: [
      'This is a subtraction problem',
      'The denominators are the same',
      'Subtract the numerators'
    ],
    targetConcepts: ['subtracting fractions', 'like denominators', 'remainder']
  },

  // Fractions on Number Line
  {
    id: 'number-line-hops',
    lessonId: 'fractions-number-line',
    title: 'Frog Hops',
    description: 'Place fractions on a number line',
    content: 'A frog starts at 0 and makes jumps of 1/3. Where will the frog be after 4 jumps? Show on a number line.',
    hints: [
      'Each jump is 1/3 of a unit',
      'Count 4 jumps of 1/3',
      'You can also add: 1/3 + 1/3 + 1/3 + 1/3'
    ],
    targetConcepts: ['fractions on number line', 'repeated addition', 'improper fractions']
  },
  {
    id: 'temperature-line',
    lessonId: 'fractions-number-line',
    title: 'Temperature Reading',
    description: 'Read fractions on a thermometer',
    content: 'The thermometer shows marks at every 1/4 degree. If the temperature is at the 3rd mark after 2, what is the temperature?',
    hints: [
      'Start at 2 on the number line',
      'Each mark represents 1/4',
      'Count 3 marks of 1/4'
    ],
    targetConcepts: ['number line', 'fractional units', 'mixed numbers']
  }
];

// Helper function to get problems for a specific lesson
export function getProblemsForLesson(lessonId: string): Problem[] {
  return sampleProblems.filter(problem => problem.lessonId === lessonId);
}

// Helper function to get a random problem for a lesson
export function getRandomProblem(lessonId: string): Problem | undefined {
  const problems = getProblemsForLesson(lessonId);
  if (problems.length === 0) return undefined;
  return problems[Math.floor(Math.random() * problems.length)];
}