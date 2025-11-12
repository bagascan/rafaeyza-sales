/* eslint-disable no-restricted-globals */

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies'; // 1. Import NetworkFirst
import { getAllOfflineVisits, deleteOfflineVisit } from './utils/db'; // 1. Import helper IndexedDB

// Perintah ini memastikan Service Worker yang baru akan mengambil alih halaman
// secepat mungkin, tanpa menunggu tab lama ditutup.
clientsClaim();

// Precache semua aset yang dihasilkan oleh proses build.
// URL mereka akan dimasukkan ke dalam variabel self.__WB_MANIFEST oleh Workbox.
precacheAndRoute(self.__WB_MANIFEST);

// Atur caching untuk file index.html agar aplikasi bisa berfungsi sebagai Single Page App (SPA).
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  // Return false to exempt requests from being fulfilled by index.html.
  ({ request, url }) => {
    // If this isn't a navigation, skip.
    if (request.mode !== 'navigate') {
      return false;
    } // If this is a URL that starts with /_, skip.
    if (url.pathname.startsWith('/_')) {
      return false;
    } // If this looks like a URL for a resource, because it contains // a file extension, skip.
    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    } // Return true to signal that we want to use the handler.
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// Contoh aturan caching untuk aset lain (misalnya, gambar dari API).
// Ini menggunakan strategi "StaleWhileRevalidate": menyajikan dari cache terlebih dahulu,
// lalu memperbarui di latar belakang.
registerRoute(
  // Tambahkan origin API atau sumber gambar lainnya di sini.
  ({ url }) => url.origin === self.location.origin && url.pathname.endsWith('.png'),
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      // Pastikan cache tidak membengkak. Hapus gambar yang lebih dari 30 hari.
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// --- NEW: Aturan Caching untuk API Data (Pelanggan, Produk, dll.) ---
registerRoute(
  // Targetkan semua permintaan ke origin API Anda
  ({ url }) => url.pathname.startsWith('/api/'), // Cukup periksa path /api
  // Gunakan strategi NetworkFirst: coba jaringan dulu, fallback ke cache jika offline
  new NetworkFirst({
    cacheName: 'api-data-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100, // Simpan hingga 100 permintaan API
        maxAgeSeconds: 24 * 60 * 60, // Cache data selama 1 hari
      }),
    ],
  })
);
// --- END NEW ---

// Ini adalah bagian terpenting untuk permintaan Anda.
// Listener ini akan dipicu ketika Service Worker baru sudah ter-install.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// --- NEW: Listener untuk event 'push' dari server ---
self.addEventListener('push', (event) => {
  const data = event.data.json(); // Ambil data payload dari notifikasi
  console.log('Push-Benachrichtigung empfangen:', data);

  const options = {
    body: data.body,
    icon: data.icon || '/logo192.png', // Ikon default jika tidak ada
    badge: '/favicon.ico', // Ikon kecil di status bar Android
    vibrate: [200, 100, 200], // Pola getar
  };

  // Tampilkan notifikasi
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// --- NEW: Listener untuk event 'notificationclick' ---
self.addEventListener('notificationclick', (event) => {
  console.log('Auf Benachrichtigung geklickt:', event.notification.tag);
  event.notification.close(); // Tutup notifikasi
  // Fokus ke tab aplikasi yang sudah ada, atau buka tab baru jika belum ada.
  event.waitUntil(self.clients.openWindow('/'));
});

// --- NEW: Listener untuk event 'sync' (Background Sync) ---
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-new-visit') {
    console.log('Service Worker: Memicu sinkronisasi untuk kunjungan baru.');
    // Kirim data yang tersimpan di IndexedDB
    event.waitUntil(syncNewVisits());
  }
});

async function syncNewVisits() {
  const offlineVisits = await getAllOfflineVisits();
  for (const visit of offlineVisits) {
    try {
      const formData = new FormData();
      formData.append('customerId', visit.customerId);
      formData.append('salesLatitude', visit.salesLocation.latitude);
      formData.append('salesLongitude', visit.salesLocation.longitude);
      formData.append('inventory', JSON.stringify(visit.inventory.map(item => ({
        product: item.product,
        initialStock: item.initialStock,
        addedStock: item.addedStock,
        finalStock: item.finalStock,
        returns: item.returns,
      }))));
      formData.append('attendancePhoto', visit.attendancePhoto);

      // Menggunakan fetch karena axios tidak tersedia di Service Worker
      const response = await fetch('/api/visits', { // Gunakan URL relatif
        method: 'POST',
        body: formData,
        // Headers tidak perlu 'Content-Type', browser akan mengaturnya untuk FormData
      });

      if (response.ok) {
        console.log('Service Worker: Kunjungan offline berhasil disinkronkan.', visit.id);
        // Hapus dari IndexedDB setelah berhasil
        await deleteOfflineVisit(visit.id);
      } else {
        console.error('Service Worker: Gagal sinkronisasi, server merespons dengan error.', await response.text());
      }
    } catch (error) {
      console.error('Service Worker: Gagal sinkronisasi karena error jaringan atau lainnya.', error);
      // Jangan hapus dari DB jika gagal, akan dicoba lagi di sinkronisasi berikutnya
    }
  }
}
