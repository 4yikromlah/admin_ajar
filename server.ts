import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import 'dotenv/config';

const __dirnameSafe = typeof __dirname !== 'undefined'
  ? __dirname
  : (typeof import.meta !== 'undefined' && import.meta.url)
    ? path.dirname(fileURLToPath(import.meta.url))
    : process.cwd();

const app = express();
const PORT = 3000;
const PRIMARY_CONFIG_FILE = path.join(process.cwd(), 'spreadsheet_config.json');
const FALLBACK_CONFIG_FILE = path.join(__dirnameSafe, 'spreadsheet_config.json');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DEFAULT_SUPERADMIN_SPREADSHEET_URL = 'https://script.google.com/macros/s/AKfycbzb1VFTuPrmr1UpRePoi2m3IIFNJKXsxsceDpgkbFm0lsw71BOMjrTeCWCZhQxio9hW/exec';

// Load saved config on startup with environment variable fallbacks for Vercel & serverless environments
let spreadsheetUrl = process.env.SUPERADMIN_SPREADSHEET_URL || process.env.VITE_SUPERADMIN_SPREADSHEET_URL || DEFAULT_SUPERADMIN_SPREADSHEET_URL;
let adminPassword = process.env.SUPERADMIN_PASSWORD || 'sableng212';
let adminEmail = process.env.SUPERADMIN_EMAIL || '4yik.romlah@gmail.com';

try {
  let targetFile = PRIMARY_CONFIG_FILE;
  if (!fs.existsSync(PRIMARY_CONFIG_FILE) && fs.existsSync(FALLBACK_CONFIG_FILE)) {
    targetFile = FALLBACK_CONFIG_FILE;
  }
  if (fs.existsSync(targetFile)) {
    const raw = fs.readFileSync(targetFile, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.url && parsed.url.trim()) {
      spreadsheetUrl = parsed.url.trim();
    }
    if (parsed.adminPassword) adminPassword = parsed.adminPassword;
    if (parsed.adminEmail) adminEmail = parsed.adminEmail;
    console.log('[Server] Loaded config successfully from', targetFile, '. URL:', spreadsheetUrl, 'Email:', adminEmail);
    // Write back to primary config file if it wasn't there
    if (targetFile !== PRIMARY_CONFIG_FILE) {
      fs.writeFileSync(PRIMARY_CONFIG_FILE, raw, 'utf-8');
    }
  }
} catch (e) {
  console.error('[Server] Failed to read CONFIG_FILE:', e);
}

// Server-side persistent Teachers Database
const TEACHERS_FILE = path.join(process.cwd(), 'teachers_db.json');
let serverTeachers: any[] = [
  {
    id: "T1",
    nama: "4yik.romlah@gmail.com",
    username: "romlah",
    password: "password123",
    mataPelajaran: "Informatika",
    isApproved: true,
    asalSekolah: "MGMP INFORMATIKA SMA BONDOWOSO",
    email: "4yik.romlah@gmail.com",
    lastSyncAt: "08:00:00"
  },
  {
    id: "T2",
    nama: "Bambang Kurniawan, S.Kom.",
    username: "bambang",
    password: "password123",
    mataPelajaran: "Informatika",
    isApproved: true,
    asalSekolah: "SMA Negeri 1 Salatiga",
    email: "bambang@gmail.com",
    lastSyncAt: "08:00:00"
  }
];

try {
  if (fs.existsSync(TEACHERS_FILE)) {
    const raw = fs.readFileSync(TEACHERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      serverTeachers = parsed;
      console.log('[Server] Loaded teachers_db.json successfully:', serverTeachers.length, 'teachers.');
    }
  } else {
    fs.writeFileSync(TEACHERS_FILE, JSON.stringify(serverTeachers, null, 2), 'utf-8');
  }
} catch (e) {
  console.error('[Server] Failed to load/save TEACHERS_FILE:', e);
}

