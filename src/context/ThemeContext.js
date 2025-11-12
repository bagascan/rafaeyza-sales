import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Buat Context
const ThemeContext = createContext();

// 2. Buat Provider Component
export const ThemeProvider = ({ children }) => {
  // State untuk menyimpan tema, ambil dari localStorage atau default ke 'light'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    // Terapkan class ke body dan simpan ke localStorage setiap kali tema berubah
    const body = window.document.body;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(`${theme}-theme`);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fungsi untuk beralih tema
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Buat custom hook untuk mempermudah penggunaan context
export const useTheme = () => useContext(ThemeContext);
