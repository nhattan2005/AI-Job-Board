const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 👇 CẬP NHẬT: Thêm tham số targetGoal vào hàm
const generateCareerPath = async (cvText, targetGoal = '') => {
    try {
        console.log("CV text length:", cvText.length);
        if (targetGoal) console.log("🎯 Target Goal for AI:", targetGoal);

        const model = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
            }
        });

        // 👇 LOGIC MỚI: Xây dựng chỉ dẫn (Instruction) dựa trên targetGoal
        let contextInstruction = "";
        if (targetGoal && targetGoal.trim()) {
            contextInstruction = `
*** CRITICAL INSTRUCTION ***
The user has explicitly set a TARGET GOAL: "${targetGoal}".
You MUST ignore generic career paths and focus ENTIRELY on how to get this user from their current state to "${targetGoal}".

1. "skill_gap": List ONLY the skills they are missing to become a "${targetGoal}".
2. "roadmap": Create a step-by-step plan specifically to achieve "${targetGoal}".
3. "paths": The first path in the list MUST be "${targetGoal}".
`;
        } else {
            contextInstruction = `
The user has not specified a target role. Analyze the CV to suggest the best matching career paths based on their current skills and market trends.
`;
        }

        const prompt = `
You are an expert AI Career Counselor. Analyze the following CV text and generate a personalized career development path.

${contextInstruction}

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
        const response = await result.response;
        let text = response.text();

        console.log("Received response from Gemini");

        // Clean up response
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            text = text.substring(jsonStart, jsonEnd + 1);
        }

        const analysis = JSON.parse(text);
        return analysis;

    } catch (error) {
        console.error("Error in AI service:", error);
        throw error;
    }
};

module.exports = {
    generateCareerPath
};