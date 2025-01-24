import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../context/ThemeContext'
import { UserProvider } from '../context/UserContext'
import type { Database } from '../types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

// Minimal mock data factory
export const createMockProfile = (overrides: Partial<Profile> = {}): Profile => ({
  created_at: new Date().toISOString(),
  email: 'test@example.com',
  first_name: 'Test',
  is_active: true,
  is_admin: false,
  is_customer: false,
  job_title: 'Tester',
  last_name: 'User',
  user_id: '123',
  work_phone: '555-0123',
  ...overrides
})

// Simple wrapper for components that need context
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider>
        <UserProvider>
          <MemoryRouter>
            {children}
          </MemoryRouter>
        </UserProvider>
      </ThemeProvider>
    ),
    ...options
  })
}

// Mock Supabase responses
export const mockSupabaseResponse = {
  data: null,
  error: null,
  status: 200,
  statusText: '',
  count: null
} 