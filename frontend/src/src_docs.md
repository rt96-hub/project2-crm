# Source Directory Documentation

This document provides a detailed overview of the `src/` directory structure, including file purposes, dependencies, and relationships.

## Root Files

### Entry Points

- `main.tsx`
  - Primary application entry point
  - Dependencies: React, ReactDOM, App component
  - Responsible for:
    - Mounting the React application
    - Setting up root providers
    - Initializing the application

- `App.tsx`
  - Root component of the application
  - Dependencies: React Router, UserContext, ThemeContext
  - Depended on by: `main.tsx`
  - Responsible for:
    - Main routing configuration
    - Authentication flow management
    - Global layout structure

### Styling

- `index.css`
  - Global stylesheet
  - Dependencies: Tailwind CSS
  - Contains:
    - Tailwind directives (@tailwind base, components, utilities)
    - Global CSS variables
    - Base styling rules

- `App.css`
  - Application-specific styles
  - Dependencies: index.css
  - Contains:
    - Component-specific styles
    - Custom animations
    - Layout utilities

### Type Definitions

- `vite-env.d.ts`
  - Vite-specific TypeScript declarations
  - Used for environment variables typing
  - Essential for TypeScript compilation

## Directories

### `pages/`
Main route components that represent different views in the application.

- `Login.tsx`
  - Authentication page
  - Dependencies: UserContext, Supabase
  - Handles user login/signup flows

- `Dashboard.tsx`
  - Main dashboard view
  - Dependencies: DashboardLayout, PageContainer
  - Entry point after authentication

- `Admin.tsx`
  - Administrative interface
  - Dependencies: UserContext, DashboardLayout
  - Manages user and system settings

- `Customers.tsx`, `Reporting.tsx`, `KnowledgeBase.tsx`, `Tickets.tsx`
  - Core CRM functionality pages
  - Dependencies: DashboardLayout, PageContainer
  - Currently in initial implementation phase

- `Welcome.tsx`
  - Landing/onboarding page
  - Dependencies: UserContext
  - First-time user experience

### `components/`
Reusable UI components used across multiple pages.

- `DashboardLayout.tsx`
  - Main layout wrapper
  - Dependencies: Sidebar, ThemeContext
  - Depended on by: All authenticated pages
  - Provides consistent layout structure

- `Sidebar.tsx`
  - Navigation component
  - Dependencies: UserContext, ThemeContext
  - Depended on by: DashboardLayout
  - Handles main navigation and user context

- `ProfilePopout.tsx`
  - User profile menu
  - Dependencies: UserContext, Supabase
  - Handles user-specific actions and settings

- `ThemeToggle.tsx`
  - Theme switching component
  - Dependencies: ThemeContext
  - Controls light/dark mode

- `PageContainer.tsx`
  - Standard page wrapper
  - Dependencies: None
  - Provides consistent padding and layout

### `context/`
React Context providers for global state management.

- `UserContext.tsx`
  - Authentication and user state management
  - Dependencies: Supabase, React
  - Depended on by: Most components
  - Provides:
    - User authentication state
    - Login/logout functions
    - User profile data

- `ThemeContext.tsx`
  - Theme state management
  - Dependencies: React
  - Depended on by: UI components
  - Manages light/dark mode preferences

### `lib/`
Utility functions and service configurations.

- `supabase.ts`
  - Supabase client configuration
  - Dependencies: @supabase/supabase-js
  - Depended on by: UserContext, API calls
  - Initializes and exports Supabase client

### `types/`
TypeScript type definitions.

- `database.types.ts`
  - Database schema types
  - Dependencies: Supabase types
  - Depended on by: All components using database data
  - Contains:
    - Table definitions
    - Custom type utilities
    - Database schema interfaces

### `assets/`
Static assets used throughout the application.
- Contains images, icons, and other media files
- Used by components and pages for visual elements

## Key Dependencies and Relationships

1. Authentication Flow:
   - UserContext → Supabase → Login/Profile components
   - Required for protected routes and user operations

2. Layout Structure:
   - DashboardLayout → Sidebar → Individual pages
   - Provides consistent navigation and structure

3. Theme Management:
   - ThemeContext → ThemeToggle → All themed components
   - Ensures consistent styling across the application

## Important Notes

1. Component Dependencies:
   - Most components depend on UserContext for authentication state
   - UI components typically depend on ThemeContext
   - Pages depend on layout components

2. State Management:
   - Context is used for global state (user, theme)
   - Local state is managed within components
   - Supabase handles data persistence

3. Type Safety:
   - All components use TypeScript
   - Database types are auto-generated from Supabase schema
   - Strict type checking is enabled

4. Routing:
   - React Router handles navigation
   - Protected routes require authentication
   - Sidebar provides main navigation structure 