import { z } from 'zod';

// Define strict schemas for every Pi interaction type

// Define input/output schemas separately for easier access
export const NoticeWonderInputSchema = z.object({
  problemImage: z.string(),
  studentCanvas: z.string(),
  currentAct: z.literal('act1')
});

export const NoticeWonderOutputSchema = z.object({
  response: z.string(),
  questionType: z.enum(['notice', 'wonder', 'observe']),
  mentionsTools: z.boolean() // Should ALWAYS be false in Act 1
});

export const NoticeWonderSchema = z.object({
  input: NoticeWonderInputSchema,
  output: NoticeWonderOutputSchema
});

export const VerifyCountingInputSchema = z.object({
  problemType: z.literal('fraction'),
  studentStatement: z.string()
});

export const VerifyCountingOutputSchema = z.object({
  totalObjects: z.number(),
  targetObjects: z.number(),
  studentAnswer: z.string(),
  isCorrect: z.boolean(),
  correction: z.string().optional()
});

export const VerifyCountingSchema = z.object({
  input: VerifyCountingInputSchema,
  output: VerifyCountingOutputSchema
});

export const ReasoningStepInputSchema = z.object({
  studentTranscript: z.string(),
  canvasState: z.string(),
  problemContext: z.object({
    total: z.number(),
    target: z.number(),
    correctAnswer: z.string()
  })
});

export const ReasoningStepOutputSchema = z.object({
  classification: z.enum(['correct', 'partial', 'incorrect', 'exploring']),
  concepts: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  misconception: z.string().optional()
});

export const ReasoningStepSchema = z.object({
  input: ReasoningStepInputSchema,
  output: ReasoningStepOutputSchema
});

export const ActTransitionInputSchema = z.object({
  currentAct: z.enum(['act1', 'act2', 'act3']),
  studentProgress: z.object({
    timeInAct: z.number(),
    hasAskedForHelp: z.boolean(),
    hasDrawnSomething: z.boolean(),
    hasSolvedProblem: z.boolean()
  })
});

export const ActTransitionOutputSchema = z.object({
  shouldTransition: z.boolean(),
  nextAct: z.enum(['act1', 'act2', 'act3']).optional(),
  reason: z.string()
});

export const ActTransitionSchema = z.object({
  input: ActTransitionInputSchema,
  output: ActTransitionOutputSchema
});

// Type exports
export type NoticeWonderInput = z.infer<typeof NoticeWonderInputSchema>;
export type NoticeWonderOutput = z.infer<typeof NoticeWonderOutputSchema>;

export type VerifyCountingInput = z.infer<typeof VerifyCountingInputSchema>;
export type VerifyCountingOutput = z.infer<typeof VerifyCountingOutputSchema>;

export type ReasoningStepInput = z.infer<typeof ReasoningStepInputSchema>;
export type ReasoningStepOutput = z.infer<typeof ReasoningStepOutputSchema>;

export type ActTransitionInput = z.infer<typeof ActTransitionInputSchema>;
export type ActTransitionOutput = z.infer<typeof ActTransitionOutputSchema>;