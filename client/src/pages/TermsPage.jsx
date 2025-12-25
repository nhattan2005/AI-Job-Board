import React from 'react';

const TermsPage = () => {
    return (
        <div className="max-w-4xl mx-auto py-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
            
            <div className="prose prose-slate max-w-none space-y-6">
                <p className="text-gray-600 mb-6">
                    <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                </p>
                
                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                    <p className="text-gray-700">
                        By accessing and using AI Job Board ("the Service"), you accept and agree to be bound 
                        by these Terms of Service. If you do not agree to these terms, please do not use the Service.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">2. User Accounts</h2>
                    <p className="text-gray-700 mb-4">
                        <strong>For Candidates:</strong>
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                        <li>You must provide accurate and complete information</li>
                        <li>You are responsible for maintaining the confidentiality of your password</li>
                        <li>You must verify your email address before using the platform</li>
                        <li>One person may only create one account</li>
                    </ul>
                    <p className="text-gray-700 mb-4">
                        <strong>For Employers:</strong>
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                        <li>You must represent a legitimate business or organization</li>
                        <li>Job postings must be genuine and comply with employment laws</li>
                        <li>You are responsible for all content posted under your account</li>
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Use of AI Services</h2>
                    <p className="text-gray-700 mb-4">
                        Our platform uses AI-powered features including:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                        <li>CV matching and scoring</li>
                        <li>Career path recommendations</li>
                        <li>Mock interview simulations</li>
                        <li>CV tailoring suggestions</li>
                    </ul>
                    <p className="text-gray-700 mt-4">
                        <strong>Important:</strong> AI recommendations are advisory only. Final hiring decisions 
                        are made by employers, and career decisions are your responsibility.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Prohibited Activities</h2>
                    <p className="text-gray-700 mb-4">
                        You agree NOT to:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                        <li>Post false or misleading job listings</li>
                        <li>Upload fraudulent or falsified CVs</li>
                        <li>Use automated tools (bots) to scrape data</li>
                        <li>Harass or discriminate against other users</li>
                        <li>Share your account credentials with others</li>
                        <li>Reverse engineer or attempt to access our AI models</li>
                        <li>Spam or send unsolicited messages</li>
                        <li>Violate any applicable laws or regulations</li>
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Content Ownership</h2>
                    <p className="text-gray-700 mb-4">
                        <strong>Your Content:</strong> You retain ownership of content you submit (CVs, job postings, etc.)
                    </p>
                    <p className="text-gray-700 mb-4">
                        <strong>License to Us:</strong> By uploading content, you grant us a non-exclusive license to:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                        <li>Store and process your content</li>
                        <li>Use your CV for AI matching and analysis</li>
                        <li>Display your job postings to candidates</li>
                        <li>Improve our AI models (anonymized data only)</li>
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Payment and Refunds</h2>
                    <p className="text-gray-700">
                        Currently, basic job posting and application services are free. Premium features 
                        (if introduced) will have clear pricing. Refund policies will be specified at the 
                        time of purchase.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Disclaimer of Warranties</h2>
                    <p className="text-gray-700 mb-4">
                        The Service is provided "AS IS" without warranties of any kind. We do not guarantee:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                        <li>Job placement or interview success</li>
                        <li>Accuracy of AI recommendations (though we strive for high quality)</li>
                        <li>Availability of specific jobs or candidates</li>
                        <li>Uninterrupted or error-free service</li>
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
                    <p className="text-gray-700">
                        We are not liable for indirect, incidental, or consequential damages arising from 
                        your use of the Service, including but not limited to lost employment opportunities 
                        or hiring mistakes.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Account Termination</h2>
                    <p className="text-gray-700 mb-4">
                        We may suspend or terminate your account if:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                        <li>You violate these Terms of Service</li>
                        <li>You engage in fraudulent activity</li>
                        <li>You fail to verify your email</li>
                        <li>Your account has been inactive for an extended period</li>
                    </ul>
                    <p className="text-gray-700 mt-4">
                        You may delete your account at any time from your profile settings.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
                    <p className="text-gray-700">
                        We reserve the right to modify these Terms at any time. Significant changes will be 
                        communicated via email or platform notification. Continued use after changes constitutes 
                        acceptance of the new Terms.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
                    <p className="text-gray-700 mb-4">
                        For questions about these Terms, please contact:
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

export default TermsPage;