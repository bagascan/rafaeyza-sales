
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Ganti import axios dengan api
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import Spinner from '../components/Spinner'; // Hapus FaUsers jika ada di sini
import { FaUserPlus, FaEdit, FaTrash } from 'react-icons/fa'; 
import './UserManagementPage.css'; // Kita akan buat file CSS ini

const UserManagementPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Otorisasi dan ambil data pengguna
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Verifikasi peran admin
        const userRes = await api.get('/auth/user');
        if (userRes.data.role !== 'admin') {
          toast.error('Anda tidak memiliki akses ke halaman ini.');
          navigate('/');
          return;
        }

        // 2. Ambil daftar semua pengguna
        const usersRes = await api.get('/users');
        // PASTIKAN users SELALU ARRAY
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);

      } catch (error) {
        toast.error('Gagal memuat data atau sesi tidak valid.');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${userName}"? Aksi ini tidak dapat dibatalkan.`)) {
      const toastId = toast.loading('Menghapus pengguna...');
      try {
        await api.delete(`/users/${userId}`);
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
        toast.success(`Pengguna "${userName}" berhasil dihapus.`, { id: toastId });
      } catch (err) {
        const errorMsg = err.response?.data?.msg || 'Gagal menghapus pengguna.';
        toast.error(errorMsg, { id: toastId });
      }
    }
  };

  if (loading) {
    return <MainLayout title="Manajemen Pengguna"><Spinner /></MainLayout>;
  }

  return (
    <MainLayout title="Manajemen Pengguna">
      <div className="user-management-page">
        <div className="toolbar">
          <button className="add-user-btn" onClick={() => navigate('/users/new')}>
            <FaUserPlus /> Tambah Pengguna Baru
          </button>
        </div>

        <div className="user-list-container">
          {users.map(user => (
            <div key={user._id} className="user-card">
              <div className="user-details">
                <span className={`user-role-badge ${user.role}`}>{user.role}</span>
                <h4>{user.name}</h4>
                <p>{user.username}</p>
              </div>
              <div className="user-actions">
                <button className="action-btn edit-btn" onClick={() => navigate(`/users/edit/${user._id}`)}>
                  <FaEdit />
                </button>
                <button className="action-btn delete-btn" onClick={() => handleDeleteUser(user._id, user.name)}>
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default UserManagementPage;
