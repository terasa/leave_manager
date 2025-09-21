import React from 'react';
import { Calendar, Shield, Users, BarChart3, CheckCircle, ArrowLeft } from 'lucide-react';

interface LandingPageProps {
  onEnterSystem: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterSystem }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50" style={{ direction: 'rtl' }}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 ml-2" />
              <span className="text-xl font-bold text-gray-900">سیستم مدیریت مرخصی حسا</span>
            </div>
            <button
              onClick={onEnterSystem}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              ورود به سیستم
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-8">
            <Calendar className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            سیستم مدیریت مرخصی
            <span className="text-blue-600 block">حسا</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            راه‌حل جامع و حرفه‌ای برای مدیریت مرخصی‌های کارکنان با امکانات پیشرفته و رابط کاربری ساده
          </p>
          <button
            onClick={onEnterSystem}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors text-lg font-medium flex items-center gap-3 mx-auto"
          >
            شروع استفاده
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">ویژگی‌های کلیدی</h2>
            <p className="text-gray-600 text-lg">همه چیزی که برای مدیریت مرخصی‌ها نیاز دارید</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">مدیریت کارمندان</h3>
              <p className="text-gray-600">افزودن، ویرایش و مدیریت اطلاعات کارمندان به صورت ساده و سریع</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">ثبت مرخصی</h3>
              <p className="text-gray-600">ثبت مرخصی‌های روزانه و ساعتی با تقویم شمسی و محاسبه خودکار</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">گزارش‌گیری</h3>
              <p className="text-gray-600">تولید گزارش‌های تفصیلی و خروجی Excel با فرمت فارسی</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">امنیت بالا</h3>
              <p className="text-gray-600">سیستم کاربری چندسطحه با لاگ‌گیری کامل فعالیت‌ها</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">چرا سیستم مدیریت مرخصی حسا؟</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">رابط کاربری فارسی</h3>
                    <p className="text-gray-600">طراحی شده مخصوص کاربران فارسی‌زبان با تقویم شمسی</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">محاسبه خودکار</h3>
                    <p className="text-gray-600">محاسبه خودکار مانده مرخصی و کنترل سقف مجاز</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">پشتیبان‌گیری آسان</h3>
                    <p className="text-gray-600">امکان پشتیبان‌گیری و بازیابی اطلاعات به راحتی</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">گزارش‌های حرفه‌ای</h3>
                    <p className="text-gray-600">خروجی Excel با فرمت فارسی و جزئیات کامل</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <Shield className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">آماده برای شروع؟</h3>
                <p className="text-gray-600 mb-6">
                  همین حالا وارد سیستم شوید و مدیریت مرخصی‌ها را ساده‌تر کنید
                </p>
                <button
                  onClick={onEnterSystem}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  ورود به سیستم
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-400 ml-2" />
            <span className="text-xl font-bold">سیستم مدیریت مرخصی حسا</span>
          </div>
          <p className="text-gray-400 mb-4">
            راه‌حل حرفه‌ای برای مدیریت مرخصی‌های سازمان
          </p>
          <p className="text-gray-500 text-sm">
            © ۱۴۰۴ تمامی حقوق محفوظ است - طراحی و توسعه: احسان تاج الدینی
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;