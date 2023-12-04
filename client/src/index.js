import React from 'react';
import ReactDOM from 'react-dom/client'; // For React 18+
import App from './App';
import './styles/App.css'; // Import global styles

/**
 * client/src/index.js
 *
 * This is the entry point for the React client-side application.
 * It initializes the React application and mounts the main App component
 * to the DOM element with the ID 'root' in public/index.html.
 *
 * Uses React 18's createRoot API for improved performance and concurrent features.
 */

// Get the root DOM element where the React app will be mounted.
const rootElement = document.getElementById('root');

// Create a root using ReactDOM.createRoot for React 18+ concurrent mode.
// This is the recommended way to render a React application starting with React 18.
const root = ReactDOM.createRoot(rootElement);

// Render the main App component into the root.
// React.StrictMode is a tool for highlighting potential problems in an application.
// It activates additional checks and warnings for its descendants.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);