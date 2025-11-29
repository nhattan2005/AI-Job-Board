// This file handles CV-related logic, including uploading CVs and processing them for matching. 

const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { embedCV } = require('../services/embeddingService');
const db = require('../config/database');

const router = express.Router();
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'text/plain', 
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only TXT, PDF, DOC, and DOCX are allowed.'));
        }
    }
});

// Helper function to extract text from different file types
const extractTextFromFile = async (file) => {
    const { buffer, mimetype } = file;

    try {
        if (mimetype === 'text/plain') {
            // Plain text file
            return buffer.toString('utf-8');
        } 
        else if (mimetype === 'application/pdf') {
            // PDF file
            console.log('Parsing PDF...');
            const pdfData = await pdfParse(buffer);
            console.log('PDF parsed successfully, text length:', pdfData.text.length);
            return pdfData.text;
        }
        else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // DOCX file
            console.log('Parsing DOCX...');
            const result = await mammoth.extractRawText({ buffer });
            console.log('DOCX parsed successfully, text length:', result.value.length);
            return result.value;
        }
        else if (mimetype === 'application/msword') {
            // Old DOC format - harder to parse, recommend converting to DOCX
            throw new Error('Old .doc format not supported. Please save as .docx or .pdf');
        }
        else {
            throw new Error('Unsupported file type');
        }
    } catch (error) {
        console.error('Error extracting text:', error);
        throw new Error('Failed to extract text from file: ' + error.message);
    }
};

// Route to upload CV
router.post('/upload', upload.single('cv'), async (req, res) => {
    try {
        const cvPath = req.file.path;
        // Process the CV file (e.g., extract text, convert to vector)
        const result = await uploadCV(cvPath);
        res.status(200).json({ message: 'CV uploaded successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading CV', error: error.message });
    }
});

// Upload CV handler
const uploadCV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('Processing file:', req.file.originalname, 'Type:', req.file.mimetype, 'Size:', req.file.size, 'bytes');

        // Extract text from the uploaded file
        const cvText = await extractTextFromFile(req.file);

        if (!cvText || cvText.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Could not extract text from the file. Please ensure the file contains readable text.' 
            });
        }

        console.log('Extracted text length:', cvText.length);
        console.log('First 200 characters:', cvText.substring(0, 200));

        // Generate embedding for the CV
        console.log('Generating embedding...');
        const cvVector = await embedCV(cvText);
        console.log('Embedding generated, dimensions:', cvVector.length);

        // Save CV to database
        const userId = req.body.userId || null; // You'll need to implement authentication
        const result = await db.query(
            'INSERT INTO cvs (user_id, cv_text, vector) VALUES ($1, $2, $3) RETURNING *',
            [userId, cvText, JSON.stringify(cvVector)]
        );

        console.log('CV saved to database with ID:', result.rows[0].id);

        res.status(201).json({
            message: 'CV uploaded and processed successfully',
            cv: {
                id: result.rows[0].id,
                created_at: result.rows[0].created_at,
                textLength: cvText.length,
                filename: req.file.originalname
            }
        });
    } catch (error) {
        console.error('Error uploading CV:', error);
        res.status(500).json({ 
            error: 'Error uploading CV: ' + error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Extract CV text
const extractCVText = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('Extracting text from:', req.file.originalname);

        // Extract text from the uploaded file
        const cvText = await extractTextFromFile(req.file);

        if (!cvText || cvText.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Could not extract text from the file. Please ensure the file contains readable text.' 
            });
        }

        console.log('Extracted text length:', cvText.length);

        res.status(200).json({
            message: 'Text extracted successfully',
            cvText: cvText,
            textLength: cvText.length,
            filename: req.file.originalname
        });
    } catch (error) {
        console.error('Error extracting CV text:', error);
        res.status(500).json({ 
            error: 'Error extracting text: ' + error.message
        });
    }
};

module.exports = {
    upload,
    uploadCV,
    extractCVText  // Add this export
};