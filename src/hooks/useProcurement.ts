/**
 * useProcurement.ts
 * Enterprise Procurement Data Layer:
 * 1. Department Budget Management (Allocated, Consumed, Available, Beyond Budget Alerts)
 * 2. Purchase Indents / Requisitions (PR) with Stock Availability & Budget Verification
 * 3. Request for Quotation (RFQ) & Multi-Vendor L1 Evaluation Engine
 * 4. Purchase Order (PO) Conversion & End-to-End Audit Trail Linkage
 */

import { useState, useCallback } from 'react';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export interface DepartmentBudget {
  id: string;
  departmentName: string; // e.g. 'IT & Hardware', 'Manufacturing', 'Marketing', 'Administration'
  code: string;
  allocatedBudget: number;
  consumedBudget: number; // Sum of posted POs/Bills
  pendingPRValue: number;  // Sum of open Indents
  fiscalYear: string;
}

export interface BudgetAuditLog {
  id: string;
  departmentId: string;
  departmentName: string;
  oldAmount: number;
  newAmount: number;
  changeAmount: number;
  changedBy: string;
  date: string;
  reason?: string;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
}

export interface IndentItem {
  id: string;
  itemId?: string;
  itemDescription: string;
  hsnCode: string;
  requestedQty: number;
  availableStockQty: number; // Current Warehouse Stock
  estimatedRate: number;
  estimatedTotal: number;
  specifications?: string;    // Technical Specs / Detailed Requirements
  expectedReceiptDate?: string; // Target Delivery Date
}

export interface PurchaseIndent {
  id: string;
  indentNo: string; // PR-2026-001
  date: string;
  departmentId: string;
  departmentName: string;
  requestedBy: string;
  items: IndentItem[];
  totalEstimatedAmount: number;
  stockAvailabilityStatus: 'Fully Available' | 'Partial Stock' | 'Out of Stock (Procurement Needed)';
  budgetsCheckStatus: 'Within Budget' | 'BEYOND BUDGET WARNING';
  status: 'Pending Quote' | 'RFQ Generated' | 'PO Converted' | 'Closed';
  createdAt: string;
}

export interface VendorQuoteResponse {
  vendorId: string;
  vendorName: string;
  unitRate: number;
  freightAmount: number;
  gstPct: number;
  totalLandedCost: number;
  deliveryDays: number;
  paymentTerms: string;
  isL1: boolean; // System auto-evaluates L1 (Lowest Bidder)
}

export interface PurchaseQuoteRFQ {
  id: string;
  rfqNo: string; // RFQ-2026-001
  indentId: string;
  indentNo: string;
  departmentName: string;
  date: string;
  itemDescription: string;
  qty: number;
  vendorResponses: VendorQuoteResponse[];
  selectedL1Vendor?: string;
  status: 'Open RFQ' | 'L1 Selected' | 'Converted to PO';
  createdAt: string;
}

export interface PurchaseOrderRecord {
  id: string;
  poNo: string; // PO-2026-001
  date: string;
  rfqId?: string;
  rfqNo?: string;
  indentId?: string;
  indentNo?: string;
  departmentName: string;
  vendorName: string;
  items: { description: string; qty: number; rate: number; amount: number; gstRate: number }[];
  subtotal: number;
  gstTotal: number;
  netTotal: number;
  paymentTerms: string;
  deliveryDays: number;
  status: 'Issued to Vendor' | 'Billed' | 'Cancelled';
  createdAt: string;
}

// ────────────────────────────────────────────────────────────────
// Initial Seed Data
// ────────────────────────────────────────────────────────────────

export const SYSTEM_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Vikram Singh (IT Head)', department: 'IT & Hardware Infrastructure', designation: 'IT Operations Head' },
  { id: 'emp-2', name: 'Rahul Sharma (Plant Mgr)', department: 'Manufacturing & Production', designation: 'Factory Plant Manager' },
  { id: 'emp-3', name: 'Priya Verma (VP Mktg)', department: 'Marketing & Sales Promotion', designation: 'VP Marketing' },
  { id: 'emp-4', name: 'Ankit Mehta (Facilities)', department: 'Administration & Facilities', designation: 'Facilities Lead' },
  { id: 'emp-5', name: 'Neha Gupta (SysAdmin)', department: 'IT & Hardware Infrastructure', designation: 'Senior Systems Admin' }
];

