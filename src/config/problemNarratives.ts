/**
 * Kid-friendly problem narratives that avoid math jargon
 * These stories create context and motivation for mathematical thinking
 */

export const problemNarratives = {
  'lego-blocks': {
    title: "Pi's Building Challenge",
    narrative: `Hey! I'm trying to build something super cool with these LEGO blocks, but I need your help figuring something out. 
    
I have some blue blocks and some gray blocks here. My friend said I should use "some of the blue ones" for the special part of my creation, but I'm not sure what that means!

Can you help me look at what I've got and figure this out together?`,
    followUp: "I love building things! What do you like to build?",
    contextualHints: [
      "Sometimes when I'm building, I like to sort my blocks by color first.",
      "My friend who's really good at building always counts their pieces before starting.",
      "I wonder if there's a pattern here..."
    ]
  },
  
  'pizza-party': {
    title: "Pizza Night Mystery",
    narrative: `Guess what? We're having a pizza party and something funny happened!
    
My friends and I ordered pizza, but when it arrived, some slices were already missing! The delivery person said they didn't eat any (I believe them), so it's a real mystery.

Can you help me figure out what's going on with our pizza? I want to make sure everyone gets their fair share!`,
    followUp: "What's your favorite pizza topping?",
    contextualHints: [
      "I always check how many slices come in a whole pizza first.",
      "Maybe if we look at what's left, we can solve the mystery!",
      "Fair sharing is important at parties!"
    ]
  },
  
  'cookie-sharing': {
    title: "The Cookie Jar Adventure",
    narrative: `Oh no! I was saving cookies in my special jar for movie night, but my little sister found them!
    
She says she only took "a tiny bit" but the jar looks pretty different to me. I'm not mad (okay, maybe a little), but I am curious about what really happened.

Want to be a cookie detective with me and figure out this mystery?`,
    followUp: "Do you have any siblings who 'borrow' your snacks?",
    contextualHints: [
      "Detective work means looking at all the clues!",
      "Sometimes 'a tiny bit' means different things to different people.",
      "I wonder how many cookies were there before..."
    ]
  },
  
  'garden-flowers': {
    title: "Pi's Colorful Garden",
    narrative: `I'm SO excited! I just planted a garden with different colored flowers, and they're starting to bloom!
    
Some are yellow, some are purple, and I want to make a beautiful pattern. But I'm not sure how to describe what I see to my friend who wants to plant their own garden.

Can you help me figure out a way to talk about my flower garden?`,
    followUp: "Have you ever grown anything? Even in a cup by the window?",
    contextualHints: [
      "Gardens are like nature's patterns!",
      "Sometimes I group flowers by color to see what I have.",
      "My grandma always counts her plants to keep track."
    ]
  },
  
  'toy-cars': {
    title: "Racing Car Championship",
    narrative: `Wow! I'm organizing a big racing championship with my toy cars, and I need your help!
    
I have red racing cars and blue racing cars, and I want to make sure the teams are fair. But I'm getting all mixed up trying to figure out how many of each color I have.

Want to help me organize this awesome race?`,
    followUp: "Do you have a favorite color for race cars?",
    contextualHints: [
      "Sometimes sorting by color helps me see better!",
      "Race car drivers always check their team sizes.",
      "I wonder which color has more cars..."
    ]
  },
  
  'fruit-basket': {
    title: "Fruit Basket Mix-Up",
    narrative: `Oh no! I was helping make a fruit salad, and I accidentally mixed up all the fruits in the basket!
    
There are apples, bananas, and oranges all jumbled together. My recipe needs to know what we have, but everything's such a colorful mess!

Can you help me figure out what's in our fruit basket?`,
    followUp: "What's your favorite fruit for a snack?",
    contextualHints: [
      "Different fruits have different colors!",
      "Sometimes I sort fruits before counting.",
      "I wonder which fruit we have the most of..."
    ]
  }
};

// Helper to get narrative by problem type
export function getNarrative(problemType: string) {
  return problemNarratives[problemType as keyof typeof problemNarratives] || problemNarratives['lego-blocks'];
}

// Helper to get a contextual hint based on student progress
export function getContextualHint(problemType: string, hintIndex: number = 0) {
  const narrative = getNarrative(problemType);
  return narrative.contextualHints[Math.min(hintIndex, narrative.contextualHints.length - 1)];
}