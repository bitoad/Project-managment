import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { projectsApi, portsApi } from '../api/api.js';
import { useUser } from './UserContext.jsx';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const { isLoggedIn } = useUser();
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(
    () => localStorage.getItem('currentProjectId') || null
  );
  const [ports, setPorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [portfolioView, setPortfolioView] = useState(
    () => localStorage.getItem('portfolioView') === 'true'
  );

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const list = await projectsApi.getAll();
      setProjects(list);
      // Tự chọn dự án đầu tiên nếu chưa có
      if (list.length > 0 && !list.find((p) => p.id === currentProjectId)) {
        setCurrentProjectId(list[0].id);
        localStorage.setItem('currentProjectId', list[0].id);
      }
    } catch (e) {
      message.error('Không tải được danh sách dự án');
    } finally {
      setLoading(false);
    }
  }, [currentProjectId]);

  const loadPorts = useCallback(async () => {
    try {
      const list = await portsApi.getAll();
      setPorts(list || []);
    } catch (e) {
      setPorts([]);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadProjects();
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && currentProjectId) loadPorts();
    else setPorts([]);
  }, [isLoggedIn, currentProjectId, loadPorts]);

  const selectProject = useCallback((projectId) => {
    setCurrentProjectId(projectId);
    localStorage.setItem('currentProjectId', projectId);
    setPortfolioView(false);
    localStorage.setItem('portfolioView', 'false');
  }, []);

  const selectAllProjects = useCallback(() => {
    setPortfolioView(true);
    localStorage.setItem('portfolioView', 'true');
  }, []);

  const createProject = useCallback(async (name, description) => {
    const project = await projectsApi.create({ name, description });
    await loadProjects();
    selectProject(project.id);
    message.success(`Đã tạo dự án "${name}"`);
    return project;
  }, [loadProjects, selectProject]);

  const deleteProject = useCallback(async (projectId) => {
    await projectsApi.remove(projectId);
    await loadProjects();
    if (currentProjectId === projectId && projects.length > 1) {
      const next = projects.find((p) => p.id !== projectId);
      if (next) selectProject(next.id);
    }
    message.success('Đã xóa dự án');
  }, [loadProjects, currentProjectId, projects, selectProject]);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const value = {
    projects,
    currentProject,
    currentProjectId,
    ports,
    loading,
    portfolioView,
    setPortfolioView,
    selectProject,
    selectAllProjects,
    createProject,
    deleteProject,
    reloadProjects: loadProjects,
    reloadPorts: loadPorts,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject phải dùng trong ProjectProvider');
  return ctx;
}
