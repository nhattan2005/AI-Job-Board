import React from 'react';

const PrivacyPage = () => {
    return (
        <div className="max-w-4xl mx-auto py-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
            
            <div className="prose prose-slate max-w-none space-y-6">
                <p className="text-gray-600 mb-6">
                    <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                </p>
                
                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
                    <p className="text-gray-700 mb-4">
                        We collect information you provide directly to us when you:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                        <li>Create an account (email, name, company details)</li>
                        <li>Upload your CV or resume</li>
                        <li>Apply for jobs through our platform</li>
                        <li>Use our AI-powered features (CV analysis, career path, mock interviews)</li>
                        <li>Contact our support team</li>
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
                    <p className="text-gray-700 mb-4">
                        We use the information we collect to:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                        <li>Provide and improve our job matching services</li>
                        <li>Generate AI-powered career recommendations and CV analysis</li>
                        <li>Match candidates with relevant job opportunities</li>
                        <li>Facilitate communication between employers and candidates</li>
                        <li>Send important updates about your applications and account</li>
                        <li>Improve our AI models and platform features</li>
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Storage and Security</h2>
                    <p className="text-gray-700 mb-4">
                        Your data security is our priority:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                        <li>All CVs and documents are securely stored on Cloudinary</li>
                        <li>Passwords are encrypted using industry-standard hashing (bcrypt)</li>
                        <li>We use JWT tokens for secure authentication</li>
                        <li>Database queries use parameterized statements to prevent SQL injection</li>
                        <li>API communications are encrypted via HTTPS</li>
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">4. AI Processing</h2>
                    <p className="text-gray-700 mb-4">
                        We use Google Gemini AI to analyze CVs and provide career recommendations. 
                        Your data is processed as follows:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                        <li>CV text is temporarily sent to Google Gemini API for analysis</li>
                        <li>Analysis results are stored to improve future recommendations</li>
                        <li>No personally identifiable information is permanently retained by Google</li>
                        <li>You can request deletion of your analysis history at any time</li>
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Sharing Your Information</h2>
                    <p className="text-gray-700 mb-4">
                        We do not sell your personal information. We only share data when:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                        <li>You apply for a job (employer sees your CV and application details)</li>
                        <li>Required by law or legal process</li>
                        <li>Necessary to protect the rights and safety of our users</li>
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
                    <p className="text-gray-700 mb-4">
                        You have the right to:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                        <li>Access your personal data</li>
                        <li>Request correction of inaccurate information</li>
                        <li>Delete your account and associated data</li>
                        <li>Opt-out of marketing communications</li>
                        <li>Download your data in a portable format</li>
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking</h2>
                    <p className="text-gray-700">
                        We use cookies and similar technologies to maintain your session, remember your preferences, 
                        and analyze platform usage. You can control cookie settings through your browser.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to This Policy</h2>
                    <p className="text-gray-700">
                        We may update this Privacy Policy from time to time. We will notify you of significant 
                        changes via email or through a notice on our platform.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
                    <p className="text-gray-700 mb-4">
                        If you have any questions about this Privacy Policy, please contact us:
                    </p>
                    <div className="text-gray-700 space-y-2">
                        <p>📧 Email: <a href="mailto:contact@aijobboard.com" className="text-blue-600 hover:underline">contact@aijobboard.com</a></p>
                        <p>📞 Ho Chi Minh: <a href="tel:+84977460519" className="text-blue-600 hover:underline">(+84) 977 460 519</a></p>
                        <p>📞 Ha Noi: <a href="tel:+84983131351" className="text-blue-600 hover:underline">(+84) 983 131 351</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;