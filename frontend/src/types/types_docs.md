# Types Documentation

This document provides a detailed overview of the TypeScript type definitions used throughout the frontend application.

## Database Types (`database.types.ts`)

Generated TypeScript types that define the structure of the Supabase database schema.

### Core Types

#### `Json`
Utility type for JSON-compatible values:
```typescript
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
```

#### `Database`
Main database schema type containing all tables, views, and functions:
```typescript
type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: ProfileInsert
        Update: ProfileUpdate
        Relationships: []
      }
    }
    Views: { ... }
    Functions: { ... }
    Enums: { ... }
  }
  graphql_public: {
    // GraphQL-specific types
  }
}
```

### Table Definitions

#### Profiles Table
```typescript
type ProfileRow = {
  created_at: string
  email: string
  first_name: string | null
  id: number
  is_active: boolean | null
  is_admin: boolean | null
  job_title: string | null
  last_name: string | null
  user_id: string
  work_phone: string | null
}

type ProfileInsert = {
  // All fields optional except email and user_id
  email: string
  user_id: string
  first_name?: string | null
  // ...other fields
}

type ProfileUpdate = {
  // All fields optional
  email?: string
  first_name?: string | null
  // ...other fields
}
```

### Utility Types

#### `Tables<T>`
Type helper for accessing table row types:
```typescript
// Usage example:
type UserProfile = Tables<'profiles'>
```

#### `TablesInsert<T>`
Type helper for table insertion operations:
```typescript
// Usage example:
type NewProfile = TablesInsert<'profiles'>
```

#### `TablesUpdate<T>`
Type helper for table update operations:
```typescript
// Usage example:
type ProfileUpdates = TablesUpdate<'profiles'>
```

### Dependencies

- Generated from Supabase database schema
- Used by TypeScript for type checking
- Integrated with Supabase client

### Used By

1. Components:
   - `Admin.tsx` (user management)
   - `ProfilePopout.tsx` (profile updates)
   - Any component making database queries

2. Contexts:
   - `UserContext.tsx` (profile management)

3. API Calls:
   ```typescript
   // Example: Typed profile update
   const updateProfile = async (updates: TablesUpdate<'profiles'>) => {
     const { error } = await supabase
       .from('profiles')
       .update(updates)
       .eq('user_id', userId)
   }
   ```

## Type Usage Patterns

### Database Operations

1. Querying Data:
   ```typescript
   type ProfileResponse = {
     data: Tables<'profiles'> | null
     error: Error | null
   }
   ```

2. Inserting Data:
   ```typescript
   const newProfile: TablesInsert<'profiles'> = {
     email: string,
     user_id: string,
     // Optional fields
   }
   ```

3. Updating Data:
   ```typescript
   const updates: TablesUpdate<'profiles'> = {
     first_name: string,
     last_name: string,
     // All fields optional
   }
   ```

### Type Safety

1. Null Handling:
   ```typescript
   // Example: Safe profile access
   const name = profile?.first_name ?? 'Anonymous'
   ```

2. Type Guards:
   ```typescript
   // Example: Admin check
   const isAdmin = (profile: Tables<'profiles'>): boolean => {
     return profile.is_admin ?? false
   }
   ```

## Best Practices

1. Type Imports:
   ```typescript
   import type { Database } from '../types/database.types'
   type Profile = Database['public']['Tables']['profiles']['Row']
   ```

2. Type Assertions:
   ```typescript
   // Avoid
   const profile = data as Profile
   
   // Prefer
   if (isProfile(data)) {
     // data is typed as Profile
   }
   ```

3. Null Safety:
   - Always handle nullable fields
   - Use optional chaining
   - Provide fallback values

## Important Notes

1. Type Generation:
   - Types are auto-generated from Supabase
   - Don't modify generated types manually
   - Update by regenerating from schema

2. Type Safety:
   - Full TypeScript support
   - Runtime type checking needed
   - Handle nullable fields

3. Performance:
   - Types are development-only
   - No runtime overhead
   - Helps prevent bugs

4. Maintenance:
   - Update types when schema changes
   - Keep in sync with database
   - Version control with schema 