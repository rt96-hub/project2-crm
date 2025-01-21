import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../context/ThemeContext'
import { UserProvider } from '../../context/UserContext'
import { Sidebar } from '../Sidebar'
import { expect, it, describe } from 'vitest'

describe('Sidebar', () => {
  it('renders links correctly', () => {
    render(
      <ThemeProvider>
        <UserProvider>
          <MemoryRouter>
            <Sidebar />
          </MemoryRouter>
        </UserProvider>
      </ThemeProvider>
    )
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Tickets')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('opens ProfilePopout when Profile button is clicked', () => {
    render(
      <ThemeProvider>
        <UserProvider>
          <MemoryRouter>
            <Sidebar />
          </MemoryRouter>
        </UserProvider>
      </ThemeProvider>
    )
    const profileButton = screen.getByText('Profile')
    fireEvent.click(profileButton)
    // Verify the ProfilePopout is rendered
    expect(screen.getByText('Profile Information')).toBeInTheDocument()
  })
}) 