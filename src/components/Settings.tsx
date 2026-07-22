/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Settings, Save, RotateCcw, Upload, Image, Trash2, Check, AlertCircle, Database, Copy, Download, UploadCloud, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings } from '../types';
import { DEFAULT_SETTINGS, downloadLocalDatabaseBackup, restoreLocalDatabaseFromJSON } from '../data';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  onReloadAllStates?: () => void;
}

export default function SettingsComponent({ settings, onUpdateSettings, onReloadAllStates }: SettingsProps) {
  // Local state for settings form
  const [namaGuru, setNamaGuru] = useState(settings.namaGuru);
  const [nip, setNip] = useState(settings.nip);
  const [namaKS, setNamaKS] = useState(settings.namaKS);
  const [jabatanKS, setJabatanKS] = useState(settings.jabatanKS);
  const [nipKS, setNipKS] = useState(settings.nipKS);
  const [kopPemprov, setKopPemprov] = useState(settings.kopPemprov);
  const [kopDinas, setKopDinas] = useState(settings.kopDinas);
  const [kopSekolah, setKopSekolah] = useState(settings.kopSekolah);
  const [kopAlamat, setKopAlamat] = useState(settings.kopAlamat);
  const [logoSekolah, setLogoSekolah] = useState(settings.logoSekolah);
  const [logoProv, setLogoProv] = useState(settings.logoProv);
  const [kkm, setKkm] = useState<number>(settings.kkm);
  const [kota, setKota] = useState(settings.kota || 'Salatiga');
  const [tahunPelajaran, setTahunPelajaran] = useState(settings.tahunPelajaran || '2025/2026');
  const [literasiStartAccess, setLiterasiStartAccess] = useState(settings.literasiStartAccess || '00:00');
  const [literasiEndAccess, setLiterasiEndAccess] = useState(settings.literasiEndAccess || '23:59');
  const [tugasStartAccess, setTugasStartAccess] = useState(settings.tugasStartAccess || '00:00');
  const [tugasEndAccess, setTugasEndAccess] = useState(settings.tugasEndAccess || '23:59');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(settings.spreadsheetUrl || '');
  const [adminUsername, setAdminUsername] = useState(settings.adminUsername || 'admin');
  const [adminPassword, setAdminPassword] = useState(settings.adminPassword || 'admin123');
  const [adminEmail, setAdminEmail] = useState(settings.adminEmail || '');
  const [mataPelajaran, setMataPelajaran] = useState(settings.mataPelajaran || 'Informatika');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fileInputSekolahRef = useRef<HTMLInputElement>(null);
  const fileInputProvRef = useRef<HTMLInputElement>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);
  const [restoreStatusMsg, setRestoreStatusMsg] = useState('');

  const handleDownloadBackup = () => {
    downloadLocalDatabaseBackup();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const success = restoreLocalDatabaseFromJSON(content);
          if (success) {
            setRestoreStatusMsg('Database berhasil dipulihkan dari file backup JSON!');
            if (onReloadAllStates) {
              onReloadAllStates();
            } else {
              window.location.reload();
            }
          } else {
            setErrorMsg('Format file backup JSON tidak valid!');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  // File to base64 converter
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'sekolah' | 'prov') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Limit size to 1.5MB to avoid localStorage quota issues
      if (file.size > 1500000) {
        setErrorMsg('Ukuran file terlalu besar! Silakan gunakan gambar di bawah 1.5 MB.');
        return;
      }

      setErrorMsg('');
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (type === 'sekolah') {
          setLogoSekolah(base64);
        } else {
          setLogoProv(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearLogo = (type: 'sekolah' | 'prov') => {
    if (type === 'sekolah') {
      setLogoSekolah('');
      if (fileInputSekolahRef.current) fileInputSekolahRef.current.value = '';
    } else {
      setLogoProv('');
      if (fileInputProvRef.current) fileInputProvRef.current.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (kkm < 0 || kkm > 100) {
      setErrorMsg('KKM harus bernilai antara 0 sampai 100!');
      return;
    }

    const cleanUrl = spreadsheetUrl.trim();
    if (cleanUrl && (cleanUrl.includes('docs.google.com/spreadsheets') || !cleanUrl.includes('script.google.com'))) {
      setErrorMsg('Peringatan: URL Spreadsheet yang dimasukkan adalah URL Google Spreadsheet langsung. Silakan masukkan URL Aplikasi Web Google Apps Script hasil penyebaran (/exec) agar koneksi berhasil.');
      return;
    }

    onUpdateSettings({
      namaGuru,
      nip,
      namaKS,
      jabatanKS,
      nipKS,
      kopPemprov,
      kopDinas,
      kopSekolah,
      kopAlamat,
      logoSekolah,
      logoProv,
      kkm,
      kota,
      tahunPelajaran,
      literasiStartAccess,
      literasiEndAccess,
      tugasStartAccess,
      tugasEndAccess,
      spreadsheetUrl,
      adminUsername,
      adminPassword,
      adminEmail,
      mataPelajaran,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    setShowResetConfirm(true);
  };

  const handleCommitReset = () => {
    setNamaGuru(DEFAULT_SETTINGS.namaGuru);
    setNip(DEFAULT_SETTINGS.nip);
    setNamaKS(DEFAULT_SETTINGS.namaKS);
    setJabatanKS(DEFAULT_SETTINGS.jabatanKS);
    setNipKS(DEFAULT_SETTINGS.nipKS);
    setKopPemprov(DEFAULT_SETTINGS.kopPemprov);
    setKopDinas(DEFAULT_SETTINGS.kopDinas);
    setKopSekolah(DEFAULT_SETTINGS.kopSekolah);
    setKopAlamat(DEFAULT_SETTINGS.kopAlamat);
    setLogoSekolah(DEFAULT_SETTINGS.logoSekolah);
    setLogoProv(DEFAULT_SETTINGS.logoProv);
    setKkm(DEFAULT_SETTINGS.kkm);
    setKota(DEFAULT_SETTINGS.kota);
    setTahunPelajaran(DEFAULT_SETTINGS.tahunPelajaran || '2025/2026');
    setLiterasiStartAccess(DEFAULT_SETTINGS.literasiStartAccess || '00:00');
    setLiterasiEndAccess(DEFAULT_SETTINGS.literasiEndAccess || '23:59');
    setTugasStartAccess(DEFAULT_SETTINGS.tugasStartAccess || '00:00');
    setTugasEndAccess(DEFAULT_SETTINGS.tugasEndAccess || '23:59');
    setSpreadsheetUrl(DEFAULT_SETTINGS.spreadsheetUrl || '');
    setAdminUsername(DEFAULT_SETTINGS.adminUsername || 'admin');
    setAdminPassword(DEFAULT_SETTINGS.adminPassword || 'admin123');
    setAdminEmail(DEFAULT_SETTINGS.adminEmail || '');
    setMataPelajaran(DEFAULT_SETTINGS.mataPelajaran || 'Informatika');
    
    onUpdateSettings(DEFAULT_SETTINGS);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2" id="settings-title">
          <Settings className="text-blue-600 w-6 h-6" /> Pengaturan Aplikasi & Kop Surat
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Konfigurasi identitas guru, NIP, KKM penuntun kelulusan, serta struktur Kop Surat dinas untuk dokumen cetak PDF.
        </p>
      </div>

      {savedSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-700 text-xs font-semibold shadow-sm"
          id="settings-success-alert"
        >
          <Check size={16} className="text-emerald-600" />
          <span>Pengaturan berhasil disimpan dan disinkronisasikan ke seluruh sistem!</span>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-xs font-semibold shadow-sm"
          id="settings-error-alert"
        >
          <AlertCircle size={16} className="text-rose-600" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Identitas Guru & KKM (Lg: col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-3xl bg-neu-bg neu-flat space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded"></span> Identitas Guru & KKM
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nama Lengkap Guru</label>
                <input
                  type="text"
                  required
                  value={namaGuru}
                  onChange={(e) => setNamaGuru(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-semibold"
                  placeholder="Contoh: Romlah, S.Kom., M.Cs."
                  id="input-settings-nama"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nomor Induk Pegawai (NIP)</label>
                <input
                  type="text"
                  required
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                  placeholder="Contoh: 19820815 201012 2 003"
                  id="input-settings-nip"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={mataPelajaran}
                  onChange={(e) => setMataPelajaran(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-semibold"
                  placeholder="Contoh: Informatika"
                  id="input-settings-matapelajaran"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Kriteria Ketuntasan Minimal (KKM)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={kkm}
                    onChange={(e) => setKkm(parseInt(e.target.value) || 0)}
                    className="w-32 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-mono font-bold"
                    placeholder="Contoh: 75"
                    id="input-settings-kkm"
                  />
                  <span className="text-[10px] text-slate-400">
                    Siswa lulus apabila memiliki skor nilai total &ge; {kkm}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Kota / Kabupaten Laporan</label>
                <input
                  type="text"
                  required
                  value={kota}
                  onChange={(e) => setKota(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                  placeholder="Contoh: Salatiga"
                  id="input-settings-kota"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tahun Pelajaran</label>
                <input
                  type="text"
                  required
                  value={tahunPelajaran}
                  onChange={(e) => setTahunPelajaran(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                  placeholder="Contoh: 2025/2026"
                  id="input-settings-tahun-pelajaran"
                />
              </div>
            </div>
          </div>
          
          {/* Akun Keamanan Guru */}
          <div className="p-5 rounded-3xl bg-neu-bg neu-flat space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-indigo-600 rounded"></span> Kredensial Login Guru / Admin
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Username Guru / Admin</label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-mono font-bold"
                  placeholder="admin"
                  id="input-settings-admin-username"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Password Guru / Admin</label>
                <input
                  type="text"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-mono font-bold"
                  placeholder="admin123"
                  id="input-settings-admin-password"
                />
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Gunakan kredensial ini untuk login ke Portal Guru selanjutnya. Kredensial bawaan adalah <strong>admin</strong> dan <strong>admin123</strong>.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Email Pemulihan Guru / Admin</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-semibold"
                  placeholder="Contoh: romlah@gmail.com"
                  id="input-settings-admin-email"
                />
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Gunakan email aktif Anda agar mempermudah proses atur ulang kata sandi (lupa password) di halaman depan login.
                </p>
              </div>
            </div>
          </div>

          {/* Identitas Kepala Sekolah */}
          <div className="p-5 rounded-3xl bg-neu-bg neu-flat space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded"></span> Identitas Kepala Sekolah (KS)
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nama Lengkap Kepala Sekolah</label>
                <input
                  type="text"
                  required
                  value={namaKS}
                  onChange={(e) => setNamaKS(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-semibold"
                  placeholder="Contoh: Dr. Joko Wahyono, M.Pd."
                  id="input-settings-nama-ks"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Pangkat / Jabatan Kepala Sekolah</label>
                <input
                  type="text"
                  required
                  value={jabatanKS}
                  onChange={(e) => setJabatanKS(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                  placeholder="Contoh: Pembina Tk. I, IV/b"
                  id="input-settings-jabatan-ks"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  required
                  value={nipKS}
                  onChange={(e) => setNipKS(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                  placeholder="Contoh: 19740512 200003 1 002"
                  id="input-settings-nip-ks"
                />
              </div>
            </div>
          </div>

          {/* Pengunggahan Logo */}
          <div className="p-5 rounded-3xl bg-neu-bg neu-flat space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded"></span> Logo Cetak Dokumen
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo Sekolah */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">Logo Sekolah (Kiri)</label>
                <div className="p-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center">
                  {logoSekolah ? (
                    <div className="relative group">
                      <img
                        src={logoSekolah}
                        alt="Logo Sekolah"
                        className="w-16 h-16 object-contain rounded-lg border border-slate-200 bg-white"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => handleClearLogo('sekolah')}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm"
                        title="Hapus Logo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-2">
                      <Image size={24} className="text-slate-400 mb-1" />
                      <span className="text-[9px] text-slate-400 font-medium">Kosong (Gunakan default)</span>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => fileInputSekolahRef.current?.click()}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center gap-1 hover:bg-slate-100/50"
                  >
                    <Upload size={10} />
                    Pilih File
                  </button>
                  <input
                    type="file"
                    ref={fileInputSekolahRef}
                    onChange={(e) => handleLogoUpload(e, 'sekolah')}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Logo Provinsi */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">Logo Provinsi (Kanan)</label>
                <div className="p-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center">
                  {logoProv ? (
                    <div className="relative group">
                      <img
                        src={logoProv}
                        alt="Logo Provinsi"
                        className="w-16 h-16 object-contain rounded-lg border border-slate-200 bg-white"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => handleClearLogo('prov')}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm"
                        title="Hapus Logo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-2">
                      <Image size={24} className="text-slate-400 mb-1" />
                      <span className="text-[9px] text-slate-400 font-medium">Kosong (Gunakan default)</span>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => fileInputProvRef.current?.click()}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center gap-1 hover:bg-slate-100/50"
                  >
                    <Upload size={10} />
                    Pilih File
                  </button>
                  <input
                    type="file"
                    ref={fileInputProvRef}
                    onChange={(e) => handleLogoUpload(e, 'prov')}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 italic text-center">
              *Format yang didukung PNG, JPEG. Rekomendasi gambar transparan rasio 1:1.
            </p>
          </div>

          {/* Pengaturan Waktu Akses Pembelajaran */}
          <div className="p-5 rounded-3xl bg-neu-bg neu-flat space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded"></span> Waktu Akses Pembelajaran
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal">
              Batasi jam operasional siswa untuk mengakses materi Literasi atau mengerjakan Tugas/Tes pembelajaran. Di luar jam operasional, akses siswa akan dikunci otomatis.
            </p>

            <div className="space-y-4">
              {/* Akses Literasi */}
              <div className="space-y-2 p-3 rounded-2xl bg-pink-50/50 border border-pink-100">
                <span className="block text-[11px] font-black text-pink-700 uppercase tracking-wide">Akses Materi Literasi</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jam Mulai</label>
                    <input
                      type="time"
                      value={literasiStartAccess}
                      onChange={(e) => setLiterasiStartAccess(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-pink-500/25"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jam Selesai</label>
                    <input
                      type="time"
                      value={literasiEndAccess}
                      onChange={(e) => setLiterasiEndAccess(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-pink-500/25"
                    />
                  </div>
                </div>
              </div>

              {/* Akses Tugas / Tes */}
              <div className="space-y-2 p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                <span className="block text-[11px] font-black text-indigo-700 uppercase tracking-wide">Akses Tugas / Tes</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jam Mulai</label>
                    <input
                      type="time"
                      value={tugasStartAccess}
                      onChange={(e) => setTugasStartAccess(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jam Selesai</label>
                    <input
                      type="time"
                      value={tugasEndAccess}
                      onChange={(e) => setTugasEndAccess(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Kop Surat (Lg: col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-3xl bg-neu-bg neu-flat space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded"></span> Konfigurasi Kop Surat Dinas
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Pemerintahan Provinsi (Baris 1)</label>
                <input
                  type="text"
                  required
                  value={kopPemprov}
                  onChange={(e) => setKopPemprov(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                  placeholder="Contoh: PEMERINTAH PROVINSI JAWA TENGAH"
                  id="input-settings-pemprov"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Dinas Pendidikan (Baris 2)</label>
                <input
                  type="text"
                  required
                  value={kopDinas}
                  onChange={(e) => setKopDinas(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                  placeholder="Contoh: DINAS PENDIDIKAN DAN KEBUDAYAAN"
                  id="input-settings-dinas"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Satuan Pendidikan / Sekolah (Baris 3 - Tebal)</label>
                <input
                  type="text"
                  required
                  value={kopSekolah}
                  onChange={(e) => setKopSekolah(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-bold"
                  placeholder="Contoh: SMA NEGERI 1 SALATIGA"
                  id="input-settings-sekolah"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Alamat Lengkap & Informasi Kontak (Baris 4)</label>
                <textarea
                  required
                  rows={3}
                  value={kopAlamat}
                  onChange={(e) => setKopAlamat(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 leading-relaxed"
                  placeholder="Contoh: Akr. A - Jl. Kemiri No. 1 Salatiga, Kode Pos 50711, Telp: (0298) 321321"
                  id="input-settings-alamat"
                />
              </div>
            </div>

            {/* Preview Visual Kop Surat */}
            <div className="mt-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Live Preview Kop Surat Cetak:</span>
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between min-h-[90px] gap-2">
                {/* Logo Kiri */}
                <div className="w-10 h-10 border border-slate-200 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                  {logoSekolah ? (
                    <img src={logoSekolah} alt="Preview Kiri" className="w-full h-full object-contain p-0.5" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[7px] text-slate-400 text-center font-bold font-mono">School<br/>Badge</span>
                  )}
                </div>

                {/* Teks Tengah */}
                <div className="flex-1 text-center font-serif leading-none select-none">
                  <h4 className="text-[7px] font-bold text-slate-800 uppercase tracking-tight">{kopPemprov || 'Pemerintah Provinsi'}</h4>
                  <h4 className="text-[7px] font-bold text-slate-800 uppercase tracking-tight">{kopDinas || 'Dinas Pendidikan'}</h4>
                  <h3 className="text-[9px] font-bold text-slate-900 uppercase tracking-tight my-0.5">{kopSekolah || 'Sekolah Terpilih'}</h3>
                  <p className="text-[5.5px] text-slate-500 font-sans tracking-tight">{kopAlamat || 'Alamat Sekolah...'}</p>
                </div>

                {/* Logo Kanan */}
                <div className="w-10 h-10 border border-slate-200 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                  {logoProv ? (
                    <img src={logoProv} alt="Preview Kanan" className="w-full h-full object-contain p-0.5" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[7px] text-slate-400 text-center font-bold font-mono">Prov<br/>Badge</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Integrasi Google Spreadsheet Database */}
          <div className="p-5 rounded-3xl bg-neu-bg neu-flat space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
              <Database className="text-emerald-600 w-5 h-5 animate-pulse" />
              <span>Integrasi Google Spreadsheet (Database Utama)</span>
            </h3>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Hubungkan sistem SMASA-Online Anda dengan Google Sheets agar data <strong>Siswa, Nilai, Presensi, Pembelajaran, dan Pengumuman</strong> tersimpan secara permanen dan aman di Google Drive Anda.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                  <span>URL Web App Google Apps Script</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="url"
                  value={spreadsheetUrl}
                  onChange={(e) => setSpreadsheetUrl(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 font-mono"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  id="input-settings-spreadsheet-url"
                />
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Masukkan URL Web App dari Apps Script Anda setelah dideploy. Biarkan kosong jika ingin menggunakan mode penyimpanan lokal offline-first.
                </p>
              </div>

              {/* Panduan Instalasi */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">
                  Cara Setup Database Google Spreadsheet:
                </span>
                <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                  <li>Buat sebuah Google Spreadsheet baru di Google Drive Anda.</li>
                  <li>Di menu atas, pilih <strong>Ekstensi</strong> &rarr; <strong>Apps Script</strong>.</li>
                  <li>Hapus kode bawaan, lalu salin dan tempel kode Apps Script di bawah ini.</li>
                  <li>Klik tombol <strong>Terapkan</strong> (Deploy) &rarr; <strong>Penerapan Baru</strong>.</li>
                  <li>Pilih jenis <strong>Aplikasi Web</strong> (Web App).</li>
                  <li>Konfigurasikan: 
                    <ul className="list-disc list-inside ml-4 my-1 text-slate-500 font-medium">
                      <li>Jalankan sebagai: <strong>Saya (email Anda)</strong></li>
                      <li>Yang memiliki akses: <strong>Siapa saja</strong> (Anyone)</li>
                    </ul>
                  </li>
                  <li>Klik <strong>Terapkan</strong>, setujui izin keamanan Google, lalu salin <strong>URL Aplikasi Web</strong> yang dihasilkan dan tempel di kolom input di atas.</li>
                </ol>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[10px] space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <AlertCircle size={12} className="text-amber-600" />
                    Catatan Penting Seputar Test Run di Apps Script:
                  </span>
                  <p className="leading-relaxed">
                    Jangan klik tombol <strong>"Jalankan" (Run)</strong> pada fungsi <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">doPost</code> langsung dari editor Apps Script. Menjalankannya secara manual akan menyebabkan error <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-rose-700 font-bold">TypeError: Cannot read properties of undefined (reading 'postData')</code> karena fungsi tersebut membutuhkan payload HTTP dari web app. Langkah yang benar cukup lakukan <strong>Deploy / Terapkan sebagai Aplikasi Web</strong>.
                  </p>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Kode Google Apps Script:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const code = `function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "ERROR: Script tidak terikat dengan Spreadsheet! Pastikan Anda membuat/membuka Apps Script melalui menu 'Ekstensi' > 'Apps Script' dari dalam Google Spreadsheet Anda." 
    })).setMimeType(ContentService.MimeType.JSON);
  }
  var result = {};
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var name = sheet.getName().toLowerCase();
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      result[name] = [];
      continue;
    }
    var headers = data[0];
    var rows = [];
    for (var r = 1; r < data.length; r++) {
      var row = {};
      for (var c = 0; c < headers.length; c++) {
        var val = data[r][c];
        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
          try { val = JSON.parse(val); } catch(err) {}
        }
        row[headers[c]] = val;
      }
      rows.push(row);
    }
    result[name] = rows;
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "Fungsi doPost() tidak dapat dijalankan secara langsung lewat tombol Run di editor Apps Script. Fungsi ini berjalan otomatis saat dipanggil dari aplikasi SMASA Online." 
    })).setMimeType(ContentService.MimeType.JSON);
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "ERROR: Script tidak terikat dengan Spreadsheet! Pastikan Anda membuat/membuka Apps Script melalui menu 'Ekstensi' > 'Apps Script' dari dalam Google Spreadsheet Anda." 
    })).setMimeType(ContentService.MimeType.JSON);
  }
  var payload = JSON.parse(e.postData.contents);
  for (var key in payload) {
    var sheetName = key.charAt(0).toUpperCase() + key.slice(1);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) { sheet = ss.insertSheet(sheetName); } else { sheet.clear(); }
    var data = payload[key];
    if (!data) continue;
    if (!Array.isArray(data)) {
      data = [data];
    }
    if (data.length === 0) continue;
    var headers = [];
    data.forEach(function(item) {
      Object.keys(item).forEach(function(k) {
        if (headers.indexOf(k) === -1) { headers.push(k); }
      });
    });
    sheet.appendRow(headers);
    var rows = [];
    data.forEach(function(item) {
      var row = [];
      headers.forEach(function(h) {
        var val = item[h];
        if (val === undefined || val === null) { row.push(""); }
        else if (typeof val === 'object') { row.push(JSON.stringify(val)); }
        else { row.push(val); }
      });
      rows.push(row);
    });
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;
                        navigator.clipboard.writeText(code);
                        alert("Kode script berhasil disalin ke clipboard!");
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-wide flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                    >
                      <Copy size={10} /> Salin Kode Script
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 text-slate-300 rounded-xl text-[9px] font-mono overflow-x-auto max-h-40 shadow-inner">
{`function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "ERROR: Script tidak terikat dengan Spreadsheet! Pastikan Anda membuat/membuka Apps Script melalui menu 'Ekstensi' > 'Apps Script' dari dalam Google Spreadsheet Anda." 
    })).setMimeType(ContentService.MimeType.JSON);
  }
  var result = {};
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var name = sheet.getName().toLowerCase();
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      result[name] = [];
      continue;
    }
    var headers = data[0];
    var rows = [];
    for (var r = 1; r < data.length; r++) {
      var row = {};
      for (var c = 0; c < headers.length; c++) {
        var val = data[r][c];
        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
          try { val = JSON.parse(val); } catch(err) {}
        }
        row[headers[c]] = val;
      }
      rows.push(row);
    }
    result[name] = rows;
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "Fungsi doPost() tidak dapat dijalankan secara langsung lewat tombol Run di editor Apps Script. Fungsi ini berjalan otomatis saat dipanggil dari aplikasi SMASA Online." 
    })).setMimeType(ContentService.MimeType.JSON);
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "ERROR: Script tidak terikat dengan Spreadsheet! Pastikan Anda membuat/membuka Apps Script melalui menu 'Ekstensi' > 'Apps Script' dari dalam Google Spreadsheet Anda." 
    })).setMimeType(ContentService.MimeType.JSON);
  }
  var payload = JSON.parse(e.postData.contents);
  for (var key in payload) {
    var sheetName = key.charAt(0).toUpperCase() + key.slice(1);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) { sheet = ss.insertSheet(sheetName); } else { sheet.clear(); }
    var data = payload[key];
    if (!data) continue;
    if (!Array.isArray(data)) {
      data = [data];
    }
    if (data.length === 0) continue;
    var headers = [];
    data.forEach(function(item) {
      Object.keys(item).forEach(function(k) {
        if (headers.indexOf(k) === -1) { headers.push(k); }
      });
    });
    sheet.appendRow(headers);
    var rows = [];
    data.forEach(function(item) {
      var row = [];
      headers.forEach(function(h) {
        var val = item[h];
        if (val === undefined || val === null) { row.push(""); }
        else if (typeof val === 'object') { row.push(JSON.stringify(val)); }
        else { row.push(val); }
      });
      rows.push(row);
    });
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Cadangan & Pemulihan Database Lokal (JSON) */}
          <div className="p-5 rounded-3xl bg-neu-bg neu-flat space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="text-blue-600 w-5 h-5" />
                <span>Cadangan & Pemulihan Database Lokal (JSON)</span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Pengaman Offline
              </span>
            </h3>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Unduh salinan cadangan (backup) seluruh data lokal Anda (Siswa, Nilai, Presensi, Pembelajaran, Pengumuman, dan Pengaturan) dalam format file <strong>.json</strong>. Fitur ini berfungsi sebagai pengaman data jika koneksi Google Sheets terputus atau tidak terkoneksi.
            </p>

            {restoreStatusMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>{restoreStatusMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/10 cursor-pointer active:scale-95 transition-all"
                id="btn-download-json-backup"
              >
                <Download size={16} />
                <span>Unduh Cadangan Database (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => restoreFileInputRef.current?.click()}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm cursor-pointer active:scale-95 transition-all"
                id="btn-restore-json-backup"
              >
                <UploadCloud size={16} className="text-slate-500" />
                <span>Pulihkan dari File (.json)</span>
              </button>

              <input
                type="file"
                ref={restoreFileInputRef}
                onChange={handleRestoreFile}
                accept=".json,application/json"
                className="hidden"
              />
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex justify-between items-center gap-4">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="neu-flat-sm px-4 py-3 rounded-xl text-slate-600 font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95"
              id="btn-settings-reset"
            >
              <RotateCcw size={14} className="text-slate-500" />
              <span>Ganti ke Setelean Awal</span>
            </button>

            <button
              type="submit"
              className="neu-flat-sm px-5 py-3 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95"
              id="btn-settings-save"
            >
              <Save size={14} className="text-blue-700" />
              <span>Simpan & Sinkronkan</span>
            </button>
          </div>
        </div>
      </form>

      {/* Custom Reset Settings Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
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
                  <RotateCcw size={20} className="text-rose-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Ganti ke Setelan Awal?</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin mengembalikan semua data pengaturan ke setelan awal pabrik (SMAN 1 Salatiga)?
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer animate-none"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCommitReset}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer shadow-md shadow-rose-100"
                >
                  Ya, Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
