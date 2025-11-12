import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api'; // 1. GANTI: Gunakan instance axios yang sudah dikonfigurasi
import MainLayout from '../components/layout/MainLayout';
import Spinner from '../components/Spinner';
import './NewVisitPage.css';

const NewVisitPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInactiveCustomers = async () => {
      try {
        // 2. GANTI: Hapus URL absolut, gunakan path relatif
        const res = await axios.get('/dashboard/inactive-consignments'); 
        // PASTIKAN customers SELALU ARRAY
        setCustomers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching inactive consignment customers:', err);
        setError('Gagal memuat daftar pelanggan.');
      } finally {
        setLoading(false);
      }
    };

    fetchInactiveCustomers();
  }, []);

  const handleCustomerSelect = (customerId) => {
    navigate(`/visit/${customerId}`);
  };

  return (
    <MainLayout title="Mulai Kunjungan Baru">
      <div className="new-visit-page">
        <h3>Pilih Pelanggan</h3>
        <p>Pilih pelanggan yang akan Anda kunjungi dari daftar di bawah ini.</p>
        
        {loading ? (
          <Spinner />
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <div className="customer-selection-list">
            {customers.length > 0 ? (
              customers.map(customer => (
                <div 
                  key={customer._id} 
                  className="customer-selection-item" 
                  onClick={() => handleCustomerSelect(customer._id)}
                >
                  <h4>{customer.name}</h4>
                  <p>{customer.address}</p>
                </div>
              ))
            ) : (
              <p>Tidak ada pelanggan yang perlu dikunjungi saat ini.</p>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default NewVisitPage;
