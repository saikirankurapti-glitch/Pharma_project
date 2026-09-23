import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db';
import { User } from '../src/models/User';
import { StoreSettings } from '../src/models/StoreSettings';
import { Supplier } from '../src/models/Supplier';

async function main() {
  await connectDB();
  const passwordHash = await bcrypt.hash('QaPass@123', 10);
  const managerHash = await bcrypt.hash('1234', 10);
  const ownerHash = await bcrypt.hash('9999', 10);

  await User.findOneAndUpdate({ email: 'qa.pharmacist@genquantaa.com' }, {
    pharmacistName: 'QA Pharmacist', pharmacyName: 'GENQUANTAA QA Pharmacy', licenseNo: 'QA-LIC-001',
    email: 'qa.pharmacist@genquantaa.com', passwordHash, role: 'PHARMACIST', isActive: true, loginAttempts: 0
  }, { upsert: true, new: true, setDefaultsOnInsert: true });

  await User.findOneAndUpdate({ email: 'qa.manager@genquantaa.com' }, {
    pharmacistName: 'QA Manager', pharmacyName: 'GENQUANTAA QA Pharmacy', licenseNo: 'QA-LIC-002',
    email: 'qa.manager@genquantaa.com', passwordHash, role: 'MANAGER', isActive: true, loginAttempts: 0
  }, { upsert: true, new: true, setDefaultsOnInsert: true });

  await StoreSettings.findOneAndUpdate({}, {
    storeName: 'GENQUANTAA QA Pharmacy', dlNo: 'QA-DL-001', gstin: '29QA1234567F1Z5',
    phone: '9000000000', address: 'QA Test Environment', defaultPrintFormat: 'THERMAL',
    autoPrintReceipt: false, soundEffects: false, autoAddOnScan: true, nearExpiryDaysThreshold: 30,
    defaultTaxType: 'CGST_SGST', managerPin: managerHash, managerName: 'QA Manager',
    managerEmail: 'qa.manager@genquantaa.com', ownerName: 'QA Owner', ownerEmail: 'qa.owner@genquantaa.com', ownerPin: ownerHash
  }, { upsert: true, new: true, setDefaultsOnInsert: true });

  await Supplier.findOneAndUpdate({ email: 'qa.supplier@genquantaa.com' }, {
    name: 'QA Pharma Supplier', contactPerson: 'QA Supplier', phone: '9111111111',
    email: 'qa.supplier@genquantaa.com', gstin: '29QASUPPLIER1Z5', dlNumber: 'QA-SUP-001',
    address: 'QA Warehouse', pendingBalance: 0
  }, { upsert: true, new: true, setDefaultsOnInsert: true });

  console.log('QA test data ready');
  await mongoose.disconnect();
}
main().catch(async e => { console.error(e); await mongoose.disconnect(); process.exit(1); });
