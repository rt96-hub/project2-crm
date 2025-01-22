import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test-utils/test-utils'
import { PageContainer } from '../PageContainer'

describe('PageContainer', () => {
  it('renders the title correctly', () => {
    renderWithProviders(
      <PageContainer title="Test Title">
        <div>Test Content</div>
      </PageContainer>
    )

    expect(screen.getByRole('heading', { level: 1, name: /test title/i })).toBeInTheDocument()
  })

  it('renders children content', () => {
    const testContent = 'Test Child Content'
    renderWithProviders(
      <PageContainer title="Test Title">
        <div>{testContent}</div>
      </PageContainer>
    )

    expect(screen.getByText(testContent)).toBeInTheDocument()
  })

  it('has proper layout structure', () => {
    renderWithProviders(
      <PageContainer title="Test Title">
        <div>Test Content</div>
      </PageContainer>
    )

    // Get the outermost container
    const container = screen.getByText('Test Content').closest('.bg-white')
    expect(container).toHaveClass('bg-white', 'rounded-lg', 'shadow', 'p-6', 'w-full')
    
    // Check the title row container
    const titleRow = screen.getByRole('heading', { level: 1, name: /test title/i }).closest('div')
    expect(titleRow?.parentElement).toHaveClass('flex', 'items-center', 'justify-between', 'mb-4')
    
    // Check the title element
    const titleElement = screen.getByRole('heading', { level: 1 })
    expect(titleElement).toHaveClass('text-2xl', 'font-bold', 'text-gray-900')
    
    // Check the content container
    const contentContainer = screen.getByText('Test Content').parentElement
    expect(contentContainer).toHaveClass('text-gray-900')
  })
}) 