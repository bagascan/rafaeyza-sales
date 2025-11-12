import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Gunakan axios langsung
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import './UserFormPage.css'; // Kita akan buat file CSS ini

const AddUserPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'sales', // Default role
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Otorisasi: Pastikan hanya admin yang bisa mengakses halaman ini
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await axios.get('/api/auth/user');
        if (res.data.role !== 'admin') {
          toast.error('Akses ditolak.');
          navigate('/users');
        }
      } catch (error) {
        navigate('/login');
      }
    };
    checkAdmin();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password || !formData.role) {
      return toast.error('Semua field wajib diisi.');
    }
    if (formData.password.length < 6) {
      return toast.error('Password minimal harus 6 karakter.');
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Membuat pengguna baru...');
    try {
      await axios.post('/api/users', formData);
      toast.success('Pengguna baru berhasil dibuat!', { id: toastId });
      navigate('/users');
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Gagal membuat pengguna.';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout title="Tambah Pengguna Baru">
      <div className="user-form-container">
        <form onSubmit={handleSubmit} className="user-form-card">
          <div className="input-group">
            <label htmlFor="name">Nama Lengkap</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label htmlFor="role">Peran (Role)</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange}>
              <option value="sales">Sales</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Pengguna'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

export default AddUserPage;
