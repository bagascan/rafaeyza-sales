import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Gunakan axios langsung
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import Spinner from '../components/Spinner';
import './UserFormPage.css'; // Menggunakan CSS yang sama

const EditUserPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    role: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Otorisasi admin
        const adminRes = await axios.get('/api/auth/user');
        if (adminRes.data.role !== 'admin') {
          toast.error('Akses ditolak.');
          navigate('/users');
          return;
        }

        // Ambil data pengguna yang akan diedit
        // Kita perlu endpoint baru untuk ini, atau kita bisa filter dari daftar semua pengguna
        // Untuk efisiensi, kita akan filter dari daftar semua pengguna
        const usersRes = await axios.get('/api/users'); 
        // PASTIKAN usersRes.data adalah array sebelum memanggil .find()
        const userToEdit = Array.isArray(usersRes.data) ? usersRes.data.find(u => u._id === userId) : null;

        if (userToEdit) {
          setFormData({ name: userToEdit.name, role: userToEdit.role });
        } else {
          toast.error('Pengguna tidak ditemukan.');
          navigate('/users');
        }
      } catch (error) {
        toast.error('Gagal memuat data.');
        navigate('/users');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading('Memperbarui pengguna...');
    try {
      await axios.put(`/api/users/${userId}`, formData);
      toast.success('Data pengguna berhasil diperbarui!', { id: toastId });
      navigate('/users');
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Gagal memperbarui pengguna.';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <MainLayout title="Edit Pengguna"><Spinner /></MainLayout>;
  }

  return (
    <MainLayout title="Edit Pengguna">
      <div className="user-form-container">
        <form onSubmit={handleSubmit} className="user-form-card">
          <div className="input-group">
            <label htmlFor="name">Nama Lengkap</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label htmlFor="role">Peran (Role)</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange}>
              <option value="sales">Sales</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

export default EditUserPage;
