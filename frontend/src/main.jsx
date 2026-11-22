import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider, createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: { main: '#1d5d99' },
    background: { default: '#f4f7fb' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif"
  },
  components: {
    MuiTextField: {
      defaultProps: { variant: 'outlined' }
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 700 }
      }
    }
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
