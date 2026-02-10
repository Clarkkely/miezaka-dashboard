import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Home from './pages/Home';
import Rapport from './pages/Rapport';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import NotificationCenter from './components/NotificationCenter';
import { ModernToaster } from './components/Toast/ModernToast';
import './styles/global.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a73e8',
      light: '#4285f4',
    },
    secondary: {
      main: '#34a853',
      light: '#0f9d58',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div style={{ display: 'flex' }}>
          <div style={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/rapport" element={<Rapport />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
        <NotificationCenter />
        <ModernToaster />
      </Router>
    </ThemeProvider>
  );
}

export default App;