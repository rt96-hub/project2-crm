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
  isAdmin: boolean
  hasPermission: (permission: string) => boolean
}
```

### Dependencies

- React (createContext, useState, useEffect)
- Supabase client
- Database types

### API Interactions

1. Profile Management:
   ```typescript
   // Fetch profile
   const { data, error } = await supabase
     .from('profiles')
     .select('*, organizations(*)')
     .eq('user_id', user.id)
     .single()

   // Update profile
   const { error } = await supabase
     .from('profiles')
     .update(updates)
     .eq('user_id', profile.user_id)
   ```

2. Authentication:
   ```typescript
   // Auth state changes
   supabase.auth.onAuthStateChange(async (event, session) => {
     if (event === 'SIGNED_IN') {
       await fetchProfile()
     }
     if (event === 'SIGNED_OUT') {
       setProfile(null)
     }
   })
   ```

3. Permission Management:
   ```typescript
   // Permission checks
   const hasPermission = (permission: string) => {
     return profile?.permissions?.includes(permission) || isAdmin
   }
   ```

### State Management

- `profile`: Current user's profile data including organization relationships
- `loading`: Loading state for async operations
- `error`: Error state for failed operations
- `isAdmin`: Admin status of current user
- `hasPermission`: Function to check user permissions
- `updateProfile`: Function to update user profile

### Used By Components

#### Core Layout
- `DashboardLayout` (auth protection)
- `Sidebar` (navigation permissions)
- `ProfilePopout` (profile management)

#### Ticket Management
- `TicketTable` (permissions, assignments)
- `CreateTicketPopout` (user assignment)
- `EditTicketPopout` (permissions)
- `TicketActivitySidebar` (user actions)

#### Organization Management
- `OrganizationTable` (permissions)
- `CreateOrganizationPopout` (user association)
- `EditOrganizationPopout` (permissions)

#### User Management
- `UserTable` (admin functions)
- `UserEditModal` (permissions)
- `Team` page (user management)

#### Knowledge Base
- Knowledge base components (edit permissions)
- Article management (creation/editing rights)

### Important Notes

1. Authentication Flow:
   - Real-time auth state synchronization
   - Automatic profile fetching on auth changes
   - Organization relationship management
   - Permission-based access control

2. Error Handling:
   - Typed error messages
   - Loading state management
   - Failed operation recovery
   - Session expiration handling

3. Performance:
   - Memoized context value
   - Optimized permission checks
   - Efficient profile updates
   - Cleanup of subscriptions

## Theme Context (`ThemeContext.tsx`)

Global theme management for the application.

### Exports

- `ThemeProvider`: Context provider component
- `useTheme`: Custom hook for accessing theme context

### Types

```typescript
type Theme = 'light' | 'dark'

type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
}
```

### Dependencies

- React (createContext, useState, useEffect)
- Local storage for persistence

### State Management

- `theme`: Current theme ('light' | 'dark')
- `isDark`: Computed boolean for dark mode
- `toggleTheme`: Function to switch themes

### Used By Components

#### Layout Components
- `DashboardLayout` (theme application)
- `PageContainer` (styling)
- `Sidebar` (theme-based styling)

#### UI Components
- `ThemeToggle` (theme switching)
- All form components (styling)
- Modal components (theme-based overlays)

#### Content Components
- `RichTextEditor` (theme-based styling)
- `RichTextViewer` (content display)
- Table components (styling)

### Features

1. Theme Persistence:
   ```typescript
   // Load theme from storage
   const storedTheme = localStorage.getItem('theme') as Theme
   
   // Save theme changes
   useEffect(() => {
     localStorage.setItem('theme', theme)
   }, [theme])
   ```

2. System Preference Detection:
   ```typescript
   // Check system preference
   const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
   
   // Listen for system changes
   prefersDark.addEventListener('change', handleSystemThemeChange)
   ```

### Important Notes

1. Theme Implementation:
   - System preference detection
   - Local storage persistence
   - Real-time updates
   - Smooth transitions

2. Performance:
   - Minimal re-renders
   - Efficient theme switching
   - Proper cleanup of listeners
   - Optimized style updates

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
     const { profile, hasPermission } = useUser()
     const { isDark, toggleTheme } = useTheme()
     // Component logic
   }
   ```

3. Permission Checks:
   ```tsx
   function ProtectedComponent() {
     const { hasPermission } = useUser()
     
     if (!hasPermission('required_permission')) {
       return <AccessDenied />
     }
     
     return <Component />
   }
   ```

## Best Practices

1. Context Access:
   - Use provided hooks exclusively
   - Handle loading states appropriately
   - Implement proper error boundaries
   - Check permissions before operations

2. State Updates:
   - Use optimistic updates where appropriate
   - Batch related changes
   - Handle error states gracefully
   - Provide user feedback

3. Type Safety:
   - Maintain strict typing
   - Use proper type guards
   - Implement runtime checks
   - Keep types in sync with API

4. Performance:
   - Minimize context updates
   - Use proper memoization
   - Implement efficient cleanup
   - Optimize re-renders 