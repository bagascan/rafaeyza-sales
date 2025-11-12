import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api'; // Import instance api
import MainLayout from '../components/layout/MainLayout';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { useTheme } from '../context/ThemeContext'; // 1. Import useTheme
import './ProfilePage.css';

// Fungsi untuk mengubah VAPID public key dari URL-safe base64 ke Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

const ProfilePage = () => {
  const { theme, toggleTheme } = useTheme(); // 2. Gunakan theme context
  const { user, loading } = useAuth(); // Dapatkan user dari context
  const [name, setName] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [isSubscribed, setIsSubscribed] = useState(!!user?.pushSubscription);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setIsSubscribed(!!user.pushSubscription);
    }
  }, [user]);

  const handleNameChange = (e) => setName(e.target.value);
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Memperbarui nama...');
    try {
      await api.put('/auth/update-details', { name });
      toast.success('Nama berhasil diperbarui!', { id: toastId });
    } catch (err) {
      toast.error('Gagal memperbarui nama.', { id: toastId });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      return toast.error('Password baru tidak cocok.');
    }
    if (passwordData.newPassword.length < 6) {
      return toast.error('Password baru minimal harus 6 karakter.');
    }

    const toastId = toast.loading('Mengubah password...');
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password berhasil diubah!', { id: toastId });
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Gagal mengubah password.';
      toast.error(errorMsg, { id: toastId });
    }
  };

  const handleSubscribe = async () => {
    if (!('serviceWorker' in navigator)) {
      return toast.error('Browser Anda tidak mendukung Service Worker.');
    }

    const toastId = toast.loading('Memproses langganan notifikasi...');
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY; // Ambil dari .env frontend

      if (!vapidPublicKey) {
        return toast.error('Konfigurasi VAPID Public Key tidak ditemukan.', { id: toastId });
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Kirim langganan ke backend
      await api.post('/notifications/subscribe', subscription);

      setIsSubscribed(true);
      toast.success('Anda berhasil berlangganan notifikasi!', { id: toastId });

      // Kirim notifikasi tes
      await api.post('/notifications/test-push');

    } catch (err) {
      console.error('Failed to subscribe:', err);
      const errorMsg = err.response?.data?.msg || 'Gagal berlangganan notifikasi.';
      toast.error(errorMsg, { id: toastId });
    }
  };

  if (loading) {
    return <MainLayout title="Profil Saya"><Spinner /></MainLayout>;
  }

  if (!user) {
    return <MainLayout title="Profil Saya"><p>Gagal memuat profil.</p></MainLayout>;
  }

  return (
    <MainLayout title="Profil Saya">
      <div className="profile-page">
        <div className="profile-card">
          <h3>Informasi Pengguna</h3>
          <form onSubmit={handleUpdateName}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input type="text" id="username" value={user.username} readOnly disabled />
            </div>
            <div className="input-group">
              <label htmlFor="name">Nama Lengkap</label>
              <input type="text" id="name" value={name} onChange={handleNameChange} />
            </div>
            <button type="submit" className="submit-btn">Simpan Nama</button>
          </form>
        </div>

        <div className="profile-card">
          <h3>Tampilan</h3>
          <div className="theme-toggle-group">
            <p>Pilih tema aplikasi Anda.</p>
            <button type="button" onClick={toggleTheme} className="submit-btn">
              Beralih ke Tema {theme === 'light' ? 'Gelap' : 'Terang'}
            </button>
          </div>
        </div>

        <div className="profile-card">
          <h3>Notifikasi</h3>
          <p>Aktifkan notifikasi untuk mendapatkan pembaruan penting.</p>
          <button onClick={handleSubscribe} className="submit-btn" disabled={isSubscribed}>
            {isSubscribed ? 'Sudah Berlangganan' : 'Aktifkan Notifikasi'}
          </button>
        </div>

        <div className="profile-card">
          <h3>Ubah Password</h3>
          <form onSubmit={handleChangePassword}>
            <div className="input-group">
              <label htmlFor="currentPassword">Password Lama</label>
              <input type="password" id="currentPassword" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} />
            </div>
            <div className="input-group">
              <label htmlFor="newPassword">Password Baru</label>
              <input type="password" id="newPassword" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} />
            </div>
            <div className="input-group">
              <label htmlFor="confirmNewPassword">Konfirmasi Password Baru</label>
              <input type="password" id="confirmNewPassword" name="confirmNewPassword" value={passwordData.confirmNewPassword} onChange={handlePasswordChange} />
            </div>
            <button type="submit" className="submit-btn danger">Ubah Password</button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;