import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { ChatOpenAI } from '@langchain/openai'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required')
    }

    // Initialize the ChatOpenAI model
    const model = new ChatOpenAI({
      openAIApiKey: OPENAI_API_KEY,
      modelName: 'gpt-4o-mini',
      temperature: 0.6
    })

    // Simple test message to confirm system is operational
    const response = await model.invoke("Please respond with a goofy clown like confirmation message if you can process this message. Use emojis and make it funny.")

    return new Response(
      JSON.stringify({
        success: true,
        message: response,
        status: 'AI system is functioning correctly'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
}) 