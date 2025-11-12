import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import api from '../api'; // Ganti import axios dengan api
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import './AuthPage.css'; // We'll create this CSS file next

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate(); // 2. Inisialisasi navigate
  const { login } = useAuth(); // Dapatkan fungsi login dari context

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      return toast.error('Username dan password wajib diisi.');
    }
    setIsSubmitting(true);
    const toastId = toast.loading('Mencoba masuk...');

    try {
      const res = await api.post('/auth/login', formData);
      
      // Jika kode sampai di sini, berarti backend mengembalikan status 2xx (sukses)
      // dan mengirimkan token.
      if (res.data && res.data.token) {
        // Panggil login dari context dan berikan callback untuk navigasi
        await login(res.data.token, () => {
          toast.success('Login berhasil!', { id: toastId });
          navigate('/'); // Arahkan ke dashboard setelah login benar-benar selesai
        });
      } else {
        // Kasus jika backend merespons sukses tapi tanpa token
        throw new Error('Respons server tidak valid.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Login gagal. Periksa kembali username dan password Anda.';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Login</h2>
        <p>Selamat datang kembali! Silakan masuk ke akun Anda.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Login'}
          </button>
        </form>
        <div className="switch-auth">
          <Link to="/forgot-password">Lupa Password?</Link>
        </div>
        <div className="switch-auth">
          <p>Belum punya akun? <Link to="/register">Daftar di sini</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
      