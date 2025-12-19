const db = require('../config/database');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Start Session
const startSession = async (req, res) => {
    const { jobId, type } = req.body; // type: 'HR' or 'Tech_Lead'
    const userId = req.user.id;

    try {
        // Lấy thông tin Job
        const jobRes = await db.query(
            'SELECT j.title, j.description, j.location, u.company_name FROM jobs j JOIN users u ON j.employer_id = u.id WHERE j.id = $1', 
            [jobId]
        );
        if (jobRes.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
        const job = jobRes.rows[0];

        // Tạo Session trong DB (FIX: Truyền chuỗi JSON thay vì dùng ::jsonb)
        const insertRes = await db.query(
            `INSERT INTO mock_interviews (user_id, job_id, interview_type, chat_history) 
             VALUES ($1, $2, $3, $4) RETURNING session_id`,
            [userId, jobId, type, JSON.stringify([])] // ← SỬA ĐÂY
        );
        const sessionId = insertRes.rows[0].session_id;

        // Gọi Gemini để tạo câu hỏi đầu tiên
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // System Prompt chi tiết hơn với cấu trúc phỏng vấn chặt chẽ
        const systemPrompt = `You are a professional ${type} interviewer at ${job.company_name}. 
You are conducting a structured interview for the position of ${job.title} in ${job.location}.

Job Description:
${job.description.substring(0, 1200)}

INTERVIEW STRUCTURE (5 Questions Total):
1. Opening: Motivation & Understanding (Why this role? What attracts you?)
2. Experience Deep Dive: Past projects, problem-solving examples
3. Technical/Behavioral Challenge: Scenario-based question
4. Skills Assessment: Specific technical/soft skills from JD
5. Closing: Questions for us? Availability?

STRICT RULES:
1. Introduce yourself as: "Hello, I'm an ${type} interviewer at ${job.company_name}."
2. Ask ONE clear, specific question at a time.
3. Use follow-up questions if the answer is vague (e.g., "Can you elaborate on...?", "What was the outcome?")
4. For Tech_Lead: Focus on system design, code quality, scalability, debugging strategies.
5. For HR: Focus on STAR method (Situation, Task, Action, Result), teamwork, conflict resolution, adaptability.
6. After each answer, briefly acknowledge (e.g., "I see", "That's interesting") before moving to the next question.
7. Keep responses under 3 sentences.
8. Do NOT give scores or feedback during the interview—save it for the final report.

START the interview now with your introduction and Question 1.`;

        console.log("Sending request to Gemini API...");

        const result = await model.generateContent(systemPrompt);
        const firstQuestion = result.response.text();

        // Lưu lịch sử - BẮT ĐẦU VỚI 'user' để tuân thủ Gemini SDK
        const initialHistory = [
            { role: 'user', parts: [{ text: 'Start the interview' }] },
            { role: 'model', parts: [{ text: firstQuestion }] }
        ];
        await db.query('UPDATE mock_interviews SET chat_history = $1 WHERE session_id = $2', 
            [JSON.stringify(initialHistory), sessionId]);

        res.json({ 
            sessionId, 
            message: firstQuestion,
            jobDetails: {
                title: job.title,
                company: job.company_name,
                location: job.location
            }
        });
    } catch (error) {
        console.error('Start Session Error:', error);
        res.status(500).json({ error: 'Failed to start session', details: error.message });
    }
};

// 2. Process Response
const processResponse = async (req, res) => {
    const { sessionId, userText, audioStats } = req.body;

    try {
        const sessionRes = await db.query('SELECT * FROM mock_interviews WHERE session_id = $1', [sessionId]);
        if (sessionRes.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
        
        const session = sessionRes.rows[0];
        let history = session.chat_history || [];

        // Chat với Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 300, // Giới hạn độ dài câu trả lời của AI
            }
        });

        const result = await chat.sendMessage(userText);
        const aiResponse = result.response.text();

        // Cập nhật lịch sử
        const newHistory = [
            ...history,
            { role: 'user', parts: [{ text: userText }] },
            { role: 'model', parts: [{ text: aiResponse }] }
        ];

        // Cập nhật metrics đơn giản
        const currentMetrics = session.audio_metrics || { hesitations: 0, wpm_history: [] };
        if (audioStats) {
            currentMetrics.hesitations = (currentMetrics.hesitations || 0) + (audioStats.hesitations || 0);
            if (audioStats.wpm) {
                currentMetrics.wpm_history = [...(currentMetrics.wpm_history || []), audioStats.wpm];
            }
        }

        await db.query(
            'UPDATE mock_interviews SET chat_history = $1, audio_metrics = $2 WHERE session_id = $3',
            [JSON.stringify(newHistory), JSON.stringify(currentMetrics), sessionId]
        );

        res.json({ message: aiResponse });
    } catch (error) {
        console.error('Process Response Error:', error);
        res.status(500).json({ error: 'Processing failed', details: error.message });
    }
};

// 3. End Session & Generate Feedback
const endSession = async (req, res) => {
    const { sessionId } = req.body;

    try {
        const sessionRes = await db.query('SELECT * FROM mock_interviews WHERE session_id = $1', [sessionId]);
        if (sessionRes.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
        
        const session = sessionRes.rows[0];
        const history = session.chat_history || [];

        // Chuẩn bị context đầy đủ cho Gemini
        const conversationSummary = history.map(msg => {
            const role = msg.role === 'user' ? 'Candidate' : 'Interviewer';
            return `${role}: ${msg.parts[0].text}`;
        }).join('\n\n');

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `You are an expert interview evaluator. Analyze this ${session.interview_type} interview conversation and provide a comprehensive feedback report.

Interview Transcript:
${conversationSummary}

Audio Metrics:
- Hesitations: ${session.audio_metrics?.hesitations || 0}
- Average WPM: ${session.audio_metrics?.wpm_history?.length > 0 ? Math.round(session.audio_metrics.wpm_history.reduce((a,b) => a+b, 0) / session.audio_metrics.wpm_history.length) : 'N/A'}

Provide feedback in STRICT JSON format:
{
  "overall_score": 0-100,
  "strengths": ["Specific strength with evidence from transcript", "..."],
  "weaknesses": ["Specific area for improvement with example", "..."],
  "recommendation": "Hire" | "No Hire" | "Maybe"
}

Evaluation Criteria:
- Technical depth (for Tech_Lead) or behavioral quality (for HR)
- Communication clarity and structure
- Relevance to job requirements
- Problem-solving approach
- Professionalism

Return ONLY the JSON, no markdown.`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().replace(/```json|```/g, '').trim();
        
        const report = JSON.parse(text);

        // Lưu vào DB
        await db.query(
            `UPDATE mock_interviews SET status = 'completed', overall_score = $1, final_feedback = $2 
             WHERE session_id = $3`,
            [report.overall_score, JSON.stringify(report), sessionId]
        );

        res.json(report);
    } catch (error) {
        console.error('End Session Error:', error);
        res.status(500).json({ error: 'Failed to generate feedback', details: error.message });
    }
};

module.exports = { startSession, processResponse, endSession };