const SEED_AUDIT_LOGS: BudgetAuditLog[] = [
  { id: 'audit-1', departmentId: 'dept-1', departmentName: 'IT & Hardware Infrastructure', oldAmount: 4000000, newAmount: 5000000, changeAmount: 1000000, changedBy: 'Admin (System)', date: '2026-07-01 10:00:00', reason: 'Annual Budget Expansion' },
  { id: 'audit-2', departmentId: 'dept-2', departmentName: 'Manufacturing & Production', oldAmount: 10000000, newAmount: 12000000, changeAmount: 2000000, changedBy: 'Admin (System)', date: '2026-07-15 14:30:00', reason: 'Q2 Production Scaling Allocation' }
];

const SEED_DEPARTMENTS: DepartmentBudget[] = [
  { id: 'dept-1', departmentName: 'IT & Hardware Infrastructure', code: 'IT-01', allocatedBudget: 5000000, consumedBudget: 1250000, pendingPRValue: 650000, fiscalYear: '2026-27' },
  { id: 'dept-2', departmentName: 'Manufacturing & Production', code: 'MFG-02', allocatedBudget: 12000000, consumedBudget: 4800000, pendingPRValue: 1200000, fiscalYear: '2026-27' },
  { id: 'dept-3', departmentName: 'Marketing & Sales Promotion', code: 'MKT-03', allocatedBudget: 3000000, consumedBudget: 1800000, pendingPRValue: 400000, fiscalYear: '2026-27' },
  { id: 'dept-4', departmentName: 'Administration & Facilities', code: 'ADM-04', allocatedBudget: 2000000, consumedBudget: 850000, pendingPRValue: 150000, fiscalYear: '2026-27' }
];

const SEED_INDENTS: PurchaseIndent[] = [
  {
    id: 'pr-101',
    indentNo: 'PR-2026-001',
    date: '2026-07-28',
    departmentId: 'dept-1',
    departmentName: 'IT & Hardware Infrastructure',
    requestedBy: 'Vikram Singh (IT Head)',
    items: [
      { id: 'item-1', itemDescription: 'Dell Latitude Laptops 16GB RAM', hsnCode: '8471', requestedQty: 10, availableStockQty: 2, estimatedRate: 65000, estimatedTotal: 650000 }
    ],
    totalEstimatedAmount: 650000,
    stockAvailabilityStatus: 'Partial Stock',
    budgetsCheckStatus: 'Within Budget',
    status: 'RFQ Generated',
    createdAt: '2026-07-28T10:30:00Z'
  }
];

const SEED_RFQS: PurchaseQuoteRFQ[] = [
  {
    id: 'rfq-201',
    rfqNo: 'RFQ-2026-001',
    indentId: 'pr-101',
    indentNo: 'PR-2026-001',
    departmentName: 'IT & Hardware Infrastructure',
    date: '2026-07-29',
    itemDescription: 'Dell Latitude Laptops 16GB RAM',
    qty: 10,
    vendorResponses: [
      { vendorId: 'v-1', vendorName: 'Apex Infotech Solutions', unitRate: 64000, freightAmount: 2000, gstPct: 18, totalLandedCost: 757200, deliveryDays: 5, paymentTerms: '30 Days Net', isL1: false },
      { vendorId: 'v-2', vendorName: 'Reliancesoft Systems', unitRate: 58000, freightAmount: 1500, gstPct: 18, totalLandedCost: 686170, deliveryDays: 3, paymentTerms: '15 Days Net', isL1: true },
      { vendorId: 'v-3', vendorName: 'Sahil Traders Pvt Ltd', unitRate: 62000, freightAmount: 1000, gstPct: 18, totalLandedCost: 732780, deliveryDays: 7, paymentTerms: 'Immediate Payment', isL1: false }
    ],
    selectedL1Vendor: 'Reliancesoft Systems',
    status: 'L1 Selected',
    createdAt: '2026-07-29T11:00:00Z'
  }
];

