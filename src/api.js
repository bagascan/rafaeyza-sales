import axios from 'axios';

// 1. Buat sebuah instance axios yang sudah dikonfigurasi sebelumnya.
const api = axios.create({
  // 2. Ambil URL dasar dari environment variable yang sudah kita siapkan.
  baseURL: process.env.REACT_APP_API_URL
});

/*
 * 3. (Opsional tapi sangat direkomendasikan)
 *    Gunakan interceptor untuk menambahkan token otentikasi secara otomatis
 *    ke setiap permintaan jika pengguna sudah login.
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

// 4. Ekspor instance yang sudah siap pakai ini.
export default api;
