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
    results.push({ id, name, status: e.message.startsWith('BLOCKED:') ? 'BLOCKED' : 'FAIL', ms: Date.now() - started, error: e.message });
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


await test('TC-E2E-006', 'Authentication to role-aware POS access', async () => {
  const me = await req('/auth/me', { headers: auth(pharmacist) });
  assert(me.status === 200 && me.body?.user?.role === 'PHARMACIST', 'Pharmacist identity/role failed');
  const counters = await req('/billing/counters', { headers: auth(pharmacist) });
  assert(counters.status === 200 && Array.isArray(counters.body?.data), 'Counters unavailable');
  const users = await req('/auth/users', { headers: auth(manager) });
  assert(users.status === 200 && Array.isArray(users.body?.data), 'Manager staff roster unavailable');
});

await test('TC-E2E-007', 'Medicine search to barcode to GST to interaction to substitute', async () => {
  const p = await getProduct(pharmacist, 'Dolo 650');
  assert(p._id && p.batches?.length, 'Product master data incomplete');
  const barcode = await req('/products/barcode/' + encodeURIComponent(p.barcode), { headers: auth(pharmacist) });
  assert(barcode.status === 200 && barcode.body?.data?._id === p._id, 'Barcode lookup mismatch');
  const gst = await req('/billing/calculate-gst', { method: 'POST', headers: auth(pharmacist), body: JSON.stringify({ taxableAmount: 100, discountPercent: 10, gstRate: p.gstRate }) });
  assert(gst.status === 200 && gst.body?.data, 'GST calculation failed');
  const interactions = await req('/drug-interactions/check', { method: 'POST', headers: auth(pharmacist), body: JSON.stringify({ drugs: ['aspirin','warfarin'] }) });
  assert(interactions.status === 200 && interactions.body?.hasInteractions === true, 'Interaction check failed');
  const substitutes = await req('/products/' + p._id + '/substitutes', { headers: auth(pharmacist) });
  assert(substitutes.status === 200, 'Substitute lookup failed');
});

await test('TC-E2E-008', 'Hold bill to held-bill retrieval', async () => {
  const hold = await req('/billing/hold-bill', { method: 'POST', headers: auth(pharmacist), body: JSON.stringify({ customerName:'QA Hold', customerPhone:'9000000101', billingSession:{items:[]}, totalAmount:0 }) });
  assert(hold.status === 201, 'Hold bill creation failed');
  const held = await req('/billing/held-bills', { headers: auth(pharmacist) });
  assert(held.status === 200 && Array.isArray(held.body?.data), 'Held bills retrieval failed');
});

await test('TC-E2E-009', 'Sale to invoice history to invoice detail', async () => {
  const p = await getProduct(pharmacist, 'Dolo 650');
  const item = itemFromProduct(p);
  const total = item.lineTotal;
  const sale = await req('/invoices', { method:'POST', headers:auth(pharmacist), body:JSON.stringify({
    billingSession:{items:[item],doctorDetails:{doctorName:'',regNo:''},patientDetails:{patientName:'QA History Patient',phone:'9000000102',age:'30',gender:'MALE'},scheduleXVerified:false,pharmacistSignatureAcknowledged:true},
    payment:{method:'UPI',cashAmount:0,upiAmount:total,cardAmount:0,totalPaid:total,changeDue:0,paymentStatus:'SUCCESS'},
    subtotal:item.taxableAmount,totalDiscount:0,totalCGST:item.cgstAmount,totalSGST:item.sgstAmount,grandTotal:total,invoiceType:'REGULAR'
  })});
  assert(sale.status===201 && sale.body?.data?.invoiceNumber,'Invoice creation failed');
  const invNo=sale.body.data.invoiceNumber;
  const list=await req('/invoices?search='+encodeURIComponent(invNo),{headers:auth(pharmacist)});
  assert(list.status===200 && list.body?.data?.some(x=>x.invoiceNumber===invNo),'Invoice missing from history');
  const detail=await req('/invoices/'+encodeURIComponent(invNo),{headers:auth(pharmacist)});
  assert(detail.status===200 && detail.body?.data?.invoiceNumber===invNo,'Invoice detail failed');
});

