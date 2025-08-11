# Gemini Live Integration Setup Guide

This guide will help you set up the full Gemini Live integration with canvas streaming and the Pi tutoring system.

## Prerequisites

1. **Google AI Studio Account**: Visit [Google AI Studio](https://makersuite.google.com/) and create an account
2. **Gemini API Key**: Generate an API key from the AI Studio dashboard
3. **Node.js**: Make sure you have Node.js 18+ installed

## Quick Setup

### 1. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` and add your Gemini API key:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
   ```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application with Gemini Live integration.

## Features

### ✅ What's Working

- **Real-time Canvas Streaming**: Canvas changes are automatically sent to Gemini Live
- **Pi Tutoring System**: Comprehensive educational AI tutor with proper prompting
- **WebSocket Connection**: Robust connection with auto-reconnect and error handling
- **Tool Calling**: Pi can use educational tools to provide feedback
- **Visual Annotations**: Pi can draw on the student's canvas
- **Voice Integration**: Ready for audio streaming (browser permissions required)

### 🔧 Key Components

1. **GeminiLiveWebSocketClient** (`src/lib/geminiLiveWebSocket.ts`)
   - Handles WebSocket connections to Gemini Live API
   - Implements proper message formatting for Gemini Live protocol
   - Manages tool calling and responses
   - Includes connection resilience and error handling

2. **GeminiLiveTutor Component** (`src/components/GeminiLiveTutor.tsx`)
   - React component providing the tutoring interface
   - Shows Pi's responses and suggestions
   - Handles student input and voice chat

3. **Enhanced SimiliCanvas** (`src/components/SimiliCanvas.tsx`)
   - Integrates tldraw with Gemini Live streaming
   - Automatically sends canvas updates to Pi
   - Displays Pi's annotations and feedback

### 🎯 Educational Features

Pi the tutor can:
- **Analyze student drawings** in real-time
- **Mark reasoning steps** as students explain their thinking
- **Flag misconceptions** gently and guide correction
- **Suggest hints** at appropriate scaffolding levels
- **Celebrate discoveries** and acknowledge productive struggle
- **Annotate the canvas** with helpful visual cues
- **Focus attention** on specific parts of student work

## API Key Setup

### Getting Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" in the main menu
4. Click "Create API Key in new project" (or use existing project)
5. Copy the generated API key

### Important Notes

- **Never commit API keys to version control**
- The API key goes in `.env.local` (which is gitignored)
- For production, use environment variables in your hosting platform
- Monitor your API usage in Google AI Studio

## Browser Permissions

For full functionality, the app requests these permissions:

- **Microphone**: For voice chat with Pi (optional)
- **Screen sharing**: For enhanced canvas streaming (optional)

Students can use the app without granting these permissions, but some features will be limited.

## Troubleshooting

### Connection Issues

1. **Check API Key**: Make sure your `NEXT_PUBLIC_GEMINI_API_KEY` is correct
2. **Browser Console**: Check for WebSocket connection errors
3. **Network**: Ensure your network allows WebSocket connections

### Pi Not Responding

1. **Connection Status**: Check the status indicator in the canvas (top-right)
2. **Setup Complete**: Wait for "Pi is ready!" status before drawing
3. **Canvas Updates**: Make sure you're drawing on the canvas (not just moving mouse)

### Tool Calling Issues

The Pi tutor uses several educational tools. If these aren't working:
1. Check browser console for tool execution errors
2. Verify the WebSocket connection is stable
3. Ensure the Gemini Live API supports tool calling (may require specific model versions)

## Technical Architecture

### WebSocket Protocol

The implementation follows the Gemini Live WebSocket protocol:

1. **Connection**: Establish WebSocket to Gemini Live endpoint
2. **Setup**: Send system instructions and tool definitions
3. **Streaming**: Continuous bidirectional communication
4. **Content**: Text, images, and tool calls/responses

### Message Flow

```
Student draws → Canvas captures → Base64 encoding → WebSocket → Gemini Live
                                                                    ↓
Student receives ← UI updates ← Event dispatch ← Tool execution ← Pi responds
```

### Error Handling

- Automatic reconnection with exponential backoff
- Graceful degradation when API is unavailable
- User-friendly error messages
- Connection status indicators

## Production Considerations

### Performance

- Canvas updates are throttled to avoid API spam
- Images are compressed before sending
- WebSocket connections include heartbeat monitoring

### Scaling

- Consider implementing connection pooling for multiple users
- Monitor API rate limits and costs
- Implement user session management

### Privacy

- No student data is stored persistently by default
- All communication is encrypted via WSS
- Consider implementing data retention policies

## Support

If you encounter issues:

1. Check the browser console for detailed error messages
2. Verify your API key permissions in Google AI Studio
3. Test with a simple drawing to ensure basic connectivity
4. Check network connectivity and firewall settings

## Next Steps

- [ ] Add support for multiple students in the same session
- [ ] Implement assessment and progress tracking
- [ ] Add more sophisticated reasoning analysis
- [ ] Integrate with learning management systems
- [ ] Add support for different grade levels and subjects
