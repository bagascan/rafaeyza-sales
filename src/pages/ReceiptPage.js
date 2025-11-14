import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api'; // Ganti import axios dengan api
import MainLayout from '../components/layout/MainLayout';
import Spinner from '../components/Spinner';
import './ReceiptPage.css';

const ReceiptPage = () => {
  const { visitId } = useParams(); // Get visitId from URL
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const fetchVisitData = async () => {
      try {
        const res = await api.get(`/visits/${visitId}`);
        setVisit(res.data);
      } catch (err) {
        console.error("Error fetching receipt data:", err);
        setError("Gagal memuat data nota.");
      } finally {
        setLoading(false);
      }
    };
    fetchVisitData();
  }, [visitId]);

  if (loading) {
    return <MainLayout title="Memuat Nota..."><Spinner /></MainLayout>;
  }

  if (error || !visit) {
    return <MainLayout title="Error"><p>{error || "Data nota tidak ditemukan."}</p></MainLayout>;
  }

  // Calculate total items sold to determine which view to show
  const totalItemsSold = visit.inventory.reduce((acc, item) => {
    // FIX: Include addedStock in calculation
    return acc + Math.max(0, (item.initialStock + (item.addedStock || 0)) - item.finalStock - item.returns);
  }, 0);

  const handleBluetoothPrint = async () => {
    if (!navigator.bluetooth) {
      alert('Web Bluetooth API tidak didukung di browser ini. Silakan gunakan Chrome.');
      return;
    }
    setIsPrinting(true);

    try {
      // 1. Request device
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] // Generic Attribute Profile
      });

      // 2. Connect to GATT Server
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      // 3. Construct ESC/POS commands
      const encoder = new TextEncoder();
      let commands = new Uint8Array(0);

      const append = (data) => {
        const newCommands = new Uint8Array(commands.length + data.length);
        newCommands.set(commands);
        newCommands.set(data, commands.length);
        commands = newCommands;
      };

      // ESC/POS commands to build the receipt
      append(encoder.encode('\x1B@')); // Initialize printer
      append(encoder.encode('\x1B\x61\x01')); // Center align
      // --- NEW: Add Store Name ---
      append(encoder.encode('\x1D\x21\x01')); // Double width
      append(encoder.encode('RAFAEYZA BAROKAH\n'));

      append(encoder.encode('\x1D\x21\x11')); // Double height and width
      append(encoder.encode('Nota Penjualan\n'));
      append(encoder.encode('\x1D\x21\x00')); // Normal size
      append(encoder.encode('\x1B\x61\x00')); // Left align
      append(encoder.encode('--------------------------------\n'));
      append(encoder.encode(`Sales    : ${visit.user.name.substring(0, 20)}\n`));
      append(encoder.encode(`Pelanggan: ${visit.customer.name.substring(0, 20)}\n`));
      const visitDate = new Date(visit.createdAt).toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      append(encoder.encode(`Tanggal  : ${visitDate}\n`));
      append(encoder.encode('--------------------------------\n'));

      visit.inventory.forEach(item => {
        // FIX: Include addedStock in calculation
        const sold = (item.initialStock + (item.addedStock || 0)) - item.finalStock - item.returns;
        if (sold > 0) {
          const total = sold * item.product.price;
          const name = item.product.name.padEnd(15).substring(0, 15);
          const qty = sold.toString().padStart(3);
          const price = total.toLocaleString('id-ID').padStart(10);
          append(encoder.encode(`${name} ${qty} x ${price}\n`));
        }
      });

      append(encoder.encode('--------------------------------\n'));
      append(encoder.encode(`Total Bayar: Rp ${calculateVisitTotal().toLocaleString('id-ID')}\n\n`));
      append(encoder.encode('\x1B\x61\x01')); // Center align
      append(encoder.encode('Terima Kasih!\n\n\n'));
      append(encoder.encode('\x1D\x56\x42\x00')); // Cut paper

      // 4. Send commands to printer
      await characteristic.writeValue(commands);
      alert('Nota berhasil dikirim ke printer!');

    } catch (error) {
      console.error('Bluetooth print error:', error);
      alert(`Gagal mencetak: ${error.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const calculateVisitTotal = () => {
    return visit.inventory.reduce((total, item) => {
      // FIX: Include addedStock in calculation
      const sold = (item.initialStock + (item.addedStock || 0)) - item.finalStock - item.returns;
      const itemTotal = sold > 0 ? sold * (item.product?.price || 0) : 0;
      return total + itemTotal;
    }, 0);
  };

  return (
    <MainLayout title="Nota Penjualan">
      <div className="receipt-page">
        {totalItemsSold > 0 ? (
          // --- Sales Receipt View (If there are sales) ---
          <div className="receipt-content">
            {/* --- NEW: Add Store Name --- */}
            <div className="store-name-header">
              <h1>RAFAEYZA BAROKAH</h1>
            </div>
            <h2 className="receipt-title">Nota Penjualan</h2>
            <div className="receipt-header">
              <p><strong>Sales:</strong> {visit.user.name}</p>
              <p><strong>Pelanggan:</strong> {visit.customer.name}</p>
              <p><strong>Tanggal:</strong> {new Date(visit.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Terjual</th>
                  <th>Harga</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {visit.inventory.map(item => {
                  // FIX: Include addedStock in calculation
                  const sold = Math.max(0, (item.initialStock + (item.addedStock || 0)) - item.finalStock - item.returns);
                  if (sold <= 0) return null; // Only show sold items
                  const total = sold * (item.product?.price || 0);
                  return (
                    <tr key={item.product?._id || item._id}>
                      <td>{item.product?.name || 'Produk Dihapus'}</td>
                      <td>{sold}</td>
                      <td>Rp {(item.product?.price || 0).toLocaleString('id-ID')}</td>
                      <td>Rp {total.toLocaleString('id-ID')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="receipt-footer">
              <p><strong>Total Penjualan:</strong> Rp {calculateVisitTotal().toLocaleString('id-ID')}</p>
              {(visit.totalProfit || 0) > 0 && <p><strong>Total Laba:</strong> Rp {(visit.totalProfit || 0).toLocaleString('id-ID')}</p>}
              <p className="thank-you">Terima kasih atas kunjungan Anda!</p>
            </div>
          </div>
        ) : (
          // --- Stock Activity Report View (If no sales) ---
          <div className="receipt-content">
            {/* --- NEW: Add Store Name --- */}
            <div className="store-name-header">
              <h1>RAFAEYZA BAROKAH</h1>
            </div>
            <h2 className="receipt-title">Laporan Aktivitas Stok</h2>
            <div className="receipt-header">
              <p><strong>Sales:</strong> {visit.user.name}</p>
              <p><strong>Pelanggan:</strong> {visit.customer.name}</p>
              <p><strong>Tanggal:</strong> {new Date(visit.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Stok Awal</th>
                  {/* NEW: Add column for added stock */}
                  <th>Tambah Stok</th>
                  <th>Stok Akhir</th>
                </tr>
              </thead>
              <tbody>
                {visit.inventory.map(item => (
                  <tr key={item.product?._id || item._id}>
                    <td>{item.product?.name || 'Produk Dihapus'}</td>
                    <td>{item.initialStock}</td>
                    <td>{item.addedStock || 0}</td>
                    <td>{item.finalStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="receipt-footer">
              <p className="note">Aktivitas stok telah dicatat.</p>
            </div>
          </div>
        )}
        <div className="print-button-container">
          <button className="print-button" onClick={handleBluetoothPrint} disabled={isPrinting}>
            {isPrinting ? 'Mencetak...' : 'Cetak via Bluetooth'}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default ReceiptPage;