import axios from 'axios';

// ==================================================
// INSTANCE UNTUK API BACKEND ANDA (DEFAULT EXPORT)
// ==================================================
const api = axios.create({
  // Ambil URL dasar dari environment variable.
  baseURL: process.env.REACT_APP_API_URL
});

/*
 * Gunakan interceptor untuk menambahkan token otentikasi secara otomatis
 * ke setiap permintaan jika pengguna sudah login.
 */
api.interceptors.request.use(
  (config) => {
    // Ambil token dari localStorage (atau di mana pun Anda menyimpannya)
    const token = localStorage.getItem('token');
    if (token) {
      // Jika token ada, tambahkan ke header Authorization
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Lakukan sesuatu jika ada error pada permintaan
    return Promise.reject(error);
  }
);

export default api;

// ==================================================
// INSTANCE UNTUK API EKSTERNAL (PETA NOMINATIM)
// ==================================================
export const nominatimApi = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org'
});

/*
 * Catatan: Kita tidak perlu interceptor untuk API ini karena
 * ini adalah API publik dan tidak memerlukan token otentikasi.
 */
