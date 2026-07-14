/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  CalendarCheck, 
  CheckCircle2, 
  UserCheck, 
  AlertCircle, 
  RefreshCw,
  QrCode,
  Timer,
  Tv,
  Sparkles,
  Play,
  Square,
  Clock,
  Check,
  UserX
} from 'lucide-react';
import { motion } from 'motion/react';
import { Siswa, Presensi, AttendanceStatus } from '../types';

interface KelolaPresensiProps {
  presensiList: Presensi[];
  siswaList: Siswa[];
  onSavePresensi: (list: Presensi[]) => void;
}

export default function KelolaPresensi({
  presensiList,
  siswaList,
  onSavePresensi,
}: KelolaPresensiProps) {
  // Ambil tanggal hari ini (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedTanggal, setSelectedTanggal] = useState(todayStr);
  const [selectedKelas, setSelectedKelas] = useState('XI-MIPA-1');
  const [searchTerm, setSearchTerm] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [localStatuses, setLocalStatuses] = useState<Record<string, AttendanceStatus>>({});

  // Mode: manual (pencatatan manual) vs qr (otomatis berbasis QR code)
  const [activeMode, setActiveMode] = useState<'manual' | 'qr'>('manual');

  // QR Session states
  const [qrDuration, setQrDuration] = useState(10); // menit
  const [qrActiveSession, setQrActiveSession] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('smasa_active_qr_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.expiresAt > Date.now()) {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  });
  const [timeLeft, setTimeLeft] = useState(0);

  // Sync countdown timer
  useEffect(() => {
    if (!qrActiveSession) return;
    const updateTimer = () => {
      const remaining = Math.max(0, Math.round((qrActiveSession.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        setQrActiveSession(null);
        localStorage.removeItem('smasa_active_qr_session');
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [qrActiveSession]);

  // Sync / poll local storage checkins to live update list in real-time
  useEffect(() => {
    if (!qrActiveSession) return;

    const syncCheckins = () => {
      try {
        const savedPresensi = localStorage.getItem('smasa_presensi');
        const list: Presensi[] = savedPresensi ? JSON.parse(savedPresensi) : [];
        
        // Find if there are any new QR-based presensi for this class and date
        const qrPresensi = list.filter(p => 
          p.tanggal === qrActiveSession.tanggal &&
          p.siswaKelas === qrActiveSession.kelas &&
          p.metode === 'QR Code'
        );

        if (qrPresensi.length > 0) {
          let hasChanges = false;
          const merged = [...presensiList];

          qrPresensi.forEach(qp => {
            const idx = merged.findIndex(p => p.siswaId === qp.siswaId && p.tanggal === qp.tanggal);
            if (idx === -1) {
              merged.push(qp);
              hasChanges = true;
            } else if (merged[idx].status !== qp.status || merged[idx].waktu !== qp.waktu || merged[idx].metode !== 'QR Code') {
              merged[idx] = {
                ...merged[idx],
                status: qp.status,
                waktu: qp.waktu,
                metode: 'QR Code'
              };
              hasChanges = true;
            }
          });

          if (hasChanges) {
            onSavePresensi(merged);
          }
        }
      } catch (e) {
        console.error("Error polling storage checkins:", e);
      }
    };

    const poll = setInterval(syncCheckins, 1500);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'smasa_presensi') {
        syncCheckins();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(poll);
      window.removeEventListener('storage', handleStorage);
    };
  }, [qrActiveSession, presensiList, onSavePresensi]);

  const handleStartQrSession = () => {
    const today = new Date().toISOString().split('T')[0];
    const durationMs = qrDuration * 60 * 1000;
    const sessionToken = `QR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newSession = {
      kelas: selectedKelas,
      tanggal: today,
      token: sessionToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + durationMs,
      durationMinutes: qrDuration,
    };

    localStorage.setItem('smasa_active_qr_session', JSON.stringify(newSession));
    setQrActiveSession(newSession);
    setTimeLeft(qrDuration * 60);
  };

  const handleStopQrSession = () => {
    localStorage.removeItem('smasa_active_qr_session');
    setQrActiveSession(null);
    setTimeLeft(0);
  };

  const handleExtendQrSession = () => {
    if (!qrActiveSession) return;
    const extendedSession = {
      ...qrActiveSession,
      expiresAt: qrActiveSession.expiresAt + 5 * 60 * 1000,
      durationMinutes: qrActiveSession.durationMinutes + 5
    };
    localStorage.setItem('smasa_active_qr_session', JSON.stringify(extendedSession));
    setQrActiveSession(extendedSession);
  };

  // Ambil daftar kelas unik
  const uniqueKelasList = Array.from(new Set(siswaList.map((s) => s.kelas)));

  // Ambil siswa untuk kelas yang dipilih
  const siswaInClass = siswaList.filter((s) => s.kelas === selectedKelas);

  // Sinkronisasi status lokal ketika tanggal, kelas, daftar siswa, atau daftar presensi berubah
  useEffect(() => {
    const initial: Record<string, AttendanceStatus> = {};
    siswaInClass.forEach((siswa) => {
      const existing = presensiList.find(
        (p) => p.siswaId === siswa.id && p.tanggal === selectedTanggal
      );
      initial[siswa.id] = existing ? existing.status : 'Hadir';
    });
    setLocalStatuses(initial);
  }, [selectedTanggal, selectedKelas, siswaList, presensiList]);

  // Cari data presensi yang sedang aktif (berdasarkan status lokal untuk pengeditan dinamis)
  const activePresensiMap = siswaInClass.map((siswa) => {
    return {
      siswaId: siswa.id,
      siswaNama: siswa.nama,
      siswaKelas: siswa.kelas,
      tanggal: selectedTanggal,
      status: localStatuses[siswa.id] || 'Hadir',
    };
  });

  // Handler update status satu siswa di state lokal
  const handleStatusChange = (siswaId: string, newStatus: AttendanceStatus) => {
    setLocalStatuses((prev) => ({
      ...prev,
      [siswaId]: newStatus,
    }));
  };

  // Handler "Hadir Semua" di state lokal
  const handleHadirSemua = () => {
    const updated = { ...localStatuses };
    siswaInClass.forEach((siswa) => {
      updated[siswa.id] = 'Hadir';
    });
    setLocalStatuses(updated);
  };

  // Handler "Simpan" permanen ke parent state
  const handleSavePresensi = () => {
    let updatedList = [...presensiList];

    siswaInClass.forEach((siswa) => {
      const currentStatus = localStatuses[siswa.id] || 'Hadir';
      const existsIdx = updatedList.findIndex(
        (p) => p.siswaId === siswa.id && p.tanggal === selectedTanggal
      );

      if (existsIdx > -1) {
        updatedList[existsIdx] = {
          ...updatedList[existsIdx],
          status: currentStatus,
        };
      } else {
        updatedList.push({
          id: `P${Date.now()}_${siswa.id}`,
          siswaId: siswa.id,
          siswaNama: siswa.nama,
          siswaKelas: siswa.kelas,
          tanggal: selectedTanggal,
          status: currentStatus,
        });
      }
    });

    onSavePresensi(updatedList);
    triggerSuccessToast();
  };

  const triggerSuccessToast = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Hitung persentase kehadiran untuk ringkasan di atas tabel
  const statsKehadiran = (() => {
    const total = activePresensiMap.length;
    if (total === 0) return { hadir: 0, izin: 0, sakit: 0, alfa: 0, rate: 100 };

    const hadir = activePresensiMap.filter((p) => p.status === 'Hadir').length;
    const izin = activePresensiMap.filter((p) => p.status === 'Izin').length;
    const sakit = activePresensiMap.filter((p) => p.status === 'Sakit').length;
    const alfa = activePresensiMap.filter((p) => p.status === 'Alfa').length;

    return {
      hadir,
      izin,
      sakit,
      alfa,
      rate: Math.round((hadir / total) * 100),
    };
  })();

  // Filter siswa berdasarkan pencarian input
  const filteredPresensiMap = activePresensiMap.filter((p) =>
    p.siswaNama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <CalendarCheck className="text-amber-600 w-6 h-6" /> Kelola Presensi Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Pantau dan kelola kehadiran harian siswa di kelas Informatika</p>
        </div>
        
        {activeMode === 'manual' && (
          <div className="flex gap-2.5">
            <button
              onClick={handleHadirSemua}
              disabled={siswaInClass.length === 0}
              className={`neu-flat-sm px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95 ${
                siswaInClass.length === 0
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100/75'
              }`}
              id="btn-hadir-semua"
            >
              <UserCheck size={14} className="text-blue-700" />
              <span>Hadirkan Semua</span>
            </button>
            <button
              onClick={handleSavePresensi}
              disabled={siswaInClass.length === 0}
              className={`neu-flat-sm px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95 transition-all ${
                siswaInClass.length === 0
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200'
              }`}
              id="btn-simpan-presensi"
            >
              <CheckCircle2 size={14} className="text-white" />
              <span>Simpan Presensi</span>
            </button>
          </div>
        )}
      </div>

      {/* Mode Switcher */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-fit shadow-inner">
        <button
          onClick={() => setActiveMode('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'manual' ? 'bg-white text-blue-600 shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck size={14} />
          <span>Pencatatan Manual (Tabel)</span>
        </button>
        <button
          onClick={() => setActiveMode('qr')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'qr' ? 'bg-white text-blue-600 shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <QrCode size={14} />
          <span>Presensi QR-Code (Live Monitor)</span>
        </button>
      </div>

      {activeMode === 'qr' ? (
        <div className="space-y-6">
          {!qrActiveSession ? (
            <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm max-w-xl mx-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
                <QrCode size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Mulai Sesi Presensi QR Code</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Siswa dapat melakukan scan QR Code dari portal mereka untuk mengisi kehadiran secara otomatis & real-time.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left p-4 bg-slate-50 rounded-2xl border border-slate-150">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Kelas</label>
                  <select
                    value={selectedKelas}
                    onChange={(e) => setSelectedKelas(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                  >
                    {uniqueKelasList.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Masa Berlaku Sesi</label>
                  <select
                    value={qrDuration}
                    onChange={(e) => setQrDuration(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                  >
                    <option value={2}>2 Menit (Test)</option>
                    <option value={5}>5 Menit</option>
                    <option value={10}>10 Menit</option>
                    <option value={15}>15 Menit</option>
                    <option value={30}>30 Menit</option>
                    <option value={60}>1 Jam</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleStartQrSession}
                className="w-full py-3 rounded-2xl bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-blue-700 cursor-pointer shadow-md shadow-blue-100 transition-all active:scale-[0.98]"
              >
                <Play size={14} />
                <span>Aktifkan Sesi Presensi QR ({selectedKelas})</span>
              </button>
            </div>
          ) : (
            /* Active Session View */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* QR Generation and Display Left Column */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-6 relative overflow-hidden h-full justify-between">
                  <div className="absolute -top-12 -left-12 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl" />
                  
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider inline-block">
                      Sesi QR Aktif
                    </span>
                    <h3 className="text-base font-black text-slate-800 tracking-tight mt-1">Kelas: {qrActiveSession.kelas}</h3>
                    <p className="text-[10px] text-slate-400">Silakan proyeksikan layar ini ke depan kelas agar siswa dapat melakukan scan.</p>
                  </div>

                  {/* QR Image Frame with scanner beam animation */}
                  <div className="relative p-4 rounded-3xl bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center w-56 h-56 group">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=0f172a&data=${encodeURIComponent(JSON.stringify(qrActiveSession))}`}
                      alt="Presensi QR Code"
                      className="w-48 h-48 rounded-2xl object-contain mix-blend-multiply"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-blue-600 rounded-tl-lg" />
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-blue-600 rounded-tr-lg" />
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-blue-600 rounded-bl-lg" />
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-blue-600 rounded-br-lg" />
                    <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent top-4 animate-[bounce_3s_infinite] shadow-[0_0_8px_#2563eb]" />
                  </div>

                  <div className="w-full space-y-4">
                    <div className="py-2.5 px-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kode Token Alternatif</span>
                      <span className="text-xl font-black text-slate-800 tracking-widest font-mono mt-0.5 select-all">{qrActiveSession.token}</span>
                    </div>

                    <div className="space-y-1.5 text-center">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                        <span>Sisa Waktu Sesi</span>
                        <span className={`font-mono text-xs ${timeLeft < 60 ? 'text-rose-600 animate-pulse font-extrabold' : 'text-slate-600'}`}>
                          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${timeLeft < 60 ? 'bg-rose-500' : 'bg-blue-600'}`}
                          style={{ width: `${(timeLeft / (qrActiveSession.durationMinutes * 60)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="w-full flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={handleExtendQrSession}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/75 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Timer size={13} />
                      <span>Tambah 5 Menit</span>
                    </button>
                    <button
                      onClick={handleStopQrSession}
                      className="flex-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Square size={13} />
                      <span>Tutup Sesi</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Scan List Right Column */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col h-full space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Tv size={13} className="text-blue-500" /> Live Feed Presensi Masuk
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Siswa yang berhasil memindai QR code hari ini.</p>
                    </div>
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-black font-mono">
                      {presensiList.filter(p => p.tanggal === qrActiveSession.tanggal && p.siswaKelas === qrActiveSession.kelas && p.status === 'Hadir').length} / {siswaInClass.length} Siswa
                    </div>
                  </div>

                  {/* Scanned Student List */}
                  <div className="flex-1 overflow-y-auto max-h-[360px] pr-1 divide-y divide-slate-100 scrollbar-thin">
                    {(() => {
                      const checkins = presensiList
                        .filter(p => p.tanggal === qrActiveSession.tanggal && p.siswaKelas === qrActiveSession.kelas && p.status === 'Hadir')
                        .sort((a, b) => (b.waktu || '').localeCompare(a.waktu || ''));

                      if (checkins.length === 0) {
                        return (
                          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center animate-bounce">
                              <RefreshCw size={14} className="animate-spin" style={{ animationDuration: '4s' }} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-slate-500">Menunggu scan dari siswa...</p>
                              <p className="text-[10px] text-slate-400 max-w-xs">Pastikan siswa berada di dasbor mereka, masuk ke tab "Presensi QR", lalu scan kode di sebelah kiri.</p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2.5 pt-2">
                          {checkins.map((p, index) => {
                            const detailSiswa = siswaList.find(s => s.id === p.siswaId);
                            return (
                              <motion.div
                                key={p.id}
                                initial={index === 0 ? { opacity: 0, x: -10 } : false}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-3 bg-emerald-50/40 border border-emerald-100/50 rounded-2xl flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-2.5">
                                  {detailSiswa?.foto ? (
                                    <img
                                      src={detailSiswa.foto}
                                      alt="Foto Siswa"
                                      referrerPolicy="no-referrer"
                                      className="w-8 h-8 rounded-xl object-cover shadow-sm border border-white"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                                      {p.siswaNama.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <h5 className="text-xs font-bold text-slate-800 leading-tight">{p.siswaNama}</h5>
                                    <span className="text-[9px] text-slate-400 font-medium">NIS: {detailSiswa?.nis || '-'}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-[10px] font-extrabold text-emerald-700 flex items-center justify-end gap-1 font-mono">
                                    <Check size={12} className="stroke-[3px]" /> {p.waktu || '--:--'}
                                  </div>
                                  <span className="text-[8px] text-emerald-600/80 uppercase font-extrabold tracking-wide">Tervalidasi QR</span>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] text-slate-500 flex justify-between items-center gap-4">
                    <span>Siswa yang tidak scan akan dihitung Alpa saat sesi berakhir jika belum dipresensi manual.</span>
                    <button
                      onClick={() => {
                        const confirmed = window.confirm("Apakah Anda yakin ingin menutup sesi QR dan menandai semua siswa yang tidak memindai sebagai Alfa?");
                        if (confirmed) {
                          let updatedList = [...presensiList];
                          siswaInClass.forEach((siswa) => {
                            const exists = updatedList.find(
                              (p) => p.siswaId === siswa.id && p.tanggal === qrActiveSession.tanggal
                            );
                            if (!exists) {
                              updatedList.push({
                                id: `P${Date.now()}_${siswa.id}`,
                                siswaId: siswa.id,
                                siswaNama: siswa.nama,
                                siswaKelas: siswa.kelas,
                                tanggal: qrActiveSession.tanggal,
                                status: 'Alfa',
                                metode: 'Manual'
                              });
                            }
                          });
                          onSavePresensi(updatedList);
                          handleStopQrSession();
                          alert("Sesi presensi QR ditutup. Siswa yang tidak memindai telah ditandai sebagai Alfa.");
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white font-extrabold text-[9px] cursor-pointer hover:bg-rose-700 transition-all active:scale-95 shrink-0"
                    >
                      Akhiri & Tandai Lainnya Alfa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Standard Manual View */
        <div className="space-y-6">
          {/* Bar Parameter Filter (Tanggal & Kelas) */}
          <div className="p-5 rounded-3xl neu-flat grid grid-cols-1 md:grid-cols-3 gap-4 items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} /> Tanggal Presensi
              </label>
              <input
                type="date"
                value={selectedTanggal}
                onChange={(e) => setSelectedTanggal(e.target.value)}
                className="text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                id="presensi-date-picker"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Pilih Kelas
              </label>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                id="presensi-class-picker"
              >
                {uniqueKelasList.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Cari Nama Siswa
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                />
              </div>
            </div>
          </div>

          {/* Ringkasan Kehadiran */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-white/40 border border-slate-100 flex flex-col items-center text-center justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Persentase Masuk</span>
              <h4 className="text-xl font-black text-blue-600 mt-1 font-mono">{statsKehadiran.rate}%</h4>
            </div>
            <div className="p-4 rounded-2xl bg-white/40 border border-slate-100 flex flex-col items-center text-center justify-center">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Hadir</span>
              <h4 className="text-xl font-black text-emerald-600 mt-1 font-mono">{statsKehadiran.hadir}</h4>
            </div>
            <div className="p-4 rounded-2xl bg-white/40 border border-slate-100 flex flex-col items-center text-center justify-center">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Izin</span>
              <h4 className="text-xl font-black text-blue-600 mt-1 font-mono">{statsKehadiran.izin}</h4>
            </div>
            <div className="p-4 rounded-2xl bg-white/40 border border-slate-100 flex flex-col items-center text-center justify-center">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Sakit</span>
              <h4 className="text-xl font-black text-amber-600 mt-1 font-mono">{statsKehadiran.sakit}</h4>
            </div>
            <div className="p-4 rounded-2xl bg-white/40 border border-slate-100 flex flex-col items-center text-center justify-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Alfa (Tanpa Keterangan)</span>
              <h4 className="text-xl font-black text-rose-600 mt-1 font-mono">{statsKehadiran.alfa}</h4>
            </div>
          </div>

          {/* Tabel Pengisian Absensi */}
          <div className="neu-flat rounded-3xl overflow-hidden">
            <div className="p-4 bg-slate-100/50 border-b border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Daftar Kehadiran Siswa ({siswaInClass.length} total)</span>
              <div className="flex items-center gap-2">
                {saveSuccess ? (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
                    <CheckCircle2 size={13} /> Perubahan Berhasil Disimpan!
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 italic">
                    <RefreshCw size={11} className="text-slate-400" /> Selesaikan absensi lalu klik "Simpan Presensi" di atas
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Nama Siswa</th>
                    <th className="py-3.5 px-6">Kelas</th>
                    <th className="py-3.5 px-6 text-center">Pilih Status Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {siswaInClass.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-slate-400">
                        Belum ada data siswa terdaftar untuk kelas {selectedKelas}. Silakan daftarkan siswa terlebih dahulu di menu Kelola Siswa.
                      </td>
                    </tr>
                  ) : filteredPresensiMap.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        Tidak ditemukan siswa yang cocok dengan pencarian nama.
                      </td>
                    </tr>
                  ) : (
                    filteredPresensiMap.map((p) => (
                      <tr key={p.siswaId} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-800">{p.siswaNama}</td>
                        <td className="py-4 px-6 text-slate-500">{p.siswaKelas}</td>
                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex rounded-xl p-1 bg-slate-100 shadow-[inset_1px_1px_3px_#cbd5e1,inset_-1px_-1px_3px_#ffffff]">
                            {[
                              { id: 'Hadir', col: 'peer-checked:bg-emerald-600 peer-checked:text-white', txt: 'Hadir' },
                              { id: 'Izin', col: 'peer-checked:bg-blue-600 peer-checked:text-white', txt: 'Izin' },
                              { id: 'Sakit', col: 'peer-checked:bg-amber-600 peer-checked:text-white', txt: 'Sakit' },
                              { id: 'Alfa', col: 'peer-checked:bg-rose-600 peer-checked:text-white', txt: 'Alfa' },
                            ].map((btn) => (
                              <label
                                key={btn.id}
                                className="relative flex items-center justify-center cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={`attendance-${p.siswaId}`}
                                  value={btn.id}
                                  checked={p.status === btn.id}
                                  onChange={() => handleStatusChange(p.siswaId, btn.id as AttendanceStatus)}
                                  className="sr-only peer"
                                />
                                <span className={`px-4 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 transition-all ${btn.col}`}>
                                  {btn.txt}
                                </span>
                              </label>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Dev Alert Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-[11px] text-amber-800 flex gap-2">
        <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
        <p className="leading-relaxed">
          <strong>@PENGHUBUNG_GOOGLE_APPS_SCRIPT:</strong> Fungsi presensi ini diprogram untuk merujuk ke database `localStorage`. Di Google Sheets, idealnya absensi disimpan dalam lembar terpisah berdasarkan sheet nama bulan atau sheet `Presensi` terpusat dengan ID baris kombinasi `SiswaID_Tanggal`.
        </p>
      </div>
    </div>
  );
}
