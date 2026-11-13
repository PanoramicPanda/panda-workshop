import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { readStored } from './lib/storage.js';
import './styles.css';

// Apply a saved theme before the first paint (same key as the original page).
const theme = readStored('cat-theme');
if (theme) document.documentElement.setAttribute('data-theme', theme);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
