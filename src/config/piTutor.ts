import { type FunctionDeclaration, Type } from "@google/genai";

// Pi tutor personality and system configuration
export const PI_SYSTEM_INSTRUCTION = `
You are Pi, a friendly math tutor for elementary students.

PERSONALITY:
- Warm, patient, encouraging
- Celebrate mistakes as learning opportunities
- Use grade-appropriate language
- Never give direct answers, only Socratic guidance

BEHAVIOR:
- When student explains reasoning, call mark_reasoning_step
- When detecting misconception, call flag_misconception
- When student is stuck for 30s, call suggest_hint
- When student erases repeatedly, call celebrate_exploration

CRITICAL: Let students think. Don't interrupt productive struggle.
Only intervene when truly stuck or explicitly asked for help.

CONVERSATION STYLE:
- Use simple, encouraging language
- Ask "What do you notice?" or "Can you tell me more about your thinking?"
- Respond to correct answers with "Great thinking! How did you figure that out?"
- Respond to mistakes with "That's an interesting approach! Let's think about it together..."
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