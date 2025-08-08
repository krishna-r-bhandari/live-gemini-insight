import { WebSocketServer } from 'ws';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PORT = 9083;
const API_KEY = 'AIzaSyDaCncev3_HALqANYdyYuVD5cW0-Qas-IQ';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(API_KEY);

class GeminiWebSocketServer {
  constructor() {
    this.wss = new WebSocketServer({ port: PORT });
    this.setupServer();
  }

  setupServer() {
    this.wss.on('connection', (ws) => {
      console.log('Client connected');
      this.handleConnection(ws);
    });

    console.log(`WebSocket server running on ws://localhost:${PORT}`);
  }

  async handleConnection(ws) {
    let model = null;
    let chat = null;
    let systemInstruction = '';

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.setup) {
          // Handle setup message
          systemInstruction = message.setup.system_instruction || 
            `You are a helpful assistant for screen sharing sessions. Your role is to: 
             1) Analyze and describe the content being shared on screen 
             2) Answer questions about the shared content 
             3) Provide relevant information and context about what's being shown 
             4) Assist with technical issues related to screen sharing 
             5) Maintain a professional and helpful tone. Focus on being concise and clear in your responses.`;

          // Initialize model with system instruction
          model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp",
            systemInstruction: systemInstruction
          });

          chat = model.startChat({
            history: [],
            generationConfig: {
              maxOutputTokens: 1000,
            },
          });

          console.log('Setup completed with system instruction');
        }

        if (message.realtime_input && message.realtime_input.media_chunks) {
          await this.handleRealtimeInput(ws, message.realtime_input.media_chunks, chat);
        }

      } catch (error) {
        console.error('Error handling message:', error);
        ws.send(JSON.stringify({ error: error.message }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  async handleRealtimeInput(ws, mediaChunks, chat) {
    if (!chat) {
      console.error('Chat not initialized');
      return;
    }

    try {
      const parts = [];
      let hasAudio = false;
      let hasImage = false;

      for (const chunk of mediaChunks) {
        if (chunk.mime_type === 'audio/pcm') {
          // Convert base64 PCM to inline data format
          parts.push({
            inlineData: {
              mimeType: 'audio/pcm',
              data: chunk.data
            }
          });
          hasAudio = true;
        } else if (chunk.mime_type === 'image/jpeg') {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: chunk.data
            }
          });
          hasImage = true;
        }
      }

      if (parts.length > 0) {
        // Add a text prompt to guide the AI
        let prompt = "Please analyze ";
        if (hasImage && hasAudio) {
          prompt += "the screen content and respond to the voice input.";
        } else if (hasImage) {
          prompt += "the screen content shown in the image.";
        } else if (hasAudio) {
          prompt += "and respond to the voice input.";
        }

        parts.unshift({ text: prompt });

        const result = await chat.sendMessage(parts);
        const response = await result.response;
        const text = response.text();

        if (text) {
          ws.send(JSON.stringify({ text: text }));
        }

        // Note: The JavaScript Gemini SDK doesn't support audio output yet
        // If you need audio responses, you'd need to integrate with a TTS service
        console.log('Sent response:', text);
      }

    } catch (error) {
      console.error('Error processing realtime input:', error);
      ws.send(JSON.stringify({ error: 'Failed to process input' }));
    }
  }
}

// Start the server
new GeminiWebSocketServer();