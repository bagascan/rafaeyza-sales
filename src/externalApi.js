import axios from 'axios';

// Buat instance axios baru tanpa konfigurasi default global.
// Instance ini "bersih" dan bisa digunakan untuk API eksternal manapun.
const externalApi = axios.create();

export default externalApi;
