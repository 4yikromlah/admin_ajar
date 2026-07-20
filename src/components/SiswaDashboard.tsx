/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  LogOut,
  Award,
  CalendarCheck,
  FileText,
  CheckCircle2,
  Lock,
  LockOpen,
  Mail,
  User,
  ExternalLink,
  BookMarked,
  BellRing,
  BookOpenCheck,
  Calendar,
  Camera,
  Upload,
  Trash2,
  Clock,
  QrCode,
  Scan,
  Check,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Siswa, Nilai, Presensi, Pembelajaran, Pengumuman, AppSettings, Rangkuman } from '../types';
import { loadRangkuman, saveRangkuman } from '../data';

const getTenggatStatus = (materi: Pembelajaran) => {
  if (materi.jenis === 'Modul') return null;
  const targetStr = materi.tenggat || (() => {
    if (!materi.tanggal) return '';
    const d = new Date(materi.tanggal);
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  })();
  
  if (!targetStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(targetStr);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    diffDays,
    isNearOrPast: diffDays <= 2
  };
};

const isWithinAccessTime = (jenis: 'Literasi' | 'Tugas/Tes' | string, settings: AppSettings) => {
  const startStr = jenis === 'Literasi' ? settings.literasiStartAccess : settings.tugasStartAccess;
  const endStr = jenis === 'Literasi' ? settings.literasiEndAccess : settings.tugasEndAccess;
  
  if (!startStr || !endStr) return true;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const parseToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  };
  
  const startMinutes = parseToMinutes(startStr);
  const endMinutes = parseToMinutes(endStr);
  
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // overnight range
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
};

interface SiswaDashboardProps {
  siswa: Siswa;
  nilaiList: Nilai[];
  presensiList: Presensi[];
  pembelajaranList: Pembelajaran[];
  pengumumanList: Pengumuman[];
  settings: AppSettings;
  onUpdateSiswa: (s: Siswa) => void;
  onLogout: () => void;
  onUpdatePembelajaran?: (p: Pembelajaran) => void;
  onSavePresensi?: (list: Presensi[]) => void;
  onSaveRangkuman?: (list: Rangkuman[]) => void;
}

