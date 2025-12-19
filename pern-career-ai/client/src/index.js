import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

const aiRoutes = require('./routes/aiRoutes');
const employerRoutes = require('./routes/employerRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const careerRoutes = require('./routes/careerRoutes');
const mockInterviewRoutes = require('./routes/mockInterviewRoutes'); // <--- THÊM DÒNG NÀY

app.use('/api/cv', cvRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/mock-interview', mockInterviewRoutes); // <--- THÊM DÒNG NÀY

// Health check endpoint