const careerService = require('../services/careerService');
const db = require('../config/database');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Helper to extract text from file buffer
const extractTextFromFile = async (file) => {
    const { buffer, mimetype } = file;
    try {
        if (mimetype === 'text/plain') {
            return buffer.toString('utf-8');
        } 
        else if (mimetype === 'application/pdf') {
            const pdfData = await pdfParse(buffer);
            return pdfData.text;
        }
        else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        }
        return '';
    } catch (error) {
        console.error('Error extracting text:', error);
        throw new Error('Failed to extract text from file');
    }
};

// 👇 SỬA LẠI HÀM NÀY: Phải nhận (req, res)
const generateCareerPath = async (req, res) => {
    try {
        let cvText;
        // Lấy targetGoal từ body
        const { targetGoal } = req.body;

        // Option 1: CV text từ body
        if (req.body.cvText) {
            cvText = req.body.cvText;
        }
        // Option 2: CV file upload
        else if (req.file) {
            cvText = await extractTextFromFile(req.file);
        } else {
            return res.status(400).json({ error: 'No CV provided' });
        }

        if (!cvText || cvText.trim().length === 0) {
            return res.status(400).json({ 
                error: 'CV text is empty',
                details: 'Could not extract text from the file'
            });
        }

        console.log('=== Generating Career Path ===');
        if (targetGoal) console.log('🎯 Target Goal:', targetGoal);

        // 👇 GỌI SERVICE (Logic AI nằm bên file service)
        const careerPath = await careerService.generateCareerPath(cvText, targetGoal);

        console.log('✓ Career path generated successfully');

        // Trả về kết quả cho Client
        res.json({
            success: true,
            data: careerPath
        });

    } catch (error) {
        console.error('Error generating career path:', error);
        // 👇 SỬA: Đảm bảo res được gọi đúng cách trong catch
        res.status(500).json({ 
            error: 'Failed to generate career path',
            details: error.message 
        });
    }
};

// --- CÁC HÀM MỚI ---

// 1. Lưu Roadmap hiện tại vào Database
const saveRoadmap = async (req, res) => {
    try {
        const userId = req.user.id;
        const { target_role, roadmap, current_positioning, skill_gap } = req.body; // 👈 THÊM 2 FIELDS

        // Thêm thuộc tính 'completed: false' cho mỗi action trong roadmap nếu chưa có
        const initializedRoadmap = roadmap.map(phase => ({
            ...phase,
            actions: phase.actions.map(action => ({
                ...action,
                completed: false // Mặc định chưa hoàn thành
            }))
        }));

        // Kiểm tra xem user đã có roadmap chưa, nếu có thì update, chưa thì insert
        const existing = await db.query('SELECT id FROM user_roadmaps WHERE user_id = $1', [userId]);

        if (existing.rows.length > 0) {
            // UPDATE
            await db.query(
                `UPDATE user_roadmaps 
                 SET target_role = $1, 
                     roadmap_data = $2, 
                     current_positioning = $3, 
                     skill_gap = $4, 
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE user_id = $5`,
                [
                    target_role, 
                    JSON.stringify(initializedRoadmap),
                    JSON.stringify(current_positioning),  // 👈 THÊM
                    JSON.stringify(skill_gap),             // 👈 THÊM
                    userId
                ]
            );
            console.log('✅ Roadmap updated for user:', userId);
        } else {
            // INSERT
            await db.query(
                `INSERT INTO user_roadmaps (user_id, target_role, roadmap_data, current_positioning, skill_gap) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    userId, 
                    target_role, 
                    JSON.stringify(initializedRoadmap),
                    JSON.stringify(current_positioning),  // 👈 THÊM
                    JSON.stringify(skill_gap)             // 👈 THÊM
                ]
            );
            console.log('✅ Roadmap created for user:', userId);
        }

        res.json({ success: true, message: 'Roadmap saved successfully' });
    } catch (error) {
        console.error('Error saving roadmap:', error);
        res.status(500).json({ error: 'Failed to save roadmap' });
    }
};

// 2. Lấy Roadmap của user
const getMyRoadmap = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 👇 THÊM current_positioning và skill_gap vào SELECT
        const result = await db.query(
            `SELECT target_role, roadmap_data, current_positioning, skill_gap 
             FROM user_roadmaps 
             WHERE user_id = $1`, 
            [userId]
        );

        if (result.rows.length === 0) {
            return res.json({ roadmap: null });
        }

        res.json({ 
            target_role: result.rows[0].target_role,
            roadmap: result.rows[0].roadmap_data,
            current_positioning: result.rows[0].current_positioning,  // 👈 THÊM
            skill_gap: result.rows[0].skill_gap                       // 👈 THÊM
        });
    } catch (error) {
        console.error('Error fetching roadmap:', error);
        res.status(500).json({ error: 'Failed to fetch roadmap' });
    }
};

// 3. Cập nhật tiến độ (Tick/Untick)
const updateRoadmapProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { phaseIndex, actionIndex, completed } = req.body;

        // Lấy roadmap hiện tại
        const result = await db.query('SELECT roadmap_data FROM user_roadmaps WHERE user_id = $1', [userId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Roadmap not found' });

        let roadmap = result.rows[0].roadmap_data;

        // Cập nhật trạng thái
        if (roadmap[phaseIndex] && roadmap[phaseIndex].actions[actionIndex]) {
            roadmap[phaseIndex].actions[actionIndex].completed = completed;
        }

        // Lưu lại vào DB
        await db.query(
            'UPDATE user_roadmaps SET roadmap_data = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
            [JSON.stringify(roadmap), userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
};

module.exports = {
    generateCareerPath,
    saveRoadmap,
    getMyRoadmap,
    updateRoadmapProgress
};