# Library Documentation

This document provides a detailed overview of the `lib/` directory, which contains utility functions and service configurations used throughout the frontend application.

## Supabase Client (`supabase.ts`)

Primary database and authentication client configuration.

### Configuration

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Dependencies

- `@supabase/supabase-js`: Supabase JavaScript client
- Environment variables:
  - `VITE_SUPABASE_URL`: Supabase project URL
  - `VITE_SUPABASE_ANON_KEY`: Public anonymous API key

### Used By

- `UserContext` (authentication and profile management)
- `ProfilePopout` (user profile operations)
- Any component making direct database queries

### Available Operations

1. Authentication:
   ```typescript
   // Sign in
   const { data, error } = await supabase.auth.signInWithPassword({
     email: string,
     password: string
   })

   // Sign out
   await supabase.auth.signOut()

   // Get current user
   const { data: { user } } = await supabase.auth.getUser()

   // Listen to auth changes
   supabase.auth.onAuthStateChange((event, session) => {
     // Handle auth state changes
   })
   ```

2. Database Operations:
   ```typescript
   // Select data
   const { data, error } = await supabase
     .from('table_name')
     .select('*')
     .eq('column', 'value')

   // Insert data
   const { data, error } = await supabase
     .from('table_name')
     .insert([{ column: 'value' }])

   // Update data
   const { error } = await supabase
     .from('table_name')
     .update({ column: 'new_value' })
     .eq('id', 'record_id')

   // Delete data
   const { error } = await supabase
     .from('table_name')
     .delete()
     .eq('id', 'record_id')
   ```

3. Real-time Subscriptions:
   ```typescript
   const subscription = supabase
     .channel('table_changes')
     .on('postgres_changes', {
       event: '*',
       schema: 'public',
       table: 'table_name'
     }, (payload) => {
       // Handle change
     })
     .subscribe()
   ```

### Important Notes

1. Security:
   - Uses anonymous key for public operations
   - JWT tokens handled automatically
   - Role-based access control through Supabase policies

2. Error Handling:
   - All operations return `{ data, error }` objects
   - Type-safe error responses
   - Network error handling built-in

3. Performance:
   - Connection pooling
   - Automatic retries
   - Real-time subscriptions use WebSocket

4. Type Safety:
   - Full TypeScript support
   - Generated types from database schema
   - Runtime type checking

## Best Practices

1. Error Handling:
   ```typescript
   try {
     const { data, error } = await supabase.from('table').select()
     if (error) throw error
     // Handle data
   } catch (e) {
     // Handle error
   }
   ```

2. Authentication:
   - Always check auth state before protected operations
   - Handle token refresh automatically
   - Clean up subscriptions

3. Database Operations:
   - Use typed queries
   - Implement proper error handling
   - Follow security best practices

## Common Patterns

1. Protected Routes:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) {
     // Redirect to login
   }
   ```

2. Real-time Updates:
   ```typescript
   useEffect(() => {
     const subscription = supabase
       .channel('changes')
       .on('postgres_changes', handler)
       .subscribe()

     return () => {
       subscription.unsubscribe()
     }
   }, [])
   ```

3. Data Fetching:
   ```typescript
   const fetchData = async () => {
     const { data, error } = await supabase
       .from('table')
       .select()
       .order('created_at', { ascending: false })
     // Handle result
   }
   ```

## Environment Setup

1. Required Variables:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

2. Development Setup:
   - Local environment file (`.env.local`)
   - Production environment file (`.env.production`)
   - Never commit sensitive keys

## Security Considerations

1. Access Control:
   - Use Row Level Security (RLS)
   - Implement proper policies
   - Validate user permissions

2. API Keys:
   - Only use anon key in frontend
   - Keep service role key secure
   - Rotate keys periodically

3. Data Validation:
   - Validate data on frontend
   - Use database constraints
   - Implement proper error handling 