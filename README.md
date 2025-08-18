# Simili Math Tutor

A reasoning visualization platform for elementary math education, powered by Gemini Live API.

## Features

- **Pi Tutor**: Friendly AI math tutor using Gemini Live's conversational AI
- **Hand-drawn UI**: Warm, approachable interface using rough.js
- **Reasoning Visualization**: Visual representation of student thinking journey
- **Interactive Canvas**: Drawing tools and math manipulatives (coming soon)
- **Session Recording**: Capture and replay problem-solving sessions

## Setup

1. **Get a Gemini API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/apikey)
   - Create a free API key

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Add your API key: `REACT_APP_GEMINI_API_KEY=your_api_key_here`

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```

## Architecture

Built on top of Google's Gemini Live API Web Console with:
- React + TypeScript
- rough.js for hand-drawn UI components
- Gemini Live 2.0 for conversational AI
- Custom tool functions for math tutoring

## Development Status

### Completed ✓
- Gemini Live integration
- Pi tutor personality configuration
- Hand-drawn UI components (SketchyButton, ReasoningBubble)
- Math tool function implementations

### In Progress
- tldraw canvas integration
- Fraction manipulatives (Pizza, FractionBar)
- Reasoning map visualization
- Canvas → Gemini vision sync

## Tool Functions

Pi can call these functions during tutoring:
- `mark_reasoning_step`: Record student's reasoning
- `flag_misconception`: Identify learning opportunities
- `suggest_hint`: Provide scaffolded support
- `celebrate_exploration`: Acknowledge productive struggle
- `annotate_canvas`: Draw visual hints