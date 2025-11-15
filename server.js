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
// 🟢 FORM 4 — Service Discovery Wizard
// ====================================================
app.post('/api/form4', async (req, res) => {
  const { answers, recommendations, timestamp, metadata } = req.body;

  if (!answers || !recommendations) {
    return res.status(400).json({ error: 'Wizard answers and recommendations are required' });
  }

  try {
    const transporter = createTransporter();

    // Format challenges and priorities lists
    const challengesList = answers['challenges']?.map(challenge => `<li>${challenge}</li>`).join('') || 'None specified';
    const prioritiesList = answers['priorities']?.map(priority => `<li>${priority}</li>`).join('') || 'None specified';
    const servicesList = recommendations?.map(service => `
      <li style="margin-bottom: 15px;">
        <strong>${service.title}</strong><br>
        ${service.description}<br>
        <em>Benefits:</em> ${service.benefits.join(', ')}
      </li>
    `).join('') || 'No recommendations generated';

    const html = `
      <h2>New Service Discovery Wizard Submission</h2>
      <p><strong>Submitted:</strong> ${new Date(timestamp).toLocaleString()}</p>
      
      <h3>Business Profile</h3>
      <p><strong>Business Type:</strong> ${answers['business-type'] || 'Not specified'}</p>
      
      <h3>Selected Challenges</h3>
      <ul style="margin-bottom: 20px;">
        ${challengesList}
      </ul>
      
      <h3>Priorities</h3>
      <ul style="margin-bottom: 20px;">
        ${prioritiesList}
      </ul>
      
      <h3>Timeline</h3>
      <p style="margin-bottom: 20px;">${answers['timeline'] || 'Not specified'}</p>
      
      <h3>Recommended Services</h3>
      <ul style="margin-bottom: 20px;">
        ${servicesList}
      </ul>
      
      <h3>User Details</h3>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace;">
        Browser: ${metadata?.userAgent || 'Not available'}<br>
        Language: ${metadata?.language || 'Not available'}<br>
        Screen Size: ${metadata?.screenSize || 'Not available'}
      </div>
      
      <hr>
      <p style="color: #666; font-size: 12px;">
        Submitted via Service Discovery Wizard
      </p>
    `;

    await transporter.sendMail({
      from: `"Service Discovery Wizard" <${process.env.SMTP_USER}>`,
      to: TO_EMAIL,
      subject: 'New Service Discovery Wizard Submission',
      html
    });

    res.json({ ok: true, message: 'Form4 (Service Discovery) submission processed successfully!' });
  } catch (err) {
    console.error('Form4 Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// 🟢 FORM 5 — Quote Request (Send Quote)
// ====================================================
app.post('/api/form5', async (req, res) => {
  try {
    const { service, form, timestamp, metadata } = req.body || {};

    if (!form || !form.name || !form.email) {
      return res.status(400).json({ error: 'Form submission must include name and email' });
    }

    const transporter = createTransporter();

    const submittedAt = timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString();
    const serviceTitle = service?.title || 'General';

    const html = `
      <h2>New Quote Request</h2>
      <p><strong>Service:</strong> ${serviceTitle}</p>
      <p><strong>Submitted:</strong> ${submittedAt}</p>

      <h3>Contact</h3>
      <p><strong>Name:</strong> ${form.name || ''}<br/>
      <strong>Email:</strong> ${form.email || ''}<br/>
      <strong>Company:</strong> ${form.company || ''}<br/>
      <strong>Budget:</strong> ${form.budget || ''}<br/>
      <strong>Timeline:</strong> ${form.timeline || ''}</p>

      <h3>Message</h3>
      <p>${(form.message || '').replace(/\n/g, '<br/>')}</p>

      <h4>Metadata</h4>
      <pre>${JSON.stringify(metadata || {}, null, 2)}</pre>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `${form.name} <${process.env.SMTP_USER}>`,
      to: process.env.NOTIFICATION_EMAIL || TO_EMAIL,
      subject: `Quote Request - ${serviceTitle}`,
      html,
    });

    return res.json({ ok: true, message: 'Form5 (Quote Request) submitted successfully!' });
  } catch (err) {
    console.error('Form5 Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ====================================================
// 🟢 Start Server
// ====================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