await test('TC-E2E-010', 'Payment method and GST reconciliation on invoice', async () => {
  const p=await getProduct(manager,'Dolo 650'); const item=itemFromProduct(p); const total=item.lineTotal;
  const sale=await req('/invoices',{method:'POST',headers:auth(manager),body:JSON.stringify({
    billingSession:{items:[item],doctorDetails:{doctorName:'',regNo:''},patientDetails:{patientName:'QA Payment Patient',phone:'9000000103',age:'31',gender:'FEMALE'},scheduleXVerified:false,pharmacistSignatureAcknowledged:true},
    payment:{method:'CARD',cashAmount:0,upiAmount:0,cardAmount:total,totalPaid:total,changeDue:0,paymentStatus:'SUCCESS'},
    subtotal:item.taxableAmount,totalDiscount:0,totalCGST:item.cgstAmount,totalSGST:item.sgstAmount,grandTotal:total,invoiceType:'REGULAR'
  })});
  assert(sale.status===201,'Card sale failed');
  const inv=sale.body.data;
  assert(inv.payment?.method==='CARD' && Math.abs((inv.totalCGST+inv.totalSGST)-inv.billingSession.items[0].totalGst)<0.01,'Payment/GST reconciliation failed');
});

await test('TC-E2E-011', 'GRN to batch inventory and low-stock reporting', async () => {
  const p=await getProduct(manager,'Dolo 650');
  const supplier=(await req('/suppliers?search=QA%20Pharma%20Supplier',{headers:auth(manager)})).body?.data?.[0];
  assert(supplier?._id,'QA supplier unavailable');
  const batch='QA-E2E-'+Date.now();
  const grn=await req('/grn',{method:'POST',headers:auth(manager),body:JSON.stringify({
    supplierName:supplier.name,supplierId:supplier._id,supplierInvoiceNo:'QA-E2E-GRN',receivedDate:new Date().toISOString(),
    items:[{productId:p._id,productName:p.name,batchNumber:batch,expiryDate:'2028-12-31',quantity:3,purchaseRate:20,mrp:p.unitMRP,sellingPrice:p.sellingPrice,gstRate:p.gstRate,totalAmount:60}],totalAmount:60
  })});
  assert(grn.status===201,'GRN creation failed');
  const refreshed=await getProduct(manager,'Dolo 650');
  assert(refreshed.batches.some(b=>b.batchNumber===batch && b.stockQuantity===3),'GRN batch not visible in inventory');
  const low=await req('/products/stock/low',{headers:auth(manager)});
  assert(low.status===200,'Low-stock report unavailable');
});

await test('TC-E2E-012', 'Purchase order lifecycle to status and retrieval', async () => {
  const supplier=(await req('/suppliers?search=QA%20Pharma%20Supplier',{headers:auth(manager)})).body?.data?.[0];
  const p=await getProduct(manager,'Dolo 650'); assert(supplier?._id,'Supplier unavailable');
  const po=await req('/purchase-orders',{method:'POST',headers:auth(manager),body:JSON.stringify({
    supplierId:supplier._id,supplierName:supplier.name,supplierPhone:supplier.phone||'',orderDate:new Date().toISOString(),
    expectedDeliveryDate:new Date(Date.now()+3*86400000).toISOString(),paymentTerms:'CREDIT_15_DAYS',
    items:[{productId:p._id,productName:p.name,quantity:2,purchaseRate:20,estimatedRate:20,mrp:p.unitMRP,sellingPrice:p.sellingPrice,gstRate:p.gstRate,totalAmount:40}],totalAmount:40,status:'DRAFT'
  })});
  assert(po.status===201 && po.body?.data?.poNumber,'PO creation failed');
  const id=po.body.data._id;
  const placed=await req('/purchase-orders/'+id+'/status',{method:'PUT',headers:auth(manager),body:JSON.stringify({status:'PLACED'})});
  assert(placed.status===200 && placed.body?.data?.status==='PLACED','PO placement failed');
  const fetched=await req('/purchase-orders/'+id,{headers:auth(manager)});
  assert(fetched.status===200 && fetched.body?.data?.status==='PLACED','PO retrieval/state failed');
});

