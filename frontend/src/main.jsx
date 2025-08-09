// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'

// ✅ Import Tailwind CSS styles (must be first)
import './index.css'

// ✅ Main App Component
import App from './App'

// ✅ Mount the React App
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
