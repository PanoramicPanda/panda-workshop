import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { readStored } from './lib/storage.js';
import './styles.css';

// Dark is the default (set in index.html); a saved choice replaces it before the first paint
// (same key as the original page).
const theme = readStored('cat-theme');
if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
