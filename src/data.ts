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

export function cleanGoogleAppsScriptUrl(url: string): string {
  if (!url) return '';
  let cleaned = url.trim().replace(/^["']|["']$/g, '');
  if (cleaned.endsWith('/dev')) {
    cleaned = cleaned.substring(0, cleaned.length - 4) + '/exec';
  }
  return cleaned;
}

export function getGoogleAppsScriptUrl(): string {
  try {
    const username = getActiveTeacherUsername();
    const prefix = username ? `smasa_${username}_` : 'smasa_';
    const settingsStr = localStorage.getItem(`${prefix}settings`);
    if (settingsStr) {
      const parsed = JSON.parse(settingsStr);
      if (parsed.spreadsheetUrl) return cleanGoogleAppsScriptUrl(parsed.spreadsheetUrl);
    }
    // Fallback to central teacher list spreadsheetUrl
    if (username) {
      const teachers = loadTeacherAccounts();
      const me = teachers.find(t => t.username.toLowerCase() === username.toLowerCase());
      if (me && me.spreadsheetUrl) {
        const cleanedUrl = cleanGoogleAppsScriptUrl(me.spreadsheetUrl);
        // Sync back to local settings if missing
        try {
          const currentSettings = settingsStr ? JSON.parse(settingsStr) : DEFAULT_SETTINGS;
          currentSettings.spreadsheetUrl = cleanedUrl;
          localStorage.setItem(`${prefix}settings`, JSON.stringify(currentSettings));
        } catch(e) {}
        return cleanedUrl;
      }
    }
  } catch (e) {}
  return "";
}

let autoSyncTimer: any = null;

export function triggerAutoSyncToSheets() {
  const url = getGoogleAppsScriptUrl();
  if (!url) return;

  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(async () => {
    try {
      console.log('[Auto Sync] Pushing changes to Google Sheets in background...');
      await pushToGoogleSheets();
    } catch (e) {
      console.warn('[Auto Sync Error]', e);
    }
  }, 1000);
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
  let url = getGoogleAppsScriptUrl();
  if (!url) return false;
  url = cleanGoogleAppsScriptUrl(url);

  if (url.includes('docs.google.com/spreadsheets')) {
    console.warn('[GAS Sync] URL yang dimasukkan adalah URL Google Spreadsheet, bukan URL Web App Apps Script!');
    return false;
  }

  const siswa = loadSiswa();
  const nilai = loadNilai();
  // Hanya simpan Izin, Sakit, dan Alpa ke Spreadsheet
  const presensi = loadPresensi().filter(
    (p) => p.status && p.status !== 'Hadir' && (p.status === 'Izin' || p.status === 'Sakit' || p.status === 'Alfa' || (p.status as any) === 'Ijin' || (p.status as any) === 'Alpa')
  );
  const pembelajaran = loadPembelajaran();
  const pengumuman = loadPengumuman();
  const settings = loadSettings();
  const rangkuman = loadRangkuman();

  // Sync active teacher's spreadsheetUrl & student count to teacher list
  const username = getActiveTeacherUsername();
  if (username) {
    const teachers = loadTeacherAccounts();
    const updated = teachers.map(t => {
      if (t.username.toLowerCase() === username.toLowerCase()) {
        return {
          ...t,
          spreadsheetUrl: url,
          jumlahSiswa: siswa.length,
          lastSyncAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
      }
      return t;
    });
    saveTeacherAccounts(updated, true); // Save to local teachers cache
    pushSuperAdminToGoogleSheets().catch(e => console.warn('[Super Admin Push Error]', e));
  }

  const db = {
    siswa,
    nilai,
    presensi,
    pembelajaran,
    pengumuman,
    settings,
    rangkuman,
  };

  // 1. Try server proxy first to avoid CORS / iframe redirect issues on mobile/different gadgets
  try {
    const proxyRes = await fetch('/api/gas-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, method: 'POST', body: db }),
    });
    if (proxyRes.ok) {
      const resData = await proxyRes.json().catch(() => null);
      if (resData && (resData.status === 'success' || resData.result === 'success')) {
        return true;
      }
      if (resData && (resData.error || resData.status === 'error')) {
        console.warn('[GAS Proxy Push Warning]', resData.error || resData.message || resData.raw);
      }
    }
  } catch (e) {
    console.warn('[GAS Proxy Push Warning] Proxy failed, falling back to direct fetch:', e);
  }

  // 2. Direct fallback
  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(db),
    });
    if (!response.ok) return false;
    
    let isSuccess = false;
    try {
      const result = await response.json();
      isSuccess = result.status === "success" || result.result === "success";
    } catch (e) {
      if (response.ok) {
        isSuccess = true;
      }
    }
    return isSuccess;
  } catch (error) {
    console.error("[Google Sheets Sync Error] Gagal push:", error);
    return false;
  }
}

function getCaseInsensitiveProp(obj: any, targetKeys: string[]): any {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    for (const target of targetKeys) {
      if (lowerKey === target.toLowerCase()) {
        return obj[key];
      }
    }
  }
  return undefined;
}