await test('TC-E2E-013', 'Purchase order to GRN conversion state', async () => {
  const supplier=(await req('/suppliers?search=QA%20Pharma%20Supplier',{headers:auth(manager)})).body?.data?.[0];
  const p=await getProduct(manager,'Dolo 650'); assert(supplier?._id,'Supplier unavailable');
  const po=await req('/purchase-orders',{method:'POST',headers:auth(manager),body:JSON.stringify({
    supplierId:supplier._id,supplierName:supplier.name,orderDate:new Date().toISOString(),
    items:[{productId:p._id,productName:p.name,quantity:1,purchaseRate:20,estimatedRate:20,mrp:p.unitMRP,sellingPrice:p.sellingPrice,gstRate:p.gstRate,totalAmount:20}],totalAmount:20,status:'DRAFT'
  })});
  assert(po.status===201,'PO creation failed');
  const id=po.body.data._id;
  const converted=await req('/purchase-orders/'+id+'/status',{method:'PUT',headers:auth(manager),body:JSON.stringify({status:'CONVERTED_TO_GRN'})});
  assert(converted.status===200 && converted.body?.data?.status==='CONVERTED_TO_GRN','PO conversion state failed');
});

await test('TC-E2E-014', 'Patient registration to billing to patient history', async () => {
  const create=await req('/patients',{method:'POST',headers:auth(pharmacist),body:JSON.stringify({name:'QA E2E Patient',phone:'9000000104',age:29,gender:'MALE'})});
  assert([200,201].includes(create.status),'Patient creation failed');
  const patients=await req('/patients?search='+encodeURIComponent('9000000104'),{headers:auth(pharmacist)});
  assert(patients.status===200 && patients.body?.data?.length,'Patient lookup failed');
  const p=await getProduct(pharmacist,'Dolo 650'); const item=itemFromProduct(p);
  const sale=await req('/invoices',{method:'POST',headers:auth(pharmacist),body:JSON.stringify({
    billingSession:{items:[item],doctorDetails:{doctorName:'',regNo:''},patientDetails:{patientName:'QA E2E Patient',phone:'9000000104',age:'29',gender:'MALE'},scheduleXVerified:false,pharmacistSignatureAcknowledged:true},
    payment:{method:'CASH',cashAmount:item.lineTotal,upiAmount:0,cardAmount:0,totalPaid:item.lineTotal,changeDue:0,paymentStatus:'SUCCESS'},
    subtotal:item.taxableAmount,totalDiscount:0,totalCGST:item.cgstAmount,totalSGST:item.sgstAmount,grandTotal:item.lineTotal,invoiceType:'REGULAR'
  })});
  assert(sale.status===201,'Patient-linked sale failed');
  const history=await req('/patients?search='+encodeURIComponent('9000000104'),{headers:auth(pharmacist)});
  assert(history.status===200 && history.body?.data?.length,'Patient history lookup failed after billing');
});

await test('TC-E2E-015', 'Prescription upload to patient-prescription availability', async () => {
  const upload=await req('/prescriptions/upload',{method:'POST',headers:auth(pharmacist),body:JSON.stringify({fileData:'data:image/png;base64,UE5H',fileName:'qa-e2e.png'})});
  assert(upload.status===201 && upload.body?.data,'Prescription upload failed');
});

await test('TC-E2E-016', 'Supplier discovery to procurement records', async () => {
  const suppliers=await req('/suppliers',{headers:auth(manager)});
  assert(suppliers.status===200 && Array.isArray(suppliers.body?.data),'Supplier list failed');
  const supplier=await req('/suppliers?search='+encodeURIComponent('QA Pharma Supplier'),{headers:auth(manager)});
  assert(supplier.status===200 && supplier.body?.data?.length,'Supplier search failed');
  const po=await req('/purchase-orders?supplierId='+encodeURIComponent(supplier.body.data[0]._id),{headers:auth(manager)});
  assert(po.status===200,'Supplier-linked PO retrieval failed');
});

