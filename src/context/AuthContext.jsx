import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('userInfo');
      if (storedUser) {
        try {
          // Validar el token obteniendo perfil
          const res = await api.get('/auth/me');
          setUser({ ...res.data, token: JSON.parse(storedUser).token });
        } catch (error) {
           localStorage.removeItem('userInfo');
           setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data);
      localStorage.setItem('userInfo', JSON.stringify(res.data));
      toast.success('Inicio de sesión exitoso');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Error en inicio de sesión';
      toast.error(message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    toast.success('Sesión cerrada');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
