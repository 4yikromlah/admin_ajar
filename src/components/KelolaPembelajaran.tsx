/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, FolderPlus, ExternalLink, Calendar, Trash2, Edit3, X, HelpCircle, FileText, CheckCircle2, Clock, ArrowLeft, Eye, AlertCircle, Lock, LockOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Pembelajaran, JenisPembelajaran, Siswa, Rangkuman } from '../types';
import { loadSiswa, loadRangkuman } from '../data';

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

interface KelolaPembelajaranProps {
  pembelajaranList: Pembelajaran[];
  onAddPembelajaran: (p: Pembelajaran) => void;
  onUpdatePembelajaran: (p: Pembelajaran) => void;
  onDeletePembelajaran: (id: string) => void;
}

export default function KelolaPembelajaran({
  pembelajaranList,
  onAddPembelajaran,
  onUpdatePembelajaran,
  onDeletePembelajaran,
}: KelolaPembelajaranProps) {
  // State Tab Aktif
  const [activeTab, setActiveTab] = useState<JenisPembelajaran>('Modul');

  // State Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedPembelajaran, setSelectedPembelajaran] = useState<Pembelajaran | null>(null);

  // State Mode Fokus (Expand) & Laporan
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [rangkumanList, setRangkumanList] = useState<Rangkuman[]>([]);
  const [selectedRangkuman, setSelectedRangkuman] = useState<Rangkuman | null>(null);
  const [inlineEditMsg, setInlineEditMsg] = useState('');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState('all');

  // State konfigurasi kelas untuk popup konten pengajaran
  const [kelasConfigPopup, setKelasConfigPopup] = useState<{
    [kelas: string]: { isActive: boolean; tanggal: string; tenggat: string };
  }>({});

  // Load data siswa dan rangkuman pada mount/expand
  useEffect(() => {
    setSiswaList(loadSiswa());
    setRangkumanList(loadRangkuman());
  }, [expandedId, showFormModal]);

  // State Formulir
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [tautan, setTautan] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [tenggat, setTenggat] = useState('');
  const [jenis, setJenis] = useState<JenisPembelajaran>('Modul');

  // Filter list berdasarkan tab aktif
  const filteredPembelajaran = pembelajaranList.filter(
    (p) => p.jenis === activeTab
  );

  // Fungsi pembantu menghitung tenggat otomatis (+3 hari)
  const get3DaysAfter = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + 3);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Ambil daftar kelas unik
  const classesFromSiswa = Array.from(new Set(siswaList.map((s) => s.kelas))).filter(Boolean).sort() as string[];
  const fallbackKelas = ['XI-MIPA-1', 'XI-MIPA-2', 'XI-IPS-1'] as string[];
  const daftarKelasList: string[] = classesFromSiswa.length > 0 ? classesFromSiswa : fallbackKelas;

  // Buka Form Tambah
  const handleOpenAdd = () => {
    setSelectedPembelajaran(null);
    setJudul('');
    setDeskripsi('');
    setTautan('');
    const today = new Date().toISOString().split('T')[0];
    setTanggal(today);
    setTenggat(get3DaysAfter(today));
    setJenis(activeTab);

    // Initialize empty config for classes
    const initialConfig: typeof kelasConfigPopup = {};
    daftarKelasList.forEach((kls) => {
      initialConfig[kls] = {
        isActive: true,
        tanggal: today,
        tenggat: get3DaysAfter(today),
      };
    });
    setKelasConfigPopup(initialConfig);

    setShowFormModal(true);
  };

  // Buka Form Edit
  const handleOpenEdit = (pembelajaran: Pembelajaran) => {
    setSelectedPembelajaran(pembelajaran);
    setJudul(pembelajaran.judul);
    setDeskripsi(pembelajaran.deskripsi);
    setTautan(pembelajaran.tautan);
    setTanggal(pembelajaran.tanggal);
    setTenggat(pembelajaran.tenggat || get3DaysAfter(pembelajaran.tanggal));
    setJenis(pembelajaran.jenis);

    // Initialize from existing config or create defaults
    const initialConfig: typeof kelasConfigPopup = {};
    const existingConfig = pembelajaran.kelasConfig || {};
    daftarKelasList.forEach((kls) => {
      if (existingConfig[kls]) {
        initialConfig[kls] = {
          isActive: existingConfig[kls].isActive,
          tanggal: existingConfig[kls].tanggal || pembelajaran.tanggal,
          tenggat: existingConfig[kls].tenggat || pembelajaran.tenggat || get3DaysAfter(pembelajaran.tanggal),
        };
      } else {
        initialConfig[kls] = {
          isActive: true,
          tanggal: pembelajaran.tanggal,
          tenggat: pembelajaran.tenggat || get3DaysAfter(pembelajaran.tanggal),
        };
      }
    });
    setKelasConfigPopup(initialConfig);

    setShowFormModal(true);
  };

  // Simpan Form (Add / Edit)
  const handleSavePembelajaran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !deskripsi.trim() || !tautan.trim()) return;

    // Filter and build clean kelasConfig to save
    const cleanKelasConfig: { [kelas: string]: { isActive: boolean; tanggal: string; tenggat: string } } = {};
    Object.keys(kelasConfigPopup).forEach((kls) => {
      const cfg = kelasConfigPopup[kls];
      cleanKelasConfig[kls] = {
        isActive: cfg.isActive,
        tanggal: cfg.tanggal || tanggal,
        tenggat: cfg.isActive && jenis !== 'Modul' ? (cfg.tenggat || get3DaysAfter(cfg.tanggal || tanggal)) : '',
      };
    });

    if (selectedPembelajaran) {
      // Edit
      onUpdatePembelajaran({
        ...selectedPembelajaran,
        judul,
        deskripsi,
        tautan,
        tanggal,
        tenggat: jenis === 'Modul' ? '' : (tenggat || get3DaysAfter(tanggal)),
        jenis,
        kelasConfig: cleanKelasConfig,
      });
    } else {
      // Tambah Baru
      const baru: Pembelajaran = {
        id: `M${Date.now()}`,
        judul,
        deskripsi,
        tautan,
        tanggal,
        tenggat: jenis === 'Modul' ? '' : (tenggat || get3DaysAfter(tanggal)),
        jenis,
        kelasConfig: cleanKelasConfig,
      };
      onAddPembelajaran(baru);
    }
    setShowFormModal(false);
  };

  // Hapus Pembelajaran (Dengan Konfirmasi Aman)
  const handleHapusPembelajaran = (p: Pembelajaran) => {
    const konfirmasi = window.confirm(
      `Apakah Anda yakin ingin menghapus materi:\n\n[${p.jenis}] ${p.judul}\n\nTautan luar yang disimpan juga akan dihapus dari portal.`
    );
    if (konfirmasi) {
      onDeletePembelajaran(p.id);
    }
  };

  const expandedMateri = pembelajaranList.find((p) => p.id === expandedId);

  if (expandedId && expandedMateri) {
    const submissions = rangkumanList.filter((r) => r.pembelajaranId === expandedMateri.id);
    const status = getTenggatStatus(expandedMateri);
    const isOverdue = status ? (status.diffDays < 0 && !expandedMateri.isUnlocked) : false;

    // Get unique classes from submissions to populate the select filter options
    const uniqueClassesForFilter = Array.from(new Set(submissions.map((sub) => {
      const s = siswaList.find((siswa) => siswa.id === sub.siswaId);
      return s?.kelas;
    }).filter(Boolean))).sort() as string[];

    const filteredSubmissions = submissions.filter((sub) => {
      if (selectedKelasFilter === 'all') return true;
      const s = siswaList.find((siswa) => siswa.id === sub.siswaId);
      return s?.kelas === selectedKelasFilter;
    });
    
    const handleSaveInline = (e: React.FormEvent) => {
      e.preventDefault();
      if (isOverdue) return;
      onUpdatePembelajaran({
        ...expandedMateri,
        judul,
        deskripsi,
        tautan,
        tanggal,
        tenggat: jenis === 'Modul' ? '' : (tenggat || get3DaysAfter(tanggal)),
        jenis,
      });
      setInlineEditMsg('Materi berhasil diperbarui!');
      setTimeout(() => setInlineEditMsg(''), 3000);
    };

    return (
      <div className="space-y-6">
        {/* Header Mode Fokus */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setExpandedId(null);
                setInlineEditMsg('');
              }}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center cursor-pointer"
              title="Kembali"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black uppercase tracking-wider">
                  Mode Fokus Guru
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  expandedMateri.jenis === 'Modul' ? 'bg-indigo-50 text-indigo-700' :
                  expandedMateri.jenis === 'Literasi' ? 'bg-emerald-50 text-emerald-700' : 'bg-pink-50 text-pink-700'
                }`}>
                  {expandedMateri.jenis}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight mt-1">
                {expandedMateri.judul}
              </h2>
            </div>
          </div>
          <button
            onClick={() => {
              setExpandedId(null);
              setInlineEditMsg('');
            }}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            Selesai Fokus
          </button>
        </div>

        {/* Layout Kolom Fokus */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* SISI KIRI: Formulir Pengeditan Mandiri (Fokus Guru) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5 text-pink-600">
                <Edit3 size={14} /> Edit & Detail Materi
              </h3>

              {isOverdue && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-2xl text-xs font-bold border border-rose-200/60 flex items-center gap-1.5 leading-relaxed">
                  <AlertCircle size={15} className="shrink-0 text-rose-500" />
                  <span>Materi ini telah melewati tenggat waktu dan bersifat terkunci (tidak dapat diubah).</span>
                </div>
              )}

              {inlineEditMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 animate-pulse">
                  {inlineEditMsg}
                </div>
              )}

              <form onSubmit={handleSaveInline} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Jenis Materi
                  </label>
                  <select
                    value={jenis}
                    onChange={(e: any) => setJenis(e.target.value)}
                    disabled={isOverdue}
                    className={`w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none ${
                      isOverdue ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="Modul">Modul (Bahan Bacaan/Slide)</option>
                    <option value="Literasi">Literasi (Artikel/Wawasan Eksternal)</option>
                    <option value="Tugas/Tes">Tugas / Kuis Evaluasi</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Judul Materi / Tugas
                  </label>
                  <input
                    type="text"
                    required
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    disabled={isOverdue}
                    className={`w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/25 ${
                      isOverdue ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Deskripsi / Instruksi
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    disabled={isOverdue}
                    className={`w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/25 resize-none ${
                      isOverdue ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={jenis === 'Modul' ? 'col-span-2' : 'col-span-1'}>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Tanggal Terbit
                    </label>
                    <input
                      type="date"
                      required
                      value={tanggal}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTanggal(val);
                        setTenggat(get3DaysAfter(val));
                      }}
                      disabled={isOverdue}
                      className={`w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none ${
                        isOverdue ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                  {jenis !== 'Modul' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase text-rose-600 block mb-1 flex items-center gap-0.5">
                        <Clock size={10} /> Tenggat (+3h)
                      </label>
                      <input
                        type="date"
                        required={jenis !== 'Modul'}
                        value={tenggat}
                        disabled
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-100 bg-slate-50 focus:outline-none font-bold text-rose-400 cursor-not-allowed"
                        title="Dihitung otomatis 3 hari dari Tanggal Terbit"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Tautan Sumber Luar (Google Drive/Form)
                  </label>
                  <input
                    type="url"
                    required
                    value={tautan}
                    onChange={(e) => setTautan(e.target.value)}
                    disabled={isOverdue}
                    className={`w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/25 ${
                      isOverdue ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  {isOverdue ? (
                    <button
                      type="button"
                      disabled
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Lock size={12} className="shrink-0" />
                      <span>Form Terkunci (Tenggat Lewat)</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                  )}
                  <a
                    href={expandedMateri.tautan}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                    title="Buka Tautan Asli"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </form>
            </div>
          </div>

          {/* SISI KANAN: Laporan Hasil Literasi Siswa */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm min-h-[400px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  {expandedMateri.jenis === 'Literasi' ? 'Laporan Penyelesaian Literasi Siswa' : 'Informasi Tambahan'}
                </h3>
                
                {expandedMateri.jenis === 'Literasi' && submissions.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase">Kelas:</span>
                    <select
                      value={selectedKelasFilter}
                      onChange={(e) => setSelectedKelasFilter(e.target.value)}
                      className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-600 cursor-pointer"
                    >
                      <option value="all">Semua Kelas ({submissions.length})</option>
                      {uniqueClassesForFilter.map((kls) => {
                        const count = submissions.filter(sub => {
                          const s = siswaList.find(siswa => siswa.id === sub.siswaId);
                          return s?.kelas === kls;
                        }).length;
                        return (
                          <option key={kls} value={kls}>{kls} ({count})</option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              {expandedMateri.jenis !== 'Literasi' ? (
                <div className="py-12 px-6 text-center text-slate-500 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mx-auto">
                    <HelpCircle size={24} />
                  </div>
                  <p className="text-xs font-bold">Laporan Ringkasan Dinonaktifkan</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Materi jenis ini tidak membutuhkan pengumpulan rangkuman siswa. Fitur rangkuman literasi hanya aktif pada materi berkategori <b>Literasi</b>.
                  </p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="py-16 px-6 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                    <AlertCircle size={22} />
                  </div>
                  <p className="text-xs font-bold text-slate-600">Belum Ada Siswa Mengirimkan Literasi</p>
                  <p className="text-[11px] text-slate-400 leading-normal max-w-sm mx-auto">
                    Siswa Anda belum mengirimkan tugas rangkuman literasi di dashboard siswa mereka untuk materi ini.
                  </p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="py-16 px-6 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                    <AlertCircle size={22} />
                  </div>
                  <p className="text-xs font-bold text-slate-600">Belum Ada Siswa di Kelas {selectedKelasFilter}</p>
                  <p className="text-[11px] text-slate-400 leading-normal max-w-sm mx-auto">
                    Belum ada siswa dari kelas {selectedKelasFilter} yang mengirimkan tugas rangkuman literasi untuk materi ini.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-2.5">Siswa</th>
                        <th className="py-2.5">Kelas</th>
                        <th className="py-2.5 text-center">Tanggal Kirim</th>
                        <th className="py-2.5 text-center">Kata</th>
                        <th className="py-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSubmissions.map((sub) => {
                        const siswa = siswaList.find((s) => s.id === sub.siswaId);
                        const wordCount = sub.isi.trim().split(/\s+/).filter(Boolean).length;
                        return (
                          <tr key={sub.id} className="hover:bg-slate-50/50">
                            <td className="py-3">
                              <div className="font-bold text-slate-800">{siswa?.nama || 'Siswa Hilang'}</div>
                              <div className="text-[10px] text-slate-400">NIS: {siswa?.nis || '-'}</div>
                            </td>
                            <td className="py-3 text-slate-600 font-medium">
                              {siswa?.kelas || '-'}
                            </td>
                            <td className="py-3 text-center text-slate-500 font-mono text-[11px]">
                              {sub.tanggal}
                            </td>
                            <td className="py-3 text-center font-mono">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                wordCount >= 200 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {wordCount} kata
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => setSelectedRangkuman(sub)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-[10px] transition-colors cursor-pointer"
                              >
                                <Eye size={11} /> Lihat
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DIALOG DETAIL RANGKUMAN (MODAL OVERLAY) */}
        <AnimatePresence>
          {selectedRangkuman && (() => {
            const siswa = siswaList.find((s) => s.id === selectedRangkuman.siswaId);
            const wordCount = selectedRangkuman.isi.trim().split(/\s+/).filter(Boolean).length;
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedRangkuman(null)}
                  className="absolute inset-0"
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 15 }}
                  className="relative w-full max-w-2xl bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 z-10 max-h-[85vh] flex flex-col"
                >
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                          Sudah Selesai
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Diserahkan: {selectedRangkuman.tanggal}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm mt-1">
                        Rangkuman Literasi: {siswa?.nama} ({siswa?.kelas})
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedRangkuman(null)}
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Konten Literasi Yang Ditulis Oleh Siswa:
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                        {selectedRangkuman.isi}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between items-center text-[10px]">
                    <div className="text-slate-400">
                      Total: <span className="font-bold text-slate-700">{wordCount} kata</span> (Minimal target 200 kata)
                    </div>
                    <button
                      onClick={() => setSelectedRangkuman(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs cursor-pointer"
                    >
                      Tutup Review
                    </button>
                  </div>
                </motion.div>
              </div>
            );
          })()}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className="text-pink-600 w-6 h-6" /> Kelola Pembelajaran Informatika
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Atur kurikulum, modul PDF, bahan literasi web, dan kuis online untuk siswa</p>
        </div>
        <div>
          <button
            onClick={handleOpenAdd}
            className="neu-flat-sm px-4 py-2.5 rounded-xl bg-pink-50 text-pink-700 font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95"
            id="btn-open-add-pembelajaran"
          >
            <FolderPlus size={14} className="text-pink-700" />
            <span>Tambah Materi</span>
          </button>
        </div>
      </div>

      {/* Sub-Menu Tabs (Modul, Literasi, Tugas/Tes) */}
      <div className="flex rounded-2xl p-1.5 bg-slate-100 shadow-[inset_2px_2px_4px_#cbd5e1,inset_-2px_-2px_4px_#ffffff]">
        {(['Modul', 'Literasi', 'Tugas/Tes'] as JenisPembelajaran[]).map((tab) => {
          const isCurrent = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-center py-3.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
                isCurrent
                  ? 'text-pink-600 bg-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id={`tab-pembelajaran-${tab.toLowerCase().replace('/', '-')}`}
            >
              <span>{tab}</span>
            </button>
          );
        })}
      </div>

      {/* Grid Materi Pembelajaran */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPembelajaran.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            Belum ada konten untuk kategori **{activeTab}**. Silakan buat materi baru untuk memulai pengajaran.
          </div>
        ) : (
          filteredPembelajaran.map((materi, idx) => (
            <motion.div
              key={materi.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => {
                setJudul(materi.judul);
                setDeskripsi(materi.deskripsi);
                setTautan(materi.tautan);
                setTanggal(materi.tanggal);
                setTenggat(materi.tenggat || get3DaysAfter(materi.tanggal));
                setJenis(materi.jenis);
                setExpandedId(materi.id);
              }}
              className="neu-flat p-6 rounded-3xl flex flex-col justify-between group relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-pink-500/25 transition-all duration-200 hover:shadow-lg"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl shadow-inner ${
                    materi.jenis === 'Modul' ? 'text-indigo-600 bg-indigo-50' :
                    materi.jenis === 'Literasi' ? 'text-emerald-600 bg-emerald-50' : 'text-pink-600 bg-pink-50'
                  }`}>
                    {materi.jenis === 'Modul' ? <FileText size={18} /> :
                     materi.jenis === 'Literasi' ? <CheckCircle2 size={18} /> : <HelpCircle size={18} />}
                  </div>
                  {(() => {
                    const mStatus = getTenggatStatus(materi);
                    const mOverdue = mStatus ? (mStatus.diffDays < 0) : false;

                    return (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Lock / Unlock Icon Toggle */}
                        {mOverdue && (
                          materi.isUnlocked ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdatePembelajaran({ ...materi, isUnlocked: false });
                              }}
                              className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 hover:bg-emerald-100 transition-all cursor-pointer"
                              title="Tenggat Terlewati (Akses Dibuka manual). Klik untuk mengunci kembali."
                            >
                              <LockOpen size={11} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdatePembelajaran({ ...materi, isUnlocked: true });
                              }}
                              className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shrink-0 hover:bg-rose-100 transition-all cursor-pointer"
                              title="Tenggat Terlewati (Akses Terkunci). Klik untuk membuka akses bagi siswa."
                            >
                              <Lock size={11} />
                            </button>
                          )
                        )}

                        <div className="flex gap-1.5 transition-all">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(materi);
                            }}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-50/50 transition-all cursor-pointer shadow-sm"
                            id={`btn-edit-materi-${materi.id}`}
                            title="Ubah Materi"
                          >
                            <Edit3 size={11} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleHapusPembelajaran(materi);
                            }}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-rose-500 hover:bg-rose-50/50 transition-all cursor-pointer shadow-sm"
                            id={`btn-delete-materi-${materi.id}`}
                            title="Hapus Materi"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-800 text-sm leading-tight tracking-tight group-hover:text-pink-600 transition-colors">
                    {materi.judul}
                  </h3>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar size={10} /> Diterbitkan: {materi.tanggal}
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed max-w-sm line-clamp-3">
                  {materi.deskripsi}
                </p>

                {/* Tenggat Waktu Indicator */}
                {(() => {
                  const status = getTenggatStatus(materi);
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
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold mt-2 ${badgeClass}`}>
                      <Clock size={11} className={isNearOrPast ? "text-rose-600 shrink-0" : "text-slate-400 shrink-0"} />
                      <span className="tracking-wide uppercase">{label}</span>
                    </div>
                  );
                })()}

                {/* Indikator Expand & Focus */}
                <div className="text-[10px] text-pink-600 font-bold mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Eye size={11} />
                  <span>Klik Kartu untuk Mode Fokus & Laporan</span>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-100">
                <a
                  href={materi.tautan}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-100/50 hover:bg-white/80 flex items-center justify-center gap-2 text-slate-700 font-bold text-xs transition-colors shadow-sm cursor-pointer"
                >
                  <span>Buka Tautan Materi</span>
                  <ExternalLink size={12} className="text-slate-400" />
                </a>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* DIALOG FORM MODAL (ADD / EDIT) */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFormModal(false)}
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-neu-bg p-6 rounded-3xl shadow-2xl border border-white/50 z-10"
              id="form-pembelajaran-modal"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-sm">
                  {selectedPembelajaran ? 'Ubah Konten Pengajaran' : 'Tambahkan Konten Pengajaran'}
                </h3>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSavePembelajaran} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                    Jenis Pembelajaran
                  </label>
                  <select
                    value={jenis}
                    onChange={(e: any) => setJenis(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                  >
                    <option value="Modul">Modul (Bahan Bacaan/Slide)</option>
                    <option value="Literasi">Literasi (Artikel/Wawasan Eksternal)</option>
                    <option value="Tugas/Tes">Tugas / Kuis Evaluasi</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                    Judul Pengajaran / Tugas
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Modul Pemrograman Dasar Python"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/25"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                    Ringkasan Deskripsi Pengajaran
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tulis poin penting materi ini atau petunjuk pengerjaan kuis/tugas bagi siswa..."
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/25 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                    Tautan Sumber Belajar / Tugas / Tes
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={tautan}
                    onChange={(e) => setTautan(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/25"
                  />
                </div>

                {/* Class Activation Section (As Requested) */}
                <div className="border-t border-slate-200/60 pt-4 space-y-3">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                    Aktivasi &amp; Tanggal Khusus Per Kelas
                  </span>
                  
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {daftarKelasList.map((kls) => {
                      const cfg = kelasConfigPopup[kls] || {
                        isActive: false,
                        tanggal: tanggal || new Date().toISOString().split('T')[0],
                        tenggat: tenggat || get3DaysAfter(tanggal || new Date().toISOString().split('T')[0])
                      };
                      return (
                        <div key={kls} className="p-3 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">{kls}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setKelasConfigPopup((prev) => ({
                                  ...prev,
                                  [kls]: {
                                    ...cfg,
                                    isActive: !cfg.isActive,
                                    tanggal: cfg.tanggal || tanggal || new Date().toISOString().split('T')[0],
                                    tenggat: cfg.tenggat || tenggat || get3DaysAfter(tanggal || new Date().toISOString().split('T')[0]),
                                  }
                                }));
                              }}
                              className={`px-2 py-1 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                                cfg.isActive 
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                  : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                              }`}
                              title={cfg.isActive ? 'Nonaktifkan Kelas' : 'Aktifkan Kelas'}
                            >
                              {cfg.isActive ? <LockOpen size={11} className="mr-1" /> : <Lock size={11} className="mr-1" />}
                              <span className="text-[9px] font-extrabold uppercase">
                                {cfg.isActive ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </button>
                          </div>

                          {/* Show tanggal terbit and tenggat input if active */}
                          {cfg.isActive && (
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50">
                              <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                                  Tgl Terbit
                                </label>
                                <input
                                  type="date"
                                  required={cfg.isActive}
                                  value={cfg.tanggal}
                                  onChange={(e) => {
                                    const newDate = e.target.value;
                                    setKelasConfigPopup((prev) => ({
                                      ...prev,
                                      [kls]: {
                                        ...cfg,
                                        tanggal: newDate,
                                        tenggat: get3DaysAfter(newDate)
                                      }
                                    }));
                                  }}
                                  className="w-full text-[10px] p-2 rounded-lg border border-slate-200 bg-white"
                                />
                              </div>
                              {jenis !== 'Modul' && (
                                <div>
                                  <label className="text-[9px] font-bold text-rose-600 uppercase block mb-1">
                                    Tenggat (+3h)
                                  </label>
                                  <input
                                    type="date"
                                    disabled
                                    value={cfg.tenggat}
                                    className="w-full text-[10px] p-2 rounded-lg border border-slate-100 bg-slate-50 font-bold text-rose-400 cursor-not-allowed"
                                    title="Dihitung otomatis 3 hari dari Tgl Terbit"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-xl shadow-md"
                  >
                    Simpan Materi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
