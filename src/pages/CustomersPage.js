
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import Spinner from '../components/Spinner'; 
import axios from 'axios'; // Gunakan axios langsung
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import './CustomersPage.css';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]); // This will hold the original list
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');
  // --- NEW: Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomers = async () => {
      // Don't setLoading(true) on every keystroke for search
      try {
        // NEW: Fetch data with all parameters
        const params = {
          page: currentPage,
          search: searchTerm,
          sort: sortOption,
        };
    const res = await axios.get('/customers', { params }); // Hapus URL absolut
        setCustomers(Array.isArray(res.data.customers) ? res.data.customers : []);
        setTotalPages(res.data.totalPages);

      } catch (err) {
        console.error('Error fetching data for customers page:', err);
        setError('Gagal memuat data pelanggan atau informasi pengguna.');
      }
    };
    // Debounce search to avoid too many API calls
    const handler = setTimeout(() => {
      setLoading(true);
      fetchCustomers().finally(() => setLoading(false));
    }, 500); // Wait 500ms after user stops typing

    return () => {
      clearTimeout(handler);
    };
  }, [currentPage, searchTerm, sortOption]); // Re-fetch when any parameter changes

  const handleDelete = async (customerId, customerName) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pelanggan "${customerName}"?`)) {
      const toastId = toast.loading('Menghapus pelanggan...');
      try {
    await axios.delete(`/customers/${customerId}`); // Hapus URL absolut
        // Remove the customer from the local state to update the UI instantly
        setCustomers(prevCustomers => prevCustomers.filter(c => c._id !== customerId));
        toast.success(`Pelanggan "${customerName}" berhasil dihapus.`, { id: toastId });
      } catch (err) {
        console.error('Error deleting customer:', err);
        toast.error('Gagal menghapus pelanggan.', { id: toastId });
      }
    }
  };

  if (loading) {
    return <MainLayout title="Pelanggan"><Spinner /></MainLayout>;
  }

  if (error) {
    return <MainLayout title="Pelanggan"><div>Error: {error}</div></MainLayout>;
  }

  return (
    <MainLayout title="Pelanggan">
      <div className="customers-page-container">
        <div className="toolbar">
          <input
            type="text"
            placeholder="Cari pelanggan..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* 3. Tambahkan kontrol UI untuk pengurutan */}
          <div className="sort-controls">
            <label htmlFor="sort">Urutkan:</label>
            <select id="sort" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
              <option value="name-asc">Nama (A-Z)</option>
              <option value="name-desc">Nama (Z-A)</option>
            </select>
          </div>
          <button className="add-customer-btn" onClick={() => navigate('/customers/new')}>
            <FaPlus /> Tambah
          </button>
        </div>

        <div className="customer-list">
          {/* Data 'customers' sekarang sudah terfilter dan terurut dari backend */}
          {customers.length > 0 ? (
            customers.map(customer => (
              <div key={customer._id} className="customer-card">
                <div className="customer-info" onClick={() => navigate(`/visit/${customer._id}`)}>
                  <h3>{customer.name}</h3>
                  <p>{customer.address}</p>
                  <span>{customer.phone}</span>
                </div>
                {/* Show Edit/Delete buttons for all users. Backend will handle authorization. */}
                <div className="customer-actions">
                  <button className="action-btn edit-btn" onClick={() => navigate(`/customers/edit/${customer._id}`)}>
                    <FaEdit />
                  </button>
                  <button className="action-btn delete-btn" onClick={() => handleDelete(customer._id, customer.name)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>Tidak ada pelanggan yang ditemukan.</p>
          )}
        </div>

        {/* --- NEW: Pagination Controls --- */}
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

export default CustomersPage;
