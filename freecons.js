import nodemailer from 'nodemailer';

/**
 * Send a consultation request to the backend
 * @param {Object} data Request data
 * @param {string} data.name Full name (required)
 * @param {string} data.email Email address (required)
 * @param {string} [data.phone] Phone number
 * @param {string} [data.company] Company name
 * @param {string|string[]} [data.services] Requested services
 * @param {string} [data.message] Consultation message
 * @param {string} [baseUrl=''] Base URL of the API
 * @returns {Promise<{ ok: true } | never>} Resolves when sent
 */
export async function sendConsultation(data, baseUrl = '') {
  // Validate required fields
  if (!data?.name?.trim() || !data?.email?.trim()) {
    throw new Error('Name and email are required');
  }

  // Clean data
  const cleanData = {
    ...data,
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone?.trim(),
    company: data.company?.trim(),
    services: Array.isArray(data.services) 
      ? data.services.map(s => s.trim()).filter(Boolean)
      : (data.services?.trim() ? [data.services.trim()] : []),
    message: data.message?.trim()
  };

  try {
    const res = await fetch(`${baseUrl}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanData)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed: ${res.status}`);
    }

    return res.json();
  } catch (err) {
    err.message = `Failed to send consultation request: ${err.message}`;
    throw err;
  }
}

/**
 * Server-side handler for consultation requests
 * @param {Object} event HTTP event
 * @param {Object} context Server context
 */
export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const data = (() => { try { return JSON.parse(event.body || '{}'); } catch { return {}; } })();

    if (!data?.email || !data?.name) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields (name, email)' }) };
    }

    const SMTP_HOST = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const SMTP_PORT = parseInt((process.env.SMTP_PORT || '465').toString().trim(), 10);
    const SMTP_SECURE = (process.env.SMTP_SECURE || (SMTP_PORT === 465 ? 'true' : 'false')).toString().trim() === 'true';
    const SMTP_USER = (process.env.SMTP_USER || '').trim();
    const SMTP_PASS = (process.env.SMTP_PASS || '').trim();
    const TO_EMAIL = (process.env.TO_EMAIL || 'startflyerads@gmail.com').trim();

    if (!SMTP_USER || !SMTP_PASS) {
      console.error('SMTP credentials missing');
      return { statusCode: 500, body: JSON.stringify({ error: 'Email service not configured' }) };
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000
    });

    try {
      await transporter.verify();
    } catch (verifyErr) {
      console.error('SMTP verify failed:', verifyErr);
      return { statusCode: 502, body: JSON.stringify({ error: 'Unable to connect to email server' }) };
    }

    const subject = `New Consultation Request from ${data.name}`;
    const html = `
      <h2>New Consultation Request</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
      <p><strong>Company:</strong> ${data.company || 'N/A'}</p>
      <p><strong>Services:</strong> ${Array.isArray(data.services) ? data.services.join(', ') : (data.services || 'N/A')}</p>
      <h3>Message</h3>
      <p>${(data.message || 'N/A').replace(/\n/g, '<br/>')}</p>
    `;

    await transporter.sendMail({
      from: `"${data.name}" <${SMTP_USER}>`,
      to: TO_EMAIL,
      subject,
      text: [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Phone: ${data.phone || 'N/A'}`,
        `Company: ${data.company || 'N/A'}`,
        `Services: ${Array.isArray(data.services) ? data.services.join(', ') : (data.services || 'N/A')}`,
        '',
        'Message:',
        data.message || 'N/A'
      ].join('\n'),
      html
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('sendConsultation error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || 'Failed to send email' }) };
  }
}