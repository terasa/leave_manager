import React, { useState } from 'react';
import { toJalaali, toGregorian } from 'jalaali-js';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { englishToPersianNumbers } from '../utils/dateHelpers';

interface PersianCalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  className?: string;
}

const PersianCalendar: React.FC<PersianCalendarProps> = ({
  selectedDate,
  onDateSelect,
  className = ''
}) => {
  const today = new Date();
  const todayJalaali = toJalaali(today);
  
  const [currentMonth, setCurrentMonth] = useState(todayJalaali.jm);
  const [currentYear, setCurrentYear] = useState(todayJalaali.jy);

  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  const dayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = toGregorian(year, month, 1);
    const firstDayOfWeek = new Date(firstDay.gy, firstDay.gm - 1, firstDay.gd).getDay();
    const daysInMonth = month <= 6 ? 31 : month <= 11 ? 30 : year % 4 === 0 ? 29 : 28;
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < (firstDayOfWeek + 1) % 7; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const handleDateClick = (day: number) => {
    const gregorianDate = toGregorian(currentYear, currentMonth, day);
    const date = new Date(gregorianDate.gy, gregorianDate.gm - 1, gregorianDate.gd);
    onDateSelect(date);
  };

  const navigateMonth = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    }
  };

  const days = getDaysInMonth(currentYear, currentMonth);
  const selectedJalaali = selectedDate ? toJalaali(selectedDate) : null;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg p-2 lg:p-4 ${className}`} style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 lg:mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1 lg:p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" />
        </button>
        
        <h3 className="text-sm lg:text-lg font-semibold text-gray-800">
          {monthNames[currentMonth - 1]} {englishToPersianNumbers(currentYear.toString())}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-1 lg:p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-1 lg:mb-2">
        {dayNames.map((day, index) => (
          <div key={index} className="text-center text-xs lg:text-sm font-medium text-gray-500 p-1 lg:p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div key={index} className="text-center">
            {day ? (
              <button
                onClick={() => handleDateClick(day)}
                className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                  selectedJalaali && 
                  selectedJalaali.jy === currentYear && 
                  selectedJalaali.jm === currentMonth && 
                  selectedJalaali.jd === day
                    ? 'bg-blue-500 text-white'
                    : todayJalaali.jy === currentYear && 
                      todayJalaali.jm === currentMonth && 
                      todayJalaali.jd === day
                    ? 'bg-green-100 text-green-800 font-bold'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {englishToPersianNumbers(day.toString())}
              </button>
            ) : (
              <div className="w-8 h-8 lg:w-10 lg:h-10" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersianCalendar;