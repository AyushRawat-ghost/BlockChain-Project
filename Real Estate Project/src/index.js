// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';            // your Tailwind + global styles

// 1. Grab the <div id="root"> from public/index.html
const container = document.getElementById('root');
if (!container) {
  throw new Error('No root container found in public/index.html');
}

// 2. Create the React root
const root = ReactDOM.createRoot(container);

// 3. Render your App
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);