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
Main database schema type containing all tables, views, and functions.

### Table Definitions

#### Knowledge Base
```typescript
// Articles
type KnowledgeBaseArticle = {
  body: string
  category_id: string
  created_at: string
  creator_id: string
  edited_at: string
  id: string
  is_active: boolean
  is_public: boolean
  name: string
}

// Categories
type KnowledgeBaseCategory = {
  created_at: string
  id: string
  is_active: boolean
  name: string
}
```

#### Organizations
```typescript
// Organization
type Organization = {
  created_at: string
  customer_since: string | null
  customer_status_id: string | null
  customer_type_id: string | null
  default_priority_id: string | null
  description: string | null
  id: string
  is_active: boolean
  name: string
  total_contract: number | null
  updated_at: string
}

// Organization Users
type OrganizationUser = {
  created_at: string
  id: string
  organization_id: string
  profile_id: string
}

// Organization Status
type OrganizationStatus = {
  created_at: string
  id: string
  is_active: boolean
  name: string
}

// Organization Type
type OrganizationType = {
  created_at: string
  id: string
  is_active: boolean
  name: string
}
```

#### Tickets
```typescript
// Ticket
type Ticket = {
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

// Ticket Assignment
type TicketAssignment = {
  assignment_type: string
  created_at: string
  id: string
  profile_id: string | null
  team_id: string | null
  ticket_id: string
  updated_at: string
}

// Ticket Comment
type TicketComment = {
  author_id: string
  content: string
  created_at: string
  id: string
  is_internal: boolean
  ticket_id: string
  updated_at: string
}

// Ticket Conversation
type TicketConversation = {
  created_at: string
  id: string
  profile_id: string
  text: string
  ticket_id: string
}

// Ticket History
type TicketHistory = {
  action: string
  actor_id: string
  changes: Json
  created_at: string
  id: string
  ticket_id: string
}
```

#### Users and Profiles
```typescript
type Profile = {
  created_at: string
  email: string
  first_name: string | null
  is_active: boolean | null
  is_admin: boolean | null
  is_customer: boolean | null
  job_title: string | null
  last_name: string | null
  user_id: string
  work_phone: string | null
}
```

#### Configuration Types
```typescript
// Priority
type Priority = {
  created_at: string
  id: string
  is_active: boolean
  name: string
}

// Status
type Status = {
  created_at: string
  id: string
  is_active: boolean
  is_counted_open: boolean
  name: string
}
```

### Database Functions

#### User Management
```typescript
// Get Active Employees
type GetAllActiveEmployeeProfiles = {
  Args: Record<PropertyKey, never>
  Returns: Profile[]
}

// Check Admin Status
type IsAdmin = {
  Args: Record<PropertyKey, never>
  Returns: boolean
}
```

#### Ticket Management
```typescript
// Get Ticket Assignees
type GetTicketAssignees = {
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

// Get Open Ticket Counts
type GetEmployeeOpenTicketCounts = {
  Args: Record<PropertyKey, never>
  Returns: {
    profile_id: string
    count: number
  }[]
}

type GetOrganizationOpenTicketCounts = {
  Args: Record<PropertyKey, never>
  Returns: {
    organization_id: string
    count: number
  }[]
}
```

### Type Helpers

#### Table Operations
```typescript
// Get Row Type
type TableRow<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

// Insert Type
type TableInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

// Update Type
type TableUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']
```

## Type Usage Patterns

### Database Operations

1. Querying Data:
```typescript
// Single Record
const getTicket = async (id: string) => {
  const { data, error } = await supabase
    .from('tickets')
    .select<'tickets', Ticket>()
    .eq('id', id)
    .single()
  return { data, error }
}

// Multiple Records with Relations
const getTicketsWithAssignees = async () => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      assignee:profiles(*),
      organization:organizations(*)
    `)
  return { data, error }
}
```

2. Inserting Data:
```typescript
// New Ticket
const createTicket = async (ticket: TableInsert<'tickets'>) => {
  const { data, error } = await supabase
    .from('tickets')
    .insert(ticket)
    .select()
    .single()
  return { data, error }
}
```

3. Updating Data:
```typescript
// Update Ticket
const updateTicket = async (id: string, updates: TableUpdate<'tickets'>) => {
  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}
```

### Type Safety

1. Type Guards:
```typescript
const isTicket = (data: unknown): data is Ticket => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'title' in data
  )
}
```

2. Null Handling:
```typescript
const getFullName = (profile: Profile): string => {
  return [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(' ') || 'Unknown'
}
```

## Best Practices

1. Type Imports:
```typescript
import type { Database } from '../types/database.types'
type Profile = Database['public']['Tables']['profiles']['Row']
```

2. Type Guards:
```typescript
// Use type predicates
function isValidTicket(data: unknown): data is Ticket {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'title' in data
  )
}

// Use with error handling
try {
  if (!isValidTicket(data)) {
    throw new Error('Invalid ticket data')
  }
  // data is typed as Ticket
} catch (error) {
  // Handle error
}
```

3. Null Safety:
```typescript
// Use nullish coalescing
const status = ticket.status_id ?? 'default'

// Use optional chaining
const orgName = ticket.organization?.name ?? 'No Organization'
```

## Important Notes

1. Type Generation:
   - Types are auto-generated from Supabase schema
   - Run generation after schema changes
   - Never modify generated types manually
   - Keep types in sync with database

2. Type Safety:
   - Use strict TypeScript configuration
   - Implement proper type guards
   - Handle null/undefined cases
   - Validate data at runtime

3. Performance:
   - Types are development-only
   - No runtime overhead
   - Help prevent bugs
   - Improve maintainability

4. Relationships:
   - Use proper join types
   - Handle nested data properly
   - Consider circular dependencies
   - Document complex relationships 