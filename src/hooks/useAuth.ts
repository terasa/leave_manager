import { useState, useEffect } from 'react';
import { User } from '../types';
import { useLogger } from './useLogger';
import { useActivation } from './useActivation';

export const useAuth = () => {
  const { activationStatus } = useActivation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { addLog } = useLogger();

  // تولید پیشوند منحصر به فرد برای هر کد فعال‌سازی
  const getStoragePrefix = () => {
    if (activationStatus.activationCode) {
      return `tenant_${activationStatus.activationCode}_`;
    }
    return 'default_';
  };

  useEffect(() => {
    const prefix = getStoragePrefix();
    // Initialize default admin user if not exists
    const savedUsers = localStorage.getItem(`${prefix}users`);
    if (!savedUsers) {
      const defaultAdmin: User = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        password: '1234',
        role: 'admin',
        created_at: new Date().toISOString()
      };
      localStorage.setItem(`${prefix}users`, JSON.stringify([defaultAdmin]));
    }

    // Initialize super admin user
    const superAdminUsers = localStorage.getItem('superadmin_users');
    if (!superAdminUsers) {
      const superAdmin: User = {
        id: 'superadmin',
        username: 'superadmin',
        email: 'ehsantaj@yahoo.com',
        password: 'superadmin2025',
        role: 'admin',
        created_at: new Date().toISOString()
      };
      localStorage.setItem('superadmin_users', JSON.stringify([superAdmin]));
    }

    const savedUserId = localStorage.getItem(`${prefix}currentUserId`);
    if (savedUserId) {
      const users: User[] = JSON.parse(localStorage.getItem(`${prefix}users`) || '[]');
      const user = users.find(u => u.id === savedUserId);
      if (user) {
        setCurrentUser(user);
      }
    } else {
      // Check for super admin session
      const superAdminUserId = localStorage.getItem('superadmin_currentUserId');
      if (superAdminUserId) {
        const superAdminUsers: User[] = JSON.parse(localStorage.getItem('superadmin_users') || '[]');
        const superUser = superAdminUsers.find(u => u.id === superAdminUserId);
        if (superUser) {
          setCurrentUser(superUser);
        }
      }
    }
    
    setLoading(false);
  }, [activationStatus.activationCode]);

  const login = (username: string, password: string): boolean => {
    // Check super admin first
    if (username === 'superadmin' && password === 'superadmin2025') {
      const superAdminUsers: User[] = JSON.parse(localStorage.getItem('superadmin_users') || '[]');
      const superUser = superAdminUsers.find(u => u.username === username && u.password === password);
      
      if (superUser) {
        setCurrentUser(superUser);
        localStorage.setItem('superadmin_currentUserId', superUser.id);
        addLog(superUser.id, superUser.username, 'login', 'user', superUser.id, { username });
        return true;
      }
    }

    // Regular user login
    const prefix = getStoragePrefix();
    const users: User[] = JSON.parse(localStorage.getItem(`${prefix}users`) || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(`${prefix}currentUserId`, user.id);
      addLog(user.id, user.username, 'login', 'user', user.id, { username });
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      addLog(currentUser.id, currentUser.username, 'logout', 'user', currentUser.id, { username: currentUser.username });
    }
    
    // Remove both regular and super admin sessions
    const prefix = getStoragePrefix();
    localStorage.removeItem(`${prefix}currentUserId`);
    localStorage.removeItem('superadmin_currentUserId');
    setCurrentUser(null);
  };

  const changePassword = (newPassword: string) => {
    const prefix = getStoragePrefix();
    if (currentUser) {
      const users: User[] = JSON.parse(localStorage.getItem(`${prefix}users`) || '[]');
      const updatedUsers = users.map(u => 
        u.id === currentUser.id ? { ...u, password: newPassword } : u
      );
      localStorage.setItem(`${prefix}users`, JSON.stringify(updatedUsers));
      setCurrentUser({ ...currentUser, password: newPassword });
      addLog(currentUser.id, currentUser.username, 'update', 'user', currentUser.id, { passwordChanged: true }, { username: currentUser.username });
    }
  };

  const addUser = (username: string, password: string, role: 'admin' | 'user') => {
    const prefix = getStoragePrefix();
    if (currentUser?.role !== 'admin') return false;
    
    const users: User[] = JSON.parse(localStorage.getItem(`${prefix}users`) || '[]');
    const existingUser = users.find(u => u.username === username);
    if (existingUser) return false;

    const newUser: User = {
      id: Date.now().toString(),
      username,
      password,
      role,
      created_at: new Date().toISOString()
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem(`${prefix}users`, JSON.stringify(updatedUsers));
    addLog(currentUser.id, currentUser.username, 'create', 'user', newUser.id, { username, role });
    return true;
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    const prefix = getStoragePrefix();
    if (currentUser?.role !== 'admin') return false;
    if (userId === currentUser.id && updates.role && updates.role !== 'admin') {
      // جلوگیری از تغییر نقش خود ادمین
      return false;
    }

    const users: User[] = JSON.parse(localStorage.getItem(`${prefix}users`) || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    const oldUser = users[userIndex];
    users[userIndex] = { ...oldUser, ...updates };
    localStorage.setItem(`${prefix}users`, JSON.stringify(users));
    
    addLog(currentUser.id, currentUser.username, 'update', 'user', userId, { ...oldUser, ...updates }, oldUser);
    return true;
  };

  const deleteUser = (userId: string) => {
    const prefix = getStoragePrefix();
    if (currentUser?.role !== 'admin') return false;
    if (userId === currentUser.id) {
      // جلوگیری از حذف خود ادمین
      return false;
    }

    const users: User[] = JSON.parse(localStorage.getItem(`${prefix}users`) || '[]');
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(`${prefix}users`, JSON.stringify(updatedUsers));
    
    addLog(currentUser.id, currentUser.username, 'delete', 'user', userId, user);
    return true;
  };

  const getUsers = (): User[] => {
    const prefix = getStoragePrefix();
    if (currentUser?.role !== 'admin') return [];
    return JSON.parse(localStorage.getItem(`${prefix}users`) || '[]');
  };

  return {
    currentUser,
    loading,
    login,
    logout,
    changePassword,
    addUser,
    updateUser,
    deleteUser,
    getUsers,
    isAdmin: currentUser?.role === 'admin'
  };
};