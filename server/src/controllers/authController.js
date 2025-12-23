const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { generateOTP, generateVerificationToken, sendOTPEmail, sendVerificationLinkEmail } = require('../utils/emailVerification');

// Register new user
const register = async (req, res) => {
    try {
        const { email, password, role, phone, verificationType } = req.body;

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
        let verificationData;

        // Choose verification method
        const useOTP = !verificationType || verificationType === 'otp';
        
        if (useOTP) {
            const otp = generateOTP();
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            verificationData = { token: otp, expires: otpExpires };
        } else {
            const token = generateVerificationToken();
            const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            verificationData = { token, expires: tokenExpires };
        }

        if (role === 'candidate') {
            const { full_name, bio, skills } = req.body;
            
            if (!full_name) {
                return res.status(400).json({ error: 'Full name is required for candidates' });
            }

            result = await db.query(
                `INSERT INTO users (email, password_hash, role, full_name, bio, skills, phone, email_verified, verification_token, verification_token_expires) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, $8, $9) 
                 RETURNING id, email, role, full_name, bio, skills, phone, email_verified, created_at`,
                [email, passwordHash, role, full_name, bio || '', skills || [], phone, verificationData.token, verificationData.expires]
            );
        } else {
            const { company_name, company_description, website } = req.body;
            
            if (!company_name) {
                return res.status(400).json({ error: 'Company name is required for employers' });
            }

            result = await db.query(
                `INSERT INTO users (email, password_hash, role, company_name, company_description, website, phone, email_verified, verification_token, verification_token_expires) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, $8, $9) 
                 RETURNING id, email, role, company_name, company_description, website, phone, email_verified, created_at`,
                [email, passwordHash, role, company_name, company_description || '', website || '', phone, verificationData.token, verificationData.expires]
            );
        }

        const user = result.rows[0];

        // Send verification email
        let emailResult;
        if (useOTP) {
            emailResult = await sendOTPEmail(email, verificationData.token);
        } else {
            emailResult = await sendVerificationLinkEmail(email, verificationData.token);
        }

        if (!emailResult.success) {
            await db.query('DELETE FROM users WHERE id = $1', [user.id]);
            return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
        }

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
            userId: user.id,
            email: user.email,
            verificationType: useOTP ? 'otp' : 'link'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
};

// Verify email with OTP
const verifyEmailOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const result = await db.query(
            'SELECT * FROM users WHERE email = $1 AND verification_token = $2',
            [email, otp]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        const user = result.rows[0];

        if (new Date() > new Date(user.verification_token_expires)) {
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }

        await db.query(
            'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = $1',
            [user.id]
        );

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        delete user.password_hash;
        delete user.verification_token;

        res.json({
            message: 'Email verified successfully',
            token,
            user: { ...user, email_verified: true }
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Failed to verify email' });
    }
};

// Verify email with link token
const verifyEmailLink = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ error: 'Verification token is required' });
        }

        const result = await db.query(
            'SELECT * FROM users WHERE verification_token = $1',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid verification token' });
        }

        const user = result.rows[0];

        if (new Date() > new Date(user.verification_token_expires)) {
            return res.status(400).json({ error: 'Verification link has expired. Please request a new one.' });
        }

        await db.query(
            'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = $1',
            [user.id]
        );

        const jwtToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        delete user.password_hash;
        delete user.verification_token;

        res.json({
            message: 'Email verified successfully',
            token: jwtToken,
            user: { ...user, email_verified: true }
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Failed to verify email' });
    }
};

// Resend verification email
const resendVerification = async (req, res) => {
    try {
        const { email, verificationType } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        if (user.email_verified) {
            return res.status(400).json({ error: 'Email already verified' });
        }

        const useOTP = !verificationType || verificationType === 'otp';
        let verificationData;

        if (useOTP) {
            const otp = generateOTP();
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
            verificationData = { token: otp, expires: otpExpires };
        } else {
            const token = generateVerificationToken();
            const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            verificationData = { token, expires: tokenExpires };
        }

        await db.query(
            'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
            [verificationData.token, verificationData.expires, user.id]
        );

        let emailResult;
        if (useOTP) {
            emailResult = await sendOTPEmail(email, verificationData.token);
        } else {
            emailResult = await sendVerificationLinkEmail(email, verificationData.token);
        }

        if (!emailResult.success) {
            return res.status(500).json({ error: 'Failed to send verification email' });
        }

        res.json({
            message: 'Verification email sent successfully',
            verificationType: useOTP ? 'otp' : 'link'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Failed to resend verification email' });
    }
};

// Login user - Updated
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

        if (!user.email_verified) {
            return res.status(403).json({ 
                error: 'Email not verified', 
                message: 'Please verify your email before logging in',
                email: user.email
            });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        delete user.password_hash;
        delete user.verification_token;

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

// Upload avatar
const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user.id;
        // Tạo đường dẫn URL (ví dụ: /uploads/avatars/filename.jpg)
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        const result = await db.query(
            'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING avatar_url',
            [avatarUrl, userId]
        );

        res.json({ 
            message: 'Avatar updated successfully', 
            avatar_url: result.rows[0].avatar_url 
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
};

module.exports = {
    register,
    verifyEmailOTP,
    verifyEmailLink,
    resendVerification,
    login,
    getProfile,
    updateProfile,
    changePassword,
    uploadAvatar
};