const express = require('express');
const { verifyToken, verifyEmployer } = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');
const db = require('../config/database');

const router = express.Router();

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Send bulk email to selected candidates
router.post('/send-bulk-email', verifyToken, verifyEmployer, async (req, res) => {
    try {
        const { applicationIds, subject, message } = req.body;
        const employer_id = req.user.id;

        if (!applicationIds || applicationIds.length === 0) {
            return res.status(400).json({ error: 'No applications selected' });
        }

        if (!subject || !message) {
            return res.status(400).json({ error: 'Subject and message are required' });
        }

        // Get candidate emails for selected applications
        const result = await db.query(`
            SELECT DISTINCT u.email, u.full_name, j.title as job_title
            FROM applications a
            JOIN users u ON a.candidate_id = u.id
            JOIN jobs j ON a.job_id = j.id
            WHERE a.id = ANY($1) AND j.employer_id = $2
        `, [applicationIds, employer_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No valid applications found' });
        }

        // Get employer info
        const employerResult = await db.query(
            'SELECT company_name, email FROM users WHERE id = $1',
            [employer_id]
        );
        const employer = employerResult.rows[0];

        // Send emails
        const emailPromises = result.rows.map(candidate => {
            const personalizedMessage = message
                .replace(/\[Candidate Name\]/g, candidate.full_name || 'Candidate')
                .replace(/\[Job Title\]/g, candidate.job_title);

            return transporter.sendMail({
                from: `"${employer.company_name}" <${process.env.EMAIL_USER}>`,
                to: candidate.email,
                subject: subject.replace(/\[Job Title\]/g, candidate.job_title),
                text: personalizedMessage,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">Message from ${employer.company_name}</h1>
                        </div>
                        <div style="padding: 30px; background: #f9fafb;">
                            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                ${personalizedMessage.split('\n').map(line => 
                                    line.trim() ? `<p style="color: #374151; line-height: 1.6;">${line}</p>` : '<br>'
                                ).join('')}
                            </div>
                        </div>
                        <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
                            <p>This email was sent via AI Job Board</p>
                            <p>Reply to: ${employer.email}</p>
                        </div>
                    </div>
                `
            });
        });

        await Promise.all(emailPromises);

        res.json({
            success: true,
            message: `Email sent to ${result.rows.length} candidate(s)`,
            recipientCount: result.rows.length
        });

    } catch (error) {
        console.error('Error sending bulk email:', error);
        res.status(500).json({ 
            error: 'Failed to send emails', 
            details: error.message 
        });
    }
});

module.exports = router;