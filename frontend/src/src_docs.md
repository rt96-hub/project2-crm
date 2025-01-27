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

- Core Pages:
  - `Dashboard.tsx`: Main dashboard view
  - `Login.tsx`: Authentication and user login
  - `Welcome.tsx`: Landing/onboarding page
  - `Tickets.tsx`: Ticket management interface
  - `TicketDetail.tsx`: Detailed ticket view and management
  - `Customers.tsx`: Customer management interface
  - `CustomerDetail.tsx`: Detailed customer view and management
  - `Team.tsx`: Team management interface
  - `Reporting.tsx`: Analytics and reporting interface

- Knowledge Base:
  - `KnowledgeBase.tsx`: Knowledge base article listing
  - `KnowledgeBaseArticle.tsx`: Article view component
  - `NewKnowledgeBaseArticle.tsx`: Article creation
  - `EditKnowledgeBaseArticle.tsx`: Article editing

- Admin Section:
  - `Admin.tsx`: Administrative dashboard
  - Contains admin-specific configuration pages

- Test Directory:
  - `__tests__/`: Contains page component tests

### `components/`
Reusable UI components used across multiple pages.

- Layout Components:
  - `DashboardLayout.tsx`: Main application layout wrapper
  - `PageContainer.tsx`: Standard page container
  - `Sidebar.tsx`: Main navigation sidebar
  - `ConversationSidebar.tsx`: Chat/messaging sidebar
  - `TicketActivitySidebar.tsx`: Ticket activity tracking

- Ticket Management:
  - `TicketTable.tsx`: Ticket listing and management
  - `CreateTicketPopout.tsx`: Ticket creation modal
  - `EditTicketPopout.tsx`: Ticket editing modal

- Organization Management:
  - `OrganizationTable.tsx`: Organization listing
  - `CreateOrganizationPopout.tsx`: Organization creation
  - `EditOrganizationPopout.tsx`: Organization editing

- User Management:
  - `UserTable.tsx`: User listing and management
  - `UserEditModal.tsx`: User editing interface
  - `ProfilePopout.tsx`: User profile management

- Rich Text Components:
  - `RichTextEditor.tsx`: Rich text editing component
  - `RichTextViewer.tsx`: Rich text display component

- Utility Components:
  - `ThemeToggle.tsx`: Theme switching
  - `HelpChatBubble.tsx`: Help interface
  - `ConfigItemManager.tsx`: Configuration management

- Test Directory:
  - `__tests__/`: Component test files

### `context/`
React Context providers for global state management.

- `UserContext.tsx`
  - Authentication and user state management
  - User profile and permissions
  - Login/logout functionality

- `ThemeContext.tsx`
  - Theme state management
  - Light/dark mode preferences

### `lib/`
Utility functions and service configurations.

- `supabase.ts`
  - Supabase client configuration
  - Database connection setup
  - Authentication services

### `types/`
TypeScript type definitions.

- `database.types.ts`
  - Comprehensive database schema types
  - Table interfaces and relationships
  - Custom type utilities

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

4. Data Management:
   - Ticket/Organization/User components → Supabase
   - CRUD operations through modals and forms

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

4. Testing:
   - Test directories present in components and pages
   - Component and page-level testing implemented
   - Setup configured in setupTests.ts 