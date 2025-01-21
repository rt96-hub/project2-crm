# Components Documentation

This document provides a detailed overview of the components in the frontend application, including their purposes, dependencies, and interactions.

## Layout Components

### `DashboardLayout.tsx`
Main layout wrapper for authenticated pages.

**Dependencies:**
- React Router (`Outlet`)
- `Sidebar` component
- `ThemeContext` (for power mode styling)
- `ThemeToggle` component

**Used by:**
- All authenticated route components
- Wrapped around all protected routes in the application

**Functionality:**
- Provides consistent layout structure
- Handles responsive sidebar integration
- Manages theme-based styling
- Renders the main content area with proper spacing

### `PageContainer.tsx`
Standard wrapper for page content.

**Props:**
- `title: string` - Page title
- `children: React.ReactNode` - Page content

**Dependencies:**
- None (pure presentational component)

**Used by:**
- Individual page components
- Any component needing consistent page styling

**Functionality:**
- Provides consistent padding and styling
- Renders page title with standard formatting
- Ensures consistent content layout

## Navigation Components

### `Sidebar.tsx`
Main navigation component.

**Dependencies:**
- React Router (`Link`, `useLocation`)
- `ProfilePopout` component
- `ThemeContext` (for power mode styling)
- `UserContext` (for user profile and admin status)

**Used by:**
- `DashboardLayout`

**State Management:**
- Manages profile popout visibility
- Tracks current route for active highlighting

**Functionality:**
- Renders navigation menu
- Handles route navigation
- Shows/hides admin options based on user role
- Manages profile popout interaction
- Provides power mode styling variations

## User Interface Components

### `ProfilePopout.tsx`
User profile management component.

**Dependencies:**
- React Router (`useNavigate`)
- `UserContext` (for profile data and updates)
- `ThemeContext` (for power mode styling)
- Supabase client (for authentication)

**Used by:**
- `Sidebar` component

**State Management:**
- Manages edit mode state
- Handles form data for profile updates

**API Interactions:**
1. Profile Updates:
   ```typescript
   updateProfile({
     first_name: string,
     last_name: string,
     work_phone: string,
     job_title: string
   })
   ```
2. Authentication:
   ```typescript
   supabase.auth.signOut()
   ```

**Functionality:**
- Displays user profile information
- Provides profile editing interface
- Handles logout functionality
- Shows preferences and support options
- Implements power mode styling variations

### `ThemeToggle.tsx`
Theme switching component.

**Dependencies:**
- `ThemeContext` (for theme state and toggle)

**Used by:**
- `DashboardLayout`

**Functionality:**
- Toggles between regular and power mode
- Provides visual feedback for current theme
- Implements animated transitions
- Handles theme-specific styling

## Component Relationships

1. Layout Hierarchy:
   ```
   DashboardLayout
   ├── Sidebar
   │   └── ProfilePopout
   ├── ThemeToggle
   └── PageContainer
       └── Page Content
   ```

2. Context Usage:
   - `ThemeContext`: Used by all components for styling
   - `UserContext`: Used by Sidebar and ProfilePopout

3. Router Integration:
   - Sidebar handles route navigation
   - ProfilePopout uses navigation for logout
   - DashboardLayout provides route outlet

## Styling Patterns

1. Theme-Based Styling:
   - All components implement power mode variations
   - Consistent use of Tailwind classes
   - Animation classes for power mode

2. Layout Patterns:
   - Fixed sidebar with main content margin
   - Consistent padding and spacing
   - Responsive design considerations

## Important Notes

1. Component Dependencies:
   - Most components depend on theme context
   - User-related components depend on user context
   - Layout components handle responsive behavior

2. State Management:
   - Local state for UI interactions
   - Context for global state (theme, user)
   - Props for component configuration

3. API Interactions:
   - Profile updates handled through UserContext
   - Authentication through Supabase client
   - Error handling implemented for API calls

4. Accessibility:
   - Semantic HTML structure
   - ARIA attributes where needed
   - Keyboard navigation support

5. Performance:
   - Components use React.memo where beneficial
   - State updates are batched appropriately
   - Animations optimized for performance 