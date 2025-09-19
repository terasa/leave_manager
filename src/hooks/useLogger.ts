import { LogEntry } from '../types';

// Helper functions to safely handle UTF-8 strings with Base64
const utf8ToBase64String = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};

const base64ToUtf8String = (str: string): string => {
  return decodeURIComponent(escape(atob(str)));
};

// Simple encryption for logs (Base64 + simple cipher)
const encryptLog = (data: string): string => {
  const cipher = (str: string) => {
    return str.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) + 3)
    ).join('');
  };
  try {
    return utf8ToBase64String(cipher(data));
  } catch (error) {
    console.error('Error encrypting log:', error);
    return utf8ToBase64String(data); // fallback without cipher
  }
};

const decryptLog = (encryptedData: string): string => {
  const decipher = (str: string) => {
    return str.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) - 3)
    ).join('');
  };
  try {
    const decrypted = base64ToUtf8String(encryptedData);
    return decipher(decrypted);
  } catch (error) {
    console.error('Error decrypting log:', error);
    try {
      // Try without decipher as fallback
      return base64ToUtf8String(encryptedData);
    } catch {
      return '';
    }
  }
};

export const useLogger = () => {
  const addLog = (
    userId: string,
    action: LogEntry['action'],
    entityType: LogEntry['entity_type'],
    entityId?: string,
    details?: string
  ) => {
    const logEntry: LogEntry = {
      id: Date.now().toString(),
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || '',
      timestamp: new Date().toISOString()
    };

    const existingLogs = localStorage.getItem('system_logs');
    let logs: LogEntry[] = [];
    
    if (existingLogs) {
      try {
        const decryptedLogs = decryptLog(existingLogs);
        if (decryptedLogs) {
          logs = JSON.parse(decryptedLogs);
        }
      } catch {
        logs = [];
      }
    }

    logs.push(logEntry);
    const encryptedLogs = encryptLog(JSON.stringify(logs));
    localStorage.setItem('system_logs', encryptedLogs);
  };

  const getLogs = (isAdmin: boolean): LogEntry[] => {
    if (!isAdmin) return [];
    
    const existingLogs = localStorage.getItem('system_logs');
    if (!existingLogs) return [];

    try {
      const decryptedLogs = decryptLog(existingLogs);
      if (decryptedLogs) {
        return JSON.parse(decryptedLogs);
      }
      return [];
    } catch {
      return [];
    }
  };

  return { addLog, getLogs };
};