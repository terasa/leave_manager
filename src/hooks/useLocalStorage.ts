import { useState, useEffect } from 'react';
import { Employee, Leave, Settings } from '../types';

export const useLocalStorage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [settings, setSettings] = useState<Settings>({
    id: '1',
    annual_leave_limit: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Helper function to add logs
  const addLog = (
    userId: string,
    action: 'create' | 'update' | 'delete' | 'login' | 'logout',
    entityType: 'employee' | 'leave' | 'user' | 'settings',
    entityId?: string,
    details?: string
  ) => {
    const logEntry = {
      id: Date.now().toString(),
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || '',
      timestamp: new Date().toISOString()
    };

    const existingLogs = localStorage.getItem('system_logs');
    let logs = [];
    
    if (existingLogs) {
      try {
        const decryptedLogs = base64ToUtf8String(existingLogs);
        logs = JSON.parse(decryptedLogs);
      } catch {
        logs = [];
      }
    }

    logs.push(logEntry);
    const encryptedLogs = utf8ToBase64String(JSON.stringify(logs));
    localStorage.setItem('system_logs', encryptedLogs);
  };

  // Helper functions for encryption
  const utf8ToBase64String = (str: string): string => {
    return btoa(unescape(encodeURIComponent(str)));
  };

  const base64ToUtf8String = (str: string): string => {
    return decodeURIComponent(escape(atob(str)));
  };

  useEffect(() => {
    // Load data from localStorage on mount
    const savedEmployees = localStorage.getItem('employees');
    const savedLeaves = localStorage.getItem('leaves');
    const savedSettings = localStorage.getItem('settings');

    if (savedEmployees) {
      setEmployees(JSON.parse(savedEmployees));
    }
    if (savedLeaves) {
      setLeaves(JSON.parse(savedLeaves));
    }
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const saveEmployees = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    localStorage.setItem('employees', JSON.stringify(newEmployees));
  };

  const saveLeaves = (newLeaves: Leave[]) => {
    setLeaves(newLeaves);
    localStorage.setItem('leaves', JSON.stringify(newLeaves));
  };

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('settings', JSON.stringify(newSettings));
  };

  const addEmployee = (employee: Omit<Employee, 'id' | 'created_at'>, userId: string) => {
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    const newEmployees = [...employees, newEmployee];
    saveEmployees(newEmployees);
    addLog(userId, 'create', 'employee', newEmployee.id, `کارمند ${employee.name} ${employee.last_name} اضافه شد`);
    return newEmployee;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>, userId: string) => {
    const oldEmployee = employees.find(emp => emp.id === id);
    const newEmployees = employees.map(emp => 
      emp.id === id ? { ...emp, ...updates } : emp
    );
    saveEmployees(newEmployees);
    if (oldEmployee) {
      addLog(userId, 'update', 'employee', id, `کارمند ${oldEmployee.name} ${oldEmployee.last_name} ویرایش شد`);
    }
  };

  const deleteEmployee = (id: string, userId: string) => {
    const employee = employees.find(emp => emp.id === id);
    const newEmployees = employees.filter(emp => emp.id !== id);
    const newLeaves = leaves.filter(leave => leave.employee_id !== id);
    saveEmployees(newEmployees);
    saveLeaves(newLeaves);
    if (employee) {
      addLog(userId, 'delete', 'employee', id, `کارمند ${employee.name} ${employee.last_name} حذف شد`);
    }
  };

  const addLeave = (leave: Omit<Leave, 'id' | 'created_at' | 'is_modified' | 'created_by'>, userId: string) => {
    const newLeave: Leave = {
      ...leave,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      is_modified: false,
      created_by: userId
    };
    const newLeaves = [...leaves, newLeave];
    saveLeaves(newLeaves);
    const employee = employees.find(emp => emp.id === leave.employee_id);
    addLog(userId, 'create', 'leave', newLeave.id, `مرخصی ${leave.type === 'daily' ? 'روزانه' : 'ساعتی'} برای ${employee?.name || 'نامشخص'} ثبت شد`);
    return newLeave;
  };

  const updateLeave = (id: string, updates: Partial<Leave>, userId: string) => {
    const oldLeave = leaves.find(leave => leave.id === id);
    const newLeaves = leaves.map(leave => 
      leave.id === id ? { 
        ...leave, 
        ...updates, 
        updated_at: new Date().toISOString(),
        is_modified: true,
        updated_by: userId
      } : leave
    );
    saveLeaves(newLeaves);
    if (oldLeave) {
      const employee = employees.find(emp => emp.id === oldLeave.employee_id);
      addLog(userId, 'update', 'leave', id, `مرخصی ${employee?.name || 'نامشخص'} ویرایش شد`);
    }
  };

  const deleteLeave = (id: string, userId: string) => {
    const leave = leaves.find(l => l.id === id);
    const newLeaves = leaves.filter(leave => leave.id !== id);
    saveLeaves(newLeaves);
    if (leave) {
      const employee = employees.find(emp => emp.id === leave.employee_id);
      addLog(userId, 'delete', 'leave', id, `مرخصی ${employee?.name || 'نامشخص'} حذف شد`);
    }
  };

  return {
    employees,
    leaves,
    settings,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addLeave,
    updateLeave,
    deleteLeave,
    saveSettings
  };
};