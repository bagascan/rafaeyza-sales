import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext'; // 1. Import hook tema
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import BottomNav from './BottomNav';
import './MainLayout.css';

const MainLayout = ({ children, title }) => {
  const { theme } = useTheme(); // 2. Dapatkan tema yang aktif dari context
  const navigate = useNavigate();
  const { logout } = useAuth(); // Dapatkan fungsi logout dari context

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin logout?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    // 3. Terapkan kelas tema secara dinamis ke div terluar
    <div className={`main-layout ${theme}-theme`}>
      <header className="main-header">
        <h1>{title}</h1>
        <button onClick={handleLogout} className="logout-button" title="Logout"><FaSignOutAlt /></button>
      </header>
      <main className="main-content">{children}</main>
      <BottomNav />
    </div>
  );
};

export default MainLayout;