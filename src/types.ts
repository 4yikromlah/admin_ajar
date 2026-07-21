/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Siswa {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  email: string;
  username?: string;
  password?: string;
  foto?: string; // Base64 photo string
}

export interface Nilai {
  id: string;
  siswaId: string;
  siswaNama: string; // Cached/denormalized for convenience
  siswaKelas: string;
  tugas: number;
  uh1: number;
  uh2: number;
  uh3: number;
  uts: number;
  uas: number;
  total: number;
  grade: string;
}

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alfa';

export interface Presensi {
  id: string;
  siswaId: string;
  siswaNama: string;
  siswaKelas: string;
  tanggal: string; // YYYY-MM-DD
  status: AttendanceStatus;
  waktu?: string; // Jam presensi, e.g. "08:15"
  metode?: 'Manual' | 'QR Code';
}

export type JenisPembelajaran = 'Modul' | 'Literasi' | 'Tugas/Tes';

export interface Pembelajaran {
  id: string;
  jenis: JenisPembelajaran;
  judul: string;
  deskripsi: string;
  tautan: string;
  tanggal: string; // YYYY-MM-DD
  tenggat?: string; // YYYY-MM-DD (Tenggat Waktu)
  isUnlocked?: boolean;
  kelasConfig?: {
    [kelas: string]: {
      isActive: boolean;
      tanggal: string;
      tenggat: string;
    };
  };
}

export interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  tanggal: string;
  kategori: 'Penting' | 'Info' | 'Tugas';
}

export interface Rangkuman {
  id: string;
  siswaId: string;
  pembelajaranId: string;
  isi: string;
  tanggal: string;
}

export interface AppSettings {
  namaGuru: string;
  nip: string;
  namaKS: string;
  jabatanKS: string;
  nipKS: string;
  kopPemprov: string;
  kopDinas: string;
  kopSekolah: string;
  kopAlamat: string;
  logoSekolah: string; // Base64 string
  logoProv: string;    // Base64 string
  kkm: number;
  kota: string;
  tahunPelajaran?: string;
  literasiStartAccess?: string;
  literasiEndAccess?: string;
  tugasStartAccess?: string;
  tugasEndAccess?: string;
  spreadsheetUrl?: string;
  adminUsername?: string;
  adminPassword?: string;
  adminEmail?: string;
  mataPelajaran?: string;
}

export interface TeacherAccount {
  id: string;
  nama: string;
  username: string;
  password?: string;
  mataPelajaran: string;
  isApproved?: boolean;
  asalSekolah?: string;
  spreadsheetUrl?: string;
  email?: string;
}

