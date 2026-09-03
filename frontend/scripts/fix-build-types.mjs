import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const posPath = path.join(root, 'src/store/posSlice.ts');
let pos = fs.readFileSync(posPath, 'utf8');

const replace = (from, to) => {
  if (!pos.includes(from)) console.warn(`build patch: pattern not found: ${from.slice(0, 100)}`);
  pos = pos.replace(from, to);
};

replace("loginUser: (state, action: PayloadAction<{ email: string; password?: string; pharmacistName?: string; pharmacyName?: string; licenseNo?: string }>) => {", "loginUser: (state, action: PayloadAction<{ email: string; password?: string; pharmacistName?: string; pharmacyName?: string; licenseNo?: string; role?: string }>) => {");
replace("email: email || 'user@genquantaa.com',\n        isLoggedIn: true", "email: email || 'user@genquantaa.com',\n        role: action.payload.role,\n        isLoggedIn: true");
replace("const sortedBatches = getSortedBatchesFEFO(product.batches || []);", "const sortedBatches = [...(product.batches || [])].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());");
replace("bill.paidAmount += amount;\n          bill.pendingAmount = Math.max(0, bill.totalAmount - bill.paidAmount);", "bill.paidAmount = Number(bill.paidAmount ?? 0) + amount;\n          bill.pendingAmount = Math.max(0, Number(bill.totalAmount ?? 0) - Number(bill.paidAmount ?? 0));");
replace("if (newBill.billType === 'CREDIT' && newBill.pendingAmount > 0) {", "if (newBill.billType === 'CREDIT' && Number(newBill.pendingAmount ?? 0) > 0) {");
replace("supplier.pendingBalance += newBill.pendingAmount;", "supplier.pendingBalance += Number(newBill.pendingAmount ?? 0);");
replace("patientDetails: {\n            patientName: order.customerName,\n            phone: order.customerPhone,\n            gender: 'MALE'\n          },", "patientDetails: {\n            patientName: order.customerName,\n            phone: order.customerPhone,\n            age: '',\n            gender: 'MALE'\n          },");
replace("payment: {\n          mode: (action.payload.paymentMode || 'UPI') as any,\n          receivedAmount: grandTotal,\n          changeDue: 0,\n          digitalTransactionRef: order.orderNumber,\n          splitAmounts: { cash: 0, card: 0, upi: grandTotal }\n        },", "payment: {\n          method: ((action.payload.paymentMode || 'UPI') as any),\n          mode: action.payload.paymentMode || 'UPI',\n          receivedAmount: grandTotal,\n          cashAmount: 0,\n          upiAmount: grandTotal,\n          cardAmount: 0,\n          totalPaid: grandTotal,\n          changeDue: 0,\n          digitalTransactionRef: order.orderNumber,\n          splitAmounts: { cash: 0, card: 0, upi: grandTotal },\n          paymentStatus: 'SUCCESS'\n        },");

const reducerAnchor = "    setHeldBillsModalOpen: (state, action: PayloadAction<boolean>) => {\n      state.heldBillsModal.isOpen = action.payload;\n    },";
if (!pos.includes("setHeldBills: (state")) pos = pos.replace(reducerAnchor, reducerAnchor + "\n    setHeldBills: (state, action: PayloadAction<HeldBill[]>) => {\n      state.heldBills = action.payload;\n    },");

const tabAnchor = "    clearActiveCart: (state) => {\n      const currentSession = state.sessions.find(s => s.id === state.activeSessionId);\n      if (currentSession) {\n        currentSession.items = [];\n      }\n    },";
if (!pos.includes("clearActiveSession: (state")) pos = pos.replace(tabAnchor, tabAnchor + "\n\n    clearActiveSession: (state) => {\n      const currentSession = state.sessions.find(s => s.id === state.activeSessionId);\n      if (currentSession) {\n        currentSession.items = [];\n        currentSession.doctorDetails = { doctorName: '', regNo: '' };\n        currentSession.patientDetails = { patientName: '', phone: '', age: '', gender: 'MALE' };\n        currentSession.uploadedPrescriptionUrl = undefined;\n        currentSession.uploadedPrescriptionName = undefined;\n      }\n    },");

const submitAnchor = "    startSubmittingBill: (state) => {\n      state.isSubmittingBill = true;\n    },";
if (!pos.includes("stopSubmittingBill: (state")) pos = pos.replace(submitAnchor, submitAnchor + "\n    stopSubmittingBill: (state) => {\n      state.isSubmittingBill = false;\n    },");

if (!pos.includes("  setHeldBills,\n")) pos = pos.replace("  setHeldBillsModalOpen,\n", "  setHeldBillsModalOpen,\n  setHeldBills,\n");
if (!pos.includes("  clearActiveSession,\n")) pos = pos.replace("  clearActiveCart,\n", "  clearActiveCart,\n  clearActiveSession,\n");
if (!pos.includes("  stopSubmittingBill,\n")) pos = pos.replace("  startSubmittingBill,\n", "  startSubmittingBill,\n  stopSubmittingBill,\n");
fs.writeFileSync(posPath, pos);

const productPath = path.join(root, 'src/components/ProductSearch.tsx');
let product = fs.readFileSync(productPath, 'utf8');
const countAnchor = "  const tabCounts: Record<FilterTab, number> = {\n    ALL:          products.length,\n";
if (product.includes(countAnchor) && !product.includes("PREVIOUSLY_ORDERED: previouslyOrderedProdIds.size")) product = product.replace(countAnchor, "  const tabCounts: Record<FilterTab, number> = {\n    ALL:          products.length,\n    PREVIOUSLY_ORDERED: previouslyOrderedProdIds.size,\n");
fs.writeFileSync(productPath, product);
console.log('Applied TypeScript build compatibility fixes.');
