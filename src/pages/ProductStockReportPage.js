import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Ganti import axios dengan api
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import Spinner from '../components/Spinner';
import './ProductStockReportPage.css'; // Kita akan buat file CSS ini
import { FaFileCsv } from 'react-icons/fa'; // 1. Import ikon

const ProductStockReportPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFetchingReport, setIsFetchingReport] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  // Otorisasi dan ambil data awal (daftar produk)
  useEffect(() => {
    const initializePage = async () => {
      try {
        const userRes = await api.get('/auth/user');
        if (userRes.data.role !== 'admin') {
          toast.error('Anda tidak memiliki akses ke halaman ini.');
          navigate('/');
          return;
        }

        // FIX: Fetch ALL products by setting a high limit and ignoring pagination
        // The backend returns an object { products: [...] }, so we need to access the array.
        const productsRes = await api.get('/products?limit=1000');
        const allProducts = productsRes.data.products;

        setProducts(allProducts);
        if (allProducts.length > 0) {
          setSelectedProductId(allProducts[0]._id);
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

  // Fungsi untuk mengambil data laporan berdasarkan produk yang dipilih
  const handleFetchReport = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      return toast.error('Silakan pilih sebuah produk.');
    }
    setIsFetchingReport(true);
    setReportData(null); // Kosongkan data lama
    try {
      const res = await api.get('/reports/product-stock', {
        params: { productId: selectedProductId }
      });
      setReportData(res.data);
    } catch (err) {
      console.error('Error fetching product stock report:', err);
      toast.error('Gagal memuat laporan stok.');
    } finally {
      setIsFetchingReport(false);
    }
  };

  // --- NEW: Fungsi untuk mengekspor data ke CSV ---
  const handleExportToCSV = () => {
    if (!reportData || !selectedProductId) {
      toast.error('Tidak ada data untuk diekspor.');
      return;
    }

    const selectedProduct = products.find(p => p._id === selectedProductId);
    const productName = selectedProduct ? selectedProduct.name.replace(/\s+/g, '_') : 'produk';

    const headers = ['Nama Pelanggan', 'Sisa Stok (pcs)'];
    const csvRows = [headers.join(',')];

    reportData.customersWithStock.forEach(item => {
      const row = [`"${item.customerName}"`, item.finalStock];
      csvRows.push(row.join(','));
    });

    // Tambahkan ringkasan di bagian bawah
    csvRows.push(''); // Baris kosong sebagai pemisah
    csvRows.push('Ringkasan Laporan');
    csvRows.push(`Total Stok di Luar,${reportData.totalStockOutside}`);
    csvRows.push(`Total Terjual (Global),${reportData.totalSold}`);

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `laporan_stok_${productName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <MainLayout title="Memuat..."><Spinner /></MainLayout>;
  }

  return (
    <MainLayout title="Laporan Stok Produk">
      <div className="product-stock-page">
        <form className="filter-form" onSubmit={handleFetchReport}>
          <div className="filter-group">
            <label htmlFor="productId">Pilih Produk</label>
            <select id="productId" name="productId" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
              {products.map(product => (
                <option key={product._id} value={product._id}>{product.name}</option>
              ))}
            </select>
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
                <h3>Total Stok di Luar</h3>
                <p>{reportData.totalStockOutside.toLocaleString('id-ID')} pcs</p>
              </div>
              <div className="summary-card">
                <h3>Total Terjual (Global)</h3>
                <p>{reportData.totalSold.toLocaleString('id-ID')} pcs</p>
              </div>
            </div>

            <div className="report-list-header">
              <h3 className="customer-list-title">Pelanggan dengan Stok Tersisa</h3>
              {/* 2. Tambahkan tombol ekspor */}
              <button onClick={handleExportToCSV} className="export-btn">
                <FaFileCsv /> Ekspor CSV
              </button>
            </div>
            <div className="customer-stock-list">
              {reportData.customersWithStock.length > 0 ? (
                reportData.customersWithStock.map((item, index) => (
                  <div key={index} className="customer-stock-card">
                    <span className="customer-name">{item.customerName}</span>
                    <span className="stock-amount">{item.finalStock} pcs</span>
                  </div>
                ))
              ) : (
                <p>Tidak ada pelanggan yang memiliki stok tersisa untuk produk ini.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProductStockReportPage;
