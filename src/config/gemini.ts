// Gemini API Configuration
export const GEMINI_CONFIG = {
  apiKey: "AIzaSyDaCncev3_HALqANYdyYuVD5cW0-Qas-IQ",
  model: "gemini-2.0-flash-exp",
  websocketUrl: "ws://localhost:9083",
} as const;

// Note: This API key is used by the Python WebSocket server backend
// Update your Python server's environment variable or code to use this key