import React from 'react';
import { Users, Calendar, Clock, TrendingUp } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { englishToPersianNumbers, formatDuration } from '../utils/dateHelpers';

const Dashboard: React.FC = () => {
  const { employees, leaves, settings } = useLocalStorage();

  // محاسبه آمار
  const totalEmployees = employees.length;
  const totalLeaves = leaves.length;
  const dailyLeaves = leaves.filter(leave => leave.type === 'daily').length;
  const hourlyLeaves = leaves.filter(leave => leave.type === 'hourly').length;
  
  const currentYear = new Date().getFullYear();
  const currentYearLeaves = leaves.filter(leave => 
    new Date(leave.start_date).getFullYear() === currentYear
  );

  const stats = [
    {
      title: 'تعداد کارمندان',
      value: englishToPersianNumbers(totalEmployees.toString()),
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'کل مرخصی‌ها امسال',
      value: englishToPersianNumbers(currentYearLeaves.length.toString()),
      icon: Calendar,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'مرخصی‌های روزانه',
      value: englishToPersianNumbers(dailyLeaves.toString()),
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'مرخصی‌های ساعتی',
      value: englishToPersianNumbers(hourlyLeaves.toString()),
      icon: Clock,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  // آمار مرخصی‌های اخیر
  const recentLeaves = leaves
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">داشبورد مدیریت</h1>
        <p className="text-gray-600 mt-2">خلاصه وضعیت سیستم مدیریت مرخصی</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <div className="mr-4">
                  <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">آخرین مرخصی‌ها</h3>
          </div>
          <div className="p-6">
            {recentLeaves.length > 0 ? (
              <div className="space-y-4">
                {recentLeaves.map((leave) => {
                  const employee = employees.find(emp => emp.id === leave.employee_id);
                  return (
                    <div key={leave.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {employee ? `${employee.name} ${employee.last_name}` : 'نامشخص'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {leave.type === 'daily' ? 'مرخصی روزانه' : 'مرخصی ساعتی'}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {leave.type === 'daily' 
                            ? `${englishToPersianNumbers(leave.duration.toString())} روز`
                            : formatDuration(leave.duration)
                          }
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(leave.start_date).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">هیچ مرخصی ثبت نشده است</p>
            )}
          </div>
        </div>

        {/* Settings Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">تنظیمات سیستم</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">سقف مرخصی سالانه:</span>
                <span className="font-medium text-gray-900">
                  {englishToPersianNumbers(settings.annual_leave_limit.toString())} روز
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">تعداد کارمندان فعال:</span>
                <span className="font-medium text-gray-900">
                  {englishToPersianNumbers(totalEmployees.toString())} نفر
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">کل مرخصی‌ها:</span>
                <span className="font-medium text-gray-900">
                  {englishToPersianNumbers(totalLeaves.toString())} مورد
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;