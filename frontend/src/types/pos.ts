export type AppView = 'LANDING' | 'AUTH' | 'POS_TERMINAL' | 'DASHBOARD' | 'INVENTORY' | 'INVENTORY_DASHBOARD' | 'PURCHASE_GRN' | 'REPORTS' | 'RETURNS' | 'EXPIRY_MANAGEMENT' | 'PATIENTS' | 'SUPPLIERS' | 'SETTINGS' | 'EMERGENCY_DELIVERY' | 'INVOICES' | 'ONLINE_DELIVERY';
export type AuthMode = 'SIGN_IN' | 'SIGN_UP';

export interface UserAccount {
  pharmacistName: string;
  pharmacyName: string;
  licenseNo: string;
  email: string;
  role?: string;
  isLoggedIn: boolean;
}

export type ScheduleCategory = 'REGULAR' | 'SCHEDULE_H' | 'SCHEDULE_H1' | 'SCHEDULE_X';
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface BatchInfo {
  batchNumber: string;
  expiryDate: string;
  stockQuantity: number;
  location: string;
  mrp: number;
  purchaseRate?: number;
  clearanceDiscountPercent?: number;
  isDumpStock?: boolean;
}

export type MedicineType = 'Oral' | 'Injectable' | 'Topical' | 'Inhalation' | 'Ophthalmic' | 'Nasal' | 'Rectal';

export interface Product {
  _id: string;
  name: string;
  brand: string;
  saltComposition: string;
  barcode: string;
  hsnCode: string;
  gstRate: number;
  unitMRP: number;
  sellingPrice: number;
  grossMarginPercent: number;
  scheduleCategory: ScheduleCategory;
  isNarcotic?: boolean;
  stockStatus: StockStatus;
  totalStock: number;
  batches: BatchInfo[];
  packSize?: string;
  unitsPerPack?: number;
  packType?: string;
  medicineType?: MedicineType;
  dosageForm?: string;
}