function extractEntityArray(db: any, targetKeys: string[]): any[] | null {
  if (!db || typeof db !== 'object') return null;
  
  // Direct property check
  const direct = getCaseInsensitiveProp(db, targetKeys);
  if (Array.isArray(direct)) return direct;
  
  // Check nested containers (data, result, records, payload, items)
  const containers = ['data', 'result', 'records', 'payload', 'items', 'list'];
  for (const c of containers) {
    const subObj = getCaseInsensitiveProp(db, [c]);
    if (subObj && typeof subObj === 'object') {
      if (Array.isArray(subObj)) {
        // If subObj itself is array of target items
        if (subObj.length > 0 && typeof subObj[0] === 'object') {
          const sample = subObj[0];
          const hasKey = targetKeys.some(tk => getCaseInsensitiveProp(sample, [tk]) !== undefined);
          if (hasKey) return subObj;
        }
      } else {
        const nested = getCaseInsensitiveProp(subObj, targetKeys);
        if (Array.isArray(nested)) return nested;
      }
    }
  }

  // If db itself is array
  if (Array.isArray(db) && db.length > 0) {
    const sample = db[0];
    const matchesTarget = targetKeys.some(tk => getCaseInsensitiveProp(sample, [tk]) !== undefined);
    if (matchesTarget) return db;
  }

  return null;
}

export function normalizeSiswaList(rawList: any[]): Siswa[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, idx) => {
    const nisVal = String(
      item.nis ?? item.NIS ?? item.NISN ?? item.nisn ?? item["No Induk"] ?? item.no_induk ?? item.id ?? `100${idx + 1}`
    ).trim();
    const namaVal = String(
      item.nama ?? item.Nama ?? item.NAMA ?? item.name ?? item.Name ?? item["Nama Lengkap"] ?? ''
    ).trim();
    const kelasVal = String(
      item.kelas ?? item.Kelas ?? item.KELAS ?? item.class ?? item.Class ?? item["Nama Kelas"] ?? 'XI-MIPA-1'
    ).trim();
    const emailVal = String(
      item.email ?? item.Email ?? item.EMAIL ?? item["Alamat Email"] ?? ''
    ).trim();
    const userVal = String(
      item.username ?? item.Username ?? item.USERNAME ?? item.user ?? nisVal
    ).trim();
    const passVal = String(
      item.password ?? item.Password ?? item.PASSWORD ?? item.sandi ?? 'smasa123'
    ).trim();

    return {
      id: String(item.id ?? item.ID ?? item.Id ?? (`S${nisVal || idx + 1}`)),
      nis: nisVal,
      nama: namaVal || `Siswa ${idx + 1}`,
      kelas: kelasVal || 'XI-MIPA-1',
      email: emailVal || `${nisVal}@smasa.sch.id`,
      username: userVal || nisVal,
      password: passVal || 'smasa123',
    };
  }).filter(s => s.nama.trim().length > 0 || s.nis.trim().length > 0);
}

export function normalizeNilaiList(rawList: any[]): Nilai[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, idx) => {
    const tugas = Number(item.tugas ?? item.Tugas ?? 0);
    const uh1 = Number(item.uh1 ?? item.UH1 ?? item.uh_1 ?? 0);
    const uh2 = Number(item.uh2 ?? item.UH2 ?? item.uh_2 ?? 0);
    const uh3 = Number(item.uh3 ?? item.UH3 ?? item.uh_3 ?? 0);
    const uts = Number(item.uts ?? item.UTS ?? 0);
    const uas = Number(item.uas ?? item.UAS ?? 0);
    
    const calc = hitungTotalDanGrade(tugas, uh1, uh2, uh3, uts, uas);
    const total = Number(item.total ?? item.Total ?? calc.total);
    const grade = String(item.grade ?? item.Grade ?? calc.grade);

    return {
      id: String(item.id ?? item.ID ?? (`N${idx + 1}_${Date.now()}`)),
      siswaId: String(item.siswaId ?? item.siswaid ?? item.SiswaId ?? item.siswa_id ?? item.nis ?? ''),
      siswaNama: String(item.siswaNama ?? item.siswanama ?? item.SiswaNama ?? item.siswa_nama ?? item.nama ?? ''),
      siswaKelas: String(item.siswaKelas ?? item.siswakelas ?? item.SiswaKelas ?? item.siswa_kelas ?? item.kelas ?? ''),
      tugas,
      uh1,
      uh2,
      uh3,
      uts,
      uas,
      total,
      grade,
      keterangan: String(item.keterangan ?? item.Keterangan ?? (total >= 75 ? 'Tuntas' : 'Belum Tuntas')),
      catatan: String(item.catatan ?? item.Catatan ?? ''),
    };
  });
}

export function normalizePresensiList(rawList: any[]): Presensi[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, idx) => ({
    id: String(item.id ?? item.ID ?? (`P${idx + 1}_${Date.now()}`)),
    tanggal: String(item.tanggal ?? item.Tanggal ?? new Date().toISOString().split('T')[0]),
    siswaId: String(item.siswaId ?? item.siswaid ?? item.SiswaId ?? item.siswa_id ?? item.nis ?? ''),
    siswaNama: String(item.siswaNama ?? item.siswanama ?? item.SiswaNama ?? item.siswa_nama ?? item.nama ?? ''),
    siswaKelas: String(item.siswaKelas ?? item.siswakelas ?? item.SiswaKelas ?? item.siswa_kelas ?? item.kelas ?? ''),
    status: (item.status ?? item.Status ?? 'Hadir') as any,
    keterangan: String(item.keterangan ?? item.Keterangan ?? ''),
  }));
}

export function normalizePembelajaranList(rawList: any[]): Pembelajaran[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, idx) => ({
    id: String(item.id ?? item.ID ?? (`M${idx + 1}`)),
    jenis: (item.jenis ?? item.Jenis ?? 'Modul') as any,
    judul: String(item.judul ?? item.Judul ?? ''),
    deskripsi: String(item.deskripsi ?? item.Deskripsi ?? item.materi ?? item.Materi ?? ''),
    tautan: String(item.tautan ?? item.Tautan ?? item.fileUrl ?? item.fileurl ?? item.FileUrl ?? item.linkTugas ?? ''),
    tanggal: String(item.tanggal ?? item.Tanggal ?? new Date().toISOString().split('T')[0]),
    tenggat: String(item.tenggat ?? item.Tenggat ?? ''),
    isUnlocked: Boolean(item.isUnlocked ?? true),
  }));
}

