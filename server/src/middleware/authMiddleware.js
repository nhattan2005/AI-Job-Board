const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verify JWT token and attach user to request
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // FIXED: Đổi decoded.id thành decoded.userId
        const result = await db.query(
            'SELECT id, email, role, full_name, company_name FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

// Middleware to verify employer role
const verifyEmployer = (req, res, next) => {
    if (req.user.role !== 'employer') {
        return res.status(403).json({ error: 'Access denied. Employer role required.' });
    }
    next();
};

// Middleware to verify candidate role
const verifyCandidate = (req, res, next) => {
    if (req.user.role !== 'candidate') {
        return res.status(403).json({ error: 'Access denied. Candidate role required.' });
    }
    next();
};

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    next();
};

module.exports = {
    verifyToken,
    verifyEmployer,
    verifyCandidate,
    verifyAdmin
};