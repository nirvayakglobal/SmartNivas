import React, { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  ArrowDownLeft,
  Receipt,
  Download,
  Calendar,
  Filter,
  Search,
  AlertCircle,
  CheckCircle2,
  PieChart,
  TrendingUp,
  CreditCard,
  Building,
  User,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export function FinancialReportsPage() {
  const [activeReportTab, setActiveReportTab] = useState("DEFAULTERS"); // DEFAULTERS | COLLECTIONS | GST

  // Date filters
  const today = new Date().toISOString().split("T")[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [asOfDate, setAsOfDate] = useState(today);
  const [groupBy, setGroupBy] = useState("DAILY"); // DAILY | MONTHLY

  // Report datasets
  const [defaultersData, setDefaultersData] = useState(null);
  const [collectionData, setCollectionData] = useState(null);
  const [gstData, setGstData] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const token = localStorage.getItem("smart_nivas_auth_token");
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch report data
  const loadActiveReport = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      if (activeReportTab === "DEFAULTERS") {
        const res = await fetch(`/api/admin/billing/reports/defaulters-aging?as_of_date=${asOfDate}`, { headers });
        const json = await res.json();
        if (json.success) setDefaultersData(json.data);
        else setErrorMessage(json.message);
      } else if (activeReportTab === "COLLECTIONS") {
        const res = await fetch(`/api/admin/billing/reports/collections?start_date=${startDate}&end_date=${endDate}&group_by=${groupBy}`, { headers });
        const json = await res.json();
        if (json.success) setCollectionData(json.data);
        else setErrorMessage(json.message);
      } else if (activeReportTab === "GST") {
        const res = await fetch(`/api/admin/billing/reports/tax-gst-output?start_date=${startDate}&end_date=${endDate}`, { headers });
        const json = await res.json();
        if (json.success) setGstData(json.data);
        else setErrorMessage(json.message);
      }
    } catch (err) {
      setErrorMessage("Network error fetching report data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveReport();
  }, [activeReportTab, asOfDate, startDate, endDate, groupBy]);

  // CSV Exporter Helper
  const exportToCSV = (filename, rows) => {
    if (!rows || !rows.length) return;
    const separator = ",";
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      "\n" +
      rows
        .map((row) =>
          keys
            .map((k) => {
              let cell = row[k] === null || row[k] === undefined ? "" : row[k];
              cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
              return cell;
            })
            .join(separator)
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 antialiased pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600" />
            Financial & Statutory Reports
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Defaulters aging analysis (30/60/90+ days), collection register by payment mode & GST output filing statement.
          </p>
        </div>

        {/* Global CSV Download Button */}
        <div>
          {activeReportTab === "DEFAULTERS" && defaultersData?.defaulters?.length > 0 && (
            <button
              onClick={() => exportToCSV("defaulters_aging_report", defaultersData.defaulters)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Download Aging CSV</span>
            </button>
          )}

          {activeReportTab === "COLLECTIONS" && collectionData?.receipts?.length > 0 && (
            <button
              onClick={() => exportToCSV("collection_receipts_report", collectionData.receipts)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Download Receipts CSV</span>
            </button>
          )}

          {activeReportTab === "GST" && gstData?.invoice_register?.length > 0 && (
            <button
              onClick={() => exportToCSV("gst_output_register", gstData.invoice_register)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Download GSTR-1 Register CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveReportTab("DEFAULTERS")}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeReportTab === "DEFAULTERS"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Defaulters & Aging (30 / 60 / 90+ Days)</span>
        </button>

        <button
          onClick={() => setActiveReportTab("COLLECTIONS")}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeReportTab === "COLLECTIONS"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Payment Collection Register</span>
        </button>

        <button
          onClick={() => setActiveReportTab("GST")}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeReportTab === "GST"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Tax / GST Output Statement</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {activeReportTab === "DEFAULTERS" ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Aging As of Date:
            </span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Period:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {activeReportTab === "COLLECTIONS" && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs ml-4 font-semibold">
                <button
                  onClick={() => setGroupBy("DAILY")}
                  className={`px-3 py-1 rounded-lg transition ${
                    groupBy === "DAILY" ? "bg-white text-blue-700 font-bold shadow-xs" : "text-slate-500"
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setGroupBy("MONTHLY")}
                  className={`px-3 py-1 rounded-lg transition ${
                    groupBy === "MONTHLY" ? "bg-white text-blue-700 font-bold shadow-xs" : "text-slate-500"
                  }`}
                >
                  Monthly
                </button>
              </div>
            )}
          </div>
        )}

        {/* Search Input for filtering table rows */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search within report..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 w-48 sm:w-64"
          />
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* =========================================================================
          REPORT TAB 1: DEFAULTERS & AGING REPORT (30 / 60 / 90+ DAYS)
         ========================================================================= */}
      {activeReportTab === "DEFAULTERS" && (
        <div className="space-y-6">
          {/* 4 Aging Buckets Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                Current (0 - 30 Days)
              </span>
              <p className="text-xl font-extrabold text-slate-900 font-heading mt-1">
                ₹{(defaultersData?.summary_buckets?.bucket_0_to_30_inr || 0).toLocaleString("en-IN")}
              </p>
              <span className="text-[11px] text-slate-400">Recently past due</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                31 - 60 Days Overdue
              </span>
              <p className="text-xl font-extrabold text-slate-900 font-heading mt-1">
                ₹{(defaultersData?.summary_buckets?.bucket_31_to_60_inr || 0).toLocaleString("en-IN")}
              </p>
              <span className="text-[11px] text-slate-400">Second reminder issued</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                61 - 90 Days Overdue
              </span>
              <p className="text-xl font-extrabold text-slate-900 font-heading mt-1">
                ₹{(defaultersData?.summary_buckets?.bucket_61_to_90_inr || 0).toLocaleString("en-IN")}
              </p>
              <span className="text-[11px] text-slate-400">Escalated to committee</span>
            </div>

            <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                90+ Days Critical
              </span>
              <p className="text-xl font-extrabold text-rose-700 font-heading mt-1">
                ₹{(defaultersData?.summary_buckets?.bucket_90_plus_inr || 0).toLocaleString("en-IN")}
              </p>
              <span className="text-[11px] text-rose-600 font-semibold">Legal Notice Eligible</span>
            </div>
          </div>

          {/* Aging Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Defaulters Aging Breakdown by Resident Flat
                </h3>
                <p className="text-xs text-slate-400">
                  {defaultersData?.defaulter_units_count || 0} flat accounts with pending dues as of {asOfDate}.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Total Arrears: </span>
                <span className="text-sm font-bold font-mono text-rose-600">
                  ₹{(defaultersData?.summary_buckets?.grand_total_overdue_inr || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Flat Unit</th>
                    <th className="py-3 px-4">Resident</th>
                    <th className="py-3 px-4 text-center">Overdue Days</th>
                    <th className="py-3 px-4 text-right">0 - 30 Days (₹)</th>
                    <th className="py-3 px-4 text-right">31 - 60 Days (₹)</th>
                    <th className="py-3 px-4 text-right">61 - 90 Days (₹)</th>
                    <th className="py-3 px-4 text-right">90+ Days (₹)</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900">Total Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Analyzing aging buckets...
                      </td>
                    </tr>
                  ) : defaultersData?.defaulters?.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <span className="font-semibold text-slate-700">Excellent! Zero Defaulters.</span>
                        <p className="text-xs text-slate-400">All registered flats have cleared their dues on time.</p>
                      </td>
                    </tr>
                  ) : (
                    defaultersData?.defaulters
                      ?.filter(
                        (d) =>
                          d.flat_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          d.wing_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          (d.resident_name || "").toLowerCase().includes(searchFilter.toLowerCase())
                      )
                      .map((d) => (
                        <tr key={d.flat_id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {d.wing_name}-{d.flat_number}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{d.resident_name || "Vacant"}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{d.resident_phone || d.occupancy_status}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                d.max_days_overdue > 90
                                  ? "bg-rose-100 text-rose-800"
                                  : d.max_days_overdue > 60
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {d.max_days_overdue} days
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {parseFloat(d.bucket_0_to_30_inr) > 0 ? `₹${parseFloat(d.bucket_0_to_30_inr).toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {parseFloat(d.bucket_31_to_60_inr) > 0 ? `₹${parseFloat(d.bucket_31_to_60_inr).toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {parseFloat(d.bucket_61_to_90_inr) > 0 ? `₹${parseFloat(d.bucket_61_to_90_inr).toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                            {parseFloat(d.bucket_90_plus_inr) > 0 ? `₹${parseFloat(d.bucket_90_plus_inr).toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 text-sm">
                            ₹{parseFloat(d.total_overdue_balance_inr).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT TAB 2: COLLECTION REPORT (BY PAYMENT MODE: UPI, CASH, CHEQUE, NEFT)
         ========================================================================= */}
      {activeReportTab === "COLLECTIONS" && (
        <div className="space-y-6">
          {/* Summary Split by Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Gross Collections
              </span>
              <p className="text-xl font-extrabold text-slate-900 font-heading mt-1">
                ₹{(collectionData?.summary?.total_collected_inr || 0).toLocaleString("en-IN")}
              </p>
              <span className="text-[11px] text-slate-500">
                {collectionData?.summary?.total_transactions_count || 0} Total Receipts
              </span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                UPI / Dynamic QR
              </span>
              <p className="text-xl font-extrabold text-blue-600 font-heading mt-1">
                ₹{(collectionData?.summary?.total_upi_inr || 0).toLocaleString("en-IN")}
              </p>
              <span className="text-[11px] text-slate-400">Instant settlements</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
                Bank Cheques
              </span>
              <p className="text-xl font-extrabold text-purple-600 font-heading mt-1">
                ₹{(collectionData?.summary?.total_cheque_inr || 0).toLocaleString("en-IN")}
              </p>
              <span className="text-[11px] text-slate-400">Physical bank deposits</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                NEFT / RTGS / IMPS
              </span>
              <p className="text-xl font-extrabold text-indigo-600 font-heading mt-1">
                ₹{(collectionData?.summary?.total_neft_inr || 0).toLocaleString("en-IN")}
              </p>
              <span className="text-[11px] text-slate-400">Direct wire transfers</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                Cash Deposits
              </span>
              <p className="text-xl font-extrabold text-emerald-600 font-heading mt-1">
                ₹{(collectionData?.summary?.total_cash_inr || 0).toLocaleString("en-IN")}
              </p>
              <span className="text-[11px] text-slate-400">Office desk cash</span>
            </div>
          </div>

          {/* Receipts Journal Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Itemized Payment Collection Journal
                </h3>
                <p className="text-xs text-slate-400">
                  Transactions received between {startDate} and {endDate}.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Flat Unit</th>
                    <th className="py-3 px-4">Payer Resident</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Reference / Cheque Details</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading collection receipts...
                      </td>
                    </tr>
                  ) : collectionData?.receipts?.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        No payments received during this selected timeframe.
                      </td>
                    </tr>
                  ) : (
                    collectionData?.receipts
                      ?.filter(
                        (r) =>
                          r.receipt_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          r.flat_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          (r.resident_name || "").toLowerCase().includes(searchFilter.toLowerCase()) ||
                          (r.transaction_reference || "").toLowerCase().includes(searchFilter.toLowerCase()) ||
                          (r.cheque_number || "").toLowerCase().includes(searchFilter.toLowerCase())
                      )
                      .map((r) => (
                        <tr key={r.payment_id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">
                            {r.receipt_number}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {r.payment_date}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {r.wing_name}-{r.flat_number}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {r.resident_name || "N/A"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.payment_mode === "UPI"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : r.payment_mode === "CHEQUE"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : r.payment_mode === "CASH"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              }`}
                            >
                              {r.payment_mode}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {r.cheque_number ? `Cheque #${r.cheque_number} (${r.bank_name || "Bank"})` : r.transaction_reference || "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-600 text-sm">
                            ₹{parseFloat(r.amount_paid_inr).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT TAB 3: TAX / GST OUTPUT STATEMENT (CA FILING READY)
         ========================================================================= */}
      {activeReportTab === "GST" && (
        <div className="space-y-6">
          {/* Statutory GST Filing Summary Card */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  Statutory GST Output Filing Statement
                </h3>
                <p className="text-xs text-slate-500">
                  Legal compliance under Indian GST Act for Cooperative Housing Societies / RWAs.
                </p>
              </div>
              <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono">
                <span className="text-slate-400">Society GSTIN: </span>
                <strong className="text-slate-800">{gstData?.society?.gstin || "NOT CONFIGURED"}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Billed</span>
                <p className="text-base font-extrabold text-slate-900 font-heading mt-0.5">
                  ₹{(gstData?.summary?.total_gross_invoiced_inr || 0).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Exempt Under ₹7.5k</span>
                <p className="text-base font-extrabold text-emerald-700 font-heading mt-0.5">
                  ₹{(gstData?.summary?.total_exempt_inr || 0).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Taxable Value</span>
                <p className="text-base font-extrabold text-blue-700 font-heading mt-0.5">
                  ₹{(gstData?.summary?.total_taxable_inr || 0).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl">
                <span className="text-[10px] font-bold text-indigo-700 uppercase">CGST (9%)</span>
                <p className="text-base font-extrabold text-indigo-700 font-heading mt-0.5">
                  ₹{(gstData?.summary?.total_cgst_inr || 0).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl">
                <span className="text-[10px] font-bold text-indigo-700 uppercase">SGST (9%)</span>
                <p className="text-base font-extrabold text-indigo-700 font-heading mt-0.5">
                  ₹{(gstData?.summary?.total_sgst_inr || 0).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="p-3 bg-indigo-100/70 rounded-xl">
                <span className="text-[10px] font-bold text-indigo-800 uppercase">Total GST Output</span>
                <p className="text-base font-extrabold text-indigo-900 font-heading mt-0.5">
                  ₹{(gstData?.summary?.total_gst_inr || 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* GSTR-1 Outward Supply Invoice Register */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  GSTR-1 Outward Maintenance Supplies Register
                </h3>
                <p className="text-xs text-slate-400">
                  Itemized invoice-by-invoice tax schedule for submission to Chartered Accountant.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Flat Unit</th>
                    <th className="py-3 px-4 text-right">Taxable Val (₹)</th>
                    <th className="py-3 px-4 text-center">Rate</th>
                    <th className="py-3 px-4 text-right">CGST (₹)</th>
                    <th className="py-3 px-4 text-right">SGST (₹)</th>
                    <th className="py-3 px-4 text-right">Total GST (₹)</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900">Total Invoice (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Generating GSTR-1 register...
                      </td>
                    </tr>
                  ) : gstData?.invoice_register?.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-400">
                        No invoices found for the selected period.
                      </td>
                    </tr>
                  ) : (
                    gstData?.invoice_register
                      ?.filter(
                        (i) =>
                          i.invoice_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          i.flat_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          i.wing_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          (i.resident_name || "").toLowerCase().includes(searchFilter.toLowerCase())
                      )
                      .map((i) => (
                        <tr key={i.invoice_id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">
                            {i.invoice_number}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {i.issue_date}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {i.wing_name}-{i.flat_number}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-700">
                            ₹{parseFloat(i.taxable_amount_inr).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            {parseFloat(i.gst_rate_percent) > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                {i.gst_rate_percent}%
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                Exempt
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {parseFloat(i.cgst_inr) > 0 ? `₹${i.cgst_inr}` : "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {parseFloat(i.sgst_inr) > 0 ? `₹${i.sgst_inr}` : "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600">
                            {parseFloat(i.gst_amount_inr) > 0 ? `₹${i.gst_amount_inr}` : "₹0.00"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 text-sm">
                            ₹{parseFloat(i.total_invoice_amount_inr).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
