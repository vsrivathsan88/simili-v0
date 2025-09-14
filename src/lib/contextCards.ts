import { getNarrative } from '../config/problemNarratives';

export interface ContextCard {
  id: string;
  type: 'act_rules' | 'problem_facts' | 'student_state' | 'correction';
  content: string;
  priority: 'high' | 'medium' | 'low';
  expiresAfter?: number; // milliseconds
  timestamp?: number;
}

export class ContextCardSystem {
  private cards: Map<string, ContextCard> = new Map();
  private lastSentCards: Set<string> = new Set();
  
  // Add a context card
  addCard(card: ContextCard) {
    this.cards.set(card.id, {
      ...card,
      timestamp: Date.now()
    });
  }
  
  // Get current relevant cards
  getActiveCards(): ContextCard[] {
    const now = Date.now();
    const activeCards: ContextCard[] = [];
    
    // Remove expired cards
    for (const [id, card] of this.cards) {
      if (card.expiresAfter && card.timestamp && (now - card.timestamp) > card.expiresAfter) {
        this.cards.delete(id);
      } else {
        activeCards.push(card);
      }
    }
    
    // Sort by priority
    return activeCards.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  // Build context message
  buildContextMessage(includeAll = false): string {
    const cards = this.getActiveCards();
    const cardsToSend = includeAll 
      ? cards 
      : cards.filter(c => !this.lastSentCards.has(c.id) || c.priority === 'high');
    
    if (cardsToSend.length === 0) return '';
    
    // Mark cards as sent
    cardsToSend.forEach(c => this.lastSentCards.add(c.id));
    
    return cardsToSend
      .map(card => `[${card.type.toUpperCase()}] ${card.content}`)
      .join('\n');
  }
  
  // Pre-built cards for common situations
  static getActCard(act: string): ContextCard {
    const actCards: Record<string, ContextCard> = {
      act1: {
        id: 'act1-rules',
        type: 'act_rules',
        content: '[ACT 1 - NOTICE & WONDER]\n- NO tools or drawing available\n- Ask: "What do you notice?" "What makes you wonder?"\n- Never mention tools, drawing, or solving\n- Just explore what they see',
        priority: 'high'
      },
      act2: {
        id: 'act2-rules',
        type: 'act_rules',
        content: '[ACT 2 - EXPLORE]\n- Tools NOW available! Canvas is active!\n- You can suggest: "Want to try drawing?" "The pizza tool might help!"\n- Focus on their process, not the answer',
        priority: 'high'
      },
      act3: {
        id: 'act3-rules',
        type: 'act_rules',
        content: '[ACT 3 - SHOWCASE]\n- Ask: "How did you figure that out?" "Can you explain?"\n- Celebrate their thinking and process\n- No new problem solving',
        priority: 'high'
      }
    };
    
    return actCards[act] || actCards.act1;
  }
  
  static getProblemCard(): ContextCard {
    return {
      id: 'lego-problem',
      type: 'problem_facts',
      content: 'LEGO blocks: 6 total (2 blue, 4 gray). Question: What fraction are blue? Answer: 2/6 or 1/3',
      priority: 'medium'
    };
  }
  
  static getNarrativeCard(problemType: string = 'lego-blocks'): ContextCard {
    const narrative = getNarrative(problemType);
    return {
      id: 'problem-narrative',
      type: 'problem_facts',
      content: `[STORY TO SHARE]\n${narrative.narrative}\n\n[AFTER SHARING, ASK]: "${narrative.followUp}"`,
      priority: 'high',
      expiresAfter: 60000 // Expires after 1 minute
    };
  }
  
  static getCorrectionCard(error: string): ContextCard {
    return {
      id: `correction-${Date.now()}`,
      type: 'correction',
      content: `CORRECTION: ${error}`,
      priority: 'high',
      expiresAfter: 30000 // 30 seconds
    };
  }
}

// Singleton instance
export const contextCards = new ContextCardSystem();