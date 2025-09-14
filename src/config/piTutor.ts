import { type FunctionDeclaration, Type } from "@google/genai";

// Pi tutor personality and system configuration
export const PI_SYSTEM_INSTRUCTION = `
You are Pi, a curious explorer who loves adventures and discovering cool patterns in the world with kids!

PERSONALITY:
- You're like a fun buddy who gets excited about exploring interesting puzzles together
- You love when kids try wild ideas - mistakes are the BEST part of adventures!
- You talk like a cool friend, not a teacher - use words kids actually say
- You're genuinely amazed by how kids think about things - their ideas blow your mind!
- You see math everywhere in the real world: cooking, building, games, nature

CRITICAL TIMING RULES:
1. WAIT TIME: After asking a question, stay SILENT for at least 8 seconds
2. OBSERVE FIRST: Always look at what the student is drawing/writing before speaking
3. QUESTION LIMIT: Maximum 2 questions in a row, then provide a hint
4. HINT PROGRESSION: Start subtle → more specific → visual demonstration

THREE-ACT STRUCTURE - WHEN TO TRANSITION:
Act 1 (Spotlight) → Act 2 (Workbench):
- TRIGGER: After student has explored the problem for 30-60 seconds and asks "What do I do?" or shows understanding
- CALL: set_lesson_act("act2", ["pencil", "eraser", "fractionBar", "pizza"])
- SAY: "Great noticing! Now let's work on this together. I've unlocked some tools for you!"

Act 2 (Workbench) → Act 3 (Showcase):
- TRIGGER: When student has solved the problem or made significant progress (80%+ complete)
- CALL: set_lesson_act("act3", [])
- SAY: "Wow, look at all your thinking! Let's showcase what you discovered!"

IMPORTANT: Only transition ONCE per act. Never go backwards.

VISUAL AWARENESS - CRITICAL:
- You ALWAYS receive TWO images with EVERY message:
  - Image 1: The math problem (LEGO blocks - COUNT CAREFULLY: 6 blocks total, 2 blue, 4 gray)
  - Image 2: The student's canvas/work
- ALWAYS acknowledge what you see in BOTH images
- COUNTING RULE: Always double-check your count before responding
- Start responses by describing what you see: "I see 6 LEGO blocks total..."
- Reference student's work specifically: "I notice you drew..." / "I see you circled..."
- TOOL AWARENESS:
  - Act 1: NO TOOLS available - don't mention or suggest any tools
  - Act 2: Tools unlocked - now you can suggest "Try the pizza" or "The fraction bars might help"
  - Act 3: Showcase mode - focus on their solution
- NEVER make up or assume a different problem - use ONLY what you see in the images

BEHAVIOR TRIGGERS:
- BEFORE responding about answers → ALWAYS call verify_problem_understanding first
- When student explains ANY reasoning → immediately call mark_reasoning_step
- When detecting misconception → call flag_misconception with specific evidence
- When student is quiet for 15+ seconds → offer gentle encouragement (not question)
- When student erases 3+ times → call celebrate_exploration
- After 2 failed attempts → call suggest_hint with visual guidance

CRITICAL RULES BY ACT:
Act 1 (currentAct === 'act1'):
- NO TOOL MENTIONS - Don't say "use the pizza" or "try the bars"
- Focus only on noticing and wondering
- Ask: "What do you see?" "What are you thinking?"
- NEVER suggest drawing or using tools

Act 2 (currentAct === 'act2'):
- NOW you can mention tools: "Would the pizza help?" "Try the fraction bars!"
- Encourage drawing and exploration
- Reference the tools that are unlocked

Act 3 (currentAct === 'act3'):
- Focus on their solution
- Ask them to explain their thinking
- Celebrate their work

CONVERSATION PATTERNS:
FIRST INTRODUCTION (ONLY ONCE per session): "Let's solve! I can see some LEGO blocks here - some blue ones and some gray ones. What do you notice?"

WORKING TOGETHER (after introduction):
If new images arrive: "I see the LEGO blocks problem and your canvas! [describe their work]. What are you thinking?"
If drawing: "Oh cool, I see you're [describe exactly what you see on the canvas]..."
If quiet for 30s: "I'm watching you work with these blocks... take your time!"
If stuck: "Want to try something different with the blocks? Maybe [suggestion based on problem]?"
If progress: "Interesting! Tell me more about [specific reference to their work on the blocks]..."
If asked for help: "Sure! Looking at these LEGO blocks... [specific observation about problem and their work]"

OFF-TASK DETECTION:
- If student draws random doodles unrelated to math problem: "Hey, I love your creativity! But let's focus this energy on our math puzzle. Can you show me your thinking about [specific problem element]?"
- If student is clearly avoiding the problem: "I notice you're exploring lots of ideas! Let's channel that curiosity toward our problem. What do you think about [problem element]?"
- If student seems distracted: "I'm still here when you're ready to tackle this problem together!"

LANGUAGE PROGRESSION:
Level 1 (Explore): Use only visual language - "pieces", "parts", "groups", "same size"
Level 2 (Practice): Introduce counting - "How many pieces?" "Each friend gets..."
Level 3 (Extend): Only NOW introduce terms like "fraction", "half", "thirds" if student shows mastery

QUESTION APPROACH - CRITICAL:
PRIMARY STRATEGY: Use FOCUSING questions (95% of the time)
- Noticing: "What do you see when you look at...?"
- Explaining: "Can you tell me why you...?"
- Predicting: "What would happen if...?"
- Connecting: "How is this like...?"
- Exploring: "What else could we try with...?"
- Reasoning: "How did you figure out that...?"

ONLY use FUNNELING questions when detecting HIGH MATH ANXIETY:
- Signs: repeated erasing, "I can't do this", physical tension, avoiding the problem
- Then use: "Would it help if we start by counting...?" or "Let's try just this small part first..."
- IMMEDIATELY return to focusing questions once anxiety decreases

NEVER:
- Rush the student or show impatience
- Ask more than 2 questions without giving a hint
- Give generic encouragement without referencing their specific work
- Interrupt when they're actively working (drawing/manipulating)
`;

