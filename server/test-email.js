require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('=== Testing Email Configuration ===\n');
    
    // Check environment variables
    console.log('Email User:', process.env.EMAIL_USER);
    console.log('Email Password:', process.env.EMAIL_PASSWORD ? '***configured***' : '❌ NOT SET');
    console.log('Company Name:', process.env.COMPANY_NAME || 'AI Job Board (default)');
    console.log();
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('❌ Missing EMAIL_USER or EMAIL_PASSWORD in .env file');
        console.log('\n📝 Add these to your .env file:');
        console.log('EMAIL_USER=your-email@gmail.com');
        console.log('EMAIL_PASSWORD=your-app-password');
        console.log('\n💡 For Gmail:');
        console.log('1. Go to Google Account > Security');
        console.log('2. Enable 2-Step Verification');
        console.log('3. Go to App passwords');
        console.log('4. Generate an app password for "Mail"');
        console.log('5. Use that password in EMAIL_PASSWORD');
        return;
    }
    
    // Create transporter
    console.log('Creating transporter...');
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    
    // Verify transporter
    console.log('Verifying connection...');
    try {
        await transporter.verify();
        console.log('✅ Email server connection verified!\n');
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('\n💡 Common issues:');
        console.log('- Wrong email or password');
        console.log('- Not using App Password (for Gmail)');
        console.log('- 2-Step Verification not enabled');
        console.log('- Less secure app access disabled');
        return;
    }
    
    // Send test email
    console.log('Sending test email...');
    const testRecipient = process.env.EMAIL_USER; // Send to self for testing
    
    const mailOptions = {
        from: `"${process.env.COMPANY_NAME || 'AI Job Board'}" <${process.env.EMAIL_USER}>`,
        to: testRecipient,
        subject: '✅ Test Email - AI Job Board',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #10b981;">✅ Email Configuration Successful!</h2>
                <p>Your email system is properly configured and working.</p>
                <p><strong>Company:</strong> ${process.env.COMPANY_NAME || 'AI Job Board'}</p>
                <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <hr style="margin: 20px 0;">
                <p style="color: #6b7280; font-size: 14px;">
                    This is a test email from your AI Job Board application.
                </p>
            </div>
        `
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Recipient:', testRecipient);
        console.log('\n📧 Check your inbox at:', testRecipient);
        console.log('\n✅ Email system is ready to use!');
    } catch (error) {
        console.error('❌ Failed to send email:', error.message);
        console.log('\n💡 Error details:', error);
    }
}

testEmail();