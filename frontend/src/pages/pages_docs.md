# Pages Documentation

This document provides a detailed overview of the page components in the frontend application, including their purposes, dependencies, and API interactions.

## Authentication Pages

### `Login.tsx`
Authentication page handling user sign-in and sign-up.

**Dependencies:**
- React Router (`useNavigate`)
- `ThemeContext`
- `UserContext`
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
     password: string,
     options: {
       data: {
         first_name: string,
         last_name: string
       }
     }
   })
   ```

**Features:**
- User authentication
- Form validation
- Error handling
- New user registration
- Password reset flow

### `Welcome.tsx`
Landing page for new users.

**Dependencies:**
- `UserContext`
- `ThemeContext`
- `PageContainer`

**Features:**
- Welcome message
- Getting started guide
- Quick links to key features
- Organization setup guidance

## Core Pages

### `Dashboard.tsx`
Main dashboard view after authentication.

**Dependencies:**
- `PageContainer`
- `UserContext`
- `ThemeContext`
- `TicketTable` component

**Features:**
- Activity overview
- Recent tickets
- Key metrics display
- Quick action buttons

### `Tickets.tsx`
Ticket management interface.

**Dependencies:**
- `PageContainer`
- `TicketTable` component
- `CreateTicketPopout`
- `UserContext`

**API Interactions:**
- Ticket listing and filtering
- Status updates
- Assignment changes

**Features:**
- Ticket list view
- Create new tickets
- Filter and search
- Bulk actions

### `TicketDetail.tsx`
Detailed ticket view and management.

**Dependencies:**
- `PageContainer`
- `TicketActivitySidebar`
- `EditTicketPopout`
- `RichTextViewer`
- `UserContext`

**API Interactions:**
1. Ticket Data:
   ```typescript
   const { data: ticket } = await supabase
     .from('tickets')
     .select('*, assignee:profiles(*), customer:profiles(*), organization:organizations(*)')
     .eq('id', ticketId)
     .single()
   ```

2. Activity Updates:
   ```typescript
   const { data: activities } = await supabase
     .from('ticket_activities')
     .select('*, user:profiles(*)')
     .eq('ticket_id', ticketId)
     .order('created_at', { ascending: false })
   ```

**Features:**
- Full ticket details
- Activity timeline
- Status management
- Assignment handling
- Customer communication

### `Customers.tsx`
Customer management interface.

**Dependencies:**
- `PageContainer`
- `OrganizationTable`
- `CreateOrganizationPopout`
- `UserContext`

**API Interactions:**
- Customer listing
- Organization management
- Contact information

**Features:**
- Customer directory
- Organization management
- Search and filtering
- Quick actions

### `CustomerDetail.tsx`
Detailed customer view.

**Dependencies:**
- `PageContainer`
- `EditOrganizationPopout`
- `TicketTable`
- `UserContext`

**API Interactions:**
1. Customer Data:
   ```typescript
   const { data: customer } = await supabase
     .from('organizations')
     .select('*, contacts:profiles(*), tickets(*)')
     .eq('id', organizationId)
     .single()
   ```

**Features:**
- Organization details
- Contact management
- Ticket history
- Activity timeline

### `Team.tsx`
Team management interface.

**Dependencies:**
- `PageContainer`
- `UserTable`
- `UserEditModal`
- `UserContext`

**API Interactions:**
- Team member listing
- Role management
- Permission updates

**Features:**
- Team directory
- Role management
- Permission control
- Activity monitoring

## Knowledge Base

### `KnowledgeBase.tsx`
Knowledge base article listing.

**Dependencies:**
- `PageContainer`
- `RichTextViewer`
- `UserContext`

**API Interactions:**
1. Article Listing:
   ```typescript
   const { data: articles } = await supabase
     .from('knowledge_base_articles')
     .select('*, author:profiles(*), category:kb_categories(*)')
     .order('created_at', { ascending: false })
   ```

**Features:**
- Article listing
- Category navigation
- Search functionality
- Create new articles

### `KnowledgeBaseArticle.tsx`
Article view component.

**Dependencies:**
- `PageContainer`
- `RichTextViewer`
- `UserContext`

**API Interactions:**
- Article content fetching
- View tracking
- Related articles

### `NewKnowledgeBaseArticle.tsx`
Article creation interface.

**Dependencies:**
- `PageContainer`
- `RichTextEditor`
- `UserContext`

**API Interactions:**
- Article creation
- Category management
- Media uploads

### `EditKnowledgeBaseArticle.tsx`
Article editing interface.

**Dependencies:**
- `PageContainer`
- `RichTextEditor`
- `UserContext`

**API Interactions:**
- Article updates
- Version control
- Media management

## Admin Section

### `Admin.tsx`
Administrative dashboard.

**Dependencies:**
- `PageContainer`
- `UserContext`
- `ConfigItemManager`

**Features:**
- System configuration
- User management
- Settings control
- Audit logging

### Admin Pages
Located in `/admin` directory:
- Configuration management
- System settings
- Audit logs
- Integration settings

## Page Relationships

1. Navigation Flow:
   ```
   Login → Welcome (new users)
        → Dashboard (existing users)
   
   Dashboard
   ├── Tickets → TicketDetail
   ├── Customers → CustomerDetail
   ├── Team
   ├── KnowledgeBase
   │   ├── KnowledgeBaseArticle
   │   ├── NewKnowledgeBaseArticle
   │   └── EditKnowledgeBaseArticle
   └── Admin (admin users only)
   ```

2. Data Flow:
   ```
   Customers ←→ CustomerDetail
              ↓
   Tickets ←→ TicketDetail
           ↓
   KnowledgeBase ←→ Articles
   ```

## Common Patterns

1. Protected Routes:
   ```typescript
   const ProtectedRoute = ({ children }) => {
     const { profile, loading } = useUser()
     if (loading) return <Loading />
     if (!profile) return <Navigate to="/login" />
     return children
   }
   ```

2. Permission Checks:
   ```typescript
   const AdminRoute = ({ children }) => {
     const { hasPermission } = useUser()
     if (!hasPermission('admin')) return <AccessDenied />
     return children
   }
   ```

3. Data Loading:
   ```typescript
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<Error | null>(null)
   const [data, setData] = useState<Data | null>(null)

   useEffect(() => {
     fetchData()
       .then(setData)
       .catch(setError)
       .finally(() => setLoading(false))
   }, [])
   ```

## Important Notes

1. Authentication:
   - All pages except Login require authentication
   - Admin section requires specific permissions
   - Session management handled by UserContext

2. Data Management:
   - Real-time updates where applicable
   - Optimistic UI updates
   - Proper error handling
   - Loading states

3. Performance:
   - Route-based code splitting
   - Lazy loading of heavy components
   - Optimized data fetching
   - Proper cleanup

4. Error Handling:
   - API error management
   - User feedback
   - Fallback UI
   - Recovery options 