export function normalizePengumumanList(rawList: any[]): Pengumuman[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, idx) => ({
    id: String(item.id ?? item.ID ?? (`AN${idx + 1}`)),
    judul: String(item.judul ?? item.Judul ?? ''),
    isi: String(item.isi ?? item.Isi ?? ''),
    tanggal: String(item.tanggal ?? item.Tanggal ?? new Date().toLocaleDateString('id-ID')),
    kategori: (item.kategori ?? item.Kategori ?? (item.penting ? 'Penting' : 'Info')) as any,
  }));
}

export function normalizeRangkumanList(rawList: any[]): Rangkuman[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, idx) => ({
    id: String(item.id ?? item.ID ?? (`R${idx + 1}`)),
    siswaId: String(item.siswaId ?? item.SiswaId ?? item.siswa_id ?? ''),
    pembelajaranId: String(item.pembelajaranId ?? item.PembelajaranId ?? ''),
    isi: String(item.isi ?? item.Isi ?? item.isiRangkuman ?? item.IsiRangkuman ?? ''),
    tanggal: String(item.tanggal ?? item.Tanggal ?? item.tglSubmit ?? item.TglSubmit ?? new Date().toLocaleDateString('id-ID')),
  }));
}

export async function pullFromGoogleSheets(): Promise<boolean> {
  let url = getGoogleAppsScriptUrl();
  if (!url) return false;
  url = cleanGoogleAppsScriptUrl(url);

  if (url.includes('docs.google.com/spreadsheets')) {
    console.warn('[GAS Sync] URL yang dimasukkan adalah URL Google Spreadsheet, bukan URL Web App Apps Script!');
    return false;
  }

  let db: any = null;

  // 1. Try server proxy first to bypass CORS / iframe restrictions on different devices
  try {
    const proxyRes = await fetch('/api/gas-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, method: 'GET' }),
    });
    if (proxyRes.ok) {
      const json = await proxyRes.json().catch(() => null);
      if (json && !json.error && json.status !== 'error') {
        db = json;
      } else if (json && json.error) {
        console.warn('[GAS Proxy Pull Warning]', json.error);
      }
    }
  } catch (e) {
    console.warn('[GAS Proxy Pull Warning] Proxy failed, falling back to direct fetch:', e);
  }

  // 2. Direct fetch fallback
  if (!db) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
      });
      if (response.ok) {
        db = await response.json();
      }
    } catch (directErr) {
      console.warn("[Google Sheets Sync] Direct pull unavailable or CORS restricted:", directErr);
    }
  }

  if (db && typeof db === 'object') {
    const rawSiswa = extractEntityArray(db, ['siswa', 'siswaList', 'Siswa', 'DataSiswa']);
    const rawNilai = extractEntityArray(db, ['nilai', 'nilaiList', 'Nilai', 'DataNilai']);
    const rawPresensi = extractEntityArray(db, ['presensi', 'presensiList', 'Presensi', 'DataPresensi']);
    const rawPembelajaran = extractEntityArray(db, ['pembelajaran', 'pembelajaranList', 'Pembelajaran', 'DataPembelajaran']);
    const rawPengumuman = extractEntityArray(db, ['pengumuman', 'pengumumanList', 'Pengumuman', 'DataPengumuman']);
    const rawRangkuman = extractEntityArray(db, ['rangkuman', 'rangkumanList', 'Rangkuman', 'DataRangkuman']);
    const remoteSettings = getCaseInsensitiveProp(db, ['settings', 'Settings', 'Pengaturan']);

    let updatedAny = false;

    if (rawSiswa && Array.isArray(rawSiswa)) {
      const normalized = normalizeSiswaList(rawSiswa);
      if (normalized.length > 0) {
        saveSiswa(normalized, true);
        updatedAny = true;
      }
    }
    if (rawNilai && Array.isArray(rawNilai)) {
      const normalized = normalizeNilaiList(rawNilai);
      saveNilai(normalized, true);
      updatedAny = true;
    }
    if (rawPresensi && Array.isArray(rawPresensi)) {
      const normalized = normalizePresensiList(rawPresensi);
      savePresensi(normalized, true);
      updatedAny = true;
    }
    if (rawPembelajaran && Array.isArray(rawPembelajaran)) {
      const normalized = normalizePembelajaranList(rawPembelajaran);
      savePembelajaran(normalized, true);
      updatedAny = true;
    }
    if (rawPengumuman && Array.isArray(rawPengumuman)) {
      const normalized = normalizePengumumanList(rawPengumuman);
      savePengumuman(normalized, true);
      updatedAny = true;
    }
    if (rawRangkuman && Array.isArray(rawRangkuman)) {
      const normalized = normalizeRangkumanList(rawRangkuman);
      saveRangkuman(normalized, true);
      updatedAny = true;
    }
    if (remoteSettings) {
      const settingsObj = Array.isArray(remoteSettings) ? remoteSettings[0] : remoteSettings;
      if (settingsObj && typeof settingsObj === 'object') {
        const currentSettings = loadSettings();
        const mergedSettings = { ...DEFAULT_SETTINGS, ...currentSettings };
        
        // Hanya timpa nilai lokal jika nilai dari remote tidak kosong / tidak undefined
        (Object.keys(settingsObj) as (keyof AppSettings)[]).forEach((k) => {
          const val = settingsObj[k];
          if (val !== undefined && val !== null && val !== '') {
            (mergedSettings as any)[k] = val;
          }
        });
        if (settingsObj.kkm) mergedSettings.kkm = Number(settingsObj.kkm);
        mergedSettings.spreadsheetUrl = url;

        saveSettings(mergedSettings, true);
        updatedAny = true;
      }
    }

    return updatedAny || true;
  }

  return false;
}

