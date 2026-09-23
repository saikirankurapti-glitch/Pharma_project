import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import crypto from 'crypto';
import fs from 'fs';
import { connectDB } from '../src/config/db';
import { User } from '../src/models/User';
import { StoreSettings } from '../src/models/StoreSettings';
import { Supplier } from '../src/models/Supplier';

const runtime = {
  pharmacistEmail: process.env.QA_PHARMACIST_EMAIL || 'qa.pharmacist@genquantaa.com',
  managerEmail: process.env.QA_MANAGER_EMAIL || 'qa.manager@genquantaa.com',
  password: process.env.QA_PASSWORD || crypto.randomBytes(16).toString('hex'),
  managerPin: process.env.QA_MANAGER_PIN || crypto.randomBytes(4).toString('hex'),
  ownerPin: process.env.QA_OWNER_PIN || crypto.randomBytes(4).toString('hex')
};

async function main() {
  await connectDB();

  const { pharmacistEmail, managerEmail, password, managerPin, ownerPin } = runtime;

  const passwordHash = await bcrypt.hash(password, 10);
  const managerHash = await bcrypt.hash(managerPin, 10);
  const ownerHash = await bcrypt.hash(ownerPin, 10);

  await User.findOneAndUpdate({ email: pharmacistEmail }, {
    pharmacistName: 'QA Pharmacist', pharmacyName: 'GENQUANTAA QA Pharmacy', licenseNo: 'QA-LIC-001',
    email: pharmacistEmail, passwordHash, role: 'PHARMACIST', isActive: true, loginAttempts: 0
  }, { upsert: true, new: true, setDefaultsOnInsert: true });

  await User.findOneAndUpdate({ email: managerEmail }, {
    pharmacistName: 'QA Manager', pharmacyName: 'GENQUANTAA QA Pharmacy', licenseNo: 'QA-LIC-002',
    email: managerEmail, passwordHash, role: 'MANAGER', isActive: true, loginAttempts: 0
  }, { upsert: true, new: true, setDefaultsOnInsert: true });

  await StoreSettings.findOneAndUpdate({}, {
    storeName: 'GENQUANTAA QA Pharmacy', dlNo: 'QA-DL-001', gstin: '29QA1234567F1Z5',
    phone: '9000000000', address: 'QA Test Environment', defaultPrintFormat: 'THERMAL',
    autoPrintReceipt: false, soundEffects: false, autoAddOnScan: true, nearExpiryDaysThreshold: 30,
    defaultTaxType: 'CGST_SGST', managerPin: managerHash, managerName: 'QA Manager',
    managerEmail, ownerName: 'QA Owner', ownerEmail: 'qa.owner@genquantaa.com', ownerPin: ownerHash
  }, { upsert: true, new: true, setDefaultsOnInsert: true });

  await Supplier.findOneAndUpdate({ email: 'qa.supplier@genquantaa.com' }, {
    name: 'QA Pharma Supplier', contactPerson: 'QA Supplier', phone: '9111111111',
    email: 'qa.supplier@genquantaa.com', gstin: '29QASUPPLIER1Z5', dlNumber: 'QA-SUP-001',
    address: 'QA Warehouse', pendingBalance: 0
  }, { upsert: true, new: true, setDefaultsOnInsert: true });

  fs.writeFileSync('/tmp/qa-runtime.json', JSON.stringify(runtime), { mode: 0o600 });
  console.log('QA test data ready');
  await mongoose.disconnect();
}

main().catch(async e => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});
