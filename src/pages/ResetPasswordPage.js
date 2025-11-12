import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Gunakan axios langsung
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css'; // Kita gunakan gaya yang sama dengan halaman login

const ResetPasswordPage = () => {
  const { token } = useParams(); // Ambil token dari URL
  const navigate = useNavigate();
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Password tidak cocok.');
    }
    if (password.length < 6) {
      return toast.error('Password minimal harus 6 karakter.');
    }
    setIsSubmitting(true);
    const toastId = toast.loading('Mereset password...');

    try {
      const res = await axios.post(`/api/auth/reset-password/${token}`, { password });

      // Panggil login dan berikan callback untuk navigasi
      await login(res.data.token, () => {
        toast.success(res.data.msg || 'Password berhasil direset!', { id: toastId });
        navigate('/'); // Arahkan ke dashboard
      });
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Gagal mereset password.';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Reset Password</h2>
        <p>Masukkan password baru Anda.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="password">Password Baru</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="input-group">
            <label htmlFor="confirmPassword">Konfirmasi Password Baru</label>
            <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
