// Adventure definitions for narrative-driven lessons

export interface Adventure {
  id: string;
  title: string;
  description: string;
  mathTopic: string;
  gradeLevel: string;
  story: {
    setting: string;
    characters: string[];
    hook: string;
    conflict: string;
    resolution: string;
  };
  acts: {
    discovery: AdventureAct;
    challenge: AdventureAct;
    resolution: AdventureAct;
  };
  assets: {
    backgrounds: string[];
    characters: string[];
    interactive_elements: string[];
  };
  piPersonality: {
    opening_line: string;
    encouraging_phrases: string[];
    celebration_message: string;
    callback_phrase: string;
  };
}

export interface AdventureAct {
  title: string;
  description: string;
  pi_dialogue: string[];
  visual_scene: string;
  math_focus: string;
  expected_student_actions: string[];
  success_criteria: string[];
}

// Pi's Magic Bakery - Introduction to Fractions
export const FRACTIONS_BAKERY_ADVENTURE: Adventure = {
  id: "fractions-bakery",
  title: "Pi's Magic Bakery",
  description: "Help Pi share star-cookies fairly among cloud friends!",
  mathTopic: "fractions",
  gradeLevel: "2-4",

  story: {
    setting: "A floating cloud bakery with rainbow ovens and magical ingredients",
    characters: ["Pi (baker)", "Cloud Bunny", "Sparkle Bird", "Rainbow Sheep", "Storm Cat"],
    hook: "Pi has baked special star-cookies but needs help sharing them fairly",
    conflict: "More friends keep arriving, making fair sharing more challenging",
    resolution: "Everyone gets equal pieces and celebrates with a cloud dance"
  },

  acts: {
    discovery: {
      title: "The Bakery Discovery",
      description: "Pi introduces the magical bakery and the sharing challenge",
      pi_dialogue: [
        "Welcome to my bakery in the clouds! I've been baking all morning!",
        "I made these amazing star-cookies for my friends, but I want everyone to get the same amount.",
        "I have 4 cookies and 3 friends coming over. Can you help me figure this out?",
        "You can draw on your canvas to show me your ideas!"
      ],
      visual_scene: "cloud-bakery-intro",
      math_focus: "Understanding equal sharing and fair distribution",
      expected_student_actions: [
        "Observes the initial problem setup",
        "Begins thinking about fair sharing",
        "May start drawing or talking about strategies"
      ],
      success_criteria: [
        "Student engages with the problem",
        "Student shows understanding that sharing should be fair"
      ]
    },

    challenge: {
      title: "The Growing Challenge",
      description: "More friends arrive, complicating the sharing problem",
      pi_dialogue: [
        "Oh wow! More friends are arriving for our cookie party!",
        "Now I have 4 cookies but 8 friends total! What should we do?",
        "Some friends are big and some are tiny - do they all need the same amount?",
        "Show me your thinking! Draw it out or tell me your plan!"
      ],
      visual_scene: "cloud-bakery-friends",
      math_focus: "Exploring fractions through division and equal parts",
      expected_student_actions: [
        "Attempts different sharing strategies",
        "Draws lines to divide cookies",
        "Explains reasoning about equal parts",
        "May discover fractions naturally"
      ],
      success_criteria: [
        "Student attempts to divide cookies into equal parts",
        "Student demonstrates understanding of 'same amount' concept",
        "Student can explain their reasoning"
      ]
    },

    resolution: {
      title: "The Cookie Celebration",
      description: "Successful sharing leads to a joyful celebration",
      pi_dialogue: [
        "Wow! You figured out how to make sure everyone gets equal pieces!",
        "Look how happy my friends are! They're doing a cookie celebration dance!",
        "You're amazing at solving bakery mysteries!",
        "My friends want to know - will you help us again next time we have a bakery puzzle?"
      ],
      visual_scene: "cloud-bakery-celebration",
      math_focus: "Celebrating understanding and building confidence",
      expected_student_actions: [
        "Feels proud of accomplishment",
        "May want to explain solution again",
        "Shows interest in future adventures"
      ],
      success_criteria: [
        "Student demonstrates fraction understanding",
        "Student feels confident about problem-solving",
        "Student is engaged for future learning"
      ]
    }
  },

  assets: {
    backgrounds: [
      "cloud-bakery-intro.png",
      "cloud-bakery-problem.png",
      "cloud-bakery-friends.png",
      "cloud-bakery-celebration.png"
    ],
    characters: [
      "pi-baker-excited.png",
      "pi-baker-thinking.png",
      "pi-baker-celebrating.png",
      "cloud-bunny.png",
      "sparkle-bird.png",
      "rainbow-sheep.png",
      "storm-cat.png"
    ],
    interactive_elements: [
      "star-cookies-set.png",
      "thought-bubbles.png",
      "celebration-effects.png"
    ]
  },

  piPersonality: {
    opening_line: "Hey there! I'm Pi, and I LOVE baking adventures! Want to help me solve a cookie mystery?",
    encouraging_phrases: [
      "That's such a cool idea! Tell me more!",
      "I love how you're thinking about this!",
      "Ooh, what if we tried...",
      "You're on to something amazing!",
      "My friends are so excited to see what you'll figure out!"
    ],
    celebration_message: "You're incredible! My cloud friends are doing happy dances because of your brilliant thinking!",
    callback_phrase: "Remember when we helped all my cloud friends get equal cookie pieces?"
  }
};

// Export all adventures
export const ADVENTURES: Adventure[] = [
  FRACTIONS_BAKERY_ADVENTURE
];

// Helper function to get adventure by ID
export const getAdventureById = (id: string): Adventure | undefined => {
  return ADVENTURES.find(adventure => adventure.id === id);
};