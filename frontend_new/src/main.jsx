import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ThemeProvider } from './hooks/useTheme.js';
import { NavigationProvider } from './router/NavigationContext.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <NavigationProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </NavigationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
