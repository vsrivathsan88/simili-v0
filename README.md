# Simili Math Tutor 🎓

An AI-powered elementary math tutor that visualizes student reasoning in real-time using Google's Gemini Live API.

## Features

### 🎯 Core Functionality
- **Voice-based tutoring** with Pi, a friendly math tutor personality
- **Real-time canvas** with drawing tools and text input
- **Visual manipulatives** including fraction bars, number lines, area models, and array grids
- **Automatic problem generation** based on Illustrative Mathematics curriculum
- **Vision sync** - Pi can see both the problem and student work in real-time

### 👩‍🏫 Teacher Tools
- **Reasoning trace visualization** showing student thinking patterns
- **Progress tracking** across multiple sessions
- **Analytics dashboard** with insights into student understanding
- **Misconception tracking** to identify areas needing support

### 🎨 Student Experience
- **Game-like manipulatives** with intuitive controls
- **Smooth drawing** with multiple colors and eraser
- **Text tool** for writing numbers and labels
- **Encouraging feedback** that celebrates mistakes as learning

## Tech Stack

- **Frontend**: React + TypeScript
- **AI**: Google Gemini Live API (multimodal with voice + vision)
- **Styling**: SCSS with custom design system
- **Drawing**: Canvas API with requestAnimationFrame optimization
- **State**: React hooks with localStorage persistence

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Gemini API key:
   ```
   REACT_APP_GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Architecture

### Key Components

- **App.tsx** - Main application with Gemini Live connection
- **UnifiedCanvas** - Drawing surface with manipulative support
- **EnhancedCanvas** - Canvas implementation with text support
- **ProblemDisplay** - Shows math problems with automatic generation
- **TeacherPanel** - Collapsible panel with reasoning trace and analytics
- **StudentProgress** - Dashboard showing mastery and practice areas

### Manipulatives

- **GameFractionBar** - Interactive fraction visualization
- **DynamicNumberLine** - Adjustable number line with marking
- **AreaModel** - Grid for understanding fractions as areas
- **ArrayGrid** - Visualization for multiplication concepts

### AI Integration

- **Pi Tutor** - Socratic teaching personality with timing awareness
- **Tool Functions** - Captures reasoning steps and misconceptions
- **Vision Sync** - Sends problem and canvas images to Gemini
- **Audio Streaming** - PCM 16kHz format with Web Audio API

## Design Philosophy

- **Mistake-friendly** - Rough.js aesthetic makes it feel like scratch paper
- **Visual-first** - Manipulatives and drawing before abstract symbols
- **Patient pacing** - Pi waits 8+ seconds after questions
- **Progress visibility** - Students see their growth over time

## Future Enhancements

- Additional manipulative types (base-10 blocks, pattern blocks)
- Collaborative features for peer learning
- Parent dashboard with progress reports
- More grade levels and math topics
- Offline mode with local AI

## License

MIT

---

Built with ❤️ to make math learning more visual and engaging.