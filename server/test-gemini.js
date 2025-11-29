const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModels() {
    console.log('Testing Gemini API...\n');
    
    // Test text generation
    try {
        console.log('Testing gemini-1.5-flash...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('Say hello');
        const response = await result.response;
        console.log('✅ gemini-1.5-flash works!');
        console.log('Response:', response.text());
    } catch (error) {
        console.log('❌ gemini-1.5-flash failed:', error.message);
    }
    
    console.log('\n---\n');
    
    // Test embedding
    try {
        console.log('Testing text-embedding-004...');
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent('Hello world');
        console.log('✅ text-embedding-004 works!');
        console.log('Embedding dimensions:', result.embedding.values.length);
    } catch (error) {
        console.log('❌ text-embedding-004 failed:', error.message);
    }
}

testModels();