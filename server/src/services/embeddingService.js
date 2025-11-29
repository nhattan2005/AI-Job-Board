const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/database');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize models once
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

// Helper function to delay requests (rate limiting)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Embed job description with 768 dimensions
async function embedJobDescription(jobDescription) {
    try {
        console.log('Generating job description embedding using text-embedding-004...');
        
        // Add delay to prevent rate limiting
        await delay(500);
        
        const result = await embeddingModel.embedContent(jobDescription);
        const embedding = result.embedding.values;
        
        // Verify dimension count
        if (embedding.length !== 768) {
            console.warn(`Warning: Expected 768 dimensions, got ${embedding.length}`);
        } else {
            console.log('✓ Job description embedding generated: 768 dimensions');
        }
        
        return embedding;
    } catch (error) {
        console.error('Error generating job description embedding:', error);
        
        if (error.status === 429 || error.message.includes('quota')) {
            throw new Error('API quota exceeded. Please wait a moment and try again, or upgrade your API plan.');
        }
        
        if (error.status === 403) {
            throw new Error('API access denied. Please verify your API key permissions.');
        }
        
        throw new Error('Failed to generate job embedding: ' + error.message);
    }
}

// Embed CV text with 768 dimensions
async function embedCV(cvText) {
    try {
        console.log('Generating CV embedding using text-embedding-004...');
        
        // Add delay to prevent rate limiting
        await delay(500);
        
        const result = await embeddingModel.embedContent(cvText);
        const embedding = result.embedding.values;
        
        // Verify dimension count
        if (embedding.length !== 768) {
            console.warn(`Warning: Expected 768 dimensions, got ${embedding.length}`);
        } else {
            console.log('✓ CV embedding generated: 768 dimensions');
        }
        
        return embedding;
    } catch (error) {
        console.error('Error generating CV embedding:', error);
        
        if (error.status === 429 || error.message.includes('quota')) {
            throw new Error('API quota exceeded. Please wait a moment and try again, or upgrade your API plan.');
        }
        
        if (error.status === 403) {
            throw new Error('API access denied. Please verify your API key permissions.');
        }
        
        throw new Error('Failed to generate CV embedding: ' + error.message);
    }
}

// Save job embedding to database
async function saveJobEmbedding(jobId, embedding) {
    try {
        // Ensure embedding is 768 dimensions
        if (embedding.length !== 768) {
            throw new Error(`Invalid embedding dimension: ${embedding.length}, expected 768`);
        }
        
        const query = 'UPDATE jobs SET vector = $1 WHERE id = $2';
        await db.query(query, [JSON.stringify(embedding), jobId]);
        console.log(`✓ Job ${jobId} embedding saved to database`);
    } catch (error) {
        console.error('Error saving job embedding:', error);
        throw new Error('Failed to save job embedding: ' + error.message);
    }
}

// Get job embedding from database
async function getJobEmbedding(jobId) {
    try {
        const query = 'SELECT vector FROM jobs WHERE id = $1';
        const res = await db.query(query, [jobId]);
        
        if (res.rows.length === 0) {
            throw new Error('Job not found');
        }
        
        const embedding = JSON.parse(res.rows[0].vector);
        
        // Verify dimension
        if (embedding.length !== 768) {
            console.warn(`Warning: Job ${jobId} has ${embedding.length} dimensions, expected 768`);
        }
        
        return embedding;
    } catch (error) {
        console.error('Error getting job embedding:', error);
        throw new Error('Failed to get job embedding: ' + error.message);
    }
}

// Batch embed multiple texts (with rate limiting)
async function batchEmbed(texts) {
    try {
        console.log(`Batch embedding ${texts.length} texts...`);
        const embeddings = [];
        
        for (let i = 0; i < texts.length; i++) {
            console.log(`Processing ${i + 1}/${texts.length}...`);
            
            // Add delay between requests
            if (i > 0) {
                await delay(1000); // 1 second delay between requests
            }
            
            const result = await embeddingModel.embedContent(texts[i]);
            embeddings.push(result.embedding.values);
        }
        
        console.log(`✓ Batch embedding complete: ${embeddings.length} embeddings generated`);
        return embeddings;
    } catch (error) {
        console.error('Error in batch embedding:', error);
        throw new Error('Failed to batch embed: ' + error.message);
    }
}

module.exports = {
    embedJobDescription,
    embedCV,
    saveJobEmbedding,
    getJobEmbedding,
    batchEmbed,
};