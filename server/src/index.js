const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const cvRoutes = require('./routes/cvRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const employerRoutes = require('./routes/employerRoutes');
const employerEmailRoutes = require('./routes/employerEmailRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const errorHandler = require('./middleware/errorHandler');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/employer', employerEmailRoutes);
app.use('/api/interviews', interviewRoutes);

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