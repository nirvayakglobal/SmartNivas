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
} from "lucide-react";

import { BulkInvoiceGeneratorModal } from "./components/BulkInvoiceGeneratorModal";
import { PaymentReconciliationDrawer } from "./components/PaymentReconciliationDrawer";
import { BillingConfigurationModal } from "./components/BillingConfigurationModal";
import { InvoiceUpiQrModal } from "./components/InvoiceUpiQrModal";

export function FinancialAndBillingManagementPage() {
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [flatsLedger, setFlatsLedger] = useState([]);
  const [billingConfig, setBillingConfig] = useState(null);
  const [billingHeads, setBillingHeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL | DEFAULTERS | CLEARED

  // Modal / Drawer states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedFlatForPayment, setSelectedFlatForPayment] = useState(null);
  const [selectedInvoiceForQr, setSelectedInvoiceForQr] = useState(null);

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

    if (filterStatus === "DEFAULTERS") {
      return parseFloat(flat.current_outstanding_inr || 0) > 0;
    }
    if (filterStatus === "CLEARED") {
      return parseFloat(flat.current_outstanding_inr || 0) <= 0;
    }
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

  return (
    <div className="space-y-6 antialiased pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading tracking-tight flex items-center gap-2.5">
            <IndianRupee className="w-6 h-6 text-blue-600" />
            Financial & Maintenance Billing
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Accounts receivable, dynamic maintenance calculation, flat ledgers & payment reconciliation.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Rules & Bank Setup</span>
          </button>

          <button
            onClick={() => {
              setSelectedFlatForPayment(null);
              setIsPaymentDrawerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoices</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: HIGH-LEVEL BILLING DASHBOARD KPIS & MONTHLY BAR CHART
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 3 KPI Cards */}
        <div className="space-y-4">
          {/* Total Billed */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Invoiced
              </p>
              <h2 className="text-2xl font-extrabold text-slate-900 font-heading mt-1">
                ₹{(dashboardSummary?.total_billed_inr || 0).toLocaleString("en-IN")}
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                {dashboardSummary?.total_invoices_issued || 0} bills issued across all cycles
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          </div>

          {/* Total Collected */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Collected Receipts
              </p>
              <h2 className="text-2xl font-extrabold text-emerald-600 font-heading mt-1">
                ₹{(dashboardSummary?.total_collected_inr || 0).toLocaleString("en-IN")}
              </h2>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Credited & Reconciled
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>

          {/* Outstanding Dues */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Outstanding Dues
              </p>
              <h2 className="text-2xl font-extrabold text-rose-600 font-heading mt-1">
                ₹{(dashboardSummary?.total_outstanding_inr || 0).toLocaleString("en-IN")}
              </h2>
              <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {dashboardSummary?.defaulters_count || 0} Defaulter flats pending payment
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Right Column: Monthly Invoicing vs Collection Bar Chart (Spans 2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Monthly Financial Performance (Billed vs Collected)
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

            {/* Bar Chart Visualization */}
            {dashboardSummary?.monthly_trends && dashboardSummary.monthly_trends.length > 0 ? (
              <div className="h-48 flex items-end justify-between gap-4 pt-6 px-2 border-b border-slate-100">
                {dashboardSummary.monthly_trends.map((m) => {
                  const maxAmt = Math.max(
                    ...dashboardSummary.monthly_trends.map((item) =>
                      Math.max(parseFloat(item.billed_amount), parseFloat(item.collected_amount))
                    ),
                    1000
                  );
                  const billedHeight = `${Math.min(100, (parseFloat(m.billed_amount) / maxAmt) * 100)}%`;
                  const collectedHeight = `${Math.min(100, (parseFloat(m.collected_amount) / maxAmt) * 100)}%`;

                  return (
                    <div key={m.billing_period_month} className="flex-1 flex flex-col items-center h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1.5 h-36">
                        {/* Billed Bar */}
                        <div
                          style={{ height: billedHeight }}
                          className="w-1/3 bg-blue-600 rounded-t-md transition-all duration-300 relative group"
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-20">
                            Billed: ₹{parseFloat(m.billed_amount).toLocaleString("en-IN")}
                          </div>
                        </div>
                        {/* Collected Bar */}
                        <div
                          style={{ height: collectedHeight }}
                          className="w-1/3 bg-emerald-500 rounded-t-md transition-all duration-300 relative group"
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-20">
                            Paid: ₹{parseFloat(m.collected_amount).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 mt-2 truncate max-w-[80px]">
                        {m.billing_period_label.split(" ")[0]}
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
              Active Rule:{" "}
              <strong className="text-slate-700">
                {billingConfig?.calculation_mode === "PER_SQFT_AREA"
                  ? `₹${billingConfig?.rate_per_sqft_inr}/sq.ft.`
                  : `Fixed ₹${billingConfig?.fixed_monthly_rate_inr}/flat`}
              </strong>
            </span>
            <span>
              Due Date: <strong className="text-slate-700">{billingConfig?.due_day_of_month || 10}th of month</strong> (+{billingConfig?.grace_period_days || 5} days grace)
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: FLAT-BY-FLAT LEDGER DATA GRID
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Flat-by-Flat Accounts Receivable Ledger
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              {filteredFlats.length} Flats
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search flat, wing, resident..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none w-48 sm:w-60"
              />
            </div>

            {/* Filter Pill Tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterStatus("ALL")}
                className={`px-3 py-1 rounded-lg transition ${
                  filterStatus === "ALL" ? "bg-white text-blue-700 font-bold shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus("DEFAULTERS")}
                className={`px-3 py-1 rounded-lg transition ${
                  filterStatus === "DEFAULTERS" ? "bg-white text-rose-600 font-bold shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                With Dues
              </button>
              <button
                onClick={() => setFilterStatus("CLEARED")}
                className={`px-3 py-1 rounded-lg transition ${
                  filterStatus === "CLEARED" ? "bg-white text-emerald-600 font-bold shadow-xs" : "text-slate-500 hover:text-slate-800"
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
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Flat Unit</th>
                <th className="py-3 px-4">Primary Resident</th>
                <th className="py-3 px-4 text-right">Area (Sq.Ft.)</th>
                <th className="py-3 px-4 text-right">Total Invoiced (Debit)</th>
                <th className="py-3 px-4 text-right">Total Paid (Credit)</th>
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

                  return (
                    <tr
                      key={flat.flat_id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span className="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-extrabold mr-2">
                          {flat.wing_name}
                        </span>
                        {flat.flat_number}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {flat.resident_name || "Vacant / No Owner"}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {flat.resident_phone || flat.occupancy_status}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                        {parseFloat(flat.super_builtup_area_sqft || 1000).toLocaleString("en-IN")} sq.ft.
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Dues Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
          SECTION 3: FLAT STATEMENT & LEDGER TIMELINE MODAL
         ========================================================================= */}
      {activeFlatStatement && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Statement for Flat {activeFlatStatement.flat.wing_name}-{activeFlatStatement.flat.flat_number}
                </h3>
                <p className="text-xs text-slate-500">
                  Resident: {activeFlatStatement.flat.resident_name || "N/A"} | Current Outstanding:{" "}
                  <strong className="text-rose-600 font-mono">
                    ₹{parseFloat(activeFlatStatement.flat.current_outstanding_inr || 0).toLocaleString("en-IN")}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setActiveFlatStatement(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Unpaid Invoices with UPI QR Action */}
              {activeFlatStatement.unpaid?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Open Invoices Pending Payment
                  </h4>
                  <div className="space-y-2">
                    {activeFlatStatement.unpaid.map((inv) => (
                      <div
                        key={inv.invoice_id}
                        className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900 font-mono text-xs">
                            {inv.invoice_number} &bull; {inv.billing_period_label}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Due Date: {inv.due_date} | Total: ₹{inv.total_invoice_amount_inr} | Paid: ₹{inv.paid_amount_inr}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-rose-600">
                            Due: ₹{inv.outstanding_balance_inr}
                          </span>
                          <button
                            onClick={() => setSelectedInvoiceForQr(inv.invoice_id)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-blue-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="Generate Instant UPI QR"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>QR</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Immutable Double-Entry Ledger History */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Account Ledger History
                </h4>
                {activeFlatStatement.entries?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">No ledger transactions posted yet.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5 text-right">Debit (₹)</th>
                          <th className="p-2.5 text-right">Credit (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeFlatStatement.entries.map((entry) => (
                          <tr key={entry.entry_id}>
                            <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                              {entry.entry_date}
                            </td>
                            <td className="p-2.5 font-medium text-slate-800">
                              {entry.description}
                              <div className="text-[10px] text-slate-400 font-mono">
                                Ref: {entry.reference_id}
                              </div>
                            </td>
                            <td className="p-2.5 text-right font-mono font-semibold text-rose-600">
                              {parseFloat(entry.debit_amount_inr) > 0
                                ? `₹${entry.debit_amount_inr}`
                                : "—"}
                            </td>
                            <td className="p-2.5 text-right font-mono font-semibold text-emerald-600">
                              {parseFloat(entry.credit_amount_inr) > 0
                                ? `₹${entry.credit_amount_inr}`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setActiveFlatStatement(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 4: SUB-MODALS & DRAWERS
         ========================================================================= */}
      {/* 1. Bulk Invoice Generator Wizard Modal */}
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

      {/* 3. Billing Rules & Bank Setup Modal */}
      <BillingConfigurationModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        initialConfig={billingConfig}
        onConfigSaved={(updated) => setBillingConfig(updated)}
      />

      {/* 4. Instant UPI QR Code Modal */}
      <InvoiceUpiQrModal
        isOpen={Boolean(selectedInvoiceForQr)}
        onClose={() => setSelectedInvoiceForQr(null)}
        invoiceId={selectedInvoiceForQr}
      />
    </div>
  );
}
