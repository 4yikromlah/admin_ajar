/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Siswa, Nilai, Presensi, Pembelajaran, Pengumuman, AppSettings, Rangkuman } from './types';

// ============================================================================
// DATA SEED AWAL (Untuk Demo & Pengisian Awal Aplikasi)
// ============================================================================

export const SEED_SISWA: Siswa[] = [
  { id: 'S01', nis: '12401', nama: 'Ahmad Fauzi', kelas: 'XI-MIPA-1', email: 'ahmad.fauzi@smasa.sch.id', username: '12401', password: 'smasa123' },
  { id: 'S02', nis: '12402', nama: 'Siti Nurhaliza', kelas: 'XI-MIPA-1', email: 'siti.nur@smasa.sch.id', username: '12402', password: 'smasa123' },
  { id: 'S03', nis: '12403', nama: 'Budi Santoso', kelas: 'XI-MIPA-2', email: 'budi.santoso@smasa.sch.id', username: '12403', password: 'smasa123' },
  { id: 'S04', nis: '12404', nama: 'Larasati Putri', kelas: 'XI-MIPA-2', email: 'larasati.p@smasa.sch.id', username: '12404', password: 'smasa123' },
  { id: 'S05', nis: '12405', nama: 'Dewi Lestari', kelas: 'XI-IPS-1', email: 'dewi.lestari@smasa.sch.id', username: '12405', password: 'smasa123' },
  { id: 'S06', nis: '12406', nama: 'Rian Hidayat', kelas: 'XI-IPS-1', email: 'rian.hid@smasa.sch.id', username: '12406', password: 'smasa123' },
];

export const SEED_NILAI: Nilai[] = [
  { id: 'N01', siswaId: 'S01', siswaNama: 'Ahmad Fauzi', siswaKelas: 'XI-MIPA-1', tugas: 85, uh1: 80, uh2: 80, uh3: 80, uts: 88, uas: 90, total: 86.4, grade: 'A' },
  { id: 'N02', siswaId: 'S02', siswaNama: 'Siti Nurhaliza', siswaKelas: 'XI-MIPA-1', tugas: 90, uh1: 95, uh2: 95, uh3: 95, uts: 92, uas: 94, total: 92.7, grade: 'A' },
  { id: 'N03', siswaId: 'S03', siswaNama: 'Budi Santoso', siswaKelas: 'XI-MIPA-2', tugas: 75, uh1: 70, uh2: 70, uh3: 70, uts: 78, uas: 80, total: 76.4, grade: 'B' },
  { id: 'N04', siswaId: 'S04', siswaNama: 'Larasati Putri', siswaKelas: 'XI-MIPA-2', tugas: 88, uh1: 85, uh2: 85, uh3: 85, uts: 80, uas: 85, total: 83.9, grade: 'A' },
  { id: 'N05', siswaId: 'S05', siswaNama: 'Dewi Lestari', siswaKelas: 'XI-IPS-1', tugas: 80, uh1: 75, uh2: 75, uh3: 75, uts: 82, uas: 78, total: 78.9, grade: 'B' },
];

export const SEED_PRESENSI: Presensi[] = [
  { id: 'P01', siswaId: 'S01', siswaNama: 'Ahmad Fauzi', siswaKelas: 'XI-MIPA-1', tanggal: '2026-07-07', status: 'Hadir' },
  { id: 'P02', siswaId: 'S02', siswaNama: 'Siti Nurhaliza', siswaKelas: 'XI-MIPA-1', tanggal: '2026-07-07', status: 'Hadir' },
  { id: 'P03', siswaId: 'S03', siswaNama: 'Budi Santoso', siswaKelas: 'XI-MIPA-2', tanggal: '2026-07-07', status: 'Izin' },
  { id: 'P04', siswaId: 'S04', siswaNama: 'Larasati Putri', siswaKelas: 'XI-MIPA-2', tanggal: '2026-07-07', status: 'Hadir' },
  { id: 'P05', siswaId: 'S05', siswaNama: 'Dewi Lestari', siswaKelas: 'XI-IPS-1', tanggal: '2026-07-07', status: 'Sakit' },
];

