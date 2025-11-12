import axios from 'axios';

// Kita tidak lagi mengatur baseURL secara global.
// Semua panggilan akan menggunakan path relatif (misal: '/api/auth/login')
// dan akan ditangani oleh proxy server (vercel dev atau Vercel saat deploy).

export default axios;
