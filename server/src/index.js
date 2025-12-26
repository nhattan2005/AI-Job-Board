const express = require('express');
const cors = require('cors');
const path = require('path'); // Thêm dòng này ở đầu file
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const cvRoutes = require('./routes/cvRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const careerRoutes = require('./routes/careerRoutes');
const employerRoutes = require('./routes/employerRoutes');
const employerEmailRoutes = require('./routes/employerEmailRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const mockInterviewRoutes = require('./routes/mockInterviewRoutes');
const adminRoutes = require('./routes/adminRoutes'); // 👈 THÊM DÒNG NÀY
const bannerRoutes = require('./routes/bannerRoutes'); // 👈 THÊM
const errorHandler = require('./middleware/errorHandler');
const db = require('./config/database');

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

// Routes
app.use('/api/auth', authRoutes); // 👈 ĐẢM BẢO DÒNG NÀY CÓ
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/mock-interview', mockInterviewRoutes);
app.use('/api/employer-email', employerEmailRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/banners', bannerRoutes); // 👈 THÊM

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ status: 'OK', message: 'Server and database are running' });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', message: error.message });
    }
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});