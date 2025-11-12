
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // CORRECTED: Import Link from react-router-dom
import MainLayout from '../components/layout/MainLayout';
import Spinner from '../components/Spinner';
import axios from '../api';
import { useAuth } from '../context/AuthContext'; // 1. Import useAuth
import './ReportsPage.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FaFileCsv } from 'react-icons/fa'; // 1. Import ikon untuk tombol ekspor

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Define common chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // This is the key to allow CSS to control the size
};


const ReportsPage = () => {
  const [visits, setVisits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  // State for summary metrics
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalSales: 0,
    totalProfit: 0,
    totalItemsSold: 0,
    visitCount: 0,
  });
  const [topCustomers, setTopCustomers] = useState([]);
  const [topSales, setTopSales] = useState([]); // NEW: State to hold top sales data
  const [topProducts, setTopProducts] = useState([]);
  const [customerChartData, setCustomerChartData] = useState({ datasets: [] });
  const [productChartData, setProductChartData] = useState({ datasets: [] });
  // State for date range and active filter button
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [activeFilter, setActiveFilter] = useState('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth(); // 2. Dapatkan info pengguna dari context

  useEffect(() => {
    const fetchVisits = async (start, end) => {
      try {
        const params = {
          startDate: start,
          endDate: end,
          search: searchTerm,
          page: currentPage,
        };

        // Fetch all data in parallel
        const [
          visitsRes,
          topCustomersRes,
          topProductsRes,
          topSalesRes, // NEW: Fetch top sales data
        ] = await Promise.all([
          axios.get('/api/visits', { params }),
          axios.get('/api/dashboard/top-customers', { params }),
          axios.get('/api/dashboard/top-products', { params }),
          axios.get('/api/dashboard/top-sales', { params }), // NEW: Fetch top sales
        ]);

        const safeVisits = Array.isArray(visitsRes.data.visits) ? visitsRes.data.visits : [];
        setVisits(safeVisits);
        setTotalPages(visitsRes.data.totalPages);

        // Calculate all summary metrics for the selected range
        const metrics = safeVisits.reduce((acc, visit) => {
          acc.totalProfit += visit.totalProfit || 0;
          visit.inventory.forEach(item => {
            const sold = (item.initialStock + (item.addedStock || 0)) - item.finalStock - item.returns;
            if (sold > 0 && item.product) {
              acc.totalSales += sold * (item.product.price || 0);
              acc.totalItemsSold += sold;
            }
          });
          return acc;
        }, { totalSales: 0, totalProfit: 0, totalItemsSold: 0 });

        metrics.visitCount = safeVisits.length;
        setSummaryMetrics(metrics);

        const safeTopCustomers = Array.isArray(topCustomersRes.data) ? topCustomersRes.data : [];
        const safeTopSales = Array.isArray(topSalesRes.data) ? topSalesRes.data : [];
        const safeTopProducts = Array.isArray(topProductsRes.data) ? topProductsRes.data : [];

        setTopCustomers(safeTopCustomers);
        setTopSales(safeTopSales);
        setTopProducts(safeTopProducts);

        // --- NEW: Prepare data for charts ---
        if (safeTopCustomers.length > 0) {
          setCustomerChartData({
            labels: safeTopCustomers.map(c => c.name),
            datasets: [{
              label: 'Total Penjualan (Rp)',
              data: safeTopCustomers.map(c => c.totalSales),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            }],
          });
        }

        if (safeTopProducts.length > 0) {
          setProductChartData({
            labels: safeTopProducts.map(p => p.name),
            datasets: [{
              label: 'Jumlah Terjual',
              data: safeTopProducts.map(p => p.totalSold),
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
              ],
              borderColor: '#fff',
              borderWidth: 1,
            }],
          });
        }

      } catch (err) {
        console.error('Error fetching visits:', err);
        setError('Gagal memuat data laporan.');
      } finally {
      }
    };

    // Debounce search to avoid too many API calls
    const handler = setTimeout(() => {
      if (dateRange.startDate && dateRange.endDate) {
        setLoading(true);
        fetchVisits(dateRange.startDate, dateRange.endDate).finally(() => setLoading(false));
      }
    }, 500); // Wait 500ms after user stops typing or changes page

    return () => {
      clearTimeout(handler);
    };
  }, [dateRange, searchTerm, currentPage]); // Hapus dependensi yang tidak perlu

  // Function to handle preset date filters (Today, This Week, etc.)
  const handleDateFilter = (filter) => {
    setActiveFilter(filter);
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (filter === 'today') {
      // Default state is already today
    } else if (filter === 'this_week') {
      const firstDayOfWeek = today.getDate() - today.getDay();
      start.setDate(firstDayOfWeek);
    } else if (filter === 'this_month') {
      start.setDate(1);
    }

    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  };

  // Function to handle custom date input changes
  const handleCustomDateChange = (e) => {
    setActiveFilter('custom');
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- NEW: Fungsi untuk mengekspor data ke CSV ---
  const handleExportToCSV = () => {
    if (visits.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    // Definisikan header untuk file CSV
    const headers = [
      'Tanggal', 'Waktu', 'Nama Sales', 'Nama Pelanggan', 
      'Produk', 'Jumlah Terjual', 'Harga Satuan', 'Total Harga'
    ];

    // Ubah data JSON menjadi baris-baris CSV
    const csvRows = [headers.join(',')]; // Tambahkan header sebagai baris pertama

    visits.forEach(visit => {
      visit.inventory.forEach(item => {
        const sold = (item.initialStock + (item.addedStock || 0)) - item.finalStock - item.returns;
        if (sold > 0 && item.product) {
          const visitDate = new Date(visit.createdAt);
          const row = [
            visitDate.toLocaleDateString('id-ID'), // Tanggal (e.g., 25/12/2023)
            visitDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), // Waktu (e.g., 14:30)
            `"${visit.user?.name || 'N/A'}"`, // Nama Sales (dalam kutip untuk handle koma)
            `"${visit.customer.name}"`, // Nama Pelanggan (dalam kutip)
            `"${item.product.name}"`, // Nama Produk (dalam kutip)
            sold, // Jumlah Terjual
            item.product.price, // Harga Satuan
            sold * item.product.price // Total Harga
          ];
          csvRows.push(row.join(','));
        }
      });
    });

    // Buat file CSV dan picu unduhan
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `laporan_kunjungan_${dateRange.startDate}_sd_${dateRange.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <MainLayout title="Laporan"><Spinner /></MainLayout>;
  }

  if (error) {
    return <MainLayout title="Laporan"><p>Error: {error}</p></MainLayout>;
  }

  return (
    <MainLayout title="Laporan">
      <div className="reports-page">
        {/* 3. Gunakan user.role dari context */}
        {user?.role === 'admin' && (
          <div className="report-navigation">
            <Link to="/reports/route" className="nav-link-card">
              <h3>Laporan Rute Peta</h3>
              <p>Visualisasikan rute kunjungan harian sales di peta.</p>
            </Link>
            <Link to="/reports/sales-performance" className="nav-link-card">
                <h3>Laporan Performa Sales</h3>
                <p>Analisis detail performa penjualan per individu sales.</p>
            </Link>
            <Link to="/reports/product-stock" className="nav-link-card">
                <h3>Laporan Stok Produk</h3>
                <p>Lacak pergerakan dan sisa stok untuk setiap produk.</p>
            </Link>
          </div>
        )}
        <div className="filter-controls">
          <div className="preset-filters">
            <button onClick={() => handleDateFilter('today')} className={activeFilter === 'today' ? 'active' : ''}>Hari Ini</button>
            <button onClick={() => handleDateFilter('this_week')} className={activeFilter === 'this_week' ? 'active' : ''}>Minggu Ini</button>
            <button onClick={() => handleDateFilter('this_month')} className={activeFilter === 'this_month' ? 'active' : ''}>Bulan Ini</button>
          </div>
          <div className="custom-date-filters">
            <input type="date" name="startDate" value={dateRange.startDate} onChange={handleCustomDateChange} />
            <span>-</span>
            <input type="date" name="endDate" value={dateRange.endDate} onChange={handleCustomDateChange} />
          </div>
        </div>

        <div className="report-summary-grid">
          <div className="summary-card"><h3>Total Penjualan</h3><p>Rp {summaryMetrics.totalSales.toLocaleString('id-ID')}</p></div>
          {user?.role === 'admin' && ( // 3. Gunakan user.role dari context
            <div className="summary-card profit"><h3>Total Laba</h3><p>Rp {summaryMetrics.totalProfit.toLocaleString('id-ID')}</p></div>
          )}
          <div className="summary-card"><h3>Barang Terjual</h3><p>{summaryMetrics.totalItemsSold.toLocaleString('id-ID')} pcs</p></div>
          <div className="summary-card"><h3>Jumlah Kunjungan</h3><p>{summaryMetrics.visitCount}</p></div>
        </div>

        <div className="chart-grid">
          <div className="chart-container">
            <h3>Grafik Top Pelanggan</h3>
            <div className="chart-wrapper">
              {topCustomers.length > 0 ? <Bar options={chartOptions} data={customerChartData} /> : <p className="no-data-text">Tidak ada data untuk ditampilkan.</p>}
            </div>
          </div>
          <div className="chart-container">
            <h3>Grafik Top Produk</h3>
            <div className="chart-wrapper">
              {topProducts.length > 0 ? <Doughnut options={chartOptions} data={productChartData} /> : <p className="no-data-text">Tidak ada data untuk ditampilkan.</p>}
            </div>
          </div>
        </div>

        <div className="top-lists-grid">
          <div className="top-list-card">
            <h3>Top 5 Pelanggan</h3>
            <ol>
              {topCustomers.map((customer, index) => (
                <li key={index}>
                  <span className="item-name">{customer.name}</span>
                  <span className="item-metric">Rp {customer.totalSales.toLocaleString('id-ID')}</span>
                </li>
              ))}
            </ol>
            {topCustomers.length === 0 && <p className="no-data-text">Tidak ada data</p>}
          </div>
          {/* NEW: Top 5 Sales List Card */}
          {user?.role === 'admin' && ( // 3. Gunakan user.role dari context
            <div className="top-list-card">
              <h3>Top 5 Sales</h3>
              <ol>
                {topSales.map((sales, index) => (
                  <li key={index}>
                    <span className="item-name">{sales.name}</span>
                    <span className="item-metric">Rp {sales.totalSales.toLocaleString('id-ID')}</span>
                  </li>
                ))}
              </ol>
              {topSales.length === 0 && <p className="no-data-text">Tidak ada data</p>}
            </div>
          )}
          <div className="top-list-card">
            <h3>Top 5 Produk Terlaris</h3>
            <ol>
              {topProducts.map((product, index) => (
                <li key={index}>
                  <span className="item-name">{product.name}</span>
                  <span className="item-metric">{product.totalSold} pcs</span>
                </li>
              ))}
            </ol>
            {topProducts.length === 0 && <p className="no-data-text">Tidak ada data</p>}
          </div>
        </div>

        <div className="report-list-header">
          <h2>Laporan Semua Kunjungan</h2>
          <input
            type="text"
            placeholder="Cari laporan berdasarkan nama pelanggan..."
            className="report-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* 2. Tambahkan tombol ekspor di sini */}
          <button onClick={handleExportToCSV} className="export-btn">
            <FaFileCsv /> Ekspor CSV
          </button>
        </div>

        {visits.length > 0 ? (
          visits.map(visit => (
            <div key={visit._id} className="visit-report-card clickable" onClick={() => navigate(`/receipt/${visit._id}`)}>
              <div className="report-header"> {/* Add optional chaining for robustness */}
                <h3>{visit.customer.name} - {visit.user?.name || 'N/A'}</h3>
                <span className="visit-date">
                  {new Date(visit.createdAt).toLocaleString('id-ID', { 
                    day: '2-digit', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="report-body">
                {visit.inventory.map(item => {
                  const sold = item.initialStock - item.finalStock - item.returns;
                  if (sold <= 0) return null; // Skip if nothing was sold
                  return (
                    <div key={item.product._id} className="product-item">
                      {/* Check if item.product exists before accessing its properties */}
                      <span className="product-name">{item.product ? item.product.name : 'Produk Dihapus'} (x{sold})</span>
                      <span className="product-sale">Rp {(sold * (item.product?.price || 0)).toLocaleString('id-ID')}</span>
                    </div>
                  ); 
                })}
              </div>
              <div className="report-footer">
                <p className="footer-sales">Total Penjualan: Rp {
                  // CORRECTED: The formula now correctly includes addedStock
                  visit.inventory.reduce((acc, item) => {
                    const sold = (item.initialStock + (item.addedStock || 0)) - item.finalStock - item.returns;
                    return acc + (sold * (item.product?.price || 0));
                  }, 0).toLocaleString('id-ID')
                }</p> 
                {user?.role === 'admin' && ( // 3. Gunakan user.role dari context
                  // CORRECTED: Directly use the pre-calculated totalProfit from the visit object
                  <p className="footer-profit">Total Laba: Rp {(visit.totalProfit || 0).toLocaleString('id-ID')}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>Belum ada data kunjungan yang tercatat untuk periode ini.</p>
        )}

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

export default ReportsPage;
