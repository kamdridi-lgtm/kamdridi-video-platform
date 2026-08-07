require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.static('public'));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
});

function clean(value, max = 2000) {
  return String(value || '').trim().slice(0, max);
}
function validHttpUrl(value) {
  try { const u = new URL(value); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; }
}
function escapeHtml(value) {
  return clean(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'kamdridi-visuals' }));

app.post('/api/intake', async (req, res) => {
  const artistName = clean(req.body.artistName, 120);
  const email = clean(req.body.email, 200);
  const songUrl = clean(req.body.songUrl, 1000);
  const assetsUrl = clean(req.body.assetsUrl, 1000);
  const direction = clean(req.body.direction, 4000);
  const songSection = clean(req.body.songSection, 200);
  const socialPlatform = clean(req.body.socialPlatform, 100);
  if (!artistName || !email.includes('@') || !direction || !validHttpUrl(songUrl) || (assetsUrl && !validHttpUrl(assetsUrl))) {
    return res.status(400).json({ error: 'Please complete the required fields with valid links.' });
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(503).json({ error: 'Project intake email is not configured yet.' });
  }
  const projectId = `KV-${uuidv4().split('-')[0].toUpperCase()}`;
  const destination = process.env.ORDERS_EMAIL || process.env.SMTP_USER;
  const html = `<h2>New $99 teaser project — ${escapeHtml(projectId)}</h2><p><b>Artist:</b> ${escapeHtml(artistName)}</p><p><b>Customer email:</b> ${escapeHtml(email)}</p><p><b>Song:</b> <a href="${escapeHtml(songUrl)}">${escapeHtml(songUrl)}</a></p><p><b>Assets:</b> ${assetsUrl ? `<a href="${escapeHtml(assetsUrl)}">${escapeHtml(assetsUrl)}</a>` : 'Not supplied'}</p><p><b>Song section:</b> ${escapeHtml(songSection) || 'Not specified'}</p><p><b>Platform:</b> ${escapeHtml(socialPlatform)}</p><p><b>Direction:</b><br>${escapeHtml(direction).replace(/\n/g,'<br>')}</p>`;
  try {
    await transporter.sendMail({ from: process.env.FROM_EMAIL || process.env.SMTP_USER, to: destination, replyTo: email, subject: `[${projectId}] New KAMDRIDI Visuals teaser — ${artistName}`, html });
    await transporter.sendMail({ from: process.env.FROM_EMAIL || process.env.SMTP_USER, to: email, subject: `${projectId} — We received your KAMDRIDI Visuals project`, text: `Hi ${artistName},\n\nWe received your teaser project. Your project ID is ${projectId}. Keep this email for reference.\n\nKAMDRIDI Visuals` });
    res.status(201).json({ ok: true, projectId });
  } catch (error) {
    console.error('Intake email failed:', error.message);
    res.status(500).json({ error: 'Unable to submit project right now.' });
  }
});

app.listen(PORT, () => console.log(`KAMDRIDI Visuals running on port ${PORT}`));
