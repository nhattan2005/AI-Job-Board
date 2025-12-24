import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';

// Import đầy đủ các Pages & Components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JobList from './components/JobList';
import JobDetail from './components/JobDetail';
import JobForm from './components/JobForm';
import EmployerDashboard from './pages/EmployerDashboard';
import EmployerApplications from './pages/EmployerApplications';
import AllApplications from './pages/AllApplications';
import MyApplications from './pages/MyApplications';
import InterviewSchedulePage from './pages/InterviewSchedulePage';
import MyInterviews from './pages/MyInterviews';
import CareerPath from './pages/CareerPath'; // <-- Đảm bảo dòng này tồn tại
import ProfilePage from './pages/ProfilePage'; // <-- Đảm bảo dòng này tồn tại
import MyCareerRoadmap from './pages/MyCareerRoadmap'; // Import trang mới
import InterviewRoom from './pages/InterviewRoom'; // Import trang mới
import InterviewFeedback from './pages/InterviewFeedback'; // THÊM IMPORT
import VerifyEmailPage from './pages/VerifyEmailPage'; // THÊM
import EmailVerifiedPage from './pages/EmailVerifiedPage'; // THÊM
import VerifyEmailSentPage from './pages/VerifyEmailSentPage';
import AdminDashboard from './pages/AdminDashboard'; // 👈 THÊM
import AdminUsers from './pages/AdminUsers'; // 👈 THÊM
import AdminJobs from './pages/AdminJobs'; // 👈 THÊM

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <div className="min-h-screen bg-slate-50"> {/* Đổi bg-gray-50 thành bg-slate-50 cho đẹp */}
                    <Navigation />
                    <main className="container mx-auto p-6">
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<JobList />} />
                            <Route path="/jobs/:id" element={<JobDetail />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            
                            {/* Email Verification Routes */}
                            <Route path="/verify-email" element={<VerifyEmailPage />} />
                            <Route path="/verify-email-sent" element={<VerifyEmailSentPage />} />
                            <Route path="/verify-email/:token" element={<EmailVerifiedPage />} />

                            {/* 👇 1. THÊM ROUTE CHO CANDIDATE SCHEDULE (QUAN TRỌNG) */}
                            <Route 
                                path="/interview/schedule/:applicationId" 
                                element={
                                    <ProtectedRoute requiredRole="candidate">
                                        <InterviewSchedulePage />
                                    </ProtectedRoute>
                                } 
                            />

                            {/* 👇 2. SỬA ROUTE AI INTERVIEW: Đổi từ /interview/... thành /ai-interview/... */}
                            <Route 
                                path="/ai-interview/:jobId/:type" 
                                element={
                                    <ProtectedRoute requiredRole="candidate">
                                        <InterviewRoom />
                                    </ProtectedRoute>
                                } 
                            />
                            
                            <Route 
                                path="/interview/feedback/:sessionId" 
                                element={
                                    <ProtectedRoute requiredRole="candidate">
                                        <InterviewFeedback />
                                    </ProtectedRoute>
                                } 
                            />

                            {/* Protected Routes */}
                            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                            
                            <Route 
                                path="/my-applications" 
                                element={
                                    <ProtectedRoute requiredRole="candidate">
                                        <MyApplications />
                                    </ProtectedRoute>
                                } 
                            />
                            
                            <Route 
                                path="/my-interviews" 
                                element={
                                    <ProtectedRoute>
                                        <MyInterviews />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/my-roadmap" 
                                element={
                                    <ProtectedRoute requiredRole="candidate">
                                        <MyCareerRoadmap />
                                    </ProtectedRoute>
                                } 
                            />

                            {/* Employer Routes */}
                            <Route 
                                path="/employer/dashboard" 
                                element={
                                    <ProtectedRoute requiredRole="employer">
                                        <EmployerDashboard />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/employer/post-job" 
                                element={
                                    <ProtectedRoute requiredRole="employer">
                                        <JobForm />
                                    </ProtectedRoute>
                                } 
                            />
                            {/* 👇 THÊM ROUTE NÀY */}
                            <Route 
                                path="/employer/edit-job/:id" 
                                element={
                                    <ProtectedRoute requiredRole="employer">
                                        <JobForm />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/employer/jobs/:jobId/applications" 
                                element={
                                    <ProtectedRoute requiredRole="employer">
                                        <EmployerApplications />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/employer/all-applications" 
                                element={
                                    <ProtectedRoute requiredRole="employer">
                                        <AllApplications />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/employer/jobs/:jobId/applications/:applicationId/schedule-interview" 
                                element={
                                    <ProtectedRoute requiredRole="employer">
                                        <InterviewSchedulePage />
                                    </ProtectedRoute>
                                } 
                            />

                            {/* Mock Interview Room & Feedback */}
                            <Route path="/interview-room/:sessionId" element={
                                <ProtectedRoute requiredRole="candidate">
                                    <InterviewRoom />
                                </ProtectedRoute>
                            } />
                            <Route path="/interview-feedback/:sessionId" element={
                                <ProtectedRoute requiredRole="candidate">
                                    <InterviewFeedback />
                                </ProtectedRoute>
                            } />

                            {/* 👇 THÊM ADMIN ROUTES */}
                            <Route 
                                path="/admin/dashboard" 
                                element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminDashboard />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/admin/users" 
                                element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminUsers />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/admin/jobs" 
                                element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminJobs />
                                    </ProtectedRoute>
                                } 
                            />

                            {/* 404 Page */}
                            <Route path="*" element={<h1>404 Not Found</h1>} />
                        </Routes>
                    </main>
                </div>
            </AuthProvider>
        </Router>
    );
};

export default App;