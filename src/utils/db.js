import { openDB } from 'idb';

const DB_NAME = 'RafaeyzaSalesDB';
const STORE_NAME = 'offlineVisits';
const DB_VERSION = 1;

// Inisialisasi database
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

// Fungsi untuk menyimpan data kunjungan offline
export const addOfflineVisit = async (visitData) => {
  const db = await initDB();
  await db.add(STORE_NAME, visitData);
};

// Fungsi untuk mendapatkan semua data kunjungan offline
export const getAllOfflineVisits = async () => {
  const db = await initDB();
  return await db.getAll(STORE_NAME);
};

// Fungsi untuk menghapus data kunjungan offline berdasarkan ID
export const deleteOfflineVisit = async (id) => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
};
