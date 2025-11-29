const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Generate JWT token
const generateToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Register new user
const register = async (req, res) => {
    try {
        const { email, password, role, ...roleSpecificData } = req.body;

        // Validation
        if (!email || !password || !role) {
            return res.status(400).json({ error: 'Email, password, and role are required' });
        }

        if (!['candidate', 'employer'].includes(role)) {
            return res.status(400).json({ error: 'Role must be either "candidate" or "employer"' });
        }

        // Check if user already exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        let result;

        if (role === 'candidate') {
            const { full_name, bio, skills } = roleSpecificData;
            
            if (!full_name) {
                return res.status(400).json({ error: 'Full name is required for candidates' });
            }

            result = await db.query(
                `INSERT INTO users (email, password_hash, role, full_name, bio, skills) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING id, email, role, full_name, bio, skills, created_at`,
                [email, passwordHash, role, full_name, bio || '', skills || []]
            );
        } else {
            const { company_name, company_description, website } = roleSpecificData;
            
            if (!company_name) {
                return res.status(400).json({ error: 'Company name is required for employers' });
            }

            result = await db.query(
                `INSERT INTO users (email, password_hash, role, company_name, company_description, website) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING id, email, role, company_name, company_description, website, created_at`,
                [email, passwordHash, role, company_name, company_description || '', website || '']
            );
        }

        const user = result.rows[0];
        const token = generateToken(user.id, user.role);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                ...(role === 'candidate' ? {
                    full_name: user.full_name,
                    bio: user.bio,
                    skills: user.skills
                } : {
                    company_name: user.company_name,
                    company_description: user.company_description,
                    website: user.website
                })
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const result = await db.query(
            `SELECT id, email, password_hash, role, full_name, bio, skills, 
                    company_name, company_description, website 
             FROM users WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user.id, user.role);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                ...(user.role === 'candidate' ? {
                    full_name: user.full_name,
                    bio: user.bio,
                    skills: user.skills
                } : {
                    company_name: user.company_name,
                    company_description: user.company_description,
                    website: user.website
                })
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query(
            `SELECT id, email, role, full_name, bio, skills, 
                    company_name, company_description, website, created_at 
             FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
                ...(user.role === 'candidate' ? {
                    full_name: user.full_name,
                    bio: user.bio,
                    skills: user.skills
                } : {
                    company_name: user.company_name,
                    company_description: user.company_description,
                    website: user.website
                })
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

module.exports = {
    register,
    login,
    getProfile
};