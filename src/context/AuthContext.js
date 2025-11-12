import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import setAuthToken from '../utils/setAuthToken';
import api from '../api'; // Ganti import axios dengan api
import Spinner from '../components/Spinner';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Mulai dengan loading=true

  // Fungsi untuk memuat data pengguna berdasarkan token
  const loadUser = useCallback(async (onSuccess) => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      let success = false;
      setAuthToken(storedToken); // Atur token di header Axios
      try {
        const res = await api.get('/auth/user');
        setUser(res.data);
        setIsAuthenticated(true);
        success = true;
        if (onSuccess) {
          onSuccess(); // Panggil callback sukses jika ada
        }
      } catch (err) {
        // Jika token tidak valid, hapus semuanya
        localStorage.removeItem('token');
        setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
      return success; // Kembalikan status keberhasilan
    }
    // Selesai loading setelah semua proses pengecekan token selesai
    setLoading(false);
    return false; // Tidak ada token, jadi tidak berhasil
  }, []);

  // Jalankan `loadUser` sekali saat aplikasi pertama kali dimuat
  useEffect(() => {
    loadUser().finally(() => setLoading(false));
  }, [loadUser]);

  // Fungsi yang dipanggil saat login berhasil
  const login = async (newToken, onSuccess) => {
    localStorage.setItem('token', newToken);
    setAuthToken(newToken);
    setToken(newToken);
    // Panggil loadUser dan teruskan callback onSuccess
    return await loadUser(onSuccess);
  };

  // Fungsi untuk logout
  const logout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Nilai-nilai yang akan disediakan oleh context ke seluruh aplikasi
  const value = {
    token,
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  // Selama proses pengecekan token awal, tampilkan spinner di tengah layar
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner />
      </div>
    );
  }

  // Setelah selesai loading, tampilkan aplikasi yang dibungkus oleh Provider
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
