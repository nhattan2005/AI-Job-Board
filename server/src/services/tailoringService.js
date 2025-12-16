const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const tailorCV = async (cvText, jobDescription) => {
    try {
        console.log('Initializing Gemini model: gemini-2.5-flash');
        
        // Initialize the model
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash" 
        });

        const prompt = `You are a professional career coach and CV optimization expert.

Analyze this CV against the job description and provide specific, actionable advice.

CV Content:
${cvText.substring(0, 2000)}  // ← GIỚI HẠN 2000 ký tự để tiết kiệm tokens

Job Description:
${jobDescription}

Provide a detailed analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
{
  "missingKeywords": ["keyword1", "keyword2"],
  "missingSkills": ["skill1", "skill2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "improvements": ["improvement1", "improvement2"]
}

Focus on:
1. Technical skills and keywords from the job description that are missing
2. Specific suggestions to improve CV content
3. Ways to better match the job requirements`;

        console.log('Sending request to Gemini API...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        console.log('Received response from Gemini');

        // Clean up response - remove markdown code blocks if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse JSON
        let analysis;
        try {
            analysis = JSON.parse(text);
            console.log('✓ JSON parsed successfully');
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError.message);
            throw new Error('Invalid JSON response from AI');
        }

        return {
            missingKeywords: analysis.missingKeywords || [],
            missingSkills: analysis.missingSkills || [],
            suggestions: analysis.suggestions || [],
            improvements: analysis.improvements || []
        };
    } catch (error) {
        console.error('❌ CV tailoring error:', error);
        
        // Handle quota exceeded error
        if (error.status === 429) {
            return {
                missingKeywords: [],
                missingSkills: [],
                suggestions: ['⏰ API quota exceeded. Please wait 1 minute and try again.'],
                improvements: []
            };
        }
        
        // Return fallback structure
        return {
            missingKeywords: [],
            missingSkills: [],
            suggestions: ['Unable to generate suggestions at this time. Please try again.'],
            improvements: []
        };
    }
};

module.exports = {
    tailorCV
};