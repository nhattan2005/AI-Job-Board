import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Import đầy đủ các Pages & Components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';   // 👈 THÊM
import ResetPasswordPage from './pages/ResetPasswordPage';     // 👈 THÊM
import JobList from './components/JobList';
import JobDetail from './components/JobDetail';
import JobForm from './components/JobForm';
import EmployerDashboard from './pages/EmployerDashboard';
import EmployerApplications from './pages/EmployerApplications';
import AllApplications from './pages/AllApplications';
import MyApplications from './pages/MyApplications';
import InterviewSchedulePage from './pages/InterviewSchedulePage';
import MyInterviews from './pages/MyInterviews';
import CareerPath from './pages/CareerPath'; // 👈 QUAN TRỌNG
import ProfilePage from './pages/ProfilePage';
import MyCareerRoadmap from './pages/MyCareerRoadmap';
import InterviewRoom from './pages/InterviewRoom';
import InterviewFeedback from './pages/InterviewFeedback';
import VerifyEmailPage from './pages/VerifyEmailPage';
import EmailVerifiedPage from './pages/EmailVerifiedPage';
import VerifyEmailSentPage from './pages/VerifyEmailSentPage';
import MyFollowing from './pages/MyFollowing';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminJobs from './pages/AdminJobs';
import AdminBanners from './pages/AdminBanners'; // 👈 IMPORT
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import MyFavorites from './pages/MyFavorites'; // 👈 THÊM IMPORT
import PracticeInterviewSetup from './pages/PracticeInterviewSetup'; // 👈 THÊM
import PracticeInterviewRoom from './pages/PracticeInterviewRoom'; // 👈 THÊM
import NotificationsPage from './pages/NotificationsPage'; // 👈 ĐẢM BẢO DÒNG NÀY TỒN TẠI
import EmployerPublicProfile from './pages/EmployerPublicProfile'; // 👈 THÊM
import AdminManagement from './pages/AdminManagement'; // 👈 THÊM IMPORT

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <div className="min-h-screen bg-slate-50 flex flex-col">
                    <Navigation />
                    <main className="flex-grow pt-16">
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<JobList />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/jobs/:id" element={<JobDetail />} />
                            <Route path="/verify-email" element={<VerifyEmailPage />} />
                            <Route path="/verify-email-sent" element={<VerifyEmailSentPage />} />
                            <Route path="/email-verified" element={<EmailVerifiedPage />} />
                            
                            {/* 👇 THÊM 2 ROUTES MỚI */}
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                            {/* 👇 THÊM ROUTE NÀY - QUAN TRỌNG! */}
                            <Route 
                                path="/career-path" 
                                element={
                                    <ProtectedRoute requiredRole="candidate">
                                        <CareerPath />
                                    </ProtectedRoute>
                                } 
                            />

                            {/* 👇 THÊM ROUTE MY FAVORITES */}
                            <Route 
                                path="/my-favorites" 
                                element={
                                    <ProtectedRoute requiredRole="candidate">
                                        <MyFavorites />
                                    </ProtectedRoute>
                                } 
                            />

                            {/* 👇 THÊM PRACTICE INTERVIEW ROUTES */}
                            <Route 
                                path="/practice-interview" 
                                element={
                                    <ProtectedRoute requiredRole="candidate">
                                        <PracticeInterviewSetup />
                                    </ProtectedRoute>
                                } 
                            />

                            <Route 
                                path="/practice-interview/room/:sessionId" 
                                element={
                                    <ProtectedRoute requiredRole="candidate">
                                        <PracticeInterviewRoom />
                                    </ProtectedRoute>
                                } 
                            />

                            {/* 👇 SỬA: Route đúng cho trang xếp lịch phỏng vấn */}
                            <Route 
                                path="/interview/schedule/:applicationId" 
                                element={
                                    <ProtectedRoute requiredRole="candidate">
                                        <InterviewSchedulePage />
                                    </ProtectedRoute>
                                } 
                            />

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

                            {/* Candidate Routes */}
                            <Route 
                                path="/profile" 
                                element={
                                    <ProtectedRoute>
                                        <ProfilePage />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/my-applications" 
                                element={
                                    <ProtectedRoute requiredRole="candidate">
                                        <MyApplications />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/my-favorites" 
                                element={
                                    <ProtectedRoute requiredRole="candidate">
                                        <MyFavorites />
                                    </ProtectedRoute>
                                } 
                            />
                            
                            {/* 👇 THÊM ROUTE MỚI */}
                            <Route 
                                path="/notifications" 
                                element={
                                    <ProtectedRoute>
                                        <NotificationsPage />
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

                            {/* Admin Routes */}
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
                            <Route 
                                path="/admin/banners" 
                                element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminBanners />
                                    </ProtectedRoute>
                                } 
                            />
                            
                            {/* 👇 THÊM ROUTE MỚI */}
                            <Route 
                                path="/admin/admins" 
                                element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminManagement />
                                    </ProtectedRoute>
                                } 
                            />

                            <Route path="/privacy-policy" element={<PrivacyPage />} />
                            <Route path="/terms-of-service" element={<TermsPage />} />

                            {/* 👇 THÊM ROUTE MỚI */}
                            <Route path="/employer/:employerId" element={<EmployerPublicProfile />} />

                            {/* 👇 THÊM ROUTE MY FOLLOWING */}
                            <Route 
                                path="/my-following" 
                                element={
                                    <ProtectedRoute requiredRole="candidate">
                                        <MyFollowing />
                                    </ProtectedRoute>
                                } 
                            />

                            {/* 404 Page */}
                            <Route path="*" element={<h1>404 Not Found</h1>} />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </AuthProvider>
        </Router>
    );
};

export default App;