const careerService = require('../services/careerService');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const db = require('../config/database'); // Đảm bảo import db

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
        else {
            throw new Error('Unsupported file type. Only PDF, DOCX, and TXT are supported.');
        }
    } catch (error) {
        console.error('Error extracting text:', error);
        throw new Error('Failed to extract text from file: ' + error.message);
    }
};

// Generate Career Path from CV
const generateCareerPath = async (req, res) => {
    try {
        let cvText;

        // Option 1: CV text từ body (for testing)
        if (req.body.cvText) {
            cvText = req.body.cvText;
        }
        // Option 2: CV file upload
        else if (req.file) {
            cvText = await extractTextFromFile(req.file);
        }
        else {
            return res.status(400).json({ 
                error: 'CV is required',
                details: 'Please provide cvText in body or upload a CV file'
            });
        }

        if (!cvText || cvText.trim().length === 0) {
            return res.status(400).json({ 
                error: 'CV text is empty',
                details: 'Could not extract text from the file or text is empty'
            });
        }

        console.log('=== Generating Career Path ===');
        console.log('CV text length:', cvText.length);

        // Call career service
        const careerPath = await careerService.generateCareerPath(cvText);

        console.log('✓ Career path generated successfully');

        res.json({
            success: true,
            data: careerPath
        });
    } catch (error) {
        console.error('❌ Error generating career path:', error);
        
        if (error.status === 429 || error.message.includes('quota')) {
            return res.status(429).json({ 
                error: 'API quota exceeded',
                details: 'Please wait a moment before trying again'
            });
        }
        
        if (error.status === 404 || error.message.includes('Model')) {
            return res.status(503).json({ 
                error: 'AI model unavailable',
                details: 'The AI model is currently unavailable. Please try again later.'
            });
        }
        
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
        const { target_role, roadmap } = req.body;

        // Thêm thuộc tính 'completed: false' cho mỗi action trong roadmap nếu chưa có
        const initializedRoadmap = roadmap.map(phase => ({
            ...phase,
            actions: phase.actions.map(action => ({
                ...action,
                completed: false // Mặc định chưa hoàn thành
            }))
        }));

        // Kiểm tra xem user đã có roadmap chưa, nếu có thì update, chưa thì insert
        // Ở đây mình làm đơn giản là mỗi user chỉ có 1 active roadmap.
        // Nếu muốn nhiều, bạn có thể bỏ đoạn check này.
        const existing = await db.query('SELECT id FROM user_roadmaps WHERE user_id = $1', [userId]);

        if (existing.rows.length > 0) {
            await db.query(
                'UPDATE user_roadmaps SET target_role = $1, roadmap_data = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3',
                [target_role, JSON.stringify(initializedRoadmap), userId]
            );
        } else {
            await db.query(
                'INSERT INTO user_roadmaps (user_id, target_role, roadmap_data) VALUES ($1, $2, $3)',
                [userId, target_role, JSON.stringify(initializedRoadmap)]
            );
        }

        res.json({ success: true, message: 'Roadmap saved successfully' });
    } catch (error) {
        console.error('Error saving roadmap:', error);
        res.status(500).json({ error: 'Failed to save roadmap' });
    }
};

// 2. Lấy Roadmap của User
const getMyRoadmap = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query('SELECT * FROM user_roadmaps WHERE user_id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.json({ roadmap: null });
        }

        res.json({ 
            target_role: result.rows[0].target_role,
            roadmap: result.rows[0].roadmap_data 
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