const careerService = require('../services/careerService');
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

module.exports = {
    generateCareerPath
};