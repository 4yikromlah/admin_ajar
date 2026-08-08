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
  UserX,
  Eye,
  X,
  Maximize2,
  Terminal,
  Activity,
  FileJson,
  Copy,
  Database,
  Wifi,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Siswa, Presensi, AttendanceStatus } from '../types';
import { loadPresensi } from '../data';

function playAudioBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

export interface SyncLogEntry {
  id: string;
  time: string;
  endpoint: string;
  status: string;
  recordsReceivedCount: number;
  recordsReceivedSample: string;
  mergedNewCount: number;
  mergedUpdatedCount: number;
  presensiListBefore: number;
  presensiListAfter: number;
  isManualTrigger?: boolean;
  errorDetails?: string;
}

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
  const [scanFilter, setScanFilter] = useState<'all' | 'scanned' | 'unscanned'>('all');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [localStatuses, setLocalStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [checkinNotif, setCheckinNotif] = useState<string | null>(null);

  // Mode: manual (pencatatan manual) vs qr (otomatis berbasis QR code)
  const [activeMode, setActiveMode] = useState<'manual' | 'qr'>('manual');

  // Custom confirmation state for stopping the QR session
  const [showEndQrConfirm, setShowEndQrConfirm] = useState(false);
  const [isQrZoomed, setIsQrZoomed] = useState(false);

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

  // Diagnostic Inspector states
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [diagnosticTab, setDiagnosticTab] = useState<'network' | 'json' | 'session'>('network');
  const [networkLogs, setNetworkLogs] = useState<SyncLogEntry[]>([]);
  const [jsonSearchQuery, setJsonSearchQuery] = useState('');
  const [copiedJsonToast, setCopiedJsonToast] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [jsonDataSource, setJsonDataSource] = useState<'presensiList' | 'localStorage' | 'serverApi'>('presensiList');
  const [serverApiData, setServerApiData] = useState<any>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'changed' | 'error'>('all');

  const performSyncAndLog = async (isManual = false) => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let serverRecords: Presensi[] = [];
    let fetchStatusStr = '200 OK';
    let errorMsg = '';

    try {
      if (isManual) setIsSyncingNow(true);

      const [resList, resPresensi] = await Promise.all([
        fetch('/api/qr-presensi/list').catch(err => ({ ok: false, statusText: err.message } as any)),
        fetch('/api/presensi').catch(err => ({ ok: false, statusText: err.message } as any))
      ]);

      if (resList && resList.ok) {
        const data = await resList.json();
        if (data && Array.isArray(data.records)) {
          serverRecords.push(...data.records);
        }
      }
      if (resPresensi && resPresensi.ok) {
        const data = await resPresensi.json();
        if (data && Array.isArray(data.records)) {
          data.records.forEach((r: Presensi) => {
            if (r && r.siswaId && r.tanggal) {
              const dup = serverRecords.some(sr => sr.siswaId === r.siswaId && sr.tanggal === r.tanggal && sr.waktu === r.waktu && sr.status === r.status);
              if (!dup) serverRecords.push(r);
            }
          });
        }
      }

      if (!resList?.ok && !resPresensi?.ok) {
        fetchStatusStr = `HTTP ${resList?.status || resPresensi?.status || 'ERR'}`;
        errorMsg = 'Gagal terhubung ke endpoint /api/qr-presensi/list atau /api/presensi';
      }

      setServerApiData(serverRecords);

      const savedPresensi = localStorage.getItem('smasa_presensi');
      const scopedPresensi = loadPresensi();
      const list: Presensi[] = savedPresensi ? JSON.parse(savedPresensi) : [];
      const allSources = [...presensiList, ...scopedPresensi, ...list, ...serverRecords];

      const validCheckins = allSources.filter(p => p && p.siswaId && p.tanggal);

      let mergedNewCount = 0;
      let mergedUpdatedCount = 0;
      let newlyScannedName = '';

      if (validCheckins.length > 0) {
        const merged = [...presensiList];

        const normDate = (d: string) => String(d || '').trim().split('T')[0];

        const isSameStudentHelper = (p1: any, p2: any) => {
          if (!p1 || !p2) return false;
          if (p1.siswaId && p2.siswaId && p1.siswaId === p2.siswaId) return true;
          if (p1.siswaId && p2.nis && String(p1.siswaId) === String(p2.nis)) return true;
          if (p2.siswaId && p1.nis && String(p2.siswaId) === String(p1.nis)) return true;
          if (p1.siswaId && p2.siswaId && (p1.siswaId.startsWith(p2.siswaId) || p2.siswaId.startsWith(p1.siswaId))) return true;
          if (p1.siswaNama && p2.siswaNama && p1.siswaNama.trim().toLowerCase() === p2.siswaNama.trim().toLowerCase()) return true;
          if (p1.siswaNama && p2.nama && p1.siswaNama.trim().toLowerCase() === p2.nama.trim().toLowerCase()) return true;
          return false;
        };

        const isFreshQrScan = (qp: any) => {
          if (!qp || qp.metode !== 'QR Code' || qp.status !== 'Hadir') return false;
          let ts = (qp as any).createdAt || (qp as any).timestamp || 0;
          if (!ts && qp.id && typeof qp.id === 'string' && qp.id.startsWith('P')) {
            const parts = qp.id.slice(1).split('_');
            const parsed = parseInt(parts[0], 10);
            if (!isNaN(parsed) && parsed > 1600000000000) {
              ts = parsed;
            }
          }
          if (!ts) return false;
          const ageMs = Date.now() - Number(ts);
          return ageMs >= 0 && ageMs < 15000;
        };

        validCheckins.forEach(qp => {
          const qpDate = normDate(qp.tanggal);
          const idx = merged.findIndex(p => {
            const pDate = normDate(p.tanggal);
            return isSameStudentHelper(qp, p) && pDate === qpDate;
          });

          const studentInfo = siswaList.find(s => isSameStudentHelper(qp, s));

          if (idx === -1) {
            const newRec: Presensi = {
              id: qp.id || `P${Date.now()}_${qp.siswaId}`,
              siswaId: studentInfo?.id || qp.siswaId,
              siswaNama: studentInfo?.nama || qp.siswaNama,
              siswaKelas: studentInfo?.kelas || qp.siswaKelas || (qp as any).kelas || '',
              tanggal: qpDate,
              status: qp.status || 'Hadir',
              waktu: qp.waktu || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              metode: qp.metode || 'QR Code',
              createdAt: (qp as any).createdAt || (qp as any).timestamp || Date.now(),
            };
            merged.push(newRec);
            mergedNewCount++;
            if (isFreshQrScan(qp) || isFreshQrScan(newRec)) {
              newlyScannedName = `${newRec.siswaNama} (${newRec.siswaKelas || ''})`;
            }
          } else {
            const current = merged[idx];
            const updatedRec: Presensi = {
              ...current,
              ...qp,
              siswaId: current.siswaId || studentInfo?.id || qp.siswaId,
              siswaNama: current.siswaNama || studentInfo?.nama || qp.siswaNama,
              siswaKelas: current.siswaKelas || studentInfo?.kelas || qp.siswaKelas || (qp as any).kelas || '',
              tanggal: qpDate,
              status: 'Hadir',
              waktu: qp.waktu || current.waktu || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              metode: qp.metode || current.metode || 'QR Code',
              createdAt: (qp as any).createdAt || current.createdAt || Date.now(),
            };

            if (
              current.status !== updatedRec.status ||
              current.metode !== updatedRec.metode ||
              current.waktu !== updatedRec.waktu ||
              !current.siswaKelas
            ) {
              merged[idx] = updatedRec;
              mergedUpdatedCount++;
              if (isFreshQrScan(qp)) {
                newlyScannedName = `${updatedRec.siswaNama} (${updatedRec.siswaKelas || ''})`;
              }
            }
          }
        });

        if (mergedNewCount > 0 || mergedUpdatedCount > 0) {
          onSavePresensi(merged);
          if (newlyScannedName) {
            playAudioBeep();
            setCheckinNotif(`Siswa ${newlyScannedName} berhasil absen via QR Code!`);
            setTimeout(() => setCheckinNotif(null), 4000);
          }
        }

        setNetworkLogs(prev => [
          {
            id: `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            time: timeStr,
            endpoint: '/api/presensi & /api/qr-presensi/list',
            status: fetchStatusStr,
            recordsReceivedCount: serverRecords.length,
            recordsReceivedSample: serverRecords.length > 0 ? JSON.stringify(serverRecords.slice(0, 2)) : '[]',
            mergedNewCount,
            mergedUpdatedCount,
            presensiListBefore: presensiList.length,
            presensiListAfter: merged.length,
            isManualTrigger: isManual,
            errorDetails: errorMsg || undefined
          },
          ...prev.slice(0, 79)
        ]);
      } else {
        setNetworkLogs(prev => [
          {
            id: `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            time: timeStr,
            endpoint: '/api/presensi & /api/qr-presensi/list',
            status: fetchStatusStr,
            recordsReceivedCount: serverRecords.length,
            recordsReceivedSample: '[]',
            mergedNewCount: 0,
            mergedUpdatedCount: 0,
            presensiListBefore: presensiList.length,
            presensiListAfter: presensiList.length,
            isManualTrigger: isManual,
            errorDetails: errorMsg || undefined
          },
          ...prev.slice(0, 79)
        ]);
      }
    } catch (e: any) {
      console.error("Error in performSyncAndLog:", e);
      setNetworkLogs(prev => [
        {
          id: `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          time: timeStr,
          endpoint: '/api/presensi & /api/qr-presensi/list',
          status: 'FETCH_ERROR',
          recordsReceivedCount: 0,
          recordsReceivedSample: '[]',
          mergedNewCount: 0,
          mergedUpdatedCount: 0,
          presensiListBefore: presensiList.length,
          presensiListAfter: presensiList.length,
          isManualTrigger: isManual,
          errorDetails: e?.message || String(e)
        },
        ...prev.slice(0, 79)
      ]);
    } finally {
      if (isManual) setIsSyncingNow(false);
    }
  };

  useEffect(() => {
    performSyncAndLog(false);
    const poll = setInterval(() => {
      performSyncAndLog(false);
    }, 2000);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'smasa_presensi' || (e.key && e.key.includes('presensi'))) {
        performSyncAndLog(false);
      }
    };

    const handleCustomPresensiEvent = () => {
      performSyncAndLog(false);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('smasa_presensi_updated', handleCustomPresensiEvent);
    return () => {
      clearInterval(poll);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('smasa_presensi_updated', handleCustomPresensiEvent);
    };
  }, [qrActiveSession, selectedTanggal, selectedKelas]);

  const handleStartQrSession = async () => {
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

    try {
      window.dispatchEvent(new CustomEvent('smasa_qr_session_updated', { detail: newSession }));
    } catch (e) {}

    try {
      await fetch('/api/qr-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: newSession }),
      });
    } catch (e) {}
  };

  const handleStopQrSession = async () => {
    localStorage.removeItem('smasa_active_qr_session');
    setQrActiveSession(null);
    setTimeLeft(0);

    try {
      window.dispatchEvent(new CustomEvent('smasa_qr_session_updated', { detail: null }));
    } catch (e) {}

    try {
      await fetch(`/api/qr-session?kelas=${encodeURIComponent(selectedKelas)}`, {
        method: 'DELETE',
      });
    } catch (e) {}
  };

  const handleExtendQrSession = async () => {
    if (!qrActiveSession) return;
    const extendedSession = {
      ...qrActiveSession,
      expiresAt: qrActiveSession.expiresAt + 5 * 60 * 1000,
      durationMinutes: qrActiveSession.durationMinutes + 5
    };
    localStorage.setItem('smasa_active_qr_session', JSON.stringify(extendedSession));
    setQrActiveSession(extendedSession);

    try {
      window.dispatchEvent(new CustomEvent('smasa_qr_session_updated', { detail: extendedSession }));
    } catch (e) {}

    try {
      await fetch('/api/qr-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: extendedSession }),
      });
    } catch (e) {}
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
        const existingRec = updatedList[existsIdx];
        updatedList[existsIdx] = {
          ...existingRec,
          status: currentStatus,
          metode: existingRec.metode || 'Manual',
          waktu: existingRec.waktu || (currentStatus === 'Hadir' ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : undefined),
        };
      } else {
        updatedList.push({
          id: `P${Date.now()}_${siswa.id}`,
          siswaId: siswa.id,
          siswaNama: siswa.nama,
          siswaKelas: siswa.kelas,
          tanggal: selectedTanggal,
          status: currentStatus,
          waktu: currentStatus === 'Hadir' ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : undefined,
          metode: 'Manual',
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
    const total = siswaInClass.length;
    if (total === 0) return { hadir: 0, izin: 0, sakit: 0, alfa: 0, rate: 0 };

    const records = siswaInClass.map(s => presensiList.find(p => p.siswaId === s.id && p.tanggal === selectedTanggal));
    const hadir = records.filter((p) => p && p.status === 'Hadir').length;
    const izin = records.filter((p) => p && p.status === 'Izin').length;
    const sakit = records.filter((p) => p && p.status === 'Sakit').length;
    const alfa = records.filter((p) => p && p.status === 'Alfa').length;

    return {
      hadir,
      izin,
      sakit,
      alfa,
      rate: Math.round((hadir / total) * 100),
    };
  })();

  // Filter siswa berdasarkan pencarian input & status scan QR
  const filteredPresensiMap = activePresensiMap.filter((p) => {
    const matchesSearch = p.siswaNama.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    const existingRecord = presensiList.find(
      (pr) => pr.siswaId === p.siswaId && pr.tanggal === selectedTanggal
    );

    if (scanFilter === 'scanned') {
      return !!existingRecord && (existingRecord.status === 'Hadir' || existingRecord.metode === 'QR Code');
    } else if (scanFilter === 'unscanned') {
      return !existingRecord || existingRecord.status !== 'Hadir';
    }

    return true;
  });

  return (
    <div className="space-y-6 relative">
      {/* Real-time Toast Notification when Student Scans QR */}
      <AnimatePresence>
        {checkinNotif && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-emerald-500/40 flex items-center gap-3.5 max-w-md"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
              <CheckCircle2 size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Notifikasi Presensi QR</span>
              <p className="text-xs font-bold text-slate-100 mt-0.5 leading-snug">{checkinNotif}</p>
            </div>
            <button
              onClick={() => setCheckinNotif(null)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/75'
              }`}
              id="btn-simpan-presensi"
            >
              <CheckCircle2 size={14} className="text-emerald-700" />
              <span>Simpan Presensi</span>
            </button>
          </div>
        )}
      </div>

      {/* Mode Switcher & Diagnostic Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <button
          type="button"
          onClick={() => setShowDiagnosticsModal(true)}
          className="px-3.5 py-2 rounded-xl bg-slate-900 text-slate-100 hover:bg-slate-800 font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-sm border border-slate-700/60"
          id="btn-open-diagnostik"
          title="Buka Inspector Log Sync & Data Raw JSON Presensi"
        >
          <Terminal size={14} className="text-emerald-400 animate-pulse" />
          <span>Diagnostik &amp; Log Sync</span>
          {networkLogs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
              {networkLogs.length}
            </span>
          )}
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
                      className="w-48 h-48 rounded-2xl object-contain mix-blend-multiply cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setIsQrZoomed(true)}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-blue-600 rounded-tl-lg pointer-events-none" />
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-blue-600 rounded-tr-lg pointer-events-none" />
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-blue-600 rounded-bl-lg pointer-events-none" />
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-blue-600 rounded-br-lg pointer-events-none" />
                    <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent top-4 animate-[bounce_3s_infinite] shadow-[0_0_8px_#2563eb] pointer-events-none" />

                    {/* Tombol Icon Mata untuk Zoom / Perbesar QR Code */}
                    <button
                      type="button"
                      onClick={() => setIsQrZoomed(true)}
                      title="Zoom / Perbesar QR Code"
                      className="absolute bottom-3 right-3 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all hover:scale-110 flex items-center justify-center gap-1.5 cursor-pointer z-10 group/btn"
                    >
                      <Eye size={16} />
                      <span className="text-[10px] font-bold hidden sm:inline">Zoom</span>
                    </button>
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
                      {presensiList.filter(p => {
                        const norm = (d: string) => String(d || '').trim().split('T')[0];
                        const pDate = norm(p.tanggal);
                        const qDate = norm(qrActiveSession.tanggal);
                        const todayDate = new Date().toLocaleDateString('sv-SE');
                        const sameDate = pDate === qDate || pDate === todayDate;

                        const pK = String(p.siswaKelas || (p as any).kelas || '').trim().toLowerCase().replace(/[\s\-_]+/g, '');
                        const sessK = String(qrActiveSession.kelas || '').trim().toLowerCase().replace(/[\s\-_]+/g, '');

                        const isMatchingClass = (
                          (pK && sessK && (pK === sessK || pK.includes(sessK) || sessK.includes(pK))) ||
                          siswaList.some(s => {
                            const sClass = String(s.kelas || '').trim().toLowerCase().replace(/[\s\-_]+/g, '');
                            const isSameS = s.id === p.siswaId || s.nis === p.siswaId || (s.nama && p.siswaNama && s.nama.trim().toLowerCase() === p.siswaNama.trim().toLowerCase());
                            return isSameS && (sClass === sessK || sClass.includes(sessK) || sessK.includes(sClass));
                          })
                        );

                        return sameDate && isMatchingClass && p.status === 'Hadir';
                      }).length} / {siswaInClass.length} Siswa
                    </div>
                  </div>

                  {/* Scanned Student List */}
                  <div className="flex-1 overflow-y-auto max-h-[360px] pr-1 divide-y divide-slate-100 scrollbar-thin">
                    {(() => {
                      const checkins = presensiList
                        .filter(p => {
                          const norm = (d: string) => String(d || '').trim().split('T')[0];
                          const pDate = norm(p.tanggal);
                          const qDate = norm(qrActiveSession.tanggal);
                          const todayDate = new Date().toLocaleDateString('sv-SE');
                          const sameDate = pDate === qDate || pDate === todayDate;

                          const pK = String(p.siswaKelas || (p as any).kelas || '').trim().toLowerCase().replace(/[\s\-_]+/g, '');
                          const sessK = String(qrActiveSession.kelas || '').trim().toLowerCase().replace(/[\s\-_]+/g, '');

                          const isMatchingClass = (
                            (pK && sessK && (pK === sessK || pK.includes(sessK) || sessK.includes(pK))) ||
                            siswaList.some(s => {
                              const sClass = String(s.kelas || '').trim().toLowerCase().replace(/[\s\-_]+/g, '');
                              const isSameS = s.id === p.siswaId || s.nis === p.siswaId || (s.nama && p.siswaNama && s.nama.trim().toLowerCase() === p.siswaNama.trim().toLowerCase());
                              return isSameS && (sClass === sessK || sClass.includes(sessK) || sessK.includes(sClass));
                            })
                          );

                          return sameDate && isMatchingClass && p.status === 'Hadir';
                        })
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
                      onClick={() => setShowEndQrConfirm(true)}
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

          {/* Opsi Filter Tampilan Daftar Siswa */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100/70 border border-slate-200/80 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <QrCode size={13} className="text-blue-600" /> Filter Status Scan QR / Presensi:
            </span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-xs border border-slate-200">
              <button
                type="button"
                onClick={() => setScanFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scanFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua Siswa ({siswaInClass.length})
              </button>
              <button
                type="button"
                onClick={() => setScanFilter('scanned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  scanFilter === 'scanned'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 size={13} />
                Sudah Scan / Hadir (
                {
                  siswaInClass.filter((s) =>
                    presensiList.some((p) => p.siswaId === s.id && p.tanggal === selectedTanggal)
                  ).length
                }
                )
              </button>
              <button
                type="button"
                onClick={() => setScanFilter('unscanned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  scanFilter === 'unscanned'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 hover:text-rose-800 hover:bg-rose-50'
                }`}
              >
                <AlertCircle size={13} />
                Belum Scan / Absen (
                {
                  siswaInClass.filter(
                    (s) => !presensiList.some((p) => p.siswaId === s.id && p.tanggal === selectedTanggal)
                  ).length
                }
                )
              </button>
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
                    filteredPresensiMap.map((p) => {
                      const recorded = presensiList.find(
                        (pr) => pr.siswaId === p.siswaId && pr.tanggal === selectedTanggal
                      );
                      return (
                        <tr key={p.siswaId} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-800">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{p.siswaNama}</span>
                              {recorded?.metode === 'QR Code' ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/60 font-black text-[10px] inline-flex items-center gap-1 shadow-2xs">
                                  <QrCode size={11} className="text-emerald-600" /> Presensi QR {recorded.waktu ? `(${recorded.waktu})` : ''}
                                </span>
                              ) : recorded ? (
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 font-bold text-[9px] inline-flex items-center gap-1">
                                  {recorded.waktu ? `Tercatat ${recorded.waktu}` : 'Tercatat'}
                                </span>
                              ) : null}
                            </div>
                          </td>
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
                      );
                    })
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

      {/* Custom End QR Session Confirmation Modal */}
      <AnimatePresence>
        {showEndQrConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEndQrConfirm(false)}
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm bg-neu-bg p-6 rounded-3xl shadow-2xl border border-white/50 z-10 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                  <AlertCircle size={20} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Tutup Sesi QR?</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menutup sesi QR dan menandai semua siswa yang tidak memindai sebagai <strong>Alfa</strong>?
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowEndQrConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer animate-none"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
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
                    setShowEndQrConfirm(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer shadow-md shadow-rose-100"
                >
                  Akhiri Sesi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* QR Code Zoom Modal */}
      <AnimatePresence>
        {isQrZoomed && qrActiveSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQrZoomed(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              className="relative w-full max-w-md sm:max-w-lg bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100 z-10 flex flex-col items-center text-center space-y-6"
            >
              <button
                type="button"
                onClick={() => setIsQrZoomed(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                  <Maximize2 size={13} /> Zoom QR Code Proyektor
                </span>
                <h3 className="text-xl font-black text-slate-800 tracking-tight mt-1">Kelas: {qrActiveSession.kelas}</h3>
                <p className="text-xs text-slate-500">Tampilkan ke proyektor agar seluruh siswa dapat memindai dari jarak jauh.</p>
              </div>

              {/* High-res Large QR Image */}
              <div className="relative p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-inner flex items-center justify-center w-72 h-72 sm:w-80 sm:h-80">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&color=0f172a&data=${encodeURIComponent(JSON.stringify(qrActiveSession))}`}
                  alt="Presensi QR Code Large"
                  className="w-64 h-64 sm:w-72 sm:h-72 rounded-2xl object-contain mix-blend-multiply"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-blue-600 rounded-tl-xl pointer-events-none" />
                <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-blue-600 rounded-tr-xl pointer-events-none" />
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-blue-600 rounded-bl-xl pointer-events-none" />
                <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-blue-600 rounded-br-xl pointer-events-none" />
                <div className="absolute left-6 right-6 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent top-6 animate-[bounce_3s_infinite] shadow-[0_0_12px_#2563eb] pointer-events-none" />
              </div>

              <div className="w-full space-y-3">
                <div className="py-3 px-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kode Token Alternatif</span>
                  <span className="text-2xl font-black text-slate-800 tracking-widest font-mono mt-1 select-all">{qrActiveSession.token}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsQrZoomed(false)}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer shadow-lg shadow-blue-200"
                >
                  Tutup Tampilan Perbesar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Diagnostic & Network Sync Inspector Modal */}
      <AnimatePresence>
        {showDiagnosticsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDiagnosticsModal(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden text-slate-100"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Terminal size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      Inspector Log Sync &amp; Raw JSON Presensi
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                        LIVE 2s
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Pelacakan real-time lalu lintas jaringan <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">/api/presensi</code> &amp; memori state
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDiagnosticsModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Summary Cards */}
              <div className="p-4 bg-slate-900/90 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">State React Memory</span>
                  <div className="flex items-baseline gap-1.5 mt-1 font-mono">
                    <span className="text-lg font-black text-emerald-400">{presensiList.length}</span>
                    <span className="text-[10px] text-slate-400">records</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">LocalStorage State</span>
                  <div className="flex items-baseline gap-1.5 mt-1 font-mono">
                    <span className="text-lg font-black text-blue-400">{loadPresensi().length}</span>
                    <span className="text-[10px] text-slate-400">records</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Server Endpoint</span>
                  <div className="flex items-baseline gap-1.5 mt-1 font-mono">
                    <span className="text-lg font-black text-amber-400">{serverApiData ? serverApiData.length : 0}</span>
                    <span className="text-[10px] text-slate-400">records</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Log Events</span>
                  <div className="flex items-baseline gap-1.5 mt-1 font-mono">
                    <span className="text-lg font-black text-purple-400">{networkLogs.length}</span>
                    <span className="text-[10px] text-slate-400">requests</span>
                  </div>
                </div>
              </div>

              {/* Tab Selector Bar */}
              <div className="px-6 py-2.5 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDiagnosticTab('network')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      diagnosticTab === 'network'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Activity size={14} />
                    <span>Live Network Logs ({networkLogs.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiagnosticTab('json')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      diagnosticTab === 'json'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <FileJson size={14} />
                    <span>Raw JSON State</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiagnosticTab('session')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      diagnosticTab === 'session'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Wifi size={14} />
                    <span>Session &amp; Class Analysis</span>
                  </button>
                </div>

                {diagnosticTab === 'network' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => performSyncAndLog(true)}
                      disabled={isSyncingNow}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={isSyncingNow ? 'animate-spin' : ''} />
                      <span>{isSyncingNow ? 'Syncing...' : '⚡ Sync Sekarang'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNetworkLogs([])}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Bersihkan Log"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
                {/* TAB 1: NETWORK LOGS */}
                {diagnosticTab === 'network' && (
                  <div className="space-y-4">
                    {/* Log Filters */}
                    <div className="flex items-center justify-between text-xs pb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold">Filter Log:</span>
                        <button
                          type="button"
                          onClick={() => setLogFilter('all')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            logFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Semua ({networkLogs.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogFilter('changed')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            logFilter === 'changed' ? 'bg-emerald-500/30 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Ada Merge/Data Baru ({networkLogs.filter(l => l.mergedNewCount > 0 || l.mergedUpdatedCount > 0).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogFilter('error')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            logFilter === 'error' ? 'bg-rose-500/30 text-rose-300' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Error ({networkLogs.filter(l => l.status !== '200 OK').length})
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-500 font-mono">Interval otomatis: 2000ms</span>
                    </div>

                    {/* Log Terminal Table */}
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-xs space-y-2 max-h-[420px] overflow-y-auto">
                      {(() => {
                        const filteredLogs = networkLogs.filter(l => {
                          if (logFilter === 'changed') return l.mergedNewCount > 0 || l.mergedUpdatedCount > 0;
                          if (logFilter === 'error') return l.status !== '200 OK';
                          return true;
                        });

                        if (filteredLogs.length === 0) {
                          return (
                            <div className="py-12 text-center text-slate-500 space-y-2">
                              <Activity size={24} className="mx-auto opacity-40 animate-pulse text-emerald-400" />
                              <p>Belum ada entri log jaringan tercatat. Menunggu polling otomatis berikutnya...</p>
                            </div>
                          );
                        }

                        return filteredLogs.map((log) => {
                          const hasMerge = log.mergedNewCount > 0 || log.mergedUpdatedCount > 0;
                          const isError = log.status !== '200 OK';

                          return (
                            <div
                              key={log.id}
                              className={`p-3 rounded-xl border text-[11px] transition-all space-y-1.5 ${
                                isError
                                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                                  : hasMerge
                                  ? 'bg-emerald-950/50 border-emerald-700/80 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                  : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-500 font-bold">[{log.time}]</span>
                                  <span className="text-cyan-400 font-bold">{log.endpoint}</span>
                                  {log.isManualTrigger && (
                                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px] uppercase font-bold">
                                      Manual Trigger
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                    isError ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  }`}>
                                    {log.status}
                                  </span>

                                  <span className="text-slate-400 text-[10px]">
                                    Diterima dari server: <b className="text-white">{log.recordsReceivedCount} records</b>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/60">
                                <div>
                                  {hasMerge ? (
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                      <CheckCircle2 size={12} /> State Updated: +{log.mergedNewCount} record baru, +{log.mergedUpdatedCount} update status/metode
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">
                                      State Merged: Tidak ada perubahan baru (Total local state: {log.presensiListAfter} items)
                                    </span>
                                  )}
                                </div>

                                <span className="text-slate-500">
                                  Presensi count: {log.presensiListBefore} → {log.presensiListAfter}
                                </span>
                              </div>

                              {log.recordsReceivedSample !== '[]' && (
                                <div className="mt-1 pt-1 border-t border-slate-800/40 text-[10px] text-slate-400 break-all truncate">
                                  <span className="text-slate-500 font-bold">Sample Payload:</span> {log.recordsReceivedSample}
                                </div>
                              )}

                              {log.errorDetails && (
                                <div className="text-rose-400 font-bold text-[10px] flex items-center gap-1">
                                  <AlertTriangle size={11} /> Error: {log.errorDetails}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* TAB 2: RAW JSON STATE */}
                {diagnosticTab === 'json' && (
                  <div className="space-y-4">
                    {/* JSON Control Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-bold">Sumber Data:</span>
                        <div className="flex p-0.5 bg-slate-900 rounded-xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setJsonDataSource('presensiList')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              jsonDataSource === 'presensiList' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            React State ({presensiList.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setJsonDataSource('localStorage')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              jsonDataSource === 'localStorage' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            LocalStorage ({loadPresensi().length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setJsonDataSource('serverApi')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              jsonDataSource === 'serverApi' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Server Endpoint ({serverApiData ? serverApiData.length : 0})
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Cari nama, kelas, NIS..."
                            value={jsonSearchQuery}
                            onChange={(e) => setJsonSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-48"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            let sourceData: any = presensiList;
                            if (jsonDataSource === 'localStorage') sourceData = loadPresensi();
                            if (jsonDataSource === 'serverApi') sourceData = serverApiData || [];
                            navigator.clipboard.writeText(JSON.stringify(sourceData, null, 2));
                            setCopiedJsonToast(true);
                            setTimeout(() => setCopiedJsonToast(false), 3000);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          <Copy size={13} />
                          <span>{copiedJsonToast ? '✅ Copied!' : 'Copy JSON'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Prettified Code Box */}
                    {(() => {
                      let activeArray: Presensi[] = presensiList;
                      if (jsonDataSource === 'localStorage') activeArray = loadPresensi();
                      if (jsonDataSource === 'serverApi') activeArray = serverApiData || [];

                      const q = jsonSearchQuery.trim().toLowerCase();
                      const filteredData = q
                        ? activeArray.filter(
                            (p) =>
                              (p.siswaNama && p.siswaNama.toLowerCase().includes(q)) ||
                              (p.siswaKelas && p.siswaKelas.toLowerCase().includes(q)) ||
                              (p.siswaId && p.siswaId.toLowerCase().includes(q)) ||
                              (p.tanggal && p.tanggal.includes(q))
                          )
                        : activeArray;

                      return (
                        <div className="relative bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-xs overflow-x-auto max-h-[420px] scrollbar-thin">
                          <div className="text-[10px] text-slate-500 mb-2 font-mono">
                            Showing {filteredData.length} of {activeArray.length} items
                          </div>
                          <pre className="text-emerald-400 whitespace-pre-wrap break-all leading-relaxed">
                            {JSON.stringify(filteredData, null, 2)}
                          </pre>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* TAB 3: SESSION & CLASS MATCH DIAGNOSTICS */}
                {diagnosticTab === 'session' && (
                  <div className="space-y-4 text-xs">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Wifi size={16} className="text-amber-400" /> Sesi QR Presensi Aktif
                      </h4>

                      {qrActiveSession ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Token Kode</span>
                            <span className="text-amber-300 font-black text-sm">{qrActiveSession.token}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Kelas Sesi</span>
                            <span className="text-white font-bold">{qrActiveSession.kelas}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Tanggal</span>
                            <span className="text-white font-bold">{qrActiveSession.tanggal}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Sisa Waktu Sesi</span>
                            <span className="text-emerald-400 font-bold">{timeLeft} detik</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 text-center">
                          Belum ada sesi presensi QR yang diaktifkan oleh Guru. Klik "Mulai Sesi QR Code" di dasbor untuk membuat token baru.
                        </div>
                      )}
                    </div>

                    {/* Class Name Match Diagnostic Checklist */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Database size={16} className="text-blue-400" /> Analisis Kesesuaian Nama Kelas Siswa
                      </h4>

                      <div className="space-y-2">
                        {(() => {
                          const sessClass = qrActiveSession?.kelas || selectedKelas;
                          const normSessClass = String(sessClass).trim().toLowerCase().replace(/\s+/g, '');

                          const matchedStudents = siswaList.filter(
                            (s) => String(s.kelas).trim().toLowerCase().replace(/\s+/g, '') === normSessClass
                          );

                          return (
                            <div className="space-y-2">
                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                                <div>
                                  <span className="text-slate-400 font-bold block">Kelas Dipilih:</span>
                                  <span className="text-white font-mono font-bold">{sessClass}</span>
                                </div>

                                <div className="text-right">
                                  <span className="text-slate-400 font-bold block">Siswa Terdeteksi:</span>
                                  <span className="text-emerald-400 font-mono font-black text-sm">
                                    {matchedStudents.length} / {siswaList.length} Siswa
                                  </span>
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-400 space-y-1 leading-relaxed">
                                <p>
                                  ✅ Sistem menggunakan pembandingan nama kelas yang <b>case-insensitive</b> &amp; <b>mencopot spasi ganda</b>.
                                </p>
                                <p>
                                  Contoh: <code className="text-emerald-300">"XI-MIPA-1"</code> dan <code className="text-emerald-300">"XI MIPA 1"</code> akan otomatis dicocokkan dengan sempurna.
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px] font-mono">ESC</kbd> untuk menutup</span>
                <button
                  type="button"
                  onClick={() => setShowDiagnosticsModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Tutup Inspector
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
