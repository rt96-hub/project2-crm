import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders, createMockProfile } from '../../test-utils/test-utils'
import { ProfilePopout } from '../ProfilePopout'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn()
    }
  }
}))

// Mock navigate
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

// Mock UserContext
const mockUpdateProfile = vi.fn()
const mockProfile = createMockProfile()

vi.mock('../../context/UserContext', () => ({
  useUser: vi.fn().mockImplementation(() => ({
    profile: mockProfile,
    updateProfile: mockUpdateProfile
  })),
  UserProvider: ({ children }: { children: React.ReactNode }) => children
}))

describe('ProfilePopout', () => {
  const mockOnClose = vi.fn()
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when isOpen is false', () => {
    renderWithProviders(<ProfilePopout {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Profile Information')).not.toBeInTheDocument()
  })

  it('displays user profile information correctly', () => {
    renderWithProviders(<ProfilePopout {...defaultProps} />)
    
    expect(screen.getByText('Profile Information')).toBeInTheDocument()
    expect(screen.getByDisplayValue(mockProfile.email || '')).toBeInTheDocument()
    expect(screen.getByText(`${mockProfile.first_name || ''} ${mockProfile.last_name || ''}`)).toBeInTheDocument()
    expect(screen.getByText(mockProfile.work_phone || '')).toBeInTheDocument()
    expect(screen.getByText(mockProfile.job_title || '')).toBeInTheDocument()
  })

  it('switches to edit mode when Edit Profile button is clicked', () => {
    renderWithProviders(<ProfilePopout {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Edit Profile'))
    
    // Check if input fields are present
    expect(screen.getByRole('textbox', { name: /first name/i })).toHaveValue(mockProfile.first_name)
    expect(screen.getByRole('textbox', { name: /last name/i })).toHaveValue(mockProfile.last_name)
    expect(screen.getByRole('textbox', { name: /phone number/i })).toHaveValue(mockProfile.work_phone)
    expect(screen.getByRole('textbox', { name: /job title/i })).toHaveValue(mockProfile.job_title)
  })

  it('handles profile updates correctly', async () => {
    renderWithProviders(<ProfilePopout {...defaultProps} />)
    
    // Enter edit mode
    fireEvent.click(screen.getByText('Edit Profile'))
    
    // Update form fields
    fireEvent.change(screen.getByRole('textbox', { name: /first name/i }), {
      target: { value: 'Updated First' }
    })
    fireEvent.change(screen.getByRole('textbox', { name: /last name/i }), {
      target: { value: 'Updated Last' }
    })
    
    // Save changes
    fireEvent.click(screen.getByText('Save'))
    
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        first_name: 'Updated First',
        last_name: 'Updated Last',
        work_phone: mockProfile.work_phone,
        job_title: mockProfile.job_title
      })
    })
  })

  it('handles profile update errors', async () => {
    const mockError = new Error('Update failed')
    mockUpdateProfile.mockRejectedValueOnce(mockError)
    
    renderWithProviders(<ProfilePopout {...defaultProps} />)
    
    // Enter edit mode
    fireEvent.click(screen.getByText('Edit Profile'))
    
    // Update fields
    fireEvent.change(screen.getByRole('textbox', { name: /first name/i }), {
      target: { value: 'Updated First' }
    })
    
    // Save changes
    fireEvent.click(screen.getByText('Save'))
    
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled()
      // Should stay in edit mode when error occurs
      expect(screen.getByRole('textbox', { name: /first name/i })).toBeInTheDocument()
    })
  })

  it('cancels edit mode without saving changes', () => {
    renderWithProviders(<ProfilePopout {...defaultProps} />)
    
    // Enter edit mode
    fireEvent.click(screen.getByText('Edit Profile'))
    
    // Make changes
    fireEvent.change(screen.getByRole('textbox', { name: /first name/i }), {
      target: { value: 'Changed' }
    })
    
    // Cancel edit mode
    fireEvent.click(screen.getByText('Cancel'))
    
    // Verify we're back in view mode with original data
    expect(screen.getByText(`${mockProfile.first_name} ${mockProfile.last_name}`)).toBeInTheDocument()
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('handles logout correctly', async () => {
    renderWithProviders(<ProfilePopout {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Logout'))
    
    expect(supabase.auth.signOut).toHaveBeenCalled()
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('closes modal when Close button is clicked', () => {
    renderWithProviders(<ProfilePopout {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Close'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('closes modal when clicking outside', () => {
    renderWithProviders(<ProfilePopout {...defaultProps} />)
    
    // Click the backdrop (dialog element)
    const backdrop = screen.getByRole('dialog')
    fireEvent.click(backdrop)
    expect(mockOnClose).toHaveBeenCalled()
  })

  describe('Theme States', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('renders with light theme styles', () => {
      vi.mocked(useTheme).mockImplementation(() => ({
        isPowerMode: false,
        setIsPowerMode: mockSetIsPowerMode,
        toggleTheme: mockToggleTheme
      }))

      renderWithProviders(<ProfilePopout {...defaultProps} />)
      const modal = screen.getByRole('dialog').children[0]
      expect(modal).toHaveClass('bg-gray-700')
      expect(modal).not.toHaveClass('bg-electric-purple')
    })

    it('renders with power mode theme styles', () => {
      vi.mocked(useTheme).mockImplementation(() => ({
        isPowerMode: true,
        setIsPowerMode: mockSetIsPowerMode,
        toggleTheme: mockToggleTheme
      }))

      renderWithProviders(<ProfilePopout {...defaultProps} />)
      const modal = screen.getByRole('dialog').children[0]
      expect(modal).toHaveClass('bg-electric-purple')
      expect(modal).toHaveClass('border-hot-pink')
    })
  })
}) 