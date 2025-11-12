
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // 1. Import useAuth
import { FaHome, FaUsers, FaUserCircle, FaChartBar, FaBoxOpen, FaUsersCog, FaCog } from 'react-icons/fa'; // 1. Import FaCog
import './BottomNav.css';

const BottomNav = () => {
  // 2. Dapatkan data pengguna langsung dari AuthContext
  const { user } = useAuth();
  const userRole = user?.role; // Ambil role dari user object

  return (
    <div className="bottom-nav">
      <NavLink to="/" className="nav-item" end>
        <FaHome size={24} />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/customers" className="nav-item">
        <FaUsers size={24} />
        <span>Pelanggan</span>
      </NavLink>
      <NavLink to="/products" className="nav-item">
        <FaBoxOpen size={24} />
        <span>Produk</span>
      </NavLink>
      <NavLink to="/reports" className="nav-item">
        <FaChartBar size={24} />
        <span>Laporan</span>
      </NavLink>

      {/* --- INI BAGIAN PENTINGNYA --- */}
      {/* Tampilkan ikon ini hanya jika pengguna adalah admin */}
      {userRole === 'admin' && (
        <>
          <NavLink to="/users" className="nav-item">
            <FaUsersCog size={24} />
            <span>Pengguna</span>
          </NavLink>
          {/* --- NEW: Settings Link for Admin --- */}
          <NavLink to="/settings" className="nav-item">
            <FaCog size={24} />
            <span>Pengaturan</span>
          </NavLink>
        </>
      )}
      {/* --- FIX: Add back the Profile link for all users --- */}
      <NavLink to="/profile" className="nav-item">
        <FaUserCircle size={24} />
        <span>Profil</span>
      </NavLink>

    </div>
  );
};

export default BottomNav;