export const SEED_PEMBELAJARAN: Pembelajaran[] = [
  { id: 'M01', jenis: 'Modul', judul: 'Pengenalan Jaringan Komputer & Topologi', deskripsi: 'Materi dasar mengenai perangkat jaringan, IP Address, subnetting, dan topologi jaringan LAN/WAN.', tautan: 'https://drive.google.com/file/d/12345/view', tanggal: '2026-07-01' },
  { id: 'M02', jenis: 'Literasi', judul: 'Etika Digital dan Keamanan Siber', deskripsi: 'Artikel bacaan wajib tentang keamanan password, phishing, dan UU ITE untuk memperluas literasi digital siswa.', tautan: 'https://kompasiana.com/artikel-cybersecurity', tanggal: '2026-07-03' },
  { id: 'M03', jenis: 'Tugas/Tes', judul: 'Kuis Evaluasi Algoritma Pemrograman', deskripsi: 'Evaluasi pemahaman logika perulangan (looping), kondisi (if-else), dan array menggunakan pseudocode.', tautan: 'https://forms.gle/smasa-kuis-algoritma', tanggal: '2026-07-05' },
];

export const SEED_PENGUMUMAN: Pengumuman[] = [
  { id: 'A01', judul: 'Ujian Tengah Semester Ganjil', isi: 'UTS Informatika akan dilaksanakan secara daring melalui Lab Komputer pada tanggal 14 September 2026. Persiapkan materi Jaringan dan Algoritma.', tanggal: '2026-07-06', kategori: 'Penting' },
  { id: 'A02', judul: 'Tugas Literasi Digital Ditambahkan', isi: 'Silakan baca modul Literasi Keamanan Siber dan buat rangkuman 1 halaman di MS Word kemudian kumpulkan pada sub-menu Tugas.', tanggal: '2026-07-05', kategori: 'Tugas' },
  { id: 'A03', judul: 'Penyegaran Lab Komputer SMASA', isi: 'Lab Komputer 2 telah diperbarui dengan unit PC baru. Kelas Informatika mulai minggu depan akan bergantian menggunakannya.', tanggal: '2026-07-04', kategori: 'Info' },
];

// ============================================================================
// STRUKTUR PENYIMPANAN LOCALSTORAGE & JEMBATAN INTEGRASI GOOGLE SHEETS
// ============================================================================

/**
 * PANDUAN INTEGRASI GOOGLE SHEETS API / GOOGLE APPS SCRIPT:
 * 
 * Untuk memindahkan penyimpanan dari LocalStorage ke Google Sheets, Anda bisa membuat Google Apps Script
 * yang dideploy sebagai Web App ("Web App Executable"). Apps Script ini akan bertindak sebagai REST API:
 * 
 * Contoh Google Apps Script (Code.gs):
 * ----------------------------------------------------------------------------
 * function doGet(e) {
 *   var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(e.parameter.sheet);
 *   var data = sheet.getDataRange().getValues();
 *   var headers = data[0];
 *   var jsonArray = [];
 *   for (var i = 1; i < data.length; i++) {
 *     var obj = {};
 *     for (var j = 0; j < headers.length; j++) {
 *       obj[headers[j]] = data[i][j];
 *     }
 *     jsonArray.push(obj);
 *   }
 *   return ContentService.createTextOutput(JSON.stringify(jsonArray)).setMimeType(ContentService.MimeType.JSON);
 * }
 * 
 * function doPost(e) {
 *   var params = JSON.parse(e.postData.contents);
 *   var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(params.sheet);
 *   
 *   if (params.action == "create") {
 *     sheet.appendRow(params.row);
 *     return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
 *   }
 *   // Implementasikan juga action "update" dan "delete" sesuai ID unik.
 * }
 * ----------------------------------------------------------------------------
 * 
 * Pada sisi React, Anda cukup mengganti fungsi load/save di bawah ini dengan pemanggilan fetch()
 * ke Web App URL dari Google Apps Script tersebut.
 */

export function getActiveTeacherUsername(): string {
  return localStorage.getItem('loggedTeacherUsername') || '';
}

