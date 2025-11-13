import React, { useState, useEffect } from 'react';
import api from '../api'; // Sesuaikan path ke instance API Anda
import { useAuth } from './context/AuthContext'; // Sesuaikan path ke AuthContext Anda
import MainLayout from './components/layout/MainLayout'; // Sesuaikan path ke MainLayout Anda
import Spinner from './components/Spinner';
import { toast } from 'react-hot-toast';

const ReportPage = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [salesUsers, setSalesUsers] = useState([]);
  const [selectedSales, setSelectedSales] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], // Awal bulan ini
    endDate: new Date().toISOString().split('T')[0], // Hari ini
  });

  // Ambil daftar sales jika pengguna adalah admin
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchSalesUsers = async () => {
        try {
          const res = await api.get('/auth/sales-users');
          setSalesUsers(res.data);
          if (res.data.length > 0) {
            setSelectedSales(res.data[0]._id); // Pilih sales pertama sebagai default
          }
        } catch (err) {
          console.error('Gagal mengambil daftar sales:', err);
          toast.error('Gagal mengambil daftar sales.');
        }
      };
      fetchSalesUsers();
    }
  }, [user?.role]);

  const handleDateChange = (e) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFetchReport = async () => {
    if (user?.role === 'admin' && !selectedSales) {
      toast.error('Silakan pilih seorang sales.');
      return;
    }

    setLoading(true);
    setReportData(null);

    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };
      // Admin perlu menyertakan userId, sales tidak perlu (backend akan mengaturnya)
      if (user?.role === 'admin') {
        params.userId = selectedSales;
      }

      const res = await api.get('/reports/sales-performance', { params });
      setReportData(res.data);
    } catch (err) {
      console.error('Gagal mengambil laporan:', err);
      toast.error(err.response?.data?.msg || 'Gagal mengambil data laporan.');
    } finally {
      setLoading(false);
    }
  };

  // Ambil laporan secara otomatis saat komponen dimuat pertama kali (untuk sales)
  // atau saat sales default dipilih (untuk admin)
  useEffect(() => {
    if (user?.role === 'sales' || (user?.role === 'admin' && selectedSales)) {
      handleFetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedSales]); // Hanya dijalankan saat user atau selectedSales berubah

  return (
    <MainLayout title="Laporan Performa">
      <div className="p-4">
        <div className="filter-card bg-white p-4 rounded-lg shadow-md mb-4 flex flex-wrap items-center gap-4">
          {user?.role === 'admin' && (
            <div className="input-group">
              <label htmlFor="sales-select">Pilih Sales:</label>
              <select
                id="sales-select"
                value={selectedSales}
                onChange={(e) => setSelectedSales(e.target.value)}
                className="p-2 border rounded"
              >
                {salesUsers.map(sales => (
                  <option key={sales._id} value={sales._id}>{sales.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="input-group">
            <label htmlFor="start-date">Dari Tanggal:</label>
            <input type="date" id="start-date" name="startDate" value={dateRange.startDate} onChange={handleDateChange} className="p-2 border rounded" />
          </div>
          <div className="input-group">
            <label htmlFor="end-date">Sampai Tanggal:</label>
            <input type="date" id="end-date" name="endDate" value={dateRange.endDate} onChange={handleDateChange} className="p-2 border rounded" />
          </div>
          <button onClick={handleFetchReport} disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400">
            {loading ? 'Memuat...' : 'Tampilkan Laporan'}
          </button>
        </div>

        {loading && <Spinner />}

        {reportData && (
          <div className="report-content">
            <div className="summary-grid grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="summary-card bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-lg">Total Penjualan</h3>
                <p className="text-2xl">Rp {reportData.summary.totalSales.toLocaleString('id-ID')}</p>
              </div>
              <div className="summary-card bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-lg">Total Laba</h3>
                <p className="text-2xl text-green-600">Rp {reportData.summary.totalProfit.toLocaleString('id-ID')}</p>
              </div>
              <div className="summary-card bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-lg">Total Kunjungan</h3>
                <p className="text-2xl">{reportData.summary.visitCount}</p>
              </div>
            </div>

            <div className="visits-list bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">Detail Kunjungan</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Tanggal</th>
                      <th className="text-left p-2">Pelanggan</th>
                      <th className="text-right p-2">Total Terjual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.visits.map(visit => {
                      const visitSales = visit.inventory.reduce((total, item) => {
                        const sold = item.initialStock - (item.finalStock + item.returns);
                        return total + (sold > 0 ? sold * (item.product?.price || 0) : 0);
                      }, 0);

                      return (
                        <tr key={visit._id} className="border-t">
                          <td className="p-2">{new Date(visit.createdAt).toLocaleDateString('id-ID')}</td>
                          <td className="p-2">{visit.customer.name}</td>
                          <td className="p-2 text-right">Rp {visitSales.toLocaleString('id-ID')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && !reportData && (
          <p className="text-center mt-8">Silakan pilih filter dan klik "Tampilkan Laporan" untuk melihat data.</p>
        )}
      </div>
    </MainLayout>
  );
};

export default ReportPage;