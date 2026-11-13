import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  ShieldCheck,
  Megaphone,
  Layers,
  ArrowUpRight,
  UserPlus,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  LifeBuoy,
  UserCheck,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Sparkles,
  ChevronRight,
  Check,
  ExternalLink,
  Wallet,
  ArrowDownRight,
  PieChart,
  DollarSign,
  Briefcase,
  Bell,
  Scale,
} from "lucide-react";

export function SocietyDashboardOverviewPage() {
  const [dashboardMetrics, setDashboardMetrics] = useState({
    total_flats_count: 0,
    owner_occupied_count: 0,
    tenant_occupied_count: 0,
    vacant_flats_count: 0,
    total_residents_count: 0,
    total_guards_count: 0,
    total_gates_count: 0,
    active_campus_visitors_count: 0,
    total_notices_count: 0,
    pending_approvals_count: 0,
    open_helpdesk_tickets_count: 0,
    total_active_staff_count: 0,
    staff_on_campus_count: 0,
    total_billed_amount_inr: 0,
    total_collected_amount_inr: 0,
    total_due_amount_inr: 0,
    overdue_invoices_count: 0,
    paid_invoices_count: 0,
    total_invoices_count: 0,
    total_expenses_amount_inr: 0,
    paid_expenses_amount_inr: 0,
    pending_expenses_amount_inr: 0,
    total_expense_vouchers_count: 0,
    top_expense_categories: [],
    recent_expense_vouchers: [],
    top_overdue_invoices: [],
    recent_visitors: [],
    recent_tickets: [],
    recent_notices: [],
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // Stored Society Profile
  const storedSocietyProfileString = localStorage.getItem(
    "smart_nivas_society_profile"
  );
  let parsedSocietyProfile = null;
  if (storedSocietyProfileString) {
    try {
      parsedSocietyProfile = JSON.parse(storedSocietyProfileString);
    } catch (parseError) {
      console.warn("Failed to parse society profile.");
    }
  }

  const societyDisplayName =
    parsedSocietyProfile?.society_legal_name || "Shilp Serenity";
  const societyCity = parsedSocietyProfile?.city_name || "Ahmedabad";

  const fetchDashboardMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/admin/dashboard/metrics", {
        headers: { Authorization: `Bearer ${storedAuthToken}` },
      });
      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setDashboardMetrics(responseJsonData.data);
      }
    } catch (networkError) {
      console.error("Failed to fetch dashboard metrics:", networkError);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const totalOccupiedCount =
    (dashboardMetrics.owner_occupied_count || 0) +
    (dashboardMetrics.tenant_occupied_count || 0);
  const occupancyPercentage =
    dashboardMetrics.total_flats_count > 0
      ? Math.round(
          (totalOccupiedCount / dashboardMetrics.total_flats_count) * 100
        )
      : 0;

  const collectionRate =
    dashboardMetrics.total_billed_amount_inr > 0
      ? Math.round(
          (dashboardMetrics.total_collected_amount_inr /
            dashboardMetrics.total_billed_amount_inr) *
            100
        )
      : 0;

  const netCashflowInr =
    (dashboardMetrics.total_collected_amount_inr || 0) -
    (dashboardMetrics.paid_expenses_amount_inr || 0);

  const todayDateFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Subtle ambient light gradient backdrop for glassmorphism */}
      <div className="absolute -top-10 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-80 left-10 w-80 h-80 bg-purple-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. MODERN FROSTED GLASS HERO HEADER */}
      <div className="relative backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Dashboard
              </span>
              <span className="text-xs font-medium text-slate-500">
                {todayDateFormatted} • {societyCity}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
                {societyDisplayName}
              </h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                {dashboardMetrics.total_flats_count} Units
              </span>
            </div>

            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Unified administration overview: maintenance collections, society accounts payable, apartment occupancy, live gate register, and member approvals.
            </p>
          </div>

          {/* Frosted Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/Society/Admin/billing"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-sm hover:shadow transition-all hover:-translate-y-0.5"
            >
              <IndianRupee className="w-4 h-4" />
              <span>Generate Invoices</span>
            </Link>

            <Link
              to="/Society/Admin/accounts-payable"
              className="flex items-center gap-2 bg-white/80 hover:bg-white text-slate-800 border border-slate-200/90 font-semibold px-4 py-2.5 rounded-xl text-xs shadow-xs hover:shadow transition-all hover:-translate-y-0.5"
            >
              <Receipt className="w-4 h-4 text-rose-600" />
              <span>Record Expense</span>
            </Link>

            <Link
              to="/Society/Admin/residents?tab=MOBILE_APPROVALS"
              className="relative flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all hover:-translate-y-0.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>KYC Approvals</span>
              {dashboardMetrics.pending_approvals_count > 0 && (
                <span className="ml-1 bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">
                  {dashboardMetrics.pending_approvals_count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* 2. FROSTED GLASS METRIC RIBBON (6 Bento Tiles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Metric 1: Apartments */}
        <div className="backdrop-blur-md bg-white/70 border border-white/80 shadow-xs hover:shadow-md rounded-2xl p-4 transition-all hover:-translate-y-0.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Apartments
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50/80 text-blue-600 flex items-center justify-center border border-blue-100">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-heading">
              {dashboardMetrics.total_flats_count}
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {occupancyPercentage}% Occupied
            </span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100/80 flex items-center justify-between">
            <span>{totalOccupiedCount} occupied</span>
            <Link
              to="/Society/Admin/residents?tab=WINGS_AND_FLATS"
              className="text-blue-600 font-semibold hover:underline"
            >
              Stack →
            </Link>
          </div>
        </div>

        {/* Metric 2: Residents */}
        <div className="backdrop-blur-md bg-white/70 border border-white/80 shadow-xs hover:shadow-md rounded-2xl p-4 transition-all hover:-translate-y-0.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Residents
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50/80 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-heading">
              {dashboardMetrics.total_residents_count}
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              Active Members
            </span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100/80 flex items-center justify-between">
            <span>Family Directory</span>
            <Link
              to="/Society/Admin/residents"
              className="text-emerald-700 font-semibold hover:underline"
            >
              Directory →
            </Link>
          </div>
        </div>

        {/* Metric 3: Maintenance Collections */}
        <div className="backdrop-blur-md bg-white/70 border border-white/80 shadow-xs hover:shadow-md rounded-2xl p-4 transition-all hover:-translate-y-0.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Collections
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50/80 text-teal-600 flex items-center justify-center border border-teal-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-700 font-heading">
              ₹{dashboardMetrics.total_collected_amount_inr.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {collectionRate}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100/80 flex items-center justify-between">
            <span>Due: ₹{dashboardMetrics.total_due_amount_inr.toLocaleString("en-IN")}</span>
            <Link
              to="/Society/Admin/billing"
              className="text-teal-700 font-semibold hover:underline"
            >
              Billing →
            </Link>
          </div>
        </div>

        {/* Metric 4: Society Expenses */}
        <div className="backdrop-blur-md bg-white/70 border border-white/80 shadow-xs hover:shadow-md rounded-2xl p-4 transition-all hover:-translate-y-0.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Society Spend
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50/80 text-rose-600 flex items-center justify-center border border-rose-100">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-rose-700 font-heading">
              ₹{dashboardMetrics.total_expenses_amount_inr.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              {dashboardMetrics.total_expense_vouchers_count} bills
            </span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100/80 flex items-center justify-between">
            <span>Paid: ₹{dashboardMetrics.paid_expenses_amount_inr.toLocaleString("en-IN")}</span>
            <Link
              to="/Society/Admin/accounts-payable"
              className="text-rose-600 font-semibold hover:underline"
            >
              Payouts →
            </Link>
          </div>
        </div>

        {/* Metric 5: Live Campus Visitors */}
        <div className="backdrop-blur-md bg-white/70 border border-white/80 shadow-xs hover:shadow-md rounded-2xl p-4 transition-all hover:-translate-y-0.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Live Visitors
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50/80 text-purple-600 flex items-center justify-center border border-purple-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-heading">
              {dashboardMetrics.active_campus_visitors_count}
            </span>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              On-Campus
            </span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100/80 flex items-center justify-between">
            <span>{dashboardMetrics.total_gates_count} Gates Live</span>
            <Link
              to="/Society/Admin/visitor-logs"
              className="text-purple-700 font-semibold hover:underline"
            >
              Logs →
            </Link>
          </div>
        </div>

        {/* Metric 6: Action Items (KYC & Complaints) */}
        <div className={`backdrop-blur-md rounded-2xl p-4 transition-all hover:-translate-y-0.5 space-y-2 ${
          dashboardMetrics.pending_approvals_count > 0 || dashboardMetrics.open_helpdesk_tickets_count > 0
            ? "bg-amber-50/70 border border-amber-200/80 shadow-xs"
            : "bg-white/70 border border-white/80 shadow-xs"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Pending Actions
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center border border-amber-200">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-950 font-heading">
              {dashboardMetrics.pending_approvals_count + dashboardMetrics.open_helpdesk_tickets_count}
            </span>
            <span className="text-[11px] font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-full">
              {dashboardMetrics.pending_approvals_count} KYC • {dashboardMetrics.open_helpdesk_tickets_count} Tkts
            </span>
          </div>
          <div className="text-[11px] text-amber-800 pt-1.5 border-t border-amber-200/60 flex items-center justify-between">
            <span>Requires Review</span>
            <Link
              to="/Society/Admin/residents?tab=MOBILE_APPROVALS"
              className="text-amber-900 font-bold hover:underline"
            >
              Inspect →
            </Link>
          </div>
        </div>
      </div>

      {/* 3. DEDICATED FINANCIAL GLASS COCKPIT: MAINTENANCE VS EXPENSES */}
      <div className="space-y-4">
        {/* Financial Header with Net Balance Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Financial Health & Cashflow Cockpit
              </h2>
              <p className="text-[11px] text-slate-500">
                Live reconciliation of member maintenance inflow versus society operating expenses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 border border-slate-200/80 shadow-xs">
              <span className="text-slate-500">Net Society Balance:</span>
              <span className={`font-mono font-bold ${
                netCashflowInr >= 0 ? "text-emerald-700" : "text-rose-700"
              }`}>
                {netCashflowInr >= 0 ? "+" : ""}₹{netCashflowInr.toLocaleString("en-IN")}
              </span>
            </div>

            <Link
              to="/Society/Admin/reports"
              className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white/80 hover:bg-white px-3 py-1 rounded-full border border-slate-200/80 shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Full Ledger</span>
            </Link>
          </div>
        </div>

        {/* Dual Bento Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bento Card 1: Maintenance Invoicing & Collections */}
          <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-3xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Card Top Title */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">
                      Maintenance Billing & Recovery
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Monthly member invoices and collections
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {collectionRate}% Collected
                  </span>
                </div>
              </div>

              {/* Maintenance Metrics Trio Bar */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Billed
                  </span>
                  <p className="text-base font-extrabold text-slate-900 font-heading mt-0.5">
                    ₹{dashboardMetrics.total_billed_amount_inr.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {dashboardMetrics.total_invoices_count} Invoices
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    Collected
                  </span>
                  <p className="text-base font-extrabold text-emerald-700 font-heading mt-0.5">
                    ₹{dashboardMetrics.total_collected_amount_inr.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium">
                    {dashboardMetrics.paid_invoices_count} Paid Full
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                    Outstanding
                  </span>
                  <p className="text-base font-extrabold text-rose-700 font-heading mt-0.5">
                    ₹{dashboardMetrics.total_due_amount_inr.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-rose-600 font-medium">
                    {dashboardMetrics.overdue_invoices_count} Overdue Flats
                  </p>
                </div>
              </div>

              {/* Overdue Flats List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Flats with Pending Maintenance Dues
                  </span>
                  <Link
                    to="/Society/Admin/billing"
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="space-y-2">
                  {dashboardMetrics.top_overdue_invoices &&
                  dashboardMetrics.top_overdue_invoices.length > 0 ? (
                    dashboardMetrics.top_overdue_invoices.map((invItem) => (
                      <div
                        key={invItem.invoice_id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/60 hover:bg-white border border-slate-200/70 shadow-2xs hover:shadow-xs transition-all"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              Wing {invItem.wing_name} - Flat {invItem.flat_number}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {invItem.invoice_number}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {invItem.billing_period_label} • Due:{" "}
                            {invItem.due_date ? String(invItem.due_date) : "Immediate"}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-extrabold text-rose-700 font-heading">
                            ₹{Number(invItem.outstanding_balance_inr || 0).toLocaleString("en-IN")}
                          </span>
                          <p className="text-[10px] font-semibold text-rose-600">
                            {invItem.payment_status}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      All maintenance invoices are fully collected!
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                GST invoicing, automated penalties & receipt printing
              </span>
              <Link
                to="/Society/Admin/billing"
                className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Billing Center</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Card 2: Society Expenses & Accounts Payable */}
          <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-3xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Card Top Title */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">
                      Expense Management & Payables
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Vendor vouchers, utilities, security & AMC
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900">
                    ₹{dashboardMetrics.total_expenses_amount_inr.toLocaleString("en-IN")}
                  </span>
                  <p className="text-[10px] text-slate-400">Total Spend</p>
                </div>
              </div>

              {/* Expense Metrics Trio Bar */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Gross Spend
                  </span>
                  <p className="text-base font-extrabold text-slate-900 font-heading mt-0.5">
                    ₹{dashboardMetrics.total_expenses_amount_inr.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {dashboardMetrics.total_expense_vouchers_count} Bills Recorded
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    Disbursed
                  </span>
                  <p className="text-base font-extrabold text-emerald-700 font-heading mt-0.5">
                    ₹{dashboardMetrics.paid_expenses_amount_inr.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium">
                    Bank / Cheque / UPI
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                    Pending
                  </span>
                  <p className="text-base font-extrabold text-amber-700 font-heading mt-0.5">
                    ₹{dashboardMetrics.pending_expenses_amount_inr.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-amber-600 font-medium">
                    Awaiting Approval
                  </p>
                </div>
              </div>

              {/* Top Expense Categories Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Major Operating Expenditure Heads
                  </span>
                  <Link
                    to="/Society/Admin/accounts-payable"
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {dashboardMetrics.top_expense_categories &&
                  dashboardMetrics.top_expense_categories.length > 0 ? (
                    dashboardMetrics.top_expense_categories.map((expCategory, index) => {
                      const totalExpenses = dashboardMetrics.total_expenses_amount_inr || 1;
                      const percentage = Math.round(
                        (Number(expCategory.head_total_inr) / totalExpenses) * 100
                      );
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800">
                              {expCategory.head_name}
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              ₹{Number(expCategory.head_total_inr).toLocaleString("en-IN")}{" "}
                              <span className="text-slate-400 font-normal">({percentage}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No expense vouchers recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                TDS deductions, GST vendor input & cash book
              </span>
              <Link
                to="/Society/Admin/accounts-payable"
                className="font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Expense Vouchers</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. REAL-TIME CAMPUS ACTIVITY, GATES & CIRCULARS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left Column (2 Cols): Live Gate Feed & Helpdesk */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Center: Pending Approval Banner if any */}
          {dashboardMetrics.pending_approvals_count > 0 && (
            <div className="backdrop-blur-md bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300/80 rounded-2xl p-4 shadow-xs flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950 font-heading">
                    {dashboardMetrics.pending_approvals_count} Resident Registration Requests Awaiting Verification
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Residents have submitted Aadhaar cards, Flat Index copies, or Rent Agreements from the mobile app for your review.
                  </p>
                </div>
              </div>
              <Link
                to="/Society/Admin/residents?tab=MOBILE_APPROVALS"
                className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all hover:scale-[1.02]"
              >
                Review Documents
              </Link>
            </div>
          )}

          {/* Real-time Campus Visitor & Gate Activity Feed */}
          <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    Live Campus Gate & Visitor Activity
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Real-time ingress and egress logs across society security gates
                  </p>
                </div>
              </div>
              <Link
                to="/Society/Admin/visitor-logs"
                className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1 hover:underline"
              >
                <span>Full Gate Register</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {dashboardMetrics.recent_visitors && dashboardMetrics.recent_visitors.length > 0 ? (
                dashboardMetrics.recent_visitors.map((visitorItem) => {
                  const isCurrentlyInside = !visitorItem.exit_timestamp;
                  return (
                    <div
                      key={visitorItem.visit_log_id}
                      className="p-3.5 rounded-2xl bg-white/60 hover:bg-white border border-slate-200/70 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                            isCurrentlyInside
                              ? "bg-purple-50 text-purple-700 border-purple-200/60"
                              : "bg-slate-100 text-slate-600 border-slate-200/60"
                          }`}
                        >
                          {visitorItem.visitor_category === "DELIVERY" ? (
                            <Briefcase className="w-4 h-4 text-amber-600" />
                          ) : visitorItem.visitor_category === "SERVICE_PROVIDER" ? (
                            <UserCheck className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Users className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">
                              {visitorItem.visitor_full_name}
                            </span>
                            {visitorItem.company_brand_name && (
                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                {visitorItem.company_brand_name}
                              </span>
                            )}
                            {visitorItem.vehicle_registration_number && (
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                                {visitorItem.vehicle_registration_number}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Visiting Flat{" "}
                            <span className="font-semibold text-slate-800">
                              {visitorItem.wing_name ? `Wing ${visitorItem.wing_name} - ` : ""}
                              {visitorItem.flat_number || "Campus"}
                            </span>{" "}
                            • Ph: {visitorItem.visitor_phone_number}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isCurrentlyInside ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200/70 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                            Inside Campus
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                            Exited
                          </span>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">
                          {visitorItem.entry_timestamp
                            ? new Date(visitorItem.entry_timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No visitor check-ins recorded today.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Tablet PIN gate app integration & delivery vehicle logs
              </span>
              <Link
                to="/Society/Admin/visitor-logs"
                className="font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1"
              >
                <span>Live Guard Tablet Logs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Active Helpdesk & Complaints Priority Queue */}
          <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    High Priority Helpdesk & Maintenance Tickets
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Complaints requiring technician dispatch and SLA resolution
                  </p>
                </div>
              </div>
              <Link
                to="/Society/Admin/helpdesk"
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
              >
                <span>Helpdesk Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {dashboardMetrics.recent_tickets && dashboardMetrics.recent_tickets.length > 0 ? (
                dashboardMetrics.recent_tickets.map((ticketItem) => {
                  const isCritical = ticketItem.priority === "CRITICAL";
                  const isHigh = ticketItem.priority === "HIGH";
                  return (
                    <div
                      key={ticketItem.ticket_id}
                      className="p-3.5 rounded-2xl bg-white/60 hover:bg-white border border-slate-200/70 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {ticketItem.ticket_number}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isCritical
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : isHigh
                                ? "bg-orange-100 text-orange-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {ticketItem.priority}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {ticketItem.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {ticketItem.wing_name} - Flat {ticketItem.flat_number} • Status:{" "}
                          <span className="font-semibold text-slate-700">
                            {ticketItem.status}
                          </span>
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <Link
                          to="/Society/Admin/helpdesk"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition-all"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No active complaints found. Society operations running smoothly!
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Staff dispatch, photo attachments & resident resolution ratings
              </span>
              <Link
                to="/Society/Admin/helpdesk"
                className="font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1"
              >
                <span>Helpdesk Resolution Center</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Operations Hub & Circulars */}
        <div className="space-y-6">
          {/* Quick Operations Navigation Hub */}
          <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Society Management Hub
            </h3>

            <div className="space-y-2">
              <Link
                to="/Society/Admin/residents?tab=WINGS_AND_FLATS"
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/90 border border-slate-100 hover:border-blue-200 transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-blue-100">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      Wings & Flats Stack
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Floor elevation & apartment occupancy
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </Link>

              <Link
                to="/Society/Admin/staff"
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/90 border border-slate-100 hover:border-teal-200 transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-teal-100">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      Daily Staff & Helpers
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Maids, drivers, cooks & attendance
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
              </Link>

              <Link
                to="/Society/Admin/gates"
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/90 border border-slate-100 hover:border-purple-200 transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-purple-100">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                      Security Gates & Guards
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Main gates, guard PINs & tablets
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
              </Link>

              <Link
                to="/Society/Admin/reports"
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/90 border border-slate-100 hover:border-emerald-200 transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-100">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Financial Reports
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Ledger statement, audit & cash book
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
              </Link>
            </div>
          </div>

          {/* Active Broadcast Circulars / Notices */}
          <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-100">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    Active Circulars
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Broadcasted to resident mobile apps
                  </p>
                </div>
              </div>
              <Link
                to="/Society/Admin/notices"
                className="text-xs font-semibold text-cyan-700 hover:underline"
              >
                Notices →
              </Link>
            </div>

            <div className="space-y-2.5">
              {dashboardMetrics.recent_notices && dashboardMetrics.recent_notices.length > 0 ? (
                dashboardMetrics.recent_notices.map((noticeItem) => (
                  <div
                    key={noticeItem.notice_id}
                    className="p-3.5 rounded-2xl bg-white/60 border border-slate-100 space-y-1 hover:bg-white transition-all shadow-2xs hover:shadow-xs"
                  >
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {noticeItem.notice_title}
                    </h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {noticeItem.notice_body_content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs">
                  No active notices broadcasted.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}