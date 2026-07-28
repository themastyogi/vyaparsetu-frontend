import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import crypto from 'crypto';

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
  const seenHashes = new Set();
  let scannedCount = 0;

  try {
    await client.connect();
    let lock = await client.getMailboxLock('INBOX');

    try {
      const status = await client.status('INBOX', { messages: true });
      const totalMsgs = status.messages || 0;
      const startSeq = Math.max(1, totalMsgs - 250);

      const messages = client.fetch(`${startSeq}:*`, { source: true, flags: true, bodyStructure: true });

      for await (let message of messages) {
        scannedCount++;
        try {
          const parsed = await simpleParser(message.source);

          if (parsed.attachments && parsed.attachments.length > 0) {
            for (let att of parsed.attachments) {
              const filename = att.filename || 'attachment.pdf';
              const isDoc = filename.toLowerCase().endsWith('.pdf') || 
                            filename.toLowerCase().endsWith('.png') || 
                            filename.toLowerCase().endsWith('.jpg') || 
                            filename.toLowerCase().endsWith('.jpeg');
              
              if (isDoc && att.content) {
                const fileBuffer = att.content;
                const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

                // Check duplicate hash
                if (seenHashes.has(sha256Hash)) {
                  continue; // Skip duplicate attachment hash
                }
                seenHashes.add(sha256Hash);

                const senderName = parsed.from?.value[0]?.name || parsed.from?.text?.split('<')[0]?.trim() || '';
                const senderEmail = parsed.from?.value[0]?.address || email;

                invoices.push({
                  pdfBase64: fileBuffer.toString('base64'),
                  sha256Hash,
                  filename,
                  senderName,
                  senderEmail,
                  messageId: message.uid || parsed.messageId,
                  subject: parsed.subject,
                  date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
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
      scannedCount,
      count: invoices.length,
      invoices,
      message: `Scanned ${scannedCount} emails in INBOX: Found ${invoices.length} invoice attachment(s).`
    });

  } catch (err) {
    console.error('IMAP sync error:', err);
    return res.status(400).json({
      success: false,
      error: `IMAP Email Sync Error: ${err.message}. Please check 2-Step Verification and 16-character App Password.`,
    });
  }
}
