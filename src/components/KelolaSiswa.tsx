/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Search, UserPlus, Upload, Trash2, Edit3, X, FileSpreadsheet, Check, AlertCircle, GraduationCap, Download, Eye, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Siswa } from '../types';

interface KelolaSiswaProps {
  siswaList: Siswa[];
  onAddSiswa: (s: Siswa) => void;
  onUpdateSiswa: (s: Siswa) => void;
  onDeleteSiswa: (id: string) => void;
  onImportSiswa: (list: Siswa[]) => void;
}

export default function KelolaSiswa({
  siswaList,
  onAddSiswa,
  onUpdateSiswa,
  onDeleteSiswa,
  onImportSiswa,
}: KelolaSiswaProps) {
  // State Pencarian & Filter
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('');

  // State Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [viewingSiswa, setViewingSiswa] = useState<Siswa | null>(null);

  // State Formulir
  const [nis, setNis] = useState('');
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('XI-MIPA-1');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // State Import CSV
  const [dragActive, setDragActive] = useState(false);
  const [importPreview, setImportPreview] = useState<Siswa[]>([]);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter List Siswa
  const filteredSiswa = siswaList.filter((s) => {
    const matchesSearch =
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesKelas = filterKelas === '' || s.kelas === filterKelas;
    return matchesSearch && matchesKelas;
  });

  // Ambil daftar kelas unik untuk filter dropdown
  const uniqueKelasList = Array.from(new Set(siswaList.map((s) => s.kelas)));

  // Buka Form Tambah
  const handleOpenAdd = () => {
    setSelectedSiswa(null);
    setNis('');
    setNama('');
    setKelas('XI-MIPA-1');
    setEmail('');
    setUsername('');
    setPassword('');
    setShowFormModal(true);
  };

  // Buka Form Edit
  const handleOpenEdit = (siswa: Siswa) => {
    setSelectedSiswa(siswa);
    setNis(siswa.nis);
    setNama(siswa.nama);
    setKelas(siswa.kelas);
    setEmail(siswa.email);
    setUsername(siswa.username || siswa.nis);
    setPassword(siswa.password || 'smasa123');
    setShowFormModal(true);
  };

  // Simpan/Edit Siswa
  const handleSaveSiswa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis.trim() || !nama.trim() || !email.trim()) return;

    if (selectedSiswa) {
      // Edit mode
      onUpdateSiswa({
        ...selectedSiswa,
        nis,
        nama,
        kelas,
        email,
        username: username.trim() || nis.trim(),
        password: password.trim() || 'smasa123',
      });
    } else {
      // Tambah baru
      const baru: Siswa = {
        id: `S${Date.now()}`,
        nis,
        nama,
        kelas,
        email,
        username: username.trim() || nis.trim(),
        password: password.trim() || 'smasa123',
      };
      onAddSiswa(baru);
    }
    setShowFormModal(false);
  };

  // Hapus Siswa (Dengan Konfirmasi Aman)
  const handleHapusSiswa = (siswa: Siswa) => {
    const konfirmasi = window.confirm(
      `Apakah Anda yakin ingin menghapus data siswa:\n\nNama: ${siswa.nama}\nNISN: ${siswa.nis}\n\nTindakan ini juga akan menghapus data nilai & presensi terkait jika ada.`
    );
    if (konfirmasi) {
      onDeleteSiswa(siswa.id);
    }
  };

  // Download Template CSV
  const handleDownloadTemplate = () => {
    const csvContent = "nisn,nama,kelas,email,username,password\n"
      + "12401,Ahmad Dahlan,XI-MIPA-1,ahmad@smasa.sch.id,12401,smasa123\n"
      + "12402,Budi Utomo,XI-MIPA-1,budi@smasa.sch.id,12402,smasa123\n"
      + "12403,Cut Nyak Dhien,XI-MIPA-2,cutnyak@smasa.sch.id,12403,smasa123\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_siswa_informatika.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Drag over handler untuk CSV
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Drop handler untuk CSV
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
 
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseCSVFile(e.dataTransfer.files[0]);
    }
  };

  // Handler pilih file via dialog browser
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseCSVFile(e.target.files[0]);
    }
  };

  // Parser CSV Sederhana dan Handal
  const parseCSVFile = (file: File) => {
    setImportError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error("File kosong atau tidak terbaca.");

        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          throw new Error("Format salah. Harus memiliki minimal header kolom dan satu baris data.");
        }

        const headerRow = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nisIdx = headerRow.indexOf('nisn') !== -1 ? headerRow.indexOf('nisn') : headerRow.indexOf('nis');
        const namaIdx = headerRow.indexOf('nama');
        const kelasIdx = headerRow.indexOf('kelas');
        const emailIdx = headerRow.indexOf('email');
        const usernameIdx = headerRow.indexOf('username');
        const passwordIdx = headerRow.indexOf('password');

        if (nisIdx === -1 || namaIdx === -1 || kelasIdx === -1 || emailIdx === -1) {
          throw new Error("Header kolom tidak lengkap! Pastikan mengandung kolom: nisn, nama, kelas, email.");
        }

        const parsedList: Siswa[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue; // Lewati baris kosong

          // Regex untuk menangani koma dalam tanda kutip jika ada
          const columns = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim());
          
          if (columns.length < 4) continue; // Lewati baris tidak valid

          const calculatedNis = columns[nisIdx];
          parsedList.push({
            id: `S${Date.now()}_I${i}`,
            nis: calculatedNis,
            nama: columns[namaIdx],
            kelas: columns[kelasIdx],
            email: columns[emailIdx],
            username: usernameIdx !== -1 && columns[usernameIdx] ? columns[usernameIdx] : calculatedNis,
            password: passwordIdx !== -1 && columns[passwordIdx] ? columns[passwordIdx] : 'smasa123'
          });
        }

        if (parsedList.length === 0) {
          throw new Error("Tidak menemukan baris data siswa yang valid.");
        }

        setImportPreview(parsedList);
      } catch (err: any) {
        setImportError(err.message || "Gagal menguraikan file CSV.");
        setImportPreview([]);
      }
    };
    reader.readAsText(file);
  };

  // Eksekusi Import
  const handleCommitImport = () => {
    if (importPreview.length > 0) {
      onImportSiswa(importPreview);
      setImportPreview([]);
      setShowImportModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <GraduationCap className="text-blue-600 w-6 h-6" /> Kelola Data Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Tambah, ubah, hapus, dan import database siswa Informatika</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="neu-flat-sm px-4 py-2.5 rounded-xl text-slate-600 font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95"
            id="btn-open-import"
          >
            <Upload size={14} className="text-slate-500" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="neu-flat-sm px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95"
            id="btn-open-add-siswa"
          >
            <UserPlus size={14} className="text-blue-700" />
            <span className="text-blue-700">Siswa Baru</span>
          </button>
        </div>
      </div>

      {/* Bar Pencarian & Filter (Neumorphic Bar) */}
      <div className="p-4 rounded-2xl neu-inset flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari nama, nisn, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            id="search-siswa-input"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <span className="text-xs text-slate-500 font-semibold">Filter Kelas:</span>
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
            id="filter-kelas-siswa"
          >
            <option value="">Semua Kelas</option>
            {uniqueKelasList.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabel Siswa (Neumorphic Card Wrapper) */}
      <div className="neu-flat rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-4 px-6">NISN</th>
                <th className="py-4 px-6">Nama Lengkap</th>
                <th className="py-4 px-6">Kelas</th>
                <th className="py-4 px-6">Email Pembelajaran</th>
                <th className="py-4 px-6">Akun Siswa</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data siswa yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredSiswa.map((siswa) => (
                  <tr key={siswa.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-slate-600 font-medium">{siswa.nis}</td>
                    <td className="py-4 px-6 font-bold text-slate-800">{siswa.nama}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
                        {siswa.kelas}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">{siswa.email}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[10px] text-slate-700 bg-slate-100/80 px-1.5 py-0.5 rounded w-max">
                          <span className="text-slate-400 font-bold mr-1">U:</span>{siswa.username || siswa.nis}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded w-max border border-slate-100">
                          <span className="text-slate-400 font-bold mr-1">P:</span>{siswa.password || 'smasa123'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setViewingSiswa(siswa)}
                          className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-teal-600 hover:bg-teal-50/50 transition-all cursor-pointer active:scale-95"
                          id={`btn-view-siswa-${siswa.id}`}
                          title="Lihat Identitas"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(siswa)}
                          className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-50/50 transition-all cursor-pointer active:scale-95"
                          id={`btn-edit-siswa-${siswa.id}`}
                          title="Edit Siswa"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleHapusSiswa(siswa)}
                          className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-rose-500 hover:bg-rose-50/50 transition-all cursor-pointer active:scale-95"
                          id={`btn-delete-siswa-${siswa.id}`}
                          title="Hapus Siswa"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50/60 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between items-center">
          <span>Menampilkan {filteredSiswa.length} dari {siswaList.length} total siswa</span>
          <span className="italic">Data ini tersinkronisasi di memori browser harian (LocalStorage)</span>
        </div>
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
              id="form-siswa-modal-content"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-sm">
                  {selectedSiswa ? 'Perbarui Data Siswa' : 'Registrasi Siswa Baru'}
                </h3>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveSiswa} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                    Nomor Induk Siswa Nasional (NISN)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 12401"
                    value={nis}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNis(val);
                      // Auto sync username if it hasn't been manually customized yet or matches previous NIS
                      if (!username || username === nis) {
                        setUsername(val);
                      }
                    }}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                    Nama Lengkap Siswa
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                      Kelas
                    </label>
                    <select
                      value={kelas}
                      onChange={(e) => setKelas(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                    >
                      <option value="XI-MIPA-1">XI-MIPA-1</option>
                      <option value="XI-MIPA-2">XI-MIPA-2</option>
                      <option value="XI-IPS-1">XI-IPS-1</option>
                      <option value="XI-IPS-2">XI-IPS-2</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                      Email Siswa
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="siswa@smasa.sch.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                      Username (NISN)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Username login"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                      Password / Sandi
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Sandi login"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    />
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
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIALOG MODAL IMPORT CSV SPREADSHEET */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowImportModal(false);
                setImportPreview([]);
                setImportError('');
              }}
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="relative w-full max-w-lg bg-neu-bg p-6 rounded-3xl shadow-2xl border border-white/50 z-10 flex flex-col max-h-[90vh]"
              id="import-csv-modal"
            >
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <FileSpreadsheet className="text-blue-600" size={16} />
                  <span>Import Data Siswa (CSV / Spreadsheet)</span>
                </h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportPreview([]);
                    setImportError('');
                  }}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 space-y-4 py-2">
                {/* Petunjuk format */}
                <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                  <h4 className="font-bold text-blue-700 flex items-center gap-1.5">
                    <Check size={13} /> Petunjuk Format Berkas CSV
                  </h4>
                  <p>Berkas CSV harus menggunakan pemisah koma (,) dan menyertakan baris judul kolom persis seperti berikut:</p>
                  <code className="block p-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-mono text-blue-600 overflow-x-auto whitespace-nowrap">
                    nis,nama,kelas,email
                  </code>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1.5 border-t border-blue-100/50">
                    <span className="text-[10px] text-slate-500">
                      Contoh: <code className="font-mono bg-white px-1 border border-slate-150 rounded">12499,Rangga,XI-MIPA-1,rangga@smasa.sch.id</code>
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-[10px] flex items-center gap-1.5 hover:bg-blue-700 transition-all active:scale-95 cursor-pointer shadow-sm shadow-blue-100/50 shrink-0"
                    >
                      <Download size={11} />
                      <span>Unduh Template CSV</span>
                    </button>
                  </div>
                </div>

                {/* Drop Zone */}
                {importPreview.length === 0 && (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl py-8 px-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50/30 shadow-inner'
                        : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/20'
                    }`}
                  >
                    <Upload size={32} className="text-slate-400 mb-3" />
                    <p className="text-xs font-semibold text-slate-700">Tarik dan letakkan file .csv ke sini</p>
                    <p className="text-[10px] text-slate-400 mt-1">atau klik untuk menelusuri dari folder perangkat</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Error Banner */}
                {importError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{importError}</span>
                  </div>
                )}

                {/* Preview Grid */}
                {importPreview.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">Pratinjau Data Terbaca ({importPreview.length} Siswa)</span>
                      <button
                        onClick={() => setImportPreview([])}
                        className="text-[10px] text-rose-600 hover:underline font-bold"
                      >
                        Reset / Ganti File
                      </button>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-[10px] border-collapse">
                        <thead className="bg-slate-100 font-bold text-slate-600 sticky top-0">
                          <tr>
                            <th className="p-2.5">NIS</th>
                            <th className="p-2.5">Nama</th>
                            <th className="p-2.5">Kelas</th>
                            <th className="p-2.5">Email</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {importPreview.slice(0, 20).map((p, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 font-mono">{p.nis}</td>
                              <td className="p-2.5 font-bold text-slate-800">{p.nama}</td>
                              <td className="p-2.5">{p.kelas}</td>
                              <td className="p-2.5 text-slate-500">{p.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {importPreview.length > 20 && (
                      <p className="text-[10px] text-slate-400 italic">* Hanya menampilkan 20 baris pertama untuk pratinjau</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50 mt-4 shrink-0">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportPreview([]);
                    setImportError('');
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  disabled={importPreview.length === 0}
                  onClick={handleCommitImport}
                  className={`px-4 py-2 text-xs font-bold rounded-xl shadow-md ${
                    importPreview.length > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Impor {importPreview.length} Siswa ke Database
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIALOG DETAIL IDENTITAS SISWA (POPUP) */}
      <AnimatePresence>
        {viewingSiswa && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingSiswa(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 z-10"
              id="view-siswa-modal-content"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                    <GraduationCap size={18} />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">
                      Profil & Identitas Siswa
                    </h3>
                    <p className="text-[10px] text-slate-400">SMASA Informatika Hub</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingSiswa(null)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 py-2">
                {/* Foto Profil Siswa */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100/80 mb-2">
                  {viewingSiswa.foto ? (
                    <img
                      src={viewingSiswa.foto}
                      alt={viewingSiswa.nama}
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-white"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col items-center justify-center text-white shadow-md">
                      <User size={36} />
                      <span className="text-[9px] font-bold mt-1 uppercase text-blue-100">Tanpa Foto</span>
                    </div>
                  )}
                  <h4 className="text-sm font-black text-slate-800 mt-2.5 leading-none">{viewingSiswa.nama}</h4>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">NISN: {viewingSiswa.nis} | Kelas {viewingSiswa.kelas}</p>
                </div>

                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nama Lengkap</span>
                  <span className="col-span-2 text-xs font-bold text-slate-800">{viewingSiswa.nama}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">NISN</span>
                  <span className="col-span-2 text-xs font-mono font-bold text-slate-700">{viewingSiswa.nis}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Kelas</span>
                  <span className="col-span-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase">
                      {viewingSiswa.kelas}
                    </span>
                  </span>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Email</span>
                  <span className="col-span-2 text-xs text-slate-600 font-medium">{viewingSiswa.email}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Username Akun</span>
                  <span className="col-span-2 text-xs font-mono font-semibold text-slate-700">{viewingSiswa.username || viewingSiswa.nis}</span>
                </div>
                <div className="grid grid-cols-3 pb-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Password Akun</span>
                  <span className="col-span-2 text-xs font-mono text-slate-600">{viewingSiswa.password || 'smasa123'}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-6 flex justify-end">
                <button
                  onClick={() => setViewingSiswa(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs cursor-pointer"
                >
                  Tutup Profil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
