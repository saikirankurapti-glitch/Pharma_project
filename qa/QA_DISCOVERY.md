# GENQUANTAA Pharmacy POS — QA Discovery and Test Strategy

## Architecture
- Frontend: React 19 + Vite 8 + TypeScript + Redux Toolkit + TailwindCSS v4.
- Backend: Node.js 18+ + Express + TypeScript.
- Database: MongoDB/Mongoose.
- Authentication: JWT bearer authentication, bcrypt password hashing, login lockout.
- Authorization: PHARMACIST, MANAGER, OWNER and EMERGENCY_DESK roles.
- Real-time: Socket.IO.
- Security middleware: Helmet, CORS and express-rate-limit.
- API areas: auth, products, billing, invoices, GRN, returns, disposal, patients, suppliers, reports, settings, drug interactions, purchase orders, consultations, delivery orders, PIL, prescriptions and clinical bundles.

## Module inventory
| Module | UI/API | Roles | Main functions |
|---|---|---|---|
| Authentication | AuthPage / auth | All | login, registration, reset, lockout, PIN |
| POS Billing | ProductSearch, CartTable, CartSummary / invoices, billing | Pharmacist, Manager, Owner | search, cart, GST, compliance, payment, invoice |
| Inventory | InventoryPage, InventoryDashboardPage / products | Manager, Owner, Pharmacist | products, batches, stock, expiry |
| GRN/Purchase | PurchaseGRNPage / grn | Manager, Owner | receiving and batch inward |
| Returns | ReturnsPage / returns | Pharmacist, Manager, Owner | returns and credit notes |
| Expiry/Disposal | ExpiryManagementPage / disposal | Manager, Owner | expiry alerts and disposal |
| Patients/CRM | PatientsPage / patients | Pharmacist, Manager, Owner | patients, history, chronic care |
| Suppliers | SuppliersPage / suppliers | Manager, Owner | suppliers and ledger |
| Delivery | OnlineDeliveryPage, EmergencyDeliveryPage / delivery-orders | Pharmacist, Manager, Emergency Desk | delivery lifecycle |
| Reports | ReportsPage / reports | Manager, Owner, role-dependent | sales, GST, medicines, payments |
| Settings | SettingsPage / settings | Manager, Owner | store, security, staff |
| Clinical | DrugInteractionModal / drug-interactions, clinical-bundles | Pharmacist, Manager | interactions and clinical bundles |
| Voice Consultation | VoiceConsultationModal / consultations | Pharmacist, Manager | consultation records |
| Purchase Orders | AdvancePurchaseOrders / purchase-orders | Manager, Owner | PO CRUD, placement, GRN conversion |
| Security | auth middleware/routes | All | authentication, RBAC and protected operations |

## Major E2E journeys
1. Authentication → dashboard → logout.
2. Product search → cart → GST → payment → invoice.
3. Schedule H product → prescription/doctor/patient validation → sale.
4. Schedule X product → manager PIN authorization → sale.
5. GRN → batch stock → sale → return/credit note.
6. Delivery order → prescription verification → status transitions → reporting.
7. Staff role management → authorization enforcement.
8. Product/batch → expiry alert → disposal.
9. Purchase order → placement → GRN conversion.
10. Patient registration/history → chronic care/clinical workflow.
11. Voice consultation → save → retrieve.
12. Reports → date filters → export/print.

## Test strategy
Automated:
- API contract tests.
- Authentication and RBAC negative tests.
- Browser smoke, E2E and regression for critical navigation/workflows.
- Existing 181-case API/contract suite.

Manual/specialist:
- Visual fidelity and responsive validation.
- Accessibility semantics and keyboard navigation.
- Cross-browser checks.
- Printer/scanner/hardware behavior.
- Actual email/SMS/WhatsApp delivery.
- Socket.IO multi-counter behavior.
- Cron timing.
- Razorpay/NPCI external integration.
- Production-like load and disaster recovery.

Blocked without environment/capability:
- Stable deployed frontend browser execution if no frontend URL is supplied.
- External payment webhooks.
- Daily 08:00 cron observation.
- Email delivery confirmation without a test mailbox.
- Independent multi-counter real-time verification.

## E2E test list
| ID | Journey | Priority | Automation |
|---|---|---|---|
| E2E-AUTH-001 | Valid login → shell → logout | P0 | Yes |
| E2E-AUTH-002 | Invalid login | P1 | Yes |
| E2E-POS-001 | POS search | P0 | Yes |
| E2E-POS-002 | Regular sale | P0 | Existing API suite |
| E2E-POS-003 | Schedule H sale | P0 | Existing API suite |
| E2E-POS-004 | Schedule X PIN sale | P0 | Existing API suite |
| E2E-GRN-001 | GRN → stock | P0 | Existing API suite |
| E2E-RET-001 | Sale → return | P0 | Existing API suite; current failure needs investigation |
| E2E-DEL-001 | Delivery lifecycle | P0 | Existing API suite |
| E2E-SEC-001 | Pharmacist denied privileged mutation | P0 | Yes |
| E2E-PO-001 | PO lifecycle | P1 | API smoke; deeper UI coverage pending |
| E2E-CLI-001 | Drug interaction | P1 | API smoke |
| E2E-VOI-001 | Consultation CRUD | P1 | API smoke |
| E2E-RPT-001 | Report navigation/export | P1 | Yes |
| E2E-INV-001 | Inventory navigation/search | P1 | Yes |

## Existing 181-case coverage
The workbook contains 181 traceable cases across Authentication, POS Billing, Inventory, GRN/Purchase, Returns, Expiry/Disposal, Patients/CRM, Supplier/Procurement, Delivery, Reports, Settings, Clinical, Voice Consultation, Purchase Orders, Security and Non-Functional requirements.

The current GitHub runner executes API/contract checks where possible and marks UI/environment-dependent cases BLOCKED rather than PASS.

## Known findings from the last executed suite
- Unsupported prescription .exe was accepted by the current API runner.
- Seven-day report performance probe failed.
- Five-concurrent-session check failed.
- 10,000-SKU scalability check failed.
- GRN → sale → return E2E currently returns HTTP 500.
- Sprint 5 and Sprint 6 requirements are pending in the URS.
- Some UI-only and external integration checks remain blocked.

## Automation structure
qa/
  pages/
  tests/
    smoke/
    e2e/
    api/
    regression/
  utils/
  all_181_runner.py
  pos-e2e.mjs
  playwright.config.ts
  package.json

New browser/API framework credentials are supplied through environment variables only.
