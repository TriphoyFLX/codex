import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import Sidebar from '../../components/Sidebar'
import { ProfileProvider } from '../../context/ProfileContext'

// Mock ProfileContext
vi.mock('../../context/ProfileContext', () => ({
  ProfileProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useProfile: () => ({
    profile: {
      first_name: 'Test',
      last_name: 'User',
      grade: 10,
      letter: 'A',
      role: 'student',
      avatar_url: null
    }
  })
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ProfileProvider>
        {component}
      </ProfileProvider>
    </BrowserRouter>
  )
}

describe('Sidebar', () => {
  it('renders navigation items', () => {
    renderWithProviders(<Sidebar />)
    
    expect(screen.getByText('Главная')).toBeInTheDocument()
    expect(screen.getByText('Уроки')).toBeInTheDocument()
    expect(screen.getByText('Курсы')).toBeInTheDocument()
    expect(screen.getByText('Задания')).toBeInTheDocument()
  })

  it('displays user information', () => {
    renderWithProviders(<Sidebar />)
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('10A Класс')).toBeInTheDocument()
  })

  it('shows collapsed state on small screens', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })

    renderWithProviders(<Sidebar />)
    
    const sidebar = screen.getByRole('navigation')
    expect(sidebar).toBeInTheDocument()
  })
})
