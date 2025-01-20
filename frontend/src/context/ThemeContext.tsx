import { createContext, useContext, useState, ReactNode } from 'react'

type ThemeContextType = {
  isPowerMode: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isPowerMode, setIsPowerMode] = useState(false)

  const toggleTheme = () => {
    setIsPowerMode(prev => !prev)
  }

  return (
    <ThemeContext.Provider value={{ isPowerMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 