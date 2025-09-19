import { useState, useEffect } from 'react';
import { Employee, Leave, Settings } from '../types';
import { useLogger } from './useLogger';
import { useAuth } from './useAuth';

export const useLocalStorage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [settings, setSettings] = useState<Settings>({
    id: '1',
    annual_leave_limit: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const { addLog } = useLogger();

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

  const addEmployee = (employee: Omit<Employee, 'id' | 'created_at'>, userId: string, username: string) => {
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    const newEmployees = [...employees, newEmployee];
    saveEmployees(newEmployees);
    addLog(userId, username, 'create', 'employee', newEmployee.id, newEmployee);
    return newEmployee;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>, userId: string, username: string) => {
    const oldEmployee = employees.find(emp => emp.id === id);
    const newEmployees = employees.map(emp => 
      emp.id === id ? { ...emp, ...updates } : emp
    );
    saveEmployees(newEmployees);
    if (oldEmployee) {
      const updatedEmployee = { ...oldEmployee, ...updates };
      addLog(userId, username, 'update', 'employee', id, updatedEmployee, oldEmployee);
    }
  };

  const deleteEmployee = (id: string, userId: string, username: string) => {
    const employee = employees.find(emp => emp.id === id);
    const newEmployees = employees.filter(emp => emp.id !== id);
    const newLeaves = leaves.filter(leave => leave.employee_id !== id);
    saveEmployees(newEmployees);
    saveLeaves(newLeaves);
    if (employee) {
      addLog(userId, username, 'delete', 'employee', id, employee);
    }
  };

  const addLeave = (leave: Omit<Leave, 'id' | 'created_at' | 'is_modified' | 'created_by'>, userId: string, username: string) => {
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
    addLog(userId, username, 'create', 'leave', newLeave.id, { ...newLeave, employee_name: employee ? `${employee.name} ${employee.last_name}` : 'نامشخص' });
    return newLeave;
  };

  const updateLeave = (id: string, updates: Partial<Leave>, userId: string, username: string) => {
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
      const updatedLeave = { ...oldLeave, ...updates };
      addLog(userId, username, 'update', 'leave', id, { ...updatedLeave, employee_name: employee ? `${employee.name} ${employee.last_name}` : 'نامشخص' }, { ...oldLeave, employee_name: employee ? `${employee.name} ${employee.last_name}` : 'نامشخص' });
    }
  };

  const deleteLeave = (id: string, userId: string, username: string) => {
    const leave = leaves.find(l => l.id === id);
    const newLeaves = leaves.filter(leave => leave.id !== id);
    saveLeaves(newLeaves);
    if (leave) {
      const employee = employees.find(emp => emp.id === leave.employee_id);
      addLog(userId, username, 'delete', 'leave', id, { ...leave, employee_name: employee ? `${employee.name} ${employee.last_name}` : 'نامشخص' });
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