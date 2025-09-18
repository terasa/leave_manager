import React, { useState } from 'react';
import { Download, Upload, RotateCcw, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from '../hooks/useAuth';
import { useLogger } from '../hooks/useLogger';
import { englishToPersianNumbers, formatPersianDate } from '../utils/dateHelpers';

const Backup: React.FC = () => {
  const { employees, leaves, settings } = useLocalStorage();
  const { currentUser, getUsers } = useAuth();
  const { addLog } = useLogger();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const createBackup = () => {
    try {
      const backupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          employees,
          leaves,
          settings,
          users: currentUser?.role === 'admin' ? getUsers() : [],
          logs: currentUser?.role === 'admin' ? localStorage.getItem('system_logs') : null
        }
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
      
      link.download = `backup_leave_system_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (currentUser) {
        addLog(currentUser.id, 'create', 'settings', undefined, 'پشتیبان از سیستم گرفته شد');
      }

      showMessage('پشتیبان با موفقیت ایجاد شد', 'success');
    } catch (error) {
      showMessage('خطا در ایجاد پشتیبان', 'error');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        
        if (!backupData.data) {
          showMessage('فایل پشتیبان نامعتبر است', 'error');
          return;
        }

        // Restore data
        if (backupData.data.employees) {
          localStorage.setItem('employees', JSON.stringify(backupData.data.employees));
        }
        if (backupData.data.leaves) {
          localStorage.setItem('leaves', JSON.stringify(backupData.data.leaves));
        }
        if (backupData.data.settings) {
          localStorage.setItem('settings', JSON.stringify(backupData.data.settings));
        }
        if (currentUser?.role === 'admin' && backupData.data.users) {
          localStorage.setItem('users', JSON.stringify(backupData.data.users));
        }
        if (currentUser?.role === 'admin' && backupData.data.logs) {
          localStorage.setItem('system_logs', backupData.data.logs);
        }

        if (currentUser) {
          addLog(currentUser.id, 'update', 'settings', undefined, 'پشتیبان بازیابی شد');
        }

        showMessage('پشتیبان با موفقیت بازیابی شد. صفحه را تازه‌سازی کنید.', 'success');
      } catch (error) {
        showMessage('خطا در بازیابی پشتیبان', 'error');
      }
    };
    reader.readAsText(file);
  };

  const resetDatabase = () => {
    if (!confirm('آیا از پاک کردن تمام داده‌ها اطمینان دارید؟ این عمل غیرقابل بازگشت است!')) {
      return;
    }

    try {
      localStorage.removeItem('employees');
      localStorage.removeItem('leaves');
      localStorage.removeItem('settings');
      if (currentUser?.role === 'admin') {
        localStorage.removeItem('system_logs');
        // Keep admin user
        const adminUser = getUsers().find(u => u.role === 'admin');
        if (adminUser) {
          localStorage.setItem('users', JSON.stringify([adminUser]));
        }
      }

      if (currentUser) {
        addLog(currentUser.id, 'delete', 'settings', undefined, 'پایگاه داده ریست شد');
      }

      showMessage('پایگاه داده با موفقیت ریست شد. صفحه را تازه‌سازی کنید.', 'success');
    } catch (error) {
      showMessage('خطا در ریست پایگاه داده', 'error');
    }
  };

  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">پشتیبان‌گیری</h1>
        <p className="text-gray-600 mt-1">مدیریت پشتیبان‌گیری و بازیابی اطلاعات سیستم</p>
      </div>

      {/* Message */}
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

      {/* Backup Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Save className="w-5 h-5" />
            ایجاد پشتیبان
          </h3>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            پشتیبان کاملی از تمام اطلاعات سیستم شامل کارمندان، مرخصی‌ها، تنظیمات و لاگ‌ها ایجاد کنید.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">آمار فعلی سیستم</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>کارمندان: {englishToPersianNumbers(employees.length.toString())} نفر</li>
                <li>مرخصی‌ها: {englishToPersianNumbers(leaves.length.toString())} مورد</li>
                <li>آخرین بروزرسانی: {formatPersianDate(new Date(settings.updated_at))}</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">مشخصات پشتیبان</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>فرمت: JSON</li>
                <li>شامل تاریخ و زمان</li>
                <li>قابل بازیابی کامل</li>
              </ul>
            </div>
          </div>
          
          <button
            onClick={createBackup}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            دانلود پشتیبان
          </button>
        </div>
      </div>

      {/* Restore Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            بازیابی پشتیبان
          </h3>
        </div>
        
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800 font-medium">هشدار</p>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              بازیابی پشتیبان تمام اطلاعات فعلی را جایگزین خواهد کرد. قبل از ادامه، پشتیبان فعلی بگیرید.
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              انتخاب فایل پشتیبان
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Reset Section - Admin Only */}
      {currentUser?.role === 'admin' && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200">
          <div className="px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-medium text-red-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              ریست پایگاه داده
            </h3>
          </div>
          
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-red-800 font-medium">خطر</p>
              </div>
              <p className="text-red-700 text-sm mt-1">
                این عمل تمام اطلاعات سیستم را پاک می‌کند و غیرقابل بازگشت است. فقط در مواقع ضروری استفاده کنید.
              </p>
            </div>
            
            <button
              onClick={resetDatabase}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              ریست کامل پایگاه داده
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Backup;