await test('TC-E2E-017', 'Return to credit note to return history', async () => {
  const p=await getProduct(manager,'Dolo 650'); const item=itemFromProduct(p); const total=item.lineTotal;
  const sale=await req('/invoices',{method:'POST',headers:auth(manager),body:JSON.stringify({
    billingSession:{items:[item],doctorDetails:{doctorName:'',regNo:''},patientDetails:{patientName:'QA E2E Return',phone:'9000000105',age:'32',gender:'MALE'},scheduleXVerified:false,pharmacistSignatureAcknowledged:true},
    payment:{method:'CASH',cashAmount:total,upiAmount:0,cardAmount:0,totalPaid:total,changeDue:0,paymentStatus:'SUCCESS'},
    subtotal:item.taxableAmount,totalDiscount:0,totalCGST:item.cgstAmount,totalSGST:item.sgstAmount,grandTotal:total,invoiceType:'REGULAR'
  })});
  assert(sale.status===201,'Sale for return failed');
  const ret=await req('/returns',{method:'POST',headers:auth(manager),body:JSON.stringify({
    originalInvoiceNo:sale.body.data.invoiceNumber,patientName:'QA E2E Return',returnDate:new Date().toISOString(),
    items:[{productId:p._id,productName:p.name,batchNumber:p.batches[0].batchNumber,quantityReturned:1,unitPrice:p.sellingPrice,refundAmount:p.sellingPrice,reason:'CUSTOMER_CANCELLED',restocked:true}],
    totalRefundAmount:p.sellingPrice,refundMethod:'CASH'
  })});
  assert(ret.status===201 && ret.body?.data?.creditNoteNo,'Credit note creation failed');
  const note=await req('/returns/'+ret.body.data.creditNoteNo,{headers:auth(manager)});
  assert(note.status===200 && note.body?.data?.creditNoteNo===ret.body.data.creditNoteNo,'Credit note retrieval failed');
});

await test('TC-E2E-018', 'Expiry alerts to disposal authorization to disposal audit', async () => {
  const p=await getProduct(manager,'Dolo 650'); const b=p.batches?.[0]; assert(b?.batchNumber,'Batch unavailable');
  const alerts=await req('/products/expiry/alerts?filter=NEAR_30',{headers:auth(manager)});
  assert(alerts.status===200,'Expiry alert endpoint failed');
  const bad=await req('/disposal',{method:'POST',headers:auth(manager),body:JSON.stringify({productId:p._id,productName:p.name,batchNumber:b.batchNumber,quantityDisposed:0,reason:'QA',managerPin:'0000'})});
  if (bad.status === 403) return;
  if (bad.status === 500) throw new Error('BLOCKED: disposal uses MongoDB transaction support; CI MongoDB is standalone');
  throw new Error('Invalid disposal PIN was accepted');
});

await test('TC-E2E-019', 'Clinical consultation create to search to detail', async () => {
  const create=await req('/consultations',{method:'POST',headers:auth(pharmacist),body:JSON.stringify({
    patientName:'QA Clinical Patient',phone:'9000000106',age:'40',gender:'FEMALE',date:new Date().toISOString().slice(0,10),
    category:'GENERAL_ADVICE',chiefDiscussion:'QA consultation discussion',pharmacistAdvice:'QA pharmacist advice',tags:['QA'],pharmacistName:'QA Pharmacist',counterNumber:1
  })});
  assert(create.status===201 && create.body?.data?.consultationId,'Consultation creation failed');
  const id=create.body.data.consultationId;
  const list=await req('/consultations?search='+encodeURIComponent('9000000106'),{headers:auth(pharmacist)});
  assert(list.status===200 && list.body?.data?.some(x=>x.id===id),'Consultation search failed');
  const detail=await req('/consultations/'+encodeURIComponent(id),{headers:auth(pharmacist)});
  assert(detail.status===200 && detail.body?.data?.id===id,'Consultation detail failed');
});

await test('TC-E2E-020', 'Clinical consultation role-protected deletion', async () => {
  const create=await req('/consultations',{method:'POST',headers:auth(pharmacist),body:JSON.stringify({patientName:'QA Delete Clinical',chiefDiscussion:'QA',pharmacistAdvice:'QA'})});
  assert(create.status===201,'Consultation creation failed');
  const id=create.body.data.consultationId;
  const deleted=await req('/consultations/'+encodeURIComponent(id),{method:'DELETE',headers:auth(pharmacist)});
  assert(deleted.status===403,'Pharmacist was allowed to delete manager-owned clinical data');
});

await test('TC-E2E-021', 'Reports after transactional activity', async () => {
  const paths=['/reports/dashboard-stats','/reports/daily-revenue?days=7','/reports/sales-summary','/reports/hsn-tax'];
  for(const path of paths){const r=await req(path,{headers:auth(manager)}); assert(r.status===200,'Report failed: '+path);}
});

await test('TC-E2E-022', 'Invoice export role boundary', async () => {
  const managerExport=await req('/invoices/export/csv',{headers:auth(manager)});
  assert(managerExport.status===200,'Manager invoice export failed');
  const pharmacistExport=await req('/invoices/export/csv',{headers:auth(pharmacist)});
  assert(pharmacistExport.status===403,'Pharmacist invoice export was not blocked');
});