export function getGoogleAppsScriptUrl(): string {
  try {
    const username = getActiveTeacherUsername();
    const prefix = username ? `smasa_${username}_` : 'smasa_';
    const settingsStr = localStorage.getItem(`${prefix}settings`);
    if (settingsStr) {
      const parsed = JSON.parse(settingsStr);
      if (parsed.spreadsheetUrl) return parsed.spreadsheetUrl;
    }
    // Fallback to central teacher list spreadsheetUrl
    if (username) {
      const teachers = loadTeacherAccounts();
      const me = teachers.find(t => t.username === username);
      if (me && me.spreadsheetUrl) {
        return me.spreadsheetUrl;
      }
    }
  } catch (e) {}
  return "";
}

export interface FullDatabase {
  siswa: Siswa[];
  nilai: Nilai[];
  presensi: Presensi[];
  pembelajaran: Pembelajaran[];
  pengumuman: Pengumuman[];
  settings: AppSettings;
  rangkuman: Rangkuman[];
}

export async function pushToGoogleSheets(): Promise<boolean> {
  const url = getGoogleAppsScriptUrl();
  if (!url) return false;

  const db: FullDatabase = {
    siswa: loadSiswa(),
    nilai: loadNilai(),
    presensi: loadPresensi(),
    pembelajaran: loadPembelajaran(),
    pengumuman: loadPengumuman(),
    settings: loadSettings(),
    rangkuman: loadRangkuman(),
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(db),
    });
    if (!response.ok) throw new Error("Gagal mengunggah data ke Google Sheets");
    
    let isSuccess = false;
    try {
      const result = await response.json();
      isSuccess = result.status === "success";
    } catch (e) {
      // Jika request berhasil (status 200/201) tapi response JSON terblokir oleh CORS redirect sandbox Google,
      // kita tetap anggap sukses karena data dipastikan sudah terkirim dan disimpan di Apps Script.
      if (response.ok) {
        isSuccess = true;
      }
    }
    return isSuccess;
  } catch (error) {
    console.error("[Google Sheets Sync Error] Gagal push:", error);
    throw error;
  }
}

function mergeArraysById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const merged = [...remote];
  const remoteIds = new Set(remote.map(item => item.id));
  
  local.forEach(localItem => {
    if (!remoteIds.has(localItem.id)) {
      merged.push(localItem);
    }
  });
  return merged;
}

export async function pullFromGoogleSheets(): Promise<boolean> {
  const url = getGoogleAppsScriptUrl();
  if (!url) return false;

  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
    });
    if (!response.ok) throw new Error("Gagal mengambil data dari Google Sheets");
    const db = await response.json();
    
    if (db) {
      if (Array.isArray(db.siswa)) {
        const localSiswa = loadSiswa();
        saveSiswa(mergeArraysById(localSiswa, db.siswa));
      }
      if (Array.isArray(db.nilai)) {
        const localNilai = loadNilai();
        saveNilai(mergeArraysById(localNilai, db.nilai));
      }
      if (Array.isArray(db.presensi)) {
        const localPresensi = loadPresensi();
        savePresensi(mergeArraysById(localPresensi, db.presensi));
      }
      if (Array.isArray(db.pembelajaran)) {
        const localPembelajaran = loadPembelajaran();
        savePembelajaran(mergeArraysById(localPembelajaran, db.pembelajaran));
      }
      if (Array.isArray(db.pengumuman)) {
        const localPengumuman = loadPengumuman();
        savePengumuman(mergeArraysById(localPengumuman, db.pengumuman));
      }
      if (db.settings) {
        const settingsObj = Array.isArray(db.settings) ? db.settings[0] : db.settings;
        if (settingsObj && settingsObj.namaGuru) {
          if (settingsObj.kkm) settingsObj.kkm = Number(settingsObj.kkm);
          saveSettings({ ...DEFAULT_SETTINGS, ...settingsObj, spreadsheetUrl: url });
        }
      }
      if (Array.isArray(db.rangkuman)) {
        const localRangkuman = loadRangkuman();
        saveRangkuman(mergeArraysById(localRangkuman, db.rangkuman));
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("[Google Sheets Sync Error] Gagal pull:", error);
    throw error;
  }
}