export async function fetchFromGoogleSheets(sheetName: string): Promise<any[]> {
  const url = getGoogleAppsScriptUrl();
  if (!url) {
    console.warn(`[Google Sheets] URL belum dikonfigurasi. Menggunakan data lokal.`);
    return [];
  }
  try {
    const response = await fetch(`${url}?sheet=${sheetName}`, { signal: AbortSignal.timeout(6000) });
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
      body: JSON.stringify({ sheet: sheetName, action, data }),
      signal: AbortSignal.timeout(6000)
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
  { id: 'T01', nama: 'Romlah, S.Kom., M.Cs.', username: 'romlah', password: 'password', mataPelajaran: 'Informatika', isApproved: true, asalSekolah: 'MGMP INFORMATIKA SMA BONDOWOSO' },
  { id: 'T02', nama: 'Bambang Subianto, S.Pd.', username: 'bambang', password: 'password', mataPelajaran: 'Matematika', isApproved: true, asalSekolah: 'MGMP INFORMATIKA SMA BONDOWOSO' },
];

export const loadTeacherAccounts = (): TeacherAccount[] => {
  return getLocalStorageData<TeacherAccount>('smasa_teachers', SEED_TEACHERS);
};

export const saveTeacherAccounts = (data: TeacherAccount[], skipPush = false) => {
  saveLocalStorageData<TeacherAccount>('smasa_teachers', data);
  if (!skipPush) {
    pushSuperAdminToGoogleSheets().catch(e => {
      console.warn("Gagal auto push data guru ke spreadsheet pusat:", e);
    });
  }
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
export const saveSiswa = (data: Siswa[], skipAutoSync = false) => {
  saveLocalStorageData<Siswa>(getScopedKey('siswa'), data);
  if (!skipAutoSync) triggerAutoSyncToSheets();
};

// ----------------------------------------------------------------------------
// HOOKS OPERASI NILAI
// ----------------------------------------------------------------------------
export const loadNilai = (): Nilai[] => getLocalStorageData<Nilai>(getScopedKey('nilai'), SEED_NILAI);
export const saveNilai = (data: Nilai[], skipAutoSync = false) => {
  saveLocalStorageData<Nilai>(getScopedKey('nilai'), data);
  if (!skipAutoSync) triggerAutoSyncToSheets();
};

// ----------------------------------------------------------------------------
// HOOKS OPERASI PRESENSI
// ----------------------------------------------------------------------------
export const loadPresensi = (): Presensi[] => getLocalStorageData<Presensi>(getScopedKey('presensi'), SEED_PRESENSI);
export const savePresensi = (data: Presensi[], skipAutoSync = false) => {
  saveLocalStorageData<Presensi>(getScopedKey('presensi'), data);
  if (!skipAutoSync) triggerAutoSyncToSheets();
};

// ----------------------------------------------------------------------------
// HOOKS OPERASI PEMBELAJARAN
// ----------------------------------------------------------------------------
export const loadPembelajaran = (): Pembelajaran[] => getLocalStorageData<Pembelajaran>(getScopedKey('pembelajaran'), SEED_PEMBELAJARAN);
export const savePembelajaran = (data: Pembelajaran[], skipAutoSync = false) => {
  saveLocalStorageData<Pembelajaran>(getScopedKey('pembelajaran'), data);
  if (!skipAutoSync) triggerAutoSyncToSheets();
};

// ----------------------------------------------------------------------------
// HOOKS OPERASI PENGUMUMAN
// ----------------------------------------------------------------------------
export const loadPengumuman = (): Pengumuman[] => getLocalStorageData<Pengumuman>(getScopedKey('pengumuman'), SEED_PENGUMUMAN);
export const savePengumuman = (data: Pengumuman[], skipAutoSync = false) => {
  saveLocalStorageData<Pengumuman>(getScopedKey('pengumuman'), data);
  if (!skipAutoSync) triggerAutoSyncToSheets();
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
  kopPemprov: "PEMERINTAH PROVINSI JAWA TIMUR",
  kopDinas: "CABANG DINAS PENDIDIKAN WILAYAH BONDOWOSO",
  kopSekolah: "MGMP INFORMATIKA SMA BONDOWOSO",
  kopAlamat: "Jl. Piere Tendean No. 1 Bondowoso, Jawa Timur",
  logoSekolah: "",
  logoProv: "",
  kkm: 75,
  kota: "Bondowoso",
  tahunPelajaran: "2025/2026",
  literasiStartAccess: "00:00",
  literasiEndAccess: "23:59",
  tugasStartAccess: "00:00",
  tugasEndAccess: "23:59",
  spreadsheetUrl: "",
  adminUsername: "admin",
  adminPassword: "admin123",
  adminEmail: "4ndr1saya@gmail.com",
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
          initialSettings.adminEmail = me.email || '';
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

export const saveSettings = (settings: AppSettings, skipAutoSync = false) => {
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
            spreadsheetUrl: settings.spreadsheetUrl || "",
            email: settings.adminEmail || ""
          };
        }
        return t;
      });
      saveTeacherAccounts(updated, true);
    }

    if (!skipAutoSync) {
      triggerAutoSyncToSheets();
    }
  } catch (e) {
    console.error(`Gagal menyimpan ke localStorage [${scopedKey}]:`, e);
  }
};

