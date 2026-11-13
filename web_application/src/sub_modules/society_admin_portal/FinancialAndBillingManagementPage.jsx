import React, { useState, useEffect } from "react";
import {
  IndianRupee,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Search,
  Plus,
  CreditCard,
  Settings,
  QrCode,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  TrendingUp,
  Clock,
  ChevronRight,
  FileText,
  Printer,
  Sparkles,
  Building2,
  Edit3,
} from "lucide-react";

import { BulkInvoiceGeneratorModal } from "./components/BulkInvoiceGeneratorModal";
import { PaymentReconciliationDrawer } from "./components/PaymentReconciliationDrawer";
import { BillingConfigurationModal } from "./components/BillingConfigurationModal";
import { InvoiceUpiQrModal } from "./components/InvoiceUpiQrModal";
import { MaintenanceNoticeCircularModal } from "./components/MaintenanceNoticeCircularModal";
import { EditFlatClassificationModal } from "./components/EditFlatClassificationModal";

export function FinancialAndBillingManagementPage() {
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [flatsLedger, setFlatsLedger] = useState([]);
  const [billingConfig, setBillingConfig] = useState(null);
  const [billingHeads, setBillingHeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL | DEFAULTERS | CLEARED
  const [filterType, setFilterType] = useState("ALL"); // ALL | REGULAR | PENTHOUSE | TENANTS

  // Modal / Drawer states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isCircularModalOpen, setIsCircularModalOpen] = useState(false);
  const [circularData, setCircularData] = useState(null);
  const [selectedFlatForPayment, setSelectedFlatForPayment] = useState(null);
  const [selectedInvoiceForQr, setSelectedInvoiceForQr] = useState(null);
  const [flatToEdit, setFlatToEdit] = useState(null);

  // Flat statement timeline modal
  const [activeFlatStatement, setActiveFlatStatement] = useState(null);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);

  // Load all initial billing data
  const fetchAllBillingData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("smart_nivas_auth_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [resSummary, resLedger, resConfig] = await Promise.all([
        fetch("/api/admin/billing/dashboard-summary", { headers }),
        fetch("/api/admin/billing/ledger", { headers }),
        fetch("/api/admin/billing/configuration", { headers }),
      ]);

      const [dataSummary, dataLedger, dataConfig] = await Promise.all([
        resSummary.json(),
        resLedger.json(),
        resConfig.json(),
      ]);

      if (dataSummary.success) setDashboardSummary(dataSummary.data);
      if (dataLedger.success) setFlatsLedger(dataLedger.data);
      if (dataConfig.success) {
        setBillingConfig(dataConfig.data.configuration);
        setBillingHeads(dataConfig.data.billing_heads);
      }
    } catch (err) {
      console.error("Error loading financial data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCircularModal = async () => {
    try {
      const token = localStorage.getItem("smart_nivas_auth_token");
      const res = await fetch("/api/admin/billing/notice-circular", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCircularData(data.data);
        setIsCircularModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to load notice circular", err);
    }
  };

  useEffect(() => {
    fetchAllBillingData();
  }, []);

  // Filter flats ledger
  const filteredFlats = flatsLedger.filter((flat) => {
    const matchesSearch =
      flat.flat_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flat.wing_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (flat.resident_name || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (filterStatus === "DEFAULTERS" && parseFloat(flat.current_outstanding_inr || 0) <= 0) {
      return false;
    }
    if (filterStatus === "CLEARED" && parseFloat(flat.current_outstanding_inr || 0) > 0) {
      return false;
    }

    // Type filter
    if (filterType === "PENTHOUSE" && flat.flat_type !== "PENTHOUSE") return false;
    if (filterType === "REGULAR" && flat.flat_type !== "REGULAR") return false;
    if (filterType === "TENANTS" && flat.occupancy_status !== "TENANT_OCCUPIED") return false;

    return true;
  });

  // Open statement drawer for specific flat
  const handleOpenFlatStatement = async (flat) => {
    setIsLoadingStatement(true);
    setActiveFlatStatement({ flat, entries: [], unpaid: [] });
    try {
      const token = localStorage.getItem("smart_nivas_auth_token");
      const res = await fetch(`/api/admin/billing/ledger/${flat.flat_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setActiveFlatStatement({
          flat,
          entries: data.data.ledger_entries || [],
          unpaid: data.data.unpaid_invoices || [],
        });
      }
    } catch (err) {
      console.error("Failed to load flat statement", err);
    } finally {
      setIsLoadingStatement(false);
    }
  };

  const handleFlatClassificationUpdated = (updatedFlat) => {
    setFlatsLedger((prev) =>
      prev.map((f) => (f.flat_id === updatedFlat.flat_id ? { ...f, ...updatedFlat } : f))
    );
  };

  // Rates overview pill text
  const isTiered = billingConfig?.calculation_mode === "TIERED_FLAT_TYPE";
  const isQuarterly = billingConfig?.billing_cycle === "QUARTERLY";

  return (
    <div className="space-y-6 antialiased pb-12 font-sans relative">
      {/* Subtle ambient light gradient backdrop for glassmorphism */}
      <div className="absolute -top-10 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Modern Frosted Glass Hero Header */}
      <div className="relative backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Accounts Receivable & Invoicing
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {isQuarterly ? "Quarterly Cycle" : "Monthly Cycle"} • {flatsLedger.length} Flats Registered
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
                  Maintenance & Income
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Accounts receivable ledger, tiered flat-wise maintenance calculations, and real-time reconciliation.
                </p>
              </div>
            </div>
          </div>

          {/* Global Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white/80 hover:bg-white border border-slate-200/90 shadow-xs hover:shadow transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Rules & Bank Setup</span>
            </button>

            <button
              onClick={() => {
                setSelectedFlatForPayment(null);
                setIsPaymentDrawerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white/80 hover:bg-white border border-slate-200/90 shadow-xs hover:shadow transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Record Payment</span>
            </button>

            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Invoices</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ACTIVE TIERED RATE BANNER (Light Modern Frosted Glass Bento)
         ========================================================================= */}
      <div className="p-5 rounded-2xl backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Active Pricing Engine
            </span>
            <span className="text-xs font-bold text-slate-800">
              {isTiered
                ? `Flat-Type & Occupancy Matrix (${isQuarterly ? "Quarterly" : "Monthly"})`
                : billingConfig?.calculation_mode === "PER_SQFT_AREA"
                ? `₹${billingConfig?.rate_per_sqft_inr}/sq.ft. Area`
                : `Uniform ₹${billingConfig?.fixed_monthly_rate_inr}/flat`}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Shilp Serenity Model: Regular Flats <span className="font-semibold text-slate-900">₹{isQuarterly ? "7,200 (Owner) / ₹9,000 (Tenant)" : "2,400 (Owner) / ₹3,000 (Tenant)"}</span> • Penthouses <span className="font-semibold text-slate-900">₹{isQuarterly ? "8,700 (Owner) / ₹10,500 (Tenant)" : "2,900 (Owner) / ₹3,500 (Tenant)"}</span> per quarter.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Late Payment Fine</span>
            <span className="text-sm font-extrabold text-amber-600 font-mono">
              ₹{billingConfig?.penalty_amount_or_rate || 500} / mo
            </span>
          </div>
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            Modify Rates
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: FROSTED GLASS BENTO GRID (KPIS & PERFORMANCE CHART)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: 3 Bento KPI Cards */}
        <div className="space-y-4">
          {/* Total Billed */}
          <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-5 rounded-2xl flex items-center justify-between hover:shadow-md transition-all">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Invoiced
              </p>
              <h2 className="text-2xl font-black text-slate-900 font-heading mt-1">
                ₹{(dashboardSummary?.total_billed_inr || 0).toLocaleString("en-IN")}
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                {dashboardSummary?.total_invoices_issued || 0} bills issued across cycles
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50/80 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          </div>

          {/* Total Collected */}
          <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-5 rounded-2xl flex items-center justify-between hover:shadow-md transition-all">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Collected Receipts
              </p>
              <h2 className="text-2xl font-black text-emerald-600 font-heading mt-1">
                ₹{(dashboardSummary?.total_collected_inr || 0).toLocaleString("en-IN")}
              </h2>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Credited & Reconciled
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>

          {/* Outstanding Dues */}
          <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-5 rounded-2xl flex items-center justify-between hover:shadow-md transition-all">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Outstanding Dues
              </p>
              <h2 className="text-2xl font-black text-rose-600 font-heading mt-1">
                ₹{(dashboardSummary?.total_outstanding_inr || 0).toLocaleString("en-IN")}
              </h2>
              <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {dashboardSummary?.defaulters_count || 0} Defaulter flats pending payment
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50/80 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Right Column: Monthly Invoicing vs Collection Bar Chart (Spans 2 cols) */}
        <div className="lg:col-span-2 backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Financial Performance (Billed vs Collected)
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time collection velocity across historical maintenance periods.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-600" />
                  <span className="text-slate-600">Billed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="text-slate-600">Collected</span>
                </div>
              </div>
            </div>

            {/* Visual Bar Chart */}
            {dashboardSummary?.monthly_trends && dashboardSummary.monthly_trends.length > 0 ? (
              <div className="h-52 flex items-end justify-between gap-3 pt-6 px-2">
                {dashboardSummary.monthly_trends.map((item, idx) => {
                  const maxVal = Math.max(
                    ...dashboardSummary.monthly_trends.map((m) =>
                      Math.max(m.billed_amount, m.collected_amount)
                    ),
                    1
                  );
                  const billedHeight = Math.max((item.billed_amount / maxVal) * 100, 6);
                  const collectedHeight = Math.max((item.collected_amount / maxVal) * 100, 4);

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                    >
                      <div className="w-full flex items-end justify-center gap-1.5 h-40">
                        {/* Billed Bar */}
                        <div
                          style={{ height: `${billedHeight}%` }}
                          className="w-1/2 max-w-[28px] bg-blue-600/80 group-hover:bg-blue-600 rounded-t-lg transition-all relative shadow-2xs"
                          title={`Billed: ₹${item.billed_amount}`}
                        />
                        {/* Collected Bar */}
                        <div
                          style={{ height: `${collectedHeight}%` }}
                          className="w-1/2 max-w-[28px] bg-emerald-500/80 group-hover:bg-emerald-500 rounded-t-lg transition-all relative shadow-2xs"
                          title={`Collected: ₹${item.collected_amount}`}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 truncate max-w-full">
                        {item.billing_period_label.split(" ")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs">
                <FileSpreadsheet className="w-8 h-8 text-slate-300 mb-2" />
                <p>No billing cycles generated yet.</p>
                <button
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="mt-2 text-blue-600 font-bold hover:underline"
                >
                  Generate First Invoice Batch
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 mt-2">
            <span>
              Society Due Date:{" "}
              <strong className="text-slate-700">{billingConfig?.due_day_of_month || 10}th of period</strong> (+{billingConfig?.grace_period_days || 5} days grace)
            </span>
            <span>
              Bank: <strong className="text-slate-700">{billingConfig?.bank_name || "Configured"}</strong> ({billingConfig?.upi_vpa || "UPI active"})
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: FLAT-BY-FLAT LEDGER DATA GRID (Frosted Glass Bento Container)
         ========================================================================= */}
      <div className="backdrop-blur-xl bg-white/80 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-2xl overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Flat-by-Flat Accounts Receivable Ledger
            </h3>
            <span className="text-xs bg-slate-100/90 text-slate-600 px-2.5 py-0.5 rounded-full font-bold font-mono border border-slate-200/60">
              {filteredFlats.length} Flats
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search flat, resident..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none w-44 sm:w-56 transition-all"
              />
            </div>

            {/* Type Filter Tabs */}
            <div className="flex items-center bg-slate-100/80 p-0.5 rounded-xl text-xs font-semibold border border-slate-200/60">
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === "ALL" ? "bg-white text-blue-700 font-bold shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setFilterType("REGULAR")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === "REGULAR" ? "bg-white text-blue-700 font-bold shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Regular
              </button>
              <button
                onClick={() => setFilterType("PENTHOUSE")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === "PENTHOUSE" ? "bg-white text-amber-700 font-bold shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Penthouse
              </button>
              <button
                onClick={() => setFilterType("TENANTS")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === "TENANTS" ? "bg-white text-indigo-700 font-bold shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Tenants
              </button>
            </div>

            {/* Defaulter / Cleared Filter Tabs */}
            <div className="flex items-center bg-slate-100/80 p-0.5 rounded-xl text-xs font-semibold border border-slate-200/60">
              <button
                onClick={() => setFilterStatus("ALL")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterStatus === "ALL" ? "bg-white text-slate-800 font-bold shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All Dues
              </button>
              <button
                onClick={() => setFilterStatus("DEFAULTERS")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterStatus === "DEFAULTERS" ? "bg-white text-rose-600 font-bold shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Defaulters
              </button>
              <button
                onClick={() => setFilterStatus("CLEARED")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterStatus === "CLEARED" ? "bg-white text-emerald-600 font-bold shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Cleared
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Flat Unit</th>
                <th className="py-3 px-4">Flat Category & Occupancy</th>
                <th className="py-3 px-4">Primary Resident</th>
                <th className="py-3 px-4 text-right">Total Billed</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Net Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading flat ledgers...
                  </td>
                </tr>
              ) : filteredFlats.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No flat accounts match the current filter.
                  </td>
                </tr>
              ) : (
                filteredFlats.map((flat) => {
                  const outstanding = parseFloat(flat.current_outstanding_inr || 0);
                  const isDefaulter = outstanding > 0;
                  const isPenthouse = flat.flat_type === "PENTHOUSE";
                  const isTenant = flat.occupancy_status === "TENANT_OCCUPIED";

                  return (
                    <tr
                      key={flat.flat_id}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span className="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-extrabold mr-2 border border-blue-100">
                          {flat.wing_name}
                        </span>
                        {flat.flat_number}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              isPenthouse
                                ? "bg-amber-100 text-amber-900 border border-amber-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {flat.flat_type || "REGULAR"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isTenant
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {isTenant ? "Tenant" : "Owner/Builder"}
                          </span>
                          <button
                            onClick={() => setFlatToEdit(flat)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                            title="Edit Category or Occupancy"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {flat.resident_name || "Vacant / No Owner"}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {flat.resident_phone || flat.occupancy_status}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                        ₹{parseFloat(flat.total_billed_inr || 0).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                        ₹{parseFloat(flat.total_paid_inr || 0).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-extrabold">
                        <span
                          className={
                            isDefaulter ? "text-rose-600 text-sm" : "text-slate-400"
                          }
                        >
                          ₹{outstanding.toLocaleString("en-IN")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isDefaulter ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Dues Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            All Cleared
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Statement button */}
                          <button
                            onClick={() => handleOpenFlatStatement(flat)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="View Statement & History"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Quick payment record */}
                          <button
                            onClick={() => {
                              setSelectedFlatForPayment(flat.flat_id);
                              setIsPaymentDrawerOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition cursor-pointer"
                          >
                            Record Pay
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: FLAT STATEMENT & LEDGER TIMELINE MODAL (Frosted Glass Dialog)
         ========================================================================= */}
      {activeFlatStatement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setActiveFlatStatement(null)}
        >
          <div
            className="backdrop-blur-2xl bg-white/95 border border-slate-200/90 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Statement for Flat {activeFlatStatement.flat.wing_name}-{activeFlatStatement.flat.flat_number}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeFlatStatement.flat.resident_name || "Unassigned"} • {activeFlatStatement.flat.flat_type || "REGULAR"} ({activeFlatStatement.flat.occupancy_status})
                </p>
              </div>
              <button
                onClick={() => setActiveFlatStatement(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              {/* Unpaid Invoices Section */}
              {activeFlatStatement.unpaid?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Unpaid Pending Invoices
                  </h4>
                  <div className="space-y-2">
                    {activeFlatStatement.unpaid.map((inv) => (
                      <div
                        key={inv.invoice_id}
                        className="p-3.5 bg-rose-50/70 border border-rose-200/90 rounded-2xl flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            {inv.invoice_number}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-2">
                            ({inv.billing_period_label})
                          </span>
                          <div className="text-[10px] text-slate-400">
                            Due Date: {inv.due_date}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black font-mono text-rose-600">
                            ₹{parseFloat(inv.outstanding_balance_inr).toLocaleString("en-IN")}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedInvoiceForQr(inv.invoice_id);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-100/70 rounded-xl transition cursor-pointer"
                            title="UPI QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real-time Ledger Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Account Ledger Entries (Debits & Credits)
                </h4>
                {activeFlatStatement.entries?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No ledger transactions recorded yet.
                  </p>
                ) : (
                  <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5 text-right text-rose-600">Debit (₹)</th>
                          <th className="p-2.5 text-right text-emerald-600">Credit (₹)</th>
                          <th className="p-2.5 text-right font-bold text-slate-900">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {activeFlatStatement.entries.map((entry) => (
                          <tr key={entry.entry_id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-2.5 text-slate-600 font-sans text-[11px]">
                              {entry.entry_date}
                            </td>
                            <td className="p-2.5 text-slate-800 font-sans text-xs">
                              {entry.description}
                            </td>
                            <td className="p-2.5 text-right text-rose-600">
                              {parseFloat(entry.debit_amount_inr) > 0
                                ? `+₹${parseFloat(entry.debit_amount_inr).toLocaleString("en-IN")}`
                                : "-"}
                            </td>
                            <td className="p-2.5 text-right text-emerald-600">
                              {parseFloat(entry.credit_amount_inr) > 0
                                ? `-₹${parseFloat(entry.credit_amount_inr).toLocaleString("en-IN")}`
                                : "-"}
                            </td>
                            <td className="p-2.5 text-right font-bold text-slate-900">
                              ₹{parseFloat(entry.running_balance_inr).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS & DRAWERS
         ========================================================================= */}
      {/* 1. Bulk Invoice Generator Modal */}
      <BulkInvoiceGeneratorModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        billingConfig={billingConfig}
        availableHeads={billingHeads}
        onInvoicesGenerated={fetchAllBillingData}
      />

      {/* 2. Payment Reconciliation Drawer */}
      <PaymentReconciliationDrawer
        isOpen={isPaymentDrawerOpen}
        onClose={() => setIsPaymentDrawerOpen(false)}
        flatsList={flatsLedger}
        preselectedFlatId={selectedFlatForPayment}
        onPaymentRecorded={fetchAllBillingData}
      />

      {/* 3. Billing Rules Configuration Modal */}
      <BillingConfigurationModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        initialConfig={billingConfig}
        onConfigSaved={(updatedCfg) => {
          setBillingConfig(updatedCfg);
          fetchAllBillingData();
        }}
      />

      {/* 4. Invoice UPI QR Modal */}
      <InvoiceUpiQrModal
        isOpen={!!selectedInvoiceForQr}
        invoiceId={selectedInvoiceForQr}
        onClose={() => setSelectedInvoiceForQr(null)}
      />

      {/* 5. Official Society Circular Modal */}
      <MaintenanceNoticeCircularModal
        isOpen={isCircularModalOpen}
        onClose={() => setIsCircularModalOpen(false)}
        noticeData={circularData}
      />

      {/* 6. Edit Flat Classification Modal */}
      <EditFlatClassificationModal
        isOpen={!!flatToEdit}
        onClose={() => setFlatToEdit(null)}
        flat={flatToEdit}
        availableCategories={Object.keys(billingConfig?.parsed_flat_type_rates || {})}
        onSaved={handleFlatClassificationUpdated}
      />
    </div>
  );
}
