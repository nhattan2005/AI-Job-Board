const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateCareerPath = async (cvText) => {
    try {
        console.log('Initializing Gemini model for career analysis...');
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                responseMimeType: "application/json"
            }
        });

        if (!cvText) throw new Error("CV text is required");

        const prompt = `
        You are an expert AI Career Counselor. Analyze the following CV text and generate a personalized career development path.
        
        CV Text:
        "${cvText}"

        Return the response in STRICT JSON format matching exactly the structure below.
        
        CRITICAL RULES:
        1. Use DOUBLE QUOTES for all keys and string values.
        2. NO trailing commas after the last item in arrays or objects.
        3. NO comments inside the JSON.
        
        JSON Structure:
        {
          "current_positioning": {
            "role": "Current or most suitable job title",
            "level": "Junior/Mid/Senior",
            "salary_potential": "Estimated salary range (e.g. $60k - $80k)",
            "summary": "Brief professional summary"
          },
          "skill_gap": [
            { 
              "skill": "Name of the skill", 
              "status": "Missing OR Weak", 
              "priority": "High OR Medium OR Low" 
            }
          ],
          "paths": [
            { 
              "name": "Potential Career Path / Job Role", 
              "match": 85, 
              "time": "e.g. 3-6 months", 
              "pros": ["Advantage 1", "Advantage 2"], 
              "cons": ["Challenge 1", "Challenge 2"] 
            }
          ],
          "roadmap": [
            { 
              "phase": "Phase Name (e.g. Month 1-2: Foundations)", 
              "actions": [
                { "type": "Learn OR Project OR Network", "content": "Specific action item" }
              ] 
            }
          ]
        }
        `;

        console.log("Sending request to Gemini API...");

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        console.log("Received response from Gemini");

        // --- BƯỚC VỆ SINH JSON (JSON SANITIZATION) ---
        
        // 1. Xóa Markdown code blocks
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // 2. Xóa comments (// ...) nếu có
        text = text.replace(/\/\/.*$/gm, '');

        // 3. Fix lỗi dấu phẩy thừa (Trailing Commas) - Nguyên nhân chính gây lỗi
        // Tìm dấu phẩy đứng trước dấu đóng } hoặc ] và xóa nó đi
        text = text.replace(/,(\s*[}\]])/g, '$1');

        try {
            const analysis = JSON.parse(text);
            return analysis;
        } catch (parseError) {
            console.error("JSON Parse Error. Raw Text:", text);
            throw new Error("AI response format was invalid.");
        }

    } catch (error) {
        console.error('❌ Career path generation error:', error);
        
        // Fallback data để tránh crash Frontend
        return {
            current_positioning: {
                role: "Analysis Failed",
                level: "Unknown",
                salary_potential: "Unknown",
                summary: "Could not analyze CV due to AI service interruption. Please try again later."
            },
            skill_gap: [],
            paths: [],
            roadmap: []
        };
    }
};

module.exports = {
    generateCareerPath
};