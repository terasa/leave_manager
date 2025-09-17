import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Home,
  FileText
} from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  currentUser: User;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, onLogout, currentUser }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'داشبورد', icon: Home },
    { id: 'employees', label: 'مدیریت کارمندان', icon: Users },
    { id: 'leaves', label: 'ثبت مرخصی', icon: Calendar },
    { id: 'reports', label: 'گزارش‌گیری', icon: BarChart3 },
    ...(currentUser.role === 'admin' ? [
      { id: 'settings', label: 'تنظیمات', icon: Settings },
      { id: 'logs', label: 'لاگ سیستم', icon: FileText }
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row" style={{ direction: 'rtl' }}>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-col`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-lg lg:text-xl font-bold text-gray-900">سیستم مدیریت مرخصی</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-6 py-3 text-right hover:bg-gray-50 transition-colors ${
                  currentPage === item.id ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 ml-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 w-full p-6 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 ml-3" />
            خروج از سیستم
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:mr-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center">
              <div className="flex items-center gap-3 ml-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{currentUser.username}</div>
                  <div className="text-gray-500">{currentUser.role === 'admin' ? 'مدیر' : 'کاربر'}</div>
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {menuItems.find(item => item.id === currentPage)?.label || 'داشبورد'}
              </h2>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-auto">
          {children}
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;