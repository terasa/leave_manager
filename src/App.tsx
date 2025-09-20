import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useActivation } from './hooks/useActivation';
import LandingPage from './components/LandingPage';
import ActivationPage from './components/ActivationPage';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeManagement from './components/EmployeeManagement';
import LeaveManagement from './components/LeaveManagement';
import Reports from './components/Reports';
import Settings from './components/Settings';
import SystemLogs from './components/SystemLogs';
import Backup from './components/Backup';
import About from './components/About';
import AdminPanel from './components/AdminPanel';

function App() {
  const { currentUser, loading, login, logout } = useAuth();
  const { activationStatus, loading: activationLoading } = useActivation();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showSystemLogin, setShowSystemLogin] = useState(false);

  if (loading || activationLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // بررسی دسترسی مدیر کل (Super Admin)
  const isSuperAdmin = currentUser?.email === 'ehsantaj@yahoo.com' || 
                      activationStatus.activationCode === 'SUPER-ADMIN-2025';

  // اگر مدیر کل است، پنل مدیریت نمایش داده شود
  if (isSuperAdmin && currentUser) {
    return <AdminPanel onLogout={logout} />;
  }

  // اگر فعال‌سازی نشده، صفحه فعال‌سازی نمایش داده شود
  if (!activationStatus.isActivated) {
    return <ActivationPage />;
  }

  // اگر کاربر وارد نشده، صفحه لندینگ نمایش داده شود
  if (!currentUser) {
    if (showSystemLogin) {
      return (
        <Login
          onLogin={login}
          onBackToHome={() => setShowSystemLogin(false)}
        />
      );
    }
    return <LandingPage onEnterSystem={() => setShowSystemLogin(true)} />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'employees':
        return <EmployeeManagement />;
      case 'leaves':
        return <LeaveManagement />;
      case 'reports':
        return <Reports />;
      case 'backup':
        return <Backup />;
      case 'settings':
        return <Settings />;
      case 'logs':
        return <SystemLogs />;
      case 'about':
        return <About />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={logout}
      currentUser={currentUser}
    >
      {renderCurrentPage()}
    </Layout>
  );
}

export default App;