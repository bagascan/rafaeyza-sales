import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api';
import { toast } from 'react-hot-toast';
import './AuthPage.css'; // Kita gunakan gaya yang sama dengan halaman login

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      return toast.error('Silakan masukkan email Anda.');
    }
    setIsSubmitting(true);
    setMessage('');
    const toastId = toast.loading('Memproses permintaan...');

    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setMessage(res.data.msg);
      toast.success('Permintaan berhasil dikirim!', { id: toastId });
    } catch (err) {
      toast.error('Terjadi kesalahan. Coba lagi.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Lupa Password</h2>
        <p>Masukkan email Anda untuk menerima link reset password.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Email (Username)</label>
            <input
              type="text"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@anda.com"
            />
          </div>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Mengirim...' : 'Kirim Link Reset'}
          </button>
        </form>
        {message && <p className="switch-auth" style={{ color: 'green', marginTop: '1rem' }}>{message}</p>}
        <div className="switch-auth">
          <Link to="/login">Kembali ke Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
