/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, Award, CalendarCheck, BookOpen, BellRing, Plus, Trash2, ArrowRight, Star, Database, RefreshCw, CheckCircle2, AlertCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'motion/react';
import { Siswa, Nilai, Presensi, Pembelajaran, Pengumuman, AppSettings } from '../types';
import SyncStatusIndicator from './SyncStatusIndicator';

interface DashboardProps {
  siswaList: Siswa[];
  nilaiList: Nilai[];
  presensiList: Presensi[];
  pembelajaranList: Pembelajaran[];
  pengumumanList: Pengumuman[];
  setCurrentMenu: (menu: string) => void;
  onAddPengumuman: (p: Pengumuman) => void;
  onDeletePengumuman: (id: string) => void;
  settings: AppSettings;
  onSyncSpreadsheet?: () => Promise<void>;
  isOnline?: boolean;
  isSyncing?: boolean;
  syncError?: string | null;
  lastSyncTime?: Date | null;
}

export default function Dashboard({
  siswaList,
  nilaiList,
  presensiList,
  pembelajaranList,
  pengumumanList,
  setCurrentMenu,
  onAddPengumuman,
  onDeletePengumuman,
  settings,
  onSyncSpreadsheet,
  isOnline = true,
  isSyncing = false,
  syncError = null,
  lastSyncTime = null,
}: DashboardProps) {
  const [showAddAnnounce, setShowAddAnnounce] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'Penting' | 'Info' | 'Tugas'>('Info');

  const [localSyncing, setLocalSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const activeSyncing = isSyncing || localSyncing;

  const handleSync = async () => {
    if (!onSyncSpreadsheet) return;
    setLocalSyncing(true);
    setSyncMessage('');
    try {
      await onSyncSpreadsheet();
      setSyncMessage('Database Google Spreadsheet berhasil disinkronkan!');
      setTimeout(() => setSyncMessage(''), 4000);
    } catch (e) {
      setSyncMessage('Sinkronisasi gagal. Silakan periksa URL Google Apps Script Anda.');
      setTimeout(() => setSyncMessage(''), 5000);
    } finally {
      setLocalSyncing(false);
    }
  };

  // Hitung statistik
  const totalSiswa = siswaList.length;
  const totalMateri = pembelajaranList.length;

  const rataNilai = nilaiList.length > 0 
    ? (nilaiList.reduce((acc, curr) => acc + curr.total, 0) / nilaiList.length).toFixed(1)
    : '0';

  const kehadiranHariIni = (() => {
    if (presensiList.length === 0) return 100;
    const hadir = presensiList.filter(p => p.status === 'Hadir').length;
    return Math.round((hadir / presensiList.length) * 100);
  })();

  // Handler simpan pengumuman baru
  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const announce: Pengumuman = {
      id: `A${Date.now()}`,
      judul: newTitle,
      isi: newContent,
      tanggal: new Date().toISOString().split('T')[0],
      kategori: newCategory,
    };

    onAddPengumuman(announce);
    setNewTitle('');
    setNewContent('');
    setShowAddAnnounce(false);
  };

  // Hitung distribusi nilai untuk SVG Chart
  const gradeDistribution = (() => {
    const dist = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    nilaiList.forEach(n => {
      const g = n.grade as keyof typeof dist;
      if (dist[g] !== undefined) {
        dist[g]++;
      }
    });
    return dist;
  })();

  const maxGradeCount = Math.max(...Object.values(gradeDistribution), 1);

  return (
    <div className="space-y-8 pb-16">
      {/* Welcome Banner (Glassmorphism + Neumorphic base) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-lg border border-white/40"
      >
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-200/40 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-[-10%] left-[20%] w-48 h-48 bg-blue-200/30 rounded-full blur-2xl -z-10" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 text-xs font-semibold tracking-wide">
                Semester Ganjil {settings.tahunPelajaran || '2025/2026'}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                <Star size={12} fill="currentColor" /> Kurikulum Merdeka
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
              Selamat Datang, Bapak/Ibu Guru! 👋
            </h1>
            <p className="text-slate-600 mt-2 text-sm max-w-xl leading-relaxed">
              Selamat datang di portal pembelajaran **{settings.kopSekolah || 'SMASA-Online'}**. Di sini Anda dapat memantau perkembangan siswa, mengelola kurikulum koding, dan menganalisis nilai harian {settings.mataPelajaran || 'Informatika'} secara real-time.
            </p>
            {localStorage.getItem('lastLoggedInTime') && (
              <div className="mt-4 flex flex-wrap items-center gap-2 bg-white/65 border border-white/40 py-2 px-3 rounded-xl text-slate-600 text-xs shadow-sm w-fit">
                <Clock size={14} className="text-blue-500 shrink-0" />
                <span>
                  Login Terakhir: <strong>{localStorage.getItem('lastLoggedInTime')}</strong> di <strong>{localStorage.getItem('lastLoggedInSchoolName') || settings.kopSekolah}</strong>
                </span>
                {localStorage.getItem('lastLoggedInSchoolLogo') && (
                  <img
                    src={localStorage.getItem('lastLoggedInSchoolLogo')!}
                    alt="Logo"
                    className="w-4 h-4 rounded object-cover ml-1 shadow-sm shrink-0"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setCurrentMenu('pembelajaran')}
            className="neu-flat px-5 py-3 rounded-2xl flex items-center gap-2 text-blue-600 font-semibold text-sm cursor-pointer group shrink-0 active:scale-95"
            id="btn-add-materials"
          >
            <span>Unggah Materi Baru</span>
            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>
      </motion.div>

      {/* Google Spreadsheet Sync Banner */}
      <div className="w-full">
        {settings.spreadsheetUrl ? (
          <div className="p-4 rounded-3xl bg-emerald-50/80 border border-emerald-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 shadow-sm">
                <Database size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none">Database Google Spreadsheet</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <h3 className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-2">
                  <span>Sinkronisasi Data Guru</span>
                  {lastSyncTime && (
                    <span className="text-[10px] font-normal text-slate-500">
                      (Terakhir: {lastSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono truncate max-w-xs md:max-w-md">{settings.spreadsheetUrl}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto self-stretch sm:self-auto justify-end">
              {syncMessage && (
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  {syncMessage}
                </span>
              )}
              
              <SyncStatusIndicator
                isOnline={isOnline}
                spreadsheetUrl={settings.spreadsheetUrl}
                isSyncing={activeSyncing}
                syncError={syncError}
                lastSyncTime={lastSyncTime}
                onManualSync={handleSync}
              />

              <button
                onClick={handleSync}
                disabled={activeSyncing}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-100/50 border border-slate-200 hover:border-emerald-300 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={12} className={`text-slate-500 ${activeSyncing ? 'animate-spin text-emerald-600' : ''}`} />
                <span>{activeSyncing ? 'Menyinkronkan...' : 'Sinkronkan'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-3xl bg-amber-50/50 border border-amber-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100/70 flex items-center justify-center text-amber-700 shrink-0">
                <AlertCircle size={18} />
              </div>
              <div>
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest leading-none">Database Penyimpanan Lokal</span>
                <h3 className="text-xs font-bold text-slate-800 mt-1">Belum Terhubung ke Google Spreadsheet</h3>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Data Anda saat ini disimpan secara lokal di peramban ini. Hubungkan Spreadsheet Anda sebagai database utama agar data aman dan siap dideploy secara permanen.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <SyncStatusIndicator
                isOnline={isOnline}
                spreadsheetUrl={settings.spreadsheetUrl}
                isSyncing={isSyncing}
                syncError={syncError}
                lastSyncTime={lastSyncTime}
              />
              <button
                onClick={() => setCurrentMenu('settings')}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-amber-100 shrink-0 active:scale-95"
              >
                <Database size={12} />
                <span>Hubungkan Spreadsheet</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards (4 Grid Neumorphic Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Siswa', val: `${totalSiswa} Siswa`, desc: 'Terdaftar aktif', icon: Users, col: 'text-blue-600 bg-blue-50', link: 'siswa' },
          { label: 'Rata-rata Nilai', val: rataNilai, desc: 'Evaluasi harian', icon: Award, col: 'text-emerald-600 bg-emerald-50', link: 'nilai' },
          { label: 'Kehadiran Hari Ini', val: `${kehadiranHariIni}%`, desc: 'Siswa masuk hari ini', icon: CalendarCheck, col: 'text-amber-600 bg-amber-50', link: 'presensi' },
          { label: 'Materi & Kuis', val: `${totalMateri} Modul`, desc: 'Modul aktif', icon: BookOpen, col: 'text-pink-600 bg-pink-50', link: 'pembelajaran' }
        ].map((s, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => setCurrentMenu(s.link)}
            className="neu-flat p-6 rounded-3xl flex flex-col justify-between cursor-pointer group hover:scale-[1.02]"
            id={`stat-card-${idx}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
                <h3 className="text-2xl font-extrabold text-slate-800 mt-2 tracking-tight group-hover:text-blue-600 transition-colors">{s.val}</h3>
              </div>
              <div className={`p-3.5 rounded-2xl shadow-inner ${s.col}`}>
                <s.icon size={20} />
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">{s.desc}</span>
              <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid Content (Charts & Announcements) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Distribusi Nilai Chart (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="neu-flat p-6 rounded-3xl">
            <h3 className="font-bold text-slate-800 text-base mb-1">Distribusi Nilai Siswa</h3>
            <p className="text-xs text-slate-500 mb-6">Sebaran nilai akhir harian siswa kelas Informatika XI</p>
            
            {/* Custom Neumorphic SVG Chart */}
            <div className="w-full flex items-end justify-between h-56 pt-6 px-4 pb-2 border-b border-slate-200">
              {Object.entries(gradeDistribution).map(([grade, count]) => {
                const heightPercent = maxGradeCount > 0 ? (count / maxGradeCount) * 100 : 0;
                return (
                  <div key={grade} className="flex flex-col items-center w-12 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-800 text-white text-[10px] py-1 px-2 rounded-lg shadow-md font-bold whitespace-nowrap z-10">
                      {count} Siswa ({Math.round(totalSiswa > 0 ? (count / totalSiswa) * 100 : 0)}%)
                    </div>
                    
                    {/* Bar Container */}
                    <div className="w-8 bg-slate-100 rounded-lg h-40 flex items-end relative overflow-hidden shadow-[inset_2px_2px_4px_#cbd5e1,inset_-2px_-2px_4px_#ffffff]">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ duration: 0.8, type: 'spring' }}
                        className={`w-full rounded-b-lg rounded-t-sm bg-gradient-to-t ${
                          grade === 'A' ? 'from-blue-600 to-blue-500' :
                          grade === 'B' ? 'from-sky-500 to-sky-400' :
                          grade === 'C' ? 'from-emerald-500 to-emerald-400' :
                          grade === 'D' ? 'from-amber-500 to-amber-400' : 'from-rose-500 to-rose-400'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600 mt-2.5">{grade}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" />
                <span>Grade A (Sangat Baik / &ge; 85)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-sky-500 inline-block" />
                <span>Grade B (Baik / 75-84)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                <span>Grade C (Cukup / 60-74)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
                <span>Grade E (Kurang / &lt; 45)</span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="neu-flat p-6 rounded-3xl">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Pintasan Cepat Manajemen</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setCurrentMenu('siswa')}
                className="p-3.5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 text-left transition-all active:scale-95"
                id="shortcut-siswa"
              >
                <h4 className="text-xs font-bold text-slate-800">Siswa Baru</h4>
                <p className="text-[10px] text-slate-500 mt-1">Tambah data dan import CSV siswa</p>
              </button>
              <button
                onClick={() => setCurrentMenu('nilai')}
                className="p-3.5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 text-left transition-all active:scale-95"
                id="shortcut-nilai"
              >
                <h4 className="text-xs font-bold text-slate-800">Isi Nilai Tugas</h4>
                <p className="text-[10px] text-slate-500 mt-1">Kelola perolehan tugas harian</p>
              </button>
              <button
                onClick={() => setCurrentMenu('presensi')}
                className="p-3.5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 text-left transition-all active:scale-95"
                id="shortcut-presensi"
              >
                <h4 className="text-xs font-bold text-slate-800">Absensi Hari Ini</h4>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">Lakukan rekap kehadiran siswa</p>
              </button>
              <button
                onClick={() => setCurrentMenu('laporan')}
                className="p-3.5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 text-left transition-all active:scale-95"
                id="shortcut-laporan"
              >
                <h4 className="text-xs font-bold text-slate-800">Buku Laporan</h4>
                <p className="text-[10px] text-slate-500 mt-1">Cetak / Analisis performa siswa</p>
              </button>
            </div>
          </div>
        </div>

        {/* Announcements & Notifications Board (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="neu-flat p-6 rounded-3xl h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <BellRing size={16} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">Mading & Pengumuman</h3>
                </div>
                <button
                  onClick={() => setShowAddAnnounce(!showAddAnnounce)}
                  className="w-8 h-8 rounded-xl neu-flat-sm flex items-center justify-center text-blue-600 cursor-pointer active:scale-95"
                  id="btn-toggle-announce"
                  title="Buat Pengumuman"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Form Input Pengumuman Baru */}
              {showAddAnnounce && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  onSubmit={handleSaveAnnouncement}
                  className="mb-6 p-4 rounded-2xl neu-inset space-y-3"
                  id="form-new-announcement"
                >
                  <div className="text-xs font-bold text-slate-700">Buat Mading Baru</div>
                  <input
                    type="text"
                    placeholder="Judul Pengumuman"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  />
                  <textarea
                    placeholder="Ketik detail mading..."
                    required
                    rows={2}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <select
                      value={newCategory}
                      onChange={(e: any) => setNewCategory(e.target.value)}
                      className="text-[11px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Info">Info</option>
                      <option value="Penting">Penting</option>
                      <option value="Tugas">Tugas</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddAnnounce(false)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-700 px-2.5 py-1.5"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5 shadow-sm shadow-blue-100"
                      >
                        Terbitkan
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}

              {/* List Mading */}
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {pengumumanList.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Belum ada pengumuman hari ini.
                  </div>
                ) : (
                  pengumumanList.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 rounded-2xl border border-slate-100/80 bg-white/40 hover:bg-white/75 transition-all group flex gap-3 items-start relative"
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          ann.kategori === 'Penting' ? 'bg-rose-500 animate-pulse' :
                          ann.kategori === 'Tugas' ? 'bg-blue-500' : 'bg-emerald-500'
                        }`}
                      />
                      <div className="space-y-1 pr-6 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-800 leading-tight">{ann.judul}</h4>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            ann.kategori === 'Penting' ? 'bg-rose-50 text-rose-600' :
                            ann.kategori === 'Tugas' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {ann.kategori}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{ann.isi}</p>
                        <span className="text-[9px] text-slate-400 block pt-1">{ann.tanggal}</span>
                      </div>
                      <button
                        onClick={() => onDeletePengumuman(ann.id)}
                        className="absolute right-3 top-3.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity p-1 cursor-pointer"
                        title="Hapus Mading"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Google Sheets Apps Script Comment */}
            <div className="text-[10px] text-slate-400 mt-6 pt-4 border-t border-slate-100 italic leading-snug">
              * Mading dan statistik ini bersumber dari LocalStorage. Saat dihubungkan ke Google Apps Script, fungsi getSiswa() dan getNilai() di data.ts akan di-fetch langsung dari Google Sheets.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
