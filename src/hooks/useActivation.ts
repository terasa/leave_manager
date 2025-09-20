import { useState, useEffect } from 'react';

interface ActivationStatus {
  isActivated: boolean;
  activationCode?: string;
  activatedAt?: string;
  expiresAt?: string;
}

// کدهای فعال‌سازی از پیش تعریف شده (بعداً با API جایگزین می‌شود)
const VALID_ACTIVATION_CODES = [
  'HESA-2025-DEMO-001',
  'HESA-2025-FULL-002',
  'HESA-2025-TRIAL-003',
  'HESA-ADMIN-2025-004',
  'HESA-PRO-LICENSE-005'
];

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

  const activate = (code: string): { success: boolean; message: string } => {
    const cleanCode = code.trim().toUpperCase();
    
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
      // کدهای آزمایشی 30 روز اعتبار دارند
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      expiresAt = expiry.toISOString();
    }
    // کدهای FULL و PRO بدون انقضا هستند

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
    } else if (activationStatus.activationCode?.includes('FULL')) {
      info.licenseType = 'کامل';
    } else if (activationStatus.activationCode?.includes('PRO')) {
      info.licenseType = 'حرفه‌ای';
    } else if (activationStatus.activationCode?.includes('DEMO')) {
      info.licenseType = 'نمایشی';
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