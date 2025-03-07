# Supabase Edge Functions Documentation

## Project Structure

```
functions/
├── _shared/              # Shared utilities and configurations
│   └── cors.ts          # CORS headers and configuration
├── chunkEmbed/          # Knowledge base article chunking and embedding
│   ├── index.ts         # Main function implementation
│   ├── deno.json        # Deno configuration
│   └── deno.lock        # Deno dependencies lock file
├── .env                 # Local environment variables
└── functions_docs.md    # This documentation
```

## General Information

### Overview
Edge Functions in Supabase are server-side functions that run on the edge (close to users) using Deno runtime. They provide a way to execute custom server-side logic without managing traditional server infrastructure.

### Environment Variables
- Environment variables are managed in two places:
  1. **Local Development**: Create a `.env` file in the `functions/` directory with required variables
  2. **Production**: Set variables in Supabase Dashboard under Settings > Edge Functions
  
Required environment variables for our functions:
```env
OPENAI_API_KEY=your_api_key
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### CORS and Headers
All functions should handle CORS properly. We use a shared CORS configuration:

1. Import the shared CORS headers:
```typescript
import { corsHeaders } from '../_shared/cors.ts'
```

2. Handle CORS preflight requests in your function:
```typescript
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Your function logic here...
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
```

### Required Imports
Standard imports for edge functions:
```typescript
// HTTP server
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// Supabase client
import { createClient } from "@supabase/supabase-js"
// CORS configuration
import { corsHeaders } from '../_shared/cors.ts'
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
Processes knowledge base articles by chunking them into smaller pieces, generating embeddings using OpenAI, and storing them in the database for semantic search capabilities.

#### Key Features
- Deletes existing chunks before creating new ones (for article updates)
- Configurable chunk size and overlap
- Uses OpenAI's text-embedding-ada-002 model
- Handles CORS for browser requests

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

#### Example Usage (Frontend)
```typescript
// Creating a new article
const { error: functionError } = await supabase.functions.invoke(
  'chunkEmbed',
  {
    body: JSON.stringify({
      articleId: articleData.id,
      articleText: content,
      chunkSize: 1000,
      overlap: 50
    })
  }
)

// Updating an existing article
const { error: functionError } = await supabase.functions.invoke(
  'chunkEmbed',
  {
    body: JSON.stringify({
      articleId: id,
      articleText: content,
      chunkSize: 1000,
      overlap: 50
    })
  }
)
```

#### Error Handling
The function returns appropriate HTTP status codes:
- 200: Success
- 400: Bad Request (invalid input or processing error)
- 401: Unauthorized (missing/invalid credentials)

Common error scenarios:
- Missing environment variables
- Failed to delete existing chunks
- Failed to generate embeddings
- Failed to insert new chunks

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
- Log errors appropriately but don't expose sensitive details
- Handle both function-specific and general errors
- Provide meaningful error messages to users

### CORS and Headers
- Always include CORS headers in responses
- Use the shared CORS configuration
- Include proper Content-Type headers
- Handle OPTIONS requests for preflight

### Performance
- Delete existing chunks before creating new ones
- Use reasonable chunk sizes (default: 1000 characters)
- Consider rate limiting for bulk operations
- Monitor OpenAI API usage and costs

### Security
- Use environment variables for sensitive data
- Never expose API keys in responses or logs
- Use service role key only within edge functions
- Validate input data before processing

### Monitoring
- Use Supabase Dashboard to monitor function execution
- Monitor OpenAI API usage and costs
- Set up error tracking and logging
- Watch for failed chunk operations

### Development Workflow
1. Local Testing:
   ```bash
   supabase functions serve
   ```
2. Deployment:
   ```bash
   supabase functions deploy chunkEmbed
   ```
3. Verify in Supabase Dashboard
4. Monitor logs for errors

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