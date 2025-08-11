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

    const setupMessage: WebSocketMessage = {
      setup: {
        generation_config: { response_modalities: ["TEXT"] }, // Changed to TEXT since HTTP API doesn't support audio
        system_instruction: `You are a helpful assistant for screen sharing sessions. Your role is to: 
                           1) Analyze and describe the content being shared on screen 
                           2) Answer questions about the shared content 
                           3) Provide relevant information and context about what's being shown 
                           4) Assist with technical issues related to screen sharing 
                           5) Maintain a professional and helpful tone. Focus on being concise and clear in your responses.`
      },
    };

    try {
      const response = await fetch(GEMINI_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setupMessage),
      });
      
      if (response.ok) {
        console.log("Setup message sent successfully");
      }
    } catch (error) {
      console.error("Error sending setup message:", error);
    }
  }, []);

  const sendVoiceMessage = useCallback(async (b64PCM: string, imageData?: string) => {
    if (!isConnectedRef.current) {
      console.log("API not connected");
      return;
    }

    const chunks: Array<{ mime_type: string; data: string }> = [
      {
        mime_type: "audio/pcm",
        data: b64PCM,
      }
    ];

    if (imageData) {
      chunks.push({
        mime_type: "image/jpeg",
        data: imageData,
      });
    }

    const payload: WebSocketMessage = {
      realtime_input: {
        media_chunks: chunks,
      },
    };

    try {
      const response = await fetch(GEMINI_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseData = await response.json();
        onMessage(responseData);
        console.log("Voice message sent and response received");
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