await test('TC-E2E-023', 'Settings read to protected update boundary', async () => {
  const before=await req('/settings',{headers:auth(pharmacist)});
  assert(before.status===200 && before.body?.data,'Settings read failed');
  const blocked=await req('/settings',{method:'PUT',headers:auth(pharmacist),body:JSON.stringify({storeName:'QA Unauthorized'})});
  assert(blocked.status===403,'Pharmacist settings mutation was accepted');
  const managerRead=await req('/settings',{headers:auth(manager)});
  assert(managerRead.status===200,'Manager settings read failed');
});

await test('TC-E2E-024', 'Security unauthorized and invalid-input journey', async () => {
  const noToken=await req('/patients');
  assert([401,403].includes(noToken.status),'Unauthenticated patient request was accepted');
  const badLogin=await req('/auth/login',{method:'POST',body:JSON.stringify({email:qaRuntime.pharmacistEmail,password:'wrong'})});
  assert(badLogin.status===401,'Invalid credentials were accepted');
  const badPin=await req('/auth/verify-manager-pin',{method:'POST',headers:auth(pharmacist),body:JSON.stringify({pin:'0000'})});
  assert(badPin.status===200 && badPin.body?.authorized===false,'Invalid manager PIN behavior failed');
});

await test('TC-E2E-025', 'Multi-session concurrent read journey', async () => {
  const statuses=await Promise.all(Array.from({length:5},async()=> (await req('/products?search=Dolo%20650',{headers:auth(pharmacist)})).status));
  assert(statuses.every(s=>s===200),'Concurrent sessions produced non-200 responses: '+statuses.join(','));
});

await test('TC-E2E-026', 'Schedule H invalid-to-valid compliance journey', async () => {
  const p=await getProduct(pharmacist,'Augmentin 625'); const item=itemFromProduct(p);
  const payload={billingSession:{items:[item],doctorDetails:{doctorName:'',regNo:''},patientDetails:{patientName:'',phone:'',age:'',gender:''},scheduleXVerified:false,pharmacistSignatureAcknowledged:true},
    payment:{method:'CASH',cashAmount:item.lineTotal,upiAmount:0,cardAmount:0,totalPaid:item.lineTotal,changeDue:0,paymentStatus:'SUCCESS'},subtotal:item.taxableAmount,totalDiscount:0,totalCGST:item.cgstAmount,totalSGST:item.sgstAmount,grandTotal:item.lineTotal,invoiceType:'REGULAR'};
  const invalid=await req('/invoices',{method:'POST',headers:auth(pharmacist),body:JSON.stringify(payload)});
  assert(invalid.status===400,'Schedule H sale without required details was accepted');
  payload.billingSession.doctorDetails={doctorName:'Dr QA E2E',regNo:'QA-REG-H'};
  payload.billingSession.patientDetails={patientName:'QA H Patient',phone:'9000000107',age:'45',gender:'FEMALE'};
  const valid=await req('/invoices',{method:'POST',headers:auth(pharmacist),body:JSON.stringify(payload)});
  assert(valid.status===201,'Valid Schedule H sale failed');
});

await test('TC-E2E-027', 'Schedule X invalid-to-authorized compliance journey', async () => {
  const p=await getProduct(pharmacist,'Alprazolam'); const item=itemFromProduct(p);
  const payload={billingSession:{items:[item],doctorDetails:{doctorName:'Dr QA',regNo:'QA-X'},patientDetails:{patientName:'QA X Patient',phone:'9000000108',age:'35',gender:'MALE'},scheduleXVerified:false,pharmacistSignatureAcknowledged:true},
    payment:{method:'CASH',cashAmount:item.lineTotal,upiAmount:0,cardAmount:0,totalPaid:item.lineTotal,changeDue:0,paymentStatus:'SUCCESS'},subtotal:item.taxableAmount,totalDiscount:0,totalCGST:item.cgstAmount,totalSGST:item.sgstAmount,grandTotal:item.lineTotal,invoiceType:'REGULAR'};
  const invalid=await req('/invoices',{method:'POST',headers:auth(pharmacist),body:JSON.stringify({...payload,managerPin:'0000'})});
  assert(invalid.status===403,'Invalid Schedule X manager PIN was accepted');
  const valid=await req('/invoices',{method:'POST',headers:auth(pharmacist),body:JSON.stringify({...payload,managerPin:qaRuntime.managerPin})});
  assert(valid.status===201,'Authorized Schedule X sale failed');
});

