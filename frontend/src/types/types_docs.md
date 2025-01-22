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
      priorities: PriorityTable
      profiles: ProfileTable
      statuses: StatusTable
      ticket_assignments: TicketAssignmentTable
      ticket_comments: TicketCommentTable
      ticket_history: TicketHistoryTable
      tickets: TicketTable
    }
    Functions: {
      get_all_active_profiles: ProfileFunction
      get_ticket_assignees: TicketAssigneeFunction
      is_admin: AdminCheckFunction
    }
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
  is_active: boolean | null
  is_admin: boolean | null
  job_title: string | null
  last_name: string | null
  user_id: string
  work_phone: string | null
}
```

#### Tickets Table
```typescript
type TicketRow = {
  created_at: string
  creator_id: string
  custom_fields: Json | null
  description: string | null
  due_date: string | null
  id: string
  organization_id: string | null
  priority_id: string
  resolved_at: string | null
  status_id: string
  title: string
  updated_at: string
}
```

#### Ticket Comments Table
```typescript
type TicketCommentRow = {
  author_id: string
  content: string
  created_at: string
  id: string
  is_internal: boolean
  ticket_id: string
  updated_at: string
}
```

#### Ticket History Table
```typescript
type TicketHistoryRow = {
  action: string
  actor_id: string
  changes: Json
  created_at: string
  id: string
  ticket_id: string
}
```

### Database Functions

#### `get_all_active_profiles`
Returns all active user profiles:
```typescript
type ProfileFunction = {
  Args: Record<PropertyKey, never>
  Returns: ProfileRow[]
}
```

#### `get_ticket_assignees`
Returns assignee information for given tickets:
```typescript
type TicketAssigneeFunction = {
  Args: {
    ticket_ids: string[]
  }
  Returns: {
    ticket_id: string
    assignee_id: string
    first_name: string
    last_name: string
  }[]
}
```

#### `is_admin`
Checks if current user is an admin:
```typescript
type AdminCheckFunction = {
  Args: Record<PropertyKey, never>
  Returns: boolean
}
```

### Utility Types

#### `Tables<T>`
Type helper for accessing table row types:
```typescript
// Usage example:
type UserProfile = Tables<'profiles'>
type Ticket = Tables<'tickets'>
```

#### `TablesInsert<T>`
Type helper for table insertion operations:
```typescript
// Usage example:
type NewProfile = TablesInsert<'profiles'>
type NewTicket = TablesInsert<'tickets'>
```

#### `TablesUpdate<T>`
Type helper for table update operations:
```typescript
// Usage example:
type ProfileUpdates = TablesUpdate<'profiles'>
type TicketUpdates = TablesUpdate<'tickets'>
```

## Type Usage Patterns

### Database Operations

1. Querying Data:
   ```typescript
   type TicketResponse = {
     data: Tables<'tickets'> | null
     error: Error | null
   }
   ```

2. Inserting Data:
   ```typescript
   const newTicket: TablesInsert<'tickets'> = {
     title: string,
     creator_id: string,
     priority_id: string,
     status_id: string
     // Optional fields
   }
   ```

3. Updating Data:
   ```typescript
   const updates: TablesUpdate<'tickets'> = {
     title?: string,
     description?: string,
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