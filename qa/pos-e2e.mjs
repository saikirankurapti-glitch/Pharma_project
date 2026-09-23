const BASE = process.env.BASE_URL || 'http://localhost:5000/api';
import { qaRuntime } from './runtime.mjs';

async function req(path, options = {}) {
  const r = await fetch(BASE + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  let body = null;
  try { body = await r.json(); } catch {}
  return { status: r.status, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function login(email, password) {
  if (!password && process.env.QA_PASSWORD) password = process.env.QA_PASSWORD;
  const r = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert(r.status === 200 && r.body?.token, `Login failed for ${email}: HTTP ${r.status}`);
  return r.body.token;
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

function itemFromProduct(p, qty = 1) {
  const b = p.batches[0];
  const taxable = p.sellingPrice * qty;
  const cgst = taxable * (p.gstRate / 2) / 100;
  const sgst = cgst;
  const totalGst = cgst + sgst;
  return {
    cartItemId: `qa-${Date.now()}`,
    productId: p._id,
    product: p,
    productSnapshot: p,
    selectedBatch: {
      batchNumber: b.batchNumber,
      expiryDate: b.expiryDate,
      stockQuantity: b.stockQuantity,
      location: b.location,
      mrp: b.mrp ?? p.unitMRP,
    },
    quantity: qty,
    unitMode: 'PACK',
    unitPrice: p.sellingPrice,
    discountPercent: 0,
    taxableAmount: taxable,
    cgstAmount: cgst,
    sgstAmount: sgst,
    totalGst,
    lineTotal: taxable + totalGst,
    isSubstitute: false,
  };
}

async function getProduct(token, search) {
  const r = await req('/products?search=' + encodeURIComponent(search), { headers: auth(token) });
  assert(r.status === 200 && r.body?.data?.length, `Product lookup failed for ${search}: HTTP ${r.status}`);
  return r.body.data[0];
}

const results = [];
async function test(id, name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ id, name, status: 'PASS', ms: Date.now() - started, error: '' });
  } catch (e) {
    results.push({ id, name, status: 'FAIL', ms: Date.now() - started, error: e.message });
  }
}

const pharmacist = await login(qaRuntime.pharmacistEmail, qaRuntime.password);
const manager = await login(qaRuntime.managerEmail, qaRuntime.password);

await test('TC-E2E-001', 'Regular medicine sale', async () => {
  const p = await getProduct(pharmacist, 'Dolo 650');
  assert(p.scheduleCategory === 'REGULAR', 'Expected a REGULAR product');
  assert(p.batches?.length > 0 && p.batches[0].stockQuantity > 0, 'Product has no stock');
  const item = itemFromProduct(p);
  const subtotal = item.taxableAmount;
  const total = item.lineTotal;
  const r = await req('/invoices', {
    method: 'POST',
    headers: auth(pharmacist),
    body: JSON.stringify({
      billingSession: {
        items: [item],
        doctorDetails: { doctorName: '', regNo: '' },
        patientDetails: { patientName: 'QA Walk-in', phone: '9000000001', age: '30', gender: 'MALE' },
        scheduleXVerified: false,
        pharmacistSignatureAcknowledged: true,
      },
      payment: { method: 'CASH', cashAmount: total, upiAmount: 0, cardAmount: 0, totalPaid: total, changeDue: 0, paymentStatus: 'SUCCESS' },
      subtotal, totalDiscount: 0, totalCGST: item.cgstAmount, totalSGST: item.sgstAmount, grandTotal: total,
      invoiceType: 'REGULAR',
    }),
  });
  assert(r.status === 201 && r.body?.data?.invoiceNumber, `Expected invoice creation, got HTTP ${r.status}`);
});

await test('TC-E2E-002', 'Schedule H prescription sale', async () => {
  const p = await getProduct(pharmacist, 'Augmentin 625');
  const item = itemFromProduct(p);
  const common = {
    billingSession: {
      items: [item],
      doctorDetails: { doctorName: '', regNo: '' },
      patientDetails: { patientName: '', phone: '', age: '', gender: '' },
      scheduleXVerified: false,
      pharmacistSignatureAcknowledged: true,
    },
    payment: { method: 'CASH', cashAmount: item.lineTotal, upiAmount: 0, cardAmount: 0, totalPaid: item.lineTotal, changeDue: 0, paymentStatus: 'SUCCESS' },
    subtotal: item.taxableAmount, totalDiscount: 0, totalCGST: item.cgstAmount, totalSGST: item.sgstAmount, grandTotal: item.lineTotal,
    invoiceType: 'REGULAR',
  };
  const blocked = await req('/invoices', { method: 'POST', headers: auth(pharmacist), body: JSON.stringify(common) });
  assert(blocked.status === 400, `Expected missing prescription details to be blocked, got HTTP ${blocked.status}`);
  common.billingSession.doctorDetails = { doctorName: 'Dr QA', regNo: 'QA-REG-001' };
  common.billingSession.patientDetails = { patientName: 'QA Patient', phone: '9000000002', age: '40', gender: 'FEMALE' };
  const ok = await req('/invoices', { method: 'POST', headers: auth(pharmacist), body: JSON.stringify(common) });
  assert(ok.status === 201, `Expected valid Schedule H sale, got HTTP ${ok.status}`);
});

await test('TC-E2E-003', 'Schedule X manager authorization', async () => {
  const p = await getProduct(pharmacist, 'Alprazolam');
  const item = itemFromProduct(p);
  const payload = {
    billingSession: {
      items: [item],
      doctorDetails: { doctorName: 'Dr QA', regNo: 'QA-REG-X' },
      patientDetails: { patientName: 'QA Controlled Drug Patient', phone: '9000000003', age: '35', gender: 'MALE' },
      scheduleXVerified: false,
      pharmacistSignatureAcknowledged: true,
    },
    payment: { method: 'CASH', cashAmount: item.lineTotal, upiAmount: 0, cardAmount: 0, totalPaid: item.lineTotal, changeDue: 0, paymentStatus: 'SUCCESS' },
    subtotal: item.taxableAmount, totalDiscount: 0, totalCGST: item.cgstAmount, totalSGST: item.sgstAmount, grandTotal: item.lineTotal,
    invoiceType: 'REGULAR',
  };
  const noPin = await req('/invoices', { method: 'POST', headers: auth(pharmacist), body: JSON.stringify(payload) });
  assert(noPin.status === 403, `Expected Schedule X sale without PIN to be rejected, got HTTP ${noPin.status}`);
  const badPin = await req('/invoices', { method: 'POST', headers: auth(pharmacist), body: JSON.stringify({ ...payload, managerPin: '0000' }) });
  assert(badPin.status === 403, `Expected invalid manager PIN to be rejected, got HTTP ${badPin.status}`);
  const good = await req('/invoices', { method: 'POST', headers: auth(pharmacist), body: JSON.stringify({ ...payload, managerPin: qaRuntime.managerPin }) });
  assert(good.status === 201, `Expected valid manager PIN to permit sale, got HTTP ${good.status}`);
});

await test('TC-E2E-004', 'GRN to inventory to sale to return', async () => {
  const p = await getProduct(manager, 'Dolo 650');
  const supplier = (await req('/suppliers?search=QA%20Pharma%20Supplier', { headers: auth(manager) })).body?.data?.[0];
  assert(supplier?._id, 'QA supplier not found');
  const batch = 'QA-GRN-001';
  const grn = await req('/grn', {
    method: 'POST',
    headers: auth(manager),
    body: JSON.stringify({
      supplierName: supplier.name, supplierId: supplier._id, supplierInvoiceNo: 'QA-SUP-INV-001',
      receivedDate: new Date().toISOString(),
      items: [{ productId: p._id, productName: p.name, batchNumber: batch, expiryDate: '2028-12-31', quantity: 5, purchaseRate: 20, mrp: p.unitMRP, sellingPrice: p.sellingPrice, gstRate: p.gstRate, totalAmount: 100 }],
      totalAmount: 100,
    }),
  });
  assert(grn.status === 201, `GRN failed HTTP ${grn.status}`);
  const refreshed = await getProduct(manager, 'Dolo 650');
  const b = refreshed.batches.find(x => x.batchNumber === batch);
  assert(b?.stockQuantity === 5, 'GRN batch stock was not added');
  const item = itemFromProduct({ ...refreshed, batches: [b] });
  const sale = await req('/invoices', {
    method: 'POST', headers: auth(manager),
    body: JSON.stringify({
      billingSession: { items: [item], doctorDetails: { doctorName: '', regNo: '' }, patientDetails: { patientName: 'QA Return Patient', phone: '9000000004', age: '30', gender: 'MALE' }, scheduleXVerified: false, pharmacistSignatureAcknowledged: true },
      payment: { method: 'CASH', cashAmount: item.lineTotal, upiAmount: 0, cardAmount: 0, totalPaid: item.lineTotal, changeDue: 0, paymentStatus: 'SUCCESS' },
      subtotal: item.taxableAmount, totalDiscount: 0, totalCGST: item.cgstAmount, totalSGST: item.sgstAmount, grandTotal: item.lineTotal, invoiceType: 'REGULAR',
    }),
  });
  assert(sale.status === 201, `Sale after GRN failed HTTP ${sale.status}`);
  const invoiceNo = sale.body.data.invoiceNumber;
  const ret = await req('/returns', {
    method: 'POST', headers: auth(manager),
    body: JSON.stringify({
      originalInvoiceNo: invoiceNo, patientName: 'QA Return Patient', returnDate: new Date().toISOString(),
      items: [{ productId: refreshed._id, productName: refreshed.name, batchNumber: batch, quantityReturned: 1, unitPrice: refreshed.sellingPrice, refundAmount: refreshed.sellingPrice, reason: 'CUSTOMER_CANCELLED', restocked: true }],
      totalRefundAmount: refreshed.sellingPrice, refundMethod: 'CASH',
    }),
  });
  assert(ret.status === 201 && ret.body?.data?.creditNoteNo, `Return failed HTTP ${ret.status}`);
});

await test('TC-E2E-005', 'Delivery to invoice to reporting and security', async () => {
  const p = await getProduct(manager, 'Dolo 650');
  const order = await req('/delivery-orders', {
    method: 'POST', headers: auth(pharmacist),
    body: JSON.stringify({
      customerName: 'QA Delivery Customer', customerPhone: '9000000005',
      deliveryMode: 'HOME_DELIVERY', deliveryAddress: 'QA Test Address',
      items: [{ productId: p._id, productName: p.name, quantity: 1, unitPrice: p.sellingPrice, lineTotal: p.sellingPrice }],
      totalAmount: p.sellingPrice, deliveryType: 'STANDARD', prescriptionRequired: false,
    }),
  });
  assert(order.status === 201 && order.body?.data?._id, `Delivery creation failed HTTP ${order.status}`);
  const orderId = order.body.data._id;
  const verified = await req('/delivery-orders/' + orderId + '/prescription', { method: 'PUT', headers: auth(pharmacist), body: JSON.stringify({ prescriptionVerified: true }) });
  assert(verified.status === 200 && verified.body.data.prescriptionVerified === true, 'Prescription verification endpoint failed');
  const confirmed = await req('/delivery-orders/' + orderId + '/status', { method: 'PUT', headers: auth(pharmacist), body: JSON.stringify({ status: 'CONFIRMED' }) });
  assert(confirmed.status === 200 && confirmed.body.data.status === 'CONFIRMED', 'Delivery confirmation failed');
  const delivered = await req('/delivery-orders/' + orderId + '/status', { method: 'PUT', headers: auth(pharmacist), body: JSON.stringify({ status: 'DELIVERED' }) });
  assert(delivered.status === 200 && delivered.body.data.status === 'DELIVERED', 'Delivery completion failed');

  const report = await req('/reports/dashboard-stats', { headers: auth(pharmacist) });
  assert(report.status === 200 && report.body?.success, `Dashboard report failed HTTP ${report.status}`);

  const forbidden = await req('/invoices/export/csv', { headers: auth(pharmacist) });
  assert(forbidden.status === 403, `Expected pharmacist export to be forbidden, got HTTP ${forbidden.status}`);
});

console.log(JSON.stringify({ results }, null, 2));
if (results.some(r => r.status === 'FAIL')) process.exit(1);
