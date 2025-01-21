# Pages Documentation

This document provides a detailed overview of the page components in the frontend application, including their purposes, dependencies, and API interactions.

## Authentication Pages

### `Login.tsx`
Authentication page handling user sign-in and sign-up.

**Dependencies:**
- React Router (`useNavigate`)
- `ThemeContext` (for styling)
- `ThemeToggle` component
- Supabase client

**API Interactions:**
1. Sign In:
   ```typescript
   const { error } = await supabase.auth.signInWithPassword({
     email: string,
     password: string
   })
   ```

2. Sign Up:
   ```typescript
   const { error } = await supabase.auth.signUp({
     email: string,
     password: string
   })
   ```

**State Management:**
- Email and password form state
- Loading state
- Error state

**Features:**
- User authentication
- Form validation
- Error handling
- Theme-aware styling
- Responsive design

### `Welcome.tsx`
Landing page for new users.

**Dependencies:**
- `UserContext` (for user data)
- `ThemeContext` (for styling)

**Features:**
- Welcome message
- Initial user guidance
- Theme-aware styling

## Main Application Pages

### `Dashboard.tsx`
Main dashboard view after authentication.

**Dependencies:**
- `PageContainer` component
- `UserContext` (for profile data)
- `ThemeContext` (for styling)

**Features:**
- Personalized welcome message
- Loading state handling
- Theme-aware styling
- User profile display

### `Admin.tsx`
Administrative interface for user management.

**Dependencies:**
- `UserContext` (for admin check)
- `ThemeContext` (for styling)
- Supabase client
- Database types

**API Interactions:**
1. Fetch Users:
   ```typescript
   const { data, error } = await supabase
     .from('profiles')
     .select('*')
     .order('created_at', { ascending: false })
   ```

2. Toggle Admin Status:
   ```typescript
   const { error } = await supabase
     .from('profiles')
     .update({ is_admin: boolean })
     .eq('user_id', userId)
   ```

3. Toggle User Active Status:
   ```typescript
   const { error } = await supabase
     .from('profiles')
     .update({ is_active: boolean })
     .eq('user_id', userId)
   ```

**State Management:**
- Users list
- Loading state
- Admin status checks

**Features:**
- User management interface
- Admin role toggle
- User activation toggle
- Sorted user list
- Protected route (admin only)

## Feature Pages (In Development)

### `Customers.tsx`
Customer management interface.

**Dependencies:**
- `PageContainer` component
- `ThemeContext` (for styling)

**Status:** Initial implementation

### `Tickets.tsx`
Support ticket management interface.

**Dependencies:**
- `PageContainer` component
- `ThemeContext` (for styling)

**Status:** Initial implementation

### `KnowledgeBase.tsx`
Knowledge base and documentation interface.

**Dependencies:**
- `PageContainer` component
- `ThemeContext` (for styling)

**Status:** Initial implementation

### `Reporting.tsx`
Analytics and reporting interface.

**Dependencies:**
- `PageContainer` component
- `ThemeContext` (for styling)

**Status:** Initial implementation

## Page Relationships

1. Authentication Flow:
   ```
   Login → Dashboard
        → Welcome (for new users)
   ```

2. Navigation Structure:
   ```
   Dashboard
   ├── Customers
   ├── Tickets
   ├── KnowledgeBase
   ├── Reporting
   └── Admin (if user is admin)
   ```

## Common Patterns

1. Protected Routes:
   - All pages except Login require authentication
   - Admin page requires admin role
   - Redirect to login if unauthenticated

2. Layout Structure:
   - All authenticated pages use `PageContainer`
   - Consistent header and navigation
   - Theme-aware styling

3. Data Loading:
   - Loading states during data fetch
   - Error handling for API calls
   - Optimistic updates where applicable

## Important Notes

1. Authentication:
   - Login page handles both sign-in and sign-up
   - Auth state managed through UserContext
   - Protected route redirects

2. Admin Access:
   - Admin page checks user role
   - Admin functions properly typed
   - Secure API calls

3. Error Handling:
   - Form validation
   - API error handling
   - User feedback

4. Performance:
   - Lazy loading where applicable
   - Optimized re-renders
   - Proper cleanup

5. Styling:
   - Theme context integration
   - Power mode variations
   - Responsive design
   - Consistent UI patterns 