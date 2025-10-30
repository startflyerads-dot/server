import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();

app.use(cors({ origin: '*', methods: 'GET,POST', allowedHeaders: 'Content-Type, Authorization' }));
app.use(express.json());

// ✅ Common transporter function
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
  });
}

const TO_EMAIL = process.env.TO_EMAIL || 'startflyerads@gmail.com';

// ====================================================
// 🟢 FORM 1 — Consultation Request
// ====================================================
app.post('/api/form1', async (req, res) => {
  const data = req.body;

  if (!data.name || !data.email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const transporter = createTransporter();

    const html = `
      <h2>Consultation Request</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
      <p><strong>Company:</strong> ${data.company || 'N/A'}</p>
      <p><strong>Services:</strong> ${
        Array.isArray(data.services) ? data.services.join(', ') : data.services || 'N/A'
      }</p>
      <h3>Message:</h3>
      <p>${data.message || 'No message provided'}</p>
    `;

    await transporter.sendMail({
      from: `"${data.name}" <${process.env.SMTP_USER}>`,
      to: TO_EMAIL,
      subject: `New Consultation Request from ${data.name}`,
      html
    });

    res.json({ ok: true, message: 'Form1 (Consultation) email sent successfully!' });
  } catch (err) {
    console.error('Form1 Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// 🟢 FORM 2 — Contact / Strategy Session / Any Other
// ====================================================
app.post('/api/form2', async (req, res) => {
  const data = req.body;

  if (!data.firstName || !data.email) {
    return res.status(400).json({ error: 'First name and email are required' });
  }

  try {
    const transporter = createTransporter();

    const html = `
      <h2>New Strategy Session Request</h2>
      <p><strong>Name:</strong> ${data.firstName} ${data.lastName || ''}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
      <p><strong>Company:</strong> ${data.company || 'N/A'}</p>
      <p><strong>Industry:</strong> ${data.industry || 'N/A'}</p>
      <p><strong>Service Type:</strong> ${data.serviceType || 'N/A'}</p>
      <p><strong>Budget:</strong> ${data.projectBudget || 'N/A'}</p>
      <p><strong>Timeline:</strong> ${data.timeline || 'N/A'}</p>
      <p><strong>Preferred Contact:</strong> ${data.preferredContact || 'N/A'}</p>
      <p><strong>Subscribe to newsletter:</strong> ${data.newsletter ? 'Yes' : 'No'}</p>
      <h3>Project Description</h3>
      <p>${data.description || 'N/A'}</p>
    `;

    await transporter.sendMail({
      from: `"${data.firstName}" <${process.env.SMTP_USER}>`,
      to: TO_EMAIL,
      subject: `New Strategy Session Request from ${data.firstName}`,
      html
    });

    res.json({ ok: true, message: 'Form2 (Strategy Session) email sent successfully!' });
  } catch (err) {
    console.error('Form2 Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// 🟢 FORM 3 — Free Consultation Scheduler
// ====================================================
app.post('/api/form3', async (req, res) => {
  const data = req.body;

  if (!data.name || !data.email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const transporter = createTransporter();

    const html = `
      <h2>Free Consultation Request</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Company:</strong> ${data.company || 'N/A'}</p>
      <p><strong>Preferred Date/Time:</strong> ${data.preferredDate || 'Not specified'}</p>
      <h3>Message / Goals:</h3>
      <p>${(data.message || 'No message provided').replace(/\n/g, '<br/>')}</p>
      
      <hr>
      <p style="color: #666; font-size: 12px;">
        Submitted via Schedule Free Consultation form
      </p>
    `;

    await transporter.sendMail({
      from: `"${data.name}" <${process.env.SMTP_USER}>`,
      to: TO_EMAIL,
      subject: `New Free Consultation Request from ${data.name}`,
      html
    });

    res.json({ ok: true, message: 'Form3 (Free Consultation) email sent successfully!' });
  } catch (err) {
    console.error('Form3 Error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ====================================================
// 🟢 Start Server
// ====================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
