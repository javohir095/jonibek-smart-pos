import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Eski localStorage versiyalarini tozalash
const STORAGE_VERSION = 'v4';
const storageVersionKey = 'smartpos-version';
if (localStorage.getItem(storageVersionKey) !== STORAGE_VERSION) {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('smartpos')) {
      localStorage.removeItem(key);
    }
  });
  localStorage.setItem(storageVersionKey, STORAGE_VERSION);
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
