import React, { useState } from 'react';
import { Save, Lock, Settings as SettingsIcon, Calendar, User, Plus, Edit2, Trash2 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from '../hooks/useAuth';
import { useLogger } from '../hooks/useLogger';
import { User as UserType } from '../types';
import { englishToPersianNumbers, persianToEnglishNumbers, formatPersianDate } from '../utils/dateHelpers';

const Settings: React.FC = () => {
  const { settings, saveSettings } = useLocalStorage();
  const { changePassword, addUser, updateUser, deleteUser, getUsers, currentUser } = useAuth();
  const { addLog } = useLogger();

  const [annualLeaveLimit, setAnnualLeaveLimit] = useState(settings.annual_leave_limit.toString());
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // User management state
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [showEditUserPassword, setShowEditUserPassword] = useState(false);
  const [userError, setUserError] = useState('');
  
  const users = getUsers();

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseInt(persianToEnglishNumbers(annualLeaveLimit));
    
    if (isNaN(limit) || limit < 1) {
      alert('سقف مرخصی سالانه باید عددی مثبت باشد');
      return;
    }

    const newSettings = {
      ...settings,
      annual_leave_limit: limit,
      updated_at: new Date().toISOString()
    };
    
    saveSettings(newSettings);
    
    if (currentUser) {
      addLog(currentUser.id, currentUser.username, 'update', 'settings', settings.id, { description: `سقف مرخصی سالانه به ${limit} روز تغییر کرد` });
    }
    
    
    setSuccessMessage('تنظیمات با موفقیت ذخیره شد');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 4) {
      setPasswordError('رمز عبور جدید باید حداقل ۴ کاراکتر باشد');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('رمز عبور جدید و تکرار آن یکسان نیستند');
      return;
    }

    changePassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setSuccessMessage('رمز عبور با موفقیت تغییر کرد');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');

    if (newUsername.length < 3) {
      setUserError('نام کاربری باید حداقل ۳ کاراکتر باشد');
      return;
    }

    if (newUserPassword.length < 4) {
      setUserError('رمز عبور باید حداقل ۴ کاراکتر باشد');
      return;
    }

    const success = addUser(newUsername, newUserPassword, newUserRole);
    if (!success) {
      setUserError('نام کاربری تکراری است');
      return;
    }

    setNewUsername('');
    setNewUserPassword('');
    setNewUserRole('user');
    setShowUserModal(false);
    setSuccessMessage('کاربر جدید با موفقیت اضافه شد');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUsername(user.username);
    setNewUserPassword('');
    setNewUserRole(user.role);
    setShowEditUserModal(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');

    if (!editingUser) return;

    if (newUsername.length < 3) {
      setUserError('نام کاربری باید حداقل ۳ کاراکتر باشد');
      return;
    }

    const updates: Partial<User> = {
      username: newUsername,
      role: newUserRole
    };

    if (newUserPassword.length > 0) {
      if (newUserPassword.length < 4) {
        setUserError('رمز عبور باید حداقل ۴ کاراکتر باشد');
        return;
      }
      updates.password = newUserPassword;
    }

    const success = updateUser(editingUser.id, updates);
    if (!success) {
      setUserError('خطا در ویرایش کاربر');
      return;
    }

    setNewUsername('');
    setNewUserPassword('');
    setNewUserRole('user');
    setEditingUser(null);
    setShowEditUserModal(false);
    setSuccessMessage('کاربر با موفقیت ویرایش شد');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteUser = (user: User) => {
    if (confirm(`آیا از حذف کاربر ${user.username} اطمینان دارید؟`)) {
      const success = deleteUser(user.id);
      if (success) {
        setSuccessMessage('کاربر با موفقیت حذف شد');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    }
  };

  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تنظیمات سیستم</h1>
        <p className="text-gray-600 mt-1">مدیریت تنظیمات عمومی و امنیتی سیستم</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600">{successMessage}</p>
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            تنظیمات عمومی
          </h3>
        </div>
        
        <form onSubmit={handleSaveSettings} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                سقف مرخصی سالانه (روز)
              </label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={englishToPersianNumbers(annualLeaveLimit)}
                  onChange={(e) => setAnnualLeaveLimit(persianToEnglishNumbers(e.target.value))}
                  className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="۳۰"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                این مقدار برای محاسبه مانده مرخصی همه کارمندان استفاده می‌شود.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              ذخیره تنظیمات
            </button>
          </div>
        </form>
      </div>

      {/* User Management - Admin Only */}
      {currentUser?.role === 'admin' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              مدیریت کاربران
            </h3>
            <button
              onClick={() => setShowUserModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              افزودن کاربر
            </button>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      نام کاربری
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      نقش
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاریخ ایجاد
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.username}
                        {user.id === currentUser?.id && (
                          <span className="mr-2 text-xs text-blue-600">(شما)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'مدیر' : 'کاربر'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPersianDate(new Date(user.created_at))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="ویرایش کاربر"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="حذف کاربر"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              مدیریت کاربران
            </h3>
          </div>
          <div className="p-6 text-center">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">دسترسی محدود</h3>
            <p className="mt-1 text-sm text-gray-500">
              فقط مدیران می‌توانند کاربران را مدیریت کنند.
            </p>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">ویرایش کاربر</h3>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نام کاربری
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رمز عبور جدید (اختیاری)
                </label>
                <div className="relative">
                  <input
                    type={showEditUserPassword ? "text" : "password"}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                    placeholder="برای عدم تغییر خالی بگذارید"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditUserPassword(!showEditUserPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showEditUserPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نقش کاربر
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="user"
                      checked={newUserRole === 'user'}
                      onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
                      className="form-radio text-blue-600"
                    />
                    <span className="mr-2">کاربر معمولی</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="admin"
                      checked={newUserRole === 'admin'}
                      onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
                      className="form-radio text-blue-600"
                      disabled={editingUser.id === currentUser?.id}
                    />
                    <span className="mr-2">مدیر</span>
                  </label>
                </div>
                {editingUser.id === currentUser?.id && (
                  <p className="text-xs text-gray-500 mt-1">
                    نمی‌توانید نقش خود را تغییر دهید
                  </p>
                )}
              </div>

              {userError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{userError}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ویرایش کاربر
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUserModal(false);
                    setEditingUser(null);
                    setNewUsername('');
                    setNewUserPassword('');
                    setNewUserRole('user');
                    setUserError('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Password Change */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            تغییر رمز عبور
          </h3>
        </div>
        
        <form onSubmit={handlePasswordChange} className="p-6">
          <div className="space-y-4">
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
                  {showNewPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
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
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{passwordError}</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              تغییر رمز عبور
            </button>
          </div>
        </form>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">اطلاعات سیستم</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">نسخه سیستم</h4>
              <p className="text-sm text-gray-900">۱.۰.۰</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">آخرین بروزرسانی</h4>
              <p className="text-sm text-gray-900">
                {formatPersianDate(new Date(settings.updated_at))}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">محل ذخیره‌سازی</h4>
              <p className="text-sm text-gray-900">مرورگر محلی</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">وضعیت سیستم</h4>
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                فعال
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">افزودن کاربر جدید</h3>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نام کاربری
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رمز عبور
                </label>
                <div className="relative">
                  <input
                    type={showNewUserPassword ? "text" : "password"}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewUserPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نقش کاربر
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="user"
                      checked={newUserRole === 'user'}
                      onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
                      className="form-radio text-blue-600"
                    />
                    <span className="mr-2">کاربر معمولی</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="admin"
                      checked={newUserRole === 'admin'}
                      onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
                      className="form-radio text-blue-600"
                    />
                    <span className="mr-2">مدیر</span>
                  </label>
                </div>
              </div>

              {userError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{userError}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  افزودن کاربر
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setNewUsername('');
                    setNewUserPassword('');
                    setNewUserRole('user');
                    setUserError('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;