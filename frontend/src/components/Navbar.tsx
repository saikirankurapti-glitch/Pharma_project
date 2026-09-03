import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { navigateTo, logoutUser, setInvoiceHistoryModalOpen, switchActivePharmacist, setWellnessBrochureModalOpen, setMultiStoreModalOpen, setInterStoreChatbotModalOpen } from '../store/posSlice';
import { Clock, Store, LogOut, LayoutDashboard, ShoppingCart, Package, Truck, BarChart3, RotateCcw, Users, Building, Settings, History, FileText, Siren, ChevronDown, Check, Bike, AlertTriangle, Sparkles, Building2, Bot } from 'lucide-react';

export const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.pos.currentUser);
  const currentView = useSelector((state: RootState) => state.pos.currentView);
  const pharmacists = useSelector((state: RootState) => state.pos.pharmacists);
  const activePharmacistId = useSelector((state: RootState) => state.pos.activePharmacistId);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const [showCounterDropdown, setShowCounterDropdown] = useState<boolean>(false);

  const activePharmacist = pharmacists.find(p => p.id === activePharmacistId) || pharmacists[0];

  // Store account initial — always from the STORE LOGIN email, never from the pharmacist name
  const accountEmail = currentUser?.email || 'navyasri@genquantaa.com';
  const emailPrefixName = accountEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const accountName = currentUser?.pharmacistName || emailPrefixName || 'User';
  // Always show first letter of the EMAIL prefix (store account), not the pharmacist/role name
  const accountInitial = emailPrefixName.trim().charAt(0).toUpperCase() || 'N';

  // Emergency desk mode: signed in with Emergency Desk option
  const isEmergencyDesk = currentView === 'EMERGENCY_DELIVERY' && accountName.includes('Dr. S. Reddy');

  return (
    <header className="bg-white border-b border-slate-200 shadow-xs px-4 py-2 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Store Information */}
      <div className="flex items-center space-x-3">
        <div className="bg-emerald-600 text-white p-2 rounded-lg shadow-sm flex items-center justify-center">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight font-heading">
              GENQUANTAA POS
            </h1>
          </div>
        </div>
      </div>

      {/* Right Controls: Manager Lock & Pharmacist Profile & Exit */}
      <div className="flex items-center space-x-1.5">
        {/* Dashboard Nav */}
        <button
          onClick={() => dispatch(navigateTo('DASHBOARD'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'DASHBOARD'
              ? 'bg-violet-100 text-violet-800 font-bold'
              : 'text-slate-500 hover:text-violet-700 hover:bg-violet-50'
            }`}
          title="Dashboard"
        >
          <LayoutDashboard className="w-4 h-4" />
        </button>

        {/* POS Terminal Nav */}
        <button
          onClick={() => dispatch(navigateTo('POS_TERMINAL'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'POS_TERMINAL'
              ? 'bg-emerald-100 text-emerald-800 font-bold'
              : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          title="POS Billing Terminal"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>

        {/* Saved Invoices History Nav */}
        <button
          onClick={() => dispatch(navigateTo('INVOICES'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'INVOICES'
              ? 'bg-emerald-100 text-emerald-800 font-bold'
              : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          title="Invoices & Sales History"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Inventory Catalog Nav */}
        <button
          onClick={() => dispatch(navigateTo('INVENTORY'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'INVENTORY'
              ? 'bg-emerald-100 text-emerald-800 font-bold'
              : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          title="Inventory Catalog"
        >
          <Package className="w-4 h-4" />
        </button>

        {/* Inventory Shelf & Price Dashboard Nav */}
        <button
          onClick={() => dispatch(navigateTo('INVENTORY_DASHBOARD'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'INVENTORY_DASHBOARD'
              ? 'bg-teal-100 text-teal-800 font-bold shadow-2xs'
              : 'text-slate-500 hover:text-teal-700 hover:bg-teal-50'
            }`}
          title="Inventory Shelf, Expiry & Pricing Dashboard"
        >
          <BarChart3 className="w-4 h-4 text-teal-600" />
        </button>

        {/* Stock Purchase GRN Nav */}
        <button
          onClick={() => dispatch(navigateTo('PURCHASE_GRN'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'PURCHASE_GRN'
              ? 'bg-amber-100 text-amber-800 font-bold'
              : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
            }`}
          title="Stock Purchase (GRN)"
        >
          <Truck className="w-4 h-4" />
        </button>

        {/* Reports Nav */}
        <button
          onClick={() => dispatch(navigateTo('REPORTS'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'REPORTS'
              ? 'bg-blue-100 text-blue-800 font-bold'
              : 'text-slate-500 hover:text-blue-700 hover:bg-blue-50'
            }`}
          title="Sales Reports & GST Analytics"
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        {/* Returns & Refunds Nav */}
        <button
          onClick={() => dispatch(navigateTo('RETURNS'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'RETURNS'
              ? 'bg-rose-100 text-rose-800 font-bold'
              : 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'
            }`}
          title="Returns & Refund Credit Notes"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Expiry Management Nav */}
        <button
          onClick={() => dispatch(navigateTo('EXPIRY_MANAGEMENT'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'EXPIRY_MANAGEMENT'
              ? 'bg-amber-100 text-amber-800 font-bold'
              : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
            }`}
          title="Expiry & Stock Disposal Management"
        >
          <Clock className="w-4 h-4 text-amber-600" />
        </button>

        {/* Patients Directory Nav */}
        <button
          onClick={() => dispatch(navigateTo('PATIENTS'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'PATIENTS'
              ? 'bg-orange-100 text-orange-800 font-bold'
              : 'text-slate-500 hover:text-orange-700 hover:bg-orange-50'
            }`}
          title="Patients History Directory"
        >
          <Users className="w-4 h-4" />
        </button>

        {/* Suppliers Directory Nav */}
        <button
          onClick={() => dispatch(navigateTo('SUPPLIERS'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'SUPPLIERS'
              ? 'bg-emerald-100 text-emerald-800 font-bold'
              : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          title="Suppliers & Vendors Directory"
        >
          <Building className="w-4 h-4" />
        </button>

        {/* Store Settings & Hardware Nav */}
        <button
          onClick={() => dispatch(navigateTo('SETTINGS'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'SETTINGS'
              ? 'bg-slate-800 text-white font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          title="Store Settings & Hardware Config"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Emergency Delivery Nav */}
        <button
          onClick={() => dispatch(navigateTo('EMERGENCY_DELIVERY'))}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer shadow-xs ${currentView === 'EMERGENCY_DELIVERY'
              ? 'bg-red-600 text-white ring-2 ring-red-300 shadow-sm shadow-red-600/40'
              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          title="Emergency Fast Delivery"
        >
          <Siren className="w-3.5 h-3.5 text-red-600 animate-pulse" />
          <span className="font-heading tracking-tight">🚨 Emergency</span>
        </button>

        {/* Online Delivery Dashboard Nav */}
        <button
          onClick={() => dispatch(navigateTo('ONLINE_DELIVERY'))}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer shadow-xs ${currentView === 'ONLINE_DELIVERY'
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-sm'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          title="Online Home Delivery Dashboard"
        >
          <Bike className="w-3.5 h-3.5" />
          <span className="font-heading tracking-tight">🚴 Delivery</span>
        </button>

        {/* Task #29: Health & Wellness Plan Brochure Nav */}
        <button
          onClick={() => dispatch(setWellnessBrochureModalOpen({ isOpen: true }))}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-xs transition-all cursor-pointer border border-emerald-400/30"
          title="Health & Wellness Plan Brochure (Task #29)"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
          <span className="font-heading tracking-tight">Wellness Plan</span>
        </button>

        {/* Tasks 31-36: Multi-Store & Borrowed Stock Hub */}
        <button
          onClick={() => dispatch(setMultiStoreModalOpen({ isOpen: true }))}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-black bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer border border-sky-400/30"
          title="Multi-Store, Inter-Branch & Borrowed Stock (Tasks #31-36)"
        >
          <Building2 className="w-3.5 h-3.5 text-sky-200" />
          <span className="font-heading tracking-tight">Inter-Store</span>
        </button>

        {/* Task #32: Inter-Store AI Chatbot Widget */}
        <button
          onClick={() => dispatch(setInterStoreChatbotModalOpen(true))}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-black bg-slate-900 hover:bg-slate-800 text-emerald-400 shadow-xs transition-all cursor-pointer border border-slate-700"
          title="PharmaConnect AI Chatbot (Task #32)"
        >
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-heading tracking-tight text-white">Pharma Bot</span>
        </button>

        {/* 🏪 Active Shift Counter Badge — or Emergency Desk Badge */}
        <div className="relative">
          {isEmergencyDesk ? (
            // Emergency Desk identity badge — no dropdown, fixed to Dr. S. Reddy
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold shadow-2xs">
              <Siren className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span className="font-black">Emergency Desk:</span>
              <span className="font-semibold text-rose-900">Dr. S. Reddy</span>
            </div>
          ) : (
            // Normal billing counter badge with switcher dropdown
            <>
              <button
                onClick={() => setShowCounterDropdown(!showCounterDropdown)}
                className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Active Shift Counter - Click to switch"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-black">Counter {activePharmacist.counterNumber}:</span>
                <span className="font-semibold text-emerald-900">{activePharmacist.name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-emerald-600" />
              </button>

              {showCounterDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCounterDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 animate-fadeIn">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                      Switch Shift Counter
                    </div>
                    <div className="space-y-1">
                      {pharmacists.map((pharm) => {
                        const isSelected = activePharmacistId === pharm.id;
                        return (
                          <button
                            key={pharm.id}
                            onClick={() => {
                              dispatch(switchActivePharmacist(pharm.id));
                              setShowCounterDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${isSelected
                                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                                : 'text-slate-700 hover:bg-slate-50'
                              }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <div>
                                <div className="font-bold leading-tight">Counter {pharm.counterNumber}: {pharm.name}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{pharm.role}</div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* User Profile Initial Avatar with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center shadow-xs uppercase select-none cursor-pointer transition-all active:scale-95 ring-2 ring-emerald-100"
            title={`Signed in as ${accountName}`}
          >
            {accountInitial}
          </button>

          {showProfileDropdown && (
            <>
              {/* Backdrop listener to close popup on outside click */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileDropdown(false)}
              ></div>

              {/* Profile Email Card Dropdown */}
              <div className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-fadeIn">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shadow-sm uppercase flex-shrink-0">
                    {accountInitial}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-900 truncate" title={accountName}>
                      {accountName}
                    </h4>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <p className="text-xs font-bold text-slate-800 truncate" title={accountEmail}>
                      {accountEmail}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      dispatch(navigateTo('SETTINGS'));
                    }}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-600" />
                    <span>Store Settings &amp; Hardware</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      dispatch(logoutUser());
                    }}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out Account</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
};

