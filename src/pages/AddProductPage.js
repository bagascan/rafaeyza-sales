import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Gunakan axios langsung
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import './AddProductPage.css';

const AddProductPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    profit: '',
    barcode: '', // NEW: Add barcode field
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth(); // Dapatkan info pengguna dari context

  // Redirect jika bukan admin
  if (user && user.role !== 'admin') {
    toast.error('Anda tidak memiliki akses ke halaman ini.');
    navigate('/products');
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.profit) {
      toast.error('Nama, harga jual, dan laba produk wajib diisi!');
      return;
    }
    if (isNaN(formData.price) || Number(formData.price) < 0 || isNaN(formData.profit) || Number(formData.profit) < 0) {
      toast.error('Harga harus berupa angka positif.');
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading('Menyimpan produk...');

    try {
      await axios.post('/api/products', {
        name: formData.name,
        price: Number(formData.price),
        profit: Number(formData.profit),
        barcode: formData.barcode, // Send barcode
      });
      toast.success('Produk baru berhasil ditambahkan!', { id: toastId });
      navigate('/products');
    } catch (err) {
      console.error('Error adding product:', err);
      toast.error('Gagal menambahkan produk. Coba lagi.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout title="Tambah Produk Baru">
      <div className="add-product-container">
        <form onSubmit={handleSubmit} className="add-product-form">
          <div className="input-group">
            <label htmlFor="name">Nama Produk</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Produk A"
            />
          </div>
          <div className="input-group">
            <label htmlFor="price">Harga Jual</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Contoh: 15000"
            />
          </div>
          <div className="input-group">
            <label htmlFor="profit">Laba per Item</label>
            <input
              type="number"
              id="profit"
              name="profit"
              value={formData.profit}
              onChange={handleChange}
              placeholder="Contoh: 2000"
            />
          </div>
          {/* --- FIX: Add the missing barcode input field --- */}
          <div className="input-group">
            <label htmlFor="barcode">Barcode (Opsional)</label>
            <input
              type="text"
              id="barcode"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              placeholder="Pindai atau ketik kode barcode"
            />
          </div>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

export default AddProductPage;