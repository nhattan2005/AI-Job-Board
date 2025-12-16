import React from 'react';
import ProfilePage from './pages/ProfilePage';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
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

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    
                    <main className="container mx-auto p-6">
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            
                            {/* Candidate Routes */}
                            <Route path="/" element={<JobList />} />
                            <Route path="/jobs/:id" element={<JobDetail />} />
                            <Route 
                                path="/my-applications" 
                                element={
                                    <ProtectedRoute requiredRole="candidate">
                                        <MyApplications />
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

                            {/* Interview Routes */}
                            <Route 
                                path="/interview/schedule/:applicationId" 
                                element={
                                    <ProtectedRoute requiredRole="candidate">
                                        <InterviewSchedulePage />
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
                            
                            {/* Profile Route */}
                            <Route 
                                path="/profile" 
                                element={
                                    <ProtectedRoute>
                                        <ProfilePage />
                                    </ProtectedRoute>
                                } 
                            />

                            {/* 404 */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </div>
            </AuthProvider>
        </Router>
    );
};

export default App;