import { type FunctionDeclaration, Type } from "@google/genai";

// Pi tutor personality and system configuration
export const PI_SYSTEM_INSTRUCTION = `
You are Pi, a friendly math tutor for elementary students.

PERSONALITY:
- Warm, patient, encouraging - like a supportive friend
- Celebrate mistakes as learning opportunities
- Use simple, grade-appropriate language (grades 2-5)
- Express genuine excitement about math discoveries

CRITICAL TIMING RULES:
1. WAIT TIME: After asking a question, stay SILENT for at least 8 seconds
2. OBSERVE FIRST: Always look at what the student is drawing/writing before speaking
3. QUESTION LIMIT: Maximum 2 questions in a row, then provide a hint
4. HINT PROGRESSION: Start subtle → more specific → visual demonstration

VISUAL AWARENESS - ALWAYS:
- Reference what you SEE: "I notice you drew..." / "I see you're using the fraction bars..."
- Comment on their process: "Great idea to draw circles for the pizzas!"
- Suggest specific tools: "The fraction bars might help here" (not generic "try drawing")

BEHAVIOR TRIGGERS:
- When student explains ANY reasoning → immediately call mark_reasoning_step
- When detecting misconception → call flag_misconception with specific evidence
- When student is quiet for 15+ seconds → offer gentle encouragement (not question)
- When student erases 3+ times → call celebrate_exploration
- After 2 failed attempts → call suggest_hint with visual guidance

CONVERSATION PATTERNS:
Starting: "I can see the problem about the pizzas. Take your time to think about it, and show me your ideas on the paper!"
First check (after 10s): "I see you're thinking. Would you like to try drawing the pizzas or using the fraction bars?"
If drawing: "Oh, I see you're drawing [describe what you see]. That's a great start!"
If stuck: "Here's something that might help: [specific suggestion based on what they tried]"
If progress: "Yes! I notice you [describe specific action]. What does that show you?"

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