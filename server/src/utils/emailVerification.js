const nodemailer = require('nodemailer');
const crypto = require('crypto');

// 👇 FIX HERE: Change createTransporter to createTransport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const sendOTPEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: `"${process.env.COMPANY_NAME || 'AI Job Board'}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Email Verification - AI Job Board',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                    <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #3b82f6; margin-bottom: 20px;">📧 Email Verification</h2>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            Thank you for registering with AI Job Board!
                        </p>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            Your verification code is:
                        </p>
                        <div style="background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                            <span style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 8px;">${otp}</span>
                        </div>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            This code will expire in <strong>10 minutes</strong>.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                            If you didn't request this verification, please ignore this email.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✓ OTP sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error(`✗ Failed to send OTP to ${email}:`, error.message);
        return { success: false, error: error.message };
    }
};

const sendVerificationLinkEmail = async (email, token) => {
    try {
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;
        
        const mailOptions = {
            from: `"${process.env.COMPANY_NAME || 'AI Job Board'}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Email - AI Job Board',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                    <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #3b82f6; margin-bottom: 20px;">📧 Verify Your Email</h2>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            Thank you for registering with AI Job Board!
                        </p>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            Please click the button below to verify your email address:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                Verify Email Address
                            </a>
                        </div>
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                            Or copy and paste this link into your browser:
                        </p>
                        <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">
                            ${verificationUrl}
                        </p>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 20px;">
                            This link will expire in <strong>24 hours</strong>.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                            If you didn't create an account, please ignore this email.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✓ Verification link sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error(`✗ Failed to send verification link to ${email}:`, error.message);
        return { success: false, error: error.message };
    }
};

const sendPasswordResetEmail = async (email, resetToken) => {
    try {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
        
        const mailOptions = {
            from: `"${process.env.COMPANY_NAME || 'AI Job Board'}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request - AI Job Board',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
                    </div>
                    <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            Hi there,
                        </p>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            We received a request to reset your password. Click the button below to create a new password:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                      color: white; 
                                      padding: 15px 40px; 
                                      text-decoration: none; 
                                      border-radius: 8px; 
                                      font-weight: bold; 
                                      font-size: 16px;
                                      display: inline-block;
                                      box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                Reset Password
                            </a>
                        </div>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 20px;">
                            This link will expire in <strong>1 hour</strong>.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                            If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            Or copy and paste this URL into your browser:<br/>
                            <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✓ Password reset link sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error(`✗ Failed to send password reset link to ${email}:`, error.message);
        return { success: false, error: error.message };
    }
};

module.exports = {
    generateOTP,
    generateVerificationToken,
    sendOTPEmail,
    sendVerificationLinkEmail,
    sendPasswordResetEmail    // 👈 THÊM EXPORT
};