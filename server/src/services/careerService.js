const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateCareerPath = async (cvText) => {
    try {
        console.log("CV text length:", cvText.length);
        console.log("Initializing Gemini model for career analysis...");

        const model = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
            }
        });

        const prompt = `
You are an expert AI Career Counselor. Analyze the following CV text and generate a personalized career development path.

CV Text:
"${cvText}"

Return the response in STRICT JSON format matching exactly the structure below.

CRITICAL RULES:
1. Use DOUBLE QUOTES for all keys and string values.
2. NO trailing commas after the last item in arrays or objects.
3. NO comments inside the JSON.
4. ALL keys must be lowercase with underscores (snake_case).
5. Ensure all brackets are properly closed.
6. **IMPORTANT**: Remove ALL trailing commas before closing brackets.

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
        { "type": "Learn", "content": "Action description" },
        { "type": "Project", "content": "Action description" }
      ]
    }
  ]
}

Provide the complete analysis based on the CV content.
`;

        console.log("Sending request to Gemini API...");
        const result = await model.generateContent(prompt);

        // 👇 SỬA: Truy cập đúng structure của Gemini API response
        console.log("Received response from Gemini");

        // Kiểm tra xem có response không
        if (!result.response || !result.response.candidates || result.response.candidates.length === 0) {
            console.error("❌ No candidates in response:", JSON.stringify(result, null, 2));
            throw new Error("AI did not return any response candidates.");
        }

        const candidate = result.response.candidates[0];

        // Kiểm tra xem có content không
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            console.error("❌ No content parts in candidate:", JSON.stringify(candidate, null, 2));
            throw new Error("AI response candidate has no content parts.");
        }

        // 👇 ĐỌC TEXT TỪ PARTS
        let text = candidate.content.parts[0].text.trim();

        // Clean up response
        text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

        // Loại bỏ trailing commas
        text = text.replace(/,(\s*[}\]])/g, '$1');
        text = text.replace(/,(\s*\n\s*[}\]])/g, '$1');

        // Loại bỏ comments trong JSON (nếu có)
        text = text.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

        try {
            const analysis = JSON.parse(text);
            return analysis;
        } catch (parseError) {
            console.error("❌ JSON Parse Error. Raw Text:", text);
            console.error("Parse Error Details:", parseError.message);
            throw new Error("AI response format was invalid.");
        }

    } catch (error) {
        console.error("❌ Career path generation error:", error);
        throw error;
    }
};

module.exports = {
    generateCareerPath
};