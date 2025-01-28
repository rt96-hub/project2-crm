# Supabase Edge Functions Setup and Example Integrations

Below is a task list and outline for configuring and deploying Supabase Edge Functions in your project, including two sample function examples: one for chunking knowledge base articles and one for a simple LangChain/OpenAI call.

## Checklist

- [x] Install Supabase CLI  
- [x] Enable Edge Functions in your Supabase config  
- [x] Initialize your Edge Functions folder  
- [ ] Create the first Edge Function for chunking knowledge base articles  
- [ ] Create the second Edge Function for confirming an OpenAI call  
- [ ] Test functions locally  
- [ ] Deploy functions to production  
- [ ] Integrate function calls in your frontend (for example, when a user sends a message in the ticket conversation modal)

---

## 1. Set Up and Enable Edge Functions

- [x] In your Supabase dashboard, ensure Edge Functions are enabled:
  - Verify in your `supabase/config.toml` that `[edge_runtime] enabled = true`.
- [x] Make sure you install or update the Supabase CLI:
  - macOS example:
    ```
    brew install supabase/tap/supabase
    ```
- [x] In your project root (where the `supabase/` folder resides), confirm or initialize:
  ```
  supabase init
  ```

---

## 2. Edge Functions Folders

- [x] By default, Supabase looks for Edge Functions in `./supabase/functions/`.
- [x] Create or confirm this directory exists.

---

## 3. Writing the Chunking, Embedding, and Storing Function (Named "chunkEmbed")

Below is a revised approach that not only chunks the knowledge base articles but also embeds the chunks and stores them in your Supabase instance. This requires the pgvector extension to be enabled and a corresponding table for storing vectors.

- [x] Enable pgvector in Supabase by running a migration or using the Supabase dashboard. For example:
  ```
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

- [x] Create a table in your database to store vectors. For instance:
  ```
  CREATE TABLE article_chunks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id uuid NOT NULL,
    chunk_text text,
    embedding vector(1536), -- depending on the dimensions for your embedding
    created_at timestamptz DEFAULT now(),
    FOREIGN KEY (article_id) REFERENCES knowledge_base_articles (id)
  );
  ```

- [x] Create a new Edge Function folder, for example: `./supabase/functions/chunkEmbed/`.

- [x] Add an `index.ts` file in that folder:
```
// index.ts (Edge Function for chunking, embedding, and storing articles)
import { serve } from 'std/http/server'
import { createClient } from '@supabase/supabase-js'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'

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
      openAIApiKey: OPENAI_API_KEY
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
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
  ```

### Steps to Use This Function

- [ ] In your local environment or CI, deploy this function:
  ```
  supabase functions deploy chunkEmbed
  ```

- [ ] Test locally with:
  ```
  supabase functions serve --debug
  ```

- [ ] Once deployed, call the function with JSON body containing `articleId`, `articleText`, and optional chunk parameters:
```
  POST /chunkEmbed
  {
    "articleId": "<some-article-id>",
    "articleText": "Full text of the article...",
    "chunkSize": 1000,
    "overlap": 50
  }
  ```

When everything is configured properly, the function will:
1. Split the article text into chunks of a specified size with some overlap.  
2. Embed each chunk using OpenAI.  
3. Store those chunks and their embeddings in your Supabase `article_chunks` table.  

By enabling the pgvector extension, you can now perform vector-based queries on the stored embeddings, unlocking semantic search or other AI-driven features on your knowledge base articles.

---

## 4. Writing the Confirmation (LangChain/OpenAI) Function (Named "aiConfirmation")

- [ ] Create a new folder `./supabase/functions/aiConfirmation`.
- [ ] Add an `index.ts` file:
```
// index.ts (Edge Function for a simple LangChain/OpenAI call)
import { serve } from 'std/http/server'
import { OpenAI } from 'langchain/llms/openai'

serve(async (req) => {
  try {
    const requestData = await req.json()
    // Example: environment variable for your OpenAI key
    const apiKey = Deno.env.get('OPENAI_API_KEY') || ''
    const model = new OpenAI({ openAIApiKey: apiKey })

    // For demonstration, just call the model with some basic prompt
    const response = await model.call("Please confirm the system is operational.")

    // Return the response plus requestData if you'd like
    return new Response(JSON.stringify({
      success: true,
      requestData,
      aiMessage: response
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
  ```

---

## 5. Testing Locally

- [ ] Start your local Supabase stack:
  ```
  supabase start
  ```
- [ ] Run Edge Functions locally:
  ```
  supabase functions serve --debug
  ```
  (This compiles all functions in `supabase/functions/` and exposes them on a local port.)

- [ ] Test the endpoints (example with chunkArticles):
  ```
  curl -X POST -H "Content-Type: application/json" \
  -d '{"articleText": "Lorem ipsum...", "chunkSize": 100, "overlap": 20}' \
  http://localhost:54321/functions/v1/chunkArticles
  ```

- [ ] Similarly test `aiConfirmation`:
  ```
  curl -X POST -H "Content-Type: application/json" \
  -d '{"message": "Test"}' \
  http://localhost:54321/functions/v1/aiConfirmation
  ```

---

## 6. Deploying to Production

- [ ] Deploy each function separately or all at once:
  ```
  supabase functions deploy chunkArticles
  supabase functions deploy aiConfirmation
  ```

- [ ] Check the URLs in the Supabase dashboard under "Functions." They usually look like:
  ```
  https://<PROJECT_REF>.functions.supabase.co/chunkArticles
  https://<PROJECT_REF>.functions.supabase.co/aiConfirmation
  ```

- [ ] Set environment variables (like `OPENAI_API_KEY`) in your project's "Function environment variables" section (Supabase dashboard).

---

## 7. Usage in the Frontend

- [ ] Update your React or any client code to call the deployed function:
```
// Example usage in your ticket conversation modal
async function confirmAiMessage(message) {
  const endpoint = "https://<PROJECT_REF>.functions.supabase.co/aiConfirmation"
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userMessage: message })
  })
  const data = await response.json()
  return data
}
  ```

- [ ] For the chunking function, do something similar:
```
async function chunkArticleText(articleText) {
  const endpoint = "https://<PROJECT_REF>.functions.supabase.co/chunkArticles"
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ articleText, chunkSize: 1000, overlap: 50 })
  })
  return response.json()
}
  ```

---

## Next Steps

- [ ] Apply further logic in the chunking function (like storing embeddings, saving to DB).
- [ ] Integrate the AI confirmation responses into your ticket or messaging workflow more deeply. 
- [ ] Add error handling and loading states in the frontend to improve user experience. 
- [ ] Optimize for performance and cost by checking your usage patterns.

---

**By completing these tasks, you'll have two working Edge Functions in Supabase—one to chunk text for knowledge base articles and one to confirm an OpenAI call via LangChain.** 