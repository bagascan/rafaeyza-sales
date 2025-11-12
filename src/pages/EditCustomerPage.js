import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api';
import externalApi from '../externalApi'; // 1. Import instance axios eksternal
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import Spinner from '../components/Spinner';
import './Form.css'; // 1. Ganti ke file CSS bersama
import { useAuth } from '../context/AuthContext'; // Import useAuth
import MapPicker from '../components/MapPicker'; // Import komponen peta

const EditCustomerPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    latitude: '',
    longitude: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [salesUsers, setSalesUsers] = useState([]); // NEW: State for list of sales users
  const [assignedUser, setAssignedUser] = useState(''); // NEW: State for the assigned user ID
  const { user } = useAuth(); // Dapatkan info pengguna dari context

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await axios.get(`/api/customers/${customerId}`);
        setFormData({
          name: res.data.name,
          address: res.data.address,
          phone: res.data.phone,
          latitude: res.data.location?.latitude || '',
          longitude: res.data.location?.longitude || '',
        });
        setAssignedUser(res.data.user); // Set the initially assigned user

        // If the current user is an admin, fetch the list of all sales users
        if (user?.role === 'admin') {
          const salesUsersRes = await axios.get('/api/auth/sales-users');
          // PASTIKAN salesUsers SELALU ARRAY
          setSalesUsers(Array.isArray(salesUsersRes.data) ? salesUsersRes.data : []);
        }

      } catch (err) {
        console.error('Error fetching customer data:', err);
        toast.error('Gagal memuat data pelanggan.');
        navigate('/customers');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [customerId, navigate, user]); // Tambahkan user sebagai dependensi

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
    // Update coordinates immediately
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));

    // --- NEW: Reverse Geocoding ---
    const toastId = toast.loading('Mencari alamat dari lokasi...');
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const res = await externalApi.get(url); // 2. Gunakan externalApi
      if (res.data && res.data.display_name) {
        // Update the address field with the result
        setFormData(prev => ({ ...prev, address: res.data.display_name }));
        toast.success('Alamat berhasil ditemukan!', { id: toastId });
      } else {
        toast.error('Tidak dapat menemukan alamat untuk lokasi ini.', { id: toastId });
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      toast.error('Gagal mencari alamat.', { id: toastId });
    }
  };

  // --- NEW: Geocoding function on address blur ---
  const handleAddressBlur = async (e) => {
    const address = e.target.value;
    if (!address || address.length < 10) {
      return;
    }
    setIsGeocoding(true);
    const toastId = toast.loading('Mencari koordinat alamat...');
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
      const res = await externalApi.get(url); // 3. Gunakan externalApi
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
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.phone) {
      toast.error('Semua field wajib diisi!');
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading('Memperbarui pelanggan...');

    try {
      // Include the assignedUser in the payload sent to the backend
      const payload = {
        ...formData,
        user: assignedUser,
      };
      await axios.put(`/api/customers/${customerId}`, payload);
      toast.success('Data pelanggan berhasil diperbarui!', { id: toastId });
      navigate('/customers');
    } catch (err) {
      console.error('Error updating customer:', err);
      toast.error('Gagal memperbarui pelanggan.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <MainLayout title="Memuat..."><Spinner /></MainLayout>;
  }

  return (
    <MainLayout title="Edit Pelanggan">
      <div className="form-container">
        <form onSubmit={handleSubmit} className="form-card">
          <div className="input-group">
            <label htmlFor="name">Nama Pelanggan</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label htmlFor="address">Alamat</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleAddressBlur}
            />
          </div>
          <div className="input-group">
            <label htmlFor="phone">Nomor Telepon</label>
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
          </div>

          {/* --- NEW: Dropdown for assigning sales, only visible to admin --- */}
          {user?.role === 'admin' && salesUsers.length > 0 && (
            <div className="input-group">
              <label htmlFor="assignedUser">Ditugaskan Kepada Sales</label>
              <select
                id="assignedUser"
                name="assignedUser"
                value={assignedUser}
                onChange={handleChange}
              >
                {salesUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* CORRECTED: Add back the MapPicker component and its wrapper */}
          <div className="input-group">
            <label>Lokasi di Peta</label>
            <MapPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationChange={handleMapLocationChange}
            />
          </div>
          <div className="input-group">
            <label htmlFor="latitude">Latitude</label>
            <input type="number" id="latitude" name="latitude" value={formData.latitude} onChange={handleChange} readOnly className="readonly-input" />
          </div>
          <div className="input-group">
            <label htmlFor="longitude">Longitude</label>
            <input type="number" id="longitude" name="longitude" value={formData.longitude} onChange={handleChange} readOnly className="readonly-input" />
          </div>
          <button type="submit" className="submit-btn" disabled={isSubmitting || isGeocoding}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

export default EditCustomerPage;