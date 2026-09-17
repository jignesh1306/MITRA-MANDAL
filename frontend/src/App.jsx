import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';

import { Home } from './pages/Home';
import { EMICalculatorPage } from './pages/EMICalculatorPage';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';

import { MemberDashboard } from './pages/MemberDashboard';
import { MyContributions } from './pages/MyContributions';
import { MyLoans } from './pages/MyLoans';
import { LoanDetails } from './pages/LoanDetails';
import { LoanRequestPage } from './pages/LoanRequestPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { MemberProfile } from './pages/MemberProfile';
import { MemberDirectoryPage } from './pages/MemberDirectoryPage';
import { MemberDetailViewPage } from './pages/MemberDetailViewPage';
import { SubmitEMIPage } from './pages/SubmitEMIPage';
import { AdminEMISubmissionsPage } from './pages/AdminEMISubmissionsPage';

import { AdminDashboard } from './pages/AdminDashboard';
import { MembersPage } from './pages/MembersPage';
import { MemberDetailsAdmin } from './pages/MemberDetailsAdmin';
import { AdminContributionsPage } from './pages/AdminContributionsPage';
import { FundLedgerPage } from './pages/FundLedgerPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { RevenuePage } from './pages/RevenuePage';
import { LoanRequestsAdmin } from './pages/LoanRequestsAdmin';
import { ActiveLoansAdmin } from './pages/ActiveLoansAdmin';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-3"></div>
        <div className="text-xs font-semibold text-gray-500 font-gujarati">લોડ થઈ રહ્યું છે...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/member'} replace />;
  }
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-3"></div>
        <div className="text-xs font-semibold text-gray-500 font-gujarati">લોડ થઈ રહ્યું છે...</div>
      </div>
    );
  }
  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/member'} replace />;
  }
  return children;
};

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 ${user ? 'pb-16 md:pb-0' : 'pb-0'}`}>
      <Navbar />
      <div className="flex flex-1">
        {user && <Sidebar />}
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <PublicOnlyRoute>
                <Home />
              </PublicOnlyRoute>
            } />
            <Route path="/calculator" element={<EMICalculatorPage />} />
            <Route path="/login" element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            } />
            <Route path="/signup" element={
              <PublicOnlyRoute>
                <Signup />
              </PublicOnlyRoute>
            } />
            <Route path="/forgot-password" element={
              <PublicOnlyRoute>
                <ForgotPassword />
              </PublicOnlyRoute>
            } />

            {/* Member Routes */}
            <Route path="/member" element={
              <ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <MemberDashboard />
              </ProtectedRoute>
            } />
            <Route path="/member/contributions" element={
              <ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <MyContributions />
              </ProtectedRoute>
            } />
            <Route path="/member/loans" element={
              <ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <MyLoans />
              </ProtectedRoute>
            } />
            <Route path="/member/loans/request" element={
              <ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <LoanRequestPage />
              </ProtectedRoute>
            } />
            <Route path="/member/loans/:id" element={
              <ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <LoanDetails />
              </ProtectedRoute>
            } />
            <Route path="/member/notifications" element={
              <ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            <Route path="/member/profile" element={
              <ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <MemberProfile />
              </ProtectedRoute>
            } />
            <Route path="/member/directory" element={
              <ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <MemberDirectoryPage />
              </ProtectedRoute>
            } />
            <Route path="/member/directory/:id" element={
              <ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <MemberDetailViewPage />
              </ProtectedRoute>
            } />
            <Route path="/member/submit-emi" element={
              <ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <SubmitEMIPage />
              </ProtectedRoute>
            } />
            <Route path="/member/reports" element={
              <ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <ReportsPage />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/notifications" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/emi-submissions" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminEMISubmissionsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/members" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <MembersPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/members/:id" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <MemberDetailsAdmin />
              </ProtectedRoute>
            } />
            <Route path="/admin/contributions" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminContributionsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/fund" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <FundLedgerPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/expenses" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ExpensesPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/revenue" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <RevenuePage />
              </ProtectedRoute>
            } />
            <Route path="/admin/loan-requests" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <LoanRequestsAdmin />
              </ProtectedRoute>
            } />
            <Route path="/admin/loans" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ActiveLoansAdmin />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ReportsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/audit-logs" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AuditLogsPage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}
