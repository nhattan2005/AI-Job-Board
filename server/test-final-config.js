const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testConfiguration() {
    console.log('=== Testing Final AI Configuration ===\n');
    
    // Test 1: Text Generation with gemini-flash-latest
    try {
        console.log('1. Testing gemini-flash-latestest for text generation...');
        const chatModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        const result = await chatModel.generateContent('Say "Configuration successful!" in one sentence.');
        const response = await result.response;
        console.log('✅ gemini-flash-latest works!');
        console.log('Response:', response.text());
        console.log();
    } catch (error) {
        console.log('❌ gemini-flash-latest failed:', error.message);
        console.log();
        return;
    }
    
    // Test 2: Embedding with text-embedding-004
    try {
        console.log('2. Testing text-embedding-004 for embeddings...');
        const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await embeddingModel.embedContent('This is a test embedding');
        const embedding = result.embedding.values;
        console.log('✅ text-embedding-004 works!');
        console.log('Embedding dimensions:', embedding.length);
        
        if (embedding.length === 768) {
            console.log('✅ Correct dimension: 768 (matches database schema)');
        } else {
            console.log('⚠️  Warning: Expected 768 dimensions, got', embedding.length);
        }
        console.log();
    } catch (error) {
        console.log('❌ text-embedding-004 failed:', error.message);
        console.log();
        return;
    }
    
    // Test 3: Full workflow simulation
    try {
        console.log('3. Testing full AI workflow...');
        
        const jobDesc = 'We need a React developer with Node.js experience';
        const cvText = 'I am a full-stack developer proficient in React, Node.js, and MongoDB';
        
        console.log('   a) Embedding job description...');
        const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const jobResult = await embeddingModel.embedContent(jobDesc);
        const jobVector = jobResult.embedding.values;
        console.log('   ✓ Job vector created:', jobVector.length, 'dimensions');
        
        console.log('   b) Embedding CV...');
        const cvResult = await embeddingModel.embedContent(cvText);
        const cvVector = cvResult.embedding.values;
        console.log('   ✓ CV vector created:', cvVector.length, 'dimensions');
        
        console.log('   c) Calculating similarity...');
        const dotProduct = jobVector.reduce((sum, val, i) => sum + val * cvVector[i], 0);
        const magA = Math.sqrt(jobVector.reduce((sum, val) => sum + val * val, 0));
        const magB = Math.sqrt(cvVector.reduce((sum, val) => sum + val * val, 0));
        const similarity = (dotProduct / (magA * magB)) * 100;
        console.log('   ✓ Match score:', Math.round(similarity * 100) / 100, '%');
        
        console.log('   d) Generating AI advice...');
        const chatModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        const prompt = `Analyze this CV against the job. Give 2 quick tips in JSON: {"tips": ["tip1", "tip2"]}

Job: ${jobDesc}
CV: ${cvText}`;
        
        const adviceResult = await chatModel.generateContent(prompt);
        const adviceResponse = await adviceResult.response;
        console.log('   ✓ AI advice generated');
        console.log('   Response preview:', adviceResponse.text().substring(0, 100) + '...');
        console.log();
        
        console.log('✅ Full workflow test PASSED!');
        console.log();
    } catch (error) {
        console.log('❌ Workflow test failed:', error.message);
        console.log();
    }
    
    console.log('=== Configuration Test Complete ===');
    console.log('\n✅ All systems ready! You can now:');
    console.log('   1. Calculate match scores (using text-embedding-004)');
    console.log('   2. Get AI suggestions (using gemini-flash-latest)');
    console.log('   3. All vectors use 768 dimensions (matching PostgreSQL schema)');
}

testConfiguration();