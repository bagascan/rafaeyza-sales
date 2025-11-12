import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Gunakan axios langsung
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import Spinner from '../components/Spinner';
import { FaTrash } from 'react-icons/fa'; // 1. Import ikon tong sampah
import './VisitDetailPage.css';
import { Html5QrcodeScanner } from 'html5-qrcode'; // 1. Import library pemindai
import ProductSearchModal from '../components/ProductSearchModal'; // 1. Import modal
import { addOfflineVisit } from '../utils/db'; // 1. Import helper IndexedDB

// --- NEW: Haversine formula to calculate distance on the frontend ---
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371e3; // Earth's radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

const VisitDetailPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [allProducts, setAllProducts] = useState([]); // NEW: State to hold all available products
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInputError, setHasInputError] = useState(false); // State to track input validation errors
  const [salesLocation, setSalesLocation] = useState(null); // State for sales's current location
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null); // NEW: State for the photo preview URL
  const [isLocationValid, setIsLocationValid] = useState(false); // NEW: State to track if location is valid
  const [locationError, setLocationError] = useState(null);
  const [isScannerActive, setIsScannerActive] = useState(false); // 2. State untuk mengontrol pemindai
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false); // NEW: State for search modal
  
  const attendancePhotoRef = useRef(null); // NEW: Ref to store the actual photo file temporarily

  // --- NEW: Function to check distance and show toast ---
  // MOVED HERE to be initialized before any useEffect that might use it.
  const checkDistanceAndNotify = useCallback(() => {
    if (salesLocation && customer?.location) {
      const distance = calculateDistance(
        salesLocation.latitude,
        salesLocation.longitude,
        customer.location.latitude,
        customer.location.longitude
      );

      if (distance <= 200) { // 200 meters tolerance
        toast.success(`Jarak Anda sesuai (${distance.toFixed(0)} meter).`);
        setIsLocationValid(true);
      } else {
        toast.error(`Jarak Anda terlalu jauh (${distance.toFixed(0)} meter)!`);
        setIsLocationValid(false);
      }
    }
  }, [salesLocation, customer]);

  // --- CORRECTED: Define getLocation as a function ---
  const getLocation = useCallback(() => {
    // --- UPGRADED: Using robust, accuracy-focused location fetching logic ---
    if (navigator.geolocation) {
      const toastId = toast.loading('Mencari lokasi akurat...');
      let bestPosition = null;
      let watchId = null;

      const options = {
        enableHighAccuracy: true,
        timeout: 20000, // Give it a bit more time: 20 seconds
        maximumAge: 0,
      };

      const stopWatching = (finalPosition, message, isSuccess) => {
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null; // Prevent multiple clears
        }
        if (finalPosition) {
          setSalesLocation({
            latitude: finalPosition.coords.latitude,
            longitude: finalPosition.coords.longitude,
          });
          setLocationError(null);
          if (isSuccess) {
            toast.success(message, { id: toastId });
          } else {
            toast(message, { icon: '⚠️', id: toastId });
          }
        }
      };

      watchId = navigator.geolocation.watchPosition(
        (position) => { // Success callback, called repeatedly
          console.log(`Lokasi diterima dengan akurasi: ${position.coords.accuracy} meter.`);
           
          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
          }

          // If accuracy is good enough (e.g., under 50 meters), stop watching
          if (position.coords.accuracy <= 50) {
            stopWatching(position, 'Lokasi akurat berhasil ditemukan!', true); // Stop watching if accurate enough
          }
        },
        (err) => { // Error callback
          console.error("Geolocation error:", err);
          setLocationError(`Gagal mendapatkan lokasi: ${err.message}. Pastikan GPS dan izin lokasi aktif.`);
          toast.error(`Gagal mendapatkan lokasi: ${err.message}`, { id: toastId });
          if (watchId) navigator.geolocation.clearWatch(watchId);
        },
        options
      );

      // Fallback timeout
      setTimeout(() => {
        if (watchId) { // Only run if still watching
          if (bestPosition) {
            const accuracy = bestPosition.coords.accuracy.toFixed(0);
            // CRITICAL CHANGE: Only stop watching if the best accuracy is acceptable (< 200m)
            if (bestPosition.coords.accuracy <= 200) {
              stopWatching(bestPosition, `Akurasi terbaik: ${accuracy}m.`, false);
            } else {
              // If accuracy is still very bad, DON'T stop. Keep watching in the background.
              toast.dismiss(toastId); // Close the "Mencari..." toast
              toast.error(`Akurasi lokasi sangat rendah (${accuracy}m). Aplikasi akan terus mencoba di latar belakang.`);
              setLocationError(`Akurasi lokasi sangat rendah. Coba ke tempat lebih terbuka.`);
            }
          } else {
            // This case happens if no location was ever received
            stopWatching(null, null, false); // This will just clear the watch
            toast.error('Gagal mendapatkan lokasi dalam 20 detik.', { id: toastId });
            setLocationError('Timeout saat mencari lokasi. Coba lagi di tempat lebih terbuka.');
          }
        }
      }, options.timeout);

    } else {
      setLocationError("Geolocation tidak didukung di browser ini.");
    }
  }, []); // Empty dependency array as it has no external dependencies

  // Effect 1: Fetch initial data (customer and all products)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const customerRes = await axios.get(`/api/customers/${customerId}`);
        setCustomer(customerRes.data);

        const productsRes = await axios.get('/api/products');
        setAllProducts(productsRes.data);

        setInventory([]);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Gagal memuat data untuk kunjungan.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [customerId]);

  // Effect 2: Get sales location once on component mount
  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // Effect 3: Check distance whenever customer or sales location changes
  useEffect(() => {
    // This will run automatically when both `customer` and `salesLocation` are available.
    checkDistanceAndNotify();
  }, [customer, salesLocation, checkDistanceAndNotify]);


  // --- NEW: Function to add a product to the visit list ---
  // Moved before the scanner's useEffect to fix initialization error
  const handleAddProductToVisit = useCallback(async (product) => {
    // Cek lagi untuk memastikan produk belum ada
    if (inventory.some(item => item.product === product._id)) {
      toast.error(`${product.name} sudah ada dalam daftar.`);
      return;
    }

    // --- NEW: Fetch the last stock for this specific product ---
    const toastId = toast.loading(`Mencari stok awal untuk ${product.name}...`);
    try {
      const res = await axios.get(`/api/visits/last-stock/${customerId}/${product._id}`);
      const lastStock = res.data.finalStock;

      const newItem = {
        product: product._id,
        productName: product.name,
        barcode: product.barcode,
        initialStock: lastStock, // Set initial stock from the API response
        addedStock: 0,
        finalStock: 0,
        returns: 0,
        error: null,
      };
      setInventory(prev => [...prev, newItem]);
      toast.success(`${product.name} ditambahkan (Stok Awal: ${lastStock})`, { id: toastId });
      setIsSearchModalOpen(false); // Tutup modal setelah memilih
    } catch (err) {
      console.error('Failed to fetch last stock:', err);
      toast.error(`Gagal mendapatkan stok awal untuk ${product.name}.`, { id: toastId });
    }
  }, [inventory, customerId]);

  // --- NEW: useEffect untuk mengelola siklus hidup pemindai ---
  useEffect(() => {
    if (isScannerActive) {
      const scanner = new Html5QrcodeScanner(
        'barcode-reader', // ID dari elemen div
        {
          qrbox: { width: 250, height: 150 }, // Ukuran kotak pemindai
          fps: 10, // Frames per second
        },
        false // verbose
      );

      const onScanSuccess = (decodedText, decodedResult) => {
        // `decodedText` berisi nilai dari barcode yang dipindai
        console.log(`Barcode terdeteksi: ${decodedText}`);

        // Cek apakah produk sudah ada di daftar kunjungan
        const itemInList = inventory.find(item => item.barcode === decodedText);

        if (itemInList) {
          toast.success(`${itemInList.productName} sudah ada di daftar.`);
        } else {
          // Jika belum ada, cari di master produk
          const productToAdd = allProducts.find(p => p.barcode === decodedText);
          if (productToAdd) {
            // Panggil fungsi yang sama dengan penambahan manual
            handleAddProductToVisit(productToAdd);
          } else {
            toast.error('Barcode tidak cocok dengan produk manapun.');
          }
        }

        // Hentikan pemindai setelah berhasil untuk mencegah pemindaian berulang
        // Anda bisa juga membiarkannya aktif jika ingin memindai banyak item sekaligus
        // scanner.clear();
        // setIsScannerActive(false);
      };

      const onScanFailure = (error) => {
        // Tidak melakukan apa-apa saat gagal, agar tidak mengganggu pengguna
      };

      scanner.render(onScanSuccess, onScanFailure);

      // Fungsi cleanup untuk menghentikan pemindai saat komponen unmount atau pemindai dinonaktifkan
      return () => {
        try {
          if (scanner && scanner.getState() !== 'NOT_STARTED') {
            scanner.clear().catch(err => {
              console.error("Gagal membersihkan scanner:", err);
            });
          }
        } catch (err) {
          console.error("Error saat membersihkan scanner:", err);
        }
      };
    }
  }, [isScannerActive, inventory, allProducts, handleAddProductToVisit]); // FIX: Add missing dependencies

  // --- NEW: Function to REMOVE a product from the visit list ---
  const handleRemoveProductFromVisit = (productId, productName) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus "${productName}" dari daftar kunjungan ini?`)) {
      setInventory(prev => prev.filter(item => item.product !== productId));
      toast.success(`"${productName}" telah dihapus.`);
    }
  };


  // --- NEW: Validation Function ---
  const validateItem = (item) => {
    const { initialStock, addedStock, finalStock, returns } = item;
    const totalAvailable = initialStock + addedStock;

    if (finalStock > totalAvailable) {
      return `Stok Akhir (${finalStock}) tidak boleh lebih dari (Stok Awal + Tambah Stok) yaitu ${totalAvailable}.`;
    }

    if (returns > initialStock) {
      return `Retur (${returns}) tidak boleh lebih dari Stok Awal (${initialStock}).`;
    }

    // This implicitly checks for negative sales
    if (finalStock + returns > totalAvailable) {
      return `Kombinasi Stok Akhir (${finalStock}) dan Retur (${returns}) tidak boleh melebihi ${totalAvailable}.`;
    }

    return null; // No error
  };

  const handleInventoryChange = (productId, field, value) => {
    const newValue = parseInt(value, 10) || 0;
    setInventory(prevInventory => {
      const newInventory = prevInventory.map(item => {
        if (item.product === productId) {
          const updatedItem = { ...item, [field]: newValue };
          updatedItem.error = validateItem(updatedItem); // Validate on change
          return updatedItem;
        }
        return item;
      });
      setHasInputError(newInventory.some(item => item.error)); // Update global error state
      return newInventory;
    });
  };


  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      attendancePhotoRef.current = file; // Store the file in the ref instead of state

      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
      setPhotoPreviewUrl(URL.createObjectURL(file));
      
      // Trigger distance check immediately after photo is selected
      checkDistanceAndNotify();
      
    }
  };

  // --- NEW: Cleanup effect to revoke the object URL when the component unmounts ---
  useEffect(() => {
    // This function will run ONLY when the component is about to unmount.
    const currentPhotoPreviewUrl = photoPreviewUrl;
    // This function will run ONLY when the component is about to unmount,
    // or when photoPreviewUrl changes.
    return () => {
      if (currentPhotoPreviewUrl) URL.revokeObjectURL(currentPhotoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  // --- NEW: Re-check distance if location updates after photo is taken ---
  useEffect(() => {
    if (photoPreviewUrl) { // Only check if a photo has already been taken (indicated by preview URL)
      checkDistanceAndNotify();
    }
  }, [salesLocation, photoPreviewUrl, checkDistanceAndNotify]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Menyimpan data kunjungan...');

    // --- NEW: Offline Handling Logic ---
    if (!navigator.onLine) {
      try {
        // Simpan data ke IndexedDB untuk sinkronisasi nanti
        await addOfflineVisit({ // IndexedDB can store File objects directly
          customerId,
          salesLocation,
          inventory: inventory.filter(item => item.initialStock > 0 || item.addedStock > 0 || item.finalStock > 0 || item.returns > 0),
          attendancePhoto: attendancePhotoRef.current, // Get the file from ref
        });

        // Daftarkan event 'sync' ke Service Worker
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-new-visit');

        toast.success('Anda sedang offline. Data disimpan lokal & akan disinkronkan otomatis.', { id: toastId, duration: 5000 });
        navigate('/'); // Arahkan kembali ke dashboard
      } catch (offlineErr) {
        console.error('Failed to save visit offline:', offlineErr);
        toast.error('Gagal menyimpan data kunjungan secara lokal.', { id: toastId });
      } finally {
        setIsSubmitting(false);
      }
      return; // Hentikan eksekusi lebih lanjut jika offline
    }

    try {
      // Filter inventory to only include items that have been touched
      const touchedInventory = inventory.filter(item => item.initialStock > 0 || item.addedStock > 0 || item.finalStock > 0 || item.returns > 0);

      if (touchedInventory.length === 0) {
        toast.error("Mohon isi setidaknya satu data stok atau retur.", { id: toastId });
        setIsSubmitting(false);
        return;
      }

      if (!salesLocation) {
        toast.error("Lokasi Anda belum terdeteksi. Mohon tunggu atau aktifkan GPS.", { id: toastId });
        setIsSubmitting(false);
        return;
      }

      if (!attendancePhotoRef.current) { // Check if a photo file exists in the ref
        toast.error("Mohon ambil foto absensi terlebih dahulu.", { id: toastId });
        setIsSubmitting(false);
        return;
      }

      // --- NEW: Final check before submitting ---
      if (!isLocationValid) {
        toast.error("Jarak Anda terlalu jauh. Absensi tidak dapat disimpan.", { id: toastId });
        setIsSubmitting(false);
        return;
      }

      // --- CRITICAL FIX: Construct FormData correctly ---
      const formData = new FormData();
      
      // Append all text-based data
      formData.append('customerId', customerId);
      formData.append('salesLatitude', salesLocation.latitude);
      formData.append('salesLongitude', salesLocation.longitude);

      // Append inventory as a JSON string
      const inventoryPayload = touchedInventory.map(item => ({
        product: item.product,
        initialStock: item.initialStock,
        addedStock: item.addedStock,
        finalStock: item.finalStock,
        returns: item.returns,
      }));
      formData.append('inventory', JSON.stringify(inventoryPayload));
      
      // Append the photo file with the correct fieldname
      formData.append('attendancePhoto', attendancePhotoRef.current); // Get the file from ref

      // Store the result of the axios call into a 'res' constant
      const res = await axios.post('/api/visits', formData);
      toast.success('Kunjungan berhasil disimpan!', { id: toastId });

      // Redirect to the receipt page, passing only the NEW visit ID.
      navigate(`/receipt/${res.data._id}`);
      attendancePhotoRef.current = null; // Clear the ref after successful submission

    } catch (err) {
      console.error('Error submitting visit:', err);
      const errorMsg = err.response?.data?.msg || 'Gagal menyimpan data kunjungan. Coba lagi.';
      toast.error(errorMsg, { id: toastId });
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <MainLayout title="Memuat..."><Spinner /></MainLayout>;
  if (error) return <MainLayout title="Error"><p>{error}</p></MainLayout>;

  return (
    <MainLayout title={`Kunjungan: ${customer?.name || ''}`}>
      <div className="visit-detail-page">
        <div className="attendance-section">
          <h4>Absensi di Lokasi</h4>
          {locationError && <p className="location-error">{locationError}</p>}
          {salesLocation && (
            <p className="location-info">
              Lokasi Anda: Lat {salesLocation.latitude.toFixed(5)}, Lon {salesLocation.longitude.toFixed(5)}
            </p>
          )}
        <div className="input-group">
          {/* The label acts as a custom-styled button for the hidden file input */}
          <label htmlFor="attendance-photo" className="photo-label">
            {photoPreviewUrl ? 'Ambil Ulang Foto' : 'Ambil Foto Selfie'}
          </label>
          {/* This is the actual file input, hidden by CSS. `capture="user"` prompts for the front camera. */}
          <input
            type="file"
            id="attendance-photo"
            accept="image/*"
            capture="user"
            onChange={handlePhotoChange}
          />
        </div>
        {/* --- NEW: Display the photo preview --- */}
        {photoPreviewUrl && (
          <div className="photo-preview-container">
            <img src={photoPreviewUrl} alt="Pratinjau Absensi" className="photo-preview" />
          </div>
        )}
        </div>

        {/* --- NEW: Tombol dan Area untuk Barcode Scanner --- */}
        <div className="scanner-section">
          <button type="button" className="scan-btn" onClick={() => setIsScannerActive(prev => !prev)}>
            {isScannerActive ? 'Tutup Pemindai' : 'Pindai Barcode Produk'}
          </button>
          {/* --- NEW: Tombol untuk menambah manual --- */}
          <button type="button" className="add-manual-btn" onClick={() => setIsSearchModalOpen(true)}>
            Tambah Produk Manual
          </button>
          {isScannerActive && (
            <div id="barcode-reader" className="barcode-reader-container"></div>
          )}
        </div>

        {/* --- NEW: Render the modal conditionally --- */}
        {isSearchModalOpen && (
          <ProductSearchModal
            products={allProducts}
            onSelect={handleAddProductToVisit}
            onClose={() => setIsSearchModalOpen(false)}
            existingProductIds={inventory.map(item => item.product)}
          />
        )}

        <form onSubmit={handleSubmit}>
          <div className="product-inventory-list">
            {inventory.length === 0 && !loading && (
              <p className="empty-visit-list">Daftar produk kunjungan masih kosong. Pindai barcode atau tambah produk secara manual.</p>
            )}
            {inventory.map(item => (
              <div key={item.product} className="product-inventory-card">
                {/* 2. Ubah header kartu untuk menyertakan tombol hapus */}
                <div className="card-header">
                  <h4>{item.productName}</h4>
                  <button type="button" className="remove-product-btn" onClick={() => handleRemoveProductFromVisit(item.product, item.productName)}>
                    <FaTrash />
                  </button>
                </div>
                <div className="inventory-inputs">
                  <div className="input-group"> {/* This class is now more specific in the CSS */}
                    <label htmlFor={`initial-${item.product}`}>Stok Awal</label>
                    <input
                      type="number"
                      id={`initial-${item.product}`}
                      value={item.initialStock}
                      readOnly // LOCK THE INPUT
                      className="readonly-input" // Add a class for styling
                      min="0"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor={`added-${item.product}`}>Tambah Stok</label>
                    <input
                      type="number"
                      id={`added-${item.product}`}
                      value={item.addedStock}
                      onChange={(e) => handleInventoryChange(item.product, 'addedStock', e.target.value)}
                      min="0"
                      className="added-stock-input"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor={`final-${item.product}`}>Stok Akhir</label>
                    <input
                      type="number"
                      id={`final-${item.product}`}
                      value={item.finalStock}
                      onChange={(e) => handleInventoryChange(item.product, 'finalStock', e.target.value)}
                      min="0"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor={`returns-${item.product}`}>Retur</label>
                    <input
                      type="number"
                      id={`returns-${item.product}`}
                      value={item.returns}
                      onChange={(e) => handleInventoryChange(item.product, 'returns', e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
                {/* --- NEW: Display Validation Error --- */}
                {item.error && (
                  <p className="inventory-error-message">{item.error}</p>
                )}
              </div>
            ))}
          </div>
          {/* --- MODIFIED: Disable button on input error --- */}
          <button type="submit" className="submit-visit-btn" disabled={isSubmitting || hasInputError}>
            {isSubmitting ? 'Memproses...' : (hasInputError ? 'Perbaiki Input' : 'Cetak Nota')}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

export default VisitDetailPage;