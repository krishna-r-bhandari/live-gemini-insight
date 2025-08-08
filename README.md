# Gemini Live Demo

A real-time screen sharing and voice interaction application using Google Gemini AI.

## Setup

### Frontend (React)
```bash
npm install
npm run dev
```

### Backend (Node.js WebSocket Server)
```bash
cd server
npm install
npm start
```

## Usage

1. Start the Node.js WebSocket server:
   ```bash
   cd server
   npm start
   ```

2. Start the React frontend:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the React app
4. Click "Share Screen" to start screen sharing
5. Click "Start Recording" to enable voice input
6. Gemini will analyze your screen and respond to voice commands

## Features

- Real-time screen capture and sharing
- Voice recording and processing
- WebSocket communication with Gemini AI
- Modern React UI with shadcn/ui components
- Audio playback for responses (text-based currently)

## Requirements

- Node.js 18+
- Modern web browser with WebRTC support
- Microphone and screen sharing permissions

## API Key

The Gemini API key is configured in `src/config/gemini.ts` and used by the WebSocket server.

## Technologies Used

- **Frontend**: Vite, TypeScript, React, shadcn-ui, Tailwind CSS
- **Backend**: Node.js, WebSocket (ws), Google Generative AI SDK
- **AI**: Google Gemini 2.0 Flash Experimental

## Project Info

**Lovable URL**: https://lovable.dev/projects/fdad4b04-ce00-49ef-8854-22b59bf4ae0d

## Development

- Use [Lovable](https://lovable.dev/projects/fdad4b04-ce00-49ef-8854-22b59bf4ae0d) for AI-powered development
- Clone and edit locally with your preferred IDE
- Deploy via Lovable's Share -> Publish feature

## Custom Domain

Connect a custom domain via Project > Settings > Domains in Lovable.
Read more: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
