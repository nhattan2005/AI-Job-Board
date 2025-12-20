import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';
import './styles/index.css';

// Log để debug
console.log('🔗 VITE_API_URL:', import.meta.env.VITE_API_URL);

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode> {/* ← TẠM THỜI COMMENT RA */}
    <App />
  // </React.StrictMode>
);