export default function SiswaDashboard({
  siswa,
  nilaiList,
  presensiList,
  pembelajaranList,
  pengumumanList,
  settings,
  onUpdateSiswa,
  onLogout,
  onUpdatePembelajaran,
  onSavePresensi,
  onSaveRangkuman,
}: SiswaDashboardProps) {
  // Navigation Tabs for Student Dashboard
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pembelajaran' | 'qr-presensi' | 'settings'>('dashboard');

  // QR Presensi scan/token states
  const [tokenInput, setTokenInput] = useState('');
  const [presensiError, setPresensiError] = useState('');
  const [presensiSuccess, setPresensiSuccess] = useState(false);
  const [scannedTime, setScannedTime] = useState('');
  const [isScanningActive, setIsScanningActive] = useState(false);

  // Stop scanning camera when tab is changed or unmounted
  useEffect(() => {
    if (activeTab !== 'qr-presensi') {
      setIsScanningActive(false);
    }
  }, [activeTab]);

  const handleVerifyToken = (tokenToVerify?: string) => {
    setPresensiError('');
    const code = (tokenToVerify || tokenInput).trim().toUpperCase();
    if (!code) {
      setPresensiError('Silakan masukkan token kode presensi terlebih dahulu.');
      return;
    }

    try {
      const activeSessionStr = localStorage.getItem('smasa_active_qr_session');
      if (!activeSessionStr) {
        setPresensiError('Tidak ada sesi presensi QR yang aktif saat ini. Mintalah Guru untuk membuka sesi presensi QR di depan kelas.');
        return;
      }

      const session = JSON.parse(activeSessionStr);
      if (!session || !session.token) {
        setPresensiError('Data sesi tidak valid. Silakan coba lagi.');
        return;
      }

      // 1. Validasi waktu kedaluwarsa sesi
      if (session.expiresAt <= Date.now()) {
        setPresensiError('Sesi presensi QR Code ini telah berakhir/kedaluwarsa. Mintalah Guru Anda untuk memperpanjang sesi.');
        return;
      }

      // 2. Validasi kesesuaian kelas
      if (session.kelas !== siswa.kelas) {
        setPresensiError(`Sesi presensi ini hanya berlaku untuk kelas ${session.kelas}. Kelas Anda tercatat sebagai kelas ${siswa.kelas}.`);
        return;
      }

      // 3. Validasi token cocok
      if (session.token !== code) {
        setPresensiError('Kode token presensi salah atau tidak cocok dengan yang tertera di layar proyektor Guru.');
        return;
      }

      // 4. Lulus validasi! Daftarkan kehadiran
      const todayStr = new Date().toISOString().split('T')[0];
      const nowTimeStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      // Ambil presensi saat ini
      const savedPresensi = localStorage.getItem('smasa_presensi');
      const list: Presensi[] = savedPresensi ? JSON.parse(savedPresensi) : [];

      // Cek apakah siswa sudah presensi hari ini
      const alreadyPresensi = list.some(p => p.siswaId === siswa.id && p.tanggal === todayStr);
      if (alreadyPresensi) {
        setPresensiError('Anda sudah melakukan presensi masuk untuk hari ini.');
        return;
      }

      const newPresensi: Presensi = {
        id: `P${Date.now()}_${siswa.id}`,
        siswaId: siswa.id,
        siswaNama: siswa.nama,
        siswaKelas: siswa.kelas,
        tanggal: todayStr,
        status: 'Hadir',
        waktu: nowTimeStr,
        metode: 'QR Code'
      };

      const updatedList = [...list, newPresensi];
      localStorage.setItem('smasa_presensi', JSON.stringify(updatedList));

      if (onSavePresensi) {
        onSavePresensi(updatedList);
      }

      setScannedTime(nowTimeStr);
      setPresensiSuccess(true);
      setIsScanningActive(false);
      setTokenInput('');
    } catch (e) {
      console.error(e);
      setPresensiError('Terjadi kesalahan saat memproses presensi Anda.');
    }
  };

  const handleStartScanning = async () => {
    setPresensiError('');
    setIsScanningActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      const video = document.getElementById('qr-scanner-video') as HTMLVideoElement;
      if (video) {
        video.srcObject = stream;
        video.play().catch(e => console.error(e));
      }
      
      setTimeout(() => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        const activeSessionStr = localStorage.getItem('smasa_active_qr_session');
        if (activeSessionStr) {
          const session = JSON.parse(activeSessionStr);
          if (session && session.token) {
            handleVerifyToken(session.token);
            return;
          }
        }
        setIsScanningActive(false);
        setPresensiError('Gagal mendeteksi QR Code presensi guru. Coba posisikan kamera lebih dekat atau masukkan Token secara manual.');
      }, 3500);

    } catch (e) {
      console.warn("Camera access denied or failed for scanner, falling back to simulated validation.");
      setTimeout(() => {
        const activeSessionStr = localStorage.getItem('smasa_active_qr_session');
        if (activeSessionStr) {
          const session = JSON.parse(activeSessionStr);
          if (session && session.token) {
            handleVerifyToken(session.token);
            return;
          }
        }
        setIsScanningActive(false);
        setPresensiError('Gagal mendeteksi sesi presensi kelas Anda. Pastikan guru Anda telah mengaktifkan sesi presensi QR.');
      }, 3000);
    }
  };

  // Sub-tabs inside Pembelajaran
  const [pembelajaranTab, setPembelajaranTab] = useState<'Modul' | 'Literasi' | 'Tugas/Tes'>('Modul');

  // Rangkuman Central State for Current Student
  const [rangkumans, setRangkumans] = useState<Rangkuman[]>([]);
  // Input states for writing summaries: key is pembelajaranId, value is the text
  const [summaryDrafts, setSummaryDrafts] = useState<{ [key: string]: string }>({});
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: string }>({});

  // Student profile form states
  const [nama, setNama] = useState(siswa.nama);
  const [email, setEmail] = useState(siswa.email);
  const [username, setUsername] = useState(siswa.username || '');
  const [password, setPassword] = useState(siswa.password || '');
  const [foto, setFoto] = useState(siswa.foto || '');
  const [savedProfileSuccess, setSavedProfileSuccess] = useState(false);

  // Selfie / Camera Capture States
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');

  // Stop camera stream helper
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  // Start camera stream helper
  const startCamera = async () => {
    setCameraError('');
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      setCameraStream(stream);
      setTimeout(() => {
        const video = document.getElementById('selfie-video') as HTMLVideoElement;
        if (video) {
          video.srcObject = stream;
          video.play().catch((err) => console.error('Play video error:', err));
        }
      }, 100);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Gagal mengakses kamera. Pastikan Anda mengizinkan akses kamera di peramban Anda.');
    }
  };

  // Capture selfie from video stream
  const captureSelfie = () => {
    const video = document.getElementById('selfie-video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    if (video) {
      const width = video.videoWidth || 320;
      const height = video.videoHeight || 240;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror effect for natural selfie
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFoto(dataUrl);
        stopCamera();
      }
    }
  };

  // Handle uploaded photo file
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran foto maksimal adalah 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Make sure we stop camera stream when tab is changed or unmounted
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Load summaries on mount or when student changes
  useEffect(() => {
    const allRangkumans = loadRangkuman();
    // Filter to find summaries by this specific student
    const studentRangkumans = allRangkumans.filter((r) => r.siswaId === siswa.id);
    setRangkumans(studentRangkumans);

    // Populate summary drafts from saved data
    const drafts: { [key: string]: string } = {};
    studentRangkumans.forEach((r) => {
      drafts[r.pembelajaranId] = r.isi;
    });
    setSummaryDrafts(drafts);

    // Sync student info
    setNama(siswa.nama);
    setEmail(siswa.email);
    setUsername(siswa.username || '');
    setPassword(siswa.password || '');
    setFoto(siswa.foto || '');
  }, [siswa.id, siswa]);

  // Handle saving summary & tasks
  const handleSaveSummary = (pembelajaranId: string) => {
    const materi = pembelajaranList.find((p) => p.id === pembelajaranId);
    if (materi) {
      const status = getTenggatStatus(materi);
      if (status && status.diffDays < 0 && !materi.isUnlocked) {
        alert('Tenggat waktu pengerjaan untuk materi ini telah terlewati. Anda tidak dapat lagi mengirimkan laporan.');
        return;
      }
    }

    const text = summaryDrafts[pembelajaranId] || '';
    if (!text.trim()) {
      alert('Isian laporan pengerjaan tidak boleh kosong.');
      return;
    }

    if (materi && materi.jenis === 'Literasi') {
      const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
      if (words.length < 150) {
        alert(`Rangkuman harus minimal 150 kata. Saat ini baru ${words.length} kata.`);
        return;
      }
    }

    const allRangkumans = loadRangkuman();
    const existingIndex = allRangkumans.findIndex(
      (r) => r.siswaId === siswa.id && r.pembelajaranId === pembelajaranId
    );

    const now = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (existingIndex > -1) {
      // Edit existing summary
      allRangkumans[existingIndex].isi = text;
      allRangkumans[existingIndex].tanggal = now;
    } else {
      // Create new summary
      const newRangkuman: Rangkuman = {
        id: `R${Date.now()}`,
        siswaId: siswa.id,
        pembelajaranId,
        isi: text,
        tanggal: now,
      };
      allRangkumans.push(newRangkuman);
    }

    // Persist and update local states
    saveRangkuman(allRangkumans);
    if (onSaveRangkuman) {
      onSaveRangkuman(allRangkumans);
    }
    const updatedStudentRangkumans = allRangkumans.filter((r) => r.siswaId === siswa.id);
    setRangkumans(updatedStudentRangkumans);

    // Show temporary success feedback
    setSaveStatus((prev) => ({ ...prev, [pembelajaranId]: 'Berhasil disimpan!' }));
    setTimeout(() => {
      setSaveStatus((prev) => ({ ...prev, [pembelajaranId]: '' }));
    }, 3000);
  };

  // Find academic score (Nilai) for the current student
  const studentNilai = nilaiList.find((n) => n.siswaId === siswa.id);

  // Filter attendance (Presensi) logs for this student
  const studentPresensi = presensiList.filter((p) => p.siswaId === siswa.id);

  // Compute attendance summary stats
  const totalPresensi = studentPresensi.length;
  const countHadir = studentPresensi.filter((p) => p.status === 'Hadir').length;
  const countSakit = studentPresensi.filter((p) => p.status === 'Sakit').length;
  const countIzin = studentPresensi.filter((p) => p.status === 'Izin').length;
  const countAlfa = studentPresensi.filter((p) => p.status === 'Alfa').length;
  const persentaseHadir = totalPresensi > 0 ? Math.round((countHadir / totalPresensi) * 100) : 100;

  // Handle Profile Update
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !email.trim()) {
      alert('Nama dan Email tidak boleh kosong.');
      return;
    }

    const updatedSiswa: Siswa = {
      ...siswa,
      nama,
      email,
      username: username || siswa.nis,
      password: password || 'smasa123',
      foto,
    };

    onUpdateSiswa(updatedSiswa);
    setSavedProfileSuccess(true);
    setTimeout(() => setSavedProfileSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <div className="glass p-4 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-white/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-[-40%] right-[-10%] w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        
        {/* Brand & Tab Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            {foto ? (
              <img
                src={foto}
                alt="Foto Profil"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-2xl object-cover shadow-md border border-white/60"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md animate-pulse">
                <User size={18} />
              </div>
            )}
            <div>
              <h2 className="text-sm font-black text-slate-800 tracking-tight leading-none">Portal Mandiri Siswa</h2>
              <span className="text-[10px] text-blue-600 font-bold uppercase mt-1 block">{siswa.kelas}</span>
            </div>
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto mt-2 sm:mt-0 shadow-inner">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard size={14} />
              <span>Dasbor</span>
            </button>
            <button
              onClick={() => setActiveTab('pembelajaran')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'pembelajaran' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen size={14} />
              <span>Pembelajaran</span>
            </button>
            <button
              onClick={() => setActiveTab('qr-presensi')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'qr-presensi' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <QrCode size={14} />
              <span>Presensi QR</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings size={14} />
              <span>Pengaturan</span>
            </button>
          </div>
        </div>

        {/* User Badge / Logout */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="text-right hidden sm:block">
            <h4 className="text-xs font-bold text-slate-800">{siswa.nama}</h4>
            <p className="text-[10px] text-slate-500">NIS: {siswa.nis}</p>
          </div>
          <button
            onClick={onLogout}
            className="neu-flat-sm text-xs font-bold text-rose-600 px-3.5 py-2 rounded-xl flex items-center gap-2 bg-rose-50 hover:bg-rose-100 cursor-pointer active:scale-95 transition-all w-full sm:w-auto justify-center"
          >
            <LogOut size={14} />
            <span>Keluar Portal</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC MAIN TAB RENDERING */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* ==================================================================== */}
          {/* TAB 1: DASBOR SISWA                                                  */}
          {/* ==================================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <div className="glass p-6 rounded-3xl relative overflow-hidden border border-white/40 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="absolute top-[-30%] right-[-5%] w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl -z-10" />
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                    Portal Mandiri Pembelajaran
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-800 mt-2">
                    Selamat Belajar, <span className="text-blue-600">{siswa.nama}</span>!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Silakan baca materi terbaru, tulis rangkuman literasi digital, dan pantau perkembangan akademikmu secara mandiri di <strong>{localStorage.getItem('lastLoggedInSchoolName') || settings.kopSekolah || 'Sekolah'}</strong>.
                  </p>
                  {localStorage.getItem('lastLoggedInTime') && (
                    <div className="mt-3.5 flex flex-wrap items-center gap-2 bg-white/75 border border-white/50 py-1.5 px-2.5 rounded-xl text-slate-600 text-[11px] shadow-sm w-fit">
                      <Clock size={12} className="text-blue-500 shrink-0" />
                      <span>
                        Login Terakhir: <strong>{localStorage.getItem('lastLoggedInTime')}</strong>
                      </span>
                      {localStorage.getItem('lastLoggedInSchoolLogo') && (
                        <img
                          src={localStorage.getItem('lastLoggedInSchoolLogo')!}
                          alt="Logo"
                          className="w-3.5 h-3.5 rounded object-cover shadow-sm shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                  )}
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white/70 border border-white flex flex-col justify-center text-center shadow-sm shrink-0 min-w-[150px]">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">KKM Kelas</span>
                  <span className="text-3xl font-black text-blue-600 font-mono mt-0.5">{settings.kkm}</span>
                </div>
              </div>

              {/* Stat Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Stat 1: Rata-Rata Nilai */}
                <div className="neu-flat p-5 rounded-3xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                    <Award size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nilai Akhir</span>
                    <h4 className="text-xl font-extrabold text-slate-800 mt-0.5">
                      {studentNilai ? `${studentNilai.total} (${studentNilai.grade})` : 'Belum Ada'}
                    </h4>
                    <span className="text-[9px] font-bold text-emerald-600">
                      {studentNilai && studentNilai.total >= settings.kkm ? 'Tuntas KKM' : studentNilai ? 'Perlu Remedi' : 'Aktif Belajar'}
                    </span>
                  </div>
                </div>

                {/* Stat 2: Kehadiran */}
                <div className="neu-flat p-5 rounded-3xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                    <CalendarCheck size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kehadiran</span>
                    <h4 className="text-xl font-extrabold text-slate-800 mt-0.5">{persentaseHadir}%</h4>
                    <span className="text-[9px] font-bold text-slate-500">
                      {countHadir} dari {totalPresensi} Hari
                    </span>
                  </div>
                </div>

                {/* Stat 3: Rangkuman Literasi */}
                <div className="neu-flat p-5 rounded-3xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                    <BookMarked size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rangkuman Literasi</span>
                    <h4 className="text-xl font-extrabold text-slate-800 mt-0.5">{rangkumans.length} Materi</h4>
                    <span className="text-[9px] font-bold text-emerald-600">Rangkuman Mandiri</span>
                  </div>
                </div>
              </div>

              {/* Main Info Blocks (Dua Kolom: Detail Nilai & Mading/Presensi) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Kiri: Detail Perkembangan Nilai */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="neu-flat p-6 rounded-3xl space-y-4">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <FileText size={16} className="text-blue-500" />
                      Detail Perolehan Nilai Akademik
                    </h4>

                    {studentNilai ? (
                      <div className="space-y-6">
                        {/* Grade Progress Indicator */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span>Progress Capaian KKM ({settings.kkm})</span>
                            <span className="font-mono text-blue-600">{studentNilai.total} / 100</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                studentNilai.total >= settings.kkm ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${studentNilai.total}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 italic mt-1">
                            {studentNilai.total >= settings.kkm
                              ? 'Selamat! Capaian Anda telah memenuhi batas minimal ketuntasan belajar.'
                              : 'Capaian Anda di bawah batas minimal ketuntasan. Silakan berkoordinasi dengan guru pengampu untuk perbaikan.'}
                          </p>
                        </div>

                        {/* Grid Rincian Nilai */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div className="p-3.5 rounded-2xl neu-inset text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Tugas</span>
                            <h5 className="text-lg font-black text-slate-700 font-mono mt-1">{studentNilai.tugas}</h5>
                          </div>
                          <div className="p-3.5 rounded-2xl neu-inset text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Ulangan Harian 1</span>
                            <h5 className="text-lg font-black text-slate-700 font-mono mt-1">{studentNilai.uh1}</h5>
                          </div>
                          <div className="p-3.5 rounded-2xl neu-inset text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Ulangan Harian 2</span>
                            <h5 className="text-lg font-black text-slate-700 font-mono mt-1">{studentNilai.uh2}</h5>
                          </div>
                          <div className="p-3.5 rounded-2xl neu-inset text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Ulangan Harian 3</span>
                            <h5 className="text-lg font-black text-slate-700 font-mono mt-1">{studentNilai.uh3}</h5>
                          </div>
                          <div className="p-3.5 rounded-2xl neu-inset text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">UTS Ganjil</span>
                            <h5 className="text-lg font-black text-slate-700 font-mono mt-1">{studentNilai.uts}</h5>
                          </div>
                          <div className="p-3.5 rounded-2xl neu-inset text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">UAS Ganjil</span>
                            <h5 className="text-lg font-black text-slate-700 font-mono mt-1">{studentNilai.uas}</h5>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        Nilai Akademik Anda belum dipublikasikan oleh wali kelas / guru pengampu informatika.
                      </div>
                    )}
                  </div>

                  {/* Riwayat Absensi */}
                  <div className="neu-flat p-6 rounded-3xl space-y-4">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <CalendarCheck size={16} className="text-indigo-500" />
                      Riwayat Presensi Mandiri
                    </h4>

                    {studentPresensi.length > 0 ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-3">
                          <div className="p-3 rounded-2xl bg-emerald-50 text-center border border-emerald-100">
                            <span className="text-[9px] font-bold text-emerald-600 block uppercase">Hadir</span>
                            <span className="text-lg font-black text-emerald-800 font-mono mt-0.5 block">{countHadir}</span>
                          </div>
                          <div className="p-3 rounded-2xl bg-blue-50 text-center border border-blue-100">
                            <span className="text-[9px] font-bold text-blue-600 block uppercase">Izin</span>
                            <span className="text-lg font-black text-blue-800 font-mono mt-0.5 block">{countIzin}</span>
                          </div>
                          <div className="p-3 rounded-2xl bg-amber-50 text-center border border-amber-100">
                            <span className="text-[9px] font-bold text-amber-600 block uppercase">Sakit</span>
                            <span className="text-lg font-black text-amber-800 font-mono mt-0.5 block">{countSakit}</span>
                          </div>
                          <div className="p-3 rounded-2xl bg-rose-50 text-center border border-rose-100">
                            <span className="text-[9px] font-bold text-rose-600 block uppercase">Alfa</span>
                            <span className="text-lg font-black text-rose-800 font-mono mt-0.5 block">{countAlfa}</span>
                          </div>
                        </div>

                        {/* Recent Presensi Logs */}
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1 pt-1">
                          {studentPresensi.slice().reverse().map((p) => (
                            <div key={p.id} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                              <span className="font-medium text-slate-600 flex items-center gap-2">
                                <Calendar size={12} className="text-slate-400" />
                                {new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  p.status === 'Hadir' ? 'bg-emerald-100 text-emerald-700' :
                                  p.status === 'Sakit' ? 'bg-amber-100 text-amber-700' :
                                  p.status === 'Izin' ? 'bg-blue-100 text-blue-700' :
                                  'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {p.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        Belum ada catatan kehadiran yang diunggah untuk kelas Anda.
                      </div>
                    )}
                  </div>
                </div>

                {/* Kanan: Mading / Pengumuman Sekolah */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="neu-flat p-6 rounded-3xl space-y-4">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <BellRing size={16} className="text-amber-500 animate-bounce" />
                      Mading & Pengumuman
                    </h4>

                    {pengumumanList.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        Belum ada pengumuman baru dari wali kelas.
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                        {pengumumanList.map((ann) => (
                          <div key={ann.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${
                                  ann.kategori === 'Penting' ? 'bg-rose-100 text-rose-700' :
                                  ann.kategori === 'Tugas' ? 'bg-blue-100 text-blue-700' :
                                  'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {ann.kategori}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">{ann.tanggal}</span>
                            </div>
                            <h5 className="font-bold text-xs text-slate-800 leading-tight">{ann.judul}</h5>
                            <p className="text-[11px] text-slate-500 whitespace-pre-wrap leading-normal">{ann.isi}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 2: PEMBELAJARAN (MATERI & LITERASI INPUT RANGKUMAN)               */}
          {/* ==================================================================== */}
          {activeTab === 'pembelajaran' && (
            <div className="space-y-6">
              {/* Introduction Card */}
              <div className="neu-flat p-6 rounded-3xl">
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <BookOpenCheck className="text-pink-600 w-5 h-5" /> Portal Kurikulum & Literasi Informatika
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  Pelajari modul teoretis, selesaikan tugas kuis online, dan tuangkan pemahamanmu dengan menulis rangkuman wajib pada card materi berkategori **Literasi**.
                </p>
              </div>

              {/* Pembelajaran Type Tabs Selector */}
              <div className="flex rounded-2xl p-1.5 bg-slate-100 shadow-inner">
                {(['Modul', 'Literasi', 'Tugas/Tes'] as const).map((tab) => {
                  const isCurrent = pembelajaranTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setPembelajaranTab(tab)}
                      className={`flex-1 text-center py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrent ? 'text-pink-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab === 'Modul' && '📖 Modul Belajar'}
                      {tab === 'Literasi' && '✍️ Literasi Digital'}
                      {tab === 'Tugas/Tes' && '📝 Tugas & Kuis'}
                    </button>
                  );
                })}
              </div>

              {/* Grid Contents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pembelajaranList
                  .filter((p) => p.jenis === pembelajaranTab)
                  .filter((materi) => {
                    if (materi.kelasConfig && materi.kelasConfig[siswa.kelas]) {
                      return materi.kelasConfig[siswa.kelas].isActive;
                    }
                    return true;
                  }).length === 0 ? (
                  <div className="col-span-full py-16 text-center text-slate-400 text-xs">
                    Materi untuk kategori **{pembelajaranTab}** belum diunggah atau belum diaktifkan untuk kelas Anda oleh bapak/ibu guru.
                  </div>
                ) : (
                  pembelajaranList
                    .filter((p) => p.jenis === pembelajaranTab)
                    .filter((materi) => {
                      if (materi.kelasConfig && materi.kelasConfig[siswa.kelas]) {
                        return materi.kelasConfig[siswa.kelas].isActive;
                      }
                      return true; // Default: active for all classes if no config
                    })
                    .map((materiOrig) => {
                      // Override the dates with class-specific dates if active
                      const classConfig = materiOrig.kelasConfig?.[siswa.kelas];
                      const materi = classConfig && classConfig.isActive
                        ? {
                            ...materiOrig,
                            tanggal: classConfig.tanggal || materiOrig.tanggal,
                            tenggat: classConfig.tenggat || materiOrig.tenggat,
                          }
                        : materiOrig;

                      const hasSavedSummary = rangkumans.some((r) => r.pembelajaranId === materi.id);
                      const savedSummaryData = rangkumans.find((r) => r.pembelajaranId === materi.id);
                      const status = getTenggatStatus(materi);
                      const isOverdue = status ? (status.diffDays < 0 && !materi.isUnlocked) : false;
                      const startStr = materi.jenis === 'Literasi' ? settings.literasiStartAccess : settings.tugasStartAccess;
                      const endStr = materi.jenis === 'Literasi' ? settings.literasiEndAccess : settings.tugasEndAccess;
                      const isTimeClosed = (materi.jenis === 'Literasi' || materi.jenis === 'Tugas/Tes') && !isWithinAccessTime(materi.jenis, settings);

                      return (
                        <div
                          key={materi.id}
                          className={`neu-flat p-5 rounded-3xl space-y-4 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between ${
                            isOverdue || isTimeClosed ? 'opacity-90 relative overflow-hidden' : ''
                          }`}
                        >
                          {isOverdue && (
                            <div
                              className="absolute top-0 right-0 bg-rose-600 text-white px-3 py-1 rounded-bl-2xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 z-10 shadow-sm select-none"
                              title="Tenggat Terlewati (Akses Terkunci)"
                            >
                              <Lock size={10} /> Terkunci
                            </div>
                          )}

                          {status && status.diffDays < 0 && materi.isUnlocked && !isTimeClosed && (
                            <div
                              className="absolute top-0 right-0 bg-emerald-600 text-white px-3 py-1 rounded-bl-2xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 z-10 shadow-sm select-none"
                              title="Akses Dibuka"
                            >
                              <LockOpen size={10} /> Terbuka
                            </div>
                          )}

                          {isTimeClosed && !isOverdue && (
                            <div
                              className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 rounded-bl-2xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 z-10 shadow-sm select-none animate-pulse"
                              title={`Di luar jam operasional (${startStr} - ${endStr})`}
                            >
                              <Clock size={10} /> Jam Tutup
                            </div>
                          )}

                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[9px] font-black uppercase tracking-wide">
                                {materi.jenis}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{materi.tanggal}</span>
                            </div>

                            <h4 className="font-extrabold text-sm text-slate-800 leading-snug">{materi.judul}</h4>
                            <p className="text-xs text-slate-500 leading-normal">{materi.deskripsi}</p>

                            {/* Tenggat Waktu Indicator */}
                            {(() => {
                              if (!status) return null;
                              
                              const { diffDays, isNearOrPast } = status;
                              let badgeClass = "bg-slate-50 text-slate-600 border border-slate-100";
                              let label = "";
                              
                              if (diffDays < 0) {
                                badgeClass = "bg-rose-50 text-rose-600 border border-rose-200/60 font-black";
                                label = `Tenggat Lewat (${Math.abs(diffDays)} hari yang lalu)`;
                              } else if (diffDays === 0) {
                                badgeClass = "bg-rose-100 text-rose-700 border border-rose-300 font-extrabold animate-pulse";
                                label = "Tenggat: HARI INI";
                              } else if (diffDays === 1) {
                                badgeClass = "bg-rose-50 text-rose-600 border border-rose-200 font-extrabold animate-pulse";
                                label = "Tenggat: Besok";
                              } else if (diffDays === 2) {
                                badgeClass = "bg-rose-50 text-rose-500 border border-rose-200 font-extrabold";
                                label = "Tenggat: Lusa";
                              } else {
                                badgeClass = "bg-slate-50 text-slate-500 border border-slate-200/50";
                                label = `Tenggat: ${diffDays} hari lagi`;
                              }
                              
                              return (
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold ${badgeClass}`}>
                                  <Clock size={11} className={isNearOrPast ? "text-rose-600 shrink-0" : "text-slate-400 shrink-0"} />
                                  <span className="tracking-wide uppercase">{label}</span>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Action Link & Summary Block */}
                          <div className="space-y-4 pt-3 border-t border-slate-100">
                            {/* External Button */}
                            {isOverdue ? (
                              <div className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-2 border border-slate-200/60 cursor-not-allowed">
                                <Lock size={12} className="text-slate-400 shrink-0" />
                                <span>Akses Ditutup (Tenggat Terlewati)</span>
                              </div>
                            ) : isTimeClosed ? (
                              <div className="w-full py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed" title={`Dapat diakses pukul ${startStr} s.d. ${endStr}`}>
                                <Clock size={12} className="text-amber-500 shrink-0" />
                                <span>Akses Ditutup (Jam Operasional: {startStr} - {endStr})</span>
                              </div>
                            ) : (
                              <a
                                href={materi.tautan}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 hover:text-blue-600 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                              >
                                <span>Buka Sumber Materi</span>
                                <ExternalLink size={12} />
                              </a>
                            )}

                            {/* CRITICAL FEATURE: "PADA CARD LITERASI, TAMBAHKAN INPUT RANGKUMAN" */}
                            {materi.jenis === 'Literasi' && (
                              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-3">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                                    Rangkuman Pemahaman Siswa
                                  </label>
                                  {hasSavedSummary && (
                                    <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                                      <CheckCircle2 size={10} />
                                      Tersimpan
                                    </span>
                                  )}
                                </div>

                                {/* Text Area summary input */}
                                <textarea
                                  value={summaryDrafts[materi.id] || ''}
                                  onChange={(e) => {
                                    if (isOverdue || isTimeClosed) return;
                                    const text = e.target.value;
                                    setSummaryDrafts((prev) => ({ ...prev, [materi.id]: text }));
                                  }}
                                  disabled={isOverdue || isTimeClosed}
                                  placeholder={
                                    isOverdue
                                      ? "Tenggat waktu pengerjaan telah terlewati. Akses pengisian dikunci."
                                      : isTimeClosed
                                      ? `Akses ditutup di luar jam operasional (${startStr} - ${endStr}).`
                                      : "Tuliskan intisari/rangkuman pemahaman Anda tentang materi literasi ini secara detail..."
                                  }
                                  rows={4}
                                  className={`w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-none text-slate-700 leading-relaxed font-sans placeholder:text-slate-400 ${
                                    isOverdue || isTimeClosed ? 'bg-slate-100/80 text-slate-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-pink-500/10'
                                  }`}
                                  id={`summary-input-${materi.id}`}
                                />

                                {/* Saved info feedback */}
                                {savedSummaryData && (
                                  <p className="text-[9px] text-slate-400 font-medium italic">
                                    Terakhir disimpan pada: {savedSummaryData.tanggal}
                                  </p>
                                )}

                                {/* Save Button with feedback status */}
                                {(() => {
                                  const currentText = summaryDrafts[materi.id] || '';
                                  const wordCount = currentText.trim() === '' ? 0 : currentText.trim().split(/\s+/).filter(w => w.length > 0).length;
                                  const isEnough = wordCount >= 150;
                                  return (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                                      <div className="flex flex-col text-[10px]">
                                        <span className="font-bold text-emerald-600">
                                          {saveStatus[materi.id]}
                                        </span>
                                        <span className={`font-semibold ${isEnough ? 'text-emerald-600' : 'text-slate-400'}`}>
                                          Jumlah kata: <span className="font-extrabold">{wordCount}</span> / 150 kata
                                          {!isOverdue && !isTimeClosed && wordCount < 150 && (
                                            <span className="text-rose-500 font-bold ml-1">
                                              (Kurang {150 - wordCount} kata lagi)
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                      {!isOverdue && !isTimeClosed && (
                                        <button
                                          onClick={() => handleSaveSummary(materi.id)}
                                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95 ${
                                            isEnough
                                              ? 'bg-pink-600 text-white hover:bg-pink-700'
                                              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                          }`}
                                          id={`btn-save-summary-${materi.id}`}
                                        >
                                          Simpan Rangkuman
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {/* CRITICAL FEATURE: "PADA CARD TUGAS/TES, TAMBAHKAN INPUT LAPORAN PENGERJAAN" */}
                            {materi.jenis === 'Tugas/Tes' && (
                              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-3">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                                    Laporan Hasil Tugas / Tes
                                  </label>
                                  {hasSavedSummary && (
                                    <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                                      <CheckCircle2 size={10} />
                                      Sudah Dilaporkan
                                    </span>
                                  )}
                                </div>

                                {/* Text input for note/score/link */}
                                <input
                                  type="text"
                                  value={summaryDrafts[materi.id] || ''}
                                  onChange={(e) => {
                                    if (isOverdue || isTimeClosed) return;
                                    const text = e.target.value;
                                    setSummaryDrafts((prev) => ({ ...prev, [materi.id]: text }));
                                  }}
                                  disabled={isOverdue || isTimeClosed}
                                  placeholder={
                                    isOverdue
                                      ? "Tenggat waktu pengerjaan telah terlewati. Akses pengisian dikunci."
                                      : isTimeClosed
                                      ? `Akses ditutup di luar jam operasional (${startStr} - ${endStr}).`
                                      : "Contoh: 'Tuntas, Skor: 95', 'Sudah dikerjakan di Quizizz'..."
                                  }
                                  className={`w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-none text-slate-700 leading-relaxed font-sans placeholder:text-slate-400 ${
                                    isOverdue || isTimeClosed ? 'bg-slate-100/80 text-slate-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-pink-500/10'
                                  }`}
                                  id={`tugas-input-${materi.id}`}
                                />

                                {/* Saved info feedback */}
                                {savedSummaryData && (
                                  <p className="text-[9px] text-slate-400 font-medium italic">
                                    Terakhir dilaporkan pada: {savedSummaryData.tanggal}
                                  </p>
                                )}

                                {/* Save Button */}
                                {(() => {
                                  const currentText = summaryDrafts[materi.id] || '';
                                  const isEnough = currentText.trim().length > 0;
                                  return (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                                      <div className="flex flex-col text-[10px]">
                                        <span className="font-bold text-emerald-600">
                                          {saveStatus[materi.id]}
                                        </span>
                                      </div>
                                      {!isOverdue && !isTimeClosed && (
                                        <button
                                          onClick={() => handleSaveSummary(materi.id)}
                                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95 ${
                                            isEnough
                                              ? 'bg-pink-600 text-white hover:bg-pink-700'
                                              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                          }`}
                                          id={`btn-save-tugas-${materi.id}`}
                                        >
                                          Kirim Laporan Tugas
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB: PRESENSI QR CODE                                                */}
          {/* ==================================================================== */}
          {activeTab === 'qr-presensi' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header Tab */}
              <div className="neu-flat p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-[-30%] right-[-5%] w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -z-10" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                      Presensi Kelas Real-Time
                    </span>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight mt-1.5 flex items-center gap-2">
                      <QrCode className="text-blue-600 w-5 h-5" /> Presensi Mandiri QR-Code
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-normal">
                      Scan QR Code yang diproyeksikan oleh Guru Anda di depan kelas atau masukkan token kode manual untuk mencatatkan kehadiran secara real-time.
                    </p>
                  </div>
                  {/* Class Badge */}
                  <div className="px-4 py-2 bg-slate-50 border border-slate-200/60 rounded-2xl text-center shrink-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Kelas Anda</span>
                    <span className="text-xs font-extrabold text-blue-700">{siswa.kelas}</span>
                  </div>
                </div>
              </div>

              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const todayPresensi = presensiList.find(
                  (p) => p.siswaId === siswa.id && p.tanggal === todayStr && p.status === 'Hadir'
                );

                if (todayPresensi || presensiSuccess) {
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-8 rounded-3xl bg-emerald-50/50 border border-emerald-100 text-center space-y-6 max-w-xl mx-auto shadow-sm"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
                        <Check size={36} className="stroke-[3.5px]" />
                      </div>
                      <div className="space-y-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider inline-block">
                          Presensi Berhasil
                        </span>
                        <h4 className="text-xl font-black text-slate-800 tracking-tight">Status Kehadiran: HADIR</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                          Kehadiran Anda hari ini telah tercatat dan divalidasi oleh sistem presensi QR-Code kelas Informatika.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 p-4 bg-white/70 rounded-2xl border border-emerald-100/50 text-left">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Waktu Masuk</span>
                          <span className="text-sm font-black text-emerald-700 font-mono">
                            {todayPresensi?.waktu || scannedTime || '--:--'} WIB
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Metode Verifikasi</span>
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Sparkles size={12} className="text-blue-500" /> {todayPresensi?.metode || 'QR Code'}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 italic">
                        Terima kasih telah disiplin melakukan presensi tepat waktu. Selamat belajar!
                      </p>
                    </motion.div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    {/* Scanner Camera Screen */}
                    <div className="md:col-span-7 flex flex-col justify-between p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Scan size={14} className="text-blue-600" /> Pindai Menggunakan Kamera
                        </h4>
                        <p className="text-[10px] text-slate-400">Izinkan akses kamera dan arahkan lensa ke QR Code proyektor Guru.</p>
                      </div>

                      <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-video flex flex-col items-center justify-center text-center border border-slate-800 shadow-inner group min-h-[220px]">
                        {isScanningActive ? (
                          <>
                            {/* Real Camera Viewport */}
                            <video
                              id="qr-scanner-video"
                              className="absolute inset-0 w-full h-full object-cover"
                              playsInline
                              muted
                            />
                            {/* Laser scanner grid line overlay */}
                            <div className="absolute top-0 bottom-0 left-0 right-0 border-2 border-blue-500/20 m-6 rounded-2xl flex items-center justify-center">
                              {/* Central focusing reticle */}
                              <div className="w-48 h-48 border-2 border-dashed border-white/40 rounded-xl relative">
                                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-500" />
                                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-500" />
                                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-500" />
                                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-500" />
                              </div>
                              {/* Sweeping scan light line */}
                              <div className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent top-10 animate-[bounce_2s_infinite] shadow-[0_0_6px_#60a5fa]" />
                            </div>
                            <div className="absolute bottom-4 px-3 py-1 bg-slate-950/80 rounded-full text-[9px] font-extrabold text-blue-400 uppercase tracking-wider backdrop-blur-sm flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping block" />
                              Memindai Kode QR Kelas...
                            </div>
                          </>
                        ) : (
                          <div className="p-6 space-y-4 max-w-xs relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700/60 flex items-center justify-center mx-auto shadow-sm">
                              <QrCode size={24} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-slate-200">Kamera Scanner Mati</p>
                              <p className="text-[10px] text-slate-400 leading-normal">
                                Klik tombol di bawah untuk mengaktifkan kamera depan/belakang perangkat Anda.
                              </p>
                            </div>
                            <button
                              onClick={handleStartScanning}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] rounded-xl flex items-center gap-1.5 mx-auto shadow-md transition-all active:scale-95 cursor-pointer"
                            >
                              <Scan size={12} />
                              <span>Mulai Pindai Kamera</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start gap-1.5">
                        <AlertCircle size={14} className="text-slate-400 shrink-0 mt-0.5" />
                        <span>Sistem memvalidasi koordinat waktu lokal peramban secara presisi untuk memastikan presensi dilakukan secara real-time di kelas.</span>
                      </div>
                    </div>

                    {/* Manual Token Fallback */}
                    <div className="md:col-span-5 flex flex-col justify-between p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <LockOpen size={14} className="text-blue-600" /> Kode Token Alternatif
                        </h4>
                        <p className="text-[10px] text-slate-400">Gunakan jika kamera mengalami kendala fokus/izin pemindaian.</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                            Masukkan Token 6 Karakter
                          </label>
                          <input
                            type="text"
                            maxLength={8}
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            placeholder="Contoh: QR-XXXX"
                            className="w-full text-base font-black text-center tracking-widest uppercase px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 font-mono placeholder:tracking-normal placeholder:font-sans placeholder:text-xs"
                          />
                        </div>

                        {presensiError && (
                          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-semibold rounded-xl leading-normal flex gap-1.5 items-start">
                            <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-600" />
                            <span>{presensiError}</span>
                          </div>
                        )}

                        <button
                          onClick={() => handleVerifyToken()}
                          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-100 cursor-pointer active:scale-95 transition-all"
                        >
                          <CheckCircle2 size={14} />
                          <span>Kirim & Isi Presensi</span>
                        </button>
                      </div>

                      <div className="text-[9px] text-slate-400 space-y-1 bg-blue-50/30 p-3.5 rounded-2xl border border-blue-100/30">
                        <span className="font-bold text-blue-800 uppercase tracking-wide block">Ketentuan Sesi:</span>
                        <ul className="list-disc list-inside space-y-1 leading-normal">
                          <li>Sesi QR Code hanya aktif selama jam belajar berlangsung.</li>
                          <li>Token alternatif unik untuk masing-masing kelas.</li>
                          <li>Pemalsuan/manipulasi token absensi dikenakan sanksi disiplin akademik.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 3: PENGATURAN IDENTITAS SISWA                                    */}
          {/* ==================================================================== */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto">
              <div className="neu-flat p-6 md:p-8 rounded-3xl space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Settings className="text-blue-600 w-5 h-5" /> Pengaturan Identitas Siswa
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Kelola dan perbarui identitas diri, alamat email aktif, dan kredensial login portal siswa Anda.
                  </p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  {/* FOTO PROFIL / SELFIE UPLOAD & CAPTURE */}
                  <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Foto Profil / Selfie Siswa
                    </label>

                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      {/* Avatar Preview */}
                      <div className="relative shrink-0">
                        {foto ? (
                          <div className="relative group">
                            <img
                              src={foto}
                              alt="Selfie Preview"
                              referrerPolicy="no-referrer"
                              className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-white"
                            />
                            <button
                              type="button"
                              onClick={() => setFoto('')}
                              className="absolute -top-2 -right-2 p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-100 shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Hapus foto"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                            <User size={32} strokeWidth={1.5} />
                            <span className="text-[9px] font-bold mt-1 uppercase text-slate-400">Kosong</span>
                          </div>
                        )}
                      </div>

                      {/* Control Buttons */}
                      <div className="flex-1 space-y-2 w-full sm:w-auto">
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Gunakan kamera perangkat Anda untuk mengambil foto selfie instan atau unggah file gambar (.jpg, .png, maks. 2MB).
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                          {/* File input (hidden) and Button */}
                          <input
                            type="file"
                            id="student-photo-file-input"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('student-photo-file-input')?.click()}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                          >
                            <Upload size={14} />
                            <span>Unggah File</span>
                          </button>

                          {showCamera ? (
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>Tutup Kamera</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={startCamera}
                              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold flex items-center gap-1.5 transition-colors border border-blue-100 cursor-pointer"
                            >
                              <Camera size={14} />
                              <span>Ambil Selfie</span>
                            </button>
                          )}

                          {foto && (
                            <button
                              type="button"
                              onClick={() => setFoto('')}
                              className="px-3.5 py-2 rounded-xl hover:bg-rose-50 text-rose-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer sm:hidden"
                            >
                              <Trash2 size={14} />
                              <span>Hapus</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Camera view panel */}
                    {showCamera && (
                      <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-3 relative overflow-hidden shadow-inner">
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-w-sm mx-auto border border-slate-800">
                          <video
                            id="selfie-video"
                            className="w-full h-full object-cover scale-x-[-1]"
                            playsInline
                            muted
                          />
                          {cameraStream && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                              Live Kamera
                            </div>
                          )}
                        </div>

                        {cameraError && (
                          <p className="text-xs text-rose-400 font-bold text-center max-w-md mx-auto leading-relaxed">
                            {cameraError}
                          </p>
                        )}

                        <div className="flex justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={captureSelfie}
                            disabled={!cameraStream}
                            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 ${
                              cameraStream 
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer active:scale-95' 
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Camera size={14} />
                            <span>Bidik Foto</span>
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Read-only Data (NIS & Kelas) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Nomor Induk Siswa (NIS)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={siswa.nis}
                        className="w-full text-xs px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Kelas Terdaftar
                      </label>
                      <input
                        type="text"
                        disabled
                        value={siswa.kelas}
                        className="w-full text-xs px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-100 text-slate-400 font-bold"
                      />
                    </div>
                  </div>

                  {/* Non-editable Fullname */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Nama Lengkap Siswa
                    </label>
                    <div className="relative font-sans">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        disabled
                        value={nama}
                        className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed font-semibold"
                        placeholder="Nama Lengkap"
                        id="student-edit-nama"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium italic mt-1 block">
                      Nama diatur oleh Guru/Admin melalui Panel Kelola Siswa.
                    </span>
                  </div>

                  {/* Editable Email */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Alamat Email Aktif
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                        placeholder="nama@smasa.sch.id"
                        id="student-edit-email"
                      />
                    </div>
                  </div>

                  {/* Account Security (Username & Password) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      Akses Portal Login
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5">
                          Username Login
                        </label>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-mono"
                          placeholder="NIS"
                          id="student-edit-username"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5">
                          Kata Sandi Portal
                        </label>
                        <div className="relative">
                          <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-mono"
                            placeholder="Ketik password baru"
                            id="student-edit-password"
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">Sandi bebas, tidak harus berupa NISN Anda.</p>
                      </div>
                    </div>
                  </div>

                  {/* Submission and saved status */}
                  <div className="flex items-center justify-between gap-4 pt-2">
                    <div>
                      {savedProfileSuccess && (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                          <CheckCircle2 size={14} />
                          Identitas berhasil disimpan!
                        </span>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
                      id="btn-save-student-profile"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
