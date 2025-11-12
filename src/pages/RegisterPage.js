import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import axios from '../api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext'; // 1. Import useAuth
import './AuthPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate(); // 2. Inisialisasi navigate
  const { login } = useAuth(); // 2. Dapatkan fungsi login dari context

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password) {
      return toast.error('Semua field wajib diisi.');
    }
    if (formData.password.length < 6) {
      return toast.error('Password minimal harus 6 karakter.');
    }
    setIsSubmitting(true);
    const toastId = toast.loading('Mendaftarkan akun...');

    try {
      const res = await axios.post('/api/auth/register', formData);

      // 3. Panggil login dan berikan callback untuk navigasi
      await login(res.data.token, () => {
        toast.success('Pendaftaran berhasil! Anda sekarang login.', { id: toastId });
        navigate('/'); // Arahkan ke dashboard setelah login benar-benar selesai
      });

    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Pendaftaran gagal. Coba lagi.';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Buat Akun Baru</h2>
        <p>Daftarkan diri Anda untuk mulai menggunakan aplikasi.</p>
        <form onSubmit={handleSubmit} className="auth-form">
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
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Daftar'}
          </button>
        </form>
        <div className="switch-auth">
          <p>Sudah punya akun? <Link to="/login">Login di sini</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;