import React, { useState } from 'react';
import { Download, Filter, Calendar, User, BarChart } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { englishToPersianNumbers, formatPersianDate, formatDuration, formatLeaveBalance } from '../utils/dateHelpers';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Reports: React.FC = () => {
  const { employees, leaves, settings } = useLocalStorage();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('');

  const months = [
    { value: 1, label: 'فروردین' },
    { value: 2, label: 'اردیبهشت' },
    { value: 3, label: 'خرداد' },
    { value: 4, label: 'تیر' },
    { value: 5, label: 'مرداد' },
    { value: 6, label: 'شهریور' },
    { value: 7, label: 'مهر' },
    { value: 8, label: 'آبان' },
    { value: 9, label: 'آذر' },
    { value: 10, label: 'دی' },
    { value: 11, label: 'بهمن' },
    { value: 12, label: 'اسفند' }
  ];

  const filteredLeaves = leaves.filter(leave => {
    const leaveDate = new Date(leave.start_date);
    const leaveYear = leaveDate.getFullYear();
    
    let matchesEmployee = true;
    let matchesYear = true;
    let matchesMonth = true;

    if (selectedEmployee) {
      matchesEmployee = leave.employee_id === selectedEmployee;
    }

    if (selectedYear) {
      matchesYear = leaveYear === selectedYear;
    }

    if (selectedMonth) {
      const leaveMonth = leaveDate.getMonth() + 1;
      matchesMonth = leaveMonth === parseInt(selectedMonth);
    }

    return matchesEmployee && matchesYear && matchesMonth;
  });

  const getEmployeeStats = (employeeId: string) => {
    const employeeLeaves = leaves.filter(leave => leave.employee_id === employeeId);
    const dailyLeaves = employeeLeaves.filter(leave => leave.type === 'daily');
    const hourlyLeaves = employeeLeaves.filter(leave => leave.type === 'hourly');
    
    const totalDailyDays = dailyLeaves.reduce((sum, leave) => sum + leave.duration, 0);
    const totalHourlyMinutes = hourlyLeaves.reduce((sum, leave) => sum + (leave.duration * 60), 0);
    
    // محاسبه مانده مرخصی به دقیقه
    const usedMinutes = (totalDailyDays * 8 * 60) + totalHourlyMinutes;
    const totalAllowedMinutes = settings.annual_leave_limit * 8 * 60;
    const remainingMinutes = totalAllowedMinutes - usedMinutes;

    return {
      totalDailyDays,
      totalHourlyMinutes,
      remainingMinutes,
      totalLeaves: employeeLeaves.length
    };
  };

  const exportToExcel = () => {
    // Create employee summary data
    const employeeSummaryData = employees.map(employee => {
      const stats = getEmployeeStats(employee.id);
      return {
        'نام کارمند': `${employee.name} ${employee.last_name}`,
        'کد پرسنلی': englishToPersianNumbers(employee.employee_id),
        'سمت': employee.position,
        'مرخصی روزانه استفاده شده': `${englishToPersianNumbers(stats.totalDailyDays.toString())} روز`,
        'مرخصی ساعتی استفاده شده': formatDuration(stats.totalHourlyMinutes / 60),
        'کل مرخصی استفاده شده': formatLeaveBalance((stats.totalDailyDays * 8 * 60) + stats.totalHourlyMinutes),
        'مانده مرخصی': formatLeaveBalance(stats.remainingMinutes),
        'کل تعداد مرخصی‌ها': englishToPersianNumbers(stats.totalLeaves.toString())
      };
    });

    // Create detailed leaves data
    const leavesData = filteredLeaves.map(leave => {
      const employee = employees.find(emp => emp.id === leave.employee_id);
      return {
        'نام کارمند': employee ? `${employee.name} ${employee.last_name}` : 'نامشخص',
        'کد پرسنلی': employee ? englishToPersianNumbers(employee.employee_id) : '-',
        'سمت': employee?.position || '-',
        'نوع مرخصی': leave.type === 'daily' ? 'روزانه' : 'ساعتی',
        'دسته‌بندی': leave.leave_category === 'medical' ? 'استعلاجی' : 'استحقاقی',
        'تاریخ شروع': formatPersianDate(new Date(leave.start_date)),
        'تاریخ پایان': formatPersianDate(new Date(leave.end_date)),
        'ساعت شروع': leave.start_time ? englishToPersianNumbers(leave.start_time) : '-',
        'ساعت پایان': leave.end_time ? englishToPersianNumbers(leave.end_time) : '-',
        'مدت زمان': leave.type === 'daily' 
          ? `${englishToPersianNumbers(leave.duration.toString())} روز`
          : formatDuration(leave.duration),
        'توضیحات': leave.description || '-',
        'وضعیت': leave.is_modified ? 'ویرایش شده' : 'اصلی'
      };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add employee summary sheet
    const ws1 = XLSX.utils.json_to_sheet(employeeSummaryData);
    ws1['!dir'] = 'rtl';
    if (!ws1['!cols']) ws1['!cols'] = [];
    // Set column widths for better display
    ws1['!cols'] = [
      { wch: 20 }, // نام کارمند
      { wch: 15 }, // کد پرسنلی
      { wch: 20 }, // سمت
      { wch: 25 }, // مرخصی روزانه
      { wch: 25 }, // مرخصی ساعتی
      { wch: 25 }, // کل استفاده شده
      { wch: 20 }, // مانده
      { wch: 15 }  // تعداد
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'خلاصه کارمندان');
    
    // Add detailed leaves sheet
    const ws2 = XLSX.utils.json_to_sheet(leavesData);
    ws2['!dir'] = 'rtl';
    if (!ws2['!cols']) ws2['!cols'] = [];
    ws2['!cols'] = [
      { wch: 20 }, // نام کارمند
      { wch: 15 }, // کد پرسنلی
      { wch: 20 }, // سمت
      { wch: 15 }, // نوع
      { wch: 15 }, // دسته‌بندی
      { wch: 15 }, // تاریخ شروع
      { wch: 15 }, // تاریخ پایان
      { wch: 12 }, // ساعت شروع
      { wch: 12 }, // ساعت پایان
      { wch: 15 }, // مدت زمان
      { wch: 30 }, // توضیحات
      { wch: 15 }  // وضعیت
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'جزئیات مرخصی‌ها');
    
    // Set workbook properties for RTL
    wb.Props = {
      Title: 'گزارش مرخصی‌ها',
      Subject: 'گزارش سیستم مدیریت مرخصی',
      Author: 'سیستم مدیریت مرخصی',
      CreatedDate: new Date()
    };
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
    
    saveAs(dataBlob, `گزارش-مرخصی-${englishToPersianNumbers(selectedYear.toString())}-${timestamp}.xlsx`);
  };

  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">گزارش‌گیری</h1>
          <p className="text-gray-600 mt-1">مشاهده و خروجی گرفتن از گزارش‌های مرخصی</p>
        </div>
        <button
          onClick={exportToExcel}
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
          فیلترهای گزارش
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              کارمند
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">همه کارمندان</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} {employee.last_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              سال
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>
                  {englishToPersianNumbers(year.toString())}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ماه
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">تمام ماه‌ها</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedEmployee('');
                setSelectedMonth('');
                setSelectedYear(new Date().getFullYear());
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
              <BarChart className="w-6 h-6 text-blue-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-600">کل مرخصی‌ها</h3>
              <p className="text-2xl font-bold text-gray-900">
                {englishToPersianNumbers(filteredLeaves.length.toString())}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-600">مرخصی‌های روزانه</h3>
              <p className="text-2xl font-bold text-gray-900">
                {englishToPersianNumbers(filteredLeaves.filter(l => l.type === 'daily').length.toString())}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-600">مرخصی‌های ساعتی</h3>
              <p className="text-2xl font-bold text-gray-900">
                {englishToPersianNumbers(filteredLeaves.filter(l => l.type === 'hourly').length.toString())}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <User className="w-6 h-6 text-orange-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-600">کارمندان درگیر</h3>
              <p className="text-2xl font-bold text-gray-900">
                {englishToPersianNumbers(
                  new Set(filteredLeaves.map(l => l.employee_id)).size.toString()
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Summary Table */}
      {!selectedEmployee && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">خلاصه وضعیت کارمندان</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    کارمند
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    مرخصی روزانه
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    مرخصی ساعتی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    مانده مرخصی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    کل مرخصی‌ها
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => {
                  const stats = getEmployeeStats(employee.id);
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="mr-3">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.name} {employee.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.employee_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {englishToPersianNumbers(stats.totalDailyDays.toString())} روز
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(stats.totalHourlyMinutes / 60)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          stats.remainingMinutes > (10 * 8 * 60)
                            ? 'bg-green-100 text-green-800' 
                            : stats.remainingMinutes > (5 * 8 * 60)
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {formatLeaveBalance(stats.remainingMinutes)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {englishToPersianNumbers(stats.totalLeaves.toString())} مورد
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Leave Report */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            گزارش تفصیلی مرخصی‌ها ({englishToPersianNumbers(filteredLeaves.length.toString())} مورد)
          </h3>
        </div>
        
        {filteredLeaves.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    کارمند
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    دسته‌بندی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاریخ شروع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاریخ پایان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    مدت زمان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    توضیحات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeaves.map((leave) => {
                  const employee = employees.find(emp => emp.id === leave.employee_id);
                  return (
                    <tr key={leave.id} className={`hover:bg-gray-50 ${leave.is_modified ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="mr-3">
                            <div className="text-sm font-medium text-gray-900">
                              {employee ? `${employee.name} ${employee.last_name}` : 'نامشخص'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee?.employee_id || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          leave.type === 'daily' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {leave.type === 'daily' ? 'روزانه' : 'ساعتی'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          leave.leave_category === 'medical' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {leave.leave_category === 'medical' ? 'استعلاجی' : 'استحقاقی'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPersianDate(new Date(leave.start_date))}
                        {leave.start_time && (
                          <div className="text-xs text-gray-500">
                            {englishToPersianNumbers(leave.start_time)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPersianDate(new Date(leave.end_date))}
                        {leave.end_time && (
                          <div className="text-xs text-gray-500">
                            {englishToPersianNumbers(leave.end_time)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.type === 'daily' 
                          ? `${englishToPersianNumbers(leave.duration.toString())} روز`
                          : formatDuration(leave.duration)
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {leave.description || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <BarChart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">گزارشی یافت نشد</h3>
            <p className="mt-1 text-sm text-gray-500">
              با فیلترهای انتخاب شده گزارشی یافت نشد.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;