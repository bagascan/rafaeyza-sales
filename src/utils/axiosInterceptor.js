import api from '../api';
import { toast } from 'react-hot-toast';

const setupAxiosInterceptors = (onUnauthenticated) => {
  api.interceptors.response.use(
    // Jika respons berhasil, lanjutkan saja
    (response) => response,
    // Jika ada error pada respons
    (error) => {
      // Periksa apakah error memiliki respons dari server dan status 401
      if (error.response && error.response.status === 401) {
        // Status 401 (Unauthorized) berarti token tidak valid atau kedaluwarsa
        toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
        
        // Panggil fungsi callback untuk logout
        onUnauthenticated();
      }
      
      // Kembalikan error agar bisa ditangani oleh block .catch() di tempat lain jika perlu
      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;
