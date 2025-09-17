import React, { useState } from 'react';
import { Plus, Calendar, Clock, User } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Leave, LeaveType } from '../types';
import PersianCalendar from './PersianCalendar';
import TimePicker from './TimePicker';
import { englishToPersianNumbers, formatPersianDate, formatDuration, formatLeaveBalance } from '../utils/dateHelpers';

const LeaveManagement: React.FC = () => {
  const { employees, leaves, addLeave, updateLeave, deleteLeave, settings } = useLocalStorage();
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    type: 'daily' as LeaveType,
    leave_category: 'entitled' as LeaveCategory,
    start_date: new Date(),
    end_date: new Date(),
    start_time: '08:00',
    end_time: '17:00',
    description: ''
  });
  
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const calculateDuration = () => {
    if (formData.type === 'daily') {
      const diffTime = Math.abs(formData.end_date.getTime() - formData.start_date.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } else {
      const [startHour, startMinute] = formData.start_time.split(':').map(Number);
      const [endHour, endMinute] = formData.end_time.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      return Math.max(0, (endMinutes - startMinutes) / 60);
    }
  };

  const getEmployeeLeaveBalance = (employeeId: string) => {
    const currentYear = new Date().getFullYear();
    const employeeLeaves = leaves.filter(leave => 
      leave.employee_id === employeeId && 
      new Date(leave.start_date).getFullYear() === currentYear
    );
    
    // محاسبه کل دقایق استفاده شده
    const usedMinutes = employeeLeaves.reduce((sum, leave) => {
      if (leave.type === 'daily') {
        return sum + (leave.duration * 8 * 60); // هر روز = 8 ساعت = 480 دقیقه
      } else {
        return sum + (leave.duration * 60); // ساعت به دقیقه
      }
    }, 0);
    
    const totalAllowedMinutes = settings.annual_leave_limit * 8 * 60; // کل مرخصی مجاز به دقیقه
    return totalAllowedMinutes - usedMinutes;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const duration = calculateDuration();
    const employee = employees.find(emp => emp.id === formData.employee_id);
    
    if (!employee) {
      alert('لطفاً کارمند را انتخاب کنید');
      return;
    }

    if (formData.type === 'daily') {
      const balance = getEmployeeLeaveBalance(formData.employee_id);
      const requiredMinutes = duration * 8 * 60; // روز به دقیقه
      if (requiredMinutes > balance) {
        alert(`مانده مرخصی کافی نیست.`);
        return;
      }
    } else {
      const balance = getEmployeeLeaveBalance(formData.employee_id);
      const requiredMinutes = duration * 60; // ساعت به دقیقه
      if (requiredMinutes > balance) {
        alert(`مانده مرخصی کافی نیست.`);
        return;
      }
    }

    if (editingLeave) {
      const updates: Partial<Leave> = {
        employee_id: formData.employee_id,
        type: formData.type,
        leave_category: formData.leave_category,
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date.toISOString(),
        start_time: formData.type === 'hourly' ? formData.start_time : undefined,
        end_time: formData.type === 'hourly' ? formData.end_time : undefined,
        description: formData.description,
        duration
      };
      updateLeave(editingLeave.id, updates, currentUser?.id || '');
    } else {
      const newLeave: Omit<Leave, 'id' | 'created_at' | 'is_modified' | 'created_by'> = {
        employee_id: formData.employee_id,
        type: formData.type,
        leave_category: formData.leave_category,
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date.toISOString(),
        start_time: formData.type === 'hourly' ? formData.start_time : undefined,
        end_time: formData.type === 'hourly' ? formData.end_time : undefined,
        description: formData.description,
        duration
      };
      addLeave(newLeave, currentUser?.id || '');
    }

    setShowModal(false);
    resetForm();
  };

  const handleEdit = (leave: Leave) => {
    setEditingLeave(leave);
    setFormData({
      employee_id: leave.employee_id,
      type: leave.type,
      leave_category: leave.leave_category,
      start_date: new Date(leave.start_date),
      end_date: new Date(leave.end_date),
      start_time: leave.start_time || '08:00',
      end_time: leave.end_time || '17:00',
      description: leave.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = (leave: Leave) => {
    if (currentUser?.role !== 'admin') {
      alert('فقط مدیر می‌تواند مرخصی را حذف کند');
      return;
    }
    const employee = employees.find(emp => emp.id === leave.employee_id);
    if (confirm(`آیا از حذف مرخصی ${employee?.name || 'نامشخص'} اطمینان دارید؟`)) {
      deleteLeave(leave.id, currentUser?.id || '');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      type: 'daily',
      leave_category: 'entitled',
      start_date: new Date(),
      end_date: new Date(),
      start_time: '08:00',
      end_time: '17:00',
      description: ''
    });
    setEditingLeave(null);
  };

  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ثبت مرخصی</h1>
          <p className="text-gray-600 mt-1">ثبت مرخصی روزانه و ساعتی کارمندان</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          ثبت مرخصی جدید
        </button>
      </div>

      {/* Recent Leaves */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            آخرین مرخصی‌ها ({englishToPersianNumbers(leaves.length.toString())} مورد)
          </h3>
        </div>
        
        {leaves.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    کارمند
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نوع مرخصی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    دسته‌بندی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاریخ شروع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    مدت زمان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    توضیحات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.map((leave) => {
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.type === 'daily' 
                          ? `${englishToPersianNumbers(leave.duration.toString())} روز`
                          : formatDuration(leave.duration)
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {leave.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(leave)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {currentUser?.role === 'admin' && (
                            <button
                              onClick={() => handleDelete(leave)}
                              className="text-red-600 hover:text-red-900 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">هیچ مرخصی ثبت نشده</h3>
            <p className="mt-1 text-sm text-gray-500">
              اولین مرخصی را ثبت کنید.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingLeave ? 'ویرایش مرخصی' : 'ثبت مرخصی جدید'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Employee Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  انتخاب کارمند
                </label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">کارمند را انتخاب کنید</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} {employee.last_name} - {employee.employee_id}
                    </option>
                  ))}
                </select>
                {formData.employee_id && (
                  <p className="text-sm text-gray-600 mt-1">
                    مانده مرخصی: {formatLeaveBalance(getEmployeeLeaveBalance(formData.employee_id))}
                  </p>
                )}
              </div>

              {/* Leave Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع مرخصی
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="daily"
                      checked={formData.type === 'daily'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as LeaveType })}
                      className="form-radio text-green-600"
                    />
                    <span className="mr-2">مرخصی روزانه</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="hourly"
                      checked={formData.type === 'hourly'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as LeaveType })}
                      className="form-radio text-green-600"
                    />
                    <span className="mr-2">مرخصی ساعتی</span>
                  </label>
                </div>
              </div>

              {/* Leave Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  دسته‌بندی مرخصی
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="entitled"
                      checked={formData.leave_category === 'entitled'}
                      onChange={(e) => setFormData({ ...formData, leave_category: e.target.value as LeaveCategory })}
                      className="form-radio text-green-600"
                    />
                    <span className="mr-2">استحقاقی</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="medical"
                      checked={formData.leave_category === 'medical'}
                      onChange={(e) => setFormData({ ...formData, leave_category: e.target.value as LeaveCategory })}
                      className="form-radio text-green-600"
                    />
                    <span className="mr-2">استعلاجی</span>
                  </label>
                </div>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاریخ شروع
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowStartCalendar(!showStartCalendar)}
                    className="w-full text-right border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {formatPersianDate(formData.start_date)}
                  </button>
                  {showStartCalendar && (
                    <div className="mt-2">
                      <PersianCalendar
                        selectedDate={formData.start_date}
                        onDateSelect={(date) => {
                          setFormData({ ...formData, start_date: date });
                          setShowStartCalendar(false);
                        }}
                      />
                    </div>
                  )}
                </div>

                {formData.type === 'daily' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تاریخ پایان
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowEndCalendar(!showEndCalendar)}
                      className="w-full text-right border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {formatPersianDate(formData.end_date)}
                    </button>
                    {showEndCalendar && (
                      <div className="mt-2">
                        <PersianCalendar
                          selectedDate={formData.end_date}
                          onDateSelect={(date) => {
                            setFormData({ ...formData, end_date: date });
                            setShowEndCalendar(false);
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Time Selection for Hourly Leave */}
              {formData.type === 'hourly' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TimePicker
                    value={formData.start_time}
                    onChange={(time) => setFormData({ ...formData, start_time: time })}
                    label="ساعت شروع"
                  />
                  <TimePicker
                    value={formData.end_time}
                    onChange={(time) => setFormData({ ...formData, end_time: time })}
                    label="ساعت پایان"
                  />
                </div>
              )}

              {/* Duration Display */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  مدت زمان مرخصی: {formData.type === 'daily' 
                    ? `${englishToPersianNumbers(calculateDuration().toString())} روز`
                    : formatDuration(calculateDuration())
                  }
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  توضیحات (اختیاری)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="توضیحات اضافی در مورد مرخصی..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingLeave ? 'ویرایش مرخصی' : 'ثبت مرخصی'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
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

// Add missing imports
import { Edit2, Trash2 } from 'lucide-react';
import { LeaveCategory } from '../types';
import { useAuth } from '../hooks/useAuth';

export default LeaveManagement;