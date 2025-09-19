import { useState, useEffect } from 'react';
import { User } from '../types';
import { useLogger } from './useLogger';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { addLog } = useLogger();


  useEffect(() => {
    const checkAuth = () => {
      // Initialize default admin user if not exists
      const savedUsers = localStorage.getItem('users');
      if (!savedUsers) {
        const defaultAdmin: User = {
          id: '1',
          username: 'admin',
          password: '1234',
          role: 'admin',
          created_at: new Date().toISOString()
        };
        localStorage.setItem('users', JSON.stringify([defaultAdmin]));
      }

      const savedUserId = localStorage.getItem('currentUserId');
      if (savedUserId) {
        const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.id === savedUserId);
        if (user) {
          setCurrentUser(user);
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (username: string, password: string): boolean => {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUserId', user.id);
      addLog(user.id, user.username, 'login', 'user', user.id, { username });
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      addLog(currentUser.id, currentUser.username, 'logout', 'user', currentUser.id, { username: currentUser.username });
    }
    localStorage.removeItem('currentUserId');
    setCurrentUser(null);
  };

  const changePassword = (newPassword: string) => {
    if (currentUser) {
      const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map(u => 
        u.id === currentUser.id ? { ...u, password: newPassword } : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setCurrentUser({ ...currentUser, password: newPassword });
      addLog(currentUser.id, currentUser.username, 'update', 'user', currentUser.id, { passwordChanged: true }, { username: currentUser.username });
    }
  };

  const addUser = (username: string, password: string, role: 'admin' | 'user') => {
    if (currentUser?.role !== 'admin') return false;
    
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
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
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    addLog(currentUser.id, currentUser.username, 'create', 'user', newUser.id, { username, role });
    return true;
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    if (currentUser?.role !== 'admin') return false;
    if (userId === currentUser.id && updates.role && updates.role !== 'admin') {
      // جلوگیری از تغییر نقش خود ادمین
      return false;
    }

    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    const oldUser = users[userIndex];
    users[userIndex] = { ...oldUser, ...updates };
    localStorage.setItem('users', JSON.stringify(users));
    
    addLog(currentUser.id, currentUser.username, 'update', 'user', userId, { ...oldUser, ...updates }, oldUser);
    return true;
  };

  const deleteUser = (userId: string) => {
    if (currentUser?.role !== 'admin') return false;
    if (userId === currentUser.id) {
      // جلوگیری از حذف خود ادمین
      return false;
    }

    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    addLog(currentUser.id, currentUser.username, 'delete', 'user', userId, user);
    return true;
  };

  const getUsers = (): User[] => {
    if (currentUser?.role !== 'admin') return [];
    return JSON.parse(localStorage.getItem('users') || '[]');
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