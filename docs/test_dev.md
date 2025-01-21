# Test Development Guide

## Setup and Structure

### Essential Imports
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test-utils/test-utils'
```

### Basic Test Structure
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset any context mocks to default state
  })

  it('descriptive test name', () => {
    // Arrange
    // Act
    // Assert
  })
})
```

## Best Practices

### 1. Mock External Dependencies
- Mock all external services (e.g., Supabase)
- Mock React Router hooks (e.g., useNavigate)
- Mock context providers and their values
- Use `vi.mock()` before your test suite

Example:
```typescript
// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      // Include all methods used in component
    }
  }
}))

// Mock Router
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock Theme Context
const mockSetIsPowerMode = vi.fn()
const mockToggleTheme = vi.fn()
vi.mock('../context/ThemeContext', () => ({
  useTheme: vi.fn().mockImplementation(() => ({
    isPowerMode: false,
    setIsPowerMode: mockSetIsPowerMode,
    toggleTheme: mockToggleTheme
  })),
  // Important: Always include Provider when mocking contexts
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children
}))

// Mock User Context
const mockUpdateProfile = vi.fn()
const mockProfile = createMockProfile()
vi.mock('../context/UserContext', () => ({
  useUser: vi.fn().mockImplementation(() => ({
    profile: mockProfile,
    updateProfile: mockUpdateProfile
  })),
  // Important: Always include Provider when mocking contexts
  UserProvider: ({ children }: { children: React.ReactNode }) => children
}))
```

### 2. Context Testing Guidelines
- Always mock both the hook (useTheme, useUser) and the Provider component
- Use `vi.fn().mockImplementation()` for hooks to allow dynamic value changes
- Include all context values and functions that components might use
- Reset mocks in beforeEach when testing different context states
- When testing context-dependent features:
  ```typescript
  describe('Theme States', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('renders with specific context state', () => {
      vi.mocked(useTheme).mockImplementation(() => ({
        isPowerMode: true,
        setIsPowerMode: mockSetIsPowerMode,
        toggleTheme: mockToggleTheme
      }))

      renderWithProviders(<Component />)
      // Test component with this context state
    })
  })
  ```

### 3. Theme Testing
- Test both regular and power mode states
- Group theme-specific tests in a separate describe block
- Test theme-specific:
  - UI elements
  - Styling classes
  - Text content
  - Placeholder text
  - Error states

Example:
```typescript
describe('Theme States', () => {
  it('renders regular mode UI by default', () => {
    // Test regular mode specific elements
  })

  it('renders power mode UI when active', () => {
    // Mock theme context for power mode
    // Test power mode specific elements
  })
})
```

### 4. Component Testing Checklist
- ✅ Initial render state
- ✅ User interactions (clicks, input changes)
- ✅ Loading states
- ✅ Success states
- ✅ Error states
- ✅ Form validation
- ✅ Theme variations
- ✅ Accessibility (using proper roles and labels)
- ✅ Component-specific features

### 5. Testing User Interactions
- Use `fireEvent` for simple interactions
- Use `userEvent` for complex interactions
- Wait for async operations using `waitFor`
- Test disabled states during loading

Example:
```typescript
it('handles user interaction', async () => {
  // Arrange
  renderWithProviders(<Component />)
  
  // Act
  fireEvent.change(screen.getByPlaceholderText(/email/i), {
    target: { value: 'test@example.com' }
  })
  fireEvent.click(screen.getByRole('button', { name: /submit/i }))
  
  // Assert
  await waitFor(() => {
    expect(mockFunction).toHaveBeenCalled()
  })
})
```

### 6. Element Selection Best Practices
- Prefer `getByRole` over `getByText` when possible
- Use `data-testid` for elements without semantic roles
- Use case-insensitive regex for text matching
- Add sufficient context in test IDs and roles

Example:
```typescript
// Good
screen.getByRole('button', { name: /submit/i })
screen.getByTestId('login-form')

// Avoid
screen.getByText('Submit')
screen.querySelector('.form')
```

### 7. Error Handling
- Test both expected and unexpected errors
- Verify error messages are displayed correctly
- Test error styling in different themes
- Clear errors between tests

Example:
```typescript
it('handles errors appropriately', async () => {
  const mockFunction = vi.fn().mockRejectedValue(new Error('Test error'))
  
  renderWithProviders(<Component />)
  
  fireEvent.click(screen.getByRole('button'))
  
  await waitFor(() => {
    expect(screen.getByText('Test error')).toBeInTheDocument()
    // Check error styling
    expect(screen.getByText('Test error').parentElement).toHaveClass('error-class')
  })
})
```

## Common Gotchas
1. Not clearing mocks between tests
2. Not mocking all required context values
3. Missing await/waitFor for async operations
4. Hardcoding text that might change with themes
5. Not testing both theme states
6. Insufficient error handling coverage
7. Missing accessibility checks
8. Forgetting to mock context Providers
9. Not including all required context values in mocks

## Testing Tools
- Vitest for test running and assertions
- React Testing Library for component testing
- vi.mock() for mocking dependencies
- waitFor for async operations
- fireEvent for user interactions
- screen for querying elements 