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
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./src/routes/applicationRoutes');
const cvRoutes = require('./src/routes/cvRoutes');
const employerEmailRoutes = require('./src/routes/employerEmailRoutes'); // 👇 Đảm bảo đã import route này
const adminRoutes = require('./routes/adminRoutes');
const bannerRoutes = require('./routes/bannerRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/cvs', cvRoutes);

// 👇 THÊM DÒNG NÀY ĐỂ ĐĂNG KÝ ROUTE GỬI EMAIL
app.use('/api/employer', employerEmailRoutes);

app.use('/api/career', careerRoutes);

// 👇 ĐẢM BẢO DÒNG NÀY TỒN TẠI
app.use('/api/interviews', interviewRoutes); // hoặc /api/interview (kiểm tra kỹ)

app.use('/api/mock-interview', mockInterviewRoutes);
app.use('/api/employer-email', employerEmailRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/banners', bannerRoutes);

// Health check endpoint