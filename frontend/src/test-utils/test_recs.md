# Frontend Testing Recommendations

This document outlines recommended test coverage for our React components and pages. Tests are prioritized based on complexity, user interaction, and business logic importance.

## Components

### High Priority

#### ProfilePopout.tsx
- Test user profile data display
- Test edit profile functionality
- Test form validation
- Test error handling
- Test loading states
- Test successful/failed profile updates
- Test modal open/close behavior

#### Login.tsx (Page)
- Test login form submission
- Test form validation
- Test error messages
- Test successful login flow
- Test signup mode toggle
- Test password visibility toggle
- Test loading states

#### Admin.tsx (Page)
- TO BE COMPLETED AFTER CREATING A PROPER FEATURE
- Test user management table rendering
- Test user role updates
- Test user deletion
- Test filtering functionality
- Test error handling
- Test loading states

### Medium Priority

#### DashboardLayout.tsx
- TO BE COMPLETED AFTER CREATING A PROPER LAYOUT
- Test proper rendering of child components
- Test layout structure
- Test responsive behavior

#### ThemeToggle.tsx
- Test theme switching functionality
- Test persistence of theme preference
- Test correct icon display

#### PageContainer.tsx
- Test title rendering
- Test child component rendering
- Test proper layout structure

### Lower Priority

#### Welcome.tsx
- Test content rendering
- Test navigation links
- Test responsive layout

#### Dashboard.tsx
- Test widget rendering
- Test data loading
- Test layout structure

#### Basic Pages (Customers.tsx, Reporting.tsx, KnowledgeBase.tsx, Tickets.tsx)
- Test basic rendering
- Test route accessibility

## Test Implementation Order

1. First Phase:
   - Login.tsx (critical user flow)
   - ProfilePopout.tsx (complex user interactions)
   - Admin.tsx (important business logic)

2. Second Phase:
   - DashboardLayout.tsx
   - ThemeToggle.tsx
   - PageContainer.tsx

3. Third Phase:
   - Welcome.tsx
   - Dashboard.tsx
   - Basic pages

## Testing Patterns to Use

### Component Wrapper
Create a common test wrapper to handle providers:
```typescript
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <UserProvider>
        <MemoryRouter>
          {ui}
        </MemoryRouter>
      </UserProvider>
    </ThemeProvider>
  )
}
```

### Mocking Strategies
1. Supabase Authentication:
   ```typescript
   vi.mock('../../lib/supabase', () => ({
     supabase: {
       auth: {
         signInWithPassword: vi.fn(),
         signUp: vi.fn(),
         signOut: vi.fn()
       }
     }
   }))
   ```

2. User Context:
   ```typescript
   const mockUserContext = {
     user: {
       id: '1',
       email: 'test@example.com',
       role: 'user'
     },
     loading: false
   }
   ```

### Test Data Factories
Create factories for common test data:
```typescript
const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  role: 'user',
  created_at: new Date().toISOString(),
  ...overrides
})
```

## Next Steps

1. Set up test factories and utilities
2. Implement the common wrapper component
3. Begin with Login.tsx tests as they're critical for user access
4. Move on to ProfilePopout.tsx and Admin.tsx
5. Continue with medium and lower priority components 