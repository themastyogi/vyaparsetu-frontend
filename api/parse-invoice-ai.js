/**
 * Serverless API endpoint for AI Agent PDF Invoice Extraction
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { rawText, fileName, apiKey } = req.body || {};
  if (!rawText) {
    return res.status(400).json({ error: 'Missing rawText in request body' });
  }

  const geminiApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const cleanKey = geminiApiKey.trim();
      const isOAuth = cleanKey.startsWith('AQ.');
      const apiUrl = isOAuth 
        ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
        : `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`;

      const headers = { 'Content-Type': 'application/json' };
      if (isOAuth) {
        headers['Authorization'] = `Bearer ${cleanKey}`;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are an AI Document Agent for Indian GST Invoices. Analyze the raw invoice text extracted from "${fileName || 'Invoice.pdf'}" and respond ONLY with JSON.

JSON Schema:
{
  "vendorName": "Vendor Company Name",
  "vendorGstin": "15-digit GSTIN",
  "invoiceNo": "Invoice Number",
  "date": "YYYY-MM-DD",
  "subtotal": 34300,
  "gstTotal": 6174,
  "netTotal": 40474,
  "discountAmount": 0,
  "paymentTerms": "Net 30 Days",
  "taxType": "intra_state",
  "cgstTotal": 3087,
  "sgstTotal": 3087,
  "igstTotal": 0,
  "items": [
    { "description": "Item Name", "qty": 1, "rate": 34300, "amount": 34300, "gstRate": 18, "total": 40474 }
  ]
}

Text:
${rawText}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const jsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          return res.status(200).json({
            success: true,
            extractedByAi: true,
            model: 'gemini-1.5-flash',
            invoiceData: parsed,
          });
        }
      }
    } catch (err) {
      console.error('API AI Agent Parse Error:', err);
    }
  }

  return res.status(200).json({
    success: false,
    extractedByAi: false,
    message: 'No API key provided or network fallback. Using client layout parser.'
  });
}
