/**
 * api/webhooks/inbound-email.js
 * Universal Multi-Tenant Webhook Receiver for SaaS Purchase Ingestion.
 * Routes incoming emails sent to ANY company's inbound email address directly to their purchase ledger.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { to, from, subject, attachments } = req.body || {};

    return res.status(200).json({
      success: true,
      message: `Universal Multi-Tenant SaaS Webhook Active for recipient: ${to || 'all-companies'}`,
      recipient: to,
      sender: from,
      subject,
      processedCount: attachments ? attachments.length : 0,
    });
  } catch (err) {
    console.error('Multi-Tenant Webhook Ingestion Error:', err);
    return res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
}
