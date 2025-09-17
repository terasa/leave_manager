import { toJalaali, toGregorian, jalaaliMonthLength } from 'jalaali-js';

export const formatLeaveBalance = (totalMinutes: number): string => {
  const days = Math.floor(totalMinutes / (8 * 60)); // 8 ساعت کاری در روز
  const remainingMinutes = totalMinutes % (8 * 60);
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;
  
  let result = '';
  if (days > 0) {
    result += `${englishToPersianNumbers(days.toString())} روز`;
  }
  if (hours > 0) {
    if (result) result += ' و ';
    result += `${englishToPersianNumbers(hours.toString())} ساعت`;
  }
  if (minutes > 0) {
    if (result) result += ' و ';
    result += `${englishToPersianNumbers(minutes.toString())} دقیقه`;
  }
  
  return result || '۰ دقیقه';
};

export const formatPersianDate = (date: Date): string => {
  const jalaali = toJalaali(date);
  const months = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  
  return `${jalaali.jd} ${months[jalaali.jm - 1]} ${jalaali.jy}`;
};

export const formatTime = (time: string): string => {
  return time.replace(/:/g, ':');
};

export const persianToEnglishNumbers = (str: string): string => {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  let result = str;
  for (let i = 0; i < persianNumbers.length; i++) {
    result = result.replace(new RegExp(persianNumbers[i], 'g'), englishNumbers[i]);
  }
  return result;
};

export const englishToPersianNumbers = (str: string): string => {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  let result = str.toString();
  for (let i = 0; i < englishNumbers.length; i++) {
    result = result.replace(new RegExp(englishNumbers[i], 'g'), persianNumbers[i]);
  }
  return result;
};

export const formatDuration = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (wholeHours === 0) {
    return `${englishToPersianNumbers(minutes.toString())} دقیقه`;
  } else if (minutes === 0) {
    return `${englishToPersianNumbers(wholeHours.toString())} ساعت`;
  } else {
    return `${englishToPersianNumbers(wholeHours.toString())} ساعت و ${englishToPersianNumbers(minutes.toString())} دقیقه`;
  }
};

export const getJalaaliDate = (date: Date) => {
  return toJalaali(date);
};

export const getGregorianDate = (jy: number, jm: number, jd: number) => {
  const gregorian = toGregorian(jy, jm, jd);
  return new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
};