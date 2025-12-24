require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('📧 Testing email configuration...\n');
    
    // Check env variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('❌ Missing EMAIL_USER or EMAIL_PASSWORD in .env');
        return;
    }
    
    console.log('Email User:', process.env.EMAIL_USER);
    console.log('Email Password:', '****' + process.env.EMAIL_PASSWORD.slice(-4));
    console.log();

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    try {
        console.log('🚀 Sending test email...');
        
        const info = await transporter.sendMail({
            from: `"${process.env.COMPANY_NAME}" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Gửi cho chính mình
            subject: '✅ Test Email from AI Job Board',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2563eb;">Email Service is Working! 🎉</h1>
                    <p>Your email configuration is correct.</p>
                    <p>You can now receive OTP codes and verification emails.</p>
                </div>
            `
        });
        
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('📬 Check your inbox:', process.env.EMAIL_USER);
        
    } catch (error) {
        console.error('❌ Email failed:', error.message);
        
        if (error.message.includes('Invalid login')) {
            console.error('\n💡 Fix:');
            console.error('1. Make sure EMAIL_PASSWORD is an App Password (not regular Gmail password)');
            console.error('2. Get App Password at: https://myaccount.google.com/apppasswords');
            console.error('3. Enable 2-Step Verification first if not enabled');
        }
    }
}

testEmail();