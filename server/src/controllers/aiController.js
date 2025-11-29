// server/src/controllers/aiController.js

const { embedJobDescription, embedCV } = require('../services/embeddingService');
const { cosineSimilarity } = require('../utils/vectorMath');
const tailoringService = require('../services/tailoringService');

// Match job with CV
const getJobMatchingScore = async (req, res) => {
    try {
        const { jobDescription, cvText } = req.body;

        if (!jobDescription || !cvText) {
            return res.status(400).json({ error: 'Job description and CV text are required' });
        }

        console.log('=== Starting Match Score Calculation ===');
        console.log('Job description length:', jobDescription.length);
        console.log('CV text length:', cvText.length);

        // Generate embeddings using text-embedding-004
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
            matchingScore: Math.round(score * 100) / 100,
            message: 'Matching score calculated successfully',
            dimensions: {
                jobVector: jobVector.length,
                cvVector: cvVector.length
            }
        });
    } catch (error) {
        console.error('❌ Error calculating matching score:', error);
        
        // Specific error handling
        if (error.message.includes('quota')) {
            return res.status(429).json({ 
                error: 'API quota exceeded',
                details: 'Please wait a moment before trying again',
                retryAfter: 60
            });
        }
        
        if (error.message.includes('access denied') || error.message.includes('403')) {
            return res.status(403).json({ 
                error: 'API access denied',
                details: 'Please verify your API key has the correct permissions'
            });
        }
        
        res.status(500).json({ 
            error: 'Error calculating matching score',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Tailor CV based on job description
const getTailoredCV = async (req, res) => {
    try {
        const { cvText, jobDescription } = req.body;

        if (!cvText || !jobDescription) {
            return res.status(400).json({ error: 'CV text and job description are required' });
        }

        console.log('=== Starting CV Tailoring ===');
        console.log('CV Length:', cvText.length);
        console.log('Job Description Length:', jobDescription.length);
        console.log('Using model: gemini-2.5-flash');
        
        const tailoredResult = await tailoringService.tailorCV(cvText, jobDescription);
        
        console.log('✓ CV tailored successfully');
        console.log('=== CV Tailoring Complete ===');
        
        res.json({ 
            tailoredCV: tailoredResult,
            message: 'CV analysis completed successfully',
            model: 'gemini-2.5-flash'
        });
    } catch (error) {
        console.error('❌ Error tailoring CV:', error);
        
        // Specific error handling
        if (error.message.includes('quota')) {
            return res.status(429).json({ 
                error: 'API quota exceeded',
                details: 'Please wait a moment before trying again',
                retryAfter: 60
            });
        }
        
        if (error.message.includes('access denied') || error.message.includes('403')) {
            return res.status(403).json({ 
                error: 'API access denied',
                details: 'Please verify your API key has the correct permissions'
            });
        }
        
        if (error.message.includes('not available') || error.message.includes('404')) {
            return res.status(503).json({ 
                error: 'AI service temporarily unavailable',
                details: 'The AI model is currently unavailable. Please try again later.'
            });
        }
        
        res.status(500).json({ 
            error: 'Error tailoring CV',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

module.exports = {
    getJobMatchingScore,
    getTailoredCV
};