export const getTeacherSettings = (username: string): AppSettings | null => {
  try {
    const data = localStorage.getItem(`smasa_${username}_settings`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {}
  return null;
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
export const saveRangkuman = (data: Rangkuman[], skipAutoSync = false) => {
  saveLocalStorageData<Rangkuman>(getScopedKey('rangkuman'), data);
  if (!skipAutoSync) {
    triggerAutoSyncToSheets();
  }
};

// ----------------------------------------------------------------------------
// BACKUP & RESTORE DATABASE LOKAL (JSON)
// ----------------------------------------------------------------------------
export function exportLocalDatabaseJSON(): string {
  const username = getActiveTeacherUsername();
  const dbData = {
    app: 'SMASA-Online',
    version: '1.0',
    exportDate: new Date().toISOString(),
    teacherUsername: username || 'default',
    settings: loadSettings(),
    siswa: loadSiswa(),
    nilai: loadNilai(),
    presensi: loadPresensi(),
    pembelajaran: loadPembelajaran(),
    pengumuman: loadPengumuman(),
    rangkuman: loadRangkuman()
  };
  return JSON.stringify(dbData, null, 2);
}

export function downloadLocalDatabaseBackup() {
  const jsonStr = exportLocalDatabaseJSON();
  const settings = loadSettings();
  const rawName = settings.namaGuru || 'Guru';
  const teacherName = rawName.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Backup_Database_SMASA_${teacherName}_${dateStr}.json`;

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function restoreLocalDatabaseFromJSON(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') return false;

    if (data.settings) saveSettings(data.settings);
    if (Array.isArray(data.siswa)) saveSiswa(data.siswa);
    if (Array.isArray(data.nilai)) saveNilai(data.nilai);
    if (Array.isArray(data.presensi)) savePresensi(data.presensi);
    if (Array.isArray(data.pembelajaran)) savePembelajaran(data.pembelajaran);
    if (Array.isArray(data.pengumuman)) savePengumuman(data.pengumuman);
    if (Array.isArray(data.rangkuman)) saveRangkuman(data.rangkuman);

    return true;
  } catch (e) {
    console.error("Gagal memulihkan database dari JSON:", e);
    return false;
  }
}

// ----------------------------------------------------------------------------
// SUPER ADMIN SPREADSHEET INTEGRATION FUNCTIONS
// ----------------------------------------------------------------------------
export const DEFAULT_SUPERADMIN_SPREADSHEET_URL = 'https://script.google.com/macros/s/AKfycbzb1VFTuPrmr1UpRePoi2m3IIFNJKXsxsceDpgkbFm0lsw71BOMjrTeCWCZhQxio9hW/exec';

export function getSuperAdminSpreadsheetUrl(): string {
  const envUrl = 
    (import.meta as any).env?.SUPERADMIN_SPREADSHEET_URL || 
    (import.meta as any).env?.VITE_SUPERADMIN_SPREADSHEET_URL || 
    (import.meta as any).env?.SPREADSHEET_URL || 
    (typeof process !== 'undefined' && process?.env ? (process.env.SUPERADMIN_SPREADSHEET_URL || process.env.VITE_SUPERADMIN_SPREADSHEET_URL || process.env.SPREADSHEET_URL) : '') ||
    '';

  const localUrl = localStorage.getItem('smasa_superadmin_spreadsheet_url') || '';

  return cleanGoogleAppsScriptUrl(envUrl || localUrl || DEFAULT_SUPERADMIN_SPREADSHEET_URL);
}

export function saveSuperAdminSpreadsheetUrl(url: string) {
  const cleaned = cleanGoogleAppsScriptUrl(url);
  localStorage.setItem('smasa_superadmin_spreadsheet_url', cleaned);
  saveSuperAdminSpreadsheetUrlToServer(cleaned).catch(() => {});
}

export async function fetchSuperAdminConfigFromServer(): Promise<{ url: string; adminPassword?: string; adminEmail?: string } | null> {
  try {
    const response = await fetch('/api/superadmin-url');
    if (response.ok) {
      const data = await response.json();
      if (data) {
        if (data.url) localStorage.setItem('smasa_superadmin_spreadsheet_url', cleanGoogleAppsScriptUrl(data.url));
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
  const serverUrl = config?.url ? cleanGoogleAppsScriptUrl(config.url) : '';
  const fallbackUrl = getSuperAdminSpreadsheetUrl();
  return serverUrl || fallbackUrl;
}

export async function saveSuperAdminSpreadsheetUrlToServer(url: string, adminPassword?: string, adminEmail?: string): Promise<boolean> {
  const cleaned = cleanGoogleAppsScriptUrl(url);
  localStorage.setItem('smasa_superadmin_spreadsheet_url', cleaned);
  if (adminPassword) localStorage.setItem('smasa_superadmin_password', adminPassword.trim());
  if (adminEmail) localStorage.setItem('smasa_superadmin_email', adminEmail.trim());
  
  try {
    const response = await fetch('/api/superadmin-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: cleaned,
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
  let url = await fetchSuperAdminSpreadsheetUrlFromServer();
  if (!url) return false;
  url = cleanGoogleAppsScriptUrl(url);

  if (url.includes('docs.google.com/spreadsheets')) {
    console.warn('[Super Admin Sync] URL yang dimasukkan adalah URL Google Spreadsheet, bukan Web App Apps Script!');
    return false;
  }

  const rawTeachers = loadTeacherAccounts();
  const activeUsername = (getActiveTeacherUsername() || '').toLowerCase();
  const currentSiswaCount = loadSiswa().length;

  const teacherMap = new Map<string, any>();
  for (const t of rawTeachers) {
    if (!t.username || !t.username.trim()) continue;
    const key = t.username.trim().toLowerCase();
    const isSeedAdmin = key === 'romlah' || key === 'bambang' || key === 'admin';
    const isApp = isSeedAdmin || t.isApproved === true || String(t.isApproved).trim().toLowerCase() === 'true' || String(t.isApproved).trim() === '1';

    let count = 0;
    if (activeUsername && key === activeUsername) {
      count = currentSiswaCount;
    } else if (t.jumlahSiswa !== undefined && t.jumlahSiswa !== null && Number(t.jumlahSiswa) > 0) {
      count = Number(t.jumlahSiswa);
    } else {
      const localSiswa = getLocalStorageData<any>('smasa_' + key + '_siswa', []);
      count = Array.isArray(localSiswa) && localSiswa.length > 0 ? localSiswa.length : Number(t.jumlahSiswa || 0);
    }

    const teacherObj = {
      ...t,
      username: key,
      isApproved: isApp,
      jumlahSiswa: count,
      JumlahSiswa: count,
      jumlahsiswa: count,
      "Jumlah Siswa": count,
      jumlah_siswa: count,
      "Jumlah_Siswa": count,
      siswa: count,
      Siswa: count,
    };

    if (!teacherMap.has(key)) {
      teacherMap.set(key, teacherObj);
    } else {
      const existing = teacherMap.get(key)!;
      const maxCount = Math.max(count, Number(existing.jumlahSiswa || 0));
      teacherMap.set(key, {
        ...existing,
        ...teacherObj,
        username: key,
        isApproved: isSeedAdmin || existing.isApproved || isApp,
        jumlahSiswa: maxCount,
        JumlahSiswa: maxCount,
        jumlahsiswa: maxCount,
        "Jumlah Siswa": maxCount,
        jumlah_siswa: maxCount,
        "Jumlah_Siswa": maxCount,
        siswa: maxCount,
        Siswa: maxCount,
      });
    }
  }
  const teachers = Array.from(teacherMap.values());

  const db = {
    action: 'saveTeachers',
    teachers: teachers,
    Teachers: teachers,
    guru: teachers,
    Guru: teachers,
    data: teachers,
  };

  const isSuccessResponse = (result: any, httpOk: boolean) => {
    if (!result && httpOk) return true;
    if (!result) return false;
    if (result.error || result.status === 'error') return false;
    return (
      result.status === 'success' ||
      result.result === 'success' ||
      result.success === true ||
      result.status === 'ok' ||
      result.count !== undefined ||
      Array.isArray(result.teachers) ||
      Array.isArray(result.guru) ||
      httpOk
    );
  };

  // 1. Try server endpoint /api/superadmin/push first
  try {
    const serverPushRes = await fetch('/api/superadmin/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db),
      signal: AbortSignal.timeout(8000),
    });
    if (serverPushRes.ok) {
      const result = await serverPushRes.json().catch(() => null);
      if (isSuccessResponse(result, true)) {
        return true;
      }
    }
  } catch (e) {
    console.warn('[Super Admin Sync] /api/superadmin/push failed, trying gas-proxy...', e);
  }

  // 2. Try server-side gas-proxy
  try {
    const proxyRes = await fetch('/api/gas-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, method: 'POST', body: db }),
      signal: AbortSignal.timeout(8000),
    });
    if (proxyRes.ok) {
      const result = await proxyRes.json().catch(() => null);
      if (isSuccessResponse(result, true)) {
        return true;
      }
    }
  } catch (proxyErr) {
    console.warn("[Super Admin Sync] Server gas-proxy push failed, falling back:", proxyErr);
  }

  // 3. Direct client fetch fallback
  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(db),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return false;
    
    let isSuccess = false;
    try {
      const result = await response.json();
      isSuccess = isSuccessResponse(result, response.ok);
    } catch (e) {
      if (response.ok) {
        isSuccess = true;
      }
    }
    return isSuccess;
  } catch (error) {
    console.error("[Google Sheets Super Admin Sync Error] Gagal push:", error);
    return false;
  }
}

export async function pullSuperAdminFromGoogleSheets(): Promise<boolean> {
  // Sync the spreadsheet URL from the server first, to ensure we are using the most up-to-date configured URL!
  const url = await fetchSuperAdminSpreadsheetUrlFromServer();
  if (!url) return false;

  let db: any = null;

  // 1. First try fetching via server-side gas-proxy (uses exact URL & bypasses browser CORS/iframe restrictions)
  try {
    const proxyRes = await fetch('/api/gas-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, method: 'GET' }),
      signal: AbortSignal.timeout(6000),
    });
    if (proxyRes.ok) {
      const json = await proxyRes.json().catch(() => null);
      if (json && !json.error && json.status !== 'error') {
        db = json;
      }
    }
  } catch (proxyErr) {
    console.warn("[Super Admin Sync] Server gas-proxy pull failed, trying fallback:", proxyErr);
  }

  // 2. Fallback to /api/superadmin/pull if gas-proxy returned null/error
  if (!db) {
    try {
      const proxyRes = await fetch('/api/superadmin/pull', { signal: AbortSignal.timeout(6000) });
      if (proxyRes.ok) {
        const json = await proxyRes.json().catch(() => null);
        if (json && !json.error && json.status !== 'error') {
          db = json;
        }
      }
    } catch (err) {}
  }

  // 3. Fallback to direct client fetch if server proxies are unavailable
  if (!db) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        signal: AbortSignal.timeout(6000),
      });
      if (response.ok) {
        db = await response.json();
      }
    } catch (directErr) {
      console.warn("[Super Admin Sync] Direct pull unavailable or CORS restricted:", directErr);
    }
  }

  // Flexibly parse response payload to extract array of teachers
  let remoteTeachers: any[] = [];
  let isDbFound = false;

  if (db) {
    if (Array.isArray(db)) {
      remoteTeachers = db;
      isDbFound = true;
    } else {
      const keysToCheck = [
        'teachers', 'data', 'Guru', 'guru', 'result', 'records', 'rows', 'items',
        'list', 'guruList', 'teachersList', 'accounts', 'users', 'userList'
      ];
      for (const k of keysToCheck) {
        if (Array.isArray(db[k])) {
          remoteTeachers = db[k];
          isDbFound = true;
          break;
        }
      }
      if (!isDbFound && db.data && typeof db.data === 'object') {
        if (Array.isArray(db.data)) {
          remoteTeachers = db.data;
          isDbFound = true;
        } else {
          for (const k of keysToCheck) {
            if (Array.isArray(db.data[k])) {
              remoteTeachers = db.data[k];
              isDbFound = true;
              break;
            }
          }
        }
      }
      if (!isDbFound && db.result && typeof db.result === 'object') {
        if (Array.isArray(db.result)) {
          remoteTeachers = db.result;
          isDbFound = true;
        } else {
          for (const k of keysToCheck) {
            if (Array.isArray(db.result[k])) {
              remoteTeachers = db.result[k];
              isDbFound = true;
              break;
            }
          }
        }
      }
      if (!isDbFound && typeof db === 'object') {
        for (const k of Object.keys(db)) {
          if (Array.isArray(db[k]) && db[k].length > 0 && typeof db[k][0] === 'object') {
            remoteTeachers = db[k];
            isDbFound = true;
            break;
          }
        }
      }
    }
  }

  if (isDbFound && Array.isArray(remoteTeachers)) {
    const localTeachers = loadTeacherAccounts();
    const parsedList: TeacherAccount[] = remoteTeachers.map((remoteT: any, idx: number): TeacherAccount => {
      const uName = String(
        remoteT.username ?? remoteT.Username ?? remoteT.USERNAME ?? remoteT.user ?? remoteT.User ?? remoteT.user_name ?? ''
      ).trim();

      const namaVal = String(
        remoteT.nama ?? remoteT.Nama ?? remoteT.NAMA ?? remoteT.name ?? remoteT.Name ?? remoteT.fullName ?? ''
      ).trim();

      const finalUsername = uName || namaVal.toLowerCase().replace(/\s+/g, '');
      const tId = String(remoteT.id || remoteT.ID || remoteT.Id || `T${idx + 1}`);

      const localMatch = localTeachers.find(l => (finalUsername && l.username.toLowerCase() === finalUsername.toLowerCase()) || l.id === tId);

      // Seed super admins are always approved
      const isSeedAdmin = finalUsername.toLowerCase() === 'romlah' || finalUsername.toLowerCase() === 'bambang' || finalUsername.toLowerCase() === 'admin';

      const rawApp = remoteT.isApproved !== undefined ? remoteT.isApproved :
                     (remoteT.isapproved !== undefined ? remoteT.isapproved :
                     (remoteT.IsApproved !== undefined ? remoteT.IsApproved :
                     (remoteT.approved !== undefined ? remoteT.approved :
                     (remoteT.Approved !== undefined ? remoteT.Approved :
                     (remoteT.is_approved !== undefined ? remoteT.is_approved :
                     (remoteT.Is_Approved !== undefined ? remoteT.Is_Approved :
                     (remoteT.status !== undefined ? remoteT.status :
                     (remoteT.Status !== undefined ? remoteT.Status :
                     (remoteT.Approval !== undefined ? remoteT.Approval : undefined)))))))));

      let isApp = false;
      if (isSeedAdmin) {
        isApp = true;
      } else if (rawApp !== undefined && rawApp !== null && String(rawApp).trim() !== '') {
        const appVal = String(rawApp).toLowerCase().trim();
        isApp = (appVal === 'true' || appVal === '1' || appVal === 'yes' || appVal === 'approved' || appVal === 'setuju' || appVal === 'ya' || appVal === 'y');
      } else {
        isApp = false;
      }

      const rawJSiswa = remoteT.jumlahSiswa ?? remoteT.jumlahsiswa ?? remoteT.JumlahSiswa ?? 
                        remoteT["Jumlah Siswa"] ?? remoteT.jumlah_siswa ?? remoteT["Jumlah_Siswa"] ?? 
                        remoteT.siswa ?? remoteT.Siswa;

      const jSiswaVal = (rawJSiswa !== undefined && rawJSiswa !== null && rawJSiswa !== '')
        ? Number(rawJSiswa)
        : (localMatch?.jumlahSiswa ?? 0);

      return {
        id: tId,
        nama: namaVal || localMatch?.nama || finalUsername,
        username: finalUsername || localMatch?.username || '',
        password: String(remoteT.password ?? remoteT.Password ?? remoteT.pass ?? localMatch?.password ?? ''),
        mataPelajaran: String(remoteT.mataPelajaran ?? remoteT.matapelajaran ?? remoteT.MataPelajaran ?? remoteT.mapel ?? localMatch?.mataPelajaran ?? 'Informatika'),
        isApproved: isApp,
        asalSekolah: String(remoteT.asalSekolah ?? remoteT.asalsekolah ?? remoteT.AsalSekolah ?? remoteT.sekolah ?? localMatch?.asalSekolah ?? ''),
        lastSyncAt: String(
          remoteT.lastSyncAt ?? remoteT.lastsyncat ?? remoteT.last_sync ?? remoteT.lastSync ?? remoteT.timestamp ?? localMatch?.lastSyncAt ?? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        ),
        spreadsheetUrl: String(remoteT.spreadsheetUrl ?? remoteT.spreadsheeturl ?? remoteT.SpreadsheetUrl ?? localMatch?.spreadsheetUrl ?? ''),
        email: String(remoteT.email ?? remoteT.Email ?? localMatch?.email ?? ''),
        jumlahSiswa: jSiswaVal
      };
    }).filter((t: TeacherAccount) => t.username.trim().length > 0);

    // Group and merge duplicate accounts by username (if ANY entry is approved, set isApproved = true)
    const teacherMap = new Map<string, TeacherAccount>();
    for (const t of parsedList) {
      const key = t.username.trim().toLowerCase();
      if (!teacherMap.has(key)) {
        teacherMap.set(key, { ...t });
      } else {
        const existing = teacherMap.get(key)!;
        teacherMap.set(key, {
          id: t.id || existing.id,
          nama: (t.nama && t.nama !== t.username) ? t.nama : existing.nama,
          username: existing.username,
          password: t.password || existing.password,
          mataPelajaran: (t.mataPelajaran && t.mataPelajaran !== 'Informatika') ? t.mataPelajaran : existing.mataPelajaran,
          isApproved: existing.isApproved || t.isApproved, // True if ANY row is approved!
          asalSekolah: t.asalSekolah || existing.asalSekolah,
          spreadsheetUrl: t.spreadsheetUrl || existing.spreadsheetUrl,
          email: t.email || existing.email,
          jumlahSiswa: Number(t.jumlahSiswa || existing.jumlahSiswa || 0)
        });
      }
    }

    const mergedTeachers = Array.from(teacherMap.values());

    // Replace local browser storage completely with the remote spreadsheet database accounts
    saveTeacherAccounts(mergedTeachers, true);
    return true;
  }

  return false;
}

export async function fetchTeachersFromServer(): Promise<TeacherAccount[]> {
  try {
    // 1. First attempt to pull directly from Google Spreadsheet Super Admin
    const pulled = await pullSuperAdminFromGoogleSheets();
    if (pulled) {
      return loadTeacherAccounts();
    }
    // 2. Fallback to /api/teachers endpoint on server
    const res = await fetch('/api/teachers');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.teachers) && data.teachers.length > 0) {
        saveTeacherAccounts(data.teachers, true);
        return data.teachers;
      }
    }
  } catch (e) {
    console.warn('[fetchTeachersFromServer] Gagal mengambil data guru dari server/spreadsheet:', e);
  }
  return loadTeacherAccounts();
}

export async function registerTeacherAndSync(newTeacher: TeacherAccount): Promise<{ success: boolean; pushedToSheets: boolean; message: string }> {
  // 1. Ambil URL Super Admin terbaru dari server
  const url = await fetchSuperAdminSpreadsheetUrlFromServer();

  if (!url) {
    throw new Error('Database Spreadsheet Super Admin belum dikonfigurasi. Silakan hubungi Super Admin untuk menyetel URL Spreadsheet sebelum melakukan pendaftaran.');
  }

  // 2. Tarik data guru terbaru dari Google Spreadsheet Super Admin terlebih dahulu agar data ter-update
  const pulled = await pullSuperAdminFromGoogleSheets().catch((err) => {
    console.warn("[Register Teacher] Gagal pull data guru dari spreadsheet sebelum pendaftaran:", err);
    return false;
  });

  let currentTeachers = loadTeacherAccounts();

  // 3. Pastikan ID Guru Unik dan Cegah Duplikat (by ID and username)
  const uniqueId = newTeacher.id && newTeacher.id.startsWith('GURU_')
    ? newTeacher.id
    : `GURU_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const cleanUsername = newTeacher.username.trim().toLowerCase();

  if (currentTeachers.some(t => t.username.trim().toLowerCase() === cleanUsername)) {
    throw new Error(`Username "${newTeacher.username}" sudah terdaftar di database Spreadsheet Super Admin.`);
  }

  if (currentTeachers.some(t => t.id === uniqueId)) {
    throw new Error(`ID Guru "${uniqueId}" sudah digunakan. Silakan coba lagi.`);
  }

  // 4. Buat objek Guru baru dengan ID Unik & timestamp
  const formattedTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const teacherWithSync: TeacherAccount = {
    ...newTeacher,
    id: uniqueId,
    username: cleanUsername,
    lastSyncAt: newTeacher.lastSyncAt || formattedTime
  };

  const updated = [...currentTeachers, teacherWithSync];

  // Simpan sementara di cache
  saveTeacherAccounts(updated, true);

  // 5. Wajib kirim dan verifikasi bahwa data benar-benar berhasil tersimpan ke Google Spreadsheet Super Admin
  const pushed = await pushSuperAdminToGoogleSheets();

  if (!pushed) {
    // Jika koneksi/penyimpanan ke Spreadsheet gagal, batalkan klaim sukses
    // Hapus data dari cache agar tidak tertinggal sebagai data lokal terpisah
    const reverted = currentTeachers.filter(t => t.username.toLowerCase() !== cleanUsername && t.id !== uniqueId);
    saveTeacherAccounts(reverted, true);

    throw new Error('Gagal menyimpan pendaftaran ke database Google Spreadsheet Super Admin. Pastikan koneksi internet terhubung dan URL Apps Script Web App valid (Akses: Siapa saja).');
  }

  const msg = 'Pendaftaran guru berhasil tersimpan di database Google Spreadsheet Super Admin! Harap hubungi Super Admin untuk proses persetujuan (approval).';
  return { success: true, pushedToSheets: true, message: msg };
}

