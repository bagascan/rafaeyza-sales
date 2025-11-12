import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Gunakan axios langsung
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import MainLayout from '../components/layout/MainLayout';
import RouteMap from '../components/RouteMap'; // Impor komponen peta rute
import Spinner from '../components/Spinner';
import './RouteReportPage.css'; // Kita akan buat file CSS ini

// Fungsi untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const RouteReportPage = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(getTodayDateString());
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth(); // Dapatkan info pengguna dari context

  // Redirect jika bukan admin
  if (user && user.role !== 'admin') {
    toast.error('Anda tidak memiliki akses ke halaman ini.');
    navigate('/reports');
  }

  useEffect(() => {
    const fetchVisitsByDate = async () => {
      if (!date) return;
      setLoading(true);
      try {
        // Ganti URL ini dengan endpoint API Anda yang sebenarnya
        const res = await axios.get(`/api/reports/visits-by-date?date=${date}`);
        
        // --- CRITICAL FIX: Filter out visits that don't have valid location data ---
        const validVisits = res.data.filter(visit => 
          visit.customer && 
          visit.customer.location &&
          typeof visit.customer.location.latitude === 'number' &&
          typeof visit.customer.location.longitude === 'number'
        );

        // Sort the valid visits by time to ensure the route is correct
        const sortedVisits = validVisits.sort((a, b) => new Date(a.visitTime) - new Date(b.visitTime));
        setVisits(sortedVisits); // Set state with only valid and sorted visits

        if (res.data.length === 0) {
          toast.success('Tidak ada data kunjungan pada tanggal ini.');
        }
      } catch (err) {
        console.error('Error fetching visit data:', err);
        toast.error('Gagal memuat data kunjungan.');
      } finally {
        setLoading(false);
      }
    };

    // Hanya jalankan fetchVisitsByDate jika pengguna adalah admin
    if (user?.role === 'admin') {
      fetchVisitsByDate();
    }
  }, [date, user, navigate]);
  
  return (
    <MainLayout title="Laporan Rute Kunjungan">
      <div className="route-report-container">
        <div className="filter-bar">
          <label htmlFor="visit-date">Pilih Tanggal:</label>
          <input
            type="date"
            id="visit-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="date-input"
          />
        </div>

        <div className="map-section">
          {loading ? <Spinner /> : <RouteMap visits={visits} />}
        </div>

        <div className="visit-list-section">
            <h3>Detail Kunjungan ({visits.length})</h3>
            {visits.length > 0 ? (
                <ol className="visit-list">
                    {visits.map((visit, index) => (
                        <li key={visit._id}>
                            <span className="visit-order">{index + 1}</span>
                            <div className="visit-details">
                                <span className="customer-name">{visit.customer.name}</span>
                                <span className="visit-time">{new Date(visit.visitTime).toLocaleTimeString('id-ID')}</span>
                            </div>
                        </li>
                    ))}
                </ol>
            ) : (
                <p className="no-visits-message">Tidak ada kunjungan untuk ditampilkan.</p>
            )}
        </div>
      </div>
    </MainLayout>
  );
};

export default RouteReportPage;
