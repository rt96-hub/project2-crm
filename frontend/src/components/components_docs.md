# Components Documentation

This document provides a detailed overview of the components in the frontend application, including their purposes, dependencies, and interactions.

## Layout Components

### `DashboardLayout.tsx`
Main layout wrapper for authenticated pages.

**Dependencies:**
- React Router (`Outlet`)
- `Sidebar` component
- `ThemeContext` (for theme styling)

**Used by:**
- All authenticated route components
- Wrapped around all protected routes in the application

**Functionality:**
- Provides consistent layout structure
- Handles responsive sidebar integration
- Manages theme-based styling

### `PageContainer.tsx`
Standard wrapper for page content.

**Props:**
- `title: string` - Page title
- `children: React.ReactNode` - Page content

**Used by:**
- Individual page components
- Any component needing consistent page styling

## Navigation Components

### `Sidebar.tsx`
Main navigation component.

**Dependencies:**
- React Router (`Link`, `useLocation`)
- `ProfilePopout` component
- `ThemeContext`
- `UserContext`

**Used by:**
- `DashboardLayout`

**State Management:**
- Manages profile popout visibility
- Tracks current route for active highlighting

### `ConversationSidebar.tsx`
Chat and messaging interface sidebar.

**Dependencies:**
- `UserContext`
- `database.types` (for message types)
- Supabase real-time subscriptions

**Used by:**
- Ticket detail pages
- Customer interaction views

**API Interactions:**
- Real-time message updates
- Message history fetching
- User presence tracking

### `TicketActivitySidebar.tsx`
Ticket activity tracking sidebar.

**Dependencies:**
- `database.types` (for activity types)
- `UserContext`
- `RichTextViewer` component

**Used by:**
- `TicketDetail` page

**API Interactions:**
- Activity log fetching
- Real-time activity updates
- Comment management

## Ticket Management Components

### `TicketTable.tsx`
Ticket listing and management interface.

**Dependencies:**
- `database.types` (for ticket types)
- `UserContext`
- `ConfigItemManager`

**Used by:**
- `Tickets` page
- `CustomerDetail` page

**API Interactions:**
- Ticket listing and filtering
- Status updates
- Assignment changes

### `CreateTicketPopout.tsx`
Ticket creation modal.

**Dependencies:**
- `RichTextEditor` component
- `database.types`
- `UserContext`
- `ConfigItemManager`

**Used by:**
- `Tickets` page
- `CustomerDetail` page

**API Interactions:**
- Ticket creation
- Customer lookup
- File attachments

### `EditTicketPopout.tsx`
Ticket editing modal.

**Dependencies:**
- `RichTextEditor` component
- `database.types`
- `UserContext`
- `ConfigItemManager`

**Used by:**
- `TicketDetail` page

**API Interactions:**
- Ticket updates
- Status changes
- Assignment modifications

## Organization Management Components

### `OrganizationTable.tsx`
Organization listing and management.

**Dependencies:**
- `database.types` (for organization types)
- `UserContext`

**Used by:**
- `Customers` page

**API Interactions:**
- Organization listing
- Search and filtering
- Basic organization updates

### `CreateOrganizationPopout.tsx`
Organization creation modal.

**Dependencies:**
- `database.types`
- `UserContext`

**Used by:**
- `Customers` page

**API Interactions:**
- Organization creation
- Contact information validation
- Address verification

### `EditOrganizationPopout.tsx`
Organization editing modal.

**Dependencies:**
- `database.types`
- `UserContext`

**Used by:**
- `CustomerDetail` page

**API Interactions:**
- Organization updates
- Contact management
- Address updates

## User Management Components

### `UserTable.tsx`
User listing and management interface.

**Dependencies:**
- `database.types` (for user types)
- `UserContext`
- `UserEditModal`

**Used by:**
- `Team` page
- Admin interfaces

**API Interactions:**
- User listing
- Role management
- Status updates

### `UserEditModal.tsx`
User editing interface.

**Dependencies:**
- `database.types`
- `UserContext`

**Used by:**
- `UserTable` component
- Admin interfaces

**API Interactions:**
- User profile updates
- Permission management
- Role assignments

### `ProfilePopout.tsx`
User profile management.

**Dependencies:**
- `UserContext`
- `ThemeContext`
- Supabase auth

**Used by:**
- `Sidebar` component

**API Interactions:**
- Profile updates
- Password changes
- Preference management

## Rich Text Components

### `RichTextEditor.tsx`
Rich text editing component.

**Dependencies:**
- External rich text editor library
- `database.types` (for content types)

**Used by:**
- `CreateTicketPopout`
- `EditTicketPopout`
- Knowledge base components

### `RichTextViewer.tsx`
Rich text display component.

**Dependencies:**
- External rich text viewer library

**Used by:**
- `TicketActivitySidebar`
- Knowledge base components
- Ticket detail views

## Utility Components

### `ThemeToggle.tsx`
Theme switching component.

**Dependencies:**
- `ThemeContext`

**Used by:**
- `DashboardLayout`

### `HelpChatBubble.tsx`
Help interface component.

**Dependencies:**
- `UserContext`
- `ThemeContext`
- `HelpChatPopout`

**Used by:**
- Global application layout

**State Management:**
- Controls visibility of chat popout

### `HelpChatPopout.tsx`
Interactive chat interface for customer support.

**Dependencies:**
- `UserContext` (for user profile)
- `ThemeContext` (for styling)
- `database.types` (for ticket and conversation types)
- Supabase client

**Used by:**
- `HelpChatBubble` component

**State Management:**
- Manages ticket list and selection
- Handles message history
- Controls loading and error states
- Manages chat input

**API Interactions:**
- Fetches user's tickets
- Creates new support tickets
- Manages ticket conversations
- Retrieves organization information
- Handles priority and status lookups
- Real-time message updates

**Features:**
- Split view with ticket list and chat interface
- Automatic ticket creation for new conversations
- Organization-aware ticket management
- Message history with user information
- Real-time chat functionality
- Power mode theme support

**Database Tables Used:**
- `tickets`
- `ticket_conversations`
- `organization_users`
- `organizations`
- `priorities`
- `statuses`
- `profiles`

### `ConfigItemManager.tsx`
Configuration management interface.

**Dependencies:**
- `database.types`
- `UserContext`

**Used by:**
- `CreateTicketPopout`
- `EditTicketPopout`
- Admin configuration pages

**API Interactions:**
- Configuration item CRUD
- Category management
- Relationship mapping

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

2. Ticket Management Flow:
   ```
   TicketTable
   ├── CreateTicketPopout
   │   ├── RichTextEditor
   │   └── ConfigItemManager
   └── EditTicketPopout
       ├── RichTextEditor
       └── ConfigItemManager
   ```

3. Organization Management Flow:
   ```
   OrganizationTable
   ├── CreateOrganizationPopout
   └── EditOrganizationPopout
   ```

## Important Notes

1. Component Dependencies:
   - Most components depend on UserContext for authentication
   - UI components use ThemeContext for styling
   - Complex forms use ConfigItemManager for configuration

2. State Management:
   - Local state for UI interactions
   - Context for global state
   - Supabase for data persistence

3. API Interactions:
   - Real-time updates where applicable
   - Optimistic updates for better UX
   - Error handling and retry logic

4. Type Safety:
   - Strict TypeScript usage
   - Comprehensive prop typing
   - Database type integration

5. Performance:
   - Lazy loading for modals
   - Optimized re-renders
   - Cached API responses 