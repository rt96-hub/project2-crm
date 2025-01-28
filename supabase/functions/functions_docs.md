# Supabase Edge Functions Documentation

## General Information

### Overview
Edge Functions in Supabase are server-side functions that run on the edge (close to users) using Deno runtime. They provide a way to execute custom server-side logic without managing traditional server infrastructure.

### Environment Variables
- Environment variables are managed in two places:
  1. **Local Development**: Create a `.env` file in the project root with required variables
  2. **Production**: Set variables in Supabase Dashboard under Settings > Edge Functions
  
Required environment variables for our functions:
```env
OPENAI_API_KEY=your_api_key
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Routing and Invocation
- Each function is deployed to a unique endpoint: `https://<project-ref>.functions.supabase.co/<function-name>`
- Functions are invoked via HTTP requests (GET, POST, etc.)
- Authentication is handled via the `Authorization` header:
  ```typescript
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  ```

### Local Development
1. Start the local development server:
   ```bash
   supabase functions serve
   ```
2. Functions will be available at: `http://localhost:54321/functions/v1/<function-name>`

### Deployment
Deploy functions to production:
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy <function-name>
```

---

## Available Functions

### 1. chunkEmbed
Chunks knowledge base articles into smaller pieces, generates embeddings using OpenAI, and stores them in the database for semantic search capabilities.

#### Requirements
- OpenAI API Key
- Supabase instance with pgvector extension enabled
- `article_chunks` table (created via migration)

#### Input Payload
```typescript
interface ChunkEmbedPayload {
  articleId: string;      // UUID of the knowledge base article
  articleText: string;    // Full text content to be chunked
  chunkSize?: number;     // Optional: size of each chunk (default: 1000)
  overlap?: number;       // Optional: overlap between chunks (default: 50)
}
```

#### Response Format
```typescript
interface ChunkEmbedResponse {
  success: boolean;
  message?: string;       // Success/failure message
  error?: string;         // Error message if success is false
}
```

#### Example Usage (React/TypeScript)
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function processArticle(articleId: string, content: string) {
  try {
    const { data: functionData, error: functionError } = await supabase.functions.invoke(
      'chunkEmbed',
      {
        body: JSON.stringify({
          articleId,
          articleText: content,
          chunkSize: 1000,
          overlap: 50
        })
      }
    )

    if (functionError) throw functionError
    return functionData
  } catch (error) {
    console.error('Error processing article:', error)
    throw error
  }
}
```

#### Error Handling
The function returns appropriate HTTP status codes:
- 200: Success
- 400: Bad Request (invalid input)
- 401: Unauthorized (missing/invalid credentials)
- 500: Internal Server Error

#### Rate Limiting
- No specific rate limits are imposed by the function
- Be mindful of OpenAI API rate limits and costs
- Consider implementing client-side throttling for bulk operations

#### Security
- Function requires authentication
- Write operations are restricted to service role only
- Read operations follow the same RLS policies as knowledge base articles

---

## Best Practices

### Error Handling
- Always wrap function calls in try-catch blocks
- Implement proper error handling in components
- Show appropriate loading states during function execution

### Performance
- Keep payload sizes reasonable
- Consider implementing client-side caching where appropriate
- Use background processing for large operations

### Security
- Never expose API keys or service role keys in client code
- Always use environment variables for sensitive data
- Implement proper input validation both client and server-side

### Monitoring
- Use Supabase Dashboard to monitor function execution
- Set up error tracking and logging
- Monitor costs related to external API usage (e.g., OpenAI) 