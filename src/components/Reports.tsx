import React, { useState } from 'react';
import { Download, Filter, Calendar, User, BarChart } from 'lucide-react';
import ExcelJS from 'exceljs';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { toJalaali } from 'jalaali-js';
import { englishToPersianNumbers, formatPersianDate, formatDuration, formatLeaveBalance } from '../utils/dateHelpers';
import { saveAs } from 'file-saver';

const Reports: React.FC = () => {
  const { employees, leaves, settings } = useLocalStorage();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedYear, setSelectedYear] = useState(() => {
    const currentDate = new Date();
    const currentJalaali = toJalaali(currentDate);
    return currentJalaali.jy;
  });
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

  // Generate year range (50 years before to 50 years after current year)
  const currentDate = new Date();
  const currentJalaali = toJalaali(currentDate);
  const currentYear = currentJalaali.jy;
  const yearRange = Array.from({ length: 101 }, (_, i) => currentYear - 15 + i);

  const filteredLeaves = leaves.filter(leave => {
    const leaveDate = new Date(leave.start_date);
    const leaveJalaali = toJalaali(leaveDate);
    const leaveYear = leaveJalaali.jy;
    
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
      const leaveMonth = leaveJalaali.jm;
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
    // تنظیمات workbook
    workbook.creator = 'System';
    workbook.created = new Date();

    // Employee Summary Sheet
    const ws1 = workbook.addWorksheet('Summary');
    
    // تنظیم راست به چپ
    ws1.views = [{ rightToLeft: true }];
    
    // هدر
    const headers1 = ['نام کارمند', 'کد پرسنلی', 'سمت', 'مرخصی روزانه', 'مرخصی ساعتی', 'کل استفاده شده', 'مانده', 'تعداد کل'];
    ws1.addRow(headers1);
    
    // داده‌ها
    employees.forEach(employee => {
      const stats = getEmployeeStats(employee.id);
      ws1.addRow([
        `${employee.name} ${employee.last_name}`,
        employee.employee_id,
        employee.position,
        `${stats.totalDailyDays} روز`,
        formatDuration(stats.totalHourlyMinutes / 60),
        formatLeaveBalance((stats.totalDailyDays * 8 * 60) + stats.totalHourlyMinutes),
        formatLeaveBalance(stats.remainingMinutes),
        stats.totalLeaves.toString()
      ]);
    });
    
    // استایل هدر
    ws1.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    // Details Sheet
    const ws2 = workbook.addWorksheet('Details');
    ws2.views = [{ rightToLeft: true }];
    
    // هدر
    const headers2 = ['نام', 'کد', 'سمت', 'نوع', 'دسته', 'شروع', 'پایان', 'ساعت شروع', 'ساعت پایان', 'مدت', 'توضیحات'];
    ws2.addRow(headers2);
    
    // داده‌ها
    leaves.forEach(leave => {
      const employee = employees.find(emp => emp.id === leave.employee_id);
      const row = ws2.addRow([
        employee ? `${employee.name} ${employee.last_name}` : 'نامشخص',
        employee ? employee.employee_id : '-',
        employee?.position || '-',
        leave.type === 'daily' ? 'روزانه' : 'ساعتی',
        leave.leave_category === 'medical' ? 'استعلاجی' : 'استحقاقی',
        formatPersianDate(new Date(leave.start_date)),
        formatPersianDate(new Date(leave.end_date)),
        leave.start_time || '-',
        leave.end_time || '-',
        leave.type === 'daily' ? `${leave.duration} روز` : formatDuration(leave.duration),
        leave.description || '-'
      ]);
      
      // رنگ‌بندی
      if (leave.type === 'daily') {
        row.getCell(4).font = { color: { argb: 'FF059669' }, bold: true };
      } else {
        row.getCell(4).font = { color: { argb: 'FF2563EB' }, bold: true };
      }
      
      if (leave.leave_category === 'medical') {
        row.getCell(5).font = { color: { argb: 'FFDC2626' }, bold: true };
      } else {
        row.getCell(5).font = { color: { argb: 'FF7C3AED' }, bold: true };
      }
    });
    
    // استایل هدر
    ws2.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    
    // دانلود
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer]);
    saveAs(blob, `report-${Date.now()}.xlsx`);
  };

  const exportToExcel = async () => {
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
              {yearRange.map(year => (
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
                setSelectedYear(currentYear);
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

// Employee Summary Table Component with Pagination
const EmployeeSummaryTable: React.FC<{
  employees: any[];
  getEmployeeStats: (id: string) => any;
}> = ({ employees, getEmployeeStats }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(employees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = employees.slice(startIndex, endIndex);
  
  return (
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
            {currentEmployees.map((employee) => {
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
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            نمایش {englishToPersianNumbers((startIndex + 1).toString())} تا {englishToPersianNumbers(Math.min(endIndex, employees.length).toString())} از {englishToPersianNumbers(employees.length.toString())} کارمند
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              قبلی
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
            ))}
            
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
    </div>
  );
};

export default Reports;