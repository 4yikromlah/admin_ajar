/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, User, GraduationCap, ShieldCheck, Check, Sparkles, UserPlus, BookOpen, School } from 'lucide-react';
import { Siswa, AppSettings, TeacherAccount } from '../types';
import { loadTeacherAccounts, saveTeacherAccounts, registerTeacherAndSync, fetchSuperAdminSpreadsheetUrlFromServer } from '../data';

interface LoginProps {
  siswaList: Siswa[];
  onTeacherLoginSuccess: (username: string) => void;
  onSuperAdminLoginSuccess: () => void;
  onStudentLoginSuccess: (siswa: Siswa, teacherUsername: string) => void;
  settings: AppSettings;
}

type LoginRole = 'guru' | 'siswa';

export default function Login({ siswaList, onTeacherLoginSuccess, onSuperAdminLoginSuccess, onStudentLoginSuccess, settings }: LoginProps) {
  const [role, setRole] = useState<LoginRole>('guru');
  
  // State for login success animation and details display
  const [loginSuccessData, setLoginSuccessData] = useState<{
    role: 'guru' | 'siswa' | 'superadmin';
    nama: string;
    sekolah: string;
    logo: string;
    mataPelajaran: string;
  } | null>(null);

  const getTeacherSettings = (username: string): AppSettings | null => {
    try {
      const data = localStorage.getItem(`smasa_${username}_settings`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error("Gagal memuat pengaturan guru:", e);
    }
    return null;
  };
  
  // State Login Guru
  const [guruUsername, setGuruUsername] = useState('');
  const [guruPassword, setGuruPassword] = useState('');
  const [guruError, setGuruError] = useState('');
  const [isGuruLoading, setIsGuruLoading] = useState(false);

  // State Registrasi Guru Baru
  const [isRegistering, setIsRegistering] = useState(false);
  const [regNama, setRegNama] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regMataPelajaran, setRegMataPelajaran] = useState('Informatika');
  const [regAsalSekolah, setRegAsalSekolah] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [isRegLoading, setIsRegLoading] = useState(false);

  // State Login Siswa
  const [siswaUsername, setSiswaUsername] = useState('');
  const [siswaPassword, setSiswaPassword] = useState('');
  const [siswaError, setSiswaError] = useState('');
  const [isSiswaLoading, setIsSiswaLoading] = useState(false);

  // Track if user has ever successfully logged in before (history)
  const [hasEverLoggedIn, setHasEverLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('hasEverLoggedIn');
    if (saved === 'true') return true;
    
    // Fallback checks for active sessions
    const hasSiswa = localStorage.getItem('loggedSiswa') !== null;
    const hasTeacher = localStorage.getItem('isTeacherLoggedIn') === 'true';
    const hasSuperAdmin = localStorage.getItem('isSuperAdminLoggedIn') === 'true';
    if (hasSiswa || hasTeacher || hasSuperAdmin) {
      localStorage.setItem('hasEverLoggedIn', 'true');
      return true;
    }
    return false;
  });

  // Load teachers to populate school dropdown
  const [teachersList, setTeachersList] = useState<TeacherAccount[]>(() => loadTeacherAccounts());

  // Auto-sync on mount to pull latest teachers from centralized spreadsheet
  React.useEffect(() => {
    const syncTeachers = async () => {
      try {
        const url = await fetchSuperAdminSpreadsheetUrlFromServer();
        if (url) {
          const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
          });
          if (response.ok) {
            const db = await response.json();
            if (db && Array.isArray(db.teachers)) {
              saveTeacherAccounts(db.teachers);
              setTeachersList(db.teachers);
            }
          }
        }
      } catch (err) {
        console.warn("[Login Sync Teachers Error] Gagal menyelaraskan daftar guru otomatis:", err);
      }
    };
    syncTeachers();
  }, []);

  const uniqueSchools = Array.from(new Set(teachersList.map(t => t.asalSekolah).filter(Boolean))) as string[];
  if (uniqueSchools.length === 0) {
    uniqueSchools.push("MGMP INFORMATIKA BONDOWOSO");
  }

  const [selectedSchool, setSelectedSchool] = useState(() => {
    return uniqueSchools.includes("MGMP INFORMATIKA BONDOWOSO") ? "MGMP INFORMATIKA BONDOWOSO" : (uniqueSchools[0] || "MGMP INFORMATIKA BONDOWOSO");
  });

  const handleGuruSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGuruError('');
    setIsGuruLoading(true);

    const cleanUsername = guruUsername.trim().toLowerCase();

    setTimeout(() => {
      // 1. Check Super Admin Credentials
      if (cleanUsername === 'admin' && guruPassword === 'sableng212') {
        localStorage.setItem('hasEverLoggedIn', 'true');
        
        const loginTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        localStorage.setItem('lastLoggedInSchoolName', 'Super Admin');
        localStorage.setItem('lastLoggedInSchoolLogo', '');
        localStorage.setItem('lastLoggedInMataPelajaran', 'All Subjects');
        localStorage.setItem('lastLoggedInTime', loginTime);
        localStorage.setItem('lastLoggedInUserNama', 'Super Admin');
        localStorage.setItem('lastLoggedInRole', 'superadmin');

        setLoginSuccessData({
          role: 'superadmin',
          nama: 'Super Admin',
          sekolah: 'Dashboard Super Admin',
          logo: '',
          mataPelajaran: 'Sistem Pusat'
        });

        setTimeout(() => {
          onSuperAdminLoginSuccess();
        }, 2200);
        return;
      }

      // 2. Check Teacher Accounts
      const matchedTeacher = teachersList.find(
        (t) => t.username === cleanUsername && t.password === guruPassword
      );

      if (matchedTeacher) {
        if (matchedTeacher.isApproved === false) {
          setGuruError('Pendaftaran akun Anda masih menunggu persetujuan (approval) dari Super Admin!');
          setIsGuruLoading(false);
          return;
        }
        localStorage.setItem('hasEverLoggedIn', 'true');
        
        const scopedKey = `smasa_${matchedTeacher.username}_settings`;
        let tSettings = getTeacherSettings(matchedTeacher.username);
        if (!tSettings) {
          tSettings = {
            namaGuru: matchedTeacher.nama,
            nip: "",
            namaKS: "",
            jabatanKS: "",
            nipKS: "",
            kopPemprov: "PEMERINTAH PROVINSI",
            kopDinas: "DINAS PENDIDIKAN",
            kopSekolah: matchedTeacher.asalSekolah || "MGMP INFORMATIKA BONDOWOSO",
            kopAlamat: "",
            logoSekolah: "",
            logoProv: "",
            kkm: 75,
            kota: "Salatiga",
            tahunPelajaran: "2025/2026",
            literasiStartAccess: "00:00",
            literasiEndAccess: "23:59",
            tugasStartAccess: "00:00",
            tugasEndAccess: "23:59",
            spreadsheetUrl: matchedTeacher.spreadsheetUrl || "",
            adminUsername: matchedTeacher.username,
            adminPassword: matchedTeacher.password || "password",
            mataPelajaran: matchedTeacher.mataPelajaran || "Informatika"
          };
          localStorage.setItem(scopedKey, JSON.stringify(tSettings));
        } else if (matchedTeacher.spreadsheetUrl && !tSettings.spreadsheetUrl) {
          tSettings.spreadsheetUrl = matchedTeacher.spreadsheetUrl;
          localStorage.setItem(scopedKey, JSON.stringify(tSettings));
        }

        const sName = tSettings?.kopSekolah || matchedTeacher.asalSekolah || 'MGMP INFORMATIKA BONDOWOSO';
        const sLogo = tSettings?.logoSekolah || '';
        const sMataPelajaran = tSettings?.mataPelajaran || matchedTeacher.mataPelajaran || 'Informatika';
        const loginTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        localStorage.setItem('lastLoggedInSchoolName', sName);
        localStorage.setItem('lastLoggedInSchoolLogo', sLogo);
        localStorage.setItem('lastLoggedInMataPelajaran', sMataPelajaran);
        localStorage.setItem('lastLoggedInTime', loginTime);
        localStorage.setItem('lastLoggedInUserNama', matchedTeacher.nama);
        localStorage.setItem('lastLoggedInRole', 'guru');

        setLoginSuccessData({
          role: 'guru',
          nama: matchedTeacher.nama,
          sekolah: sName,
          logo: sLogo,
          mataPelajaran: sMataPelajaran
        });

        setTimeout(() => {
          onTeacherLoginSuccess(matchedTeacher.username);
        }, 2200);
        return;
      }

      // 3. Fallback to settings adminUsername and adminPassword
      const allowedUsername = (settings?.adminUsername || 'admin').trim().toLowerCase();
      const allowedPassword = settings?.adminPassword || 'admin123';

      if (cleanUsername === allowedUsername && guruPassword === allowedPassword) {
        localStorage.setItem('hasEverLoggedIn', 'true');

        const sName = settings?.kopSekolah || 'MGMP INFORMATIKA BONDOWOSO';
        const sLogo = settings?.logoSekolah || '';
        const sMataPelajaran = settings?.mataPelajaran || 'Informatika';
        const loginTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        localStorage.setItem('lastLoggedInSchoolName', sName);
        localStorage.setItem('lastLoggedInSchoolLogo', sLogo);
        localStorage.setItem('lastLoggedInMataPelajaran', sMataPelajaran);
        localStorage.setItem('lastLoggedInTime', loginTime);
        localStorage.setItem('lastLoggedInUserNama', settings?.namaGuru || 'Guru');
        localStorage.setItem('lastLoggedInRole', 'guru');

        setLoginSuccessData({
          role: 'guru',
          nama: settings?.namaGuru || 'Guru',
          sekolah: sName,
          logo: sLogo,
          mataPelajaran: sMataPelajaran
        });

        setTimeout(() => {
          onTeacherLoginSuccess(cleanUsername);
        }, 2200);
        return;
      }

      setGuruError('Username atau Password Guru salah!');
      setIsGuruLoading(false);
    }, 600);
  };

  const handleRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    setIsRegLoading(true);

    const cleanUsername = regUsername.trim().toLowerCase();

    if (!regNama.trim() || !cleanUsername || !regPassword.trim() || !regMataPelajaran.trim() || !regAsalSekolah.trim()) {
      setRegError('Semua kolom wajib diisi termasuk Asal Sekolah!');
      setIsRegLoading(false);
      return;
    }

    if (cleanUsername === 'admin') {
      setRegError('Username "admin" tidak dapat digunakan.');
      setIsRegLoading(false);
      return;
    }

    try {
      const newTeacher: TeacherAccount = {
        id: `T${Date.now()}`,
        nama: regNama.trim(),
        username: cleanUsername,
        password: regPassword,
        mataPelajaran: regMataPelajaran.trim(),
        isApproved: false, // Wait for approval!
        asalSekolah: regAsalSekolah.trim(),
      };

      await registerTeacherAndSync(newTeacher);

      // Refresh teachers list state
      const updatedTeachers = loadTeacherAccounts();
      setTeachersList(updatedTeachers);

      setRegSuccess('Pendaftaran berhasil diajukan! Harap hubungi Super Admin untuk proses persetujuan (approval).');
      
      // Clear input fields
      setRegNama('');
      setRegUsername('');
      setRegPassword('');
      setRegMataPelajaran('Informatika');
      setRegAsalSekolah('');
    } catch (error: any) {
      setRegError(error?.message || 'Gagal mengirimkan pendaftaran ke database.');
    } finally {
      setIsRegLoading(false);
    }
  };

  const handleSiswaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSiswaError('');
    setIsSiswaLoading(true);

    const cleanUsername = siswaUsername.trim().toLowerCase();
    const cleanPassword = siswaPassword.trim();

    setTimeout(() => {
      // Find teachers belonging to selected school
      const teachers = loadTeacherAccounts();
      const matchedTeachers = teachers.filter(
        (t) => (t.asalSekolah || '').trim().toLowerCase() === selectedSchool.trim().toLowerCase()
      );

      let found: Siswa | null = null;
      let matchedTeacherUsername = '';

      // 1. Search among students of teachers of the selected school
      for (const teacher of matchedTeachers) {
        const scopedKey = `smasa_${teacher.username}_siswa`;
        const teacherStudentsString = localStorage.getItem(scopedKey);
        const teacherStudents: Siswa[] = teacherStudentsString
          ? JSON.parse(teacherStudentsString)
          : [...siswaList];

        const match = teacherStudents.find((s) => {
          const studentUsername = (s.username || '').trim().toLowerCase();
          const studentNis = (s.nis || '').trim().toLowerCase();
          const studentPassword = (s.password || 'smasa123').trim();
          
          return (studentUsername === cleanUsername || studentNis === cleanUsername) &&
                 studentPassword === cleanPassword;
        });

        if (match) {
          found = match;
          matchedTeacherUsername = teacher.username;
          break;
        }
      }

      // 2. If not found, search across ALL registered teachers
      if (!found) {
        for (const teacher of teachers) {
          const scopedKey = `smasa_${teacher.username}_siswa`;
          const teacherStudentsString = localStorage.getItem(scopedKey);
          const teacherStudents: Siswa[] = teacherStudentsString
            ? JSON.parse(teacherStudentsString)
            : [...siswaList];

          const match = teacherStudents.find((s) => {
            const studentUsername = (s.username || '').trim().toLowerCase();
            const studentNis = (s.nis || '').trim().toLowerCase();
            const studentPassword = (s.password || 'smasa123').trim();
            
            return (studentUsername === cleanUsername || studentNis === cleanUsername) &&
                   studentPassword === cleanPassword;
          });

          if (match) {
            found = match;
            matchedTeacherUsername = teacher.username;
            break;
          }
        }
      }

      // 3. Fallback to default/general list
      if (!found) {
        const match = siswaList.find((s) => {
          const studentUsername = (s.username || '').trim().toLowerCase();
          const studentNis = (s.nis || '').trim().toLowerCase();
          const studentPassword = (s.password || 'smasa123').trim();
          
          return (studentUsername === cleanUsername || studentNis === cleanUsername) &&
                 studentPassword === cleanPassword;
        });
        if (match) {
          found = match;
          matchedTeacherUsername = '';
        }
      }

      if (found) {
        localStorage.setItem('hasEverLoggedIn', 'true');

        let tSettings: AppSettings | null = null;
        if (matchedTeacherUsername) {
          tSettings = getTeacherSettings(matchedTeacherUsername);
        }

        const sName = tSettings?.kopSekolah || selectedSchool || 'MGMP INFORMATIKA BONDOWOSO';
        const sLogo = tSettings?.logoSekolah || '';
        const sMataPelajaran = tSettings?.mataPelajaran || 'Informatika';
        const loginTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        localStorage.setItem('lastLoggedInSchoolName', sName);
        localStorage.setItem('lastLoggedInSchoolLogo', sLogo);
        localStorage.setItem('lastLoggedInMataPelajaran', sMataPelajaran);
        localStorage.setItem('lastLoggedInTime', loginTime);
        localStorage.setItem('lastLoggedInUserNama', found.nama);
        localStorage.setItem('lastLoggedInRole', 'siswa');

        setLoginSuccessData({
          role: 'siswa',
          nama: found.nama,
          sekolah: sName,
          logo: sLogo,
          mataPelajaran: sMataPelajaran
        });

        const studentData = found;
        const teacherUser = matchedTeacherUsername;
        setTimeout(() => {
          onStudentLoginSuccess(studentData, teacherUser);
        }, 2200);
      } else {
        setSiswaError('NIS/Username atau Kata Sandi Siswa salah pada sekolah yang dipilih.');
        setIsSiswaLoading(false);
      }
    }, 600);
  };

  // Retrieve last login details from localStorage for persistent branding even when logged out
  const lastSchoolName = localStorage.getItem('lastLoggedInSchoolName') || settings?.kopSekolah || 'MGMP INFORMATIKA BONDOWOSO';
  const lastSchoolLogo = localStorage.getItem('lastLoggedInSchoolLogo') || settings?.logoSekolah || '';
  const lastMataPelajaran = localStorage.getItem('lastLoggedInMataPelajaran') || settings?.mataPelajaran || 'Informatika';

  return (
    <div className="min-h-screen bg-[#e0e5ec] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      
      {/* Dynamic Full Screen Login Success Overlay */}
      <AnimatePresence>
        {loginSuccessData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              className="w-full max-w-md p-8 rounded-3xl bg-white/95 border border-white/50 shadow-2xl text-center space-y-6"
            >
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl mx-auto overflow-hidden relative"
                >
                  {loginSuccessData.logo ? (
                    <img src={loginSuccessData.logo} alt="Logo Sekolah" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <GraduationCap size={40} />
                  )}
                </motion.div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-white text-xs font-black">
                  ✓
                </div>
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                  Login Berhasil
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight pt-1">
                  Selamat Datang Kembali
                </h2>
                <p className="text-sm font-extrabold text-blue-600 leading-none">
                  {loginSuccessData.nama}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200/50 text-center space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Portal Sekolah</span>
                <span className="text-xs font-extrabold text-slate-700 block truncate">{loginSuccessData.sekolah}</span>
                <span className="text-[10px] text-slate-500 font-bold block">{loginSuccessData.mataPelajaran}</span>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Mempersiapkan dasbor pembelajaran...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-lg p-6 sm:p-10 rounded-3xl neu-flat border border-white/40 space-y-8"
      >
        {/* Logo and Brand */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg mx-auto overflow-hidden">
            {lastSchoolLogo ? (
              <img src={lastSchoolLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <GraduationCap size={32} />
            )}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-wider uppercase leading-tight">
              {lastSchoolName}
            </h2>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Manajemen Pembelajaran {lastMataPelajaran}
            </p>
          </div>
        </div>

        {/* Tab Selector (Neumorphic Style) */}
        <div className="p-1.5 rounded-2xl bg-slate-200/50 neu-inset flex relative overflow-hidden" id="login-role-selector">
          <button
            onClick={() => setRole('guru')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer relative z-10 ${
              role === 'guru'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            id="tab-select-guru"
          >
            <ShieldCheck size={14} />
            <span>Portal Guru</span>
          </button>
          <button
            onClick={() => setRole('siswa')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer relative z-10 ${
              role === 'siswa'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            id="tab-select-siswa"
          >
            <GraduationCap size={14} />
            <span>Portal Siswa</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {role === 'guru' ? (
            <motion.div
              key={isRegistering ? "guru-register" : "guru-login"}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {!isRegistering ? (
                <>
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Masuk sebagai Tenaga Pendidik / Administrator
                    </span>
                  </div>

                  <form onSubmit={handleGuruSubmit} className="space-y-5">
                    {guruError && (
                      <motion.p
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-xs font-bold text-rose-600 text-center bg-rose-50 p-3 rounded-xl border border-rose-100 shadow-sm"
                      >
                        {guruError}
                      </motion.p>
                    )}

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                        Username Admin / Guru
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={guruUsername}
                          onChange={(e) => setGuruUsername(e.target.value)}
                          placeholder="Contoh: admin"
                          className="w-full text-xs pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-semibold text-slate-700 placeholder-slate-400 shadow-inner"
                          id="input-guru-username"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                        Kata Sandi Akses
                      </label>
                      <div className="relative">
                        <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={guruPassword}
                          onChange={(e) => setGuruPassword(e.target.value)}
                          placeholder="Masukkan kata sandi guru"
                          className="w-full text-xs pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-mono text-slate-700 placeholder-slate-400 shadow-inner"
                          id="input-guru-password"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isGuruLoading}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-100 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
                      id="btn-guru-login"
                    >
                      {isGuruLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <ShieldCheck size={16} />
                          <span>Masuk Dashboard Guru</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(true);
                        setGuruError('');
                        setRegError('');
                        setRegSuccess('');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                      id="btn-switch-to-register"
                    >
                      <UserPlus size={14} />
                      <span>Belum punya akun? Daftar sebagai Guru baru</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Pendaftaran Mandiri Guru Baru
                    </span>
                  </div>

                  <form onSubmit={handleRegSubmit} className="space-y-4">
                    {regError && (
                      <motion.p
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-xs font-bold text-rose-600 text-center bg-rose-50 p-3 rounded-xl border border-rose-100 shadow-sm"
                      >
                        {regError}
                      </motion.p>
                    )}

                    {regSuccess && (
                      <motion.p
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-xs font-bold text-emerald-700 text-center bg-emerald-50 p-3 rounded-xl border border-emerald-100 shadow-sm"
                      >
                        {regSuccess}
                      </motion.p>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                        Nama Lengkap & Gelar Guru
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={regNama}
                          onChange={(e) => setRegNama(e.target.value)}
                          placeholder="Contoh: Romlah, S.Kom., M.Cs."
                          className="w-full text-xs pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-semibold text-slate-700 placeholder-slate-400 shadow-inner"
                          id="input-reg-nama"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                        Username Login
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          placeholder="Contoh: romlah"
                          className="w-full text-xs pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-semibold text-slate-700 placeholder-slate-400 shadow-inner"
                          id="input-reg-username"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                        Kata Sandi (Password)
                      </label>
                      <div className="relative">
                        <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Masukkan kata sandi guru"
                          className="w-full text-xs pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-mono text-slate-700 placeholder-slate-400 shadow-inner"
                          id="input-reg-password"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                        Mata Pelajaran
                      </label>
                      <div className="relative">
                        <BookOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={regMataPelajaran}
                          onChange={(e) => setRegMataPelajaran(e.target.value)}
                          placeholder="Contoh: Informatika"
                          className="w-full text-xs pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-semibold text-slate-700 placeholder-slate-400 shadow-inner"
                          id="input-reg-matapelajaran"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                        Asal Sekolah (Nama Sekolah)
                      </label>
                      <div className="relative">
                        <School size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={regAsalSekolah}
                          onChange={(e) => setRegAsalSekolah(e.target.value)}
                          placeholder="Contoh: SMA Negeri 1 Salatiga"
                          className="w-full text-xs pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-semibold text-slate-700 placeholder-slate-400 shadow-inner"
                          id="input-reg-asalsekolah"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isRegLoading}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-100 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
                      id="btn-reg-submit"
                    >
                      {isRegLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <UserPlus size={16} />
                          <span>Ajukan Pendaftaran Guru</span>
                        </>
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegistering(false);
                          setRegError('');
                          setRegSuccess('');
                          setGuruError('');
                        }}
                        className="text-xs text-slate-500 hover:text-slate-700 font-bold hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                        id="btn-switch-to-login"
                      >
                        <span>&larr; Kembali ke Halaman Login Guru</span>
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="siswa-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Masuk sebagai Siswa ({selectedSchool})
                </span>
              </div>

              <form onSubmit={handleSiswaSubmit} className="space-y-5">
                {siswaError && (
                  <motion.p
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-xs font-bold text-rose-600 text-center bg-rose-50 p-3 rounded-xl border border-rose-100 shadow-sm"
                  >
                    {siswaError}
                  </motion.p>
                )}

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Pilih Asal Sekolah Siswa
                  </label>
                  <div className="relative">
                    <School size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                      value={selectedSchool}
                      onChange={(e) => setSelectedSchool(e.target.value)}
                      className="w-full text-xs pl-11 pr-10 py-3.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/10 font-semibold text-slate-700 shadow-inner appearance-none cursor-pointer"
                      id="select-siswa-school"
                    >
                      {uniqueSchools.map((school) => (
                        <option key={school} value={school}>
                          {school}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                      ▼
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    NIS / Username Siswa
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={siswaUsername}
                      onChange={(e) => setSiswaUsername(e.target.value)}
                      placeholder="Masukkan NIS Anda"
                      className="w-full text-xs pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/10 font-semibold text-slate-700 placeholder-slate-400 shadow-inner"
                      id="input-siswa-username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Kata Sandi Portal Siswa
                  </label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={siswaPassword}
                      onChange={(e) => setSiswaPassword(e.target.value)}
                      placeholder="Default: smasa123"
                      className="w-full text-xs pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/10 font-mono text-slate-700 placeholder-slate-400 shadow-inner"
                      id="input-siswa-password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSiswaLoading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-pink-100 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
                  id="btn-siswa-login"
                >
                  {isSiswaLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <GraduationCap size={16} />
                      <span>Masuk Portal Siswa</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center pt-2">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            MGMP INFORMATIKA BONDOWOSO
          </p>
        </div>
      </motion.div>
    </div>
  );
}
