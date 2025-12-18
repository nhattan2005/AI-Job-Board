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
                            <Route path="/career-path" element={<CareerPath />} />
                            
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
                        </Routes>
                    </main>
                </div>
            </AuthProvider>
        </Router>
    );
};

export default App;