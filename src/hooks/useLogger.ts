import { LogEntry } from '../types';

// سیستم لاگ‌گیری پیشرفته
export class Logger {
  private static instance: Logger;
  
  private constructor() {}
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // دریافت اطلاعات سیستم
  private getSystemInfo() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const screenResolution = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // شناسایی مرورگر
    let browserName = 'Unknown';
    if (userAgent.includes('Chrome')) browserName = 'Chrome';
    else if (userAgent.includes('Firefox')) browserName = 'Firefox';
    else if (userAgent.includes('Safari')) browserName = 'Safari';
    else if (userAgent.includes('Edge')) browserName = 'Edge';
    
    // شناسایی سیستم عامل
    let osName = 'Unknown';
    if (platform.includes('Win')) osName = 'Windows';
    else if (platform.includes('Mac')) osName = 'macOS';
    else if (platform.includes('Linux')) osName = 'Linux';
    else if (platform.includes('Android')) osName = 'Android';
    else if (platform.includes('iPhone') || platform.includes('iPad')) osName = 'iOS';

    return {
      browser: browserName,
      os: osName,
      platform,
      language,
      screenResolution,
      timezone,
      userAgent: userAgent.substring(0, 100) // محدود کردن طول
    };
  }

  // ایجاد شناسه منحصر به فرد برای session
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  // تولید جزئیات کامل برای هر نوع عملیات
  private generateDetailedDescription(
    action: LogEntry['action'],
    entityType: LogEntry['entity_type'],
    entityData?: any,
    oldData?: any
  ): string {
    const timestamp = new Date().toLocaleString('fa-IR');
    
    switch (action) {
      case 'login':
        return `کاربر با موفقیت وارد سیستم شد - زمان: ${timestamp}`;
      
      case 'logout':
        return `کاربر از سیستم خارج شد - زمان: ${timestamp}`;
      
      case 'create':
        switch (entityType) {
          case 'employee':
            return `کارمند جدید ایجاد شد - نام: ${entityData?.name} ${entityData?.last_name} - کد پرسنلی: ${entityData?.employee_id} - سمت: ${entityData?.position} - زمان: ${timestamp}`;
          
          case 'leave':
            const leaveType = entityData?.type === 'daily' ? 'روزانه' : 'ساعتی';
            const category = entityData?.leave_category === 'medical' ? 'استعلاجی' : 'استحقاقی';
            return `مرخصی ${leaveType} ${category} ثبت شد - مدت: ${entityData?.duration} ${entityData?.type === 'daily' ? 'روز' : 'ساعت'} - تاریخ شروع: ${entityData?.start_date} - توضیحات: ${entityData?.description || 'ندارد'} - زمان ثبت: ${timestamp}`;
          
          case 'user':
            return `کاربر جدید ایجاد شد - نام کاربری: ${entityData?.username} - نقش: ${entityData?.role === 'admin' ? 'مدیر' : 'کاربر عادی'} - زمان: ${timestamp}`;
          
          default:
            return `موجودیت جدید از نوع ${entityType} ایجاد شد - زمان: ${timestamp}`;
        }
      
      case 'update':
        switch (entityType) {
          case 'employee':
            let changes = [];
            if (oldData?.name !== entityData?.name) changes.push(`نام: ${oldData?.name} → ${entityData?.name}`);
            if (oldData?.last_name !== entityData?.last_name) changes.push(`نام خانوادگی: ${oldData?.last_name} → ${entityData?.last_name}`);
            if (oldData?.employee_id !== entityData?.employee_id) changes.push(`کد پرسنلی: ${oldData?.employee_id} → ${entityData?.employee_id}`);
            if (oldData?.position !== entityData?.position) changes.push(`سمت: ${oldData?.position} → ${entityData?.position}`);
            return `کارمند ویرایش شد - تغییرات: ${changes.join(', ')} - زمان: ${timestamp}`;
          
          case 'leave':
            return `مرخصی ویرایش شد - شناسه: ${entityData?.id} - زمان ویرایش: ${timestamp}`;
          
          case 'user':
            let userChanges = [];
            if (oldData?.username !== entityData?.username) userChanges.push(`نام کاربری: ${oldData?.username} → ${entityData?.username}`);
            if (oldData?.role !== entityData?.role) userChanges.push(`نقش: ${oldData?.role === 'admin' ? 'مدیر' : 'کاربر'} → ${entityData?.role === 'admin' ? 'مدیر' : 'کاربر'}`);
            if (entityData?.passwordChanged) userChanges.push('رمز عبور تغییر کرد');
            return `کاربر ویرایش شد - تغییرات: ${userChanges.join(', ')} - زمان: ${timestamp}`;
          
          case 'settings':
            return `تنظیمات سیستم ویرایش شد - ${entityData?.description || 'تغییرات عمومی'} - زمان: ${timestamp}`;
          
          default:
            return `موجودیت ${entityType} ویرایش شد - زمان: ${timestamp}`;
        }
      
      case 'delete':
        switch (entityType) {
          case 'employee':
            return `کارمند حذف شد - نام: ${entityData?.name} ${entityData?.last_name} - کد پرسنلی: ${entityData?.employee_id} - زمان: ${timestamp}`;
          
          case 'leave':
            return `مرخصی حذف شد - شناسه: ${entityData?.id} - زمان: ${timestamp}`;
          
          case 'user':
            return `کاربر حذف شد - نام کاربری: ${entityData?.username} - نقش: ${entityData?.role === 'admin' ? 'مدیر' : 'کاربر'} - زمان: ${timestamp}`;
          
          default:
            return `موجودیت ${entityType} حذف شد - زمان: ${timestamp}`;
        }
      
      default:
        return `عملیات ${action} روی ${entityType} انجام شد - زمان: ${timestamp}`;
    }
  }

  // ثبت لاگ با جزئیات کامل
  addLog(
    userId: string,
    username: string,
    action: LogEntry['action'],
    entityType: LogEntry['entity_type'],
    entityId?: string,
    entityData?: any,
    oldData?: any
  ) {
    try {
      const systemInfo = this.getSystemInfo();
      const sessionId = this.getSessionId();
      const detailedDescription = this.generateDetailedDescription(action, entityType, entityData, oldData);
      
      const logEntry: LogEntry & {
        username: string;
        session_id: string;
        system_info: any;
        ip_address: string;
      } = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        user_id: userId,
        username,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: detailedDescription,
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        system_info: systemInfo,
        ip_address: 'Local' // در محیط محلی
      };

      // دریافت لاگ‌های موجود
      const existingLogs = this.getLogs();
      const updatedLogs = [...existingLogs, logEntry];
      
      // ذخیره با رمزنگاری ساده
      const encodedLogs = btoa(encodeURIComponent(JSON.stringify(updatedLogs)));
      localStorage.setItem('system_logs_v2', encodedLogs);
      
      console.log('Log added successfully:', logEntry);
    } catch (error) {
      console.error('Error adding log:', error);
    }
  }

  // دریافت لاگ‌ها
  getLogs(): any[] {
    try {
      const encodedLogs = localStorage.getItem('system_logs_v2');
      if (!encodedLogs) return [];
      
      const decodedLogs = JSON.parse(decodeURIComponent(atob(encodedLogs)));
      return Array.isArray(decodedLogs) ? decodedLogs : [];
    } catch (error) {
      console.error('Error getting logs:', error);
      return [];
    }
  }

  // پاک کردن لاگ‌ها (فقط برای ادمین)
  clearLogs() {
    localStorage.removeItem('system_logs_v2');
  }
}

export const useLogger = () => {
  const logger = Logger.getInstance();
  
  return {
    addLog: (userId: string, username: string, action: LogEntry['action'], entityType: LogEntry['entity_type'], entityId?: string, entityData?: any, oldData?: any) => {
      logger.addLog(userId, username, action, entityType, entityId, entityData, oldData);
    },
    getLogs: () => logger.getLogs(),
    clearLogs: () => logger.clearLogs()
  };
};