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

    const container = screen.getByRole('heading', { level: 1, name: /test title/i }).closest('div')
    expect(container).toHaveClass('bg-white', 'rounded-lg', 'shadow', 'p-6', 'w-full')
    
    const titleElement = screen.getByRole('heading', { level: 1 })
    expect(titleElement).toHaveClass('text-2xl', 'font-bold', 'mb-4', 'text-gray-900')
    
    const contentContainer = container?.lastChild as HTMLElement
    expect(contentContainer).toHaveClass('text-gray-900')
  })
}) 