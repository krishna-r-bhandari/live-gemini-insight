import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeminiRequest {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found')
    }

    const requestData: GeminiRequest = await req.json()
    
    // Handle setup message
    if (requestData.setup) {
      console.log('Setup message received')
      return new Response(JSON.stringify({ status: 'setup_complete' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Handle realtime input
    if (requestData.realtime_input) {
      const chunks = requestData.realtime_input.media_chunks
      let audioData = ''
      let imageData = ''
      
      for (const chunk of chunks) {
        if (chunk.mime_type === 'audio/pcm') {
          audioData = chunk.data
        } else if (chunk.mime_type === 'image/jpeg') {
          imageData = chunk.data
        }
      }

      // Prepare Gemini API request
      const geminiRequest = {
        contents: [{
          parts: []
        }]
      }

      if (imageData) {
        geminiRequest.contents[0].parts.push({
          inline_data: {
            mime_type: 'image/jpeg',
            data: imageData
          }
        })
      }

      if (audioData) {
        geminiRequest.contents[0].parts.push({
          text: "Please analyze the shared screen and respond with audio. What do you see on the screen?"
        })
      }

      // Call Gemini API
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequest)
      })

      const geminiData = await geminiResponse.json()
      
      if (geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].content) {
        const text = geminiData.candidates[0].content.parts[0].text
        
        return new Response(JSON.stringify({ text }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response(JSON.stringify({ error: 'No valid request data' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})