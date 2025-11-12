import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from '../api';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext'; // 1. Import useAuth
import Spinner from '../components/Spinner';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import './ProductsPage.css';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth(); // 2. Dapatkan info pengguna dari context
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = {
          page: currentPage,
          search: searchTerm,
        };
        const res = await axios.get('/api/products', { params });
        setProducts(Array.isArray(res.data.products) ? res.data.products : []);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        console.error('Error fetching data for products page:', err);
        setError('Gagal memuat data produk atau informasi pengguna.');
      }
    };

    const handler = setTimeout(() => {
      setLoading(true);
      fetchProducts().finally(() => setLoading(false));
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [currentPage, searchTerm]); // Hapus fetchProducts dari dependensi

  const handleDelete = async (productId, productName) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus produk "${productName}"?`)) {
      const toastId = toast.loading('Menghapus produk...');
      try {
        await axios.delete(`/api/products/${productId}`);
        setProducts(prevProducts => prevProducts.filter(p => p._id !== productId));
        toast.success(`Produk "${productName}" berhasil dihapus.`, { id: toastId });
      } catch (err) {
        console.error('Error deleting product:', err);
        toast.error('Gagal menghapus produk.', { id: toastId });
      }
    }
  };

  if (loading) return <MainLayout title="Produk"><Spinner /></MainLayout>;
  if (error) return <MainLayout title="Produk"><p>Error: {error}</p></MainLayout>;

  return (
    <MainLayout title="Manajemen Produk">
      <div className="page-container">
        {user?.role === 'admin' && ( // 3. Gunakan user.role dari context
          <div className="toolbar">
            <input
              type="text"
              placeholder="Cari produk..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="add-product-btn" onClick={() => navigate('/products/new')}>
              <FaPlus /> Tambah Produk
            </button>
          </div>
        )}

        <div className="product-list">
          {products.length > 0 ? (
            products.map(product => (
              <div key={product._id} className="product-card">
                <div className="product-info">
                  <h3>{product.name}</h3>
                  {/* Add checks to prevent crash if price or costPrice is undefined */}
                  <p>Harga Jual: Rp {(product.price || 0).toLocaleString('id-ID')}</p>
                  {user?.role === 'admin' && ( // 3. Gunakan user.role dari context
                    <span className="product-profit">
                      Laba per item: Rp {(product.profit || 0).toLocaleString('id-ID')}
                    </span>
                  )}

                </div>
                {user?.role === 'admin' && ( // 3. Gunakan user.role dari context
                  <div className="product-actions">
                    <button className="action-btn edit-btn" onClick={() => navigate(`/products/edit/${product._id}`)}><FaEdit /></button>
                    <button className="action-btn delete-btn" onClick={() => handleDelete(product._id, product.name)}><FaTrash /></button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>Belum ada produk yang ditambahkan.</p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination-controls">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
              Sebelumnya
            </button>
            <span>Halaman {currentPage} dari {totalPages}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
              Selanjutnya
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProductsPage;