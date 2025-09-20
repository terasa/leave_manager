import React from 'react';
import { Info, User, Calendar, Shield, Heart, Users } from 'lucide-react';
import { englishToPersianNumbers } from '../utils/dateHelpers';

const About: React.FC = () => {
  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">درباره برنامه</h1>
        <p className="text-gray-600 mt-1">اطلاعات کامل درباره سیستم مدیریت مرخصی حسا</p>
      </div>

      {/* Main Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Info className="w-5 h-5" />
            معرفی برنامه
          </h3>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              سیستم مدیریت مرخصی حسا
            </h2>
            <p className="text-gray-600">
              نسخه {englishToPersianNumbers('1.0.0')}
            </p>
          </div>
          
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
            <p className="mb-4">
              سیستم مدیریت مرخصی حسا یک نرم‌افزار جامع و کاربردی برای مدیریت مرخصی‌های کارکنان است که با هدف 
              ساده‌سازی فرآیندهای اداری و بهبود کارایی سازمان‌ها طراحی شده است.
            </p>
            
            <p className="mb-4">
              این سیستم امکان ثبت، ویرایش و پیگیری مرخصی‌های روزانه و ساعتی کارمندان را فراهم می‌کند و 
              گزارش‌های تفصیلی از وضعیت مرخصی هر کارمند ارائه می‌دهد.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">ویژگی‌های کلیدی</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">مدیریت کارمندان</h4>
                  <p className="text-sm text-gray-600">افزودن، ویرایش و مدیریت اطلاعات کارمندان</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">ثبت مرخصی</h4>
                  <p className="text-sm text-gray-600">ثبت مرخصی‌های روزانه و ساعتی با تقویم فارسی</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">مدیریت دسترسی</h4>
                  <p className="text-sm text-gray-600">سیستم کاربری با سطوح دسترسی مختلف</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Info className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">گزارش‌گیری پیشرفته</h4>
                  <p className="text-sm text-gray-600">تولید گزارش‌های تفصیلی و خروجی Excel</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">تقویم فارسی</h4>
                  <p className="text-sm text-gray-600">پشتیبانی کامل از تقویم شمسی و اعداد فارسی</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">پشتیبان‌گیری</h4>
                  <p className="text-sm text-gray-600">امکان پشتیبان‌گیری و بازیابی اطلاعات</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Info className="w-5 h-5" />
            مشخصات فنی
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">تکنولوژی‌های استفاده شده</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• React {englishToPersianNumbers('18')}</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Vite</li>
                <li>• ExcelJS</li>
                <li>• Jalaali-js</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">ویژگی‌های فنی</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• رابط کاربری ریسپانسیو</li>
                <li>• پشتیبانی کامل از RTL</li>
                <li>• ذخیره‌سازی محلی</li>
                <li>• سیستم لاگ‌گیری پیشرفته</li>
                <li>• خروجی Excel با فرمت فارسی</li>
                <li>• تقویم شمسی تعاملی</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Info and Copyright */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5" />
            اطلاعات سازنده و حق نشر
          </h3>
        </div>
        
        <div className="p-6">
          <div className="text-center space-y-6">
            <div>
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Ehsan Taj</h4>
              <p className="text-gray-600 mb-2">توسعه‌دهنده نرم‌افزار</p>
              <p className="text-blue-600 text-sm">ehsantaj@yahoo.com</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
              <p className="mb-2">
                این نرم‌افزار با استفاده از تکنولوژی‌های مدرن وب شامل React، TypeScript و Tailwind CSS توسعه یافته است.
              </p>
              <p>
                طراحی رابط کاربری با در نظر گیری اصول UX/UI و سازگاری کامل با زبان فارسی انجام شده است.
              </p>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p className="font-medium">
                  © {englishToPersianNumbers('2025')} احسان تاج الدینی. تمامی حقوق محفوظ است.
                </p>
                <p>
                  این نرم‌افزار تحت مجوز اختصاصی توسعه یافته و استفاده تجاری از آن منوط به کسب مجوز از سازنده است.
                </p>
                <p className="text-xs text-gray-500">
                  نسخه {englishToPersianNumbers('1.0.0')} - آخرین بروزرسانی: {englishToPersianNumbers('1404/01/01')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;