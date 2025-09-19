import React, { useState } from 'react';
import { FileText, Download, Filter, User, Calendar, Info } from 'lucide-react';
import { useLogger } from '../hooks/useLogger';
import { useAuth } from '../hooks/useAuth';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { englishToPersianNumbers, formatPersianDateTime, formatPersianDate } from '../utils/dateHelpers';
import { toJalaali } from 'jalaali-js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import PersianCalendar from './PersianCalendar';

const SystemLogs: React.FC = () => {
  const { currentUser } = useAuth();
  const { getLogs } = useLogger();
  const { employees } = useLocalStorage();
  const { getUsers } = useAuth();
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const itemsPerPage = 10;

  const logs = getLogs(true);
  const users = getUsers();
  
  const filteredLogs = logs.filter(log => {
    let matchesAction = true;
    let matchesDate = true;

    if (selectedAction) {
      matchesAction = log.action === selectedAction;
    }

    if (selectedDate) {
      const logDate = new Date(log.timestamp);
      const filterDate = new Date(selectedDate);
      const logJalaali = toJalaali(logDate);
      const filterJalaali = toJalaali(filterDate);
      matchesDate = logJalaali.jy === filterJalaali.jy && 
                   logJalaali.jm === filterJalaali.jm && 
                   logJalaali.jd === filterJalaali.jd;
    }

    return matchesAction && matchesDate;
  });
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  const exportLogsToExcel = () => {
    const getUserName = (userId: string) => {
      return logs.find(l => l.user_id === userId)?.username || users.find(u => u.id === userId)?.username || userId;
    };
    
    const data = filteredLogs.map(log => ({
      'تاریخ و زمان': formatPersianDateTime(new Date(log.timestamp)),
      'کاربر': log.username || getUserName(log.user_id),
      'عملیات': getActionLabel(log.action),
      'نوع موجودیت': getEntityTypeLabel(log.entity_type),
      'شرح عملیات': log.details,
      'مرورگر': log.system_info?.browser || 'نامشخص',
      'سیستم عامل': log.system_info?.os || 'نامشخص',
      'آدرس IP': log.ip_address || 'محلی'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // تاریخ و زمان
      { wch: 15 }, // کاربر
      { wch: 15 }, // عملیات
      { wch: 15 }, // نوع موجودیت
      { wch: 60 }, // شرح عملیات
      { wch: 15 }, // مرورگر
      { wch: 15 }, // سیستم عامل
      { wch: 15 }  // آدرس IP
    ];
    
    // Apply RTL and center alignment to all cells
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        
        ws[cellAddress].s = {
          alignment: {
            horizontal: 'center',
            vertical: 'center',
            readingOrder: 2
          },
          fill: R === 0 ? { fgColor: { rgb: "E5E7EB" } } : undefined,
          font: R === 0 ? { bold: true } : undefined
        };
      }
    }
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'لاگ سیستم');
    
    // Set RTL direction for workbook
    wb.Workbook = wb.Workbook || {};
    wb.Workbook.Views = [{
      RTL: true
    }];
    
    wb.Props = {
      Title: 'لاگ سیستم',
      Subject: 'گزارش لاگ‌های سیستم مدیریت مرخصی',
      Author: 'سیستم مدیریت مرخصی',
      CreatedDate: new Date()
    };
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
    
    saveAs(dataBlob, `لاگ-سیستم-${timestamp}.xlsx`);
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
            <div>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full text-right border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {selectedDate ? formatPersianDate(new Date(selectedDate)) : 'انتخاب تاریخ'}
              </button>
              {showCalendar && (
                <div className="absolute mt-2 z-50 bg-white shadow-lg rounded-lg border border-gray-200">
                  <PersianCalendar
                    selectedDate={selectedDate ? new Date(selectedDate) : undefined}
                    onDateSelect={(date) => {
                      setSelectedDate(date.toISOString().split('T')[0]);
                      setShowCalendar(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedAction('');
                setSelectedDate('');
                setCurrentPage(1);
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
            <>
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
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        اطلاعات بیشتر
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                        setSelectedLog(log);
                        setShowLogDetails(true);
                      }}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPersianDateTime(new Date(log.timestamp))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.username || (() => {
                            const user = users.find(u => u.id === log.user_id);
                            return user ? user.username : log.user_id;
                          })()}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                              setShowLogDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    نمایش {englishToPersianNumbers((startIndex + 1).toString())} تا {englishToPersianNumbers(Math.min(endIndex, filteredLogs.length).toString())} از {englishToPersianNumbers(filteredLogs.length.toString())} لاگ
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      قبلی
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            currentPage === page
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {englishToPersianNumbers(page.toString())}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      بعدی
                    </button>
                  </div>
                </div>
              )}
            </>
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

      {/* Log Details Modal */}
      {showLogDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">جزئیات کامل لاگ</h3>
              <button
                onClick={() => setShowLogDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* اطلاعات اصلی */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">اطلاعات عملیات</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">تاریخ و زمان:</span>
                      <span className="font-medium">{formatPersianDateTime(new Date(selectedLog.timestamp))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">کاربر:</span>
                      <span className="font-medium">{selectedLog.username || selectedLog.user_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">عملیات:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(selectedLog.action)}`}>
                        {getActionLabel(selectedLog.action)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">نوع موجودیت:</span>
                      <span className="font-medium">{getEntityTypeLabel(selectedLog.entity_type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">شناسه موجودیت:</span>
                      <span className="font-medium">{selectedLog.entity_id ? 'دارد' : 'ندارد'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">اطلاعات سیستم</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">مرورگر:</span>
                      <span className="font-medium">{selectedLog.system_info?.browser || 'نامشخص'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">سیستم عامل:</span>
                      <span className="font-medium">{selectedLog.system_info?.os || 'نامشخص'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">رزولوشن صفحه:</span>
                      <span className="font-medium">{selectedLog.system_info?.screenResolution || 'نامشخص'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">زبان:</span>
                      <span className="font-medium">{selectedLog.system_info?.language || 'نامشخص'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">آدرس IP:</span>
                      <span className="font-medium">{selectedLog.ip_address || 'محلی'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* جزئیات کامل */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">شرح کامل عملیات</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-800 leading-relaxed">{selectedLog.details}</p>
                </div>
              </div>
              
              {/* User Agent */}
              {selectedLog.system_info?.userAgent && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">اطلاعات فنی مرورگر</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 font-mono break-all">{selectedLog.system_info.userAgent}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemLogs;