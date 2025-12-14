import api from './api';
import { User } from '../types';

export const authService = {
  login: async (userName: string, password: string) => {
    const response = await api.post<{ token: string; user: User }>('/auth/login', { userName, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  },
};
