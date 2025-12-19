import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';
import './styles/index.css';

// Configure axios defaults - Dùng biến môi trường thay vì hardcode
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);