// Server-side persistent Presensi Database & Active QR Sessions
const PRESENSI_FILE = path.join(process.cwd(), 'presensi_db.json');
const QR_SESSION_FILE = path.join(process.cwd(), 'qr_sessions_db.json');

let serverPresensiRecords: any[] = [];
let serverActiveQrSessions: any[] = [];

try {
  if (fs.existsSync(PRESENSI_FILE)) {
    const raw = fs.readFileSync(PRESENSI_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) serverPresensiRecords = parsed;
  }
} catch (e) {
  console.error('[Server] Failed to load PRESENSI_FILE:', e);
}

try {
  if (fs.existsSync(QR_SESSION_FILE)) {
    const raw = fs.readFileSync(QR_SESSION_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) serverActiveQrSessions = parsed;
  }
} catch (e) {
  console.error('[Server] Failed to load QR_SESSION_FILE:', e);
}

const savePresensiToDisk = () => {
  try {
    fs.writeFileSync(PRESENSI_FILE, JSON.stringify(serverPresensiRecords, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Server] Failed to write PRESENSI_FILE:', e);
  }
};

const saveQrSessionsToDisk = () => {
  try {
    fs.writeFileSync(QR_SESSION_FILE, JSON.stringify(serverActiveQrSessions, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Server] Failed to write QR_SESSION_FILE:', e);
  }
};

// ----------------------------------------------------------------------------
// API ROUTES (Must be defined BEFORE Vite middleware)
// ----------------------------------------------------------------------------
app.get('/api/teachers', async (req, res) => {
  // Always attempt to pull fresh data from Google Spreadsheet Super Admin if configured
  if (spreadsheetUrl) {
    try {
      let targetUrl = spreadsheetUrl.trim().replace(/^["']|["']$/g, '');
      if (targetUrl.endsWith('/dev')) {
        targetUrl = targetUrl.substring(0, targetUrl.length - 4) + '/exec';
      }
      const response = await fetch(targetUrl, { method: 'GET' });
      if (response.ok) {
        const text = await response.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch (e) {}
        let remoteTeachers: any[] = [];
        if (Array.isArray(data)) {
          remoteTeachers = data;
        } else if (data && typeof data === 'object') {
          remoteTeachers = data.teachers || data.guru || data.data || data.Teachers || data.Guru || [];
        }
        if (Array.isArray(remoteTeachers) && remoteTeachers.length > 0) {
          serverTeachers = remoteTeachers;
          try {
            fs.writeFileSync(TEACHERS_FILE, JSON.stringify(serverTeachers, null, 2), 'utf-8');
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('[Server GET /api/teachers] Spreadsheet pull failed:', err);
    }
  }
  res.json({ status: 'success', teachers: serverTeachers });
});

app.post('/api/teachers', async (req, res) => {
  const { teachers } = req.body;
  if (Array.isArray(teachers)) {
    // Preserve approved status for seed admins
    serverTeachers = teachers.map((t: any) => {
      const u = String(t.username || '').trim().toLowerCase();
      if (u === 'romlah' || u === 'bambang' || u === 'admin') {
        return { ...t, isApproved: true };
      }
      return t;
    });
    try {
      fs.writeFileSync(TEACHERS_FILE, JSON.stringify(serverTeachers, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Server] Failed to write TEACHERS_FILE:', e);
    }

    // Push to Google Spreadsheet Super Admin
    if (spreadsheetUrl) {
      try {
        let targetUrl = spreadsheetUrl.trim().replace(/^["']|["']$/g, '');
        if (targetUrl.endsWith('/dev')) {
          targetUrl = targetUrl.substring(0, targetUrl.length - 4) + '/exec';
        }
        const pushRes = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'saveTeachers', teachers: serverTeachers }),
        });
        if (!pushRes.ok) {
          return res.status(500).json({ status: 'error', error: 'Gagal menyimpan data ke Google Spreadsheet Super Admin' });
        }
      } catch (err: any) {
        console.error('[Server POST /api/teachers] Spreadsheet push failed:', err);
        return res.status(500).json({ status: 'error', error: 'Gagal terhubung ke Google Spreadsheet Super Admin: ' + (err?.message || err) });
      }
    }
  }
  res.json({ status: 'success', teachers: serverTeachers });
});

// ----------------------------------------------------------------------------
// Active QR Session Endpoints (Cross-Device Real-Time Sync)
// ----------------------------------------------------------------------------
app.get('/api/qr-session/active', (req, res) => {
  const { kelas } = req.query;
  const now = Date.now();
  // Allow 15 minutes grace window for server/client clock skew or recent active session
  serverActiveQrSessions = serverActiveQrSessions.filter(s => (s.expiresAt || 0) + 15 * 60 * 1000 > now);
  saveQrSessionsToDisk();

  const norm = (str: any) => String(str || '').trim().toLowerCase().replace(/[\s\-_.]+/g, '');

  if (kelas) {
    const target = norm(kelas);
    // 1. Exact normalized match
    let active = serverActiveQrSessions.find(s => norm(s.kelas) === target);
    // 2. Contains / partial match
    if (!active) {
      active = serverActiveQrSessions.find(s => {
        const sk = norm(s.kelas);
        return sk && target && (sk.includes(target) || target.includes(sk) || sk === 'semuakelas' || sk === 'semua' || target === 'semuakelas' || target === 'semua');
      });
    }
    // 3. Fallback to latest session if any active session exists
    if (!active && serverActiveQrSessions.length > 0) {
      active = serverActiveQrSessions[serverActiveQrSessions.length - 1];
    }
    return res.json({ status: 'success', session: active || null });
  }

  return res.json({
    status: 'success',
    sessions: serverActiveQrSessions,
    session: serverActiveQrSessions[serverActiveQrSessions.length - 1] || null
  });
});

app.post('/api/qr-session', (req, res) => {
  const { session } = req.body;
  if (!session || !session.kelas || !session.token) {
    return res.status(400).json({ status: 'error', error: 'Data sesi tidak lengkap' });
  }

  const norm = (str: any) => String(str || '').trim().toLowerCase().replace(/[\s\-_.]+/g, '');
  const targetKelas = norm(session.kelas);
  serverActiveQrSessions = serverActiveQrSessions.filter(s => norm(s.kelas) !== targetKelas);
  serverActiveQrSessions.push(session);
  saveQrSessionsToDisk();

  return res.json({ status: 'success', session });
});

app.delete('/api/qr-session', (req, res) => {
  const kelas = req.query.kelas || req.body?.kelas;
  if (kelas) {
    const targetKelas = String(kelas).trim().toLowerCase();
    serverActiveQrSessions = serverActiveQrSessions.filter(s => String(s.kelas).trim().toLowerCase() !== targetKelas);
    saveQrSessionsToDisk();
  } else {
    serverActiveQrSessions = [];
    saveQrSessionsToDisk();
  }
  return res.json({ status: 'success' });
});

// ----------------------------------------------------------------------------
// QR Presensi Checkin & Live List Endpoints
// ----------------------------------------------------------------------------
app.post('/api/qr-presensi/checkin', (req, res) => {
  const presensi = req.body.presensi || req.body.record;
  if (!presensi || !presensi.siswaId || !presensi.tanggal) {
    return res.status(400).json({ status: 'error', error: 'Data presensi tidak lengkap' });
  }

  const existsIdx = serverPresensiRecords.findIndex(
    p => p.siswaId === presensi.siswaId && p.tanggal === presensi.tanggal
  );
  if (existsIdx > -1) {
    serverPresensiRecords[existsIdx] = { ...serverPresensiRecords[existsIdx], ...presensi };
  } else {
    serverPresensiRecords.push(presensi);
  }
  savePresensiToDisk();

  return res.json({ status: 'success', presensi });
});

app.get('/api/qr-presensi/list', (req, res) => {
  const { tanggal, kelas } = req.query;
  let result = [...serverPresensiRecords];

  if (tanggal) {
    result = result.filter(p => p.tanggal === String(tanggal));
  }
  if (kelas) {
    const k = String(kelas).trim().toLowerCase();
    result = result.filter(p => String(p.siswaKelas || p.kelas || '').trim().toLowerCase() === k);
  }

  return res.json({ status: 'success', records: result });
});

app.post('/api/qr-presensi/sync', (req, res) => {
  const { records } = req.body;
  if (Array.isArray(records)) {
    records.forEach(rec => {
      if (rec && rec.siswaId && rec.tanggal) {
        const idx = serverPresensiRecords.findIndex(
          p => p.siswaId === rec.siswaId && p.tanggal === rec.tanggal
        );
        if (idx > -1) {
          serverPresensiRecords[idx] = { ...serverPresensiRecords[idx], ...rec };
        } else {
          serverPresensiRecords.push(rec);
        }
      }
    });
    savePresensiToDisk();
  }
  return res.json({ status: 'success', count: serverPresensiRecords.length, records: serverPresensiRecords });
});

app.get('/api/presensi', (req, res) => {
  return res.json({ status: 'success', records: serverPresensiRecords });
});

app.delete('/api/qr-presensi/clear', (req, res) => {
  serverPresensiRecords = [];
  savePresensiToDisk();
  return res.json({ status: 'success' });
});

app.get('/api/superadmin-url', (req, res) => {
  const activeUrl = spreadsheetUrl || process.env.SUPERADMIN_SPREADSHEET_URL || process.env.VITE_SUPERADMIN_SPREADSHEET_URL || DEFAULT_SUPERADMIN_SPREADSHEET_URL;
  res.json({ 
    url: activeUrl,
    adminPassword,
    adminEmail
  });
});

app.post('/api/gas-proxy', async (req, res) => {
  const { url, method, body } = req.body;
  const targetRaw = (url && typeof url === 'string' && url.trim()) ? url.trim() : (spreadsheetUrl || DEFAULT_SUPERADMIN_SPREADSHEET_URL);
  if (!targetRaw) {
    return res.status(400).json({ status: 'error', error: 'URL Google Apps Script wajib disediakan' });
  }

  let targetUrl = targetRaw.replace(/^["']|["']$/g, '');
  if (targetUrl.endsWith('/dev')) {
    targetUrl = targetUrl.substring(0, targetUrl.length - 4) + '/exec';
  }

  if (targetUrl.includes('docs.google.com/spreadsheets')) {
    return res.status(400).json({
      status: 'error',
      error: 'URL yang dimasukkan adalah URL Google Spreadsheet (docs.google.com/spreadsheets). Gunakan URL Web App Google Apps Script yang berakhiran /exec.'
    });
  }

  try {
    const fetchOptions: RequestInit = {
      method: method || 'GET',
      signal: AbortSignal.timeout(7000),
    };
    if (method === 'POST' && body) {
      fetchOptions.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    const response = await fetch(targetUrl, fetchOptions);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
      if (data && (data.status === 'error' || data.error)) {
        return res.status(400).json(data);
      }
      return res.json(data);
    } catch (e) {
      const isHtml = text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('google.com');
      const errObj = {
        status: 'error',
        error: isHtml
          ? 'Respon berupa halaman HTML/Login Google. Pastikan Web App Apps Script di-set "Akses: Siapa Saja" (Anyone) & gunakan URL Web App /exec.'
          : 'Respon dari Google Apps Script bukan format JSON yang valid.',
        raw: text.substring(0, 300)
      };
      return res.status(400).json(errObj);
    }
  } catch (err: any) {
    console.error('[GAS Proxy Error]', err);
    return res.status(500).json({ status: 'error', error: err?.message || 'Gagal terhubung ke Google Apps Script' });
  }
});

app.get('/api/superadmin/pull', async (req, res) => {
  const activeUrl = spreadsheetUrl || process.env.SUPERADMIN_SPREADSHEET_URL || DEFAULT_SUPERADMIN_SPREADSHEET_URL;
  if (!activeUrl) {
    return res.status(400).json({ status: 'error', error: 'URL Spreadsheet Super Admin belum dikonfigurasi di server.' });
  }
  let targetUrl = activeUrl.trim().replace(/^["']|["']$/g, '');
  if (targetUrl.endsWith('/dev')) {
    targetUrl = targetUrl.substring(0, targetUrl.length - 4) + '/exec';
  }

  try {
    const response = await fetch(targetUrl, { method: 'GET', signal: AbortSignal.timeout(7000) });
    if (!response.ok) {
      return res.status(500).json({ status: 'error', error: `Gagal terhubung ke Google Apps Script (${response.statusText})` });
    }
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
      if (data && (data.status === 'error' || data.error)) {
        return res.status(400).json(data);
      }
      return res.json(data);
    } catch (e) {
      const isHtml = text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('google.com');
      return res.status(400).json({
        status: 'error',
        error: isHtml
          ? 'Respon berupa halaman HTML/Login. Pastikan Web App Apps Script di-set "Akses: Siapa Saja" (Anyone) & gunakan URL /exec.'
          : 'Respon dari Google Apps Script bukan format JSON yang valid.',
        raw: text.substring(0, 200)
      });
    }
  } catch (err: any) {
    console.error('[Server SuperAdmin Pull Error]', err);
    return res.status(500).json({ status: 'error', error: err?.message || 'Gagal terhubung ke Google Apps Script dari server' });
  }
});

app.post('/api/superadmin/push', async (req, res) => {
  const activeUrl = spreadsheetUrl || process.env.SUPERADMIN_SPREADSHEET_URL || DEFAULT_SUPERADMIN_SPREADSHEET_URL;
  if (!activeUrl) {
    return res.status(400).json({ status: 'error', error: 'URL Spreadsheet Super Admin belum dikonfigurasi di server.' });
  }
  let targetUrl = activeUrl.trim().replace(/^["']|["']$/g, '');
  if (targetUrl.endsWith('/dev')) {
    targetUrl = targetUrl.substring(0, targetUrl.length - 4) + '/exec';
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(7000),
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
      if (data && (data.status === 'error' || data.error)) {
        return res.status(400).json(data);
      }
      return res.json(data);
    } catch (e) {
      data = { status: response.ok ? 'success' : 'error' };
      return response.ok ? res.json(data) : res.status(400).json(data);
    }
  } catch (err: any) {
    console.error('[Server SuperAdmin Push Error]', err);
    return res.status(500).json({ status: 'error', error: err?.message || 'Gagal terhubung ke Google Apps Script dari server' });
  }
});

app.post('/api/superadmin-url', (req, res) => {
  const { url, adminPassword: newPassword, adminEmail: newEmail } = req.body;
  
  if (url !== undefined) {
    let cleaned = url.trim().replace(/^["']|["']$/g, '');
    if (cleaned.endsWith('/dev')) {
      cleaned = cleaned.substring(0, cleaned.length - 4) + '/exec';
    }
    spreadsheetUrl = cleaned || process.env.SUPERADMIN_SPREADSHEET_URL || DEFAULT_SUPERADMIN_SPREADSHEET_URL;
  }
  if (newPassword !== undefined && newPassword.trim()) {
    adminPassword = newPassword.trim();
  }
  if (newEmail !== undefined && newEmail.trim()) {
    adminEmail = newEmail.trim();
  }

  try {
    fs.writeFileSync(PRIMARY_CONFIG_FILE, JSON.stringify({ 
      url: spreadsheetUrl, 
      adminPassword, 
      adminEmail 
    }), 'utf-8');
    console.log('[Server] Saved new configuration successfully');
    res.json({ 
      status: 'success', 
      url: spreadsheetUrl, 
      adminPassword, 
      adminEmail 
    });
  } catch (e) {
    console.error('[Server] Failed to write CONFIG_FILE:', e);
    res.status(500).json({ error: 'Failed to write config' });
  }
});

// Forgot Password Endpoint
app.post('/api/forgot-password', async (req, res) => {
  const { username, email, appUrl, clientVerified, clientName } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: 'Username dan Email wajib diisi!' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  let targetEmail = '';
  let targetName = '';
  let isMatched = false;

  // 1. Check if Super Admin
  if (cleanUsername === 'admin') {
    const validAdminEmails = [adminEmail.toLowerCase(), '4yik.romlah@gmail.com', '4ndr1saya@gmail.com'];
    if (validAdminEmails.includes(cleanEmail)) {
      targetEmail = cleanEmail;
      targetName = 'Super Admin';
      isMatched = true;
    } else {
      return res.status(400).json({ error: `Alamat email "${email}" tidak sesuai dengan email terdaftar untuk Super Admin!` });
    }
  } else {
    // 2. Check Teacher Accounts using central spreadsheet
    if (spreadsheetUrl) {
      try {
        const response = await fetch(spreadsheetUrl, { method: 'GET' });
        if (response.ok) {
          const db = await response.json();
          if (db && Array.isArray(db.teachers)) {
            const teacherByUsername = db.teachers.find(
              (t: any) => t.username.trim().toLowerCase() === cleanUsername
            );
            if (teacherByUsername) {
              const sheetEmail = (teacherByUsername.email || '').trim().toLowerCase();
              if (sheetEmail && sheetEmail !== cleanEmail) {
                return res.status(400).json({ 
                  error: `Alamat email "${email}" tidak sesuai dengan email terdaftar di spreadsheet untuk username "${username}".` 
                });
              }
              targetEmail = sheetEmail || cleanEmail;
              targetName = teacherByUsername.nama;
              isMatched = true;
            }
          }
        }
      } catch (err) {
        console.error('[Forgot Password] Central sheet fetch failed:', err);
      }
    }

    // 3. Client Verification Fallback (for offline or local accounts)
    if (!isMatched && clientVerified === true) {
      targetEmail = cleanEmail;
      targetName = clientName || cleanUsername;
      isMatched = true;
    }
  }

  if (!isMatched) {
    return res.status(404).json({ error: 'Akun dengan username dan email tersebut tidak ditemukan!' });
  }

  // Generate a reset token/link
  const token = 'RESET_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const baseOrigin = appUrl || req.headers.referer || req.headers.origin || 'http://localhost:3000';
  const resetLink = `${baseOrigin}${baseOrigin.endsWith('/') ? '' : '/'}?resetToken=${token}&username=${encodeURIComponent(cleanUsername)}`;

  console.log(`[Forgot Password] Reset link generated for ${cleanUsername}: ${resetLink}`);

  // SMTP Settings
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  let emailSent = false;
  let emailError = '';

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"SMASA Online" <${smtpFrom}>`,
        to: targetEmail,
        subject: 'Atur Ulang Kata Sandi Akun SMASA Online',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #4f46e5; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.025em;">SMASA Online</h2>
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 700;">Portal Pembelajaran & Penilaian</span>
            </div>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin-bottom: 24px;" />
            <p style="font-size: 15px; color: #334155; line-height: 1.6;">Halo <strong>${targetName}</strong>,</p>
            <p style="font-size: 15px; color: #334155; line-height: 1.6;">Kami menerima permintaan untuk mengatur ulang kata sandi akun SMASA Online Anda.</p>
            <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 28px;">Silakan klik tombol di bawah ini untuk mengatur ulang kata sandi Anda dengan yang baru:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);">Atur Ulang Kata Sandi Baru</a>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.6; background-color: #f8fafc; padding: 12px; border-radius: 8px;">Jika Anda tidak meminta pengaturan ulang ini, silakan abaikan email ini dengan aman. Tautan ini bersifat privat dan hanya berlaku sementara.</p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; word-break: break-all; line-height: 1.5;">Apabila tombol di atas tidak bekerja, silakan salin dan tempel tautan berikut ke browser Anda:<br/><a href="${resetLink}" style="color: #4f46e5; text-decoration: underline;">${resetLink}</a></p>
          </div>
        `,
      });
      emailSent = true;
    } catch (err: any) {
      console.error('[Forgot Password] Nodemailer SMTP Error:', err);
      emailError = err?.message || 'SMTP delivery failure';
    }
  }

  // Fallback / Primary dispatch via Google Apps Script (Gmail API) if spreadsheetUrl is set
  const emailHtmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #4f46e5; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.025em;">SMASA Online</h2>
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 700;">Portal Pembelajaran & Penilaian</span>
      </div>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin-bottom: 24px;" />
      <p style="font-size: 15px; color: #334155; line-height: 1.6;">Halo <strong>${targetName}</strong>,</p>
      <p style="font-size: 15px; color: #334155; line-height: 1.6;">Kami menerima permintaan untuk mengatur ulang kata sandi akun SMASA Online Anda.</p>
      <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 28px;">Silakan klik tombol di bawah ini untuk mengatur ulang kata sandi Anda dengan yang baru:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);">Atur Ulang Kata Sandi Baru</a>
      </div>
      <p style="color: #64748b; font-size: 12px; line-height: 1.6; background-color: #f8fafc; padding: 12px; border-radius: 8px;">Jika Anda tidak meminta pengaturan ulang ini, silakan abaikan email ini dengan aman.</p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px; word-break: break-all; line-height: 1.5;">Apabila tombol tidak bekerja, salin tautan berikut:<br/><a href="${resetLink}" style="color: #4f46e5; text-decoration: underline;">${resetLink}</a></p>
    </div>
  `;

  if (!emailSent && spreadsheetUrl) {
    try {
      const gasRes = await fetch(spreadsheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendEmail',
          recipient: targetEmail,
          subject: 'Atur Ulang Kata Sandi Akun SMASA Online',
          body: emailHtmlContent
        })
      });
      if (gasRes.ok) {
        emailSent = true;
      }
    } catch (gasErr: any) {
      console.error('[Forgot Password] Google Apps Script email dispatch failed:', gasErr);
    }
  }

  return res.json({
    success: true,
    message: emailSent 
      ? 'Link reset password berhasil dikirim ke email terdaftar!' 
      : 'Tautan reset password berhasil digenerasi di sistem sandbox!',
    emailSent,
    emailError,
    resetLink,
    username: cleanUsername,
    token
  });
});

// Reset Password Endpoint
app.post('/api/reset-password', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan Password baru wajib diisi!' });
  }

  const cleanUsername = username.trim().toLowerCase();

  if (cleanUsername === 'admin') {
    adminPassword = password.trim();
    try {
      fs.writeFileSync(PRIMARY_CONFIG_FILE, JSON.stringify({ 
        url: spreadsheetUrl, 
        adminPassword, 
        adminEmail 
      }), 'utf-8');
      console.log('[Server] Super Admin password reset successfully.');
      return res.json({ status: 'success', message: 'Password Super Admin berhasil diperbarui!' });
    } catch (e) {
      console.error('[Server] Failed to write PRIMARY_CONFIG_FILE on reset:', e);
      return res.status(500).json({ error: 'Gagal memperbarui password di server' });
    }
  }

  // Teachers are updated client-side and synced via central spreadsheet
  return res.json({ status: 'success', message: 'Password divalidasi' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ----------------------------------------------------------------------------
// VITE DEV SERVER MIDDLEWARE / PRODUCTION STATIC ROUTING
// ----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Server] Starting in DEVELOPMENT mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Server] Starting in PRODUCTION mode...');
    const distPath = path.join(__dirnameSafe, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] running on http://localhost:${PORT}`);
  });
}

startServer();

