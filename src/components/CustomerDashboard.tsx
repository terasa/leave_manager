import React, { useState } from 'react';
import { 
  User, 
  Calendar, 
  Shield, 
  Key, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Eye,
  EyeOff,
  Mail,
  CreditCard,
  Settings,
  LogOut
} from 'lucide-react';
import { englishToPersianNumbers, formatPersianDate, formatPersianDateTime } from '../utils/dateHelpers';

interface CustomerDashboardProps {
  customer: any;
  onActivate: (code: string) => Promise<{ success: boolean; message: string }>;
  onChangePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  onLogout: () => void;
  onEnterSystem: () => void;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ 
  customer, 
  onActivate, 
  onChangePassword, 
  onLogout,
  onEnterSystem 
}) => {
  const [activeTab, setActiveTab] = useState<'activation' | 'account' | 'settings'>('activation');
  const [activationCode, setActivationCode] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activationCode.trim()) {
      showMessage('لطفاً کد فعال‌سازی را وارد کنید', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const result = await onActivate(activationCode);
      showMessage(result.message, result.success ? 'success' : 'error');
      
      if (result.success) {
        setActivationCode('');
        setTimeout(() => {
          onEnterSystem();
        }, 2000);
      }
    } catch (error) {
      showMessage('خطا در فعال‌سازی', 'error');
    }
    
    setLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 4) {
      showMessage('رمز عبور جدید باید حداقل ۴ کاراکتر باشد', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('رمز عبور جدید و تکرار آن یکسان نیستند', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const result = await onChangePassword(oldPassword, newPassword);
      showMessage(result.message, result.success ? 'success' : 'error');
      
      if (result.success) {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      showMessage('خطا در تغییر رمز عبور', 'error');
    }
    
    setLoading(false);
  };

  const formatActivationCode = (code: string) => {
    const cleanCode = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const formatted = cleanCode.match(/.{1,4}/g)?.join('-') || cleanCode;
    return formatted;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatActivationCode(e.target.value);
    setActivationCode(formatted);
  };

  const isActivated = customer.isActivated;
  const isExpired = customer.expiresAt && new Date(customer.expiresAt) < new Date();
  const daysRemaining = customer.expiresAt ? 
    Math.max(0, Math.ceil((new Date(customer.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 
    null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Shield className="h-8 w-8 text-blue-600 ml-2" />
                <span className="text-xl font-bold text-gray-900">پنل مشتری</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="text-sm">
                <div className="font-medium text-gray-900">{customer.name}</div>
                <div className="text-gray-500">{customer.email}</div>
              </div>
              <button
                onClick={onLogout}
                className="text-red-600 hover:text-red-800 p-2 rounded-md"
                title="خروج"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <div className={`mb-8 p-6 rounded-xl shadow-sm border ${
          isActivated && !isExpired 
            ? 'bg-green-50 border-green-200' 
            : isExpired 
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${
              isActivated && !isExpired 
                ? 'bg-green-100' 
                : isExpired 
                ? 'bg-red-100'
                : 'bg-yellow-100'
            }`}>
              {isActivated && !isExpired ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : isExpired ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <Clock className="w-8 h-8 text-yellow-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold ${
                isActivated && !isExpired 
                  ? 'text-green-800' 
                  : isExpired 
                  ? 'text-red-800'
                  : 'text-yellow-800'
              }`}>
                {isActivated && !isExpired 
                  ? 'نرم‌افزار فعال است' 
                  : isExpired 
                  ? 'نرم‌افزار منقضی شده'
                  : 'نرم‌افزار غیرفعال'
                }
              </h3>
              <p className={`text-sm mt-1 ${
                isActivated && !isExpired 
                  ? 'text-green-700' 
                  : isExpired 
                  ? 'text-red-700'
                  : 'text-yellow-700'
              }`}>
                {isActivated && !isExpired 
                  ? `${daysRemaining !== null ? `${englishToPersianNumbers(daysRemaining.toString())} روز تا انقضا` : 'بدون محدودیت زمانی'}` 
                  : isExpired 
                  ? 'برای تمدید با پشتیبانی تماس بگیرید'
                  : 'برای استفاده از نرم‌افزار، کد فعال‌سازی را وارد کنید'
                }
              </p>
            </div>
            {isActivated && !isExpired && (
              <button
                onClick={onEnterSystem}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                ورود به سیستم
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('activation')}
                className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'activation'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Key className="w-5 h-5 inline ml-2" />
                فعال‌سازی
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'account'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User className="w-5 h-5 inline ml-2" />
                اطلاعات حساب
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Settings className="w-5 h-5 inline ml-2" />
                تنظیمات
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'activation' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">فعال‌سازی نرم‌افزار</h3>
                  
                  {isActivated ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800">وضعیت فعال‌سازی</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                          <div className="flex justify-between">
                            <span>نوع مجوز:</span>
                            <span className="font-medium">{customer.licenseType}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>کد فعال‌سازی:</span>
                            <span className="font-mono text-xs">{customer.activationCode}</span>
                          </div>
                          
                          {customer.activatedAt && (
                            <div className="flex justify-between">
                              <span>تاریخ فعال‌سازی:</span>
                              <span>{formatPersianDate(new Date(customer.activatedAt))}</span>
                            </div>
                          )}
                          
                          {customer.expiresAt && (
                            <div className="flex justify-between">
                              <span>تاریخ انقضا:</span>
                              <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                                {formatPersianDate(new Date(customer.expiresAt))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isExpired && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <span className="font-medium text-red-800">مجوز منقضی شده</span>
                          </div>
                          <p className="text-red-700 text-sm">
                            برای تمدید مجوز و دریافت کد فعال‌سازی جدید با پشتیبانی تماس بگیرید.
                          </p>
                          <div className="mt-3">
                            <a
                              href="mailto:ehsantaj@yahoo.com"
                              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <Mail className="w-4 h-4" />
                              ehsantaj@yahoo.com
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleActivation} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          کد فعال‌سازی
                        </label>
                        <div className="relative">
                          <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={activationCode}
                            onChange={handleCodeChange}
                            className="block w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-center"
                            placeholder="HESA-ADMIN-2025-ABC123"
                            maxLength={50}
                            style={{ direction: 'ltr' }}
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          کد فعال‌سازی مربوط به ایمیل {customer.email} را وارد کنید
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            در حال فعال‌سازی...
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5" />
                            فعال‌سازی نرم‌افزار
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">اطلاعات حساب کاربری</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">نام</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900">
                          {customer.name}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900">
                          {customer.email}
                        </div>
                      </div>
                      
                      {customer.organization && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">سازمان</label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900">
                            {customer.organization}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ عضویت</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900">
                          {formatPersianDate(new Date(customer.createdAt))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت حساب</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {customer.isActive ? 'فعال' : 'غیرفعال'}
                          </span>
                        </div>
                      </div>
                      
                      {customer.phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">تلفن</label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900">
                            {customer.phone}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">تغییر رمز عبور</h3>
                  
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رمز عبور فعلی
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? "text" : "password"}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رمز عبور جدید
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تکرار رمز عبور جدید
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          style={{ direction: 'ltr', textAlign: 'left' }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          در حال تغییر...
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          تغییر رمز عبور
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mt-4 rounded-lg p-4 flex items-center gap-3 ${
            messageType === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <p className={messageType === 'success' ? 'text-green-600' : 'text-red-600'}>
              {message}
            </p>
          </div>
        )}

        {/* Contact Info */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">پشتیبانی و تماس</h4>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                برای پشتیبانی، تمدید مجوز یا سوالات فنی:
              </p>
              <a
                href="mailto:ehsantaj@yahoo.com"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <Mail className="w-4 h-4" />
                ehsantaj@yahoo.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;