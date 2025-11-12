import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Gunakan axios langsung
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import Spinner from '../components/Spinner';
import './SalesPerformanceReportPage.css'; // Kita akan buat file CSS ini
import { FaFileCsv } from 'react-icons/fa'; // 1. Import ikon

// Helper untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD
const getTodayDateString = () => new Date().toISOString().split('T')[0];

const SalesPerformanceReportPage = () => {
  const navigate = useNavigate();
  const [salesUsers, setSalesUsers] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFetchingReport, setIsFetchingReport] = useState(false);
  const [filters, setFilters] = useState({
    userId: '',
    startDate: getTodayDateString(),
    endDate: getTodayDateString(),
  });

  // Otorisasi dan ambil data awal (daftar sales)
  useEffect(() => {
    const initializePage = async () => {
      try {
        const userRes = await axios.get('/api/auth/user');
        if (userRes.data.role !== 'admin') {
          toast.error('Anda tidak memiliki akses ke halaman ini.');
          navigate('/');
          return;
        }

        const salesUsersRes = await axios.get('/api/auth/sales-users');
        setSalesUsers(salesUsersRes.data);
        if (salesUsersRes.data.length > 0) {
          setFilters(prev => ({ ...prev, userId: salesUsersRes.data[0]._id }));
        }
      } catch (error) {
        toast.error('Gagal memuat data awal.');
        navigate('/reports');
      } finally {
        setLoading(false);
      }
    };
    initializePage();
  }, [navigate]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  // Fungsi untuk mengambil data laporan berdasarkan filter
  const handleFetchReport = async (e) => {
    e.preventDefault();
    if (!filters.userId) {
      return toast.error('Silakan pilih seorang sales.');
    }
    setIsFetchingReport(true);
    setReportData(null); // Kosongkan data lama
    try {
      const res = await axios.get('/api/reports/sales-performance', { params: filters });
      setReportData(res.data);
    } catch (err) {
      console.error('Error fetching sales performance report:', err);
      toast.error('Gagal memuat laporan performa.');
    } finally {
      setIsFetchingReport(false);
    }
  };

  // --- NEW: Fungsi untuk mengekspor data ke CSV ---
  const handleExportToCSV = () => {
    if (!reportData || reportData.visits.length === 0) {
      toast.error('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = [
      'Tanggal Kunjungan', 'Waktu Kunjungan', 'Nama Pelanggan', 
      'Produk', 'Jumlah Terjual', 'Harga Satuan', 'Total Harga Produk'
    ];

    const csvRows = [headers.join(',')];

    reportData.visits.forEach(visit => {
      visit.inventory.forEach(item => {
        const sold = (item.initialStock + (item.addedStock || 0)) - item.finalStock - item.returns;
        if (sold > 0 && item.product) {
          const visitDate = new Date(visit.createdAt);
          const row = [
            visitDate.toLocaleDateString('id-ID'),
            visitDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            `"${visit.customer.name}"`,
            `"${item.product.name || 'Produk Dihapus'}"`,
            sold,
            item.product.price || 0,
            sold * (item.product.price || 0)
          ];
          csvRows.push(row.join(','));
        }
      });
    });

    const selectedSales = salesUsers.find(u => u._id === filters.userId);
    const salesName = selectedSales ? selectedSales.name.replace(/\s+/g, '_') : 'sales';

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for Excel BOM
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `laporan_performa_${salesName}_${filters.startDate}_sd_${filters.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <MainLayout title="Memuat..."><Spinner /></MainLayout>;
  }

  return (
    <MainLayout title="Laporan Performa Sales">
      <div className="sales-performance-page">
        <form className="filter-form" onSubmit={handleFetchReport}>
          <div className="filter-group">
            <label htmlFor="userId">Pilih Sales</label>
            <select id="userId" name="userId" value={filters.userId} onChange={handleFilterChange}>
              {salesUsers.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="startDate">Dari Tanggal</label>
            <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
          </div>
          <div className="filter-group">
            <label htmlFor="endDate">Sampai Tanggal</label>
            <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
          </div>
          <button type="submit" className="submit-btn" disabled={isFetchingReport}>
            {isFetchingReport ? 'Memuat...' : 'Tampilkan Laporan'}
          </button>
        </form>

        {isFetchingReport && <Spinner />}

        {reportData && (
          <div className="report-results">
            <div className="report-summary-grid">
              <div className="summary-card">
                <h3>Total Penjualan</h3>
                <p>Rp {reportData.summary.totalSales.toLocaleString('id-ID')}</p>
              </div>
              <div className="summary-card">
                <h3>Jumlah Kunjungan</h3>
                <p>{reportData.summary.visitCount}</p>
              </div>
            </div>

            <div className="report-list-header">
              <h3 className="visit-list-title">Detail Kunjungan</h3>
              {/* 2. Tambahkan tombol ekspor */}
              <button onClick={handleExportToCSV} className="export-btn">
                <FaFileCsv /> Ekspor CSV
              </button>
            </div>
            <div className="visit-list-container">
              {reportData.visits.length > 0 ? (
                reportData.visits.map(visit => (
                  <div key={visit._id} className="visit-report-card" onClick={() => navigate(`/receipt/${visit._id}`)}>
                    <div className="report-header">
                      <h3>{visit.customer.name}</h3>
                      <span className="visit-date">
                        {new Date(visit.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="report-footer">
                      <p>Total Penjualan: Rp {
                        visit.inventory.reduce((acc, item) => {
                          const sold = (item.initialStock + (item.addedStock || 0)) - item.finalStock - item.returns;
                          return acc + (sold > 0 ? sold * (item.product?.price || 0) : 0);
                        }, 0).toLocaleString('id-ID')
                      }</p>
                    </div>
                  </div>
                ))
              ) : (
                <p>Tidak ada data kunjungan untuk sales ini pada periode yang dipilih.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SalesPerformanceReportPage;
