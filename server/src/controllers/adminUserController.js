const bcrypt = require('bcrypt');
const db = require('../config/database');

// Tạo tài khoản admin mới
const createAdminUser = async (req, res) => {
    try {
        const { email, password, full_name } = req.body;
        const creatorAdminId = req.user.id;

        // Validate
        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'Email, password, and full name are required' });
        }

        // Kiểm tra email đã tồn tại chưa
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Tạo admin mới
        const result = await db.query(
            `INSERT INTO users (email, password_hash, role, full_name, email_verified)
             VALUES ($1, $2, 'admin', $3, TRUE)
             RETURNING id, email, role, full_name, created_at`,
            [email, passwordHash, full_name]
        );

        // Log action
        await db.query(
            `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason)
             VALUES ($1, 'create_admin', 'user', $2, $3)`,
            [creatorAdminId, result.rows[0].id, `Created new admin: ${full_name}`]
        );

        console.log('✅ New admin created:', result.rows[0].email);
        res.status(201).json({ 
            message: 'Admin user created successfully', 
            user: result.rows[0] 
        });

    } catch (error) {
        console.error('Error creating admin user:', error);
        res.status(500).json({ error: 'Failed to create admin user' });
    }
};

// Lấy danh sách tất cả admin
const getAllAdmins = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, email, full_name, created_at, 
                   COALESCE(is_banned, false) as is_banned
            FROM users 
            WHERE role = 'admin'
            ORDER BY created_at DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ error: 'Failed to fetch admin users' });
    }
};

// Xóa admin (chỉ khi không phải chính mình)
const deleteAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        const currentAdminId = req.user.id;

        // Không cho phép tự xóa chính mình
        if (parseInt(adminId) === currentAdminId) {
            return res.status(403).json({ error: 'Cannot delete your own admin account' });
        }

        // Kiểm tra admin tồn tại
        const adminCheck = await db.query(
            'SELECT id, email, full_name FROM users WHERE id = $1 AND role = $2',
            [adminId, 'admin']
        );

        if (adminCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Admin user not found' });
        }

        const deletedAdmin = adminCheck.rows[0];

        // Xóa admin
        await db.query('DELETE FROM users WHERE id = $1', [adminId]);

        // Log action
        await db.query(
            `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason)
             VALUES ($1, 'delete_admin', 'user', $2, $3)`,
            [currentAdminId, adminId, `Deleted admin: ${deletedAdmin.full_name} (${deletedAdmin.email})`]
        );

        console.log('✅ Admin deleted:', deletedAdmin.email);
        res.json({ message: 'Admin user deleted successfully' });

    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ error: 'Failed to delete admin user' });
    }
};

module.exports = {
    createAdminUser,
    getAllAdmins,
    deleteAdmin
};