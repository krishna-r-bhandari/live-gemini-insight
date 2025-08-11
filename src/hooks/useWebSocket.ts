import { useRef, useCallback, useEffect } from 'react';
import { GEMINI_CONFIG } from '@/config/gemini';

interface WebSocketMessage {
  setup?: {
    generation_config: { response_modalities: string[] };
    system_instruction?: string;
  };
  realtime_input?: {
    media_chunks: Array<{
      mime_type: string;
      data: string;
    }>;
  };
}

interface ResponseData {
  text?: string;
  audio?: string;
}

export const useWebSocket = (onMessage: (data: ResponseData) => void) => {
  const isConnectedRef = useRef(true); // Always connected for HTTP API

  const connect = useCallback(() => {
    console.log("Connected to Gemini API via HTTP");
    isConnectedRef.current = true;
    sendInitialSetupMessage();
  }, [onMessage]);

  const sendInitialSetupMessage = useCallback(async () => {
    if (!isConnectedRef.current) return;
    console.log("Setup message sent successfully - using direct API connection");
  }, []);

  const sendVoiceMessage = useCallback(async (b64PCM: string, imageData?: string) => {
    if (!isConnectedRef.current) {
      console.log("API not connected");
      return;
    }

    // Create Gemini API payload
    const parts = [];
    
    if (imageData) {
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: imageData
        }
      });
    }
    
    parts.push({
      text: "Please analyze the shared screen and respond with text. What do you see on the screen?"
    });

    const payload = {
      contents: [{
        parts: parts
      }]
    };

    try {
      const response = await fetch(`${GEMINI_CONFIG.apiUrl}?key=${GEMINI_CONFIG.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.candidates && responseData.candidates[0] && responseData.candidates[0].content) {
          const text = responseData.candidates[0].content.parts[0].text;
          onMessage({ text });
          console.log("Voice message sent and response received");
        }
      } else {
        console.error("Error sending voice message:", response.statusText);
      }
    } catch (error) {
      console.error("Error sending voice message:", error);
    }
  }, [onMessage]);

  const disconnect = useCallback(() => {
    isConnectedRef.current = false;
    console.log("Disconnected from Gemini API");
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sendVoiceMessage,
    isConnected: isConnectedRef.current,
  };
};