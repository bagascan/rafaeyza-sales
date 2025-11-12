import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { nominatimApi } from '../api'; // Impor kedua instance dari file api terpusat
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import './Form.css';
import MapPicker from '../components/MapPicker'; // Import komponen peta
import { useAuth } from '../context/AuthContext'; // Menggunakan AuthContext

const AddCustomerPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    latitude: '',
    longitude: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false); // Definisikan state isGeocoding
  const { user } = useAuth(); // Dapatkan info pengguna yang sedang login
  const [salesUsers, setSalesUsers] = useState([]); // Daftar sales untuk admin
  const [assignedUser, setAssignedUser] = useState(''); // ID sales yang dipilih

  // Ambil daftar sales jika yang login adalah admin
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchSalesUsers = async () => {
        try {
          const res = await api.get('/auth/sales-users');
          setSalesUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
          console.error("Failed to fetch sales users:", err);
          toast.error("Gagal memuat daftar sales.");
        }
      };
      fetchSalesUsers();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'assignedUser') {
      setAssignedUser(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // --- NEW: Callback function for map marker drag ---
  const handleMapLocationChange = async (lat, lng) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    const toastId = toast.loading('Mencari alamat dari lokasi...');
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const res = await nominatimApi.get(`/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (res.data && res.data.display_name) {
        setFormData(prev => ({ ...prev, address: res.data.display_name }));
        toast.success('Alamat berhasil ditemukan!', { id: toastId });
      } else {
        toast.error('Tidak dapat menemukan alamat untuk lokasi ini.', { id: toastId });
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      toast.error('Gagal melakukan geocoding.', { id: toastId });
    }
  };

  // --- NEW: Geocoding function on address blur ---
  const handleAddressBlur = async (e) => {
    const address = e.target.value;
    if (!address || address.length < 10) {
      return;
    }
    setIsGeocoding(true); // Atur ke true saat geocoding dimulai
    const toastId = toast.loading('Mencari koordinat alamat...');
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
      const res = await nominatimApi.get(`/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
      if (res.data && res.data.length > 0) {
        const { lat, lon } = res.data[0];
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
        toast.success('Koordinat berhasil ditemukan!', { id: toastId });
      } else {
        toast.error('Koordinat untuk alamat ini tidak ditemukan.', { id: toastId });
      }
    } catch (err) {
      toast.error('Gagal melakukan geocoding.', { id: toastId });
    } finally {
      setIsGeocoding(false); // Atur kembali ke false setelah selesai
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.phone || !formData.latitude || !formData.longitude) {
      toast.error('Nama, Alamat, Telepon, dan Lokasi wajib diisi!');
      return;
    }
    if (user?.role === 'admin' && !assignedUser) {
      toast.error('Sebagai admin, Anda harus menugaskan pelanggan ini ke seorang sales.');
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading('Menambahkan pelanggan baru...');

    try {
      const payload = {
        ...formData,
        user: user?.role === 'admin' ? assignedUser : undefined,
      };

      await api.post('/customers', payload);
      toast.success('Pelanggan baru berhasil ditambahkan!', { id: toastId });
      navigate('/customers');
    } catch (err) {
      console.error('Error adding customer:', err);
      toast.error(err.response?.data?.msg || 'Gagal menambahkan pelanggan.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout title="Tambah Pelanggan Baru">
      <div className="form-container">
        <form onSubmit={handleSubmit} className="form-card">
          <div className="input-group">
            <label htmlFor="name">Nama Pelanggan</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="address">Alamat</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleAddressBlur}
              rows="3"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="phone">Nomor Telepon</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          {/* Dropdown untuk admin menugaskan sales */}
          {user?.role === 'admin' && salesUsers.length > 0 && (
            <div className="input-group">
              <label htmlFor="assignedUser">Ditugaskan Kepada Sales</label>
              <select
                id="assignedUser"
                name="assignedUser"
                value={assignedUser}
                onChange={handleChange}
                required
              >
                <option value="">-- Pilih Sales --</option>
                {salesUsers.map(sales => (
                  <option key={sales._id} value={sales._id}>{sales.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="input-group">
            <label>Pilih Lokasi di Peta</label>
            <MapPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationChange={handleMapLocationChange}
            />
          </div>
          <div className="input-group">
            <label htmlFor="latitude">Latitude</label>
            <input
              type="number"
              id="latitude"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              readOnly
              className="readonly-input" />
          </div>
          <div className="input-group">
            <label htmlFor="longitude">Longitude</label>
            <input
              type="number"
              id="longitude"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              readOnly
              className="readonly-input" />
          </div>
          <button type="submit" className="submit-btn" disabled={isSubmitting || isGeocoding}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Pelanggan'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

export default AddCustomerPage;
            