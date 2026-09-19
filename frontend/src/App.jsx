import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';

const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const EMICalculatorPage = lazy(() => import('./pages/EMICalculatorPage').then(m => ({ default: m.EMICalculatorPage })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Signup = lazy(() => import('./pages/Signup').then(m => ({ default: m.Signup })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));

const MemberDashboard = lazy(() => import('./pages/MemberDashboard').then(m => ({ default: m.MemberDashboard })));
const MyContributions = lazy(() => import('./pages/MyContributions').then(m => ({ default: m.MyContributions })));
const MyLoans = lazy(() => import('./pages/MyLoans').then(m => ({ default: m.MyLoans })));
const LoanDetails = lazy(() => import('./pages/LoanDetails').then(m => ({ default: m.LoanDetails })));
const LoanRequestPage = lazy(() => import('./pages/LoanRequestPage').then(m => ({ default: m.LoanRequestPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const MemberProfile = lazy(() => import('./pages/MemberProfile').then(m => ({ default: m.MemberProfile })));
const MemberDirectoryPage = lazy(() => import('./pages/MemberDirectoryPage').then(m => ({ default: m.MemberDirectoryPage })));
const MemberDetailViewPage = lazy(() => import('./pages/MemberDetailViewPage').then(m => ({ default: m.MemberDetailViewPage })));
const SubmitEMIPage = lazy(() => import('./pages/SubmitEMIPage').then(m => ({ default: m.SubmitEMIPage })));
const AdminEMISubmissionsPage = lazy(() => import('./pages/AdminEMISubmissionsPage').then(m => ({ default: m.AdminEMISubmissionsPage })));

const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const MembersPage = lazy(() => import('./pages/MembersPage').then(m => ({ default: m.MembersPage })));
const MemberDetailsAdmin = lazy(() => import('./pages/MemberDetailsAdmin').then(m => ({ default: m.MemberDetailsAdmin })));
const AdminContributionsPage = lazy(() => import('./pages/AdminContributionsPage').then(m => ({ default: m.AdminContributionsPage })));
const FundLedgerPage = lazy(() => import('./pages/FundLedgerPage').then(m => ({ default: m.FundLedgerPage })));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage').then(m => ({ default: m.ExpensesPage })));
const RevenuePage = lazy(() => import('./pages/RevenuePage').then(m => ({ default: m.RevenuePage })));
const LoanRequestsAdmin = lazy(() => import('./pages/LoanRequestsAdmin').then(m => ({ default: m.LoanRequestsAdmin })));
const ActiveLoansAdmin = lazy(() => import('./pages/ActiveLoansAdmin').then(m => ({ default: m.ActiveLoansAdmin })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));

const PageFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
    <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-2.5"></div>
    <div className="text-[11px] font-semibold text-gray-400 font-gujarati">લોડ થઈ રહ્યું છે...</div>
  </div>
);

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
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout>
          <Suspense fallback={<PageFallback />}>
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
          </Suspense>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  </LanguageProvider>
  );
}
