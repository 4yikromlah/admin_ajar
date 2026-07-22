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

app.use(express.json());

// Load saved config on startup
let spreadsheetUrl = '';
let adminPassword = 'sableng212';
let adminEmail = '4yik.romlah@gmail.com';

try {
  let targetFile = PRIMARY_CONFIG_FILE;
  if (!fs.existsSync(PRIMARY_CONFIG_FILE) && fs.existsSync(FALLBACK_CONFIG_FILE)) {
    targetFile = FALLBACK_CONFIG_FILE;
  }
  if (fs.existsSync(targetFile)) {
    const raw = fs.readFileSync(targetFile, 'utf-8');
    const parsed = JSON.parse(raw);
    spreadsheetUrl = parsed.url || '';
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

// ----------------------------------------------------------------------------
// API ROUTES (Must be defined BEFORE Vite middleware)
// ----------------------------------------------------------------------------
app.get('/api/superadmin-url', (req, res) => {
  res.json({ 
    url: spreadsheetUrl,
    adminPassword,
    adminEmail
  });
});

app.post('/api/superadmin-url', (req, res) => {
  const { url, adminPassword: newPassword, adminEmail: newEmail } = req.body;
  
  if (url !== undefined) {
    spreadsheetUrl = url.trim();
  }
  if (newPassword !== undefined) {
    adminPassword = newPassword.trim();
  }
  if (newEmail !== undefined) {
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

