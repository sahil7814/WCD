import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider, createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: { main: '#235db5' },
    secondary: { main: '#2c8793' },
    background: { default: '#f3f6fb', paper: '#ffffff' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'DM Sans', 'Noto Sans Devanagari', 'Nirmala UI', 'Segoe UI', sans-serif",
    button: { fontWeight: 700 }
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
