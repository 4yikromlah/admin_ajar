/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Upload, Trash2, Edit3, X, FileSpreadsheet, Check, AlertCircle, Award, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { Siswa, Nilai, AppSettings } from '../types';
import { hitungTotalDanGrade } from '../data';

interface KelolaNilaiProps {
  nilaiList: Nilai[];
  siswaList: Siswa[];
  onAddNilai: (n: Nilai) => void;
  onUpdateNilai: (n: Nilai) => void;
  onDeleteNilai: (id: string) => void;
  onImportNilai: (list: Nilai[]) => void;
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
}

export default function KelolaNilai({
  nilaiList,
  siswaList,
  onAddNilai,
  onUpdateNilai,
  onDeleteNilai,
  onImportNilai,
  settings,
  onUpdateSettings,
}: KelolaNilaiProps) {
  // State Pencarian & Filter
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('');

  // State Delete Confirmation
  const [nilaiToDelete, setNilaiToDelete] = useState<Nilai | null>(null);

  // PDF Logo aspect ratio states and helpers
  const [logoSekolahRatio, setLogoSekolahRatio] = useState<number>(1);
  const [logoProvRatio, setLogoProvRatio] = useState<number>(1);

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

  const indonesianMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const drawKopSurat = (doc: jsPDF, title: string, subtitleDetails: string[]) => {
    // Draw Logos (with vectors fallback if blank)
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
        doc.addImage(settings.logoSekolah, 'PNG', sX, sY, sWidth, sHeight);
      } catch (e) {
        console.error("Error drawing logoSekolah:", e);
      }
    } else {
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
        doc.addImage(settings.logoProv, 'PNG', pX, pY, pWidth, pHeight);
      } catch (e) {
        console.error("Error drawing logoProv:", e);
      }
    } else {
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

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      const title = 'LAPORAN REKAPITULASI PENILAIAN SISWA';
      const metadata = [
        `Mata Pelajaran: Informatika`,
        `Kelas: ${filterKelas || 'Semua Kelas'}`,
        `Tahun Pelajaran: ${settings.tahunPelajaran || '2025/2026'}`
      ];
      
      const startY = drawKopSurat(doc, title, metadata);
      
      const headers = [
        'No', 'NIS', 'Nama Siswa', 'Kelas', 'Tgs', 'UH1', 'UH2', 'UH3', 'UTS', 'UAS', 'Skor', 'Grd', 'Status'
      ];
      const columnWidths = [
        8, 16, 40, 18, 10, 10, 10, 10, 10, 10, 12, 10, 16
      ];
      const alignments: ('left' | 'center' | 'right')[] = [
        'center', 'center', 'left', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center'
      ];
      
      const rows = filteredNilai.map((nilai, idx) => {
        const studentObj = siswaList.find((s) => s.id === nilai.siswaId);
        const statusLulus = nilai.total >= settings.kkm;
        return [
          (idx + 1).toString(),
          studentObj?.nis || '-',
          nilai.siswaNama || '-',
          nilai.siswaKelas || '-',
          nilai.tugas.toString(),
          nilai.uh1.toString(),
          nilai.uh2.toString(),
          nilai.uh3.toString(),
          nilai.uts.toString(),
          nilai.uas.toString(),
          nilai.total.toString(),
          nilai.grade,
          statusLulus ? 'TUNTAS' : 'REMEDIAL'
        ];
      });
      
      const finalY = drawTable(doc, startY, headers, columnWidths, rows, alignments);
      drawSignatureBlock(doc, finalY + 12);
      
      const fileKelas = filterKelas ? `_Kelas_${filterKelas}` : '';
      doc.save(`Rekap_Nilai_Informatika${fileKelas}_SMASA.pdf`);
    } catch (err) {
      console.error(err);
      alert('Gagal mengunduh PDF');
    }
  };

  // State Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedNilai, setSelectedNilai] = useState<Nilai | null>(null);

  // State Formulir
  const [selectedSiswaId, setSelectedSiswaId] = useState('');
  const [tugas, setTugas] = useState<number>(80);
  const [uh1, setUh1] = useState<number>(80);
  const [uh2, setUh2] = useState<number>(80);
  const [uh3, setUh3] = useState<number>(80);
  const [uts, setUts] = useState<number>(80);
  const [uas, setUas] = useState<number>(80);

  // State Import CSV
  const [dragActive, setDragActive] = useState(false);
  const [importPreview, setImportPreview] = useState<Nilai[]>([]);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter list Nilai
  const filteredNilai = nilaiList.filter((n) => {
    const matchesSearch =
      n.siswaNama.toLowerCase().includes(search.toLowerCase()) ||
      n.siswaKelas.toLowerCase().includes(search.toLowerCase());
    const matchesKelas = filterKelas === '' || n.siswaKelas === filterKelas;
    return matchesSearch && matchesKelas;
  });

  // Ambil daftar kelas unik untuk filter dropdown
  const uniqueKelasList = Array.from(new Set(siswaList.map((s) => s.kelas)));

  // Siswa yang belum memiliki nilai (untuk formulir Tambah Nilai)
  const siswaTanpaNilai = siswaList.filter(
    (s) => !nilaiList.some((n) => n.siswaId === s.id)
  );

  // Buka Form Tambah
  const handleOpenAdd = () => {
    setSelectedNilai(null);
    if (siswaTanpaNilai.length > 0) {
      setSelectedSiswaId(siswaTanpaNilai[0].id);
    } else {
      setSelectedSiswaId('');
    }
    setTugas(80);
    setUh1(80);
    setUh2(80);
    setUh3(80);
    setUts(80);
    setUas(80);
    setShowFormModal(true);
  };

  // Buka Form Edit
  const handleOpenEdit = (nilai: Nilai) => {
    setSelectedNilai(nilai);
    setSelectedSiswaId(nilai.siswaId);
    setTugas(nilai.tugas);
    setUh1(nilai.uh1);
    setUh2(nilai.uh2);
    setUh3(nilai.uh3);
    setUts(nilai.uts);
    setUas(nilai.uas);
    setShowFormModal(true);
  };

  // Simpan Form (Add / Edit)
  const handleSaveNilai = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswaId) return;

    const targetSiswa = siswaList.find((s) => s.id === selectedSiswaId);
    if (!targetSiswa) return;

    const { total, grade } = hitungTotalDanGrade(tugas, uh1, uh2, uh3, uts, uas);

    if (selectedNilai) {
      // Edit Mode
      onUpdateNilai({
        ...selectedNilai,
        tugas,
        uh1,
        uh2,
        uh3,
        uts,
        uas,
        total,
        grade,
      });
    } else {
      // Tambah Baru
      const baru: Nilai = {
        id: `N${Date.now()}`,
        siswaId: selectedSiswaId,
        siswaNama: targetSiswa.nama,
        siswaKelas: targetSiswa.kelas,
        tugas,
        uh1,
        uh2,
        uh3,
        uts,
        uas,
        total,
        grade,
      };
      onAddNilai(baru);
    }
    setShowFormModal(false);
  };

  // Hapus Nilai (Dengan Konfirmasi Aman)
  const handleHapusNilai = (nilai: Nilai) => {
    setNilaiToDelete(nilai);
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

  // Parser CSV Nilai
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
        const nisIdx = headerRow.indexOf('nis');
        const tugasIdx = headerRow.indexOf('tugas');
        const uh1Idx = headerRow.indexOf('uh1');
        const uh2Idx = headerRow.indexOf('uh2');
        const uh3Idx = headerRow.indexOf('uh3');
        const kuisIdx = headerRow.indexOf('kuis'); // Legacy fallback
        const utsIdx = headerRow.indexOf('uts');
        const uasIdx = headerRow.indexOf('uas');

        if (nisIdx === -1 || tugasIdx === -1 || (uh1Idx === -1 && kuisIdx === -1) || utsIdx === -1 || uasIdx === -1) {
          throw new Error("Header kolom tidak lengkap! Pastikan mengandung kolom: nis, tugas, uh1, uh2, uh3, uts, uas.");
        }

        const parsedList: Nilai[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const columns = line.split(',').map(col => col.trim());
          if (columns.length < 5) continue;

          const csvNis = columns[nisIdx];
          const csvTugas = parseFloat(columns[tugasIdx]) || 0;
          
          let csvUh1 = 0;
          let csvUh2 = 0;
          let csvUh3 = 0;
          if (uh1Idx !== -1) {
            csvUh1 = parseFloat(columns[uh1Idx]) || 0;
            csvUh2 = uh2Idx !== -1 ? (parseFloat(columns[uh2Idx]) || 0) : csvUh1;
            csvUh3 = uh3Idx !== -1 ? (parseFloat(columns[uh3Idx]) || 0) : csvUh1;
          } else if (kuisIdx !== -1) {
            // Legacy fallback kuis -> UH1, UH2, UH3
            const csvKuis = parseFloat(columns[kuisIdx]) || 0;
            csvUh1 = csvKuis;
            csvUh2 = csvKuis;
            csvUh3 = csvKuis;
          }

          const csvUts = parseFloat(columns[utsIdx]) || 0;
          const csvUas = parseFloat(columns[uasIdx]) || 0;

          // Cari kecocokan NIS siswa di database lokal kita
          const matchingSiswa = siswaList.find(s => s.nis === csvNis);
          if (!matchingSiswa) {
            console.warn(`Siswa dengan NIS ${csvNis} tidak ditemukan di database. Dilewati.`);
            continue; // Lewati jika siswa tidak terdaftar
          }

          const { total, grade } = hitungTotalDanGrade(csvTugas, csvUh1, csvUh2, csvUh3, csvUts, csvUas);

          parsedList.push({
            id: `N${Date.now()}_I${i}`,
            siswaId: matchingSiswa.id,
            siswaNama: matchingSiswa.nama,
            siswaKelas: matchingSiswa.kelas,
            tugas: csvTugas,
            uh1: csvUh1,
            uh2: csvUh2,
            uh3: csvUh3,
            uts: csvUts,
            uas: csvUas,
            total,
            grade
          });
        }

        if (parsedList.length === 0) {
          throw new Error("Tidak ada baris data nilai siswa yang valid (pastikan NIS siswa sudah terdaftar terlebih dahulu di Kelola Siswa).");
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
      onImportNilai(importPreview);
      setImportPreview([]);
      setShowImportModal(false);
    }
  };

  // Live total dan grade untuk modal edit/add
  const liveCalc = hitungTotalDanGrade(tugas, uh1, uh2, uh3, uts, uas);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Award className="text-emerald-600 w-6 h-6" /> Kelola Penilaian Informatika
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Input, kelola, rata-rata, dan import nilai akademik siswa Informatika</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={filteredNilai.length === 0}
            className={`neu-flat-sm px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95 ${
              filteredNilai.length === 0
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                : 'bg-blue-50 text-blue-700'
            }`}
            id="btn-export-nilai-pdf"
            title="Ekspor rekapitulasi penilaian kelas terpilih ke file PDF"
          >
            <FileDown size={14} className="text-blue-700" />
            <span>Ekspor PDF Nilai</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="neu-flat-sm px-4 py-2.5 rounded-xl text-slate-600 font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95"
            id="btn-open-nilai-import"
          >
            <Upload size={14} className="text-slate-500" />
            <span>Import CSV Nilai</span>
          </button>
          <button
            onClick={handleOpenAdd}
            disabled={siswaTanpaNilai.length === 0}
            className={`neu-flat-sm px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95 ${
              siswaTanpaNilai.length === 0
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                : 'bg-emerald-50 text-emerald-700'
            }`}
            id="btn-open-add-nilai"
          >
            <Plus size={14} className="text-emerald-700" />
            <span>Isi Nilai</span>
          </button>
        </div>
      </div>

      {/* Bar Pencarian & Filter */}
      <div className="p-4 rounded-2xl neu-inset flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari nama siswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
            id="search-nilai-input"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <div className="flex items-center gap-2 border-r border-slate-200 pr-3 mr-1">
            <span className="text-xs text-slate-500 font-semibold">KKM:</span>
            <input
              type="number"
              min="0"
              max="100"
              value={settings.kkm}
              onChange={(e) => onUpdateSettings({ ...settings, kkm: parseInt(e.target.value) || 0 })}
              className="w-14 text-xs font-mono font-bold text-center px-2 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
              id="kkm-input-kelola-nilai"
              title="Kriteria Ketuntasan Minimal"
            />
          </div>
          <span className="text-xs text-slate-500 font-semibold">Filter Kelas:</span>
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
            id="filter-kelas-nilai"
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

      {/* Tabel Nilai */}
      <div className="neu-flat rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Nama Siswa</th>
                <th className="py-4 px-6">Kelas</th>
                <th className="py-4 px-6 text-center">Tugas (25%)</th>
                <th className="py-4 px-6 text-center">UH 1 (5%)</th>
                <th className="py-4 px-6 text-center">UH 2 (5%)</th>
                <th className="py-4 px-6 text-center">UH 3 (5%)</th>
                <th className="py-4 px-6 text-center">UTS (30%)</th>
                <th className="py-4 px-6 text-center">UAS (30%)</th>
                <th className="py-4 px-6 text-center">Total Skor</th>
                <th className="py-4 px-6 text-center">Grade</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredNilai.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data nilai yang cocok. Silakan tambahkan data atau periksa pencarian.
                  </td>
                </tr>
              ) : (
                filteredNilai.map((nilai) => (
                  <tr key={nilai.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800">{nilai.siswaNama}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
                        {nilai.siswaKelas}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-mono">{nilai.tugas}</td>
                    <td className="py-4 px-6 text-center font-mono">{nilai.uh1}</td>
                    <td className="py-4 px-6 text-center font-mono">{nilai.uh2}</td>
                    <td className="py-4 px-6 text-center font-mono">{nilai.uh3}</td>
                    <td className="py-4 px-6 text-center font-mono">{nilai.uts}</td>
                    <td className="py-4 px-6 text-center font-mono">{nilai.uas}</td>
                    <td className="py-4 px-6 text-center font-mono font-bold text-blue-600">{nilai.total}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase ${
                        nilai.grade === 'A' ? 'bg-blue-50 text-blue-700' :
                        nilai.grade === 'B' ? 'bg-blue-50 text-blue-700' :
                        nilai.grade === 'C' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {nilai.grade}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleOpenEdit(nilai)}
                          className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 hover:bg-blue-50/50 transition-all cursor-pointer active:scale-95"
                          id={`btn-edit-nilai-${nilai.id}`}
                          title="Edit Nilai"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleHapusNilai(nilai)}
                          className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-rose-500 hover:bg-rose-50/50 transition-all cursor-pointer active:scale-95"
                          id={`btn-delete-nilai-${nilai.id}`}
                          title="Hapus Nilai"
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
          <span>Menampilkan {filteredNilai.length} siswa bernilai</span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">Tugas: 25% | Rata UH (1,2,3): 15% | UTS: 30% | UAS: 30%</span>
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
              id="form-nilai-modal-content"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-sm">
                  {selectedNilai ? `Edit Nilai: ${selectedNilai.siswaNama}` : 'Input Penilaian Siswa'}
                </h3>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveNilai} className="space-y-4">
                {!selectedNilai ? (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                      Pilih Siswa (Hanya yang belum diinput nilai)
                    </label>
                    <select
                      required
                      value={selectedSiswaId}
                      onChange={(e) => setSelectedSiswaId(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                    >
                      {siswaTanpaNilai.length === 0 ? (
                        <option value="">Semua siswa sudah diinput nilai</option>
                      ) : (
                        siswaTanpaNilai.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nama} ({s.kelas})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200/50">
                    <span className="text-[9px] font-bold uppercase text-slate-400">Siswa yang diedit</span>
                    <h4 className="text-xs font-bold text-slate-800">{selectedNilai.siswaNama}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{selectedNilai.siswaKelas}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                      Tugas (25%)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={tugas}
                      onChange={(e) => setTugas(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col justify-end pb-1 text-[10px] text-slate-500 leading-tight">
                    Bobot Nilai UH total: 15% (diambil dari rata-rata UH 1, 2, 3)
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                      UH 1 (5%)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={uh1}
                      onChange={(e) => setUh1(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                      UH 2 (5%)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={uh2}
                      onChange={(e) => setUh2(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                      UH 3 (5%)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={uh3}
                      onChange={(e) => setUh3(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                      UTS (30%)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={uts}
                      onChange={(e) => setUts(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                      UAS (30%)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={uas}
                      onChange={(e) => setUas(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Pratinjau kalkulasi nilai total & grade */}
                <div className="p-4 rounded-2xl neu-inset grid grid-cols-2 gap-4 text-center">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-slate-400">Total Terhitung</span>
                    <h5 className="text-lg font-black text-blue-600 mt-1 font-mono">{liveCalc.total}</h5>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase text-slate-400">Grade Otomatis</span>
                    <div>
                      <span className={`inline-block px-3 py-1 mt-1 rounded-lg text-xs font-extrabold uppercase ${
                        liveCalc.grade === 'A' ? 'bg-blue-50 text-blue-700' :
                        liveCalc.grade === 'B' ? 'bg-blue-50 text-blue-700' :
                        liveCalc.grade === 'C' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {liveCalc.grade}
                      </span>
                    </div>
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
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
                  >
                    Simpan Nilai
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIALOG MODAL IMPORT CSV SPREADSHEET (NILAI) */}
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
              id="import-nilai-csv-modal"
            >
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <FileSpreadsheet className="text-emerald-600" size={16} />
                  <span>Import Data Nilai (CSV / Spreadsheet)</span>
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
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                  <h4 className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <Check size={13} /> Petunjuk Format Berkas CSV Penilaian
                  </h4>
                  <p>Sistem akan mengaitkan nilai secara otomatis ke database siswa menggunakan NIS terdaftar. Judul kolom wajib:</p>
                  <code className="block p-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-mono text-emerald-600 overflow-x-auto whitespace-nowrap">
                    nis,tugas,uh1,uh2,uh3,uts,uas
                  </code>
                  <p className="text-[10px] text-slate-500">Contoh baris data: <code className="font-mono bg-white px-1 border border-slate-150 rounded">12401,88,90,85,88,82,85</code></p>
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
                        ? 'border-emerald-500 bg-emerald-50/30 shadow-inner'
                        : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/20'
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
                      <span className="text-xs font-bold text-slate-700">Pratinjau Nilai Terbaca ({importPreview.length} Siswa)</span>
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
                            <th className="p-2.5">Nama Siswa</th>
                            <th className="p-2.5">Kelas</th>
                            <th className="p-2.5 text-center">Tugas</th>
                            <th className="p-2.5 text-center">UH1</th>
                            <th className="p-2.5 text-center">UH2</th>
                            <th className="p-2.5 text-center">UH3</th>
                            <th className="p-2.5 text-center">UTS</th>
                            <th className="p-2.5 text-center">UAS</th>
                            <th className="p-2.5 text-center">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {importPreview.map((p, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 font-bold text-slate-800">{p.siswaNama}</td>
                              <td className="p-2.5">{p.siswaKelas}</td>
                              <td className="p-2.5 text-center">{p.tugas}</td>
                              <td className="p-2.5 text-center">{p.uh1}</td>
                              <td className="p-2.5 text-center">{p.uh2}</td>
                              <td className="p-2.5 text-center">{p.uh3}</td>
                              <td className="p-2.5 text-center">{p.uts}</td>
                              <td className="p-2.5 text-center">{p.uas}</td>
                              <td className="p-2.5 text-center font-bold text-blue-600">{p.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Impor {importPreview.length} Data Nilai ke Database
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {nilaiToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNilaiToDelete(null)}
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
                  <Trash2 size={20} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Konfirmasi Hapus Nilai</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus data nilai siswa <strong>{nilaiToDelete.siswaNama}</strong> (Kelas: {nilaiToDelete.siswaKelas})?
                <br /><br />
                Total Skor: <strong>{nilaiToDelete.total} ({nilaiToDelete.grade})</strong>
                <br /><br />
                Data harian siswa di tabel siswa akan tetap aman.
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setNilaiToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer animate-none"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteNilai(nilaiToDelete.id);
                    setNilaiToDelete(null);
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