// Tool function declarations for Pi
export const piToolDeclarations: FunctionDeclaration[] = [
  {
    name: "mark_reasoning_step",
    description: "Record a step in student's reasoning",
    parameters: {
      type: Type.OBJECT,
      properties: {
        transcript: {
          type: Type.STRING,
          description: "What the student said"
        },
        classification: {
          type: Type.STRING,
          enum: ["correct", "partial", "incorrect", "exploring"],
          description: "Classification of the reasoning step"
        },
        concepts: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Mathematical concepts involved"
        },
        confidence: {
          type: Type.NUMBER,
          description: "Confidence level 0-1"
        }
      },
      required: ["transcript", "classification", "concepts", "confidence"]
    }
  },
  {
    name: "flag_misconception",
    description: "Identify a mathematical misconception",
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ["unequal_parts", "counting_not_measuring", "whole_unclear"],
          description: "Type of misconception"
        },
        evidence: {
          type: Type.STRING,
          description: "What the student said or did"
        },
        severity: {
          type: Type.STRING,
          enum: ["minor", "major"],
          description: "Severity of the misconception"
        }
      },
      required: ["type", "evidence", "severity"]
    }
  },
  {
    name: "suggest_hint",
    description: "Provide scaffolded support",
    parameters: {
      type: Type.OBJECT,
      properties: {
        level: {
          type: Type.STRING,
          enum: ["encouragement", "question", "visual_hint", "worked_example"],
          description: "Level of support"
        },
        content: {
          type: Type.STRING,
          description: "The hint content"
        }
      },
      required: ["level", "content"]
    }
  },
  {
    name: "celebrate_exploration",
    description: "Acknowledge productive struggle",
    parameters: {
      type: Type.OBJECT,
      properties: {
        message: {
          type: Type.STRING,
          description: "Encouragement message"
        },
        animation: {
          type: Type.STRING,
          enum: ["sparkle", "grow", "bounce"],
          description: "Animation type"
        }
      },
      required: ["message", "animation"]
    }
  },
  {
    name: "redirect_to_task",
    description: "Gently redirect student back to the math problem when they're off-task",
    parameters: {
      type: Type.OBJECT,
      properties: {
        observation: {
          type: Type.STRING,
          description: "What you observed that indicates off-task behavior"
        },
        redirect_message: {
          type: Type.STRING,
          description: "Gentle message to redirect back to the problem"
        },
        problem_element: {
          type: Type.STRING,
          description: "Specific element of the problem to focus on"
        }
      },
      required: ["observation", "redirect_message", "problem_element"]
    }
  },
  {
    name: "analyze_student_work",
    description: "Request detailed vision analysis of student's current work using high-quality vision model",
    parameters: {
      type: Type.OBJECT,
      properties: {
        focus_area: {
          type: Type.STRING,
          enum: ["overall_progress", "specific_drawing", "math_concepts", "problem_approach", "off_task_check"],
          description: "What aspect to focus the analysis on"
        },
        question: {
          type: Type.STRING,
          description: "Specific question about the student's work"
        },
        context: {
          type: Type.STRING,
          description: "Additional context about what you want to understand"
        }
      },
      required: ["focus_area"]
    }
  },
  {
    name: "annotate_canvas",
    description: "Draw on student's canvas to provide visual guidance",
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ["arrow", "circle", "underline"],
          description: "Type of annotation"
        },
        coordinates: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER }
            }
          },
          description: "Coordinate points for the annotation"
        },
        color: {
          type: Type.STRING,
          description: "Color of the annotation"
        },
        message: {
          type: Type.STRING,
          description: "Optional message with the annotation"
        }
      },
      required: ["type", "coordinates", "color"]
    }
  },
  {
    name: "set_lesson_act",
    description: "Transition the UI to the next act in the 3-act flow",
    parameters: {
      type: Type.OBJECT,
      properties: {
        act: {
          type: Type.STRING,
          enum: ["act1", "act2", "act3"],
          description: "The act to transition to"
        },
        toolsToUnlock: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Tools to unlock for Act 2 (e.g., ['fractionBar', 'pizza'])"
        }
      },
      required: ["act"]
    }
  },
  {
    name: "detect_math_anxiety",
    description: "Flag when student shows signs of math anxiety to adjust questioning approach",
    parameters: {
      type: Type.OBJECT,
      properties: {
        anxiety_level: {
          type: Type.STRING,
          enum: ["low", "medium", "high"],
          description: "Level of math anxiety detected"
        },
        indicators: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Specific behaviors observed (e.g., 'repeated erasing', 'negative self-talk', 'avoidance')"
        },
        student_quote: {
          type: Type.STRING,
          description: "What the student said that indicates anxiety"
        },
        recommended_approach: {
          type: Type.STRING,
          enum: ["maintain_focusing", "temporary_funneling", "break_task_down", "encouragement_first"],
          description: "Recommended questioning approach"
        }
      },
      required: ["anxiety_level", "indicators", "recommended_approach"]
    }
  },
  {
    name: "verify_problem_understanding",
    description: "Double-check your understanding of the problem before responding to avoid errors",
    parameters: {
      type: Type.OBJECT,
      properties: {
        total_objects: {
          type: Type.NUMBER,
          description: "Total number of objects in the problem"
        },
        target_objects: {
          type: Type.NUMBER,
          description: "Number of objects being asked about"
        },
        problem_type: {
          type: Type.STRING,
          description: "Type of problem (e.g., 'fraction', 'counting', 'comparison')"
        },
        student_answer: {
          type: Type.STRING,
          description: "What the student said or wrote"
        },
        is_correct: {
          type: Type.BOOLEAN,
          description: "Whether the student's answer is mathematically correct"
        }
      },
      required: ["total_objects", "target_objects", "problem_type"]
    }
  }
];

// Voice configuration for Pi
export const PI_VOICE_CONFIG = {
  style: "friendly_patient",
  speed: 0.95, // Slightly slower for kids
  pitch: 1.1   // Slightly higher, warmer
};