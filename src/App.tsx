/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, X, GraduationCap } from 'lucide-react';

// Import subkomponen pendukung
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import KelolaSiswa from './components/KelolaSiswa';
import KelolaNilai from './components/KelolaNilai';
import KelolaPresensi from './components/KelolaPresensi';
import KelolaPembelajaran from './components/KelolaPembelajaran';
import Laporan from './components/Laporan';
import SettingsComponent from './components/Settings';
import SiswaDashboard from './components/SiswaDashboard';
import Login from './components/Login';
import SuperAdminDashboard from './components/SuperAdminDashboard';

// Import tipe data & penanganan penyimpanan lokal
import { Siswa, Nilai, Presensi, Pembelajaran, Pengumuman, AppSettings, Rangkuman } from './types';
import {
  loadSiswa,
  saveSiswa,
  loadNilai,
  saveNilai,
  loadPresensi,
  savePresensi,
  loadPembelajaran,
  savePembelajaran,
  loadPengumuman,
  savePengumuman,
  loadSettings,
  saveSettings,
  loadRangkuman,
  saveRangkuman,
  pushToGoogleSheets,
  pullFromGoogleSheets,
} from './data';

export default function App() {
  // State Login Guru
  const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isTeacherLoggedIn') === 'true';
  });

  // State Super Admin
  const [isSuperAdminLoggedIn, setIsSuperAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isSuperAdminLoggedIn') === 'true';
  });

  // State Navigasi
  const [currentMenu, setCurrentMenu] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // State Portal Siswa
  const [loggedSiswa, setLoggedSiswa] = useState<Siswa | null>(() => {
    const saved = localStorage.getItem('loggedSiswa');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // State Manajemen Data (Dikelola dengan Central State + LocalStorage)
  const [siswaList, setSiswaList] = useState<Siswa[]>(() => loadSiswa());
  const [nilaiList, setNilaiList] = useState<Nilai[]>(() => loadNilai());
  const [presensiList, setPresensiList] = useState<Presensi[]>(() => loadPresensi());
  const [pembelajaranList, setPembelajaranList] = useState<Pembelajaran[]>(() => loadPembelajaran());
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>(() => loadPengumuman());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  // Memuat ulang seluruh state dari penyimpanan lokal (biasanya setelah menarik data dari Spreadsheet)
  const reloadAllStates = () => {
    setSiswaList(loadSiswa());
    setNilaiList(loadNilai());
    setPresensiList(loadPresensi());
    setPembelajaranList(loadPembelajaran());
    setPengumumanList(loadPengumuman());
    setSettings(loadSettings());
  };

  const handleSyncSpreadsheet = async () => {
    try {
      const success = await pullFromGoogleSheets();
      if (success) {
        reloadAllStates();
      } else {
        throw new Error("Gagal mengambil data.");
      }
    } catch (e) {
      console.error("Gagal sinkronisasi dari Google Sheets:", e);
      throw e;
    }
  };

  const syncPush = async () => {
    try {
      await pushToGoogleSheets();
    } catch (e) {
      console.error("Gagal sinkron otomatis ke Google Sheets:", e);
    }
  };

  const handleUpdateSettings = async (updated: AppSettings) => {
    const oldUrl = settings.spreadsheetUrl || '';
    const newUrl = updated.spreadsheetUrl || '';
    
    setSettings(updated);
    saveSettings(updated);

    if (newUrl && newUrl !== oldUrl) {
      try {
        await pushToGoogleSheets();
        alert("Koneksi Spreadsheet Berhasil! Seluruh data lokal Anda telah berhasil diunggah ke Google Sheet.");
      } catch (e) {
        alert("Gagal mengunggah data ke Spreadsheet. Pastikan URL Apps Script benar dan diatur agar memiliki akses 'Siapa saja'.");
      }
    } else {
      syncPush();
    }
  };

  // Sinkronisasi otomatis saat aplikasi pertama kali dimuat
  React.useEffect(() => {
    const autoSync = async () => {
      if (settings.spreadsheetUrl) {
        try {
          const success = await pullFromGoogleSheets();
          if (success) {
            reloadAllStates();
          }
        } catch (e) {
          console.error("Gagal sinkronisasi awal:", e);
        }
      }
    };
    autoSync();
  }, [settings.spreadsheetUrl]);

  // ============================================================================
  // HANDLERS CRUD: SISWA
  // ============================================================================
  const handleAddSiswa = (siswa: Siswa) => {
    const updated = [siswa, ...siswaList];
    setSiswaList(updated);
    saveSiswa(updated);
    syncPush();
  };

  const handleUpdateSiswa = (siswa: Siswa) => {
    const updated = siswaList.map((s) => (s.id === siswa.id ? siswa : s));
    setSiswaList(updated);
    saveSiswa(updated);

    // Ikut sinkronisasikan nama siswa jika dia sudah memiliki nilai sebelumnya
    const updatedNilai = nilaiList.map((n) =>
      n.siswaId === siswa.id
        ? { ...n, siswaNama: siswa.nama, siswaKelas: siswa.kelas }
        : n
    );
    setNilaiList(updatedNilai);
    saveNilai(updatedNilai);

    // Ikut sinkronisasikan nama siswa jika dia sudah memiliki presensi sebelumnya
    const updatedPresensi = presensiList.map((p) =>
      p.siswaId === siswa.id
        ? { ...p, siswaNama: siswa.nama, siswaKelas: siswa.kelas }
        : p
    );
    setPresensiList(updatedPresensi);
    savePresensi(updatedPresensi);
    syncPush();
  };

  const handleDeleteSiswa = (id: string) => {
    // 1. Hapus Siswa dari Database
    const updatedSiswa = siswaList.filter((s) => s.id !== id);
    setSiswaList(updatedSiswa);
    saveSiswa(updatedSiswa);

    // 2. Cascade Delete: Hapus juga nilai siswa yang bersangkutan
    const updatedNilai = nilaiList.filter((n) => n.siswaId !== id);
    setNilaiList(updatedNilai);
    saveNilai(updatedNilai);

    // 3. Cascade Delete: Hapus juga catatan absensi siswa tersebut
    const updatedPresensi = presensiList.filter((p) => p.siswaId !== id);
    setPresensiList(updatedPresensi);
    savePresensi(updatedPresensi);
    syncPush();
  };

  const handleImportSiswa = (importList: Siswa[]) => {
    // Hindari duplikasi NIS yang sudah ada sebelumnya
    const filteredImport = importList.filter(
      (imp) => !siswaList.some((s) => s.nis === imp.nis)
    );

    if (filteredImport.length === 0) {
      alert("Semua siswa dalam berkas CSV sudah terdaftar sebelumnya berdasarkan NIS.");
      return;
    }

    const updated = [...siswaList, ...filteredImport];
    setSiswaList(updated);
    saveSiswa(updated);
    alert(`Berhasil mengimpor ${filteredImport.length} siswa baru ke database!`);
    syncPush();
  };

  // ============================================================================
  // HANDLERS CRUD: PENILAIAN
  // ============================================================================
  const handleAddNilai = (nilai: Nilai) => {
    const updated = [nilai, ...nilaiList];
    setNilaiList(updated);
    saveNilai(updated);
    syncPush();
  };

  const handleUpdateNilai = (nilai: Nilai) => {
    const updated = nilaiList.map((n) => (n.id === nilai.id ? nilai : n));
    setNilaiList(updated);
    saveNilai(updated);
    syncPush();
  };

  const handleDeleteNilai = (id: string) => {
    const updated = nilaiList.filter((n) => n.id !== id);
    setNilaiList(updated);
    saveNilai(updated);
    syncPush();
  };

  const handleImportNilai = (importList: Nilai[]) => {
    // Update atau tambah data nilai siswa
    let currentNilai = [...nilaiList];

    importList.forEach((imp) => {
      const idx = currentNilai.findIndex((n) => n.siswaId === imp.siswaId);
      if (idx > -1) {
        currentNilai[idx] = {
          ...currentNilai[idx],
          tugas: imp.tugas,
          uh1: imp.uh1,
          uh2: imp.uh2,
          uh3: imp.uh3,
          uts: imp.uts,
          uas: imp.uas,
          total: imp.total,
          grade: imp.grade,
        };
      } else {
        currentNilai.push(imp);
      }
    });

    setNilaiList(currentNilai);
    saveNilai(currentNilai);
    alert(`Berhasil menyinkronkan & mengimpor ${importList.length} data nilai siswa!`);
    syncPush();
  };

  // ============================================================================
  // HANDLERS CRUD: PRESENSI
  // ============================================================================
  const handleSavePresensi = (updatedPresensi: Presensi[]) => {
    setPresensiList(updatedPresensi);
    savePresensi(updatedPresensi);
    syncPush();
  };

  // ============================================================================
  // HANDLERS CRUD: RANGKUMAN (LITERASI & LAPORAN TUGAS)
  // ============================================================================
  const handleSaveRangkuman = (updatedRangkuman: Rangkuman[]) => {
    saveRangkuman(updatedRangkuman);
    syncPush();
  };

  // ============================================================================
  // HANDLERS CRUD: PEMBELAJARAN
  // ============================================================================
  const handleAddPembelajaran = (pembelajaran: Pembelajaran) => {
    const updated = [pembelajaran, ...pembelajaranList];
    setPembelajaranList(updated);
    savePembelajaran(updated);
    syncPush();
  };

  const handleUpdatePembelajaran = (pembelajaran: Pembelajaran) => {
    const updated = pembelajaranList.map((p) =>
      p.id === pembelajaran.id ? pembelajaran : p
    );
    setPembelajaranList(updated);
    savePembelajaran(updated);
    syncPush();
  };

  const handleDeletePembelajaran = (id: string) => {
    const updated = pembelajaranList.filter((p) => p.id !== id);
    setPembelajaranList(updated);
    savePembelajaran(updated);
    syncPush();
  };

  // ============================================================================
  // HANDLERS CRUD: PENGUMUMAN / MADING
  // ============================================================================
  const handleAddPengumuman = (announce: Pengumuman) => {
    const updated = [announce, ...pengumumanList];
    setPengumumanList(updated);
    savePengumuman(updated);
    syncPush();
  };

  const handleDeletePengumuman = (id: string) => {
    const updated = pengumumanList.filter((a) => a.id !== id);
    setPengumumanList(updated);
    savePengumuman(updated);
    syncPush();
  };

  // ============================================================================
  // ROUTING CONTROLLER (RENDER HALAMAN DENGAN TRANSISI HALUS)
  // ============================================================================
  const renderContent = () => {
    switch (currentMenu) {
      case 'dashboard':
        return (
          <Dashboard
            siswaList={siswaList}
            nilaiList={nilaiList}
            presensiList={presensiList}
            pembelajaranList={pembelajaranList}
            pengumumanList={pengumumanList}
            setCurrentMenu={setCurrentMenu}
            onAddPengumuman={handleAddPengumuman}
            onDeletePengumuman={handleDeletePengumuman}
            settings={settings}
            onSyncSpreadsheet={handleSyncSpreadsheet}
          />
        );
      case 'siswa':
        return (
          <KelolaSiswa
            siswaList={siswaList}
            onAddSiswa={handleAddSiswa}
            onUpdateSiswa={handleUpdateSiswa}
            onDeleteSiswa={handleDeleteSiswa}
            onImportSiswa={handleImportSiswa}
          />
        );
      case 'nilai':
        return (
          <KelolaNilai
            nilaiList={nilaiList}
            siswaList={siswaList}
            onAddNilai={handleAddNilai}
            onUpdateNilai={handleUpdateNilai}
            onDeleteNilai={handleDeleteNilai}
            onImportNilai={handleImportNilai}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        );
      case 'presensi':
        return (
          <KelolaPresensi
            presensiList={presensiList}
            siswaList={siswaList}
            onSavePresensi={handleSavePresensi}
          />
        );
      case 'pembelajaran':
        return (
          <KelolaPembelajaran
            pembelajaranList={pembelajaranList}
            onAddPembelajaran={handleAddPembelajaran}
            onUpdatePembelajaran={handleUpdatePembelajaran}
            onDeletePembelajaran={handleDeletePembelajaran}
          />
        );
      case 'laporan':
        return (
          <Laporan
            siswaList={siswaList}
            nilaiList={nilaiList}
            presensiList={presensiList}
            pembelajaranList={pembelajaranList}
            settings={settings}
          />
        );
      case 'settings':
        return (
          <SettingsComponent
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        );
      default:
        return (
          <div className="py-20 text-center text-slate-500">
            Halaman tidak ditemukan. Kembali ke Dashboard.
          </div>
        );
    }
  };

  if (loggedSiswa) {
    return (
      <div className="min-h-screen bg-neu-bg p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full transition-all duration-300">
        <SiswaDashboard
          siswa={loggedSiswa}
          nilaiList={nilaiList}
          presensiList={presensiList}
          pembelajaranList={pembelajaranList}
          pengumumanList={pengumumanList}
          settings={settings}
          onUpdateSiswa={(updatedSiswa) => {
            handleUpdateSiswa(updatedSiswa);
            localStorage.setItem('loggedSiswa', JSON.stringify(updatedSiswa));
            setLoggedSiswa(updatedSiswa);
          }}
          onLogout={() => {
            localStorage.removeItem('loggedSiswa');
            localStorage.removeItem('loggedTeacherUsername');
            setLoggedSiswa(null);
            setTimeout(() => {
              reloadAllStates();
            }, 0);
          }}
          onUpdatePembelajaran={handleUpdatePembelajaran}
          onSavePresensi={handleSavePresensi}
          onSaveRangkuman={handleSaveRangkuman}
        />
      </div>
    );
  }

  const handleTeacherLogout = () => {
    localStorage.removeItem('isTeacherLoggedIn');
    localStorage.removeItem('loggedTeacherUsername');
    setIsTeacherLoggedIn(false);
    setTimeout(() => {
      reloadAllStates();
    }, 0);
  };

  const handleSuperAdminLogout = () => {
    localStorage.removeItem('isSuperAdminLoggedIn');
    setIsSuperAdminLoggedIn(false);
  };

  const handleImpersonateTeacher = (username: string) => {
    localStorage.setItem('loggedTeacherUsername', username);
    localStorage.setItem('isTeacherLoggedIn', 'true');
    setIsTeacherLoggedIn(true);
    setTimeout(() => {
      reloadAllStates();
    }, 0);
  };

  const handleReturnToSuperAdmin = () => {
    localStorage.removeItem('isTeacherLoggedIn');
    localStorage.removeItem('loggedTeacherUsername');
    setIsTeacherLoggedIn(false);
    setTimeout(() => {
      reloadAllStates();
    }, 0);
  };

  const handleTeacherLoginSuccess = (username: string) => {
    localStorage.setItem('loggedTeacherUsername', username);
    localStorage.setItem('isTeacherLoggedIn', 'true');
    setIsTeacherLoggedIn(true);
    setTimeout(() => {
      reloadAllStates();
    }, 0);
  };

  const handleSuperAdminLoginSuccess = () => {
    localStorage.setItem('isSuperAdminLoggedIn', 'true');
    setIsSuperAdminLoggedIn(true);
  };

  if (isSuperAdminLoggedIn && !isTeacherLoggedIn) {
    return (
      <SuperAdminDashboard
        onLogout={handleSuperAdminLogout}
        onImpersonateTeacher={handleImpersonateTeacher}
      />
    );
  }

  if (!isTeacherLoggedIn) {
    return (
      <Login
        siswaList={siswaList}
        settings={settings}
        onTeacherLoginSuccess={handleTeacherLoginSuccess}
        onSuperAdminLoginSuccess={handleSuperAdminLoginSuccess}
        onStudentLoginSuccess={(siswa, teacherUsername) => {
          if (teacherUsername) {
            localStorage.setItem('loggedTeacherUsername', teacherUsername);
          } else {
            localStorage.removeItem('loggedTeacherUsername');
          }
          localStorage.setItem('loggedSiswa', JSON.stringify(siswa));
          reloadAllStates();
          setLoggedSiswa(siswa);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neu-bg flex flex-col relative">
      {/* Impersonation Warning Banner */}
      {isSuperAdminLoggedIn && (
        <div className="bg-rose-600 text-white text-xs font-bold py-2.5 px-4 flex flex-col sm:flex-row justify-between items-center gap-2 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="bg-white text-rose-600 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase">SISTEM IMPERSONASI</span>
            <span>Anda sedang masuk sebagai Guru: <strong className="underline">{settings.namaGuru}</strong> ({settings.adminUsername}). Semua perubahan data terisolasi untuk guru ini.</span>
          </div>
          <button
            onClick={handleReturnToSuperAdmin}
            className="bg-white hover:bg-slate-100 text-rose-600 px-3 py-1 rounded-lg font-extrabold cursor-pointer transition-all active:scale-95 text-[10px]"
          >
            Kembali ke Super Admin Panel &rarr;
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row flex-1 relative">
        {/* 1. Sidebar Panel (Desktop & Mobile responsive) */}
        <Sidebar
          currentMenu={currentMenu}
          setCurrentMenu={setCurrentMenu}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          onLogout={handleTeacherLogout}
          settings={settings}
        />

        {/* 2. Main Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 pt-20 md:pt-8 max-w-7xl mx-auto w-full transition-all duration-300">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMenu}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full"
              id={`content-wrapper-${currentMenu}`}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
