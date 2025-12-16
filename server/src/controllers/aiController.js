const { embedJobDescription, embedCV } = require('../services/embeddingService');
const { cosineSimilarity } = require('../utils/vectorMath');
const tailoringService = require('../services/tailoringService');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const db = require('../config/database');

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
            throw new Error('Unsupported file type');
        }
    } catch (error) {
        console.error('Error extracting text:', error);
        throw new Error('Failed to extract text from file: ' + error.message);
    }
};

// Match job with CV
const getJobMatchingScore = async (req, res) => {
    try {
        const { jobId } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'CV file is required' });
        }
        
        if (!jobId) {
            return res.status(400).json({ error: 'Job ID is required' });
        }

        console.log('=== Starting Match Score Calculation ===');
        console.log('Job ID:', jobId);
        console.log('File:', req.file.originalname, 'Type:', req.file.mimetype);

        // Get job description from database
        const jobResult = await db.query('SELECT description FROM jobs WHERE id = $1', [jobId]);
        
        if (jobResult.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        const jobDescription = jobResult.rows[0].description;
        console.log('Job description length:', jobDescription.length);

        // Extract CV text from uploaded file
        console.log('Extracting CV text...');
        const cvText = await extractTextFromFile(req.file);
        
        if (!cvText || cvText.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Could not extract text from CV file. Please ensure the file contains readable text.' 
            });
        }
        
        console.log('CV text length:', cvText.length);

        // Generate embeddings
        console.log('Step 1: Generating job description embedding...');
        const jobVector = await embedJobDescription(jobDescription);
        
        console.log('Step 2: Generating CV embedding...');
        const cvVector = await embedCV(cvText);

        // Calculate similarity score
        console.log('Step 3: Calculating cosine similarity...');
        const score = cosineSimilarity(jobVector, cvVector);
        
        console.log('✓ Match score calculated:', score);
        console.log('=== Match Score Calculation Complete ===');
        
        res.json({ 
            score: Math.round(score * 100) / 100,
            message: 'Match score calculated successfully'
        });
    } catch (error) {
        console.error('❌ Error calculating match score:', error);
        
        if (error.message.includes('quota')) {
            return res.status(429).json({ 
                error: 'API quota exceeded',
                details: 'Please wait a moment before trying again'
            });
        }
        
        if (error.message.includes('access denied') || error.message.includes('403')) {
            return res.status(403).json({ 
                error: 'API access denied',
                details: 'Please verify your API key has the correct permissions'
            });
        }
        
        res.status(500).json({ 
            error: 'Error calculating match score',
            details: error.message
        });
    }
};

// Tailor CV based on job description
const tailorCV = async (req, res) => {
    try {
        const { jobId } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'CV file is required' });
        }
        
        if (!jobId) {
            return res.status(400).json({ error: 'Job ID is required' });
        }

        console.log('=== Starting CV Tailoring ===');
        console.log('Job ID:', jobId);
        console.log('File:', req.file.originalname);
        console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY); // ← THÊM DÒNG NÀY

        // Get job description from database
        const jobResult = await db.query('SELECT description FROM jobs WHERE id = $1', [jobId]);
        
        if (jobResult.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        const jobDescription = jobResult.rows[0].description;
        console.log('Job description length:', jobDescription.length);

        // Extract CV text from uploaded file
        console.log('Extracting CV text...');
        const cvText = await extractTextFromFile(req.file);
        
        if (!cvText || cvText.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Could not extract text from CV file. Please ensure the file contains readable text.' 
            });
        }
        
        console.log('CV text length:', cvText.length);
        
        // Call tailoring service
        console.log('Calling tailoring service...');
        const suggestions = await tailoringService.tailorCV(cvText, jobDescription);
        console.log('✓ Suggestions received:', suggestions);

        res.json({
            success: true,
            suggestions: {
                missingKeywords: suggestions.missingKeywords || [],
                missingSkills: suggestions.missingSkills || [],
                suggestions: suggestions.suggestions || [],
                improvements: suggestions.improvements || []
            }
        });
    } catch (error) {
        console.error('❌ Tailor CV error:', error);
        
        if (error.message.includes('quota')) {
            return res.status(429).json({ 
                error: 'API quota exceeded',
                details: 'Please wait a moment before trying again'
            });
        }
        
        if (error.message.includes('Model') || error.message.includes('model')) {
            return res.status(503).json({ 
                error: 'AI model unavailable',
                details: 'The AI model is currently unavailable. Please try again later.'
            });
        }
        
        res.status(500).json({ 
            error: 'Error tailoring CV',
            details: error.message
        });
    }
};

module.exports = {
    getJobMatchingScore,
    tailorCV
};