export type SellingUnitMode = 'PACK' | 'LOOSE';
export interface CartItem { cartItemId: string; productId: string; product: Product; selectedBatch: BatchInfo; quantity: number; unitMode?: SellingUnitMode; unitPrice: number; discountPercent: number; taxableAmount: number; cgstAmount: number; sgstAmount: number; totalGst: number; lineTotal: number; isSubstitute?: boolean; substitutedFor?: string; }
export interface DoctorDetails { doctorName: string; regNo: string; hospitalName?: string; }
export interface PatientDetails { patientName: string; phone: string; age: string; gender: 'MALE' | 'FEMALE' | 'OTHER'; }
export interface PharmacistCounter { id: string; name: string; role: string; counterNumber: number; colorTheme: string; avatarInitials: string; }
export interface ChronicMedication { id?: string; medicationId?: string; medicineId?: string; productId: string; productName: string; name?: string; medicineName?: string; dosage: string; frequency?: string; frequencyDays: number; duration?: string; quantity: number; lastRefillDate?: string; lastRefilledDate: string; nextRefillDate?: string; isActive?: boolean; conditionCategory: 'HYPERTENSION' | 'DIABETES' | 'CARDIAC' | 'THYROID' | 'GENERAL'; doctorName: string; }
export interface BillingSession { id: string; tabTitle: string; assignedPharmacistId: string; transferredFromPharmacistId?: string; transferredFromName?: string; transferNote?: string; items: CartItem[]; doctorDetails: DoctorDetails; patientDetails: PatientDetails; scheduleXVerified: boolean; scheduleXManagerPin?: string; pharmacistSignatureAcknowledged: boolean; createdAt: string; uploadedPrescriptionUrl?: string; uploadedPrescriptionName?: string; }
export interface HeldBill { id: string; customerName: string; customerPhone: string; heldAt: string; assignedPharmacistId: string; transferredFromPharmacistId?: string; transferredFromName?: string; billingSession: BillingSession; totalAmount: number; }
export interface DrugInteraction { severity: 'MINOR' | 'MAJOR' | 'CONTRAINDICATED'; drug1: string; drug2: string; description: string; clinicalImpact: string; management: string; }
export type PaymentMethodType = 'CASH' | 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'AUTO_PAY' | 'CARD' | 'SPLIT';
export interface PaymentDetails { method: PaymentMethodType; mode?: string; receivedAmount?: number; splitAmounts?: { cash: number; card: number; upi: number }; cashAmount: number; upiAmount: number; cardAmount: number; creditCardAmount?: number; debitCardAmount?: number; autoPayAmount?: number; totalPaid: number; changeDue: number; digitalTransactionRef?: string; cardLast4?: string; cardNetwork?: string; cardType?: 'CREDIT' | 'DEBIT'; autoPayDetails?: { mandateId: string; authMode: 'UPI_AUTOPAY' | 'E_NACH' | 'STANDING_INSTRUCTION'; frequency: 'MONTHLY_REFILL' | 'BI_WEEKLY' | 'ON_DEMAND'; customerVpaOrAcc?: string; }; razorpayQrUrl?: string; paymentStatus: 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED'; }
export interface FinalizedInvoice { invoiceNumber: string; invoiceDate: string; billingSession: BillingSession; subtotal: number; totalDiscount: number; totalCGST: number; totalSGST: number; grandTotal: number; payment: PaymentDetails; pharmacistName?: string; counterNumber?: number; isEmergencyInvoice?: boolean; emergencyCondition?: string; storeInfo: { name: string; dlNo: string; gstin: string; address: string; phone: string; }; }
export interface GRNItem { productId: string; productName: string; batchNumber: string; expiryDate: string; quantity: number; purchaseRate: number; mrp: number; sellingPrice: number; gstRate: number; totalAmount: number; }
export interface GRNEntry { grnId: string; grnNumber: string; supplierName: string; supplierInvoiceNo: string; receivedDate: string; items: GRNItem[]; totalAmount: number; status: 'COMPLETED' | 'DRAFT'; }
export interface ReturnItem { productId: string; productName: string; batchNumber: string; quantityReturned: number; unitPrice: number; refundAmount: number; reason: 'EXPIRED' | 'DAMAGED' | 'CUSTOMER_CANCELLED' | 'WRONG_MEDICINE'; restocked: boolean; shelfStatus?: string; }
export interface ReturnCreditNote { creditNoteNo: string; originalInvoiceNo: string; patientName: string; returnDate: string; items: ReturnItem[]; totalRefundAmount: number; refundMethod: 'CASH' | 'UPI' | 'STORE_CREDIT'; }
export interface DisposalRecord { disposalId: string; productId: string; productName: string; batchNumber: string; quantityDisposed: number; disposalDate: string; reason: 'EXPIRED' | 'DAMAGED_PACKAGING' | 'RECALLED_BY_GOVT'; disposedBy: string; approvalManagerPin: string; }
export interface PatientRecord { patientId: string; name: string; phone: string; age: string; gender: 'MALE' | 'FEMALE' | 'OTHER'; totalBills: number; totalSpent: number; lastVisit: string; chronicConditions?: string[]; chronicMedications?: ChronicMedication[]; }
export interface SupplierRecord { supplierId: string; name: string; contactPerson: string; phone: string; email: string; gstin: string; dlNumber: string; address: string; pendingBalance: number; tradeDiscountPercent?: number; rebatePercent?: number; liquidMarginPercent?: number; creditPeriodDays?: number; deliveryLeadTimeHours?: number; topBrandsSupplied?: string[]; recommendationTag?: string; performanceScore?: number; returnAcceptanceRate?: number; }
export interface StoreSettings { storeName: string; dlNo: string; gstin: string; phone: string; address: string; defaultPrintFormat: 'THERMAL' | 'A4'; autoPrintReceipt: boolean; soundEffects: boolean; autoAddOnScan?: boolean; nearExpiryDaysThreshold?: number; termsAndConditions?: string; defaultTaxType?: 'CGST_SGST' | 'IGST'; managerName?: string; managerEmail?: string; ownerName?: string; ownerEmail?: string; managerPin?: string; ownerPin?: string; }
export interface SupplierBill { id?: string; billId?: string; supplierId?: string; supplierName?: string; invoiceNumber?: string; invoiceDate?: string; billDate?: string; dueDate?: string; amount?: number; totalAmount?: number; paidAmount?: number; pendingAmount?: number; status?: string; billType?: string; creditDays?: number; [key: string]: unknown; }
export interface SupplierPaymentLog { id?: string; paymentId?: string; supplierId?: string; supplierName?: string; amount?: number; paymentDate?: string; paymentMethod?: string; paymentMode?: string; reference?: string; referenceNo?: string; [key: string]: unknown; }
export interface DistributorScheme { id?: string; schemeId?: string; supplierId?: string; distributorId?: string; supplierName?: string; title?: string; dealType?: string; primaryProduct?: string; description?: string; discountPercent?: number; [key: string]: unknown; }

export type DeliveryStatus = 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'ON_TIME' | 'DELAYED' | 'DELIVERED' | 'CANCELLED';
export type DeliveryType = 'STANDARD' | 'EXPRESS' | 'SCHEDULED';
export type DeliveryMode = 'HOME_DELIVERY' | 'STORE_PICKUP';
export interface DeliveryOrderItem { productId: string; productName: string; quantity: number; unitPrice: number; lineTotal: number; }
export interface DeliveryOrder { orderId: string; orderNumber: string; customerName: string; customerPhone: string; deliveryMode: DeliveryMode; deliveryAddress?: string; pickupCounter?: string; items: DeliveryOrderItem[]; totalAmount: number; status: DeliveryStatus; deliveryType: DeliveryType; timeSlot?: string; estimatedDeliveryTime: string; actualDeliveryTime?: string; assignedRider?: string; riderPhone?: string; prescriptionRequired: boolean; prescriptionVerified: boolean; verificationDeadline?: string; pharmacistName?: string; invoiceNumber?: string; notes?: string; createdAt: string; updatedAt: string; }
export type WellnessBrochureCategory = 'DIABETES' | 'HYPERTENSION' | 'ASTHMA' | 'GERIATRIC' | 'PEDIATRIC' | 'MATERNITY';
export interface WellnessBrochurePlan { id: string; category: WellnessBrochureCategory; title: string; subtitle: string; icon: string; badgeColor: string; targetCondition: string; recommendedDiet: string[]; foodsToAvoid: string[]; lifestyleTips: string[]; medicationAdherenceTips: string[]; warningSigns: string[]; recommendedCheckups: string[]; }
export interface BranchStore { branchId: string; branchName: string; location: string; distanceKm: number; phone: string; isCentralGodown?: boolean; status: 'OPEN' | 'BUSY' | 'CLOSED'; }
export interface BorrowedMedicineRecord { borrowId: string; medicineName: string; saltComposition?: string; sourceType: 'NEIGHBOR_PHARMACY' | 'CENTRAL_GODOWN' | 'DISTRIBUTOR'; sourceName: string; quantity: number; unit: string; purchaseCostRate: number; newDisplayPrice: number; borrowDate: string; status: 'PENDING_REPAYMENT' | 'SETTLED' | 'RETURNED'; notes?: string; }
export interface AgeRecommendationCoupon { id: string; targetAgeGroup: 'PEDIATRIC' | 'ADULT' | 'SENIOR'; minAge: number; maxAge: number; title: string; description: string; couponCode: string; discountPercent: number; recommendedProducts: string[]; }
export interface InterStoreChatMessage { id: string; sender: 'PHARMACIST' | 'BOT' | 'BRANCH_DISPATCHER'; senderName: string; branchName?: string; text: string; timestamp: string; actionPayload?: { type: 'STOCK_CHECK' | 'RESERVE_PICKUP' | 'TRANSFER_REQUEST'; productId?: string; productName?: string; availableBranch?: string; stockQty?: number; }; }
