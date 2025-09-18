import React, { useState } from 'react';
import { FileText, Download, Filter, User, Calendar } from 'lucide-react';
import { useLogger } from '../hooks/useLogger';
import { useAuth } from '../hooks/useAuth';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { englishToPersianNumbers, formatPersianDate } from '../utils/dateHelpers';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const SystemLogs: React.FC = () => {
  const { currentUser } = useAuth();
  const { getLogs } = useLogger();
  const { employees } = useLocalStorage();
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const logs = getLogs(true);
  
  const filteredLogs = logs.filter(log => {
    let matchesAction = true;
    let matchesDate = true;

    if (selectedAction) {
      matchesAction = log.action === selectedAction;
    }

    if (selectedDate) {
      const logDate = new Date(log.timestamp).toDateString();
      const filterDate = new Date(selectedDate).toDateString();
      matchesDate = logDate === filterDate;
    }

    return matchesAction && matchesDate;
  });

  const exportLogsToExcel = () => {
    const data = filteredLogs.map(log => ({
      'تاریخ و زمان': new Date(log.timestamp).toLocaleString('fa-IR'),
      'کاربر': log.user_id,
      'عملیات': getActionLabel(log.action),
      'نوع موجودیت': getEntityTypeLabel(log.entity_type),
      'جزئیات': log.details
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!dir'] = 'rtl';
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'لاگ سیستم');
    
    wb.Props = {
      Title: 'لاگ سیستم',
      Subject: 'گزارش لاگ‌های سیستم مدیریت مرخصی',
      Author: 'سیستم مدیریت مرخصی',
      CreatedDate: new Date()
    };
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(dataBlob, `لاگ-سیستم-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'create': 'ایجاد',
      'update': 'ویرایش',
      'delete': 'حذف',
      'login': 'ورود',
      'logout': 'خروج'
    };
    return labels[action] || action;
  };

  const getEntityTypeLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      'employee': 'کارمند',
      'leave': 'مرخصی',
      'user': 'کاربر',
      'settings': 'تنظیمات'
    };
    return labels[entityType] || entityType;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'create': 'bg-green-100 text-green-800',
      'update': 'bg-yellow-100 text-yellow-800',
      'delete': 'bg-red-100 text-red-800',
      'login': 'bg-blue-100 text-blue-800',
      'logout': 'bg-gray-100 text-gray-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لاگ سیستم</h1>
          <p className="text-gray-600 mt-1">مشاهده و گزارش‌گیری از فعالیت‌های سیستم</p>
        </div>
        <button
          onClick={exportLogsToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          خروجی Excel
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          فیلترهای لاگ
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع عملیات
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">همه عملیات</option>
              <option value="create">ایجاد</option>
              <option value="update">ویرایش</option>
              <option value="delete">حذف</option>
              <option value="login">ورود</option>
              <option value="logout">خروج</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاریخ
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedAction('');
                setSelectedDate('');
              }}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              پاک کردن فیلترها
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-600">کل لاگ‌ها</h3>
              <p className="text-2xl font-bold text-gray-900">
                {englishToPersianNumbers(filteredLogs.length.toString())}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-600">ورود/خروج</h3>
              <p className="text-2xl font-bold text-gray-900">
                {englishToPersianNumbers(
                  filteredLogs.filter(l => l.action === 'login' || l.action === 'logout').length.toString()
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-600">تغییرات</h3>
              <p className="text-2xl font-bold text-gray-900">
                {englishToPersianNumbers(
                  filteredLogs.filter(l => l.action === 'create' || l.action === 'update' || l.action === 'delete').length.toString()
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-600">حذف‌ها</h3>
              <p className="text-2xl font-bold text-gray-900">
                {englishToPersianNumbers(
                  filteredLogs.filter(l => l.action === 'delete').length.toString()
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {currentUser?.role === 'admin' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            جزئیات لاگ‌ها ({englishToPersianNumbers(filteredLogs.length.toString())} مورد)
          </h3>
        </div>
        
        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاریخ و زمان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    کاربر
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عملیات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    جزئیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.timestamp).toLocaleString('fa-IR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.user_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getEntityTypeLabel(log.entity_type)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">لاگی یافت نشد</h3>
            <p className="mt-1 text-sm text-gray-500">
              با فیلترهای انتخاب شده لاگی یافت نشد.
            </p>
          </div>
        )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">لاگ سیستم</h3>
          </div>
          <div className="px-6 py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">دسترسی محدود</h3>
            <p className="mt-1 text-sm text-gray-500">
              فقط مدیران می‌توانند لاگ‌های سیستم را مشاهده کنند.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemLogs;