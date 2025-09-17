import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeManagement from './components/EmployeeManagement';
import LeaveManagement from './components/LeaveManagement';
import Reports from './components/Reports';
import Settings from './components/Settings';
import SystemLogs from './components/SystemLogs';

function App() {
  const { currentUser, loading, login, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Login
        onLogin={login}
      />
    );
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
      case 'settings':
        return <Settings />;
      case 'logs':
        return <SystemLogs />;
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