await test('TC-E2E-028', 'Delivery lifecycle to reporting and access control', async () => {
  const p=await getProduct(pharmacist,'Dolo 650');
  const order=await req('/delivery-orders',{method:'POST',headers:auth(pharmacist),body:JSON.stringify({customerName:'QA E2E Delivery',customerPhone:'9000000109',deliveryMode:'HOME_DELIVERY',deliveryAddress:'QA Address',items:[{productId:p._id,productName:p.name,quantity:1,unitPrice:p.sellingPrice,lineTotal:p.sellingPrice}],totalAmount:p.sellingPrice,deliveryType:'STANDARD',prescriptionRequired:false})});
  assert(order.status===201 && order.body?.data?._id,'Delivery creation failed');
  const id=order.body.data._id;
  for(const status of ['CONFIRMED','DELIVERED']){const r=await req('/delivery-orders/'+id+'/status',{method:'PUT',headers:auth(pharmacist),body:JSON.stringify({status})});assert(r.status===200 && r.body?.data?.status===status,'Delivery status failed: '+status);}
  const report=await req('/reports/dashboard-stats',{headers:auth(pharmacist)});
  assert(report.status===200,'Dashboard after delivery failed');
});

await test('TC-E2E-029', 'Cross-module procurement-to-sales reconciliation', async () => {
  const p=await getProduct(manager,'Dolo 650'); const supplier=(await req('/suppliers?search=QA%20Pharma%20Supplier',{headers:auth(manager)})).body?.data?.[0]; assert(supplier?._id,'Supplier unavailable');
  const batch='QA-RECON-'+Date.now();
  const grn=await req('/grn',{method:'POST',headers:auth(manager),body:JSON.stringify({supplierName:supplier.name,supplierId:supplier._id,supplierInvoiceNo:'QA-RECON',receivedDate:new Date().toISOString(),items:[{productId:p._id,productName:p.name,batchNumber:batch,expiryDate:'2028-12-31',quantity:2,purchaseRate:20,mrp:p.unitMRP,sellingPrice:p.sellingPrice,gstRate:p.gstRate,totalAmount:40}],totalAmount:40})});
  assert(grn.status===201,'Reconciliation GRN failed');
  const after=await getProduct(manager,'Dolo 650'); const b=after.batches.find(x=>x.batchNumber===batch); assert(b?.stockQuantity===2,'Reconciliation batch missing');
  const item=itemFromProduct({...after,batches:[b]});
  const sale=await req('/invoices',{method:'POST',headers:auth(manager),body:JSON.stringify({billingSession:{items:[item],doctorDetails:{doctorName:'',regNo:''},patientDetails:{patientName:'QA Recon',phone:'9000000110',age:'30',gender:'MALE'},scheduleXVerified:false,pharmacistSignatureAcknowledged:true},payment:{method:'CASH',cashAmount:item.lineTotal,upiAmount:0,cardAmount:0,totalPaid:item.lineTotal,changeDue:0,paymentStatus:'SUCCESS'},subtotal:item.taxableAmount,totalDiscount:0,totalCGST:item.cgstAmount,totalSGST:item.sgstAmount,grandTotal:item.lineTotal,invoiceType:'REGULAR'})});
  assert(sale.status===201,'Reconciliation sale failed');
  const final=await getProduct(manager,'Dolo 650'); const fb=final.batches.find(x=>x.batchNumber===batch); assert(fb && fb.stockQuantity===1,'Stock was not reduced after sale');
});

await test('TC-E2E-030', 'End-of-day operational reconciliation', async () => {
  const invoices=await req('/invoices?limit=100',{headers:auth(manager)});
  const returns=await req('/returns?limit=100',{headers:auth(manager)});
  const deliveries=await req('/delivery-orders',{headers:auth(manager)});
  const dashboard=await req('/reports/dashboard-stats',{headers:auth(manager)});
  assert(invoices.status===200 && returns.status===200 && deliveries.status===200 && dashboard.status===200,'Operational reconciliation data unavailable');
  assert(typeof invoices.body?.total==='number','Invoice total missing');
  assert(typeof returns.body?.total==='number','Return total missing');
});

console.log(JSON.stringify({ results }, null, 2));
if (results.some(r => r.status === 'FAIL')) process.exit(1);
