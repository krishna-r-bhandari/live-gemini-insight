import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, headers } = req
    const upgrade = headers.get("upgrade") || ""
    
    if (upgrade.toLowerCase() !== "websocket") {
      return new Response("Expected websocket", { status: 426 })
    }

    const { socket, response } = Deno.upgradeWebSocket(req)

    let geminiWs: WebSocket | null = null

    socket.addEventListener("open", () => {
      console.log("Client WebSocket connected")
      
      // Connect to Gemini API WebSocket
      const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.StreamGenerateContent?key=${Deno.env.get('GEMINI_API_KEY')}`
      
      geminiWs = new WebSocket(geminiUrl)
      
      geminiWs.addEventListener("open", () => {
        console.log("Connected to Gemini API")
      })
      
      geminiWs.addEventListener("message", (event) => {
        console.log("Received from Gemini:", event.data)
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(event.data)
        }
      })
      
      geminiWs.addEventListener("error", (error) => {
        console.error("Gemini WebSocket error:", error)
      })
      
      geminiWs.addEventListener("close", () => {
        console.log("Gemini WebSocket closed")
        if (socket.readyState === WebSocket.OPEN) {
          socket.close()
        }
      })
    })

    socket.addEventListener("message", (event) => {
      console.log("Received from client:", event.data)
      if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
        geminiWs.send(event.data)
      }
    })

    socket.addEventListener("close", () => {
      console.log("Client WebSocket disconnected")
      if (geminiWs) {
        geminiWs.close()
      }
    })

    socket.addEventListener("error", (error) => {
      console.error("Client WebSocket error:", error)
      if (geminiWs) {
        geminiWs.close()
      }
    })

    return response
  } catch (error) {
    console.error("WebSocket upgrade error:", error)
    return new Response("WebSocket upgrade failed", { status: 500, headers: corsHeaders })
  }
})