import React from 'react';
import { englishToPersianNumbers, persianToEnglishNumbers } from '../utils/dateHelpers';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label: string;
  className?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, label, className = '' }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const [hour, minute] = value ? value.split(':') : ['08', '00'];

  const handleTimeChange = (newHour: string, newMinute: string) => {
    onChange(`${newHour}:${newMinute}`);
  };

  return (
    <div className={`${className}`} style={{ direction: 'rtl' }}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        <select
          value={hour}
          onChange={(e) => handleTimeChange(e.target.value, minute)}
          className="block w-20 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-center"
          style={{ direction: 'ltr' }}
        >
          {hours.map((h) => (
            <option key={h} value={h}>
              {englishToPersianNumbers(h)}
            </option>
          ))}
        </select>
        <span className="flex items-center text-gray-500">:</span>
        <select
          value={minute}
          onChange={(e) => handleTimeChange(hour, e.target.value)}
          className="block w-20 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-center"
          style={{ direction: 'ltr' }}
        >
          {minutes.map((m) => (
            <option key={m} value={m}>
              {englishToPersianNumbers(m)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TimePicker;