import { useRef, useCallback, useEffect } from 'react';

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

export const useWebSocket = (url: string, onMessage: (data: ResponseData) => void) => {
  const webSocketRef = useRef<WebSocket | null>(null);
  const isConnectedRef = useRef(false);

  const connect = useCallback(() => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) return;

    console.log("connecting: ", url);
    webSocketRef.current = new WebSocket(url);

    webSocketRef.current.onopen = () => {
      console.log("websocket open");
      isConnectedRef.current = true;
      sendInitialSetupMessage();
    };

    webSocketRef.current.onclose = (event) => {
      console.log("websocket closed: ", event);
      isConnectedRef.current = false;
    };

    webSocketRef.current.onerror = (event) => {
      console.log("websocket error: ", event);
      isConnectedRef.current = false;
    };

    webSocketRef.current.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      onMessage(messageData);
    };
  }, [url, onMessage]);

  const sendInitialSetupMessage = useCallback(() => {
    if (!webSocketRef.current || !isConnectedRef.current) return;

    const setupMessage: WebSocketMessage = {
      setup: {
        generation_config: { response_modalities: ["AUDIO"] },
        system_instruction: `You are a helpful assistant for screen sharing sessions. Your role is to: 
                           1) Analyze and describe the content being shared on screen 
                           2) Answer questions about the shared content 
                           3) Provide relevant information and context about what's being shown 
                           4) Assist with technical issues related to screen sharing 
                           5) Maintain a professional and helpful tone. Focus on being concise and clear in your responses.`
      },
    };

    webSocketRef.current.send(JSON.stringify(setupMessage));
    console.log("sent setup message");
  }, []);

  const sendVoiceMessage = useCallback((b64PCM: string, imageData?: string) => {
    if (!webSocketRef.current || !isConnectedRef.current) {
      console.log("websocket not initialized");
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

    webSocketRef.current.send(JSON.stringify(payload));
    console.log("sent voice message");
  }, []);

  const disconnect = useCallback(() => {
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
      isConnectedRef.current = false;
    }
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