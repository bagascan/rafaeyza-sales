import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api'; // Gunakan instance axios yang sudah dikonfigurasi
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import Spinner from '../components/Spinner';
import './Form.css'; // Menggunakan gaya form yang sudah ada

const AdminSettingsPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    lowStockThreshold: 50,
    attendanceDistanceTolerance: 200,
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const { user } = useAuth(); // Dapatkan user dari context

  // Otorisasi dan ambil data pengaturan awal
  useEffect(() => {
    const initializePage = async () => {
      try {
        // 1. Verifikasi peran admin
        if (user?.role !== 'admin') {
          toast.error('Anda tidak memiliki akses ke halaman ini.');
          navigate('/');
          return;
        }

        // 2. Ambil data pengaturan saat ini
        const settingsRes = await axios.get('/settings');
        setSettings(settingsRes.data);

      } catch (error) {
        toast.error('Gagal memuat data atau sesi tidak valid.');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    initializePage();
  }, [navigate, user]); // Tambahkan user sebagai dependensi

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading('Menyimpan pengaturan...');

    try {
      await axios.put('/settings', settings);
      toast.success('Pengaturan berhasil disimpan!', { id: toastId });
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <MainLayout title="Pengaturan"><Spinner /></MainLayout>;
  }

  return (
    <MainLayout title="Pengaturan Aplikasi">
      <div className="form-container">
        <form onSubmit={handleSubmit} className="form-card">
          <div className="input-group">
            <label htmlFor="lowStockThreshold">Ambang Batas Stok Rendah (pcs)</label>
            <input
              type="number"
              id="lowStockThreshold"
              name="lowStockThreshold"
              value={settings.lowStockThreshold}
              onChange={handleChange}
              min="0"
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--subtle-text-color)', marginTop: '5px' }}>
              Admin akan menerima notifikasi jika total stok produk di semua pelanggan di bawah angka ini.
            </p>
          </div>

          <div className="input-group">
            <label htmlFor="attendanceDistanceTolerance">Toleransi Jarak Absensi (meter)</label>
            <input
              type="number"
              id="attendanceDistanceTolerance"
              name="attendanceDistanceTolerance"
              value={settings.attendanceDistanceTolerance}
              onChange={handleChange}
              min="0"
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--subtle-text-color)', marginTop: '5px' }}>
              Jarak maksimal yang diizinkan bagi sales untuk melakukan absensi dari lokasi pelanggan.
            </p>
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

export default AdminSettingsPage;
