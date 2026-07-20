/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BarChart3, Download, Award, ShieldAlert, GraduationCap, CheckCircle2, CalendarDays, FileText, HelpCircle, BookOpen, BookCheck, ClipboardList, CheckCircle, Eye, Search, BookMarked, X, Printer, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Siswa, Nilai, Presensi, AppSettings, Pembelajaran, Rangkuman } from '../types';
import { loadRangkuman } from '../data';
import { jsPDF } from 'jspdf';

interface LaporanProps {
  siswaList: Siswa[];
  nilaiList: Nilai[];
  presensiList: Presensi[];
  pembelajaranList?: Pembelajaran[];
  settings: AppSettings;
}

const indonesianMonths = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function Laporan({ siswaList, nilaiList, presensiList, pembelajaranList, settings }: LaporanProps) {
  const [activeTab, setActiveTab] = useState<'akademik' | 'presensi' | 'literasi'>('akademik');
  const [filterKelas, setFilterKelas] = useState('');
  
  const [logoSekolahRatio, setLogoSekolahRatio] = useState<number>(1);
  const [logoProvRatio, setLogoProvRatio] = useState<number>(1);
  
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [rangkumanList, setRangkumanList] = useState<Rangkuman[]>(() => loadRangkuman());
  const [selectedLiterasiId, setSelectedLiterasiId] = useState<string>('all');
  const [literasiRange, setLiterasiRange] = useState<'Harian' | 'Bulanan' | 'Semester'>('Bulanan');
  const [selectedLiterasiTanggal, setSelectedLiterasiTanggal] = useState('2026-07-07');
  const [selectedLiterasiBulan, setSelectedLiterasiBulan] = useState('07');
  const [selectedLiterasiSemester, setSelectedLiterasiSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [viewingSummary, setViewingSummary] = useState<Rangkuman | null>(null);
  const [summaryStudent, setSummaryStudent] = useState<Siswa | null>(null);
  const [summaryMateri, setSummaryMateri] = useState<Pembelajaran | null>(null);

  useEffect(() => {
    if (activeTab === 'literasi') {
      setRangkumanList(loadRangkuman());
    }
  }, [activeTab]);

  useEffect(() => {
    if (settings.logoSekolah) {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setLogoSekolahRatio(img.naturalWidth / img.naturalHeight);
        }
      };
      img.src = settings.logoSekolah;
    } else {
      setLogoSekolahRatio(1);
    }
  }, [settings.logoSekolah]);

  useEffect(() => {
    if (settings.logoProv) {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setLogoProvRatio(img.naturalWidth / img.naturalHeight);
        }
      };
      img.src = settings.logoProv;
    } else {
      setLogoProvRatio(1);
    }
  }, [settings.logoProv]);
  
  // Ambil nama kota dari pengaturan atau alamat untuk kop dan tanggal TTD
  let cityStr = settings.kota || 'Salatiga';
  if (!settings.kota) {
    const alamatLower = settings.kopAlamat.toLowerCase();
    if (alamatLower.includes('salatiga')) {
      cityStr = 'Salatiga';
    } else {
      const parts = settings.kopAlamat.split(',');
      for (const part of parts) {
        const pLower = part.toLowerCase();
        if (pLower.includes('kab.') || pLower.includes('kota') || pLower.includes('kabupaten')) {
          cityStr = part.replace(/kab\.|kota|kabupaten/gi, '').trim();
          break;
        }
      }
    }
  }
  if (!cityStr) {
    cityStr = 'Salatiga';
  }

  // State Filter Presensi
  const [presensiRange, setPresensiRange] = useState<'Harian' | 'Bulanan' | 'Semester'>('Harian');
  const [selectedTanggal, setSelectedTanggal] = useState('2026-07-07');
  const [selectedBulan, setSelectedBulan] = useState('07'); // Default Juli
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  // Daftar kelas unik untuk filter
  const uniqueKelasList = Array.from(new Set(siswaList.map((s) => s.kelas)));

  // Filter siswa berdasarkan kelas yang dipilih
  const filteredSiswa = siswaList.filter(
    (s) => filterKelas === '' || s.kelas === filterKelas
  );

  // Filter nilai & presensi yang relevan
  const filteredNilai = nilaiList.filter(
    (n) => filterKelas === '' || n.siswaKelas === filterKelas
  );

  const filteredPresensi = presensiList.filter(
    (p) => filterKelas === '' || p.siswaKelas === filterKelas
  );

  // --- INDONESIAN DATE FORMAT HELPER ---
  const formatIndonesianDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${day} ${indonesianMonths[monthIdx]} ${year}`;
  };

  const getIndonesianMonthName = (monthStr: string): string => {
    const idx = parseInt(monthStr, 10) - 1;
    return indonesianMonths[idx] || '';
  };

  // --- KALKULASI ANALITIK KELAS ---
  const rataSkorKelas = filteredNilai.length > 0
    ? Number((filteredNilai.reduce((acc, curr) => acc + curr.total, 0) / filteredNilai.length).toFixed(1))
    : 0;

  const siswaLulus = filteredNilai.filter((n) => n.total >= settings.kkm).length;
  const tingkatKelulusan = filteredNilai.length > 0
    ? Math.round((siswaLulus / filteredNilai.length) * 100)
    : 100;

  const siswaTerbaik = filteredNilai.length > 0
    ? [...filteredNilai].sort((a, b) => b.total - a.total)[0]
    : null;

  const siswaRemedial = filteredNilai.filter((n) => n.total < settings.kkm);

  const rataKehadiran = (() => {
    if (filteredPresensi.length === 0) return 100;
    const hadir = filteredPresensi.filter((p) => p.status === 'Hadir').length;
    return Math.round((hadir / filteredPresensi.length) * 100);
  })();

  // --- DRAWING TEMPLATE UNTUK PDF (KOP SURAT, SIGNATURE, TABLE) ---
  const drawKopSurat = (doc: jsPDF, title: string, subtitleDetails: string[]) => {
    // Draw Logos (with vectors fallback if blank)
    let logoSekolahDrawn = false;
    if (settings.logoSekolah) {
      try {
        let sWidth = 18;
        let sHeight = 18;
        if (logoSekolahRatio > 1) {
          sWidth = 20;
          sHeight = 20 / logoSekolahRatio;
          if (sHeight > 18) {
            sHeight = 18;
            sWidth = 18 * logoSekolahRatio;
          }
        } else {
          sHeight = 18;
          sWidth = 18 * logoSekolahRatio;
          if (sWidth > 20) {
            sWidth = 20;
            sHeight = 20 / logoSekolahRatio;
          }
        }
        const sX = 15 + (20 - sWidth) / 2;
        const sY = 12 + (18 - sHeight) / 2;

        // Detect format dynamically from base64 or URL
        let format = 'PNG';
        const src = settings.logoSekolah;
        if (src.startsWith('data:')) {
          const match = src.match(/^data:image\/([a-zA-Z+]+);/);
          if (match && match[1]) {
            const ext = match[1].toLowerCase();
            if (ext === 'jpg' || ext === 'jpeg') format = 'JPEG';
            else if (ext === 'png') format = 'PNG';
            else if (ext === 'webp') format = 'WEBP';
            else format = ext.toUpperCase();
          }
        }

        doc.addImage(settings.logoSekolah, format, sX, sY, sWidth, sHeight);
        logoSekolahDrawn = true;
      } catch (e) {
        console.error("Error drawing logoSekolah with detected format:", e);
        try {
          const sX = 15 + (20 - 18) / 2;
          const sY = 12 + (18 - 18) / 2;
          doc.addImage(settings.logoSekolah, 'JPEG', sX, sY, 18, 18);
          logoSekolahDrawn = true;
        } catch (err) {
          console.error("Error drawing logoSekolah with fallback:", err);
        }
      }
    }

    if (!logoSekolahDrawn) {
      // Elegant vector badge for school
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.6);
      doc.rect(15, 12, 18, 18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(30, 41, 59);
      doc.text('LOGO', 24, 20, { align: 'center' });
      doc.text('SEKOLAH', 24, 24, { align: 'center' });
    }

    let logoProvDrawn = false;
    if (settings.logoProv) {
      try {
        let pWidth = 18;
        let pHeight = 18;
        if (logoProvRatio > 1) {
          pWidth = 20;
          pHeight = 20 / logoProvRatio;
          if (pHeight > 18) {
            pHeight = 18;
            pWidth = 18 * logoProvRatio;
          }
        } else {
          pHeight = 18;
          pWidth = 18 * logoProvRatio;
          if (pWidth > 20) {
            pWidth = 20;
            pHeight = 20 / logoProvRatio;
          }
        }
        const pX = 175 + (20 - pWidth) / 2;
        const pY = 12 + (18 - pHeight) / 2;

        // Detect format dynamically from base64 or URL
        let format = 'PNG';
        const src = settings.logoProv;
        if (src.startsWith('data:')) {
          const match = src.match(/^data:image\/([a-zA-Z+]+);/);
          if (match && match[1]) {
            const ext = match[1].toLowerCase();
            if (ext === 'jpg' || ext === 'jpeg') format = 'JPEG';
            else if (ext === 'png') format = 'PNG';
            else if (ext === 'webp') format = 'WEBP';
            else format = ext.toUpperCase();
          }
        }

        doc.addImage(settings.logoProv, format, pX, pY, pWidth, pHeight);
        logoProvDrawn = true;
      } catch (e) {
        console.error("Error drawing logoProv with detected format:", e);
        try {
          const pX = 175 + (20 - 18) / 2;
          const pY = 12 + (18 - 18) / 2;
          doc.addImage(settings.logoProv, 'JPEG', pX, pY, 18, 18);
          logoProvDrawn = true;
        } catch (err) {
          console.error("Error drawing logoProv with fallback:", err);
        }
      }
    }

    if (!logoProvDrawn) {
      // Elegant vector badge for province
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.6);
      doc.circle(186, 21, 9);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(30, 41, 59);
      doc.text('LOGO', 186, 20, { align: 'center' });
      doc.text('PROV', 186, 24, { align: 'center' });
    }

    // Header Texts from Settings
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(settings.kopPemprov.toUpperCase(), 105, 15, { align: 'center' });
    doc.text(settings.kopDinas.toUpperCase(), 105, 20, { align: 'center' });
    
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.kopSekolah.toUpperCase(), 105, 27, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(settings.kopAlamat, 105, 33, { align: 'center' });
    
    // Double lines
    doc.setLineWidth(0.8);
    doc.setDrawColor(30, 41, 59);
    doc.line(15, 40, 195, 40);
    doc.setLineWidth(0.2);
    doc.line(15, 41.5, 195, 41.5);
    
    // Judul Laporan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(title, 105, 50, { align: 'center' });
    
    // Sub-rincian metadata
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    let yPos = 56;
    subtitleDetails.forEach((line) => {
      doc.text(line, 105, yPos, { align: 'center' });
      yPos += 5;
    });
    
    return yPos + 3; // Mengembalikan posisi Y berikutnya untuk tabel
  };

  const drawSignatureBlock = (doc: jsPDF, startY: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    let sigY = startY;
    if (sigY + 35 > pageHeight - 15) {
      doc.addPage();
      sigY = 20;
    }
    
    const today = new Date();
    const dateStr = `${today.getDate()} ${indonesianMonths[today.getMonth()]} ${today.getFullYear()}`;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    
    // Determine City name dynamically
    let cityStr = settings.kota || 'Salatiga';
    if (!settings.kota) {
      const alamatLower = settings.kopAlamat.toLowerCase();
      if (alamatLower.includes('salatiga')) {
        cityStr = 'Salatiga';
      } else {
        const parts = settings.kopAlamat.split(',');
        for (const part of parts) {
          if (part.toLowerCase().includes('kab.') || part.toLowerCase().includes('kota') || part.toLowerCase().includes('kabupaten')) {
            cityStr = part.replace(/kab\.|kota|kabupaten/gi, '').trim();
            break;
          }
        }
      }
    }
    if (!cityStr) {
      cityStr = 'Salatiga';
    }

    // Kiri: Kepala Sekolah
    doc.text('Mengetahui,', 25, sigY);
    doc.text('Kepala Sekolah,', 25, sigY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.namaKS || 'Dr. Joko Wahyono, M.Pd.', 25, sigY + 28);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.jabatanKS || 'Pembina Tk. I, IV/b', 25, sigY + 32);
    doc.text(`NIP. ${settings.nipKS || '19740512 200003 1 002'}`, 25, sigY + 36);
    
    // Kanan: Guru Pelajaran
    doc.text(`${cityStr}, ${dateStr}`, 130, sigY);
    doc.text('Guru Mata Pelajaran Informatika', 130, sigY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.namaGuru, 130, sigY + 28);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${settings.nip}`, 130, sigY + 36);
  };

  const drawTable = (
    doc: jsPDF,
    startY: number,
    headers: string[],
    columnWidths: number[],
    rows: string[][],
    alignments?: ('left' | 'center' | 'right')[]
  ) => {
    let currentY = startY;
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 15;
    
    // Render Header Tabel
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(leftMargin, currentY, 180, 8, 'F');
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.2);
    doc.rect(leftMargin, currentY, 180, 8, 'D');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85); // slate-700
    
    let currentX = leftMargin;
    headers.forEach((header, idx) => {
      const width = columnWidths[idx];
      const align = alignments ? alignments[idx] : 'left';
      let textX = currentX;
      if (align === 'center') textX = currentX + width / 2;
      else if (align === 'right') textX = currentX + width - 2;
      else textX = currentX + 2;
      
      doc.text(header, textX, currentY + 5.5, { align: align === 'left' ? 'left' : align === 'center' ? 'center' : 'right' });
      currentX += width;
    });
    
    currentY += 8;
    
    // Render Baris Data
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59); // slate-800
    
    rows.forEach((row) => {
      // Periksa kebutuhan halaman baru
      if (currentY + 6 > pageHeight - 15) {
        doc.addPage();
        currentY = 20;
        
        // Re-draw Header Tabel di halaman baru
        doc.setFillColor(241, 245, 249);
        doc.rect(leftMargin, currentY, 180, 8, 'F');
        doc.rect(leftMargin, currentY, 180, 8, 'D');
        doc.setFont('helvetica', 'bold');
        currentX = leftMargin;
        headers.forEach((header, idx) => {
          const width = columnWidths[idx];
          const align = alignments ? alignments[idx] : 'left';
          let textX = currentX;
          if (align === 'center') textX = currentX + width / 2;
          else if (align === 'right') textX = currentX + width - 2;
          else textX = currentX + 2;
          doc.text(header, textX, currentY + 5.5, { align: align === 'left' ? 'left' : align === 'center' ? 'center' : 'right' });
          currentX += width;
        });
        currentY += 8;
        doc.setFont('helvetica', 'normal');
      }
      
      // Menggambar sel-sel baris
      doc.rect(leftMargin, currentY, 180, 6, 'D');
      
      currentX = leftMargin;
      row.forEach((cell, idx) => {
        const width = columnWidths[idx];
        const align = alignments ? alignments[idx] : 'left';
        let textX = currentX;
        if (align === 'center') textX = currentX + width / 2;
        else if (align === 'right') textX = currentX + width - 2;
        else textX = currentX + 2;
        
        doc.text(cell, textX, currentY + 4.2, { align: align === 'left' ? 'left' : align === 'center' ? 'center' : 'right' });
        currentX += width;
      });
      
      currentY += 6;
    });
    
    return currentY;
  };

  // --- PDF EXPORTERS ---
  const handleDownloadAcademicPDF = () => {
    try {
      const doc = new jsPDF();
      
      const title = 'LAPORAN HASIL BELAJAR AKADEMIK SISWA';
      const metadata = [
        `Mata Pelajaran: Informatika`,
        `Kelas: ${filterKelas || 'Semua Kelas'}`,
        `Tahun Pelajaran: ${settings.tahunPelajaran || '2025/2026'}`
      ];
      
      const startY = drawKopSurat(doc, title, metadata);
      
      const headers = [
        'No', 'NISN', 'Nama Siswa', 'Kelas', 'Tgs', 'UH1', 'UH2', 'UH3', 'UTS', 'UAS', 'Skor', 'Grd', 'Status'
      ];
      const columnWidths = [
        8, 16, 40, 18, 10, 10, 10, 10, 10, 10, 12, 10, 16
      ];
      const alignments: ('left' | 'center' | 'right')[] = [
        'center', 'center', 'left', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center'
      ];
      
      const rows = filteredSiswa.map((siswa, idx) => {
        const nilai = filteredNilai.find((n) => n.siswaId === siswa.id);
        const statusLulus = nilai ? nilai.total >= settings.kkm : false;
        return [
          (idx + 1).toString(),
          siswa.nis || '-',
          siswa.nama || '-',
          siswa.kelas || '-',
          (nilai && nilai.tugas !== undefined && nilai.tugas !== null) ? nilai.tugas.toString() : '-',
          (nilai && nilai.uh1 !== undefined && nilai.uh1 !== null) ? nilai.uh1.toString() : '-',
          (nilai && nilai.uh2 !== undefined && nilai.uh2 !== null) ? nilai.uh2.toString() : '-',
          (nilai && nilai.uh3 !== undefined && nilai.uh3 !== null) ? nilai.uh3.toString() : '-',
          (nilai && nilai.uts !== undefined && nilai.uts !== null) ? nilai.uts.toString() : '-',
          (nilai && nilai.uas !== undefined && nilai.uas !== null) ? nilai.uas.toString() : '-',
          (nilai && nilai.total !== undefined && nilai.total !== null) ? nilai.total.toString() : '-',
          nilai && nilai.grade ? nilai.grade : '-',
          statusLulus ? 'TUNTAS' : 'REMEDIAL'
        ];
      });
      
      const finalY = drawTable(doc, startY, headers, columnWidths, rows, alignments);
      drawSignatureBlock(doc, finalY + 12);
      
      doc.save(`Laporan_Akademik_${filterKelas || 'Semua_Kelas'}_SMASA.pdf`);
    } catch (err) {
      console.error(err);
      alert('Gagal mengunduh PDF');
    }
  };

  const handlePrint = () => {
    try {
      // Deteksi apakah aplikasi dibuka di dalam iframe (misalnya, sandboxed preview AI Studio)
      const isInIframe = window.self !== window.top;
      
      if (isInIframe) {
        setShowPrintConfirm(true);
        return;
      }
      
      // Jika di luar iframe atau pengguna tetap ingin mencoba cetak langsung
      window.print();
    } catch (e) {
      console.error("Gagal melakukan pencetakan:", e);
      alert(
        "Gagal membuka dialog cetak langsung browser.\n\n" +
        "Silakan gunakan tombol 'Unduh PDF' di samping tombol Cetak untuk menyimpan laporan ke komputer Anda, kemudian cetak file tersebut."
      );
    }
  };

  const handleDownloadLiterasiPDF = () => {
    try {
      const doc = new jsPDF();
      const literasiMateriList = (pembelajaranList || []).filter(p => p.jenis === 'Literasi');
      
      let title = '';
      let metadata: string[] = [];
      let headers: string[] = [];
      let columnWidths: number[] = [];
      let alignments: ('left' | 'center' | 'right')[] = [];
      let rows: string[][] = [];
      
      if (literasiRange === 'Harian') {
        title = 'LAPORAN LITERASI HARIAN SISWA';
        metadata = [
          `Mata Pelajaran: Informatika`,
          `Kelas: ${filterKelas || 'Semua Kelas'}`,
          `Tanggal: ${formatIndonesianDate(selectedLiterasiTanggal)}`,
          `Tahun Pelajaran: ${settings.tahunPelajaran || '2025/2026'}`
        ];
        
        headers = ['No', 'NISN', 'Nama Siswa', 'Kelas', 'Materi', 'Tanggal', 'Status'];
        columnWidths = [12, 18, 45, 15, 45, 20, 25];
        alignments = ['center', 'center', 'left', 'center', 'left', 'center', 'center'];
        
        rows = filteredSiswa.map((siswa, idx) => {
          const matchingSummaries = rangkumanList.filter(
            (r) => r.siswaId === siswa.id && r.tanggal === selectedLiterasiTanggal && literasiMateriList.some(m => m.id === r.pembelajaranId)
          );
          
          let materiTitles = matchingSummaries.map(r => {
            const m = literasiMateriList.find(mat => mat.id === r.pembelajaranId);
            return m ? m.judul : '';
          }).filter(Boolean).join(', ');
          
          if (!materiTitles && matchingSummaries.length > 0) materiTitles = 'Materi Literasi';
          
          return [
            (idx + 1).toString(),
            siswa.nis || '-',
            siswa.nama || '-',
            siswa.kelas || '-',
            matchingSummaries.length > 0 ? (materiTitles.length > 25 ? materiTitles.substring(0, 25) + '...' : materiTitles) : '-',
            matchingSummaries.length > 0 ? formatIndonesianDate(selectedLiterasiTanggal) : '-',
            matchingSummaries.length > 0 ? 'SUDAH SETOR' : 'BELUM SETOR'
          ];
        });
      } else if (literasiRange === 'Bulanan') {
        const blnName = getIndonesianMonthName(selectedLiterasiBulan);
        title = 'LAPORAN REKAPITULASI LITERASI BULANAN';
        metadata = [
          `Mata Pelajaran: Informatika`,
          `Kelas: ${filterKelas || 'Semua Kelas'}`,
          `Bulan: ${blnName} 2026`,
          `Tahun Pelajaran: ${settings.tahunPelajaran || '2025/2026'}`
        ];
        
        headers = ['No', 'NISN', 'Nama Siswa', 'Kelas', 'Selesai', 'Total Materi', 'Persentase'];
        columnWidths = [15, 25, 65, 25, 20, 20, 15];
        alignments = ['center', 'center', 'left', 'center', 'center', 'center', 'center'];
        
        rows = filteredSiswa.map((siswa, idx) => {
          const totalMateriInMonth = literasiMateriList.filter(
            (m) => m.tanggal && m.tanggal.split('-')[1] === selectedLiterasiBulan
          );
          const completedInMonth = rangkumanList.filter(
            (r) => r.siswaId === siswa.id && r.tanggal && r.tanggal.split('-')[1] === selectedLiterasiBulan && literasiMateriList.some(m => m.id === r.pembelajaranId)
          );
          const pct = totalMateriInMonth.length > 0 
            ? Math.round((completedInMonth.length / totalMateriInMonth.length) * 100)
            : 100;
            
          return [
            (idx + 1).toString(),
            siswa.nis || '-',
            siswa.nama || '-',
            siswa.kelas || '-',
            completedInMonth.length.toString(),
            totalMateriInMonth.length.toString(),
            `${pct}%`
          ];
        });
      } else {
        // Semester
        title = 'LAPORAN REKAPITULASI LITERASI SEMESTER';
        metadata = [
          `Mata Pelajaran: Informatika`,
          `Kelas: ${filterKelas || 'Semua Kelas'}`,
          `Semester: ${selectedLiterasiSemester} (TP ${settings.tahunPelajaran || '2025/2026'})`,
          `Tahun Pelajaran: ${settings.tahunPelajaran || '2025/2026'}`
        ];
        
        headers = ['No', 'NISN', 'Nama Siswa', 'Kelas', 'Selesai', 'Total Materi', 'Persentase', 'Predikat'];
        columnWidths = [10, 20, 55, 15, 20, 20, 18, 22];
        alignments = ['center', 'center', 'left', 'center', 'center', 'center', 'center', 'center'];
        
        const validMonths = selectedLiterasiSemester === 'Ganjil' 
          ? ['07', '08', '09', '10', '11', '12'] 
          : ['01', '02', '03', '04', '05', '06'];
          
        const semesterMateriList = literasiMateriList.filter(
          (m) => m.tanggal && validMonths.includes(m.tanggal.split('-')[1])
        );
        
        rows = filteredSiswa.map((siswa, idx) => {
          const completedInSemester = rangkumanList.filter(
            (r) => r.siswaId === siswa.id && r.tanggal && validMonths.includes(r.tanggal.split('-')[1]) && literasiMateriList.some(m => m.id === r.pembelajaranId)
          );
          const pct = semesterMateriList.length > 0
            ? Math.round((completedInSemester.length / semesterMateriList.length) * 100)
            : 100;
          let predicate = 'Kurang';
          if (pct >= 85) predicate = 'Sangat Baik';
          else if (pct >= 70) predicate = 'Baik';
          else if (pct >= 50) predicate = 'Cukup';
          
          return [
            (idx + 1).toString(),
            siswa.nis || '-',
            siswa.nama || '-',
            siswa.kelas || '-',
            completedInSemester.length.toString(),
            semesterMateriList.length.toString(),
            `${pct}%`,
            predicate
          ];
        });
      }
      
      const startY = drawKopSurat(doc, title, metadata);
      const finalY = drawTable(doc, startY, headers, columnWidths, rows, alignments);
      drawSignatureBlock(doc, finalY + 12);
      
      doc.save(`Laporan_Literasi_${literasiRange}_${filterKelas || 'Semua_Kelas'}_SMASA.pdf`);
    } catch (err) {
      console.error(err);
      alert('Gagal mengunduh PDF');
    }
  };

  const handleDownloadPresensiPDF = () => {
    try {
      const doc = new jsPDF();
      
      let title = '';
      let metadata: string[] = [];
      let headers: string[] = [];
      let columnWidths: number[] = [];
      let alignments: ('left' | 'center' | 'right')[] = [];
      let rows: string[][] = [];
      
      if (presensiRange === 'Harian') {
        title = 'LAPORAN PRESENSI HARIAN SISWA';
        metadata = [
          `Mata Pelajaran: Informatika`,
          `Kelas: ${filterKelas || 'Semua Kelas'}`,
          `Tanggal: ${formatIndonesianDate(selectedTanggal)}`,
          `Tahun Pelajaran: ${settings.tahunPelajaran || '2025/2026'}`
        ];
        
        headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Tanggal', 'Status Kehadiran'];
        columnWidths = [15, 25, 65, 25, 25, 25];
        alignments = ['center', 'center', 'left', 'center', 'center', 'center'];
        
        rows = filteredSiswa.map((siswa, idx) => {
          const match = filteredPresensi.find(
            (p) => p.siswaId === siswa.id && p.tanggal === selectedTanggal
          );
          return [
            (idx + 1).toString(),
            siswa.nis,
            siswa.nama,
            siswa.kelas,
            selectedTanggal,
            match ? match.status : 'Hadir (Default)'
          ];
        });
      } else if (presensiRange === 'Bulanan') {
        const uniqueDates = Array.from(new Set(
          filteredPresensi
            .filter((p) => p.tanggal && p.tanggal.split('-')[1] === selectedBulan)
            .map((p) => p.tanggal)
        )).sort();

        const blnName = getIndonesianMonthName(selectedBulan);
        title = `LAPORAN REKAPITULASI PRESENSI BULANAN`;
        metadata = [
          `Mata Pelajaran: Informatika`,
          `Kelas: ${filterKelas || 'Semua Kelas'}`,
          `Bulan: ${blnName} 2026`,
          `Tahun Pelajaran: ${settings.tahunPelajaran || '2025/2026'}`
        ];

        if (uniqueDates.length > 0) {
          const dateHeaders = uniqueDates.map(d => d.split('-')[2]);
          headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', ...dateHeaders, 'H', 'S', 'I', 'A', 'Sesi', '%'];
          
          const baseColsWidth = 8 + 15 + 38 + 15 + (4 * 7) + 10 + 12; // 126mm
          const remainingSpace = 180 - baseColsWidth; // 54mm
          const dateColWidth = Math.max(4, Math.min(8, remainingSpace / uniqueDates.length));
          
          const totalDateWidth = dateColWidth * uniqueDates.length;
          const namaWidth = Math.max(25, 180 - (8 + 15 + 15 + totalDateWidth + 28 + 10 + 12));
          
          columnWidths = [
            8,
            15,
            namaWidth,
            15,
            ...uniqueDates.map(() => dateColWidth),
            7, 7, 7, 7,
            10,
            12
          ];
          
          alignments = [
            'center', 'center', 'left', 'center',
            ...uniqueDates.map(() => 'center' as const),
            'center', 'center', 'center', 'center', 'center', 'center'
          ];
          
          rows = filteredSiswa.map((siswa, idx) => {
            const pSiswa = filteredPresensi.filter(
              (p) => p.siswaId === siswa.id && p.tanggal && p.tanggal.split('-')[1] === selectedBulan
            );
            const h = pSiswa.filter((p) => p.status === 'Hadir').length;
            const s = pSiswa.filter((p) => p.status === 'Sakit').length;
            const i = pSiswa.filter((p) => p.status === 'Izin').length;
            const a = pSiswa.filter((p) => p.status === 'Alfa').length;
            const total = h + s + i + a;
            const pct = total > 0 ? Math.round((h / total) * 100) : 100;
            
            const dateStatuses = uniqueDates.map(date => {
              const match = pSiswa.find(p => p.tanggal === date);
              if (!match) return '-';
              return match.status === 'Hadir' ? 'H' :
                     match.status === 'Sakit' ? 'S' :
                     match.status === 'Izin' ? 'I' : 'A';
            });
            
            return [
              (idx + 1).toString(),
              siswa.nis,
              siswa.nama,
              siswa.kelas,
              ...dateStatuses,
              h.toString(),
              s.toString(),
              i.toString(),
              a.toString(),
              total.toString(),
              `${pct}%`
            ];
          });
        } else {
          headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Hadir (H)', 'Sakit (S)', 'Izin (I)', 'Alpa (A)', 'Sesi', '% Kehadiran'];
          columnWidths = [10, 20, 50, 20, 13, 13, 13, 13, 13, 22];
          alignments = ['center', 'center', 'left', 'center', 'center', 'center', 'center', 'center', 'center', 'center'];
          
          rows = filteredSiswa.map((siswa, idx) => {
            const pSiswa = filteredPresensi.filter(
              (p) => p.siswaId === siswa.id && p.tanggal && p.tanggal.split('-')[1] === selectedBulan
            );
            const h = pSiswa.filter((p) => p.status === 'Hadir').length;
            const s = pSiswa.filter((p) => p.status === 'Sakit').length;
            const i = pSiswa.filter((p) => p.status === 'Izin').length;
            const a = pSiswa.filter((p) => p.status === 'Alfa').length;
            const total = h + s + i + a;
            const pct = total > 0 ? Math.round((h / total) * 100) : 100;
            
            return [
              (idx + 1).toString(),
              siswa.nis,
              siswa.nama,
              siswa.kelas,
              h.toString(),
              s.toString(),
              i.toString(),
              a.toString(),
              total.toString(),
              `${pct}%`
            ];
          });
        }
      } else {
        title = `LAPORAN REKAPITULASI PRESENSI SEMESTER`;
        metadata = [
          `Mata Pelajaran: Informatika`,
          `Kelas: ${filterKelas || 'Semua Kelas'}`,
          `Semester: ${selectedSemester} Ganjil (TP ${settings.tahunPelajaran || '2025/2026'})`,
          `Tahun Pelajaran: ${settings.tahunPelajaran || '2025/2026'}`
        ];
        
        headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Hadir (H)', 'Sakit (S)', 'Izin (I)', 'Alpa (A)', 'Sesi', '% Kehadiran'];
        columnWidths = [10, 20, 50, 20, 13, 13, 13, 13, 13, 22];
        alignments = ['center', 'center', 'left', 'center', 'center', 'center', 'center', 'center', 'center', 'center'];
        
        const validMonths = selectedSemester === 'Ganjil' 
          ? ['07', '08', '09', '10', '11', '12'] 
          : ['01', '02', '03', '04', '05', '06'];
          
        rows = filteredSiswa.map((siswa, idx) => {
          const pSiswa = filteredPresensi.filter(
            (p) => p.siswaId === siswa.id && p.tanggal && validMonths.includes(p.tanggal.split('-')[1])
          );
          const h = pSiswa.filter((p) => p.status === 'Hadir').length;
          const s = pSiswa.filter((p) => p.status === 'Sakit').length;
          const i = pSiswa.filter((p) => p.status === 'Izin').length;
          const a = pSiswa.filter((p) => p.status === 'Alfa').length;
          const total = h + s + i + a;
          const pct = total > 0 ? Math.round((h / total) * 100) : 100;
          
          return [
            (idx + 1).toString(),
            siswa.nis,
            siswa.nama,
            siswa.kelas,
            h.toString(),
            s.toString(),
            i.toString(),
            a.toString(),
            total.toString(),
            `${pct}%`
          ];
        });
      }
      
      const startY = drawKopSurat(doc, title, metadata);
      const finalY = drawTable(doc, startY, headers, columnWidths, rows, alignments);
      drawSignatureBlock(doc, finalY + 12);
      
      doc.save(`Laporan_Presensi_${presensiRange}_${filterKelas || 'Semua_Kelas'}_SMASA.pdf`);
    } catch (err) {
      console.error(err);
      alert('Gagal mengunduh PDF');
    }
  };

  // --- CSV EXPORTER (LEGACY BACKWARD COMPATIBLE) ---
  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "NIS,Nama Siswa,Kelas,Nilai Tugas,Nilai UH1,Nilai UH2,Nilai UH3,Nilai UTS,Nilai UAS,Skor Akhir,Grade,Tingkat Kehadiran\n";

      filteredSiswa.forEach((siswa) => {
        const nilai = filteredNilai.find((n) => n.siswaId === siswa.id);
        const presensiSiswa = filteredPresensi.filter((p) => p.siswaId === siswa.id);
        const totalHari = presensiSiswa.length;
        const hariMasuk = presensiSiswa.filter((p) => p.status === 'Hadir').length;
        const rateAbsensi = totalHari > 0 ? Math.round((hariMasuk / totalHari) * 100) : 100;

        const row = [
          siswa.nis,
          `"${siswa.nama}"`,
          siswa.kelas,
          nilai ? nilai.tugas : 0,
          nilai ? nilai.uh1 : 0,
          nilai ? nilai.uh2 : 0,
          nilai ? nilai.uh3 : 0,
          nilai ? nilai.uts : 0,
          nilai ? nilai.uas : 0,
          nilai ? nilai.total : 0,
          nilai ? nilai.grade : 'Belum diisi',
          `${rateAbsensi}%`
        ];

        csvContent += row.join(",") + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Laporan_Informatika_${filterKelas || 'Semua_Kelas'}_SMASA.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menyusun berkas laporan.");
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Halaman Utama */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-blue-600 w-6 h-6" /> Buku Laporan Resmi & Rekapitulasi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Sistem cetak rapor akademik, analisis nilai, dan rekapitulasi presensi terstruktur</p>
        </div>
        
        {/* Selector Kelas Utama */}
        <div className="flex items-center gap-3 shrink-0">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Kelas:</label>
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            id="filter-laporan-kelas"
          >
            <option value="">Semua Kelas</option>
            {uniqueKelasList.map((k) => (
              <option key={k} value={k}>
                Kelas {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs (Akademik vs Presensi vs Literasi) */}
      <div className="flex border-b border-slate-200/80">
        <button
          onClick={() => setActiveTab('akademik')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'akademik'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <GraduationCap size={16} />
          <span>Laporan Nilai & Akademik</span>
        </button>
        <button
          onClick={() => setActiveTab('presensi')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'presensi'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
          id="tab-laporan-presensi"
        >
          <CalendarDays size={16} />
          <span>Laporan Kehadiran / Presensi</span>
        </button>
        <button
          onClick={() => setActiveTab('literasi')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'literasi'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
          id="tab-laporan-literasi"
        >
          <BookOpen size={16} />
          <span>Laporan Literasi Siswa</span>
        </button>
      </div>

      {/* TAB 1: LAPORAN AKADEMIK */}
      {activeTab === 'akademik' && (
        <div className="space-y-6">
          {/* Analitik Statistik Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="neu-flat p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Kelas</span>
              <h4 className="text-2xl font-black text-blue-600 mt-1 font-mono">{rataSkorKelas}</h4>
              <p className="text-[10px] text-slate-500 mt-1">Skor Kumulatif</p>
            </div>
            
            <div className="neu-flat p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tingkat Kelulusan</span>
              <h4 className="text-2xl font-black text-emerald-600 mt-1 font-mono">{tingkatKelulusan}%</h4>
              <p className="text-[10px] text-slate-500 mt-1">Nilai &ge; {settings.kkm} (KKM)</p>
            </div>

            <div className="neu-flat p-4 rounded-2xl flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <Award size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Siswa Terbaik</span>
                <h5 className="text-xs font-bold text-slate-800 truncate mt-0.5">
                  {siswaTerbaik ? siswaTerbaik.siswaNama : 'Belum diisi'}
                </h5>
                <span className="text-[9px] font-bold text-blue-500 uppercase font-mono">
                  Skor: {siswaTerbaik ? siswaTerbaik.total : 0} ({siswaTerbaik ? siswaTerbaik.grade : '-'})
                </span>
              </div>
            </div>

            <div className="neu-flat p-4 rounded-2xl flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <ShieldAlert size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Remedial/Bimbingan</span>
                <h5 className="text-xs font-bold text-slate-800 mt-0.5">{siswaRemedial.length} Siswa</h5>
                <span className="text-[9px] font-bold text-rose-500 uppercase">Di bawah KKM ({settings.kkm})</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/50 p-3 rounded-2xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">
              * Rapor Akademik menggunakan pembobotan: Tugas (25%), Rata UH (15%), UTS (30%), UAS (30%).
            </span>
            <div className="flex gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleExportCSV}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200/80 transition-all active:scale-95 cursor-pointer"
              >
                <Download size={14} />
                <span>Ekspor CSV</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200/80 transition-all active:scale-95 cursor-pointer"
              >
                <Printer size={14} />
                <span>Cetak Laporan</span>
              </button>
              <button
                onClick={handleDownloadAcademicPDF}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-all active:scale-95 cursor-pointer shadow-md shadow-blue-100"
                id="btn-download-academic-pdf"
              >
                <FileText size={14} />
                <span>Unduh PDF Resmi</span>
              </button>
            </div>
          </div>

          {/* LIVE PREVIEW LAPORAN AKADEMIK */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span> Live Preview Rapor Akademik
              </span>
              <span className="text-[10px] text-slate-500 italic bg-slate-100 px-2 py-0.5 rounded-lg">Format A4 Portrait</span>
            </div>

            {/* Simulated Paper Container */}
            <div className="bg-slate-100 border border-slate-200/60 p-4 md:p-8 rounded-3xl overflow-x-auto shadow-inner">
              <div id="printable-area" className="bg-white border border-slate-200/80 shadow-2xl p-10 sm:p-12 w-[850px] min-h-[1200px] mx-auto text-slate-800 flex flex-col justify-between font-serif shrink-0">
                {/* Header (KOP SURAT) */}
                <div className="flex items-center justify-between pb-2 border-b-2 border-slate-800">
                  {/* Logo Sekolah (Kiri) */}
                  <div className="h-20 max-w-[120px] shrink-0 flex items-center justify-center">
                    {settings.logoSekolah ? (
                      <img src={settings.logoSekolah} alt="Logo Sekolah" className="h-16 w-auto object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-16 h-16 border border-slate-800 rounded-lg flex items-center justify-center text-[8px] font-bold text-slate-800 text-center uppercase p-1 font-sans">
                        Logo Sekolah
                      </div>
                    )}
                  </div>

                  {/* Teks Kop Tengah */}
                  <div className="text-center flex-1 px-4 font-sans">
                    <h4 className="text-[11px] font-black tracking-wider text-slate-900 uppercase">{settings.kopPemprov}</h4>
                    <h4 className="text-[11px] font-black tracking-wider text-slate-900 uppercase mt-0.5">{settings.kopDinas}</h4>
                    <h3 className="text-base font-black text-slate-900 uppercase mt-1 tracking-wide font-sans">{settings.kopSekolah}</h3>
                    <p className="text-[9px] text-slate-500 mt-1 leading-tight">{settings.kopAlamat}</p>
                  </div>

                  {/* Logo Provinsi (Kanan) */}
                  <div className="h-20 max-w-[120px] shrink-0 flex items-center justify-center">
                    {settings.logoProv ? (
                      <img src={settings.logoProv} alt="Logo Provinsi" className="h-16 w-auto object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-16 h-16 border border-slate-800 rounded-full flex items-center justify-center text-[8px] font-bold text-slate-800 text-center uppercase p-1 font-sans">
                        Logo Prov
                      </div>
                    )}
                  </div>
                </div>
                {/* Double Border Line */}
                <div className="border-t border-slate-800 mt-[2px] mb-4"></div>

                {/* Body Konten Dokumen */}
                <div className="flex-1 mt-6 space-y-6">
                  {/* Judul Laporan */}
                  <div className="text-center">
                    <h2 className="text-sm font-black text-slate-900 underline tracking-wide">LAPORAN HASIL BELAJAR AKADEMIK SISWA</h2>
                    <p className="text-[11px] text-slate-700 mt-1 font-sans">Mata Pelajaran: <strong className="text-slate-800">Informatika</strong> | Tahun Pelajaran: <strong className="text-slate-800">{settings.tahunPelajaran || '2025/2026'}</strong></p>
                    <p className="text-[10px] text-slate-600 font-sans">Kelas: <strong className="text-slate-800">{filterKelas || 'Semua Kelas'}</strong> | KKM Kompetensi: <strong className="text-slate-800">{settings.kkm}</strong></p>
                  </div>

                  {/* Tabel Data Akademik */}
                  <div className="font-sans">
                    <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-300">
                          <th className="p-2 border border-slate-300 text-center font-bold">No</th>
                          <th className="p-2 border border-slate-300 text-center font-bold">NISN</th>
                          <th className="p-2 border border-slate-300 font-bold">Nama Siswa</th>
                          <th className="p-2 border border-slate-300 text-center font-bold">Kelas</th>
                          <th className="p-2 border border-slate-300 text-center font-bold">Tugas</th>
                          <th className="p-2 border border-slate-300 text-center font-bold">UH 1</th>
                          <th className="p-2 border border-slate-300 text-center font-bold">UH 2</th>
                          <th className="p-2 border border-slate-300 text-center font-bold">UH 3</th>
                          <th className="p-2 border border-slate-300 text-center font-bold">UTS</th>
                          <th className="p-2 border border-slate-300 text-center font-bold">UAS</th>
                          <th className="p-2 border border-slate-300 text-center font-bold">Skor</th>
                          <th className="p-2 border border-slate-300 text-center font-bold">Grd</th>
                          <th className="p-2 border border-slate-300 text-center font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredSiswa.length === 0 ? (
                          <tr>
                            <td colSpan={13} className="p-8 text-center text-slate-400">
                              Tidak ada data siswa
                            </td>
                          </tr>
                        ) : (
                          filteredSiswa.map((siswa, idx) => {
                            const nilai = filteredNilai.find((n) => n.siswaId === siswa.id);
                            const statusLulus = nilai ? nilai.total >= settings.kkm : false;
                            return (
                              <tr key={siswa.id} className="hover:bg-slate-50/50">
                                <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                                <td className="p-2 border border-slate-300 text-center font-mono text-slate-500">{siswa.nis}</td>
                                <td className="p-2 border border-slate-300 font-bold text-slate-800">{siswa.nama}</td>
                                <td className="p-2 border border-slate-300 text-center">{siswa.kelas}</td>
                                <td className="p-2 border border-slate-300 text-center font-mono">{nilai ? nilai.tugas : '-'}</td>
                                <td className="p-2 border border-slate-300 text-center font-mono">{nilai ? nilai.uh1 : '-'}</td>
                                <td className="p-2 border border-slate-300 text-center font-mono">{nilai ? nilai.uh2 : '-'}</td>
                                <td className="p-2 border border-slate-300 text-center font-mono">{nilai ? nilai.uh3 : '-'}</td>
                                <td className="p-2 border border-slate-300 text-center font-mono">{nilai ? nilai.uts : '-'}</td>
                                <td className="p-2 border border-slate-300 text-center font-mono">{nilai ? nilai.uas : '-'}</td>
                                <td className="p-2 border border-slate-300 text-center font-mono font-bold text-blue-700">{nilai ? nilai.total : '-'}</td>
                                <td className="p-2 border border-slate-300 text-center font-bold">{nilai ? nilai.grade : '-'}</td>
                                <td className="p-2 border border-slate-300 text-center font-bold">
                                  <span className={statusLulus ? 'text-emerald-700' : 'text-rose-700'}>
                                    {statusLulus ? 'TUNTAS' : 'REMEDIAL'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Footer Document */}
                  <div className="font-sans grid grid-cols-2 gap-4 text-[10px] p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p>&bull; Jumlah Siswa Terhitung: <strong>{filteredSiswa.length} Orang</strong></p>
                      <p>&bull; Rata-rata Skor Belajar Kelas: <strong>{rataSkorKelas} / 100</strong></p>
                    </div>
                    <div>
                      <p>&bull; Siswa Tuntas KKM (&ge; {settings.kkm}): <strong>{siswaLulus} Orang ({tingkatKelulusan}%)</strong></p>
                      <p>&bull; Siswa Butuh Bimbingan: <strong>{siswaRemedial.length} Orang</strong></p>
                    </div>
                  </div>
                </div>

                {/* Tanda Tangan Resmi */}
                <div className="font-sans grid grid-cols-2 gap-12 text-[10px] pt-12 border-t border-dashed border-slate-200">
                  <div className="space-y-12">
                    <div>
                      <p>Mengetahui,</p>
                      <p className="font-bold">Kepala Sekolah,</p>
                    </div>
                    <div>
                      <p className="font-bold underline text-slate-900">{settings.namaKS || 'Dr. Joko Wahyono, M.Pd.'}</p>
                      <p className="text-slate-700 text-[9px]">{settings.jabatanKS || 'Pembina Tk. I, IV/b'}</p>
                      <p className="text-slate-500 text-[9px]">NIP. {settings.nipKS || '19740512 200003 1 002'}</p>
                    </div>
                  </div>
                  <div className="space-y-12 text-right sm:text-left sm:pl-24">
                    <div>
                      <p>{cityStr}, {new Date().getDate()} {indonesianMonths[new Date().getMonth()]} {new Date().getFullYear()}</p>
                      <p className="font-bold">Guru Mata Pelajaran Informatika</p>
                    </div>
                    <div>
                      <p className="font-bold underline text-slate-900">{settings.namaGuru}</p>
                      <p className="text-slate-500 text-[9px]">NIP. {settings.nip}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LAPORAN PRESENSI */}
      {activeTab === 'presensi' && (
        <div className="space-y-6">
          {/* Sub-Filters untuk Presensi */}
          <div className="neu-flat p-4 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filter Rentang (Range) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Jenis Rekap:</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                {(['Harian', 'Bulanan', 'Semester'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setPresensiRange(r)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      presensiRange === r
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Selector based on Selected Range */}
            {presensiRange === 'Harian' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pilih Tanggal:</label>
                <input
                  type="date"
                  value={selectedTanggal}
                  onChange={(e) => setSelectedTanggal(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}

            {presensiRange === 'Bulanan' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pilih Bulan:</label>
                <select
                  value={selectedBulan}
                  onChange={(e) => setSelectedBulan(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
              </div>
            )}

            {presensiRange === 'Semester' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pilih Semester:</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value as 'Ganjil' | 'Genap')}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Ganjil">Semester Ganjil (Juli - Desember)</option>
                  <option value="Genap">Semester Genap (Januari - Juni)</option>
                </select>
              </div>
            )}

            {/* Tombol Aksi Cetak PDF */}
            <div className="flex items-end md:col-start-4 gap-2">
              <button
                onClick={handlePrint}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200/80 transition-all active:scale-95 cursor-pointer font-sans"
              >
                <Printer size={14} />
                <span>Cetak</span>
              </button>
              <button
                onClick={handleDownloadPresensiPDF}
                className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-all active:scale-95 cursor-pointer shadow-md shadow-blue-100 font-sans"
                id="btn-download-presensi-pdf"
              >
                <FileText size={14} />
                <span>Unduh PDF</span>
              </button>
            </div>
          </div>

          {/* LIVE PREVIEW LAPORAN PRESENSI */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span> Live Preview Rapor Kehadiran ({presensiRange})
              </span>
              <span className="text-[10px] text-slate-500 italic bg-slate-100 px-2 py-0.5 rounded-lg">Format A4 Portrait</span>
            </div>

            {/* Simulated Paper Container */}
            <div className="bg-slate-100 border border-slate-200/60 p-4 md:p-8 rounded-3xl overflow-x-auto shadow-inner">
              <div id="printable-area" className="bg-white border border-slate-200/80 shadow-2xl p-10 sm:p-12 w-[850px] min-h-[1200px] mx-auto text-slate-800 flex flex-col justify-between font-serif shrink-0">
                {/* Header (KOP SURAT) */}
                <div className="flex items-center justify-between pb-2 border-b-2 border-slate-800">
                  {/* Logo Sekolah (Kiri) */}
                  <div className="h-20 max-w-[120px] shrink-0 flex items-center justify-center">
                    {settings.logoSekolah ? (
                      <img src={settings.logoSekolah} alt="Logo Sekolah" className="h-16 w-auto object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-16 h-16 border border-slate-800 rounded-lg flex items-center justify-center text-[8px] font-bold text-slate-800 text-center uppercase p-1 font-sans">
                        Logo Sekolah
                      </div>
                    )}
                  </div>

                  {/* Teks Kop Tengah */}
                  <div className="text-center flex-1 px-4 font-sans">
                    <h4 className="text-[11px] font-black tracking-wider text-slate-900 uppercase">{settings.kopPemprov}</h4>
                    <h4 className="text-[11px] font-black tracking-wider text-slate-900 uppercase mt-0.5">{settings.kopDinas}</h4>
                    <h3 className="text-base font-black text-slate-900 uppercase mt-1 tracking-wide font-sans">{settings.kopSekolah}</h3>
                    <p className="text-[9px] text-slate-500 mt-1 leading-tight">{settings.kopAlamat}</p>
                  </div>

                  {/* Logo Provinsi (Kanan) */}
                  <div className="h-20 max-w-[120px] shrink-0 flex items-center justify-center">
                    {settings.logoProv ? (
                      <img src={settings.logoProv} alt="Logo Provinsi" className="h-16 w-auto object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-16 h-16 border border-slate-800 rounded-full flex items-center justify-center text-[8px] font-bold text-slate-800 text-center uppercase p-1 font-sans">
                        Logo Prov
                      </div>
                    )}
                  </div>
                </div>
                {/* Double Border Line */}
                <div className="border-t border-slate-800 mt-[2px] mb-4"></div>

                {/* Body Konten Dokumen */}
                <div className="flex-1 mt-6 space-y-6">
                  {/* Judul Laporan Dinamis */}
                  <div className="text-center">
                    <h2 className="text-sm font-black text-slate-900 underline tracking-wide uppercase font-serif">
                      {presensiRange === 'Harian' && 'LAPORAN PRESENSI HARIAN SISWA'}
                      {presensiRange === 'Bulanan' && 'LAPORAN REKAPITULASI PRESENSI BULANAN'}
                      {presensiRange === 'Semester' && 'LAPORAN REKAPITULASI PRESENSI SEMESTER'}
                    </h2>
                    
                    <p className="text-[11px] text-slate-700 mt-1 font-sans">Mata Pelajaran: <strong className="text-slate-800">Informatika</strong> | Tahun Pelajaran: <strong className="text-slate-800">{settings.tahunPelajaran || '2025/2026'}</strong></p>
                    <p className="text-[10px] text-slate-600 font-sans">
                      Kelas: <strong className="text-slate-800">{filterKelas || 'Semua Kelas'}</strong>
                      {presensiRange === 'Harian' && <span> | Tanggal: <strong className="text-slate-800">{formatIndonesianDate(selectedTanggal)}</strong></span>}
                      {presensiRange === 'Bulanan' && <span> | Bulan: <strong className="text-slate-800">{getIndonesianMonthName(selectedBulan)} 2026</strong></span>}
                      {presensiRange === 'Semester' && <span> | Semester: <strong className="text-slate-800">{selectedSemester} Ganjil</strong></span>}
                    </p>
                  </div>

                  {/* Tabel Data Presensi Dinamis */}
                  <div className="font-sans">
                    {presensiRange === 'Harian' ? (
                      <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-300">
                            <th className="p-2.5 border border-slate-300 text-center font-bold">No</th>
                            <th className="p-2.5 border border-slate-300 text-center font-bold">NIS</th>
                            <th className="p-2.5 border border-slate-300 font-bold">Nama Siswa</th>
                            <th className="p-2.5 border border-slate-300 text-center font-bold">Kelas</th>
                            <th className="p-2.5 border border-slate-300 text-center font-bold">Tanggal</th>
                            <th className="p-2.5 border border-slate-300 text-center font-bold">Status Kehadiran</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredSiswa.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400">
                                Tidak ada data siswa
                              </td>
                            </tr>
                          ) : (
                            filteredSiswa.map((siswa, idx) => {
                              const match = filteredPresensi.find(
                                (p) => p.siswaId === siswa.id && p.tanggal === selectedTanggal
                              );
                              const status = match ? match.status : 'Hadir'; // Default as Hadir
                              return (
                                <tr key={siswa.id}>
                                  <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                                  <td className="p-2 border border-slate-300 text-center font-mono text-slate-500">{siswa.nis}</td>
                                  <td className="p-2 border border-slate-300 font-bold text-slate-800">{siswa.nama}</td>
                                  <td className="p-2 border border-slate-300 text-center">{siswa.kelas}</td>
                                  <td className="p-2 border border-slate-300 text-center">{selectedTanggal}</td>
                                  <td className="p-2 border border-slate-300 text-center">
                                    <span className={`font-bold uppercase text-[9px] px-2 py-0.5 rounded ${
                                      status === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                      status === 'Sakit' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                      status === 'Izin' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                      'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                      {status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    ) : presensiRange === 'Bulanan' ? (
                      (() => {
                        const uniqueDates = Array.from(new Set(
                          filteredPresensi
                            .filter((p) => p.tanggal && p.tanggal.split('-')[1] === selectedBulan)
                            .map((p) => p.tanggal)
                        )).sort();

                        if (uniqueDates.length > 0) {
                          return (
                            <table className="w-full text-left border-collapse border border-slate-300 text-[9px]">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-300">
                                  <th className="p-1 border border-slate-300 text-center font-bold">No</th>
                                  <th className="p-1 border border-slate-300 text-center font-bold">NISN</th>
                                  <th className="p-1 border border-slate-300 font-bold">Nama Siswa</th>
                                  <th className="p-1 border border-slate-300 text-center font-bold">Kelas</th>
                                  {uniqueDates.map((date) => (
                                    <th key={date} className="p-1 border border-slate-300 text-center font-bold min-w-[20px]" title={date}>
                                      {date.split('-')[2]}
                                    </th>
                                  ))}
                                  <th className="p-1 border border-slate-300 text-center font-bold" title="Hadir">H</th>
                                  <th className="p-1 border border-slate-300 text-center font-bold" title="Sakit">S</th>
                                  <th className="p-1 border border-slate-300 text-center font-bold" title="Izin">I</th>
                                  <th className="p-1 border border-slate-300 text-center font-bold" title="Alpa">A</th>
                                  <th className="p-1 border border-slate-300 text-center font-bold">Sesi</th>
                                  <th className="p-1 border border-slate-300 text-center font-bold">%</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {filteredSiswa.length === 0 ? (
                                  <tr>
                                    <td colSpan={10 + uniqueDates.length} className="p-8 text-center text-slate-400">
                                      Tidak ada data siswa
                                    </td>
                                  </tr>
                                ) : (
                                  filteredSiswa.map((siswa, idx) => {
                                    const pSiswa = filteredPresensi.filter(
                                      (p) => p.siswaId === siswa.id && p.tanggal && p.tanggal.split('-')[1] === selectedBulan
                                    );
                                    const h = pSiswa.filter((p) => p.status === 'Hadir').length;
                                    const s = pSiswa.filter((p) => p.status === 'Sakit').length;
                                    const i = pSiswa.filter((p) => p.status === 'Izin').length;
                                    const a = pSiswa.filter((p) => p.status === 'Alfa').length;
                                    const total = h + s + i + a;
                                    const pct = total > 0 ? Math.round((h / total) * 100) : 100;

                                    return (
                                      <tr key={siswa.id} className="hover:bg-slate-50/50">
                                        <td className="p-1 border border-slate-300 text-center">{idx + 1}</td>
                                        <td className="p-1 border border-slate-300 text-center font-mono text-slate-500">{siswa.nis}</td>
                                        <td className="p-1 border border-slate-300 font-bold text-slate-800">{siswa.nama}</td>
                                        <td className="p-1 border border-slate-300 text-center">{siswa.kelas}</td>
                                        {uniqueDates.map((date) => {
                                          const match = pSiswa.find((p) => p.tanggal === date);
                                          let statusAbbr = '-';
                                          let statusColor = 'text-slate-400';
                                          if (match) {
                                            if (match.status === 'Hadir') { statusAbbr = 'H'; statusColor = 'text-emerald-700 font-bold'; }
                                            else if (match.status === 'Sakit') { statusAbbr = 'S'; statusColor = 'text-amber-600 font-bold'; }
                                            else if (match.status === 'Izin') { statusAbbr = 'I'; statusColor = 'text-blue-600 font-bold'; }
                                            else if (match.status === 'Alfa') { statusAbbr = 'A'; statusColor = 'text-rose-600 font-bold'; }
                                          }
                                          return (
                                            <td key={date} className={`p-1 border border-slate-300 text-center font-mono ${statusColor}`}>
                                              {statusAbbr}
                                            </td>
                                          );
                                        })}
                                        <td className="p-1 border border-slate-300 text-center font-mono text-emerald-700">{h}</td>
                                        <td className="p-1 border border-slate-300 text-center font-mono text-amber-600">{s}</td>
                                        <td className="p-1 border border-slate-300 text-center font-mono text-blue-600">{i}</td>
                                        <td className="p-1 border border-slate-300 text-center font-mono text-rose-600">{a}</td>
                                        <td className="p-1 border border-slate-300 text-center font-mono font-bold text-slate-700">{total}</td>
                                        <td className="p-1 border border-slate-300 text-center font-mono font-bold text-blue-700">{pct}%</td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          );
                        } else {
                          return (
                            <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl font-sans">
                              Belum ada input presensi di bulan ini.
                            </div>
                          );
                        }
                      })()
                    ) : (
                      // SEMESTER (Tabel Rekap H / S / I / A)
                      <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-300">
                            <th className="p-2.5 border border-slate-300 text-center font-bold">No</th>
                            <th className="p-2.5 border border-slate-300 text-center font-bold">NISN</th>
                            <th className="p-2.5 border border-slate-300 font-bold">Nama Siswa</th>
                            <th className="p-2.5 border border-slate-300 text-center font-bold">Kelas</th>
                            <th className="p-2.5 border border-slate-300 text-center font-bold">Hadir (H)</th>
                            <th className="p-2.5 border border-slate-300 text-center font-bold">Sakit (S)</th>
                            <th className="p-2.5 border border-slate-300 text-center font-bold">Izin (I)</th>
                            <th className="p-2.5 border border-slate-300 text-center font-bold">Alpa (A)</th>
                            <th className="p-2.5 border border-slate-300 text-center font-bold">Total Sesi</th>
                            <th className="p-2.5 border border-slate-300 text-center font-bold">% Kehadiran</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredSiswa.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="p-8 text-center text-slate-400">
                                Tidak ada data siswa
                              </td>
                            </tr>
                          ) : (
                            filteredSiswa.map((siswa, idx) => {
                              // Filter presensi per rentang
                              const pSiswa = filteredPresensi.filter((p) => {
                                if (p.siswaId !== siswa.id) return false;
                                const validMonths = selectedSemester === 'Ganjil' 
                                  ? ['07', '08', '09', '10', '11', '12'] 
                                  : ['01', '02', '03', '04', '05', '06'];
                                return p.tanggal && validMonths.includes(p.tanggal.split('-')[1]);
                              });

                              const h = pSiswa.filter((p) => p.status === 'Hadir').length;
                              const s = pSiswa.filter((p) => p.status === 'Sakit').length;
                              const i = pSiswa.filter((p) => p.status === 'Izin').length;
                              const a = pSiswa.filter((p) => p.status === 'Alfa').length;
                              const total = h + s + i + a;
                              const pct = total > 0 ? Math.round((h / total) * 100) : 100;

                              return (
                                <tr key={siswa.id} className="hover:bg-slate-50/50">
                                  <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                                  <td className="p-2 border border-slate-300 text-center font-mono text-slate-500">{siswa.nis}</td>
                                  <td className="p-2 border border-slate-300 font-bold text-slate-800">{siswa.nama}</td>
                                  <td className="p-2 border border-slate-300 text-center">{siswa.kelas}</td>
                                  <td className="p-2 border border-slate-300 text-center font-mono font-medium text-emerald-700">{h}</td>
                                  <td className="p-2 border border-slate-300 text-center font-mono text-amber-600">{s}</td>
                                  <td className="p-2 border border-slate-300 text-center font-mono text-blue-600">{i}</td>
                                  <td className="p-2 border border-slate-300 text-center font-mono text-rose-600">{a}</td>
                                  <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-700">{total}</td>
                                  <td className="p-2 border border-slate-300 text-center font-mono font-bold text-blue-700">{pct}%</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Summary Footer Document */}
                  <div className="font-sans text-[9px] text-slate-500 flex items-center gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <HelpCircle size={12} className="text-blue-500" />
                    <span>
                      {presensiRange === 'Harian' && '* Data di atas mencerminkan status presensi riil siswa pada tanggal terpilih.'}
                      {presensiRange === 'Bulanan' && '* Rekapitulasi bulanan menghitung akumulasi total kehadiran Hadir (H), Sakit (S), Izin (I), dan Alpa (A) selama satu bulan penuh.'}
                      {presensiRange === 'Semester' && '* Rekapitulasi semester menghitung akumulasi total kehadiran siswa untuk seluruh bulan aktif dalam lingkup semester terpilih.'}
                    </span>
                  </div>
                </div>

                {/* Tanda Tangan Resmi */}
                <div className="font-sans grid grid-cols-2 gap-12 text-[10px] pt-12 border-t border-dashed border-slate-200">
                  <div className="space-y-12">
                    <div>
                      <p>Mengetahui,</p>
                      <p className="font-bold">Kepala Sekolah,</p>
                    </div>
                    <div>
                      <p className="font-bold underline text-slate-900">{settings.namaKS || 'Dr. Joko Wahyono, M.Pd.'}</p>
                      <p className="text-slate-700 text-[9px]">{settings.jabatanKS || 'Pembina Tk. I, IV/b'}</p>
                      <p className="text-slate-500 text-[9px]">NIP. {settings.nipKS || '19740512 200003 1 002'}</p>
                    </div>
                  </div>
                  <div className="space-y-12 text-right sm:text-left sm:pl-24">
                    <div>
                      <p>{cityStr}, {new Date().getDate()} {indonesianMonths[new Date().getMonth()]} {new Date().getFullYear()}</p>
                      <p className="font-bold">Guru Mata Pelajaran Informatika</p>
                    </div>
                    <div>
                      <p className="font-bold underline text-slate-900">{settings.namaGuru}</p>
                      <p className="text-slate-500 text-[9px]">NIP. {settings.nip}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LAPORAN LITERASI */}
      {activeTab === 'literasi' && (
        <div className="space-y-6">
          {/* Sub-Filters untuk Literasi - Updated */}
          <div className="neu-flat p-4 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filter Rentang (Range) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Jenis Rekap:</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                {(['Harian', 'Bulanan', 'Semester'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setLiterasiRange(r)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      literasiRange === r
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Selector based on Selected Range */}
            {literasiRange === 'Harian' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pilih Tanggal:</label>
                  <input
                    type="date"
                    value={selectedLiterasiTanggal}
                    onChange={(e) => setSelectedLiterasiTanggal(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Materi Literasi:</label>
                  <select
                    value={selectedLiterasiId}
                    onChange={(e) => setSelectedLiterasiId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                  >
                    <option value="all">Semua Materi Literasi</option>
                    {((pembelajaranList || []).filter(p => p.jenis === 'Literasi')).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.judul}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {literasiRange === 'Bulanan' && (
              <div className="space-y-1.5 md:col-span-3">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pilih Bulan:</label>
                <select
                  value={selectedLiterasiBulan}
                  onChange={(e) => setSelectedLiterasiBulan(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                >
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
              </div>
            )}

            {literasiRange === 'Semester' && (
              <div className="space-y-1.5 md:col-span-3">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pilih Semester:</label>
                <select
                  value={selectedLiterasiSemester}
                  onChange={(e) => setSelectedLiterasiSemester(e.target.value as 'Ganjil' | 'Genap')}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                >
                  <option value="Ganjil">Semester Ganjil (Juli - Desember)</option>
                  <option value="Genap">Semester Genap (Januari - Juni)</option>
                </select>
              </div>
            )}
          </div>

          {/* Analitik Statistik Cards untuk Literasi */}
          {(() => {
            const literasiMateriList = (pembelajaranList || []).filter(p => p.jenis === 'Literasi');
            const totalSiswaCount = filteredSiswa.length;
            let totalMateriRange = 0;
            let totalSubmissionsRange = 0;
            let pctCompletedRange = 0;
            let statusLabel = "";

            if (literasiRange === 'Harian') {
              totalMateriRange = literasiMateriList.filter(m => m.tanggal === selectedLiterasiTanggal).length;
              totalSubmissionsRange = rangkumanList.filter(
                (r) => r.tanggal === selectedLiterasiTanggal && literasiMateriList.some(m => m.id === r.pembelajaranId) && filteredSiswa.some(s => s.id === r.siswaId)
              ).length;
              const maxPossible = totalSiswaCount * (totalMateriRange || 1);
              pctCompletedRange = maxPossible > 0 ? Math.round((totalSubmissionsRange / maxPossible) * 100) : 100;
              statusLabel = "Ringkasan Hari Ini";
            } else if (literasiRange === 'Bulanan') {
              totalMateriRange = literasiMateriList.filter(m => m.tanggal && m.tanggal.split('-')[1] === selectedLiterasiBulan).length;
              totalSubmissionsRange = rangkumanList.filter(
                (r) => r.tanggal && r.tanggal.split('-')[1] === selectedLiterasiBulan && literasiMateriList.some(m => m.id === r.pembelajaranId) && filteredSiswa.some(s => s.id === r.siswaId)
              ).length;
              const maxPossible = totalSiswaCount * (totalMateriRange || 1);
              pctCompletedRange = maxPossible > 0 ? Math.round((totalSubmissionsRange / maxPossible) * 100) : 100;
              statusLabel = "Ringkasan Bulan Ini";
            } else {
              const validMonths = selectedLiterasiSemester === 'Ganjil' 
                ? ['07', '08', '09', '10', '11', '12'] 
                : ['01', '02', '03', '04', '05', '06'];
              totalMateriRange = literasiMateriList.filter(m => m.tanggal && validMonths.includes(m.tanggal.split('-')[1])).length;
              totalSubmissionsRange = rangkumanList.filter(
                (r) => r.tanggal && validMonths.includes(r.tanggal.split('-')[1]) && literasiMateriList.some(m => m.id === r.pembelajaranId) && filteredSiswa.some(s => s.id === r.siswaId)
              ).length;
              const maxPossible = totalSiswaCount * (totalMateriRange || 1);
              pctCompletedRange = maxPossible > 0 ? Math.round((totalSubmissionsRange / maxPossible) * 100) : 100;
              statusLabel = "Ringkasan Semester Ini";
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="neu-flat p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Materi Literasi Terkait</span>
                  <h4 className="text-2xl font-black text-blue-600 mt-1 font-mono">{totalMateriRange}</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Bahan Rangkuman</p>
                </div>

                <div className="neu-flat p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Siswa Terhitung</span>
                  <h4 className="text-2xl font-black text-emerald-600 mt-1 font-mono">{totalSiswaCount}</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Orang</p>
                </div>

                <div className="neu-flat p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Total Setor</span>
                  <h4 className="text-2xl font-black text-purple-600 mt-1 font-mono">{totalSubmissionsRange}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 font-sans">{statusLabel}</p>
                </div>

                <div className="neu-flat p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tingkat Literasi</span>
                  <h4 className="text-2xl font-black text-pink-600 mt-1 font-mono">{pctCompletedRange}%</h4>
                  <p className="text-[10px] text-slate-500 mt-1 font-sans">Rasio Penyelesaian</p>
                </div>
              </div>
            );
          })()}

          {/* Action Toolbar untuk Literasi */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/50 p-3 rounded-2xl border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">
              * Laporan literasi ini memonitoring setiap siswa yang telah meringkas modul berlabel 'Literasi'.
            </span>
            <div className="flex gap-2.5 w-full sm:w-auto">
              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200/80 transition-all active:scale-95 cursor-pointer font-sans"
              >
                <Printer size={14} />
                <span>Cetak Laporan</span>
              </button>
              <button
                onClick={handleDownloadLiterasiPDF}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-all active:scale-95 cursor-pointer shadow-md shadow-blue-100 font-sans"
              >
                <FileText size={14} />
                <span>Unduh PDF Resmi</span>
              </button>
            </div>
          </div>

          {/* Live Preview Paper untuk Laporan Literasi */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span> Live Preview Buku Literasi ({literasiRange})
              </span>
              <span className="text-[10px] text-slate-500 italic bg-slate-100 px-2 py-0.5 rounded-lg">Format A4 Portrait</span>
            </div>

            <div className="bg-slate-100 border border-slate-200/60 p-4 md:p-8 rounded-3xl overflow-x-auto shadow-inner">
              <div id="printable-area" className="bg-white border border-slate-200/80 shadow-2xl p-10 sm:p-12 w-[850px] min-h-[1200px] mx-auto text-slate-800 flex flex-col justify-between font-serif shrink-0">
                <div>
                  {/* Header (KOP SURAT) */}
                  <div className="flex items-center justify-between pb-2 border-b-2 border-slate-800 font-sans">
                    <div className="h-20 max-w-[120px] shrink-0 flex items-center justify-center">
                      {settings.logoSekolah ? (
                        <img src={settings.logoSekolah} alt="Logo Sekolah" className="h-16 w-auto object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-16 h-16 border border-slate-800 rounded-lg flex items-center justify-center text-[8px] font-bold text-slate-800 text-center uppercase p-1 font-sans">
                          Logo Sekolah
                        </div>
                      )}
                    </div>

                    <div className="text-center flex-1 px-4 font-sans">
                      <h4 className="text-[11px] font-black tracking-wider text-slate-900 uppercase">{settings.kopPemprov}</h4>
                      <h4 className="text-[11px] font-black tracking-wider text-slate-900 uppercase mt-0.5">{settings.kopDinas}</h4>
                      <h3 className="text-base font-black text-slate-900 uppercase mt-1 tracking-wide font-sans">{settings.kopSekolah}</h3>
                      <p className="text-[9px] text-slate-500 mt-1 leading-tight">{settings.kopAlamat}</p>
                    </div>

                    <div className="h-20 max-w-[120px] shrink-0 flex items-center justify-center font-sans">
                      {settings.logoProv ? (
                        <img src={settings.logoProv} alt="Logo Provinsi" className="h-16 w-auto object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-16 h-16 border border-slate-800 rounded-full flex items-center justify-center text-[8px] font-bold text-slate-800 text-center uppercase p-1 font-sans">
                          Logo Prov
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-slate-800 mt-[2px] mb-4"></div>

                  {/* Body Laporan Literasi */}
                  <div className="mt-6 space-y-6">
                    <div className="text-center font-sans">
                      <h2 className="text-sm font-black text-slate-900 underline tracking-wide">
                        {selectedLiterasiId === 'all'
                          ? `LAPORAN REKAPITULASI SELESAI LITERASI MANDIRI SISWA (${literasiRange.toUpperCase()})`
                          : 'LAPORAN HASIL LITERASI DIGITAL MANDIRI SISWA'}
                      </h2>
                      <p className="text-[11px] text-slate-700 mt-1">Mata Pelajaran: <strong>Informatika</strong> | Tahun Pelajaran: <strong>{settings.tahunPelajaran || '2025/2026'}</strong></p>
                      <p className="text-[10px] text-slate-600">
                        Kelas: <strong>{filterKelas || 'Semua Kelas'}</strong>
                        {' '}| Rentang:{' '}
                        <strong>
                          {literasiRange === 'Harian' && formatIndonesianDate(selectedLiterasiTanggal)}
                          {literasiRange === 'Bulanan' && `Bulan ${getIndonesianMonthName(selectedLiterasiBulan)}`}
                          {literasiRange === 'Semester' && `Semester ${selectedLiterasiSemester}`}
                        </strong>
                        {selectedLiterasiId !== 'all' && (
                          <>
                            {' '}| Judul Materi:{' '}
                            <strong>
                              {(pembelajaranList || []).find((m) => m.id === selectedLiterasiId)?.judul || selectedLiterasiId}
                            </strong>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Tabel Data Literasi */}
                    <div className="font-sans">
                      <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-300 font-bold text-slate-700">
                            <th className="p-2 border border-slate-300 text-center">No</th>
                            <th className="p-2 border border-slate-300 text-center">NISN</th>
                            <th className="p-2 border border-slate-300">Nama Siswa</th>
                            <th className="p-2 border border-slate-300 text-center">Kelas</th>
                            {selectedLiterasiId === 'all' ? (
                              <>
                                <th className="p-2 border border-slate-300 text-center">Selesai</th>
                                <th className="p-2 border border-slate-300 text-center">Total Materi</th>
                                <th className="p-2 border border-slate-300 text-center">Persentase</th>
                              </>
                            ) : (
                              <>
                                <th className="p-2 border border-slate-300 text-center">Status</th>
                                <th className="p-2 border border-slate-300 text-center">Tanggal Kirim</th>
                                <th className="p-2 border border-slate-300">Ringkasan Rangkuman</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredSiswa.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400">
                                Tidak ada data siswa
                              </td>
                            </tr>
                          ) : (
                            filteredSiswa.map((siswa, idx) => {
                              const rangeLiterasiMateri = (pembelajaranList || []).filter(p => {
                                if (p.jenis !== 'Literasi') return false;
                                if (!p.tanggal) return false;
                                if (literasiRange === 'Harian') {
                                  return p.tanggal === selectedLiterasiTanggal;
                                } else if (literasiRange === 'Bulanan') {
                                  return p.tanggal.split('-')[1] === selectedLiterasiBulan;
                                } else {
                                  const validMonths = selectedLiterasiSemester === 'Ganjil' 
                                    ? ['07', '08', '09', '10', '11', '12'] 
                                    : ['01', '02', '03', '04', '05', '06'];
                                  return validMonths.includes(p.tanggal.split('-')[1]);
                                }
                              });

                              if (selectedLiterasiId === 'all') {
                                const totalSelesai = rangkumanList.filter(
                                  (r) =>
                                    r.siswaId === siswa.id &&
                                    rangeLiterasiMateri.some((m) => m.id === r.pembelajaranId)
                                ).length;
                                const pct =
                                  rangeLiterasiMateri.length > 0
                                    ? Math.round((totalSelesai / rangeLiterasiMateri.length) * 100)
                                    : 100;

                                return (
                                  <tr key={siswa.id} className="hover:bg-slate-50/50">
                                    <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                                    <td className="p-2 border border-slate-300 text-center font-mono text-slate-500">
                                      {siswa.nis}
                                    </td>
                                    <td className="p-2 border border-slate-300 font-bold text-slate-800">
                                      {siswa.nama}
                                    </td>
                                    <td className="p-2 border border-slate-300 text-center">{siswa.kelas}</td>
                                    <td className="p-2 border border-slate-300 text-center font-bold font-mono text-blue-600">
                                      {totalSelesai}
                                    </td>
                                    <td className="p-2 border border-slate-300 text-center font-mono text-slate-500">
                                      {rangeLiterasiMateri.length}
                                    </td>
                                    <td className="p-2 border border-slate-300 text-center font-bold font-mono text-slate-900">
                                      {pct}%
                                    </td>
                                  </tr>
                                );
                              } else {
                                const match = rangkumanList.find(
                                  (r) => r.siswaId === siswa.id && r.pembelajaranId === selectedLiterasiId
                                );

                                return (
                                  <tr key={siswa.id} className="hover:bg-slate-50/50 font-sans">
                                    <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                                    <td className="p-2 border border-slate-300 text-center font-mono text-slate-500">
                                      {siswa.nis}
                                    </td>
                                    <td className="p-2 border border-slate-300 font-bold text-slate-800">
                                      {siswa.nama}
                                    </td>
                                    <td className="p-2 border border-slate-300 text-center">{siswa.kelas}</td>
                                    <td className="p-2 border border-slate-300 text-center font-sans">
                                      <span
                                        className={`font-bold px-2 py-0.5 rounded text-[9px] ${
                                          match
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-rose-50 text-rose-700'
                                        }`}
                                      >
                                        {match ? 'SELESAI' : 'BELUM SETOR'}
                                      </span>
                                    </td>
                                    <td className="p-2 border border-slate-300 text-center text-slate-500">
                                      {match ? formatIndonesianDate(match.tanggal) : '-'}
                                    </td>
                                    <td className="p-2 border border-slate-300 text-slate-700 font-sans">
                                      {match ? (
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="truncate max-w-[120px] inline-block text-[10px]">
                                            {match.isi}
                                          </span>
                                          <button
                                            onClick={() => {
                                              const mat = (pembelajaranList || []).find((m) => m.id === selectedLiterasiId) || null;
                                              setViewingSummary(match);
                                              setSummaryStudent(siswa);
                                              setSummaryMateri(mat);
                                            }}
                                            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-600 font-bold flex items-center gap-0.5 cursor-pointer font-sans shrink-0 border border-slate-200"
                                          >
                                            <Eye size={8} /> Detail
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 italic">Belum meringkas</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              }
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Tanda Tangan Resmi */}
                <div className="font-sans grid grid-cols-2 gap-12 text-[10px] pt-12 border-t border-dashed border-slate-200 mt-auto">
                  <div className="space-y-12">
                    <div>
                      <p>Mengetahui,</p>
                      <p className="font-bold">Kepala Sekolah,</p>
                    </div>
                    <div>
                      <p className="font-bold underline text-slate-900">{settings.namaKS || 'Dr. Joko Wahyono, M.Pd.'}</p>
                      <p className="text-slate-700 text-[9px]">{settings.jabatanKS || 'Pembina Tk. I, IV/b'}</p>
                      <p className="text-slate-500 text-[9px]">NIP. {settings.nipKS || '19740512 200003 1 002'}</p>
                    </div>
                  </div>
                  <div className="space-y-12 text-right sm:text-left sm:pl-24">
                    <div>
                      <p>{cityStr}, {new Date().getDate()} {indonesianMonths[new Date().getMonth()]} {new Date().getFullYear()}</p>
                      <p className="font-bold">Guru Mata Pelajaran Informatika</p>
                    </div>
                    <div>
                      <p className="font-bold underline text-slate-900">{settings.namaGuru}</p>
                      <p className="text-slate-500 text-[9px]">NIP. {settings.nip}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Detail Modal Viewer */}
      {viewingSummary && summaryStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl relative space-y-4 font-sans">
            <button
              onClick={() => {
                setViewingSummary(null);
                setSummaryStudent(null);
                setSummaryMateri(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer border border-slate-100"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 font-sans">
              {summaryStudent.foto ? (
                <img
                  src={summaryStudent.foto}
                  alt={summaryStudent.nama}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-150 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <User size={18} />
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-slate-800">Rangkuman Literasi Mandiri</h3>
                <p className="text-[10px] text-slate-500 font-medium font-sans">Oleh: {summaryStudent.nama} ({summaryStudent.kelas})</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 font-sans">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Materi Literasi</label>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  {summaryMateri ? summaryMateri.judul : 'Judul Materi Literasi'}
                </p>
              </div>
              
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Disetor Pada</label>
                <p className="font-medium text-slate-600 mt-0.5 font-sans">
                  {formatIndonesianDate(viewingSummary.tanggal)}
                </p>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hasil Ringkasan/Rangkuman</label>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl max-h-60 overflow-y-auto leading-relaxed text-slate-800 font-sans whitespace-pre-line text-[11px]">
                  {viewingSummary.isi}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end font-sans">
              <button
                onClick={() => {
                  setViewingSummary(null);
                  setSummaryStudent(null);
                  setSummaryMateri(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border border-slate-200 transition-all font-sans"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Print / PDF Download Confirmation Modal */}
      <AnimatePresence>
        {showPrintConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrintConfirm(false)}
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 z-10 space-y-4"
            >
              <div className="flex items-center gap-3 text-blue-600">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Pratinjau Cetak Laporan</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda sedang membuka aplikasi di dalam bingkai pratinjau (preview iframe).
                <br /><br />
                Browser sering kali memblokir cetak langsung dari dalam bingkai ini demi keamanan.
                <br /><br />
                Apakah Anda ingin mengunduh laporan berformat <strong>PDF resmi</strong> untuk dicetak dari komputer Anda?
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPrintConfirm(false);
                    try {
                      window.print();
                    } catch (e) {}
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Coba Cetak Saja
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'akademik') {
                      handleDownloadAcademicPDF();
                    } else if (activeTab === 'presensi') {
                      handleDownloadPresensiPDF();
                    } else if (activeTab === 'literasi') {
                      handleDownloadLiterasiPDF();
                    }
                    setShowPrintConfirm(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-md shadow-blue-100"
                >
                  Unduh PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
