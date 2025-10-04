import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppThemeProvider } from './styles/theme'
import { App } from './App'
import { AuthProvider } from './providers/AuthProvider'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import 'prismjs/themes/prism.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppThemeProvider>
          <App />
        </AppThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)


