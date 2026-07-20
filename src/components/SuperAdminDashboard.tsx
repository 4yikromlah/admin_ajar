import React, { useState } from 'react';
import { Users, BookOpen, Plus, Trash2, Edit2, LogOut, Key, ShieldAlert, Database, UserPlus, CheckCircle2, AlertCircle, School, HelpCircle, ArrowDown, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TeacherAccount } from '../types';
import { 
  loadTeacherAccounts, 
  saveTeacherAccounts, 
  getTeacherSchoolName,
  getSuperAdminSpreadsheetUrl,
  saveSuperAdminSpreadsheetUrl,
  pushSuperAdminToGoogleSheets,
  pullSuperAdminFromGoogleSheets
} from '../data';

interface SuperAdminDashboardProps {
  onLogout: () => void;
  onImpersonateTeacher: (username: string) => void;
}

export default function SuperAdminDashboard({ onLogout, onImpersonateTeacher }: SuperAdminDashboardProps) {
  const [teachers, setTeachers] = useState<TeacherAccount[]>(() => loadTeacherAccounts());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherAccount | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherAccount | null>(null);

  // Form states
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mataPelajaran, setMataPelajaran] = useState('Informatika');
  const [asalSekolah, setAsalSekolah] = useState('SMA Negeri 1 Salatiga');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Super Admin Spreadsheet States
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(() => getSuperAdminSpreadsheetUrl());
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSaveSpreadsheetUrl = (e: React.FormEvent) => {
    e.preventDefault();
    saveSuperAdminSpreadsheetUrl(spreadsheetUrl);
    setSuccessMsg('URL Spreadsheet Super Admin berhasil disimpan!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const triggerAutoPush = () => {
    if (getSuperAdminSpreadsheetUrl()) {
      pushSuperAdminToGoogleSheets().catch(err => {
        console.error("[Auto Sync Error]", err);
      });
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
      } else {
        setErrorMsg('Gagal mengirimkan data ke Google Spreadsheet. Silakan periksa URL & izin Web App Anda.');
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
      const ok = await pullSuperAdminFromGoogleSheets();
      if (ok) {
        setTeachers(loadTeacherAccounts());
        setSuccessMsg('Berhasil mengunduh & menyinkronkan data guru dari Google Spreadsheet!');
      } else {
        setErrorMsg('Gagal mengunduh data dari Google Spreadsheet. Pastikan Spreadsheet Anda terisi data guru.');
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

    if (!nama.trim() || !username.trim() || !password.trim() || !mataPelajaran.trim() || !asalSekolah.trim()) {
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

    const newTeacher: TeacherAccount = {
      id: `T${Date.now()}`,
      nama: nama.trim(),
      username: cleanUsername,
      password: password,
      mataPelajaran: mataPelajaran.trim(),
      isApproved: true,
      asalSekolah: asalSekolah.trim(),
    };

    const updated = [...teachers, newTeacher];
    setTeachers(updated);
    saveTeacherAccounts(updated);
    triggerAutoPush();

    // Reset
    setNama('');
    setUsername('');
    setPassword('');
    setMataPelajaran('Informatika');
    setAsalSekolah('SMA Negeri 1 Salatiga');
    setShowAddForm(false);
    setSuccessMsg('Akun guru baru berhasil ditambahkan!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (!editingTeacher.nama.trim() || !editingTeacher.username.trim() || !editingTeacher.mataPelajaran.trim() || !editingTeacher.password?.trim() || !editingTeacher.asalSekolah?.trim()) {
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

    const updated = teachers.map(t => {
      if (t.id === editingTeacher.id) {
        return {
          ...editingTeacher,
          username: cleanUsername,
        };
      }
      return t;
    });

    setTeachers(updated);
    saveTeacherAccounts(updated);
    triggerAutoPush();
    setEditingTeacher(null);
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
    const updated = teachers.map(t => {
      if (t.id === id) {
        return { ...t, isApproved: true };
      }
      return t;
    });
    setTeachers(updated);
    saveTeacherAccounts(updated);
    triggerAutoPush();
    setSuccessMsg(`Pendaftaran guru "${name}" berhasil disetujui! Guru sekarang dapat masuk ke portal.`);
    setTimeout(() => setSuccessMsg(''), 5000);
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

        {/* Widgets / Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <Users size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Guru</span>
              <h3 className="text-2xl font-black text-slate-800">{teachers.length}</h3>
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
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                  <th className="py-4 px-5 text-center">Jumlah Siswa</th>
                  <th className="py-4 px-5 text-right">Aksi & Integrasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 font-bold">
                      Belum ada guru yang didaftarkan.
                    </td>
                  </tr>
                ) : (
                  teachers.map((t) => {
                    const spreadsheetStatus = getTeacherSpreadsheetStatus(t.username);
                    const studentCount = getTeacherStudentCount(t.username);
                    
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-800">{t.nama}</span>
                            {t.isApproved === false ? (
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
                        <td className="py-4 px-5 text-center font-mono font-bold text-slate-700">
                          {studentCount} Siswa
                        </td>
                        <td className="py-4 px-5 text-right space-x-2">
                          {t.isApproved === false ? (
                            <button
                              onClick={() => handleApproveTeacher(t.id, t.nama)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] inline-flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm shadow-emerald-100"
                              title="Setujui pendaftaran guru ini"
                            >
                              <CheckCircle2 size={12} />
                              <span>Setujui</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onImpersonateTeacher(t.username)}
                              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-bold text-[11px] inline-flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                              title="Masuk sebagai guru ini untuk mengelola datanya secara independen"
                            >
                              <span>Masuk</span>
                            </button>
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
                  Connected
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold text-[10px] uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Lokal Browser
                </span>
              )}
            </div>

            {/* Form to configure the URL */}
            <form onSubmit={handleSaveSpreadsheetUrl} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">URL Google Apps Script Web App</label>
                <input
                  type="url"
                  required
                  value={spreadsheetUrl}
                  onChange={(e) => setSpreadsheetUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-700 font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                Simpan Konfigurasi URL
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
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Guru");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({teachers: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var jsonArray = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    if (obj.isApproved === "TRUE" || obj.isApproved === true || obj.isApproved === "true") {
      obj.isApproved = true;
    } else {
      obj.isApproved = false;
    }
    jsonArray.push(obj);
  }
  return ContentService.createTextOutput(JSON.stringify({teachers: jsonArray}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var params = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Guru");
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Guru");
  }
  sheet.clear();
  var headers = ["id", "nama", "username", "password", "mataPelajaran", "isApproved", "asalSekolah"];
  sheet.appendRow(headers);
  if (params.teachers && params.teachers.length > 0) {
    for (var i = 0; i < params.teachers.length; i++) {
      var t = params.teachers[i];
      sheet.appendRow([
        t.id || "",
        t.nama || "",
        t.username || "",
        t.password || "",
        t.mataPelajaran || "",
        t.isApproved !== undefined ? t.isApproved : true,
        t.asalSekolah || ""
      ]);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
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
  var headers = data[0];
  var jsonArray = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    if (obj.isApproved === "TRUE" || obj.isApproved === true || obj.isApproved === "true") {
      obj.isApproved = true;
    } else {
      obj.isApproved = false;
    }
    jsonArray.push(obj);
  }
  return ContentService.createTextOutput(JSON.stringify({teachers: jsonArray}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var params = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Guru");
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Guru");
  }
  sheet.clear();
  var headers = ["id", "nama", "username", "password", "mataPelajaran", "isApproved", "asalSekolah"];
  sheet.appendRow(headers);
  if (params.teachers && params.teachers.length > 0) {
    for (var i = 0; i < params.teachers.length; i++) {
      var t = params.teachers[i];
      sheet.appendRow([
        t.id || "",
        t.nama || "",
        t.username || "",
        t.password || "",
        t.mataPelajaran || "",
        t.isApproved !== undefined ? t.isApproved : true,
        t.asalSekolah || ""
      ]);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
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
