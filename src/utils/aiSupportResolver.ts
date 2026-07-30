/**
 * VyaparSetu High-Precision AI Support Intent Resolver Engine
 * Enforces Gibberish Filters, Code Bug Scoping, Company Settings Context,
 * Anti-Hack Guardrails, and Accounting Domain Matchers.
 */

export const resolveAiIntent = (q: string, activeModuleTitle = 'VyaparSetu'): string => {
  const queryLower = q.trim().toLowerCase();

  // 1. Keyboard Mash / Random Numbers / Spam Filter (e.g. "12222222", "zzzdsssssszz", "asdfghjk")
  const isNumericOnly = /^\d+$/.test(queryLower);
  const hasFourConsecutiveIdentical = /(.)\1{3,}/.test(queryLower);
  const noVowelsAndLong = queryLower.length >= 5 && !/[aeiouy]/.test(queryLower);
  const isShortNoise = queryLower.length < 3;

  if (isShortNoise || isNumericOnly || hasFourConsecutiveIdentical || noVowelsAndLong) {
    return 'I noticed random characters or numbers in your message. Please type a clear question about your Sales Invoices, Purchase Bills, GST Filing, or Bank Reconciliation!';
  }

  // 2. Data Privacy & Data Integrity Query Handler
  if (
    queryLower.includes('privacy') ||
    queryLower.includes('integrity') ||
    queryLower.includes('data protection') ||
    queryLower.includes('encryption')
  ) {
    return `In VyaparSetu, Data Privacy & Data Integrity are governed by strict enterprise architecture:

1. 🔒 Data Privacy & Security:
- AES-256 Bit Encryption at rest for all stored ledgers, bank credentials, and GSTIN records.
- TLS 1.3 Encrypted Channels for all API transmissions.
- Multi-Tenant Isolation: Zero cross-tenant data leakage.
- Zero-Knowledge AI: Financial data is processed locally in read-only sessions and never shared with third parties.

2. ⚖️ Data Integrity & Auditability:
- Mandatory Double-Entry Balance Rule: System enforces Sum(Debits) = Sum(Credits) on every voucher.
- Immutable Audit Trail: Reconciled vouchers cannot be silently deleted. Adjustments require audited Debit/Credit Notes or Reversal Journals.
- Real-time Subledger to General Ledger (GL) Auto-Sync.`;
  }

  // 3. Grievance / Unethical Practice / Wrong Company Practice (e.g. "wrong company", "wrong practice", "scam", "fraud", "unethical")
  if (
    queryLower.includes('wrong company') ||
    queryLower.includes('wrong organization') ||
    queryLower.includes('wrong practice') ||
    queryLower.includes('scam') ||
    queryLower.includes('fraud') ||
    queryLower.includes('unethical') ||
    queryLower.includes('cheating') ||
    queryLower.includes('complaint') ||
    queryLower.includes('grievance')
  ) {
    return 'VyaparSetu is committed to 100% transparency, ethical business operations, and statutory GST compliance. If you have an operational grievance or wish to report a concern regarding your organization account, please email our Nodal Compliance Officer directly at compliance@vyaparsetu.in or call Senior Escalations at Toll-Free 1800-8927-2738 (Option 4). All grievances are formally investigated within 24 business hours.';
  }

  // 3. Code Flaw / Software Bug / Engineering Queries (e.g. "what is flaw in code")
  if (
    queryLower.includes('flaw in code') ||
    queryLower.includes('code flaw') ||
    queryLower.includes('flaw') ||
    queryLower.includes('software bug') ||
    queryLower.includes('source code') ||
    queryLower.includes('github') ||
    queryLower.includes('script error') ||
    queryLower.includes('programming')
  ) {
    return 'VyaparSetu AI Support Assistant provides guidance on accounting, GST returns, and ledger operations. For software technical issues or bug reports, please contact our engineering helpdesk at support@vyaparsetu.in or Toll-Free 1800-8927-2738.';
  }

  // 4. SHIELD 1: Anti-Hack & Code Injection / Prompt Hacking Protection
  if (
    queryLower.includes('<script') ||
    queryLower.includes('eval(') ||
    queryLower.includes('drop table') ||
    queryLower.includes('select * from') ||
    queryLower.includes('javascript:') ||
    queryLower.includes('system prompt') ||
    queryLower.includes('ignore previous instructions') ||
    queryLower.includes('hack') ||
    queryLower.includes('inject')
  ) {
    return '🚨 Security Policy Alert: Input contains restricted code patterns or security override attempts. All inputs to VyaparSetu AI Assistant are sanitized under strict Zero-Trust Enterprise Security protocols.';
  }

  // 5. SHIELD 2: Zero-Trust Credential & Password Protection
  if (
    queryLower.includes('password') ||
    queryLower.includes('secret') ||
    queryLower.includes('admin login') ||
    queryLower.includes('db_pass') ||
    queryLower.includes('private key')
  ) {
    return '🔒 Security Policy: Admin credentials, passwords, and encryption keys are strictly confidential and protected by Zero-Trust security. VyaparSetu AI Support Assistant never stores or discloses sensitive credentials. Use Company Settings or the official login recovery link if needed.';
  }

  // 6. SHIELD 3: Direct Transaction Execution Scope Boundary (Guidance vs Execution)
  if (
    queryLower.startsWith('post my') ||
    queryLower.startsWith('create my') ||
    queryLower.startsWith('delete my') ||
    queryLower.includes('post purchase invoice') ||
    queryLower.includes('post invoice for me')
  ) {
    return 'ℹ️ Action Scope Notice: The Help & Support Assistant provides read-only step-by-step guidance. To post a Purchase Bill, please use the official form under "Transactions -> Purchase Bills -> + Record Purchase Bill" or click the "Smart AI Accountant" bot button in the top bar to record natural language vouchers securely with user review!';
  }

  // 7. Handling Specific Wrong Entry / Wrong Invoice / Mistakes / Reversals
  if (
    queryLower.includes('wrong invoice') ||
    queryLower.includes('wrong bill') ||
    queryLower.includes('wrong entry') ||
    queryLower.includes('posted wrong') ||
    queryLower.includes('wrong customer') ||
    queryLower.includes('wrong vendor') ||
    queryLower.includes('mistake in bill') ||
    queryLower.includes('incorrect entry') ||
    queryLower.includes('accidental entry')
  ) {
    return `If you posted a wrong invoice, bill, or entry in VyaparSetu, here is the official step-by-step solution:

1. 🧾 For Purchase Bills (Vendor Invoices): Go to "Transactions -> Debit Notes -> Click '+ New Debit Note'". Select the Vendor and the wrong Purchase Bill reference. This debits Accounts Payable and reverses the purchase expense & Input Tax Credit (ITC).

2. 🛒 For Sales Invoices (Customer Invoices): Go to "Transactions -> Sales Invoices", locate the invoice, and click "Edit Invoice" or issue a "Credit Note". A Credit Note reverses customer receivables, output GST liability, and restores inventory stock.

3. 📜 For Journal / Bank Entries: Go to "Finance -> Reports & Ledger", click "+ New Manual Journal", and post a Reversal Entry swapping Debit and Credit accounts.`;
  }

  // 8. Editing / Modifying Existing Records
  if (
    queryLower.includes('edit') ||
    queryLower.includes('modify') ||
    queryLower.includes('change') ||
    queryLower.includes('update')
  ) {
    return 'To edit a transaction or master record: Go to the respective module (Sales Invoices, Purchase Bills, or Parties). If the voucher is un-reconciled, click the "Edit" button on that line. If it is locked in a filed GST return, issue a Debit Note (for purchases) or Credit Note (for sales) to adjust the difference.';
  }

  // 9. Cancelling / Deleting Entries
  if (
    queryLower.includes('cancel') ||
    queryLower.includes('delete') ||
    queryLower.includes('remove') ||
    queryLower.includes('void')
  ) {
    return 'For GST compliance and double-entry audit integrity, posted vouchers cannot be silently deleted if reconciled. Instead, issue a Credit Note (for sales) or Debit Note (for purchases) to zero out the balance cleanly while preserving your audit trail.';
  }

  // 10. GST Input Tax Credit (ITC) & 2A/2B
  if (
    queryLower.includes('itc') ||
    queryLower.includes('gst') ||
    queryLower.includes('tax credit') ||
    queryLower.includes('2a') ||
    queryLower.includes('2b')
  ) {
    return 'GST Input Tax Credit (ITC) is automatically calculated when you record a Purchase Bill with a valid Vendor GSTIN. CGST + SGST (Intrastate) or IGST (Interstate) credits to your Tax Asset account. Verify your monthly eligible ITC under Reports -> GST Summary against GSTR-2B.';
  }

  // 11. Debit Notes & Credit Notes
  if (
    queryLower.includes('debit note') ||
    queryLower.includes('credit note') ||
    queryLower.includes('return')
  ) {
    return 'To record a Purchase Return: Go to Transactions -> Debit Notes -> Click "+ New Debit Note". To record a Sales Return: Go to Transactions -> Sales Invoices -> Issue Credit Note. System automatically updates inventory and subledger balances.';
  }

  // 12. PO & GRN Procurement Workflow
  if (
    queryLower.includes('po') ||
    queryLower.includes('purchase order') ||
    queryLower.includes('grn') ||
    queryLower.includes('goods receipt')
  ) {
    return 'Purchase Orders (PO) record vendor rate commitments. Goods Receipt Notes (GRN) verify warehouse receipt of physical stock before converting to a final Purchase Bill for Accounts Payable financial posting.';
  }

  // 13. Bank Payments, BRS & Cash
  if (
    queryLower.includes('bank') ||
    queryLower.includes('brs') ||
    queryLower.includes('cash') ||
    queryLower.includes('petty cash') ||
    queryLower.includes('cheque') ||
    queryLower.includes('utr')
  ) {
    return 'Bank reconciliation (BRS) compares your recorded bank vouchers against uploaded bank passbook statements. Pure cash / petty cash payments are excluded from BRS to keep bank statements 100% accurate.';
  }

  // 14. Contact & Helpdesk Info
  if (
    queryLower.includes('contact') ||
    queryLower.includes('phone') ||
    queryLower.includes('support') ||
    queryLower.includes('number') ||
    queryLower.includes('helpdesk') ||
    queryLower.includes('call')
  ) {
    return 'You can reach official VyaparSetu Customer Support at Toll-Free: 1800-8927-2738 (1800-VYAPAR-SETU) or Email: support@vyaparsetu.in (Monday-Saturday, 9am-8pm IST).';
  }

  // 15. Off-Topic / Irrelevant Query Filter Guardrail
  if (
    queryLower.includes('weather') ||
    queryLower.includes('recipe') ||
    queryLower.includes('pizza') ||
    queryLower.includes('movie') ||
    queryLower.includes('sports') ||
    queryLower.includes('cricket') ||
    queryLower.includes('joke') ||
    queryLower.includes('song') ||
    queryLower.includes('capital') ||
    queryLower.includes('who are you')
  ) {
    return 'I am the specialized VyaparSetu AI Support Assistant, focused strictly on Accounting, GST Returns, Procurement, BRS, and Business Management. Please ask any question about your invoices, bills, payments, or ledger reports!';
  }

  // 16. Greetings & Friendly Interactions
  if (
    queryLower === 'hi' ||
    queryLower === 'hello' ||
    queryLower === 'hey' ||
    queryLower.startsWith('hi ') ||
    queryLower.startsWith('hello ')
  ) {
    return 'Hello! Welcome to VyaparSetu Support. How can I assist you with your invoices, GST filing, purchase bills, or accounting today?';
  }

  // 17. Smart Module-Aware Domain Assistant Fallback
  return `Regarding your query "${q}": In VyaparSetu, all transactions in ${activeModuleTitle} adhere strictly to Double-Entry GST accounting rules. You can type a specific keyword like "edit invoice", "claim ITC", or "wrong bill" for detailed steps, or call our support desk at 1800-8927-2738.`;
};
