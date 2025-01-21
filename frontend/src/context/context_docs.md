# Context Documentation

This document provides a detailed overview of the React Context providers used in the frontend application for global state management.

## User Context (`UserContext.tsx`)

Global user authentication and profile management context.

### Exports

- `UserProvider`: Context provider component
- `useUser`: Custom hook for accessing user context

### Types

```typescript
type Profile = Database['public']['Tables']['profiles']['Row']

type UserContextType = {
  profile: Profile | null
  loading: boolean
  error: string | null
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}
```

### Dependencies

- React (createContext, useState, useEffect)
- Supabase client
- Database types

### API Interactions

1. Profile Fetching:
   ```typescript
   // Get current user
   const { data: { user } } = await supabase.auth.getUser()
   
   // Fetch profile data
   const { data, error } = await supabase
     .from('profiles')
     .select('*')
     .eq('user_id', user.id)
     .single()
   ```

2. Profile Updates:
   ```typescript
   const { error } = await supabase
     .from('profiles')
     .update(updates)
     .eq('user_id', profile.user_id)
   ```

3. Authentication State:
   ```typescript
   // Subscribe to auth changes
   supabase.auth.onAuthStateChange(() => {
     fetchProfile()
   })
   ```

### State Management

- `profile`: Current user's profile data
- `loading`: Loading state for async operations
- `error`: Error state for failed operations
- `updateProfile`: Function to update user profile

### Used By

- `ProfilePopout` component
- `Sidebar` component (for admin status)
- Protected routes (for authentication)
- Any component needing user data

### Important Notes

1. Authentication Flow:
   - Automatically fetches profile on mount
   - Subscribes to auth state changes
   - Updates profile in real-time
   - Handles error states

2. Error Handling:
   - Typed error messages
   - Proper error propagation
   - Loading state management

3. Performance:
   - Memoized context value
   - Cleanup of auth subscriptions
   - Optimized re-renders

## Theme Context (`ThemeContext.tsx`)

Global theme management for the application.

### Exports

- `ThemeProvider`: Context provider component
- `useTheme`: Custom hook for accessing theme context

### Types

```typescript
type ThemeContextType = {
  isPowerMode: boolean
  toggleTheme: () => void
}
```

### Dependencies

- React (createContext, useState)

### State Management

- `isPowerMode`: Current theme state
- `toggleTheme`: Function to toggle theme

### Used By

- `DashboardLayout`
- `Sidebar`
- `ProfilePopout`
- `ThemeToggle`
- Any component with theme-specific styling

### Important Notes

1. Theme Implementation:
   - Simple boolean toggle
   - No persistent storage (resets on refresh)
   - Synchronous updates

2. Performance:
   - Minimal re-renders
   - Lightweight state

## Context Usage Patterns

1. Provider Hierarchy:
   ```tsx
   <ThemeProvider>
     <UserProvider>
       <App />
     </UserProvider>
   </ThemeProvider>
   ```

2. Hook Usage:
   ```tsx
   function MyComponent() {
     const { profile, updateProfile } = useUser()
     const { isPowerMode } = useTheme()
     // ...
   }
   ```

3. Error Boundaries:
   - Providers include error checking
   - Hooks throw if used outside provider

## Best Practices

1. Context Access:
   - Always use provided hooks
   - Never access context directly
   - Handle loading and error states

2. Updates:
   - Batch related updates
   - Handle optimistic updates
   - Provide proper error feedback

3. Type Safety:
   - All contexts are fully typed
   - Type inference for hooks
   - Runtime type checking

## Important Implementation Details

1. Authentication:
   - Real-time sync with Supabase
   - Automatic profile fetching
   - Proper cleanup on unmount

2. State Updates:
   - Atomic updates
   - Proper error handling
   - Loading state management

3. Performance Considerations:
   - Minimized context updates
   - Proper cleanup
   - Optimized re-renders

4. Error Handling:
   - Typed error messages
   - Proper error propagation
   - User-friendly error states 