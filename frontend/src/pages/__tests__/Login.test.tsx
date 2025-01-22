import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { Login } from '../Login'
import { renderWithProviders } from '../../test-utils/test-utils'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'

const mockAuthResponse = {
  data: {
    user: {
      id: '1',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      role: 'authenticated',
      updated_at: new Date().toISOString()
    },
    session: {
      access_token: 'token',
      refresh_token: 'refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: '1',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        role: 'authenticated',
        updated_at: new Date().toISOString()
      }
    }
  },
  error: null
}

// Mock the entire supabase module
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      onAuthStateChange: vi.fn().mockImplementation((callback) => {
        callback()
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    })
  }
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock ThemeContext
const mockSetIsPowerMode = vi.fn()
const mockToggleTheme = vi.fn()
vi.mock('../../context/ThemeContext', () => ({
  useTheme: vi.fn().mockImplementation(() => ({
    isPowerMode: false,
    setIsPowerMode: mockSetIsPowerMode,
    toggleTheme: mockToggleTheme
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children
}))

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset ThemeContext mock to default state
    vi.mocked(useTheme).mockImplementation(() => ({
      isPowerMode: false,
      setIsPowerMode: mockSetIsPowerMode,
      toggleTheme: mockToggleTheme
    }))
  })

  it('renders login form', () => {
    renderWithProviders(<Login />)
    
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('handles successful sign in', async () => {
    const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
    mockSignIn.mockResolvedValueOnce(mockAuthResponse)
    
    renderWithProviders(<Login />)
    
    const emailInput = screen.getByPlaceholderText(/email/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    const signInButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(signInButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles sign in error', async () => {
    const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
    mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'))
    
    renderWithProviders(<Login />)
    
    const emailInput = screen.getByPlaceholderText(/email/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    const signInButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrong' } })
    fireEvent.click(signInButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('handles successful sign up', async () => {
    const mockSignUp = vi.mocked(supabase.auth.signUp)
    mockSignUp.mockResolvedValueOnce({
      ...mockAuthResponse,
      data: {
        ...mockAuthResponse.data,
        user: { ...mockAuthResponse.data.user, email: 'new@example.com' },
        session: {
          ...mockAuthResponse.data.session,
          user: { ...mockAuthResponse.data.session.user, email: 'new@example.com' }
        }
      }
    })
    
    renderWithProviders(<Login />)
    
    const emailInput = screen.getByPlaceholderText(/email/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    const signUpButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'newpass123' } })
    fireEvent.click(signUpButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'newpass123'
      })
      expect(screen.getByText('Please check your email for a verification link to complete your registration!')).toBeInTheDocument()
      // Verify form is cleared
      expect(emailInput).toHaveValue('')
      expect(passwordInput).toHaveValue('')
      // Verify we don't navigate
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  it('handles sign up error', async () => {
    const mockSignUp = vi.mocked(supabase.auth.signUp)
    mockSignUp.mockRejectedValueOnce(new Error('Email already exists'))
    
    renderWithProviders(<Login />)
    
    const emailInput = screen.getByPlaceholderText(/email/i)
    const passwordInput = screen.getByPlaceholderText(/password/i)
    const signUpButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(emailInput, { target: { value: 'exists@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'pass123' } })
    fireEvent.click(signUpButton)

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument()
    })
  })

  it('disables buttons during loading state', async () => {
    const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
    mockSignIn.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    renderWithProviders(<Login />)
    
    const signInButton = screen.getByRole('button', { name: /sign in/i })
    const signUpButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.click(signInButton)

    expect(signInButton).toBeDisabled()
    expect(signUpButton).toBeDisabled()
  })

  describe('Power Mode', () => {
    it('renders light mode UI by default', () => {
      renderWithProviders(<Login />)
      
      // Check light mode elements
      expect(screen.getByText('MadTable')).toBeInTheDocument()
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /light mode/i })).toBeInTheDocument()
      
      // Light mode styling checks
      const form = screen.getByTestId('login-form')
      expect(form).not.toHaveClass('bg-electric-purple')
      
      // Light mode placeholders
      expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    })

    it('renders power mode UI when power mode is active', () => {
      // Mock power mode as active
      vi.mocked(useTheme).mockImplementation(() => ({
        isPowerMode: true,
        setIsPowerMode: mockSetIsPowerMode,
        toggleTheme: mockToggleTheme
      }))

      renderWithProviders(<Login />)
      
      // Check power mode specific elements
      expect(screen.getByText('🤡 MadTable 🎭')).toBeInTheDocument()
      expect(screen.getByText('😡 (╯°□°)╯︵ ┻━┻')).toBeInTheDocument()
      expect(screen.getByText('Login or Sign Up... if you dare!')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /power mode/i })).toBeInTheDocument()
      
      // Power mode styling checks
      const form = screen.getByTestId('login-form')
      expect(form).toHaveClass('bg-electric-purple')
      
      // Power mode placeholders
      expect(screen.getByPlaceholderText('🤪 Your Email Here! 🤪')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('🔑 Super Secret Password! 🔑')).toBeInTheDocument()
    })

    it('toggles between light and power mode', () => {
      renderWithProviders(<Login />)
      
      // Start in light mode
      const toggleButton = screen.getByRole('button', { name: /light mode/i })
      expect(screen.getByText('MadTable')).toBeInTheDocument()
      
      // Click toggle button
      fireEvent.click(toggleButton)
      
      // Check if toggleTheme was called
      expect(mockToggleTheme).toHaveBeenCalled()
    })

    it('shows error messages with correct styling in power mode', async () => {
      // Mock power mode as active
      vi.mocked(useTheme).mockImplementation(() => ({
        isPowerMode: true,
        setIsPowerMode: mockSetIsPowerMode,
        toggleTheme: mockToggleTheme
      }))

      const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
      mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'))
      
      renderWithProviders(<Login />)
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInButton)

      await waitFor(() => {
        const errorMessage = screen.getByText('Invalid credentials')
        expect(errorMessage).toBeInTheDocument()
        // Check power mode error styling
        expect(errorMessage.parentElement).toHaveClass('bg-eye-burn-orange')
        expect(errorMessage).toHaveClass('font-impact', 'text-toxic-yellow')
      })
    })
  })
}) 