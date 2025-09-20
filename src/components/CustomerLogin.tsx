import React, { useState } from 'react';
import { Lock, User, Shield, Mail, Eye, EyeOff, Key, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { englishToPersianNumbers, formatPersianDateTime } from '../utils/dateHelpers';
import { supabase } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { addCustomerLog } from '../hooks/useLogger';

interface CustomerLoginProps {
  onLogin: (email: string, password: string) => { success: boolean; customer?: any; message?: string };
  onBackToHome?: () => void;
  onForgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

const CustomerLogin: React.FC<CustomerLoginProps> = ({ onLogin, onBackToHome, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [oneTimeCode, setOneTimeCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOneTimeLogin, setShowOneTimeLogin] = useState(false);
  const [oneTimeCodeSent, setOneTimeCodeSent] = useState(false);
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = onLogin(email, password);
      if (result.success) {
        setSuccess('ورود موفق');
      } else {
        setError(result.message || 'خطا در ورود');
      }
    } catch (error) {
      setError('خطا در ارتباط با سرور');
    }
    
    setLoading(false);
  };

  const handleOneTimeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // بررسی انقضای کد
      if (codeExpiry && new Date() > codeExpiry) {
        setError('کد یکبار مصرف منقضی شده است');
        setOneTimeCodeSent(false);
        setCodeExpiry(null);
        setLoading(false);
        return;
      }

      // شبیه‌سازی بررسی کد یکبار مصرف
      const savedCode = localStorage.getItem(`otp_${email}`);
      const savedExpiry = localStorage.getItem(`otp_expiry_${email}`);
      
      if (!savedCode || !savedExpiry || new Date() > new Date(savedExpiry)) {
        setError('کد یکبار مصرف نامعتبر یا منقضی شده است');
        setLoading(false);
        return;
      }

      if (oneTimeCode === savedCode) {
        // حذف کد استفاده شده
        localStorage.removeItem(`otp_${email}`);
        localStorage.removeItem(`otp_expiry_${email}`);
        
        // ورود با کد یکبار مصرف
        const result = onLogin(email, 'ONE_TIME_LOGIN');
        if (result.success) {
          setSuccess('ورود موفق با کد یکبار مصرف');
        } else {
          setError('خطا در ورود');
        }
      } else {
        setError('کد یکبار مصرف اشتباه است');
      }
    } catch (error) {
      setError('خطا در بررسی کد');
    }
    
    setLoading(false);
  };

  const handleSendOneTimeCode = async () => {
    if (!email) {
      setError('لطفاً ابتدا ایمیل خود را وارد کنید');
      return;
    }

    setLoading(true);
    try {
      const result = await onForgotPassword(email);
      if (result.success) {
        // تولید کد یکبار مصرف (در حالت واقعی از سرور دریافت می‌شود)
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 دقیقه
        
        localStorage.setItem(`otp_${email}`, code);
        localStorage.setItem(`otp_expiry_${email}`, expiry.toISOString());
        
        setCodeExpiry(expiry);
        setOneTimeCodeSent(true);
        setSuccess(`کد یکبار مصرف به ایمیل شما ارسال شد: ${code} (شبیه‌سازی)`);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('خطا در ارسال کد');
    }
    setLoading(false);
  };

  const getRemainingTime = () => {
    if (!codeExpiry) return '';
    const now = new Date();
    const diff = codeExpiry.getTime() - now.getTime();
    if (diff <= 0) return 'منقضی شده';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${englishToPersianNumbers(minutes.toString())}:${englishToPersianNumbers(seconds.toString().padStart(2, '0'))}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center px-4" style={{ direction: 'rtl' }}>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              ورود به حساب کاربری
            </h2>
            <p className="text-gray-600 mt-2">
              برای دسترسی به سیستم مدیریت مرخصی وارد شوید
            </p>
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="text-blue-600 hover:text-blue-800 text-sm mt-2"
              >
                ← بازگشت به صفحه اصلی
              </button>
            )}
          </div>

          {/* Login Tabs */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setShowOneTimeLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !showOneTimeLogin 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              ورود با رمز عبور
            </button>
            <button
              onClick={() => setShowOneTimeLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                showOneTimeLogin 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              ورود با کد یکبار مصرف
            </button>
          </div>

          {!showOneTimeLogin ? (
            /* Regular Login Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ایمیل
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="ایمیل خود را وارد کنید"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رمز عبور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pr-10 pl-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="رمز عبور خود را وارد کنید"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    در حال ورود...
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    ورود به سیستم
                  </>
                )}
              </button>
            </form>
          ) : (
            /* One-Time Code Login Form */
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ایمیل
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="ایمیل خود را وارد کنید"
                    required
                  />
                </div>
              </div>

              {!oneTimeCodeSent ? (
                <button
                  onClick={handleSendOneTimeCode}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      در حال ارسال...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      ارسال کد یکبار مصرف
                    </>
                  )}
                </button>
              ) : (
                <form onSubmit={handleOneTimeLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      کد یکبار مصرف
                    </label>
                    <div className="relative">
                      <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={oneTimeCode}
                        onChange={(e) => setOneTimeCode(e.target.value)}
                        className="block w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-center font-mono"
                        placeholder="کد ۶ رقمی را وارد کنید"
                        maxLength={6}
                        style={{ direction: 'ltr' }}
                        required
                      />
                    </div>
                    {codeExpiry && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        زمان باقی‌مانده: {getRemainingTime()}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        در حال بررسی...
                      </>
                    ) : (
                      <>
                        <Key className="w-5 h-5" />
                        ورود با کد یکبار مصرف
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOneTimeCodeSent(false);
                      setCodeExpiry(null);
                      setOneTimeCode('');
                    }}
                    className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    ارسال مجدد کد
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="mt-4 rounded-lg p-4 flex items-center gap-3 bg-red-50 border border-red-200">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-lg p-4 flex items-center gap-3 bg-green-50 border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-600">{success}</p>
            </div>
          )}

          {/* Help */}
          <div className="mt-6 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 justify-center mb-2">
                <Info className="w-5 h-5 text-blue-600" />
                <p className="text-blue-800 font-medium">راهنمای ورود</p>
              </div>
              <p className="text-blue-700 text-sm">
                پس از ورود موفق، اگر نرم‌افزار فعال نباشد، به صفحه فعال‌سازی هدایت خواهید شد.
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              مشکل در ورود دارید؟
            </p>
            <p className="text-sm text-blue-600 mt-1">
              ehsantaj@yahoo.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;