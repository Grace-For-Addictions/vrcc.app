import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

// Base path matches the production deployment (/vrcc/app/).
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/vrcc/app">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
