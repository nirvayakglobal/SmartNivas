import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Building,
  UserCheck,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

export function AccountsPayableReportsView({ vendors, token }) {
  const [reportTab, setReportTab] = useState("PROFIT_LOSS");

  // Date Range state
  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState("2027-03-31");

  // P&L State
  const [profitAndLossData, setProfitAndLossData] = useState(null);
  const [isLoadingPnl, setIsLoadingPnl] = useState(false);

  // Cashbook / Ledger State
  const [cashbookData, setCashbookData] = useState(null);
  const [isLoadingCashbook, setIsLoadingCashbook] = useState(false);

  // Vendor Payout State
  const [selectedVendorId, setSelectedVendorId] = useState(
    vendors.length > 0 ? vendors[0].vendor_id : ""
  );
  const [vendorPayoutData, setVendorPayoutData] = useState(null);
  const [isLoadingPayout, setIsLoadingPayout] = useState(false);

  // Fetch P&L
  const fetchProfitAndLoss = async () => {
    try {
      setIsLoadingPnl(true);
      const httpResponse = await fetch(
        `/api/admin/accounts-payable/reports/profit-loss?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const responseJson = await httpResponse.json();
      if (responseJson.success) {
        setProfitAndLossData(responseJson.report);
      }
      setIsLoadingPnl(false);
    } catch (fetchError) {
      console.error("Failed to load P&L statement:", fetchError);
      setIsLoadingPnl(false);
    }
  };

  // Fetch Cashbook
  const fetchCashbookLedger = async () => {
    try {
      setIsLoadingCashbook(true);
      const httpResponse = await fetch(
        `/api/admin/accounts-payable/reports/cashbook-ledger?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const responseJson = await httpResponse.json();
      if (responseJson.success) {
        setCashbookData(responseJson.ledger);
      }
      setIsLoadingCashbook(false);
    } catch (fetchError) {
      console.error("Failed to load Cashbook ledger:", fetchError);
      setIsLoadingCashbook(false);
    }
  };

  // Fetch Vendor Payout
  const fetchVendorPayout = async (vendorIdToFetch) => {
    if (!vendorIdToFetch) return;
    try {
      setIsLoadingPayout(true);
      const httpResponse = await fetch(
        `/api/admin/accounts-payable/reports/vendor-payouts?vendor_id=${vendorIdToFetch}&start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const responseJson = await httpResponse.json();
      if (responseJson.success) {
        setVendorPayoutData(responseJson.payout_summary);
      }
      setIsLoadingPayout(false);
    } catch (fetchError) {
      console.error("Failed to load Vendor payout:", fetchError);
      setIsLoadingPayout(false);
    }
  };

  useEffect(() => {
    if (reportTab === "PROFIT_LOSS") {
      fetchProfitAndLoss();
    } else if (reportTab === "CASHBOOK") {
      fetchCashbookLedger();
    } else if (reportTab === "VENDOR_PAYOUT" && selectedVendorId) {
      fetchVendorPayout(selectedVendorId);
    }
  }, [reportTab, startDate, endDate, selectedVendorId]);

  return (
    <div className="space-y-6">
      {/* Top Filter & Report Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setReportTab("PROFIT_LOSS")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                reportTab === "PROFIT_LOSS"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Income & Expense (P&L) Statement
            </button>
            <button
              onClick={() => setReportTab("CASHBOOK")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                reportTab === "CASHBOOK"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Ledger & Cashbook Audit Trail
            </button>
            <button
              onClick={() => setReportTab("VENDOR_PAYOUT")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                reportTab === "VENDOR_PAYOUT"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Vendor Payout Summary
            </button>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none"
              />
              <span className="text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* REPORT 1: INCOME & EXPENSE (P&L) STATEMENT */}
      {reportTab === "PROFIT_LOSS" && (
        <div className="space-y-5">
          {isLoadingPnl ? (
            <div className="p-12 text-center text-slate-400">Loading Profit & Loss Statement...</div>
          ) : profitAndLossData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Maintenance Revenue
                    </span>
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-emerald-700">
                    ₹{profitAndLossData.total_income_collected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Billed Total: ₹{profitAndLossData.total_income_billed.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Operating Expenses
                    </span>
                    <TrendingDown className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-rose-700">
                    ₹{profitAndLossData.total_gross_expense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    TDS Withheld: ₹{profitAndLossData.total_tds_withheld.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-5 shadow-sm ${
                    profitAndLossData.is_surplus
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-rose-50 border-rose-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        profitAndLossData.is_surplus ? "text-emerald-800" : "text-rose-800"
                      }`}
                    >
                      {profitAndLossData.is_surplus ? "Net Operating Surplus" : "Net Operating Deficit"}
                    </span>
                    {profitAndLossData.is_surplus ? (
                      <ArrowUpRight className="w-5 h-5 text-emerald-700" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5 text-rose-700" />
                    )}
                  </div>
                  <div
                    className={`mt-2 text-2xl font-black ${
                      profitAndLossData.is_surplus ? "text-emerald-800" : "text-rose-800"
                    }`}
                  >
                    ₹{Math.abs(profitAndLossData.net_surplus_or_deficit).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div
                    className={`mt-1 text-xs font-medium ${
                      profitAndLossData.is_surplus ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {profitAndLossData.is_surplus
                      ? "Healthy Society Reserve Surplus"
                      : "Outflows exceed collections for this period"}
                  </div>
                </div>
              </div>

              {/* Categorized Expenses Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800">
                    Categorized Operational Outflow Statement
                  </h4>
                  <span className="text-xs text-slate-500">
                    {profitAndLossData.start_date} to {profitAndLossData.end_date}
                  </span>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Expense Head</th>
                      <th className="px-5 py-3 text-center">Vouchers</th>
                      <th className="px-5 py-3 text-right">Gross Incurred (₹)</th>
                      <th className="px-5 py-3 text-right">TDS Withheld (₹)</th>
                      <th className="px-5 py-3 text-right">Net Disbursed (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {profitAndLossData.categorized_expenses.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                          No expenses recorded in this period.
                        </td>
                      </tr>
                    ) : (
                      profitAndLossData.categorized_expenses.map((expenseCategoryItem, itemIndex) => (
                        <tr key={itemIndex} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                              {expenseCategoryItem.category_code}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            {expenseCategoryItem.head_name}
                          </td>
                          <td className="px-5 py-3.5 text-center text-xs font-mono text-slate-500">
                            {expenseCategoryItem.voucher_count}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                            ₹{parseFloat(expenseCategoryItem.total_gross_expense).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-xs text-amber-700">
                            ₹{parseFloat(expenseCategoryItem.total_tds_deducted).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-800">
                            ₹{parseFloat(expenseCategoryItem.total_net_disbursed).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan="3" className="px-5 py-3.5 text-slate-800 uppercase text-xs">
                        Total Categorized Outflows
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-rose-700">
                        ₹{profitAndLossData.total_gross_expense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs text-amber-700">
                        ₹{profitAndLossData.total_tds_withheld.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-900">
                        ₹{profitAndLossData.total_net_disbursed.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* REPORT 2: LEDGER & CASHBOOK AUDIT TRAIL */}
      {reportTab === "CASHBOOK" && (
        <div className="space-y-4">
          {isLoadingCashbook ? (
            <div className="p-12 text-center text-slate-400">Loading Ledger & Cashbook...</div>
          ) : cashbookData ? (
            <>
              {/* Cashbook Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Inflow Credits
                  </span>
                  <div className="mt-1 text-xl font-bold text-emerald-700">
                    +₹{cashbookData.total_credit_inflow_inr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Outflow Debits
                  </span>
                  <div className="mt-1 text-xl font-bold text-rose-700">
                    -₹{cashbookData.total_debit_outflow_inr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Net Period Closing Balance
                  </span>
                  <div
                    className={`mt-1 text-xl font-bold ${
                      cashbookData.closing_net_balance_inr >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    ₹{cashbookData.closing_net_balance_inr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800">
                    Chronological Cashbook & Bank Register
                  </h4>
                  <span className="text-xs text-slate-500">Dual-entry audit trail</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Doc Ref</th>
                        <th className="px-4 py-3">Mode</th>
                        <th className="px-4 py-3">Transaction Particulars</th>
                        <th className="px-4 py-3 text-right">Inflow / Credit (+)</th>
                        <th className="px-4 py-3 text-right">Outflow / Debit (-)</th>
                        <th className="px-4 py-3 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cashbookData.ledger_transactions.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                            No cashbook transactions found for the selected period.
                          </td>
                        </tr>
                      ) : (
                        cashbookData.ledger_transactions.map((ledgerItem, index) => {
                          const isInflow = ledgerItem.transaction_type === "INFLOW_RECEIPT";
                          return (
                            <tr key={index} className="hover:bg-slate-50/70 transition">
                              <td className="px-4 py-3 text-xs font-mono text-slate-600">
                                {ledgerItem.transaction_date}
                              </td>
                              <td className="px-4 py-3 text-xs font-mono font-bold text-slate-900">
                                {ledgerItem.document_identifier}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                                  {ledgerItem.transaction_mode}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-700 font-medium max-w-sm">
                                {ledgerItem.transaction_particulars}
                                {ledgerItem.reference_number && (
                                  <span className="block text-[11px] font-mono text-slate-400">
                                    Ref: {ledgerItem.reference_number}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-emerald-700">
                                {isInflow
                                  ? `+₹${parseFloat(ledgerItem.credit_inflow_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-rose-700">
                                {!isInflow
                                  ? `-₹${parseFloat(ledgerItem.debit_outflow_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-900">
                                ₹{parseFloat(ledgerItem.running_balance_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* REPORT 3: VENDOR PAYOUT REPORT */}
      {reportTab === "VENDOR_PAYOUT" && (
        <div className="space-y-4">
          {/* Vendor Picker */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Vendor:
            </label>
            <select
              value={selectedVendorId}
              onChange={(event) => setSelectedVendorId(event.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full sm:w-80"
            >
              {vendors.map((vendorItem) => (
                <option key={vendorItem.vendor_id} value={vendorItem.vendor_id}>
                  {vendorItem.vendor_name} ({vendorItem.vendor_type})
                </option>
              ))}
            </select>
          </div>

          {isLoadingPayout ? (
            <div className="p-12 text-center text-slate-400">Loading Vendor Payout summary...</div>
          ) : vendorPayoutData && vendorPayoutData.vendor ? (
            <div className="space-y-4">
              {/* Vendor Profile & Payout Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{vendorPayoutData.vendor.vendor_name}</h3>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      {vendorPayoutData.vendor.vendor_type} • GSTIN:{" "}
                      <span className="font-mono text-white">{vendorPayoutData.vendor.gstin || "None"}</span> • PAN:{" "}
                      <span className="font-mono text-white">{vendorPayoutData.vendor.pan_number || "None"}</span>
                    </p>
                    <p className="text-xs text-slate-300 mt-2">
                      Bank: {vendorPayoutData.vendor.bank_name || "—"} | A/C:{" "}
                      {vendorPayoutData.vendor.bank_account_number || "—"} | IFSC:{" "}
                      {vendorPayoutData.vendor.bank_ifsc_code || "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 bg-white/10 px-5 py-3 rounded-xl backdrop-blur-sm">
                    <div>
                      <span className="text-[11px] text-indigo-200 uppercase">Gross Billed</span>
                      <p className="text-lg font-bold">
                        ₹{vendorPayoutData.total_gross_billed_inr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-amber-300 uppercase">TDS Withheld</span>
                      <p className="text-lg font-bold text-amber-300">
                        ₹{vendorPayoutData.total_tds_deducted_inr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-emerald-300 uppercase">Net Disbursed</span>
                      <p className="text-lg font-bold text-emerald-400">
                        ₹{vendorPayoutData.total_net_disbursed_inr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vouchers Table for this vendor */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800">
                    Disbursed Expense Vouchers ({vendorPayoutData.total_vouchers_count})
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-5 py-3">Voucher No</th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Head</th>
                        <th className="px-5 py-3">Invoice No</th>
                        <th className="px-5 py-3 text-right">Gross (₹)</th>
                        <th className="px-5 py-3 text-right">TDS (₹)</th>
                        <th className="px-5 py-3 text-right">Net Paid (₹)</th>
                        <th className="px-5 py-3">Payment Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vendorPayoutData.vouchers.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-5 py-8 text-center text-slate-400">
                            No vouchers paid to this vendor in the chosen financial period.
                          </td>
                        </tr>
                      ) : (
                        vendorPayoutData.vouchers.map((voucherItem) => (
                          <tr key={voucherItem.voucher_id} className="hover:bg-slate-50/70 transition">
                            <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">
                              {voucherItem.voucher_number}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-600">
                              {voucherItem.voucher_date}
                            </td>
                            <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">
                              {voucherItem.expense_head_name}
                            </td>
                            <td className="px-5 py-3.5 text-xs font-mono text-slate-500">
                              {voucherItem.invoice_bill_number || "—"}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                              ₹{parseFloat(voucherItem.gross_amount_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono text-xs text-amber-700">
                              ₹{parseFloat(voucherItem.tds_deducted_amount_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              <span className="block text-[10px] text-slate-400">
                                ({voucherItem.tds_percentage}%)
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-700">
                              ₹{parseFloat(voucherItem.net_payable_amount_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-5 py-3.5 text-xs font-mono text-slate-500">
                              {voucherItem.payment_mode} - {voucherItem.payment_reference_number || "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              Please select a vendor to view the financial payout report.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
