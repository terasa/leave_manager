import React, { useState } from 'react';
import { Shield, Key, CheckCircle, AlertTriangle, Info, Calendar, Clock, Mail, LogIn } from 'lucide-react';
import { useActivation } from '../hooks/useActivation';
import { useAuth } from '../hooks/useAuth';
import { englishToPersianNumbers, formatPersianDate } from '../utils/dateHelpers';

const ActivationPage: React.FC = () => {
  const { activate, getActivationInfo } = useActivation();
  const { currentUser, loginWithGoogle, loginWithEmail, logout } = useAuth();
  const [activationCode, setActivationCode] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [emailForLogin, setEmailForLogin] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const activationInfo = getActivationInfo();

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activationCode.trim()) {
      setMessage('لطفاً کد فعال‌سازی را وارد کنید');
      setMessageType('error');
      return;
    }

    setLoading(true);
    
    try {
      const result = await activate(activationCode);
      setMessage(result.message);
      setMessageType(result.success ? 'success' : 'error');
      
      if (result.success) {
        setActivationCode('');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
      
      setLoading(false);
    } catch (error) {
      setMessage('خطا در ارتباط با سرور');
      setMessageType('error');
      setLoading(false);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestEmail.trim()) {
      setRequestMessage('لطفاً ایمیل خود را وارد کنید');
      return;
    }

    setLoading(true);
    
    try {
      // شبیه‌سازی ارسال درخواست
      await new Promise(resolve => setTimeout(resolve, 2000));
      setRequestMessage('درخواست شما ارسال شد. پس از بررسی، کد فعال‌سازی به ایمیل شما ارسال خواهد شد.');
      setRequestEmail('');
      setShowRequestForm(false);
    } catch (error) {
      setRequestMessage('خطا در ارسال درخواست');
    }
    
    setLoading(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailForLogin.trim()) {
      setMessage('لطفاً ایمیل خود را وارد کنید');
      setMessageType('error');
      return;
    }

    setLoading(true);
    
    try {
      await loginWithEmail(emailForLogin);
      setEmailSent(true);
      setMessage('لینک ورود به ایمیل شما ارسال شد');
      setMessageType('success');
    } catch (error) {
      setMessage('خطا در ارسال ایمیل');
      setMessageType('error');
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

  // اگر کاربر وارد نشده، صفحه ورود نمایش داده شود
  if (!currentUser) {
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
                ورود به سیستم
              </h2>
              <p className="text-gray-600 mt-2">
                برای فعال‌سازی نرم‌افزار، ابتدا وارد شوید
              </p>
            </div>

            {/* Google Login */}
            <button
              onClick={loginWithGoogle}
              disabled={loading}
              className="w-full bg-white text-gray-700 border border-gray-300 py-3 px-4 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-colors font-medium flex items-center justify-center gap-3 mb-4 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              ورود با Google
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">یا</span>
              </div>
            </div>

            {/* Email Login */}
            {!emailSent ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ایمیل
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={emailForLogin}
                      onChange={(e) => setEmailForLogin(e.target.value)}
                      className="block w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="ایمیل خود را وارد کنید"
                      required
                    />
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
                      در حال ارسال...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      ارسال لینک ورود
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium">لینک ورود ارسال شد</p>
                <p className="text-green-600 text-sm mt-1">
                  لطفاً ایمیل خود را بررسی کرده و روی لینک کلیک کنید
                </p>
              </div>
            )}

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
          </div>
        </div>
      </div>
    );
  }

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
              فعال‌سازی نرم‌افزار
            </h2>
            <p className="text-gray-600 mt-2">
              سیستم مدیریت مرخصی حسا
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                خوش آمدید، {currentUser.email}
              </span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                خروج
              </button>
            </div>
          </div>

          {/* Current Activation Status */}
          {activationInfo && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">نرم‌افزار فعال است</span>
              </div>
              
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>نوع مجوز:</span>
                  <span className="font-medium">{activationInfo.licenseType}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>کد فعال‌سازی:</span>
                  <span className="font-mono text-xs">{activationInfo.code}</span>
                </div>
                
                {activationInfo.activatedAt && (
                  <div className="flex justify-between">
                    <span>تاریخ فعال‌سازی:</span>
                    <span>{formatPersianDate(new Date(activationInfo.activatedAt))}</span>
                  </div>
                )}
                
                {activationInfo.expiresAt && (
                  <div className="flex justify-between">
                    <span>تاریخ انقضا:</span>
                    <span className={activationInfo.isExpired ? 'text-red-600 font-medium' : ''}>
                      {formatPersianDate(new Date(activationInfo.expiresAt))}
                    </span>
                  </div>
                )}
                
                {activationInfo.daysRemaining !== null && (
                  <div className="flex justify-between">
                    <span>روزهای باقی‌مانده:</span>
                    <span className={`font-medium ${
                      activationInfo.daysRemaining <= 7 ? 'text-red-600' : 
                      activationInfo.daysRemaining <= 30 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {englishToPersianNumbers(activationInfo.daysRemaining.toString())} روز
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activation Form */}
          <form onSubmit={handleActivation} className="space-y-6">
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
                  placeholder="XXXX-XXXX-XXXX-XXX"
                  maxLength={19}
                  style={{ direction: 'ltr' }}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                کد فعال‌سازی را که دریافت کرده‌اید وارد کنید
              </p>
            </div>

            {message && (
              <div className={`rounded-lg p-4 flex items-center gap-3 ${
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  در حال بررسی...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  فعال‌سازی نرم‌افزار
                </>
              )}
            </button>
          </form>

          {/* Request Code Section */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">یا</span>
              </div>
            </div>
            
            {!showRequestForm ? (
              <button
                type="button"
                onClick={() => setShowRequestForm(true)}
                className="mt-4 w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 focus:ring-4 focus:ring-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                درخواست کد فعال‌سازی
              </button>
            ) : (
              <form onSubmit={handleRequestCode} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ایمیل برای دریافت کد
                  </label>
                  <input
                    type="email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ایمیل خود را وارد کنید"
                    required
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    ارسال درخواست
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            )}
          </div>

          {requestMessage && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-600 text-sm">{requestMessage}</p>
            </div>
          )}

          {/* Contact Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              برای خرید یا پشتیبانی با ما تماس بگیرید
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

export default ActivationPage;