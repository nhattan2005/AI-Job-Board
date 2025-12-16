const db = require('../config/database');
const { sendBulkEmails, templates } = require('../utils/emailSender');

// Send bulk emails to candidates
const sendBulkEmailsToApplications = async (req, res) => {
    const { applicationIds, subject, template, customMessage } = req.body;
    const employer_id = req.user.id;

    try {
        // Validation
        if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
            return res.status(400).json({ error: 'Application IDs are required' });
        }

        if (!subject || !template) {
            return res.status(400).json({ error: 'Subject and template are required' });
        }

        // Get company name
        const companyResult = await db.query(
            'SELECT company_name FROM users WHERE id = $1',
            [employer_id]
        );
        const companyName = companyResult.rows[0]?.company_name || 'Our Company';

        // Fetch candidate details for given application IDs
        // Verify they belong to employer's jobs
        const candidatesResult = await db.query(`
            SELECT 
                a.id as application_id,
                u.email as candidate_email,
                u.full_name as candidate_name,
                j.title as job_title,
                j.employer_id
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN users u ON a.candidate_id = u.id
            WHERE a.id = ANY($1) AND j.employer_id = $2
        `, [applicationIds, employer_id]);

        if (candidatesResult.rows.length === 0) {
            return res.status(404).json({ error: 'No valid applications found' });
        }

        // Prepare emails
        const emailList = candidatesResult.rows.map(candidate => {
            let htmlContent;

            // Use predefined template or custom message
            if (customMessage) {
                // Replace placeholders in custom message
                const personalizedMessage = customMessage
                    .replace(/\{\{name\}\}/g, candidate.candidate_name)
                    .replace(/\{\{jobTitle\}\}/g, candidate.job_title)
                    .replace(/\{\{company\}\}/g, companyName);

                htmlContent = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            ${personalizedMessage}
                            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                                Best regards,<br>
                                <strong>${companyName} Hiring Team</strong>
                            </p>
                        </div>
                    </div>
                `;
            } else {
                // Use predefined template
                if (template === 'accept') {
                    htmlContent = templates.accept(candidate.candidate_name, candidate.job_title, companyName);
                } else if (template === 'reject') {
                    htmlContent = templates.reject(candidate.candidate_name, candidate.job_title, companyName);
                } else if (template === 'interview') {
                    htmlContent = templates.interview(candidate.candidate_name, candidate.job_title, companyName);
                } else {
                    htmlContent = templates.accept(candidate.candidate_name, candidate.job_title, companyName);
                }
            }

            return {
                to: candidate.candidate_email,
                subject: subject,
                html: htmlContent,
                applicationId: candidate.application_id
            };
        });

        // Send emails
        const results = await sendBulkEmails(emailList);

        // Update application status to 'emailed' for successful sends
        if (results.success.length > 0) {
            const successfulAppIds = results.success.map((_, index) => 
                candidatesResult.rows[index].application_id
            );

            await db.query(`
                UPDATE applications 
                SET status = CASE 
                    WHEN status = 'pending' THEN 'reviewed'
                    ELSE status
                END,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ANY($1)
            `, [successfulAppIds]);
        }

        res.json({
            message: 'Bulk email process completed',
            total: emailList.length,
            successful: results.success.length,
            failed: results.failed.length,
            results: results
        });

    } catch (error) {
        console.error('Error sending bulk emails:', error);
        res.status(500).json({ 
            error: 'Failed to send bulk emails', 
            details: error.message 
        });
    }
};

// Get available email templates
const getEmailTemplates = async (req, res) => {
    try {
        const templateList = [
            {
                id: 'accept',
                name: 'Acceptance Email',
                description: 'Congratulate candidates on being accepted',
                subject: '🎉 Congratulations! Your Application Has Been Accepted'
            },
            {
                id: 'reject',
                name: 'Rejection Email',
                description: 'Politely inform candidates of rejection',
                subject: 'Application Status Update'
            },
            {
                id: 'interview',
                name: 'Interview Invitation',
                description: 'Invite candidates for an interview',
                subject: '📅 Interview Invitation - {{jobTitle}}'
            },
            {
                id: 'custom',
                name: 'Custom Email',
                description: 'Write your own custom message',
                subject: 'Update on Your Application'
            }
        ];

        res.json({ templates: templateList });
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
};

module.exports = {
    sendBulkEmailsToApplications,
    getEmailTemplates
};