import React, { useState } from 'react';
import { Shield, Key, CheckCircle, AlertTriangle, Info, Calendar, Clock } from 'lucide-react';
import { useActivation } from '../hooks/useActivation';
import { englishToPersianNumbers, formatPersianDate } from '../utils/dateHelpers';

const ActivationPage: React.FC = () => {
  const { activate, getActivationInfo } = useActivation();
  const [activationCode, setActivationCode] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);

  const activationInfo = getActivationInfo();

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activationCode.trim()) {
      setMessage('لطفاً کد فعال‌سازی را وارد کنید');
      setMessageType('error');
      return;
    }

    setLoading(true);
    
    // شبیه‌سازی تأخیر شبکه
    setTimeout(() => {
      const result = activate(activationCode);
      setMessage(result.message);
      setMessageType(result.success ? 'success' : 'error');
      
      if (result.success) {
        setActivationCode('');
        // بعد از 2 ثانیه صفحه را تازه‌سازی می‌کند
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
      
      setLoading(false);
    }, 1500);
  };

  const formatActivationCode = (code: string) => {
    // فرمت کردن کد به صورت XXXX-XXXX-XXXX-XXX
    const cleanCode = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const formatted = cleanCode.match(/.{1,4}/g)?.join('-') || cleanCode;
    return formatted;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatActivationCode(e.target.value);
    setActivationCode(formatted);
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
              فعال‌سازی نرم‌افزار
            </h2>
            <p className="text-gray-600 mt-2">
              سیستم مدیریت مرخصی حسا
            </p>
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
                کد فعال‌سازی را که از فروشنده دریافت کرده‌اید وارد کنید
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

          {/* Demo Codes Info */}
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-800">کدهای نمایشی</span>
            </div>
            
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>نمایشی:</span>
                <code className="bg-white px-2 py-1 rounded">HESA-2025-DEMO-001</code>
              </div>
              <div className="flex justify-between">
                <span>کامل:</span>
                <code className="bg-white px-2 py-1 rounded">HESA-2025-FULL-002</code>
              </div>
              <div className="flex justify-between">
                <span>آزمایشی (30 روز):</span>
                <code className="bg-white px-2 py-1 rounded">HESA-2025-TRIAL-003</code>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-3">
              این کدها فقط برای نمایش و تست هستند
            </p>
          </div>

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