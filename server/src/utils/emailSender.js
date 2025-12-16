const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Send custom email
const sendCustomEmail = async (to, subject, htmlContent) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"${process.env.COMPANY_NAME || 'AI Job Board'}" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✓ Email sent to ${to}: ${info.messageId}`);
        
        return {
            success: true,
            messageId: info.messageId,
            recipient: to
        };
    } catch (error) {
        console.error(`✗ Failed to send email to ${to}:`, error.message);
        return {
            success: false,
            error: error.message,
            recipient: to
        };
    }
};

// Send bulk emails with error handling
const sendBulkEmails = async (emailList) => {
    const results = {
        success: [],
        failed: []
    };

    for (const email of emailList) {
        const result = await sendCustomEmail(email.to, email.subject, email.html);
        
        if (result.success) {
            results.success.push(result);
        } else {
            results.failed.push(result);
        }
        
        // Add delay to avoid rate limiting (1 second between emails)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
};

// Email templates
const templates = {
    accept: (candidateName, jobTitle, companyName) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #10b981; margin-bottom: 20px;">🎉 Congratulations ${candidateName}!</h2>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    We are pleased to inform you that your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been <strong style="color: #10b981;">accepted</strong>.
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    We were impressed with your qualifications and believe you would be a great fit for our team.
                </p>
                <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                    <p style="color: #065f46; margin: 0; font-weight: 500;">
                        Next Steps: We will contact you shortly to discuss the next steps in the hiring process.
                    </p>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    Best regards,<br>
                    <strong>${companyName} Hiring Team</strong>
                </p>
            </div>
        </div>
    `,
    
    reject: (candidateName, jobTitle, companyName) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #6b7280; margin-bottom: 20px;">Application Status Update</h2>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    Dear ${candidateName},
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.
                </p>
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                    <p style="color: #991b1b; margin: 0;">
                        We encourage you to apply for other positions that match your skills and experience.
                    </p>
                </div>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    We wish you the best of luck in your job search and future career endeavors.
                </p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    Best regards,<br>
                    <strong>${companyName} Hiring Team</strong>
                </p>
            </div>
        </div>
    `,
    
    interview: (candidateName, jobTitle, companyName) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #3b82f6; margin-bottom: 20px;">📅 Interview Invitation</h2>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    Dear ${candidateName},
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    We are pleased to invite you for an interview for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.
                </p>
                <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                    <p style="color: #1e40af; margin: 0; font-weight: 500;">
                        Please reply to this email with your availability for the coming week.
                    </p>
                </div>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    We look forward to speaking with you!
                </p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    Best regards,<br>
                    <strong>${companyName} Hiring Team</strong>
                </p>
            </div>
        </div>
    `
};

module.exports = {
    sendCustomEmail,
    sendBulkEmails,
    templates
};