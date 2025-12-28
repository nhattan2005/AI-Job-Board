const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verify JWT token and attach user to request
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 👇 KIỂM TRA TOKEN VERSION VÀ BAN STATUS
        const result = await db.query(
            'SELECT id, email, role, full_name, company_name, is_banned, ban_reason, token_version FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // 👇 KIỂM TRA NẾU USER BỊ BAN
        if (user.is_banned) {
            console.log(`🚫 Banned user tried to access API: ${user.email}`);
            return res.status(403).json({ 
                error: 'Account Suspended',
                message: `Your account has been suspended. Reason: ${user.ban_reason || 'Violates community guidelines'}`,
                isBanned: true
            });
        }

        // 👇 KIỂM TRA TOKEN VERSION (invalidate old tokens)
        const tokenVersion = decoded.tokenVersion || 0;
        const currentVersion = user.token_version || 0;

        if (tokenVersion !== currentVersion) {
            console.log(`🔒 Invalid token version for user ${user.email}: ${tokenVersion} vs ${currentVersion}`);
            return res.status(401).json({ 
                error: 'Token expired',
                message: 'Your session has been invalidated. Please login again.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ error: 'Invalid token' });
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