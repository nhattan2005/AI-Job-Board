const db = require('../config/database');

// Get all active banners (Public)
const getActiveBanners = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, title, subtitle, image_url, display_order FROM banners WHERE is_active = TRUE ORDER BY display_order ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({ error: 'Failed to fetch banners' });
    }
};

// Get all banners (Admin only)
const getAllBanners = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM banners ORDER BY display_order ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching all banners:', error);
        res.status(500).json({ error: 'Failed to fetch banners' });
    }
};

// Create new banner (Admin only)
const createBanner = async (req, res) => {
    try {
        const { title, subtitle, display_order } = req.body;
        const created_by = req.user.id;

        if (!req.file) {
            return res.status(400).json({ error: 'Banner image is required' });
        }

        const image_url = req.file.path; // Cloudinary URL

        const result = await db.query(
            `INSERT INTO banners (title, subtitle, image_url, display_order, created_by) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [title, subtitle || '', image_url, display_order || 0, created_by]
        );

        // Log admin action
        await db.query(
            `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason)
             VALUES ($1, 'create_banner', 'banner', $2, $3)`,
            [created_by, result.rows[0].id, `Created banner: ${title}`]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating banner:', error);
        res.status(500).json({ error: 'Failed to create banner' });
    }
};

// Update banner (Admin only)
const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subtitle, display_order, is_active } = req.body;
        const admin_id = req.user.id;

        let updateQuery = `UPDATE banners SET title = $1, subtitle = $2, display_order = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP`;
        let params = [title, subtitle, display_order, is_active];

        // If new image uploaded
        if (req.file) {
            updateQuery += `, image_url = $${params.length + 1}`;
            params.push(req.file.path);
        }

        updateQuery += ` WHERE id = $${params.length + 1} RETURNING *`;
        params.push(id);

        const result = await db.query(updateQuery, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Banner not found' });
        }

        // Log admin action
        await db.query(
            `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason)
             VALUES ($1, 'update_banner', 'banner', $2, $3)`,
            [admin_id, id, `Updated banner: ${title}`]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating banner:', error);
        res.status(500).json({ error: 'Failed to update banner' });
    }
};

// Delete banner (Admin only)
const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const admin_id = req.user.id;

        const result = await db.query('DELETE FROM banners WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Banner not found' });
        }

        // Log admin action
        await db.query(
            `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason)
             VALUES ($1, 'delete_banner', 'banner', $2, $3)`,
            [admin_id, id, `Deleted banner: ${result.rows[0].title}`]
        );

        res.json({ message: 'Banner deleted successfully' });
    } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).json({ error: 'Failed to delete banner' });
    }
};

module.exports = {
    getActiveBanners,
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner
};