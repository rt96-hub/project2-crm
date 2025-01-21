import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../../test-utils/test-utils'
import { ThemeToggle } from '../ThemeToggle'
import { useTheme } from '../../context/ThemeContext'

// Mock Theme Context
const mockToggleTheme = vi.fn()
vi.mock('../../context/ThemeContext', () => ({
  useTheme: vi.fn().mockImplementation(() => ({
    isPowerMode: false,
    toggleTheme: mockToggleTheme
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the mock implementation to default state
    vi.mocked(useTheme).mockImplementation(() => ({
      isPowerMode: false,
      toggleTheme: mockToggleTheme
    }))
  })

  it('renders in regular mode by default', () => {
    renderWithProviders(<ThemeToggle />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('😊 Regular Mode 😊')
    expect(button).toHaveClass('bg-gray-200', 'text-gray-800')
    expect(button).not.toHaveClass('animate-pulse')
  })

  it('renders in power mode when isPowerMode is true', () => {
    vi.mocked(useTheme).mockImplementation(() => ({
      isPowerMode: true,
      toggleTheme: mockToggleTheme
    }))

    renderWithProviders(<ThemeToggle />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('🤪 POWER MODE! 🤪')
    expect(button).toHaveClass('bg-electric-purple', 'text-toxic-yellow', 'animate-pulse')
  })

  it('calls toggleTheme when clicked', () => {
    renderWithProviders(<ThemeToggle />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockToggleTheme).toHaveBeenCalledTimes(1)
  })

  it('maintains proper positioning and styling', () => {
    renderWithProviders(<ThemeToggle />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass(
      'fixed',
      'top-4',
      'right-4',
      'z-50',
      'rounded-full',
      'transition-all',
      'duration-300',
      'transform',
      'hover:scale-110'
    )
  })
}) 