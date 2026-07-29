import React, { useState } from 'react';
import { 
  Users, BookOpen, Plus, Trash2, Edit2, LogOut, Key, ShieldAlert, Database, 
  UserPlus, CheckCircle2, AlertCircle, School, HelpCircle, ArrowDown, ArrowUp, 
  Mail, Clock, Activity, RefreshCw, Terminal, Check, RotateCcw, Sparkles, 
  Laptop, Smartphone, Send, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TeacherAccount } from '../types';
import { 
  loadTeacherAccounts, 
  saveTeacherAccounts, 
  getTeacherSchoolName,
  getSuperAdminSpreadsheetUrl,
  saveSuperAdminSpreadsheetUrl,
  saveSuperAdminSpreadsheetUrlToServer,
  fetchSuperAdminSpreadsheetUrlFromServer,
  pushSuperAdminToGoogleSheets,
  pullSuperAdminFromGoogleSheets,
  fetchSuperAdminConfigFromServer
} from '../data';

interface SuperAdminDashboardProps {
  onLogout: () => void;
  onImpersonateTeacher: (username: string) => void;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  event: string;
  detail: string;
  type: 'success' | 'warning' | 'info';
  username?: string;
}

export default function SuperAdminDashboard({ onLogout, onImpersonateTeacher }: SuperAdminDashboardProps) {
  const [teachers, setTeachers] = useState<TeacherAccount[]>(() => loadTeacherAccounts());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherAccount | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherAccount | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved'>('all');

  // Form states
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mataPelajaran, setMataPelajaran] = useState('Informatika');
  const [asalSekolah, setAsalSekolah] = useState('MGMP INFORMATIKA SMA BONDOWOSO');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // System Sync Log & Timestamp States
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('smasa_superadmin_sync_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const initTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const initDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    return [
      {
        id: 'init-1',
        timestamp: `${initDate} ${initTime}`,
        event: 'SISTEM SUPER ADMIN AKTIF',
        detail: 'Sistem log sinkronisasi dan pengawasan gadget guru diinisialisasi. Siap memantau pengiriman status persetujuan ke Cloud Database.',
        type: 'info'
      }
    ];
  });

  const [lastGlobalSyncTime, setLastGlobalSyncTime] = useState<string>(() => {
    return localStorage.getItem('smasa_superadmin_last_sync_time') || `${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  });

  const addSyncLog = (event: string, detail: string, type: 'success' | 'warning' | 'info' = 'info', username?: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const fullStamp = `${dateStr} ${timeStr}`;

    const newEntry: SyncLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: fullStamp,
      event,
      detail,
      type,
      username
    };

    setSyncLogs(prev => {
      const updated = [newEntry, ...prev].slice(0, 50);
      try {
        localStorage.setItem('smasa_superadmin_sync_logs', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setLastGlobalSyncTime(fullStamp);
    try {
      localStorage.setItem('smasa_superadmin_last_sync_time', fullStamp);
    } catch (e) {}
  };

  // Super Admin Configuration States
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(() => getSuperAdminSpreadsheetUrl());
  const [adminPasswordState, setAdminPasswordState] = useState(() => localStorage.getItem('smasa_superadmin_password') || 'sableng212');
  const [adminEmailState, setAdminEmailState] = useState(() => localStorage.getItem('smasa_superadmin_email') || '4ndr1saya@gmail.com');
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Auto-pull data from spreadsheet on mount if URL is configured
  React.useEffect(() => {
    const initSpreadsheetData = async () => {
      setIsSyncing(true);
      try {
        const config = await fetchSuperAdminConfigFromServer();
        const activeUrl = config?.url || getSuperAdminSpreadsheetUrl();
        if (activeUrl) setSpreadsheetUrl(activeUrl);

        if (config) {
          if (config.adminPassword) setAdminPasswordState(config.adminPassword);
          if (config.adminEmail) setAdminEmailState(config.adminEmail);

          const ok = await pullSuperAdminFromGoogleSheets();
          if (ok) {
            const loaded = loadTeacherAccounts();
            setTeachers(loaded);
            setSuccessMsg('Data akun guru & persetujuan terbaru berhasil disinkronkan langsung dari Google Spreadsheet database!');
            addSyncLog('AUTO SYNC AWAL', `Inisialisasi berhasil: ${loaded.length} akun guru disinkronkan dari Google Spreadsheet database.`, 'success');
            setTimeout(() => setSuccessMsg(''), 4000);
          } else {
            const loaded = loadTeacherAccounts();
            setTeachers(loaded);
            addSyncLog('LOAD LOKAL', `Menggunakan database lokal (${loaded.length} guru). Google Spreadsheet belum terhubung/kosong.`, 'info');
          }
        }
      } catch (err) {
        console.error("[Auto Pull on Mount Error]", err);
        setErrorMsg('Gagal menyinkronkan data otomatis dari Google Spreadsheet.');
        addSyncLog('AUTO SYNC GAGAL', 'Gagal menyinkronkan data dari Cloud Spreadsheet pada muat awal.', 'warning');
        setTimeout(() => setErrorMsg(''), 4000);
      } finally {
        setIsSyncing(false);
      }
    };
    initSpreadsheetData();
  }, []);

  // Periodic background sync polling to catch new teacher registrations from other gadgets
  React.useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const ok = await pullSuperAdminFromGoogleSheets();
        if (ok) {
          const loaded = loadTeacherAccounts();
          setTeachers(loaded);
        } else {
          const res = await fetch('/api/teachers');
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.teachers)) {
              setTeachers(data.teachers);
            }
          }
        }
      } catch (err) {}
    }, 10000);
    return () => clearInterval(pollInterval);
  }, []);

  const handleSaveSpreadsheetUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = spreadsheetUrl.trim();
    const cleanPassword = adminPasswordState.trim();
    const cleanEmail = adminEmailState.trim();
    
    setIsSyncing(true);
    setErrorMsg('');
    setSuccessMsg('Menyimpan konfigurasi...');

    if (cleanUrl && (cleanUrl.includes('docs.google.com/spreadsheets') || !cleanUrl.includes('script.google.com'))) {
      setErrorMsg('Peringatan: URL yang Anda masukkan adalah URL Google Spreadsheet langsung atau format salah. Anda harus memasukkan URL Web App Google Apps Script hasil penyebaran (Deployment URL) yang berakhiran /exec. Silakan baca "Panduan Setup Database Cloud" di bawah ini.');
      setIsSyncing(false);
      setTimeout(() => setErrorMsg(''), 15000);
      return;
    }

    try {
      // Save locally and server-side
      await saveSuperAdminSpreadsheetUrlToServer(cleanUrl, cleanPassword, cleanEmail);
      setSuccessMsg('Konfigurasi Super Admin berhasil disimpan!');
      addSyncLog('SIMPAN KONFIGURASI', 'URL Apps Script Super Admin & Sandi Pemulihan berhasil disimpan.', 'info');
      
      // Auto-pull immediately after saving to load existing data
      if (cleanUrl) {
        const ok = await pullSuperAdminFromGoogleSheets();
        if (ok) {
          const loaded = loadTeacherAccounts();
          setTeachers(loaded);
          setSuccessMsg('Konfigurasi berhasil disimpan & disinkronkan dengan Google Spreadsheet!');
          addSyncLog('PULL SETELAH SIMPAN', `Sinkronisasi ulang berhasil: ${loaded.length} akun terunduh dari spreadsheet.`, 'success');
        } else {
          setErrorMsg('Konfigurasi disimpan, namun gagal mengambil data guru dari spreadsheet. Pastikan spreadsheet Anda memiliki format yang benar.');
        }
      }
    } catch (error: any) {
      setErrorMsg(`Gagal menyinkronkan data: ${error?.message || error}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 5000);
    }
  };

  const triggerAutoPush = async () => {
    if (getSuperAdminSpreadsheetUrl()) {
      setIsSyncing(true);
      setErrorMsg('');
      try {
        const ok = await pushSuperAdminToGoogleSheets();
        if (ok) {
          setSuccessMsg('Perubahan berhasil disinkronkan otomatis ke Google Spreadsheet!');
          addSyncLog('AUTO PUSH SPREADSHEET', 'Data status persetujuan & daftar guru otomatis dikirim ke Google Spreadsheet.', 'success');
          setTimeout(() => setSuccessMsg(''), 3000);
        } else {
          setErrorMsg('Gagal menyinkronkan perubahan otomatis ke Google Spreadsheet.');
          addSyncLog('AUTO PUSH GAGAL', 'Gagal mengirimkan perubahan data ke Google Spreadsheet Super Admin.', 'warning');
          setTimeout(() => setErrorMsg(''), 4000);
        }
      } catch (err: any) {
        console.error("[Auto Sync Error]", err);
        setErrorMsg(`Gagal sinkronisasi otomatis: ${err?.message || err}`);
        setTimeout(() => setErrorMsg(''), 4000);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handlePushSuperAdmin = async () => {
    if (!spreadsheetUrl) {
      setErrorMsg('Masukkan URL Spreadsheet Super Admin terlebih dahulu!');
      return;
    }
    setIsSyncing(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const ok = await pushSuperAdminToGoogleSheets();
      if (ok) {
        setSuccessMsg('Berhasil mengirimkan data guru ke Google Spreadsheet Super Admin!');
        addSyncLog('MANUAL PUSH SPREADSHEET', `Pengiriman manual: ${teachers.length} akun guru berhasil dipush ke Cloud Spreadsheet.`, 'success');
      } else {
        setErrorMsg('Gagal mengirimkan data ke Google Spreadsheet. Silakan periksa URL & izin Web App Anda.');
        addSyncLog('MANUAL PUSH GAGAL', 'Gagal mengirimkan data ke Cloud Spreadsheet.', 'warning');
      }
    } catch (e: any) {
      setErrorMsg(`Gagal sinkronisasi: ${e?.message || e}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 5000);
    }
  };

  const handlePullSuperAdmin = async () => {
    if (!spreadsheetUrl) {
      setErrorMsg('Masukkan URL Spreadsheet Super Admin terlebih dahulu!');
      return;
    }
    setIsSyncing(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      localStorage.removeItem('smasa_teachers');
      const ok = await pullSuperAdminFromGoogleSheets();
      if (ok) {
        const loaded = loadTeacherAccounts();
        setTeachers(loaded);
        setSuccessMsg('Berhasil mengunduh & menyinkronkan data guru langsung dari database Google Spreadsheet!');
        addSyncLog('MANUAL PULL SPREADSHEET', `Tarik data manual: ${loaded.length} akun guru berhasil disinkronkan dari Cloud Database.`, 'success');
      } else {
        setErrorMsg('Gagal mengunduh data dari Google Spreadsheet. Pastikan Spreadsheet Anda terisi data guru.');
        addSyncLog('MANUAL PULL GAGAL', 'Gagal mengunduh data dari Cloud Spreadsheet.', 'warning');
      }
    } catch (e: any) {
      setErrorMsg(`Gagal mengambil data: ${e?.message || e}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 5000);
    }
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!nama.trim() || !username.trim() || !password.trim() || !mataPelajaran.trim() || !asalSekolah.trim() || !email.trim()) {
      setErrorMsg('Semua kolom wajib diisi!');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if username is 'admin' (reserved) or already exists
    if (cleanUsername === 'admin') {
      setErrorMsg('Username "admin" dilindungi untuk Super Admin!');
      return;
    }

    if (teachers.some(t => t.username === cleanUsername)) {
      setErrorMsg(`Username "${cleanUsername}" sudah terdaftar!`);
      return;
    }

    const nowStamp = `${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    const newTeacher: TeacherAccount = {
      id: `T${Date.now()}`,
      nama: nama.trim(),
      username: cleanUsername,
      password: password,
      mataPelajaran: mataPelajaran.trim(),
      isApproved: true,
      asalSekolah: asalSekolah.trim(),
      email: email.trim(),
      lastSyncAt: nowStamp
    };

    const updated = [...teachers, newTeacher];
    setTeachers(updated);
    saveTeacherAccounts(updated);
    triggerAutoPush();

    addSyncLog('TAMBAH AKUN GURU', `Akun guru baru "${nama.trim()}" (@${cleanUsername}) ditambahkan secara langsung. Status: Disetujui.`, 'success', cleanUsername);

    // Reset
    setNama('');
    setUsername('');
    setPassword('');
    setMataPelajaran('Informatika');
    setAsalSekolah('SMA Negeri 1 Salatiga');
    setEmail('');
    setShowAddForm(false);
    setSuccessMsg(`Akun guru baru berhasil ditambahkan! Timestamp sync: ${nowStamp}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (!editingTeacher.nama.trim() || !editingTeacher.username.trim() || !editingTeacher.mataPelajaran.trim() || !editingTeacher.password?.trim() || !editingTeacher.asalSekolah?.trim() || !editingTeacher.email?.trim()) {
      setErrorMsg('Semua kolom wajib diisi!');
      return;
    }

    const cleanUsername = editingTeacher.username.trim().toLowerCase();

    if (cleanUsername === 'admin') {
      setErrorMsg('Username "admin" dilindungi untuk Super Admin!');
      return;
    }

    // Check conflict
    if (teachers.some(t => t.id !== editingTeacher.id && t.username === cleanUsername)) {
      setErrorMsg(`Username "${cleanUsername}" sudah terdaftar oleh guru lain!`);
      return;
    }

    const nowStamp = `${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    const updated = teachers.map(t => {
      if (t.id === editingTeacher.id) {
        return {
          ...editingTeacher,
          username: cleanUsername,
          lastSyncAt: nowStamp
        };
      }
      return t;
    });

    setTeachers(updated);
    saveTeacherAccounts(updated);
    triggerAutoPush();
    setEditingTeacher(null);
    addSyncLog('EDIT AKUN GURU', `Data kredensial guru "${editingTeacher.nama}" (@${cleanUsername}) diperbarui. Timestamp sync: ${nowStamp}`, 'info', cleanUsername);
    setSuccessMsg('Kredensial akun guru berhasil diperbarui!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteTeacher = (id: string, name: string) => {
    const target = teachers.find(t => t.id === id);
    if (target) {
      setTeacherToDelete(target);
    }
  };

  const handleApproveTeacher = (id: string, name: string) => {
    const targetTeacher = teachers.find(t => t.id === id);
    const nowStamp = `${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    const updated = teachers.map(t => {
      if (t.id === id) {
        return { ...t, isApproved: true, lastSyncAt: nowStamp };
      }
      return t;
    });

    if (targetTeacher) {
      const uName = targetTeacher.username.trim().toLowerCase();
      const pendingStr = localStorage.getItem('smasa_pending_approval_user');
      const pendingUsers: string[] = pendingStr ? JSON.parse(pendingStr) : [];
      if (!pendingUsers.includes(uName)) {
        pendingUsers.push(uName);
        localStorage.setItem('smasa_pending_approval_user', JSON.stringify(pendingUsers));
      }
    }

    setTeachers(updated);
    saveTeacherAccounts(updated);
    triggerAutoPush();

    addSyncLog('PERSETUJUAN DISETUJUI', `Akun Guru "${name}" (@${targetTeacher?.username || ''}) berhasil DISETUJUI. Hak akses dikirim ke Cloud Spreadsheet database untuk gadget guru.`, 'success', targetTeacher?.username);

    setSuccessMsg(`Pendaftaran guru "${name}" berhasil DISETUJUI! Data persetujuan terkirim (Sync: ${nowStamp}).`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleRevokeApproveTeacher = (id: string, name: string) => {
    const targetTeacher = teachers.find(t => t.id === id);
    const nowStamp = `${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    const updated = teachers.map(t => {
      if (t.id === id) {
        return { ...t, isApproved: false, lastSyncAt: nowStamp };
      }
      return t;
    });

    setTeachers(updated);
    saveTeacherAccounts(updated);
    triggerAutoPush();

    addSyncLog('PERSETUJUAN DICABUT', `Akses Guru "${name}" (@${targetTeacher?.username || ''}) DICABUT. Status dikembalikan ke Menunggu Persetujuan.`, 'warning', targetTeacher?.username);

    setSuccessMsg(`Persetujuan untuk guru "${name}" berhasil DICABUT. Sync: ${nowStamp}`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleRejectTeacher = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin MENOLAK pendaftaran guru "${name}"? Pendaftaran akun ini akan ditolak & dihapus dari sistem.`)) {
      const targetTeacher = teachers.find(t => t.id === id);
      const updated = teachers.filter(t => t.id !== id);
      setTeachers(updated);
      saveTeacherAccounts(updated);
      triggerAutoPush();

      addSyncLog('PENDAFTARAN DITOLAK', `Pendaftaran guru "${name}" (@${targetTeacher?.username || ''}) DITOLAK & dihapus oleh Super Admin.`, 'warning', targetTeacher?.username);

      setSuccessMsg(`Pendaftaran guru "${name}" berhasil DITOLAK.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  // Helper to check if teacher has set up a Google Spreadsheet URL
  const getTeacherSpreadsheetStatus = (usr: string) => {
    try {
      const settingsStr = localStorage.getItem(`smasa_${usr}_settings`);
      if (settingsStr) {
        const parsed = JSON.parse(settingsStr);
        return parsed.spreadsheetUrl ? 'Connected' : 'Local Only';
      }
    } catch (e) {}
    return 'Local Only';
  };

  // Helper to check student count for a teacher
  const getTeacherStudentCount = (usr: string) => {
    try {
      const siswaStr = localStorage.getItem(`smasa_${usr}_siswa`);
      if (siswaStr) {
        const parsed = JSON.parse(siswaStr);
        return Array.isArray(parsed) ? parsed.length : 0;
      }
    } catch (e) {}
    return 0;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-10 text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top bar header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldAlert size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 text-[10px] font-extrabold uppercase tracking-widest">System Control</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">Super Admin Panel</h1>
              <p className="text-xs text-slate-500 mt-1">Sistem Manajemen Multi-Guru & Basis Data Independen</p>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 self-stretch sm:self-auto justify-center"
          >
            <LogOut size={14} />
            <span>Keluar Super Admin</span>
          </button>
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{successMsg}</span>
            </motion.div>
          )}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              <AlertCircle size={16} className="text-rose-600" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending Approval Alert Banner */}
        {teachers.filter(t => !(t.username.toLowerCase() === 'romlah' || t.username.toLowerCase() === 'bambang' || t.username.toLowerCase() === 'admin' || t.isApproved === true || String(t.isApproved).trim().toLowerCase() === 'true' || String(t.isApproved).trim() === '1')).length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0 animate-bounce">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="font-black text-sm text-amber-900 flex items-center gap-2">
                  <span>Pendaftaran Guru Baru Menunggu Persetujuan!</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider">
                    {teachers.filter(t => !(t.username.toLowerCase() === 'romlah' || t.username.toLowerCase() === 'bambang' || t.username.toLowerCase() === 'admin' || t.isApproved === true || String(t.isApproved).trim().toLowerCase() === 'true' || String(t.isApproved).trim() === '1')).length} Guru
                  </span>
                </h4>
                <p className="text-xs text-amber-800 font-medium mt-0.5">
                  Terdapat {teachers.filter(t => !(t.username.toLowerCase() === 'romlah' || t.username.toLowerCase() === 'bambang' || t.username.toLowerCase() === 'admin' || t.isApproved === true || String(t.isApproved).trim().toLowerCase() === 'true' || String(t.isApproved).trim() === '1')).length} pendaftaran akun guru baru dari gadget guru. Silakan klik tombol <strong>Setujui</strong> atau <strong>Tolak</strong> di bawah ini untuk memproses akses.
                </p>
              </div>
            </div>
            <button
              onClick={() => setFilterTab('pending')}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Lihat Permintaan Approval ({teachers.filter(t => !(t.username.toLowerCase() === 'romlah' || t.username.toLowerCase() === 'bambang' || t.username.toLowerCase() === 'admin' || t.isApproved === true || String(t.isApproved).trim().toLowerCase() === 'true' || String(t.isApproved).trim() === '1')).length})
            </button>
          </motion.div>
        )}

        {/* Widgets / Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <Users size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Guru</span>
              <h3 className="text-2xl font-black text-slate-800">{teachers.length}</h3>
            </div>
          </div>

          <div className={`bg-white p-6 rounded-3xl border shadow-sm flex items-center gap-4 ${teachers.filter(t => !(t.username.toLowerCase() === 'romlah' || t.username.toLowerCase() === 'bambang' || t.username.toLowerCase() === 'admin' || t.isApproved === true || String(t.isApproved).trim().toLowerCase() === 'true' || String(t.isApproved).trim() === '1')).length > 0 ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20' : 'border-slate-100'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${teachers.filter(t => !(t.username.toLowerCase() === 'romlah' || t.username.toLowerCase() === 'bambang' || t.username.toLowerCase() === 'admin' || t.isApproved === true || String(t.isApproved).trim().toLowerCase() === 'true' || String(t.isApproved).trim() === '1')).length > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-amber-50 text-amber-600'}`}>
              <Clock size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>Pending Approval</span>
                {teachers.filter(t => !(t.username.toLowerCase() === 'romlah' || t.username.toLowerCase() === 'bambang' || t.username.toLowerCase() === 'admin' || t.isApproved === true || String(t.isApproved).trim().toLowerCase() === 'true' || String(t.isApproved).trim() === '1')).length > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>}
              </span>
              <h3 className="text-2xl font-black text-amber-600">{teachers.filter(t => !(t.username.toLowerCase() === 'romlah' || t.username.toLowerCase() === 'bambang' || t.username.toLowerCase() === 'admin' || t.isApproved === true || String(t.isApproved).trim().toLowerCase() === 'true' || String(t.isApproved).trim() === '1')).length}</h3>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <Database size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spreadsheet Terhubung</span>
              <h3 className="text-2xl font-black text-slate-800">
                {teachers.filter(t => getTeacherSpreadsheetStatus(t.username) === 'Connected').length}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
              <BookOpen size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Siswa Terkelola</span>
              <h3 className="text-2xl font-black text-slate-800">
                {teachers.reduce((sum, t) => sum + getTeacherStudentCount(t.username), 0)}
              </h3>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Action panel & list */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-black text-slate-800">Daftar Guru Terdaftar</h2>
              <p className="text-xs text-slate-500">Guru di bawah ini memiliki ruang penyimpanan database mandiri & spreadsheet pribadi.</p>
            </div>

            <button
              onClick={() => {
                setEditingTeacher(null);
                setShowAddForm(!showAddForm);
              }}
              className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-rose-100 active:scale-95"
            >
              <UserPlus size={16} />
              <span>Daftarkan Guru Baru</span>
            </button>
          </div>

          {/* Add Teacher Form */}
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleAddTeacher}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-4"
            >
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-600 rounded-full"></span> Form Pendaftaran Guru Baru
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Lengkap Guru</label>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Romlah, S.Kom."
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Username Login</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: romlah"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-700 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kata Sandi (Password)</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    required
                    value={mataPelajaran}
                    onChange={(e) => setMataPelajaran(e.target.value)}
                    placeholder="Contoh: Informatika"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Asal Sekolah</label>
                  <input
                    type="text"
                    required
                    value={asalSekolah}
                    onChange={(e) => setAsalSekolah(e.target.value)}
                    placeholder="Contoh: SMA Negeri 1 Salatiga"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email Aktif</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: romlah@gmail.com"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
                >
                  Simpan & Daftarkan
                </button>
              </div>
            </motion.form>
          )}

          {/* Edit Teacher Form Modal/Inline */}
          {editingTeacher && (
            <motion.form
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleEditTeacher}
              className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-4"
            >
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span> Edit Kredensial & Detail Akun Guru
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Lengkap Guru</label>
                  <input
                    type="text"
                    required
                    value={editingTeacher.nama}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, nama: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Username Login</label>
                  <input
                    type="text"
                    required
                    value={editingTeacher.username}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, username: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-700 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kata Sandi (Password)</label>
                  <input
                    type="text"
                    required
                    value={editingTeacher.password || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, password: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    required
                    value={editingTeacher.mataPelajaran}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, mataPelajaran: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Asal Sekolah</label>
                  <input
                    type="text"
                    required
                    value={editingTeacher.asalSekolah || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, asalSekolah: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email Aktif</label>
                  <input
                    type="email"
                    required
                    value={editingTeacher.email || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </motion.form>
          )}

          {/* Teacher accounts list table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-4 px-5">Nama & Mapel</th>
                  <th className="py-4 px-5">Kredensial</th>
                  <th className="py-4 px-5 text-center">Basis Data</th>
                  <th className="py-4 px-5 text-center">Status Sync Gadget</th>
                  <th className="py-4 px-5 text-center">Jumlah Siswa</th>
                  <th className="py-4 px-5 text-right">Aksi & Integrasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 font-bold">
                      Belum ada guru yang didaftarkan.
                    </td>
                  </tr>
                ) : (
                  teachers.map((t) => {
                    const spreadsheetStatus = getTeacherSpreadsheetStatus(t.username);
                    const studentCount = getTeacherStudentCount(t.username);
                    const isApproved = t.username.toLowerCase() === 'romlah' || t.username.toLowerCase() === 'bambang' || t.isApproved === true || String(t.isApproved).trim().toLowerCase() === 'true' || String(t.isApproved).trim() === '1';
                    
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-800">{t.nama}</span>
                            {!isApproved ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-extrabold text-[9px] uppercase tracking-wider animate-pulse">
                                Menunggu Persetujuan
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[9px] uppercase tracking-wider">
                                Aktif
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wide">
                            Mapel: {t.mataPelajaran}
                          </div>
                          <div className="text-[10px] text-indigo-600 font-bold mt-1.5 flex items-center gap-1.5 bg-indigo-50/60 text-indigo-700 px-2 py-1 rounded-lg w-fit border border-indigo-100">
                            <School size={11} className="text-indigo-500" />
                            <span>Asal Sekolah: {t.asalSekolah || getTeacherSchoolName(t.username)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="font-mono text-[11px] text-slate-700">
                            Username: <span className="font-bold">{t.username}</span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                            Password: <span className="font-semibold">{t.password || '••••••'}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                            <Mail size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]" title={t.email}>{t.email || <span className="text-rose-400 italic">Belum diset</span>}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center">
                          {spreadsheetStatus === 'Connected' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                              <Database size={10} />
                              Cloud Spreadsheet
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                              Lokal Browser
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-center">
                          <div className="flex items-center justify-center gap-1 font-mono text-[10px] font-bold text-slate-700">
                            <Clock size={11} className="text-slate-400 shrink-0" />
                            <span>{t.lastSyncAt || lastGlobalSyncTime}</span>
                          </div>
                          <div className="mt-1">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[9px] border border-emerald-200">
                                <CheckCircle2 size={10} className="text-emerald-500" />
                                Terkirim ke Cloud
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold text-[9px] border border-amber-200">
                                <AlertCircle size={10} className="text-amber-500" />
                                Menunggu Approval
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center font-mono font-bold text-slate-700">
                          {studentCount} Siswa
                        </td>
                        <td className="py-4 px-5 text-right space-x-1.5">
                          {!isApproved ? (
                            <button
                              onClick={() => handleApproveTeacher(t.id, t.nama)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] inline-flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm shadow-emerald-100"
                              title="Setujui pendaftaran guru ini"
                            >
                              <CheckCircle2 size={12} />
                              <span>Setujui</span>
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => onImpersonateTeacher(t.username)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-bold text-[11px] inline-flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                title="Masuk sebagai guru ini untuk mengelola datanya secara independen"
                              >
                                <span>Masuk</span>
                              </button>
                              {!(t.username.toLowerCase() === 'romlah' || t.username.toLowerCase() === 'bambang' || t.username.toLowerCase() === 'admin') && (
                                <button
                                  onClick={() => handleRevokeApproveTeacher(t.id, t.nama)}
                                  className="px-2 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-[10px] inline-flex items-center gap-1 transition-all active:scale-95 cursor-pointer border border-amber-200"
                                  title="Batalkan/Cabut persetujuan pendaftaran guru ini"
                                >
                                  <span>Cabut Akses</span>
                                </button>
                              )}
                            </div>
                          )}
                          
                          <button
                            onClick={() => {
                              setEditingTeacher({
                                ...t,
                                asalSekolah: t.asalSekolah || getTeacherSchoolName(t.username),
                              });
                              setShowAddForm(false);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 inline-flex items-center transition-all cursor-pointer"
                            title="Edit Akun"
                          >
                            <Edit2 size={14} />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteTeacher(t.id, t.nama)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 inline-flex items-center transition-all cursor-pointer"
                            title="Hapus Akun"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          </div>

          {/* Right Column: Super Admin Spreadsheet Sync Settings */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6 self-start">
            <div className="border-b border-slate-100 pb-5">
              <div className="flex items-center gap-2 mb-1">
                <Database className="text-rose-600" size={18} />
                <h2 className="text-base font-black text-slate-800">Spreadsheet Super Admin</h2>
              </div>
              <p className="text-[11px] text-slate-500">Hubungkan data Super Admin dengan Google Spreadsheet secara terpisah untuk mengelola daftar guru.</p>
            </div>

            {/* Current Status Indicator */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/50 flex items-center justify-between">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Status Integrasi</div>
              {spreadsheetUrl ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Terhubung via Vercel Env
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold text-[10px] uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Lokal / Offline
                </span>
              )}
            </div>

            {/* Vercel Environment Variable Info Notice */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 space-y-1.5 text-xs text-indigo-950">
              <div className="flex items-center gap-1.5 font-black text-indigo-900 text-[11px] uppercase tracking-wider">
                <Database size={14} className="text-indigo-600 shrink-0" />
                <span>Otomatis via Vercel Environment</span>
              </div>
              <p className="text-[11px] leading-relaxed text-indigo-800">
                URL Google Apps Script Web App sekarang dimuat secara otomatis dari Environment Variable Vercel (<code>SUPERADMIN_SPREADSHEET_URL</code>).
              </p>
            </div>

            {/* Form to configure password and email */}
            <form onSubmit={handleSaveSpreadsheetUrl} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Kata Sandi Super Admin</label>
                <input
                  type="password"
                  required
                  value={adminPasswordState}
                  onChange={(e) => setAdminPasswordState(e.target.value)}
                  placeholder="Sandi default: sableng212"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Email Pemulihan Super Admin</label>
                <input
                  type="email"
                  required
                  value={adminEmailState}
                  onChange={(e) => setAdminEmailState(e.target.value)}
                  placeholder="Contoh: 4yik.romlah@gmail.com"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                Simpan Sandi & Email Super Admin
              </button>
            </form>

            {/* Synchronization Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Aksi Sinkronisasi</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePullSuperAdmin}
                  disabled={isSyncing || !spreadsheetUrl}
                  className={`py-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                    !spreadsheetUrl
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                      : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100"
                  }`}
                >
                  <ArrowDown size={16} className={isSyncing ? "animate-bounce" : ""} />
                  <span>Tarik Data</span>
                </button>
                
                <button
                  type="button"
                  onClick={handlePushSuperAdmin}
                  disabled={isSyncing || !spreadsheetUrl}
                  className={`py-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                    !spreadsheetUrl
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100"
                  }`}
                >
                  <ArrowUp size={16} className={isSyncing ? "animate-bounce" : ""} />
                  <span>Kirim Data</span>
                </button>
              </div>
              {isSyncing && (
                <p className="text-[10px] text-slate-400 font-bold text-center animate-pulse">Sedang menyinkronkan data dengan Google Sheets...</p>
              )}
            </div>

            {/* Detailed Expandable Help Accordion (Apps Script Guide) */}
            <div className="pt-2">
              <details className="group border border-slate-100 rounded-2xl p-4 bg-slate-50/70 transition-all">
                <summary className="font-extrabold text-xs text-slate-700 flex items-center justify-between cursor-pointer list-none select-none">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-rose-500" />
                    Panduan Setup Database Cloud
                  </span>
                  <span className="text-slate-400 transition-transform group-open:rotate-180 font-mono text-xs">&darr;</span>
                </summary>
                
                <div className="mt-4 text-[11px] text-slate-600 space-y-3 leading-relaxed border-t border-slate-200/60 pt-4">
                  <p>Ikuti langkah berikut untuk membuat spreadsheet khusus super admin:</p>
                  <ol className="list-decimal pl-4 space-y-1.5">
                    <li>Buat <b>Google Spreadsheet</b> baru di Google Drive Anda.</li>
                    <li>Buat tab lembar kerja dengan nama <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono font-bold">Guru</code>.</li>
                    <li>Pilih menu <b>Ekstensi</b> &rarr; <b>Apps Script</b>.</li>
                    <li>Hapus semua kode bawaan, lalu salin dan tempel kode di bawah ini.</li>
                  </ol>

                  <div className="relative mt-2">
                    <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl text-[9px] font-mono overflow-x-auto max-h-48 leading-relaxed">
{`function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Spreadsheet tidak ditemukan."}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var sheet = ss.getSheetByName("Guru");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({teachers: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return ContentService.createTextOutput(JSON.stringify({teachers: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var rawHeaders = data[0];
  var headers = [];
  for (var k = 0; k < rawHeaders.length; k++) {
    headers.push(String(rawHeaders[k]).trim().toLowerCase());
  }
  var jsonArray = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row || row.join("").trim() === "") continue;

    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    var uName = String(obj.username || obj.Username || "").trim();
    if (!uName) continue;

    var isSeedAdmin = (uName.toLowerCase() === "romlah" || uName.toLowerCase() === "bambang");
    var rawApp = (obj.isapproved !== undefined && obj.isapproved !== "") ? obj.isapproved :
                 ((obj.isApproved !== undefined && obj.isApproved !== "") ? obj.isApproved :
                 ((obj.approved !== undefined && obj.approved !== "") ? obj.approved : "false"));
    
    var app = String(rawApp).toLowerCase().trim();
    var isApp = isSeedAdmin || (app === "true" || app === "1" || app === "yes" || app === "approved" || app === "setuju" || app === "ya");

    jsonArray.push({
      id: String(obj.id || ("T" + i)),
      nama: String(obj.nama || uName),
      username: uName,
      password: String(obj.password || "123456"),
      mataPelajaran: String(obj.matapelajaran || obj.mataPelajaran || "Informatika"),
      isApproved: isApp,
      asalSekolah: String(obj.asalsekolah || obj.asalSekolah || ""),
      spreadsheetUrl: String(obj.spreadsheeturl || obj.spreadsheetUrl || ""),
      email: String(obj.email || ""),
      jumlahSiswa: Number(obj.jumlahsiswa || obj.jumlahSiswa || 0)
    });
  }
  return ContentService.createTextOutput(JSON.stringify({teachers: jsonArray}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Fungsi doPost() membutuhkan payload HTTP POST dari web app."
    })).setMimeType(ContentService.MimeType.JSON);
  }
  var params = {};
  try {
    params = JSON.parse(e.postData.contents);
  } catch(err) {
    params = e.parameter || {};
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Guru");
  if (!sheet) {
    sheet = ss.insertSheet("Guru");
  }
  sheet.clear();
  var headers = ["id", "nama", "username", "password", "mataPelajaran", "isApproved", "asalSekolah", "spreadsheetUrl", "email", "jumlahSiswa"];
  sheet.appendRow(headers);
  var list = params.teachers || params.Teachers || params.guru || params.Guru || params.data || [];
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch(err) {}
  }
  if (list && list.length > 0) {
    var seenUsers = {};
    var rows = [];
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      var uName = String(t.username || t.Username || "").trim();
      if (!uName) continue;
      var key = uName.toLowerCase();
      if (seenUsers[key]) continue;
      seenUsers[key] = true;

      var isSeedAdmin = (key === 'romlah' || key === 'bambang');
      var rawApp = t.isApproved !== undefined ? t.isApproved : (t.isapproved !== undefined ? t.isapproved : false);
      var appStr = String(rawApp).toLowerCase().trim();
      var isApp = isSeedAdmin || (rawApp === true || appStr === "true" || appStr === "1" || appStr === "yes" || appStr === "approved" || appStr === "setuju" || appStr === "ya");

      rows.push([
        String(t.id || ("T" + (i + 1))),
        String(t.nama || uName),
        uName,
        String(t.password || "123456"),
        String(t.mataPelajaran || t.matapelajaran || "Informatika"),
        isApp,
        String(t.asalSekolah || t.asalsekolah || ""),
        String(t.spreadsheetUrl || t.spreadsheeturl || ""),
        String(t.email || ""),
        Number(t.jumlahSiswa || 0)
      ]);
    }
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({status: "success", count: rows ? rows.length : 0}))
    .setMimeType(ContentService.MimeType.JSON);
}`}
                    </pre>
                    <button
                      type="button"
                      onClick={() => {
                        const code = `function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Guru");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({teachers: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return ContentService.createTextOutput(JSON.stringify({teachers: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var rawHeaders = data[0];
  var headers = [];
  for (var k = 0; k < rawHeaders.length; k++) {
    headers.push(String(rawHeaders[k]).trim().toLowerCase());
  }
  var jsonArray = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    var rawApp = (obj.isapproved !== undefined && obj.isapproved !== "") ? obj.isapproved : ((obj.isApproved !== undefined && obj.isApproved !== "") ? obj.isApproved : "false");
    var app = String(rawApp).toLowerCase().trim();
    var isApp = (app === "true" || app === "1" || app === "yes");

    jsonArray.push({
      id: String(obj.id || ("T" + i)),
      nama: String(obj.nama || ""),
      username: String(obj.username || ""),
      password: String(obj.password || ""),
      mataPelajaran: String(obj.matapelajaran || obj.mataPelajaran || "Informatika"),
      isApproved: isApp,
      asalSekolah: String(obj.asalsekolah || obj.asalSekolah || ""),
      spreadsheetUrl: String(obj.spreadsheeturl || obj.spreadsheetUrl || ""),
      email: String(obj.email || ""),
      jumlahSiswa: Number(obj.jumlahsiswa || obj.jumlahSiswa || 0)
    });
  }
  return ContentService.createTextOutput(JSON.stringify({teachers: jsonArray}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var params = {};
  try {
    params = JSON.parse(e.postData.contents);
  } catch(err) {
    params = e.parameter || {};
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Guru");
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Guru");
  }
  sheet.clear();
  var headers = ["id", "nama", "username", "password", "mataPelajaran", "isApproved", "asalSekolah", "spreadsheetUrl", "email", "jumlahSiswa"];
  sheet.appendRow(headers);
  var list = params.teachers || params.Teachers || params.guru || params.Guru || params.data || [];
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch(err) {}
  }
  if (list && list.length > 0) {
    var seenUsers = {};
    var rows = [];
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      var uName = String(t.username || t.Username || "").trim();
      if (!uName) continue;
      var key = uName.toLowerCase();
      if (seenUsers[key]) continue;
      seenUsers[key] = true;

      var isSeedAdmin = (key === 'romlah' || key === 'bambang');
      var rawApp = t.isApproved !== undefined ? t.isApproved : (t.isapproved !== undefined ? t.isapproved : false);
      var appStr = String(rawApp).toLowerCase().trim();
      var isApp = isSeedAdmin || (rawApp === true || appStr === "true" || appStr === "1" || appStr === "yes" || appStr === "approved" || appStr === "setuju" || appStr === "ya");

      rows.push([
        String(t.id || ("T" + (i + 1))),
        String(t.nama || uName),
        uName,
        String(t.password || "123456"),
        String(t.mataPelajaran || t.matapelajaran || "Informatika"),
        isApp,
        String(t.asalSekolah || t.asalsekolah || ""),
        String(t.spreadsheetUrl || t.spreadsheeturl || ""),
        String(t.email || ""),
        Number(t.jumlahSiswa || 0)
      ]);
    }
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({status: "success", count: rows ? rows.length : 0}))
    .setMimeType(ContentService.MimeType.JSON);
}`;
                        navigator.clipboard.writeText(code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded bg-slate-800 text-[9px] text-white hover:bg-slate-700 font-bold cursor-pointer"
                    >
                      {copiedCode ? 'Disalin!' : 'Salin Kode'}
                    </button>
                  </div>

                  <ol className="list-decimal pl-4 space-y-1.5" start={5}>
                    <li>Klik tombol <b>Terapkan</b> (Deploy) &rarr; <b>Penerapan Baru</b> (New deployment).</li>
                    <li>Pilih jenis penerapan: <b>Aplikasi Web</b> (Web App).</li>
                    <li>Setel bagian 'Siapa yang memiliki akses' ke <b>Siapa saja</b> (Anyone).</li>
                    <li>Klik <b>Terapkan</b> (Deploy) dan berikan izin akses Google Drive.</li>
                    <li>Salin <b>URL Aplikasi Web</b> yang dihasilkan, masukkan pada form di atas, lalu klik Simpan URL.</li>
                  </ol>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* SECTION LOG SISTEM & STATUS SINKRONISASI GADGET GURU */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                <Activity size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wider">Log Sinkronisasi Real-Time</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                </div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Status Sinkronisasi & Log Sistem Gadget Guru</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerAutoPush();
                  addSyncLog('REFRESH SYNC', 'Pengecekan dan pendorongan manual status persetujuan ke Cloud Database dijalankan.', 'info');
                }}
                disabled={isSyncing}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-100 shadow-sm"
              >
                <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                <span>Sync Ulang Semua Akun</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSyncLogs([]);
                  localStorage.removeItem('smasa_superadmin_sync_logs');
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
              >
                <Trash2 size={14} />
                <span>Bersihkan Log</span>
              </button>
            </div>
          </div>

          {/* Status Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-blue-50/40 border border-indigo-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Sync Cloud Terakhir</p>
                <p className="text-sm font-black text-slate-800 font-mono mt-0.5">{lastGlobalSyncTime}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Database Spreadsheet Cloud</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border border-emerald-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Status Akses Terkirim</p>
                <p className="text-sm font-black text-slate-800 mt-0.5">{teachers.filter(t => t.isApproved).length} / {teachers.length} Guru Disetujui</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Siap di-fetch gadget masing-masing</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/40 border border-amber-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-200">
                <Smartphone size={20} />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Integrasi Device / Gadget</p>
                <p className="text-sm font-black text-slate-800 mt-0.5">{spreadsheetUrl ? 'Otomatis via Cloud' : 'Sinkronisasi Lokal'}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Otomatis sync saat login / refresh</p>
              </div>
            </div>
          </div>

          {/* Detail Log Timestamp Sync per Akun Guru */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Users size={14} className="text-indigo-600" />
                Detail Timestamp Sinkronisasi per Akun Guru
              </h3>
              <span className="text-[10px] font-bold text-slate-400">Total {teachers.length} Akun Terdaftar</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                    <th className="py-3.5 px-4">Guru / Username</th>
                    <th className="py-3.5 px-4">Status Approval</th>
                    <th className="py-3.5 px-4">Timestamp Sync Terakhir</th>
                    <th className="py-3.5 px-4">Status Pengiriman Gadget</th>
                    <th className="py-3.5 px-4 text-right">Aksi Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs bg-white">
                  {teachers.map((t) => {
                    const isApproved = t.username.toLowerCase() === 'romlah' || t.username.toLowerCase() === 'bambang' || t.isApproved === true || String(t.isApproved).trim().toLowerCase() === 'true' || String(t.isApproved).trim() === '1';
                    
                    return (
                      <tr key={`sync-${t.id}`} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          <div>{t.nama}</div>
                          <div className="font-mono text-[10px] text-indigo-600 font-medium">@{t.username}</div>
                        </td>
                        <td className="py-3 px-4">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                              <CheckCircle2 size={11} className="text-emerald-500" />
                              Disetujui
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                              <Clock size={11} className="text-amber-500" />
                              Menunggu Approval
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-400" />
                            <span>{t.lastSyncAt || lastGlobalSyncTime}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isApproved ? (
                            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                              <Send size={12} className="text-emerald-500 shrink-0" />
                              <span>Data persetujuan terkirim ke Cloud. Siap di-fetch gadget guru.</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5">
                              <AlertCircle size={12} className="text-amber-500 shrink-0" />
                              <span>Menunggu approval Super Admin agar dapat login di gadget.</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const nowStamp = `${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
                              const updated = teachers.map(tc => tc.id === t.id ? { ...tc, lastSyncAt: nowStamp } : tc);
                              setTeachers(updated);
                              saveTeacherAccounts(updated);
                              triggerAutoPush();
                              addSyncLog('SINKRONISASI AKUN', `Pembaruan & sinkronisasi manual untuk akun "${t.nama}" (@${t.username}). Timestamp sync: ${nowStamp}`, 'info', t.username);
                              setSuccessMsg(`Berhasil menyinkronkan ulang data untuk ${t.nama}!`);
                              setTimeout(() => setSuccessMsg(''), 3000);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] inline-flex items-center gap-1 transition-all active:scale-95 border border-indigo-200 cursor-pointer"
                          >
                            <RefreshCw size={11} />
                            <span>Sync Akun Ini</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time System Console Log Stream */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Terminal size={14} className="text-slate-700" />
                Konsol Aktivitas & Log Sistem Real-Time
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-400">{syncLogs.length} Entri Log</span>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 font-mono text-[11px] text-slate-200 space-y-2 max-h-64 overflow-y-auto shadow-inner border border-slate-800">
              {syncLogs.length === 0 ? (
                <p className="text-slate-500 italic py-4 text-center">Belum ada log aktivitas sinkronisasi tercatat.</p>
              ) : (
                syncLogs.map((log) => {
                  let badgeBg = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                  if (log.type === 'success') badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                  if (log.type === 'warning') badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';

                  return (
                    <div key={log.id} className="flex items-start gap-2.5 border-b border-slate-800/60 pb-2 leading-relaxed">
                      <span className="text-slate-500 text-[10px] shrink-0 font-mono mt-0.5">[{log.timestamp}]</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border shrink-0 ${badgeBg}`}>
                        {log.event}
                      </span>
                      <span className="text-slate-300 flex-1">
                        {log.detail}
                        {log.username && <span className="text-indigo-400 font-bold ml-1">(@{log.username})</span>}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {teacherToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTeacherToDelete(null)}
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 z-10 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                  <Trash2 size={20} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Hapus Akun Guru?</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun guru <strong>{teacherToDelete.nama}</strong>?
                <br /><br />
                Seluruh data yang terkait dengan guru ini akan tetap berada di penyimpanan lokal namun tidak dapat diakses dari akun ini.
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setTeacherToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer animate-none"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = teachers.filter(t => t.id !== teacherToDelete.id);
                    setTeachers(updated);
                    saveTeacherAccounts(updated);
                    triggerAutoPush();
                    setSuccessMsg(`Akun guru "${teacherToDelete.nama}" berhasil dihapus.`);
                    setTimeout(() => setSuccessMsg(''), 4000);
                    setTeacherToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer shadow-md shadow-rose-100"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
