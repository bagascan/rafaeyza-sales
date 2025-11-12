import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Gunakan axios langsung
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import Spinner from '../components/Spinner';
import './AddProductPage.css'; // Reusing the same CSS

const EditProductPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    profit: '',
    barcode: '', // NEW: Add barcode field
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check user role on component mount
  useEffect(() => {
    const checkRole = async () => {
      try {
        const userRes = await axios.get('/api/auth/user');
        if (userRes.data.role !== 'admin') {
          toast.error('Anda tidak memiliki akses untuk mengedit produk.');
          navigate('/products');
        }
      } catch (err) {
        navigate('/login'); // Redirect to login if user data cannot be fetched
      }
    };
    checkRole();
  }, [navigate]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`/api/products/${productId}`);
        setFormData({
          name: res.data.name,
          price: (res.data.price || '').toString(),
          profit: (res.data.profit || '').toString(),
          barcode: res.data.barcode || '', // Handle cases where barcode might not exist
        });
      } catch (err) {
        console.error('Error fetching product data:', err);
        toast.error('Gagal memuat data produk.');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, navigate]);

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
    const toastId = toast.loading('Memperbarui produk...');

    try {
      await axios.put(`/api/products/${productId}`, {
        name: formData.name,
        price: Number(formData.price),
        profit: Number(formData.profit),
        barcode: formData.barcode, // Send barcode
      });
      toast.success('Data produk berhasil diperbarui!', { id: toastId });
      navigate('/products');
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error('Gagal memperbarui produk.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <MainLayout title="Memuat..."><Spinner /></MainLayout>;
  }

  return (
    <MainLayout title="Edit Produk">
      <div className="add-product-container">
        <form onSubmit={handleSubmit} className="add-product-form">
          <div className="input-group">
            <label htmlFor="name">Nama Produk</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label htmlFor="price">Harga Jual</label>
            <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label htmlFor="profit">Laba per Item</label>
            <input type="number" id="profit" name="profit" value={formData.profit} onChange={handleChange} />
          </div>
          {/* --- NEW: Barcode Input Field --- */}
          <div className="input-group">
            <label htmlFor="barcode">Barcode (Opsional)</label>
            <input
              type="text"
              id="barcode"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              placeholder="Contoh: 8992741951305"
            />
          </div>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

export default EditProductPage;