export async function fetchFromGoogleSheets(sheetName: string): Promise<any[]> {
  const url = getGoogleAppsScriptUrl();
  if (!url) {
    console.warn(`[Google Sheets] URL belum dikonfigurasi. Menggunakan data lokal.`);
    return [];
  }
  try {
    const response = await fetch(`${url}?sheet=${sheetName}`);
    if (!response.ok) throw new Error("Gagal mengambil data dari Google Sheets");
    return await response.json();
  } catch (error) {
    console.error(`[Google Sheets Error] Gagal fetch ${sheetName}:`, error);
    return [];
  }
}

export async function sendToGoogleSheets(sheetName: string, action: 'create' | 'update' | 'delete', data: any): Promise<boolean> {
  const url = getGoogleAppsScriptUrl();
  if (!url) {
    console.warn(`[Google Sheets] URL belum dikonfigurasi. Operasi lokal berhasil disimpan.`);
    return true;
  }
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheet: sheetName, action, data })
    });
    const result = await response.json();
    return result.status === "success";
  } catch (error) {
    console.error(`[Google Sheets Error] Gagal kirim data ke ${sheetName}:`, error);
    return false;
  }
}

// ============================================================================
// ENGINE PENYIMPANAN LOCAL STORAGE DENGAN FALLBACK SEED DATA
// ============================================================================

export function getLocalStorageData<T>(key: string, seed: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error(`Gagal membaca localStorage [${key}]:`, e);
    return seed;
  }
}

