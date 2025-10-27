import nodemailer from 'nodemailer';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const data = (() => {
      try { return JSON.parse(event.body || '{}'); } catch { return {}; }
    })();

    if (!data.email || !data.firstName) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields (firstName, email)' }) };
    }

    // read and trim env vars
    const SMTP_HOST = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const SMTP_PORT = parseInt((process.env.SMTP_PORT || '465').toString().trim(), 10);
    const SMTP_SECURE = (process.env.SMTP_SECURE || (SMTP_PORT === 465 ? 'true' : 'false')).toString().trim() === 'true';
    const SMTP_USER = (process.env.SMTP_USER || '').trim();
    const SMTP_PASS = (process.env.SMTP_PASS || '').trim();

    if (!SMTP_USER || !SMTP_PASS) {
      console.error('SMTP credentials missing');
      return { statusCode: 500, body: JSON.stringify({ error: 'Email service not configured' }) };
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      tls: {
        // allow self-signed / restricted hosts — remove in production if not needed
        rejectUnauthorized: false
      },
      connectionTimeout: 10_000
    });

    // verify transporter early to give clear error on auth/connect
    try {
      await transporter.verify();
    } catch (verifyErr) {
      console.error('SMTP verify failed:', verifyErr);
      return { statusCode: 502, body: JSON.stringify({ error: 'Unable to connect to email server' }) };
    }

    const toEmail = (process.env.TO_EMAIL || 'startflyerads@gmail.com').trim();
    const subject = `New Strategy Session Request from ${data.firstName} ${data.lastName || ''}`;

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
      <p><strong>Subscribe to Newsletter:</strong> ${data.newsletter ? 'Yes' : 'No'}</p>
      <h3>Project Description</h3>
      <p>${(data.description || 'N/A').replace(/\n/g, '<br/>')}</p>
    `;

    await transporter.sendMail({
      from: `"${data.firstName} ${data.lastName || ''}" <${SMTP_USER}>`,
      to: toEmail,
      subject,
      html,
      text: `
Name: ${data.firstName} ${data.lastName || ''}
Email: ${data.email}
Phone: ${data.phone || 'N/A'}
Company: ${data.company || 'N/A'}
Industry: ${data.industry || 'N/A'}
Service Type: ${data.serviceType || 'N/A'}
Budget: ${data.projectBudget || 'N/A'}
Timeline: ${data.timeline || 'N/A'}
Preferred Contact: ${data.preferredContact || 'N/A'}
Subscribe to Newsletter: ${data.newsletter ? 'Yes' : 'No'}

Project Description:
${data.description || 'N/A'}
      `
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('sendEmail error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: (err && err.message) || 'Failed to send email' }) };
  }
}

// sendEmailHandler.js
export async function sendEmail(data) {
  const res = await fetch('/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return res.json();
}