const SEED_POS: PurchaseOrderRecord[] = [
  {
    id: 'po-301',
    poNo: 'PO-2026-001',
    date: '2026-07-30',
    rfqId: 'rfq-201',
    rfqNo: 'RFQ-2026-001',
    indentId: 'pr-101',
    indentNo: 'PR-2026-001',
    departmentName: 'IT & Hardware Infrastructure',
    vendorName: 'Reliancesoft Systems',
    items: [
      { description: 'Dell Latitude Laptops 16GB RAM', qty: 10, rate: 58000, amount: 580000, gstRate: 18 }
    ],
    subtotal: 580000,
    gstTotal: 104400,
    netTotal: 684400,
    paymentTerms: '15 Days Net',
    deliveryDays: 3,
    status: 'Issued to Vendor',
    createdAt: '2026-07-30T14:20:00Z'
  }
];

function load<T>(key: string, def: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : def;
  } catch {
    return def;
  }
}

function save<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export function useProcurement() {
  const [departments, setDepartments] = useState<DepartmentBudget[]>(() => load('vs_departments', SEED_DEPARTMENTS));
  const [auditLogs, setAuditLogs] = useState<BudgetAuditLog[]>(() => load('vs_budget_audits', SEED_AUDIT_LOGS));
  const [indents, setIndents] = useState<PurchaseIndent[]>(() => load('vs_indents', SEED_INDENTS));
  const [rfqs, setRfqs] = useState<PurchaseQuoteRFQ[]>(() => load('vs_rfqs', SEED_RFQS));
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>(() => load('vs_pos', SEED_POS));

  // Save changes
  const updateDepartments = useCallback((newDepts: DepartmentBudget[]) => {
    setDepartments(newDepts);
    save('vs_departments', newDepts);
  }, []);

  const updateAuditLogs = useCallback((newAudits: BudgetAuditLog[]) => {
    setAuditLogs(newAudits);
    save('vs_budget_audits', newAudits);
  }, []);

  const updateIndents = useCallback((newIndents: PurchaseIndent[]) => {
    setIndents(newIndents);
    save('vs_indents', newIndents);
  }, []);

  const updateRfqs = useCallback((newRfqs: PurchaseQuoteRFQ[]) => {
    setRfqs(newRfqs);
    save('vs_rfqs', newRfqs);
  }, []);

  const updatePurchaseOrders = useCallback((newPOs: PurchaseOrderRecord[]) => {
    setPurchaseOrders(newPOs);
    save('vs_pos', newPOs);
  }, []);

  // Update Department Budget with Audit Trail Logging
  const updateDepartmentBudget = useCallback((departmentId: string, newAllocatedBudget: number, changedBy = 'Admin User', reason = 'Budget Re-allocation') => {
    const targetDept = departments.find(d => d.id === departmentId);
    if (!targetDept) return;

    const oldVal = targetDept.allocatedBudget;
    const diff = newAllocatedBudget - oldVal;

    const updated = departments.map(d => d.id === departmentId ? { ...d, allocatedBudget: newAllocatedBudget } : d);
    updateDepartments(updated);

    // Record Audit Entry
    const auditEntry: BudgetAuditLog = {
      id: `audit_${Date.now()}`,
      departmentId,
      departmentName: targetDept.departmentName,
      oldAmount: oldVal,
      newAmount: newAllocatedBudget,
      changeAmount: diff,
      changedBy,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      reason
    };

    updateAuditLogs([auditEntry, ...auditLogs]);
  }, [departments, auditLogs, updateDepartments, updateAuditLogs]);

  // Add New Department Budget with Audit Trail Logging
  const addDepartment = useCallback((deptName: string, code: string, allocatedBudget: number, changedBy = 'Admin User') => {
    const newDept: DepartmentBudget = {
      id: `dept_${Date.now()}`,
      departmentName: deptName,
      code,
      allocatedBudget,
      consumedBudget: 0,
      pendingPRValue: 0,
      fiscalYear: '2026-27'
    };
    updateDepartments([...departments, newDept]);

    // Record Audit Entry
    const auditEntry: BudgetAuditLog = {
      id: `audit_${Date.now()}`,
      departmentId: newDept.id,
      departmentName: deptName,
      oldAmount: 0,
      newAmount: allocatedBudget,
      changeAmount: allocatedBudget,
      changedBy,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      reason: 'Initial Department Creation & Allocation'
    };

    updateAuditLogs([auditEntry, ...auditLogs]);
  }, [departments, auditLogs, updateDepartments, updateAuditLogs]);

  // 1. Create New Purchase Indent / Requisition
  const createIndent = useCallback((data: {
    departmentId: string;
    requestedBy: string;
    items: { itemId?: string; itemDescription: string; hsnCode: string; requestedQty: number; availableStockQty: number; estimatedRate: number; specifications?: string; expectedReceiptDate?: string }[];
  }) => {
    const dept = departments.find(d => d.id === data.departmentId) || departments[0];

    const processedItems = data.items.map((item, idx) => ({
      id: `ii_${Date.now()}_${idx}`,
      ...item,
      estimatedTotal: item.requestedQty * item.estimatedRate
    }));

    const totalEst = processedItems.reduce((acc, i) => acc + i.estimatedTotal, 0);

    // Stock check
    const hasOutStock = processedItems.some(i => i.requestedQty > i.availableStockQty);
    const stockStatus = hasOutStock ? 'Out of Stock (Procurement Needed)' : 'Fully Available';

    // Budget check
    const remainingBudget = dept.allocatedBudget - (dept.consumedBudget + dept.pendingPRValue);
    const budgetStatus = totalEst > remainingBudget ? 'BEYOND BUDGET WARNING' : 'Within Budget';

    const newIndent: PurchaseIndent = {
      id: `pr_${Date.now()}`,
      indentNo: `PR-2026-${(indents.length + 1).toString().padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      departmentId: dept.id,
      departmentName: dept.departmentName,
      requestedBy: data.requestedBy,
      items: processedItems,
      totalEstimatedAmount: totalEst,
      stockAvailabilityStatus: stockStatus,
      budgetsCheckStatus: budgetStatus,
      status: 'Pending Quote',
      createdAt: new Date().toISOString()
    };

    const updatedIndents = [newIndent, ...indents];
    updateIndents(updatedIndents);

    // Update department pending PR value
    const updatedDepts = departments.map(d => d.id === dept.id ? { ...d, pendingPRValue: d.pendingPRValue + totalEst } : d);
    updateDepartments(updatedDepts);

    return newIndent;
  }, [departments, indents, updateIndents, updateDepartments]);

  // 2. Generate RFQ / Purchase Quote from Indent
  const generateRFQFromIndent = useCallback((indentId: string, vendorNames: string[]) => {
    const indent = indents.find(i => i.id === indentId);
    if (!indent) return null;

    const firstItem = indent.items[0];
    const baseRate = firstItem ? firstItem.estimatedRate : 50000;

    // Auto-populate vendor quote responses with realistic variances
    const responses: VendorQuoteResponse[] = vendorNames.map((name, idx) => {
      const variance = idx === 0 ? 0.95 : idx === 1 ? 0.90 : 0.98; // Vendor 2 will be L1 lowest
      const unitRate = Math.round(baseRate * variance);
      const freightAmount = 1000 + idx * 500;
      const gstPct = 18;
      const sub = unitRate * (firstItem ? firstItem.requestedQty : 1);
      const totalLanded = Math.round((sub + freightAmount) * (1 + gstPct / 100));

      return {
        vendorId: `v_${idx}`,
        vendorName: name,
        unitRate,
        freightAmount,
        gstPct,
        totalLandedCost: totalLanded,
        deliveryDays: 3 + idx * 2,
        paymentTerms: idx === 1 ? '15 Days Net' : 'Immediate Payment',
        isL1: false
      };
    });

    // Auto-evaluate L1 (Lowest Landed Cost)
    let lowestCost = Infinity;
    let l1Vendor = '';

    responses.forEach(r => {
      if (r.totalLandedCost < lowestCost) {
        lowestCost = r.totalLandedCost;
        l1Vendor = r.vendorName;
      }
    });

    responses.forEach(r => {
      r.isL1 = (r.vendorName === l1Vendor);
    });

    const newRFQ: PurchaseQuoteRFQ = {
      id: `rfq_${Date.now()}`,
      rfqNo: `RFQ-2026-${(rfqs.length + 1).toString().padStart(3, '0')}`,
      indentId: indent.id,
      indentNo: indent.indentNo,
      departmentName: indent.departmentName,
      date: new Date().toISOString().split('T')[0],
      itemDescription: firstItem ? firstItem.itemDescription : 'Requested Procurement Items',
      qty: firstItem ? firstItem.requestedQty : 1,
      vendorResponses: responses,
      selectedL1Vendor: l1Vendor,
      status: 'L1 Selected',
      createdAt: new Date().toISOString()
    };

    updateRfqs([newRFQ, ...rfqs]);

    // Update Indent status
    updateIndents(indents.map(i => i.id === indentId ? { ...i, status: 'RFQ Generated' } : i));

    return newRFQ;
  }, [indents, rfqs, updateRfqs, updateIndents]);

  // 3. Convert L1 Quote to Purchase Order (PO)
  const convertL1QuoteToPO = useCallback((rfqId: string) => {
    const rfq = rfqs.find(r => r.id === rfqId);
    if (!rfq) return null;

    const l1Response = rfq.vendorResponses.find(v => v.isL1) || rfq.vendorResponses[0];
    const subtotal = l1Response.unitRate * rfq.qty;
    const gstTotal = Math.round(subtotal * (l1Response.gstPct / 100));
    const netTotal = subtotal + gstTotal;

    const newPO: PurchaseOrderRecord = {
      id: `po_${Date.now()}`,
      poNo: `PO-2026-${(purchaseOrders.length + 1).toString().padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      rfqId: rfq.id,
      rfqNo: rfq.rfqNo,
      indentId: rfq.indentId,
      indentNo: rfq.indentNo,
      departmentName: rfq.departmentName,
      vendorName: l1Response.vendorName,
      items: [
        { description: rfq.itemDescription, qty: rfq.qty, rate: l1Response.unitRate, amount: subtotal, gstRate: l1Response.gstPct }
      ],
      subtotal,
      gstTotal,
      netTotal,
      paymentTerms: l1Response.paymentTerms,
      deliveryDays: l1Response.deliveryDays,
      status: 'Issued to Vendor',
      createdAt: new Date().toISOString()
    };

    updatePurchaseOrders([newPO, ...purchaseOrders]);

    // Update RFQ status
    updateRfqs(rfqs.map(r => r.id === rfqId ? { ...r, status: 'Converted to PO' } : r));

    // Update Indent status
    updateIndents(indents.map(i => i.id === rfq.indentId ? { ...i, status: 'PO Converted' } : i));

    // Update Department Budget consumed value
    updateDepartments(departments.map(d => {
      if (d.departmentName === rfq.departmentName) {
        return {
          ...d,
          consumedBudget: d.consumedBudget + netTotal,
          pendingPRValue: Math.max(0, d.pendingPRValue - netTotal)
        };
      }
      return d;
    }));

    return newPO;
  }, [rfqs, purchaseOrders, indents, departments, updatePurchaseOrders, updateRfqs, updateIndents, updateDepartments]);

  return {
    departments,
    auditLogs,
    indents,
    rfqs,
    purchaseOrders,
    createIndent,
    generateRFQFromIndent,
    convertL1QuoteToPO,
    updateDepartmentBudget,
    addDepartment
  };
}