export function saveLocalStorageData<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Gagal menyimpan ke localStorage [${key}]:`, e);
  }
}

import { TeacherAccount } from './types';

export const SEED_TEACHERS: TeacherAccount[] = [
  { id: 'T01', nama: 'Romlah, S.Kom., M.Cs.', username: 'romlah', password: 'password', mataPelajaran: 'Informatika', isApproved: true, asalSekolah: 'SMAN 1 Magetan' },
  { id: 'T02', nama: 'Bambang Subianto, S.Pd.', username: 'bambang', password: 'password', mataPelajaran: 'Matematika', isApproved: true, asalSekolah: 'SMAN 1 Magetan' },
];

export const loadTeacherAccounts = (): TeacherAccount[] => {
  return getLocalStorageData<TeacherAccount>('smasa_teachers', SEED_TEACHERS);
};

export const saveTeacherAccounts = (data: TeacherAccount[]) => {
  saveLocalStorageData<TeacherAccount>('smasa_teachers', data);
};

// Helper to prefix keys for active teacher
function getScopedKey(key: string): string {
  const username = getActiveTeacherUsername();
  return username ? `smasa_${username}_${key}` : `smasa_${key}`;
}

// ----------------------------------------------------------------------------
// HOOKS OPERASI SISWA
// ----------------------------------------------------------------------------
export const loadSiswa = (): Siswa[] => getLocalStorageData<Siswa>(getScopedKey('siswa'), SEED_SISWA);
export const saveSiswa = (data: Siswa[]) => {
  saveLocalStorageData<Siswa>(getScopedKey('siswa'), data);
};

// ----------------------------------------------------------------------------
// HOOKS OPERASI NILAI
// ----------------------------------------------------------------------------
export const loadNilai = (): Nilai[] => getLocalStorageData<Nilai>(getScopedKey('nilai'), SEED_NILAI);
export const saveNilai = (data: Nilai[]) => {
  saveLocalStorageData<Nilai>(getScopedKey('nilai'), data);
};

// ----------------------------------------------------------------------------
// HOOKS OPERASI PRESENSI
// ----------------------------------------------------------------------------
export const loadPresensi = (): Presensi[] => getLocalStorageData<Presensi>(getScopedKey('presensi'), SEED_PRESENSI);
export const savePresensi = (data: Presensi[]) => {
  saveLocalStorageData<Presensi>(getScopedKey('presensi'), data);
};

// ----------------------------------------------------------------------------
// HOOKS OPERASI PEMBELAJARAN
// ----------------------------------------------------------------------------
export const loadPembelajaran = (): Pembelajaran[] => getLocalStorageData<Pembelajaran>(getScopedKey('pembelajaran'), SEED_PEMBELAJARAN);
export const savePembelajaran = (data: Pembelajaran[]) => {
  saveLocalStorageData<Pembelajaran>(getScopedKey('pembelajaran'), data);
};

// ----------------------------------------------------------------------------
// HOOKS OPERASI PENGUMUMAN
// ----------------------------------------------------------------------------
export const loadPengumuman = (): Pengumuman[] => getLocalStorageData<Pengumuman>(getScopedKey('pengumuman'), SEED_PENGUMUMAN);
export const savePengumuman = (data: Pengumuman[]) => {
  saveLocalStorageData<Pengumuman>(getScopedKey('pengumuman'), data);
};

// ----------------------------------------------------------------------------
// HITUNG GRADE OTOMATIS BERDASARKAN RATA-RATA KOMPONEN NILAI
// ----------------------------------------------------------------------------
export function hitungTotalDanGrade(tugas: number, uh1: number, uh2: number, uh3: number, uts: number, uas: number) {
  // Bobot: Tugas 25%, Rata-rata UH 15%, UTS 30%, UAS 30%
  const rataUH = (uh1 + uh2 + uh3) / 3;
  const total = Number(((tugas * 0.25) + (rataUH * 0.15) + (uts * 0.3) + (uas * 0.3)).toFixed(1));
  let grade = 'E';
  if (total >= 85) grade = 'A';
  else if (total >= 75) grade = 'B';
  else if (total >= 60) grade = 'C';
  else if (total >= 45) grade = 'D';
  
  return { total, grade };
}

// ----------------------------------------------------------------------------
// HOOKS OPERASI PENGATURAN (SETTINGS & KKM)
// ----------------------------------------------------------------------------
export const DEFAULT_SETTINGS: AppSettings = {
  namaGuru: "Romlah, S.Kom., M.Cs.",
  nip: "19820815 201012 2 003",
  namaKS: "Dr. Joko Wahyono, M.Pd.",
  jabatanKS: "Pembina Tk. I, IV/b",
  nipKS: "19740512 200003 1 002",
  kopPemprov: "PEMERINTAH PROVINSI JAWA TENGAH",
  kopDinas: "DINAS PENDIDIKAN DAN KEBUDAYAAN",
  kopSekolah: "SMA NEGERI 1 SALATIGA",
  kopAlamat: "Akr. A - Jl. Kemiri No. 1 Salatiga, Kode Pos 50711, Telp: (0298) 321321",
  logoSekolah: "",
  logoProv: "",
  kkm: 75,
  kota: "Salatiga",
  tahunPelajaran: "2025/2026",
  literasiStartAccess: "00:00",
  literasiEndAccess: "23:59",
  tugasStartAccess: "00:00",
  tugasEndAccess: "23:59",
  spreadsheetUrl: "",
  adminUsername: "admin",
  adminPassword: "admin123",
  mataPelajaran: "Informatika"
};

export const loadSettings = (): AppSettings => {
  const scopedKey = getScopedKey('settings');
  try {
    const data = localStorage.getItem(scopedKey);
    const username = getActiveTeacherUsername();
    
    let parsedSettings: AppSettings;
    if (!data) {
      const initialSettings = { ...DEFAULT_SETTINGS };
      if (username) {
        initialSettings.adminUsername = username;
        const teachers = loadTeacherAccounts();
        const me = teachers.find(t => t.username === username);
        if (me) {
          initialSettings.adminPassword = me.password || 'password';
          initialSettings.namaGuru = me.nama;
          initialSettings.mataPelajaran = me.mataPelajaran;
          initialSettings.spreadsheetUrl = me.spreadsheetUrl || '';
          if (me.asalSekolah) {
            initialSettings.kopSekolah = me.asalSekolah;
          }
        }
      }
      localStorage.setItem(scopedKey, JSON.stringify(initialSettings));
      parsedSettings = initialSettings;
    } else {
      parsedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      if (username) {
        const teachers = loadTeacherAccounts();
        const me = teachers.find(t => t.username === username);
        if (me && me.spreadsheetUrl && me.spreadsheetUrl !== parsedSettings.spreadsheetUrl) {
          parsedSettings.spreadsheetUrl = me.spreadsheetUrl;
          localStorage.setItem(scopedKey, JSON.stringify(parsedSettings));
        }
      }
    }
    return parsedSettings;
  } catch (e) {
    console.error(`Gagal membaca localStorage [${scopedKey}]:`, e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings) => {
  const scopedKey = getScopedKey('settings');
  try {
    localStorage.setItem(scopedKey, JSON.stringify(settings));
    // Also sync back to teacher list if the password, name, or school name was updated in settings
    const username = getActiveTeacherUsername();
    if (username) {
      const teachers = loadTeacherAccounts();
      const updated = teachers.map(t => {
        if (t.username === username) {
          return {
            ...t,
            nama: settings.namaGuru,
            password: settings.adminPassword,
            mataPelajaran: settings.mataPelajaran || "Informatika",
            asalSekolah: settings.kopSekolah || "SMA NEGERI 1 SALATIGA",
            spreadsheetUrl: settings.spreadsheetUrl || ""
          };
        }
        return t;
      });
      saveTeacherAccounts(updated);

      // Auto-push updated teacher list to central spreadsheet asynchronously!
      pushSuperAdminToGoogleSheets().catch(e => {
        console.warn("Gagal sinkronisasi data guru ke spreadsheet pusat:", e);
      });
    }
  } catch (e) {
    console.error(`Gagal menyimpan ke localStorage [${scopedKey}]:`, e);
  }
};

export const getTeacherSchoolName = (username: string): string => {
  try {
    const data = localStorage.getItem(`smasa_${username}_settings`);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && parsed.kopSekolah) {
        return parsed.kopSekolah;
      }
    }
  } catch (e) {}
  
  const teachers = loadTeacherAccounts();
  const me = teachers.find(t => t.username === username);
  if (me && me.asalSekolah) {
    return me.asalSekolah;
  }
  return "SMA NEGERI 1 SALATIGA";
};

export const loadRangkuman = (): Rangkuman[] => getLocalStorageData<Rangkuman>(getScopedKey('rangkuman'), []);
export const saveRangkuman = (data: Rangkuman[]) => {
  saveLocalStorageData<Rangkuman>(getScopedKey('rangkuman'), data);
};

// ----------------------------------------------------------------------------
// SUPER ADMIN SPREADSHEET INTEGRATION FUNCTIONS
// ----------------------------------------------------------------------------
export function getSuperAdminSpreadsheetUrl(): string {
  return localStorage.getItem('smasa_superadmin_spreadsheet_url') || '';
}

export function saveSuperAdminSpreadsheetUrl(url: string) {
  localStorage.setItem('smasa_superadmin_spreadsheet_url', url.trim());
}

export async function fetchSuperAdminConfigFromServer(): Promise<{ url: string; adminPassword?: string; adminEmail?: string } | null> {
  try {
    const response = await fetch('/api/superadmin-url');
    if (response.ok) {
      const data = await response.json();
      if (data) {
        if (data.url) localStorage.setItem('smasa_superadmin_spreadsheet_url', data.url);
        if (data.adminPassword) localStorage.setItem('smasa_superadmin_password', data.adminPassword);
        if (data.adminEmail) localStorage.setItem('smasa_superadmin_email', data.adminEmail);
        return data;
      }
    }
  } catch (e) {
    console.error("Gagal mengambil config superadmin dari server:", e);
  }
  return null;
}

export async function fetchSuperAdminSpreadsheetUrlFromServer(): Promise<string> {
  const config = await fetchSuperAdminConfigFromServer();
  return config?.url || localStorage.getItem('smasa_superadmin_spreadsheet_url') || '';
}

export async function saveSuperAdminSpreadsheetUrlToServer(url: string, adminPassword?: string, adminEmail?: string): Promise<boolean> {
  localStorage.setItem('smasa_superadmin_spreadsheet_url', url.trim());
  if (adminPassword) localStorage.setItem('smasa_superadmin_password', adminPassword.trim());
  if (adminEmail) localStorage.setItem('smasa_superadmin_email', adminEmail.trim());
  
  try {
    const response = await fetch('/api/superadmin-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: url.trim(),
        adminPassword: adminPassword?.trim(),
        adminEmail: adminEmail?.trim()
      }),
    });
    return response.ok;
  } catch (e) {
    console.error("Gagal menyimpan config superadmin ke server:", e);
    return false;
  }
}

export async function pushSuperAdminToGoogleSheets(): Promise<boolean> {
  const url = await fetchSuperAdminSpreadsheetUrlFromServer();
  if (!url) return false;

  const db = {
    teachers: loadTeacherAccounts(),
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(db),
    });
    if (!response.ok) throw new Error("Gagal mengunggah data guru ke Google Sheets Super Admin");
    
    let isSuccess = false;
    try {
      const result = await response.json();
      isSuccess = result.status === "success";
    } catch (e) {
      if (response.ok) {
        isSuccess = true;
      }
    }
    return isSuccess;
  } catch (error) {
    console.error("[Google Sheets Super Admin Sync Error] Gagal push:", error);
    throw error;
  }
}

export async function pullSuperAdminFromGoogleSheets(): Promise<boolean> {
  // Sync the spreadsheet URL from the server first, to ensure we are using the most up-to-date configured URL!
  const url = await fetchSuperAdminSpreadsheetUrlFromServer();
  if (!url) return false;

  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
    });
    if (!response.ok) throw new Error("Gagal mengambil data guru dari Google Sheets Super Admin");
    const db = await response.json();
    
    if (db && Array.isArray(db.teachers)) {
      const localTeachers = loadTeacherAccounts();
      const mergedTeachers = [...db.teachers];
      
      // Keep any local teachers (e.g., registered locally but not pushed yet, or added offline)
      localTeachers.forEach(localT => {
        const exists = db.teachers.some((t: any) => t.username === localT.username || t.id === localT.id);
        if (!exists) {
          mergedTeachers.push(localT);
        }
      });
      
      saveTeacherAccounts(mergedTeachers);
      return true;
    }
    return false;
  } catch (error) {
    console.error("[Google Sheets Super Admin Sync Error] Gagal pull:", error);
    throw error;
  }
}

export async function registerTeacherAndSync(newTeacher: TeacherAccount): Promise<boolean> {
  // 1. Sinkronisasi URL spreadsheet terbaru dari server
  const url = await fetchSuperAdminSpreadsheetUrlFromServer();
  if (!url) {
    // Jika tidak ada URL spreadsheet di server/lokal, simpan lokal saja sebagai fallback
    const teachers = loadTeacherAccounts();
    if (teachers.some(t => t.username === newTeacher.username)) {
      throw new Error(`Username "${newTeacher.username}" sudah terdaftar.`);
    }
    const updated = [...teachers, newTeacher];
    saveTeacherAccounts(updated);
    return true;
  }

  try {
    // 2. Tarik data guru terbaru dari Google Spreadsheet terlebih dahulu agar tidak menimpa data yang ada
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
    });
    if (!response.ok) throw new Error("Gagal menyinkronkan data pendaftaran dengan database pusat");
    
    const db = await response.json();
    let currentTeachers = loadTeacherAccounts();
    if (db && Array.isArray(db.teachers)) {
      const mergedTeachers = [...db.teachers];
      currentTeachers.forEach(localT => {
        const exists = db.teachers.some((t: any) => t.username === localT.username || t.id === localT.id);
        if (!exists) {
          mergedTeachers.push(localT);
        }
      });
      currentTeachers = mergedTeachers;
    }

    // 3. Validasi username unik pada data terbaru dari spreadsheet
    if (currentTeachers.some(t => t.username === newTeacher.username)) {
      throw new Error(`Username "${newTeacher.username}" sudah terdaftar di sistem.`);
    }

    // 4. Tambahkan guru baru ke daftar terbaru
    const updated = [...currentTeachers, newTeacher];

    // 5. Simpan ke local storage
    saveTeacherAccounts(updated);

    // 6. Dorong kembali daftar lengkap ke Google Spreadsheet
    const pushResponse = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ teachers: updated }),
    });

    if (!pushResponse.ok) throw new Error("Gagal mendaftarkan ke database Google Spreadsheet");
    return true;
  } catch (error: any) {
    console.error("[Register and Sync Error] Detail kegagalan:", error);
    throw error;
  }
}

