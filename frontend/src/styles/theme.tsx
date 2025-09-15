import { createTheme, CssBaseline, ThemeProvider } from '@mui/material'
import { createContext, ReactNode, useContext, useMemo, useState } from 'react'

type ColorMode = 'light' | 'dark'

type ThemeContextValue = {
  mode: ColorMode
  toggleColorMode: () => void
}

const ThemeModeContext = createContext<ThemeContextValue | undefined>(undefined)

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) throw new Error('useThemeMode must be used within AppThemeProvider')
  return ctx
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>('light')

  const toggleColorMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'))

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
        shape: { borderRadius: 10 },
        components: {
          MuiButton: {
            defaultProps: { variant: 'contained' },
          },
        },
      }),
    [mode],
  )

  const value = useMemo(() => ({ mode, toggleColorMode }), [mode])

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}


