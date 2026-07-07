import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { teamApi } from '../api/api.js';

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

  const login = useCallback((member) => {
    setCurrentUser(member);
    localStorage.setItem('currentUser', JSON.stringify(member));
    message.success(`Xin chào, ${member.name}!`);
  }, []);

  const logout = useCallback(() => {
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
