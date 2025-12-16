const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Register new user
const register = async (req, res) => {
    try {
        const { email, password, role, phone } = req.body;

        // Validate required fields
        if (!email || !password || !role || !phone) {
            return res.status(400).json({ error: 'Email, password, role, and phone are required' });
        }

        if (role !== 'candidate' && role !== 'employer') {
            return res.status(400).json({ error: 'Invalid role. Must be candidate or employer' });
        }

        // Check if user already exists
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        let result;

        if (role === 'candidate') {
            const { full_name, bio, skills } = req.body;
            
            if (!full_name) {
                return res.status(400).json({ error: 'Full name is required for candidates' });
            }

            result = await db.query(
                `INSERT INTO users (email, password_hash, role, full_name, bio, skills, phone) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) 
                 RETURNING id, email, role, full_name, bio, skills, phone, created_at`,
                [email, passwordHash, role, full_name, bio || '', skills || [], phone]
            );
        } else {
            const { company_name, company_description, website } = req.body;
            
            if (!company_name) {
                return res.status(400).json({ error: 'Company name is required for employers' });
            }

            result = await db.query(
                `INSERT INTO users (email, password_hash, role, company_name, company_description, website, phone) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) 
                 RETURNING id, email, role, company_name, company_description, website, phone, created_at`,
                [email, passwordHash, role, company_name, company_description || '', website || '', phone]
            );
        }

        const user = result.rows[0];

        // Generate JWT token - FIXED
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token - FIXED
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        delete user.password_hash;

        res.json({
            message: 'Login successful',
            token,
            user
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
};

// Get user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query(
            'SELECT id, email, role, full_name, bio, skills, company_name, company_description, website, phone, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { phone, full_name, bio, skills, company_name, company_description, website } = req.body;

        let result;

        if (userRole === 'candidate') {
            result = await db.query(
                `UPDATE users 
                 SET phone = $1, full_name = $2, bio = $3, skills = $4, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $5
                 RETURNING id, email, role, full_name, bio, skills, phone, created_at`,
                [phone, full_name, bio || '', skills || [], userId]
            );
        } else {
            result = await db.query(
                `UPDATE users 
                 SET phone = $1, company_name = $2, company_description = $3, website = $4, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $5
                 RETURNING id, email, role, company_name, company_description, website, phone, created_at`,
                [phone, company_name, company_description || '', website || '', userId]
            );
        }

        res.json({
            message: 'Profile updated successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Get current password hash
        const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await db.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newPasswordHash, userId]
        );

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
};