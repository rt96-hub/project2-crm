// index.ts (Edge Function for chunking, embedding, and storing articles)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "@langchain/openai";
import { corsHeaders } from '../_shared/cors.ts';



// Helper function to chunk text
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = start + chunkSize
    const currentChunk = text.slice(start, end)
    chunks.push(currentChunk)
    start = end - overlap
    if (start < 0) {
      start = 0
    }
  }
  return chunks
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY } = Deno.env.toObject()
    const { articleId, articleText, chunkSize, overlap } = await req.json()

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase credentials in environment variables.")
    }
    if (!OPENAI_API_KEY) {
      throw new Error("Missing OpenAI API key in environment variables.")
    }

    // Initialize supabase client (service role for insert operations)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Chunk the article text
    const size = chunkSize || 1000
    const ovlp = overlap || 50
    const chunks = chunkText(articleText, size, ovlp)

    // Prepare embeddings using OpenAI
    const embeddingsProvider = new OpenAIEmbeddings({
      openAIApiKey: OPENAI_API_KEY,
      modelName: "text-embedding-ada-002"
    })

    // Embed each chunk and insert into the database
    for (const chunk of chunks) {
      const embeddingArray = await embeddingsProvider.embedQuery(chunk)
      // Convert embedding array to Postgres vector (pgvector) usage
      const embeddingString = '[' + embeddingArray.join(',') + ']'

      // Insert chunk records with vector data
      const { error } = await supabase
        .from('article_chunks')
        .insert({
          article_id: articleId,
          chunk_text: chunk,
          embedding: embeddingString
        })

      if (error) {
        throw new Error(`Error inserting chunk embedding: ${error.message}`)
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Chunks embedded and stored successfully." 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
}) 