
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import DashboardCard from '../components/DashboardCard';
import TopSalesList from '../components/TopSalesList'; // Corrected import path
import Spinner from '../components/Spinner';
import axios from 'axios'; // Gunakan axios langsung
import './DashboardPage.css';
import { FaDolly, FaMoneyBillWave, FaStar, FaArrowRight } from 'react-icons/fa';

const DashboardPage = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [user, setUser] = useState(null);
  const [activeConsignments, setActiveConsignments] = useState([]);
  const [topSales, setTopSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        // Fetch all dashboard data in parallel
        const [userRes, summaryRes, consignmentsRes, topSalesRes] = await Promise.all([
          axios.get('/api/auth/user'),
          axios.get('/api/dashboard/summary'),
          axios.get('/api/dashboard/active-consignments'),
          axios.get('/api/dashboard/top-sales')
        ]);

        
        setUser(userRes.data);
        setSummaryData(summaryRes.data);
        setActiveConsignments(Array.isArray(consignmentsRes.data) ? consignmentsRes.data : []);
        setTopSales(Array.isArray(topSalesRes.data) ? topSalesRes.data : []); // FIX: Set the top sales data

      } catch (err) {
        console.error('Error fetching summary data:', err);
        setError('Gagal memuat data dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchSummaryData();
  }, []);

  return (
    <MainLayout title="Dashboard">
      <div className="dashboard-page">
        <div className="welcome-header">
            <h2>Selamat Datang, {user ? user.name : 'Sales'}!</h2>
            <p>Ini adalah ringkasan aktivitas penjualan Anda hari ini.</p>
        </div>

        {loading ? (
          <Spinner />
        ) : error ? (
          <p>Error: {error}</p>
        ) : summaryData && (
          <>
          <div className="dashboard-grid">
                          <DashboardCard 
                              title="Kunjungan Hari Ini" 
                              value={summaryData.visitsToday}
                              icon={<FaDolly size={32}/>}
                          />
                          <DashboardCard 
                              title="Total Penjualan (Hari Ini)" 
                              value={`Rp ${(summaryData.salesToday ?? 0).toLocaleString('id-ID')}`}
                              icon={<FaMoneyBillWave size={32}/>}
                          />
                          <DashboardCard 
                              title="Total Laba (Hari Ini)" 
                              value={`Rp ${(summaryData.totalProfitToday ?? 0).toLocaleString('id-ID')}`}
                              icon={<FaMoneyBillWave size={32}/>} // Reusing icon, consider a different one if available
                          />
                          <DashboardCard 
                              title="Produk Terlaris" 
                              value={summaryData.topProduct}
                              icon={<FaStar size={32}/>}
                          />
                          {user && user.role === 'admin' && (
                          <div className="dashboard-card-span-2">
                            <TopSalesList topSales={topSales} />
                          </div>
                          )}
                          </div>
                    </>
        )}

        <div className="active-consignments-section">
          <h3>Pelanggan dengan Titipan Aktif</h3>
          {loading ? (
            <Spinner />
          ) : activeConsignments.length > 0 ? (
            <div className="active-list">
              {activeConsignments.map(customer => (
                <div key={customer._id} className="active-customer-item" onClick={() => navigate(`/visit/${customer._id}`)}>
                  <span>{customer.name}</span>
                  <FaArrowRight />
                </div>
              ))}
            </div>
          ) : (
            <p className="no-active-text">Tidak ada pelanggan dengan titipan aktif saat ini.</p>
          )}
        </div>

        <div className="quick-actions">
            <h3>Aksi Cepat</h3>
            <Link to="/new-visit" className="action-link">
                <span>Mulai Kunjungan Baru</span>
                <FaArrowRight />
            </Link>
            <Link to="/reports" className="action-link">
                <span>Lihat Laporan Penjualan</span>
                <FaArrowRight />
            </Link>
        </div>

      </div>
    </MainLayout>
  );
};

export default DashboardPage;
