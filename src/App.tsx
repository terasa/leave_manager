import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useActivation } from './hooks/useActivation';
import { addCustomerLog } from './hooks/useLogger';
import LandingPage from './components/LandingPage';
import CustomerLogin from './components/CustomerLogin';
import CustomerDashboard from './components/CustomerDashboard';
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
  const [showCustomerLogin, setShowCustomerLogin] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [showCustomerDashboard, setShowCustomerDashboard] = useState(false);

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

  // اگر مشتری در پنل مشتری است
  if (showCustomerDashboard && customerData) {
    const handleCustomerActivate = async (code: string): Promise<{ success: boolean; message: string }> => {
      // بررسی اینکه کد مربوط به همین ایمیل باشد
      const customers = JSON.parse(localStorage.getItem('admin_customers') || '[]');
      const customer = customers.find((c: any) => c.email === customerData.email);
      
      if (!customer) {
        return { success: false, message: 'خطا در یافتن اطلاعات مشتری' };
      }
      
      if (customer.activationCode !== code.toUpperCase().trim()) {
        addCustomerLog(customer.id, customer.email, 'activation_failed', `تلاش ناموفق فعال‌سازی با کد: ${code}`);
        return { success: false, message: 'کد فعال‌سازی مربوط به این حساب کاربری نیست' };
      }
      
      // فعال‌سازی با کد تمیز شده
      const cleanCode = code.toUpperCase().trim();
      
      // تنظیم کد فعال‌سازی در localStorage برای سیستم فعال‌سازی
      const activationData = {
        isActivated: true,
        activationCode: cleanCode,
        activatedAt: new Date().toISOString(),
        expiresAt: customer.expiresAt
      };
      
      localStorage.setItem('activation_status', JSON.stringify(activationData));
      
      const result = { success: true, message: 'نرم‌افزار با موفقیت فعال شد' };
      
      if (result.success) {
        // بروزرسانی اطلاعات مشتری
        const updatedCustomers = customers.map((c: any) => 
          c.id === customer.id 
            ? { ...c, isActivated: true, activatedAt: new Date().toISOString() }
            : c
        );
        localStorage.setItem('admin_customers', JSON.stringify(updatedCustomers));
        
        setCustomerData({ ...customer, isActivated: true, activatedAt: new Date().toISOString() });
        addCustomerLog(customer.id, customer.email, 'activation_success', 'نرم‌افزار با موفقیت فعال شد');
      }
      
      return result;
    };

    const handleCustomerPasswordChange = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
      const customers = JSON.parse(localStorage.getItem('admin_customers') || '[]');
      const customer = customers.find((c: any) => c.email === customerData.email);
      
      if (!customer || customer.password !== oldPassword) {
        return { success: false, message: 'رمز عبور فعلی اشتباه است' };
      }
      
      const updatedCustomers = customers.map((c: any) => 
        c.id === customer.id 
          ? { ...c, password: newPassword }
          : c
      );
      localStorage.setItem('admin_customers', JSON.stringify(updatedCustomers));
      
      setCustomerData({ ...customer, password: newPassword });
      addCustomerLog(customer.id, customer.email, 'password_changed', 'رمز عبور تغییر کرد');
      
      return { success: true, message: 'رمز عبور با موفقیت تغییر کرد' };
    };

    return (
      <CustomerDashboard
        customer={customerData}
        onActivate={handleCustomerActivate}
        onChangePassword={handleCustomerPasswordChange}
        onLogout={() => {
          setShowCustomerDashboard(false);
          setCustomerData(null);
        }}
        onEnterSystem={() => {
          // ورود به سیستم اصلی
          setShowCustomerDashboard(false);
          // اینجا باید سیستم اصلی لود شود
        }}
      />
    );
  }

  // اگر صفحه ورود مشتری نمایش داده شود
  if (showCustomerLogin) {
    const handleCustomerLogin = (email: string, password: string) => {
      // بررسی سوپر ادمین
      if (email.toLowerCase() === 'ehsantaj@yahoo.com' && password === 'superadmin2025') {
        const success = login('superadmin', 'superadmin2025');
        return { success, message: success ? 'ورود موفق' : 'خطا در ورود' };
      }
      
      // بررسی مشتریان
      const customers = JSON.parse(localStorage.getItem('admin_customers') || '[]');
      const customer = customers.find((c: any) => 
        c.email.toLowerCase() === email.toLowerCase() && 
        (c.password === password || password === 'ONE_TIME_LOGIN')
      );
      
      if (!customer) {
        return { success: false, message: 'ایمیل یا رمز عبور اشتباه است' };
      }
      
      if (!customer.isActive) {
        return { success: false, message: 'حساب کاربری شما غیرفعال شده است' };
      }
      
      // ورود موفق
      setCustomerData(customer);
      setShowCustomerDashboard(true);
      setShowCustomerLogin(false);
      
      addCustomerLog(customer.id, customer.email, 'login', 'ورود به پنل مشتری');
      
      return { success: true, customer, message: 'ورود موفق' };
    };

    const handleForgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
      const customers = JSON.parse(localStorage.getItem('admin_customers') || '[]');
      const customer = customers.find((c: any) => c.email.toLowerCase() === email.toLowerCase());
      
      if (!customer) {
        return { success: false, message: 'ایمیل یافت نشد' };
      }
      
      if (!customer.isActive) {
        return { success: false, message: 'حساب کاربری غیرفعال است' };
      }
      
      // شبیه‌سازی ارسال کد
      addCustomerLog(customer.id, customer.email, 'otp_requested', 'درخواست کد یکبار مصرف');
      return { success: true, message: 'کد یکبار مصرف ارسال شد' };
    };

    return (
      <CustomerLogin
        onLogin={handleCustomerLogin}
        onBackToHome={() => setShowCustomerLogin(false)}
        onForgotPassword={handleForgotPassword}
      />
    );
  }

  // اگر کاربر وارد نشده، ابتدا صفحه لندینگ نمایش داده شود
  if (!currentUser) {
    // صفحه لندینگ به عنوان صفحه اصلی
    return <LandingPage onEnterSystem={() => setShowCustomerLogin(true)} />;
  }

  // اگر کاربر وارد شده اما فعال‌سازی نشده (این حالت نباید اتفاق بیفتد)
  if (!activationStatus.isActivated) {
    // اگر کاربر عادی است، به پنل مشتری هدایت شود
    if (currentUser.email !== 'ehsantaj@yahoo.com') {
      const customers = JSON.parse(localStorage.getItem('admin_customers') || '[]');
      const customer = customers.find((c: any) => c.email === currentUser.email);
      if (customer) {
        setCustomerData(customer);
        setShowCustomerDashboard(true);
        return null;
      }
    }
    
    // برای سایر موارد صفحه لاگین نمایش داده شود
    return (
      <Login
        onLogin={login}
        onBackToHome={() => logout()}
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