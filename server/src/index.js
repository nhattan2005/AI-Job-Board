require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // Thêm dòng này ở đầu file
const db = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const cvRoutes = require('./routes/cvRoutes');
const aiRoutes = require('./routes/aiRoutes');
const employerRoutes = require('./routes/employerRoutes');
const careerRoutes = require('./routes/careerRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const mockInterviewRoutes = require('./routes/mockInterviewRoutes');
const employerEmailRoutes = require('./routes/employerEmailRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes'); // 👈 THÊM DÒNG NÀY
const notificationRoutes = require('./routes/notificationRoutes'); // 👈 THÊM

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        process.env.CORS_ORIGIN || 'http://localhost:3000',
        /\.vercel\.app$/, // Cho phép tất cả subdomain của Vercel
    ],
    credentials: true
}));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// 👇 THÊM DÒNG NÀY: Cho phép truy cập thư mục uploads từ trình duyệt
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Thêm middleware để log requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Test database connection
db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
    } else {
        console.log('✅ Database connected at:', res.rows[0].now);
    }
});

// Routes
app.use('/api/auth', authRoutes); // 👈 ĐẢM BẢO DÒNG NÀY CÓ
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/mock-interview', mockInterviewRoutes);
app.use('/api/employer-email', employerEmailRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/banners', bannerRoutes); // 👈 THÊM
app.use('/api/favorites', favoriteRoutes); // 👈 DÒNG NÀY ĐÃ CÓ, CHỈ CẦN THÊM IMPORT
app.use('/api/notifications', notificationRoutes); // 👈 THÊM

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});