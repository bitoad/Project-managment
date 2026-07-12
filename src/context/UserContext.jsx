import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { teamApi, authApi } from '../api/api.js';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(
    () => {
      try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); }
      catch { return null; }
    }
  );
  const [team, setTeam] = useState([]);

  const loadTeam = useCallback(async () => {
    try {
      const list = await teamApi.getAll();
      setTeam(list);
    } catch (e) {
      console.error('Load team error', e);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  // Khi đổi dự án → tải lại team (lắng nghe currentProjectId thay đổi qua storage event)
  useEffect(() => {
    const handler = () => loadTeam();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [loadTeam]);

  const login = useCallback(async ({ username, password }) => {
    try {
      const res = await authApi.login(username, password);
      localStorage.setItem('authToken', res.token);
      const user = { username: res.user.username, name: res.user.name, role: res.user.role };
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      message.success(`Xin chào, ${res.user.name || res.user.username}!`);
    } catch (e) {
      message.error('Đăng nhập thất bại');
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // ignore network errors on logout
    }
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    message.info('Đã đăng xuất');
  }, []);

  const value = {
    currentUser,
    team,
    isLoggedIn: !!currentUser,
    login,
    logout,
    reloadTeam: loadTeam,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser phải dùng trong UserProvider');
  return ctx;
}
