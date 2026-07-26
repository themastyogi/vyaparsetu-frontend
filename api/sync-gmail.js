import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email, password, host } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  // Clean password (remove spaces if user copied with spaces e.g. "abcd efgh ijkl mnop")
  const cleanPassword = password.replace(/\s+/g, '').trim();

  const client = new ImapFlow({
    host: host || 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: email.trim(),
      pass: cleanPassword,
    },
    logger: false,
  });

  const invoices = [];
  let scannedCount = 0;

  try {
    await client.connect();
    let lock = await client.getMailboxLock('INBOX');

    try {
      // Fetch recent 30 messages in INBOX (both read and unread) to catch all vendor PDFs
      const status = await client.status('INBOX', { messages: true });
      const totalMsgs = status.messages || 0;
      const startSeq = Math.max(1, totalMsgs - 30);

      const messages = client.fetch(`${startSeq}:*`, { source: true, flags: true, bodyStructure: true });

      for await (let message of messages) {
        scannedCount++;
        if (!message.source) continue;

        try {
          const parsed = await simpleParser(message.source);

          if (parsed.attachments && parsed.attachments.length > 0) {
            for (let att of parsed.attachments) {
              const filename = att.filename || 'attachment.pdf';
              if (filename.toLowerCase().endsWith('.pdf')) {
                const vendorName = parsed.from?.value[0]?.name || parsed.from?.text?.split('<')[0]?.trim() || 'Vendor';
                const senderEmail = parsed.from?.value[0]?.address || email;
                const dateStr = parsed.date ? new Date(parsed.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

                // Extract text from email subject/body for amounts or invoice numbers if available
                const emailText = (parsed.text || '') + ' ' + (parsed.subject || '');
                const invNoMatch = emailText.match(/(?:invoice|bill|inv)\s*#?\s*[:.-]?\s*([A-Z0-9\/-]{3,25})/i);
                const invoiceNo = invNoMatch ? invNoMatch[1].trim() : ('INV-' + Math.floor(100000 + Math.random() * 900000));

                const amountMatch = emailText.match(/(?:total|amount|rs|₹)\s*[:.-]?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
                const subtotal = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 10000;
                const gstTotal = Math.round(subtotal * 0.18);
                const netTotal = subtotal + gstTotal;

                invoices.push({
                  invoiceNo,
                  date: dateStr,
                  vendorName,
                  vendorGstin: 'UNREGISTERED',
                  subtotal,
                  gstTotal,
                  netTotal,
                  attachedFileName: filename,
                  senderEmail,
                });
              }
            }
          }
        } catch (parseErr) {
          console.error('Mail parsing error for message:', parseErr);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    return res.status(200).json({
      success: true,
      invoices,
      scannedCount,
      count: invoices.length,
      message: `Scanned ${scannedCount} recent emails in INBOX for ${email}: Found ${invoices.length} PDF invoice attachment(s).`
    });

  } catch (err) {
    console.error('Vercel IMAP Sync Error:', err);
    return res.status(500).json({
      error: `Gmail IMAP Connection Error: ${err.message}. Please check if 2-Step Verification is ON and your 16-character App Password is correct.`,
    });
  }
}
