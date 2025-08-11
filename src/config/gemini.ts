// Gemini API Configuration
export const GEMINI_CONFIG = {
  apiKey: "AIzaSyDaCncev3_HALqANYdyYuVD5cW0-Qas-IQ",
  model: "gemini-2.0-flash-exp",
  // Use Supabase Edge Function instead of local WebSocket
  apiUrl: `${window.location.origin}/functions/v1/gemini-proxy`,
} as const;