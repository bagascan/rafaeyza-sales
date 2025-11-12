// Contoh SESUDAH
import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL // Menggunakan URL absolut dari .env
});

export default instance;
