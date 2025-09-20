import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ActivationStatus {
  isActivated: boolean;
  activationCode?: string;
  activatedAt?: string;
  expiresAt?: string;
}

// کدهای فعال‌سازی از پیش تعریف شده (بعداً با API جایگزین می‌شود)
const VALID_ACTIVATION_CODES = [
  'HESA-ADMIN-2025-001',
  'HESA-TRIAL-2025-002'
];

// تولید شناسه منحصر به فرد برای دستگاه
const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('Device fingerprint', 10, 10);
  const canvasFingerprint = canvas.toDataURL();
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvasFingerprint.slice(-50)
  ].join('|');
  
  // ساده‌سازی به hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // تبدیل به 32bit integer
  }
  return Math.abs(hash).toString(36);
};
export const useActivation = () => {
  const [activationStatus, setActivationStatus] = useState<ActivationStatus>({
    isActivated: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkActivationStatus();
  }, []);

  const checkActivationStatus = () => {
    try {
      const savedActivation = localStorage.getItem('activation_status');
      if (savedActivation) {
        const activation: ActivationStatus = JSON.parse(savedActivation);
        
        // بررسی انقضا (اگر تاریخ انقضا تنظیم شده باشد)
        if (activation.expiresAt) {
          const now = new Date();
          const expiryDate = new Date(activation.expiresAt);
          if (now > expiryDate) {
            // کد منقضی شده
            deactivate();
            setLoading(false);
            return;
          }
        }
        
        setActivationStatus(activation);
      }
    } catch (error) {
      console.error('Error checking activation status:', error);
    }
    setLoading(false);
  };

  const validateActivationCode = (code: string): boolean => {
    // حذف فاصله‌ها و تبدیل به حروف بزرگ
    const cleanCode = code.trim().toUpperCase();
    return VALID_ACTIVATION_CODES.includes(cleanCode);
  };

  const activate = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    
    try {
      // تولید شناسه دستگاه
      const deviceFingerprint = generateDeviceFingerprint();
      
      // ارسال درخواست به Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('validate-activation', {
        body: {
          code: cleanCode,
          deviceFingerprint,
          userAgent: navigator.userAgent,
          ipAddress: 'client' // در محیط مرورگر نمی‌توان IP واقعی دریافت کرد
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        // fallback به روش محلی
        return activateLocally(cleanCode);
      }

      if (data.success) {
        const activationData: ActivationStatus = {
          isActivated: true,
          activationCode: cleanCode,
          activatedAt: new Date().toISOString(),
          expiresAt: data.expiresAt
        };

        localStorage.setItem('activation_status', JSON.stringify(activationData));
        setActivationStatus(activationData);

        return {
          success: true,
          message: data.message || 'نرم‌افزار با موفقیت فعال شد'
        };
      } else {
        return {
          success: false,
          message: data.message || 'خطا در فعال‌سازی'
        };
      }
    } catch (error) {
      console.error('Activation error:', error);
      // fallback به روش محلی
      return activateLocally(cleanCode);
    }
  };

  const activateLocally = (cleanCode: string): { success: boolean; message: string } => {
    if (!validateActivationCode(cleanCode)) {
      return {
        success: false,
        message: 'کد فعال‌سازی نامعتبر است'
      };
    }

    // بررسی اینکه کد قبلاً استفاده شده یا نه (در نسخه واقعی از API بررسی می‌شود)
    const usedCodes = JSON.parse(localStorage.getItem('used_activation_codes') || '[]');
    if (usedCodes.includes(cleanCode)) {
      return {
        success: false,
        message: 'این کد فعال‌سازی قبلاً استفاده شده است'
      };
    }

    // تعیین تاریخ انقضا بر اساس نوع کد
    let expiresAt: string | undefined;
    if (cleanCode.includes('TRIAL')) {
      // کدهای آزمایشی 1 روز اعتبار دارند
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 1);
      expiresAt = expiry.toISOString();
    }
    // کدهای ADMIN بدون انقضا هستند

    const activationData: ActivationStatus = {
      isActivated: true,
      activationCode: cleanCode,
      activatedAt: new Date().toISOString(),
      expiresAt
    };

    // ذخیره وضعیت فعال‌سازی
    localStorage.setItem('activation_status', JSON.stringify(activationData));
    
    // اضافه کردن کد به لیست کدهای استفاده شده
    const updatedUsedCodes = [...usedCodes, cleanCode];
    localStorage.setItem('used_activation_codes', JSON.stringify(updatedUsedCodes));

    setActivationStatus(activationData);

    return {
      success: true,
      message: 'نرم‌افزار با موفقیت فعال شد'
    };
  };

  const deactivate = () => {
    localStorage.removeItem('activation_status');
    setActivationStatus({ isActivated: false });
  };

  const getActivationInfo = () => {
    if (!activationStatus.isActivated) return null;

    const info = {
      code: activationStatus.activationCode,
      activatedAt: activationStatus.activatedAt,
      expiresAt: activationStatus.expiresAt,
      isExpired: false,
      daysRemaining: null as number | null,
      licenseType: 'نامشخص'
    };

    // تعیین نوع مجوز
    if (activationStatus.activationCode?.includes('TRIAL')) {
      info.licenseType = 'آزمایشی';
    } else if (activationStatus.activationCode?.includes('ADMIN')) {
      info.licenseType = 'مدیریت';
    }

    // محاسبه روزهای باقی‌مانده
    if (activationStatus.expiresAt) {
      const now = new Date();
      const expiry = new Date(activationStatus.expiresAt);
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      info.daysRemaining = Math.max(0, diffDays);
      info.isExpired = diffDays <= 0;
    }

    return info;
  };

  return {
    activationStatus,
    loading,
    activate,
    deactivate,
    getActivationInfo,
    checkActivationStatus
  };
};