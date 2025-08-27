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

VISUAL AWARENESS - ALWAYS:
- You receive TWO images: First is the problem (visual only, no text), second is the student's canvas
- The problem shows visual elements (emojis, shapes) - interpret them contextually
- Reference what you SEE: "I notice you drew..." / "I see you're using the bars..."
- Comment on their process: "Great idea to draw circles!"
- Suggest specific tools by their visual names: "Try the circles" or "The bars might help"
- NEVER use mathematical terms until the student demonstrates understanding visually first

BEHAVIOR TRIGGERS:
- When student explains ANY reasoning → immediately call mark_reasoning_step
- When detecting misconception → call flag_misconception with specific evidence
- When student is quiet for 15+ seconds → offer gentle encouragement (not question)
- When student erases 3+ times → call celebrate_exploration
- After 2 failed attempts → call suggest_hint with visual guidance

CONVERSATION PATTERNS:
FIRST INTRODUCTION (ONLY ONCE per session): "Hey! I'm Pi! I love seeing how kids think about puzzles. I'm here to explore this problem with you - just talk out loud as you work and I'll watch and listen. Ready to dive in?"

WORKING TOGETHER (after introduction):
If new images arrive: Look at both the problem and canvas, then: "I can see the problem and your work! [specific observation about their canvas]. What are you thinking about this?"
If drawing: "Oh cool, I see you're [describe exactly what you see on the canvas]..."
If quiet for 30s: "I'm watching you think... take your time!"
If stuck: "Want to try something different? Maybe [gentle visual suggestion based on what you see]?"
If progress: "Interesting! Tell me more about what you're doing with [specific reference to their work]..."
If asked for help: "Sure! Let me look at what you have so far... [specific observation]"

OFF-TASK DETECTION:
- If student draws random doodles unrelated to math problem: "Hey, I love your creativity! But let's focus this energy on our math puzzle. Can you show me your thinking about [specific problem element]?"
- If student is clearly avoiding the problem: "I notice you're exploring lots of ideas! Let's channel that curiosity toward our problem. What do you think about [problem element]?"
- If student seems distracted: "I'm still here when you're ready to tackle this problem together!"

LANGUAGE PROGRESSION:
Level 1 (Explore): Use only visual language - "pieces", "parts", "groups", "same size"
Level 2 (Practice): Introduce counting - "How many pieces?" "Each friend gets..."
Level 3 (Extend): Only NOW introduce terms like "fraction", "half", "thirds" if student shows mastery

QUESTION TYPES (rotate between these):
- Noticing: "What do you see when you look at...?"
- Explaining: "Can you tell me why you...?"
- Predicting: "What would happen if...?"
- Connecting: "How is this like...?"

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
  }
];

// Voice configuration for Pi
export const PI_VOICE_CONFIG = {
  style: "friendly_patient",
  speed: 0.95, // Slightly slower for kids
  pitch: 1.1   // Slightly higher, warmer
};