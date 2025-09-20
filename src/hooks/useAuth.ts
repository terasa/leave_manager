import { useState, useEffect } from 'react';
import { User } from '../types';
import { useLogger } from './useLogger';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { addLog } = useLogger();

  // Check for Supabase auth session
  useEffect(() => {
    const checkSupabaseAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const supabaseUser: User = {
            id: session.user.id,
            username: session.user.email || 'کاربر',
            email: session.user.email || '',
            password: '', // Not needed for Supabase auth
            role: 'user',
            created_at: session.user.created_at || new Date().toISOString()
          };
          setCurrentUser(supabaseUser);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log('Supabase auth not available, falling back to local auth');
      }
      
      // Fallback to local auth
      checkLocalAuth();
    };

    checkSupabaseAuth();
  }, []);

  const checkLocalAuth = () => {
    // Initialize default admin user if not exists
    const savedUsers = localStorage.getItem('users');
    if (!savedUsers) {
      const defaultAdmin: User = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
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

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Google login error:', error);
      // Fallback to local auth with demo user
      const demoUser: User = {
        id: 'demo-google',
        username: 'کاربر Google',
        email: 'user@gmail.com',
        password: '',
        role: 'user',
        created_at: new Date().toISOString()
      };
      setCurrentUser(demoUser);
      localStorage.setItem('currentUserId', demoUser.id);
    }
  };

  const loginWithEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Email login error:', error);
      // Fallback to local auth
      const demoUser: User = {
        id: 'demo-email',
        username: email,
        email: email,
        password: '',
        role: 'user',
        created_at: new Date().toISOString()
      };
      setCurrentUser(demoUser);
      localStorage.setItem('currentUserId', demoUser.id);
    }
  };

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
    // Try Supabase logout first
    supabase.auth.signOut().catch(() => {
      // Ignore errors, fallback to local logout
    });
    
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
    loginWithGoogle,
    loginWithEmail,
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