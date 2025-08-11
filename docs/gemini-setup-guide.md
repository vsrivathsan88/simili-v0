# Gemini API Setup Guide for Simili

## 🤖 Getting Your Gemini API Key

### Step 1: Get a Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### Step 2: Set Up Environment Variables
1. Create a `.env.local` file in your project root:
```bash
cp env.example .env.local
```

2. Add your Gemini API key:
```bash
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

### Step 3: Test the Integration
1. Start the development server:
```bash
npm run dev
```

2. Open the app and click the 🤖 button in the top-right
3. You should see "🤖 AI" status indicating Gemini is connected
4. If you see "📚 Guided", the app is using fallback mode (no API key)

---

## 🎓 Educational System Prompts

### Current Tutor Personality: "Pi"
- **Warm and encouraging** - celebrates student progress
- **Question-based guidance** - helps students discover concepts
- **Age-appropriate language** - designed for elementary students
- **Curiosity-driven** - asks "What do you think?" and "I notice..."

### Subject Specializations

#### Mathematics (Primary)
- Number sense and counting
- Basic arithmetic operations
- Fractions and decimals
- Geometry and shapes
- Patterns and relationships
- Problem-solving strategies

#### Science (Future)
- Ready for expansion to science topics
- Will adapt prompts for scientific inquiry
- Hands-on experimentation encouragement

#### Language Arts (Future)
- Reading comprehension support
- Writing guidance
- Vocabulary building

---

## 🔧 Customization Options

### Adjusting Tutor Behavior
Edit `src/lib/geminiClient.ts` to modify:

#### Response Length
```typescript
maxOutputTokens: 200, // Keep responses concise for children
```

#### Creativity Level
```typescript
temperature: 0.7, // Balanced creativity (0.0-1.0)
```

#### Grade Level Adaptation
```typescript
// In systemPrompts.base
"Use simple, age-appropriate language"
"Keep responses to 1-2 sentences max"
```

### Custom Subject Prompts
Add new subjects by extending the `systemPrompts` object:

```typescript
science: `You are Pi, a science tutor for elementary students. Focus on:
- Observation and questioning
- Simple experiments and predictions
- Nature and environment
- Basic physics concepts
- Safety in exploration`,

language: `You are Pi, a reading and writing companion. Help with:
- Story comprehension
- Creative writing
- Vocabulary in context
- Reading strategies
- Expression and communication`
```

---

## 🎯 Educational Pedagogy Built-In

### Socratic Method
- **Never gives direct answers** - guides students to discover
- **Asks follow-up questions** - deepens understanding
- **Celebrates thinking process** - not just correct answers

### Constructivist Learning
- **Builds on prior knowledge** - connects to what students know
- **Encourages exploration** - supports trial and error
- **Visual and hands-on** - suggests drawing and manipulatives

### Growth Mindset
- **Mistakes as learning** - "That's an interesting approach..."
- **Process over product** - "I love how you're thinking about this"
- **Effort recognition** - "You're working so hard on this!"

---

## 🔍 How the AI Tutoring Works

### Context Awareness
```typescript
interface StudentContext {
  gradeLevel: number           // Adapts language complexity
  subject: string             // Chooses appropriate prompts
  currentTopic: string        // Focuses responses
  learningObjectives: string[] // Aligns with curriculum
  sessionDuration: number     // Adjusts energy level
  strugglingAreas: string[]   // Provides targeted support
  masteredConcepts: string[]  // Offers appropriate challenges
}
```

### Real-time Analysis
1. **Drawing Recognition** - Analyzes student sketches for mathematical concepts
2. **Interaction Patterns** - Notices tool usage and exploration behavior
3. **Conversation Flow** - Maintains context across multiple exchanges
4. **Collaboration Awareness** - Adapts when multiple students are present

### Response Generation
1. **Educational Assessment** - Determines student understanding level
2. **Pedagogical Strategy** - Chooses appropriate teaching approach
3. **Language Adaptation** - Adjusts complexity for grade level
4. **Multi-modal Suggestions** - Recommends drawing, tools, or actions

---

## 🚀 Advanced Features

### Collaborative Learning
When multiple students are detected:
- **Peer Discussion Facilitation** - "What do you think about Sarah's approach?"
- **Different Strategy Highlighting** - "I see two different methods here"
- **Respectful Discourse** - Encourages listening and building on ideas

### Assessment Integration
- **Formative Feedback** - Continuous learning evaluation
- **Progress Tracking** - Monitors concept mastery over time
- **Adaptive Difficulty** - Suggests appropriate challenges
- **Learning Analytics** - Identifies strengths and growth areas

### Voice Integration (Ready)
- **Natural Conversation** - Supports voice commands and responses
- **Audio Feedback** - Can provide spoken encouragement
- **Accessibility** - Supports students with different learning needs

---

## 🔒 Privacy & Safety

### Data Handling
- **Local Processing** - Student work processed locally when possible
- **Anonymized Context** - Personal information removed before API calls
- **Conversation Limits** - Automatic session timeouts
- **No Personal Storage** - Student data not permanently stored by AI

### COPPA Compliance
- **Age-appropriate Interactions** - Designed for children
- **Educational Focus** - Strictly academic conversations
- **Teacher Oversight** - Ready for classroom monitoring
- **Parent Transparency** - Clear about AI tutoring capabilities

---

## 🛠️ Troubleshooting

### Common Issues

#### "📚 Guided" Mode (No API Key)
- Check `.env.local` file exists
- Verify API key is correct (starts with `AIza...`)
- Restart development server after adding key

#### Slow Responses
- Check internet connection
- Verify Gemini API quota (free tier has limits)
- Consider using shorter conversation history

#### Generic Responses
- AI falls back to simple responses when API fails
- Check browser console for error messages
- Verify API key has proper permissions

### Debug Mode
Enable detailed logging by adding:
```typescript
// In geminiClient.ts
console.log('Sending to Gemini:', prompt)
console.log('Received response:', response)
```

---

## 📈 Future Enhancements

### Planned Features
- **Vision API Integration** - Direct image analysis of student drawings
- **Voice Synthesis** - Spoken AI responses for accessibility
- **Curriculum Alignment** - Integration with Common Core standards
- **Teacher Dashboard** - Real-time classroom insights
- **Parent Reports** - Learning progress summaries

### Research Opportunities
- **Learning Effectiveness** - Does AI tutoring improve outcomes?
- **Engagement Patterns** - How do students interact differently with AI?
- **Collaboration Dynamics** - How does AI affect peer learning?
- **Accessibility Impact** - Does this help students with learning differences?

---

This setup gives you a **production-ready AI tutor** that understands educational best practices and adapts to individual student needs. The system is designed to **enhance** rather than replace human teaching, providing personalized support that scales to every student's learning journey. 🎓✨
