import React, { useState, useEffect } from "react";
import {
  Receipt,
  Users,
  ShieldCheck,
  Settings,
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  IndianRupee,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  ExternalLink,
} from "lucide-react";

import { ExpenseVoucherFormModal } from "./components/ExpenseVoucherFormModal";
import { VendorDirectoryList } from "./components/VendorDirectoryList";
import { AmcTrackerCards } from "./components/AmcTrackerCards";
import { ChartOfAccountsAndTaxSetup } from "./components/ChartOfAccountsAndTaxSetup";
import { AccountsPayableReportsView } from "./components/AccountsPayableReportsView";

export function ExpenseManagementAndAccountingPage() {
  const [activeTab, setActiveTab] = useState("VOUCHERS"); // VOUCHERS | VENDORS | AMC | SETUP | REPORTS
  const [authToken, setAuthToken] = useState("");

  // Master Data State
  const [expenseHeads, setExpenseHeads] = useState([]);
  const [tdsConfigurations, setTdsConfigurations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [amcContracts, setAmcContracts] = useState([]);
  const [vouchers, setVouchers] = useState([]);

  // Filter & Search
  const [voucherSearchQuery, setVoucherSearchQuery] = useState("");
  const [selectedHeadFilter, setSelectedHeadFilter] = useState("");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState("");

  // Modals & Feedback
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedVoucherForAttachment, setSelectedVoucherForAttachment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Initialize Auth Token and Load Data
  useEffect(() => {
    const storedToken =
      localStorage.getItem("smart_nivas_auth_token") ||
      localStorage.getItem("smart_nivas_access_token") ||
      sessionStorage.getItem("smart_nivas_auth_token") ||
      "";
    setAuthToken(storedToken);
  }, []);

  const loadAllPayableData = async () => {
    const currentToken =
      authToken ||
      localStorage.getItem("smart_nivas_auth_token") ||
      localStorage.getItem("smart_nivas_access_token") ||
      sessionStorage.getItem("smart_nivas_auth_token");

    if (!currentToken) return;

    try {
      setIsLoading(true);
      const authHeader = { Authorization: `Bearer ${currentToken}` };

      const [headsResponse, tdsResponse, vendorsResponse, amcResponse, vouchersResponse] =
        await Promise.all([
          fetch("/api/admin/accounts-payable/expense-heads", { headers: authHeader }),
          fetch("/api/admin/accounts-payable/tds-rates", { headers: authHeader }),
          fetch("/api/admin/accounts-payable/vendors", { headers: authHeader }),
          fetch("/api/admin/accounts-payable/amc-contracts", { headers: authHeader }),
          fetch("/api/admin/accounts-payable/vouchers", { headers: authHeader }),
        ]);

      const [headsData, tdsData, vendorsData, amcData, vouchersData] = await Promise.all([
        headsResponse.json(),
        tdsResponse.json(),
        vendorsResponse.json(),
        amcResponse.json(),
        vouchersResponse.json(),
      ]);

      if (headsData.success) setExpenseHeads(headsData.expense_heads || []);
      if (tdsData.success) setTdsConfigurations(tdsData.tds_rates || []);
      if (vendorsData.success) setVendors(vendorsData.vendors || []);
      if (amcData.success) setAmcContracts(amcData.amc_contracts || []);
      if (vouchersData.success) setVouchers(vouchersData.vouchers || []);

      setIsLoading(false);
    } catch (loadError) {
      console.error("Failed to load Accounts Payable data:", loadError);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      loadAllPayableData();
    }
  }, [authToken]);

  // Handle Save Expense Voucher
  const handleSaveVoucher = async (voucherPayload) => {
    const httpResponse = await fetch("/api/admin/accounts-payable/vouchers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(voucherPayload),
    });
    const responseJson = await httpResponse.json();
    if (!responseJson.success) {
      throw new Error(responseJson.error_message || "Failed to record expense voucher");
    }
    setStatusMessage({
      type: "SUCCESS",
      text: `Voucher ${responseJson.voucher_number} successfully recorded & journal posted!`,
    });
    setTimeout(() => setStatusMessage(null), 5000);
    loadAllPayableData();
  };

  // Handle Save Vendor
  const handleSaveVendor = async (vendorPayload) => {
    const isUpdate = Boolean(vendorPayload.vendor_id);
    const url = isUpdate
      ? `/api/admin/accounts-payable/vendors/${vendorPayload.vendor_id}`
      : "/api/admin/accounts-payable/vendors";
    const method = isUpdate ? "PUT" : "POST";

    const httpResponse = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(vendorPayload),
    });
    const responseJson = await httpResponse.json();
    if (!responseJson.success) {
      throw new Error(responseJson.error_message || "Failed to save vendor details");
    }
    setStatusMessage({
      type: "SUCCESS",
      text: responseJson.message || "Vendor updated successfully!",
    });
    setTimeout(() => setStatusMessage(null), 4000);
    loadAllPayableData();
  };

  // Handle Save AMC
  const handleSaveAmcContract = async (amcPayload) => {
    const isUpdate = Boolean(amcPayload.amc_id);
    const url = isUpdate
      ? `/api/admin/accounts-payable/amc-contracts/${amcPayload.amc_id}`
      : "/api/admin/accounts-payable/amc-contracts";
    const method = isUpdate ? "PUT" : "POST";

    const httpResponse = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(amcPayload),
    });
    const responseJson = await httpResponse.json();
    if (!responseJson.success) {
      throw new Error(responseJson.error_message || "Failed to save AMC contract");
    }
    setStatusMessage({
      type: "SUCCESS",
      text: responseJson.message || "AMC Contract saved successfully!",
    });
    setTimeout(() => setStatusMessage(null), 4000);
    loadAllPayableData();
  };

  // Handle Save Expense Head
  const handleSaveExpenseHead = async (headPayload) => {
    const isUpdate = Boolean(headPayload.expense_head_id);
    const url = isUpdate
      ? `/api/admin/accounts-payable/expense-heads/${headPayload.expense_head_id}`
      : "/api/admin/accounts-payable/expense-heads";
    const method = isUpdate ? "PUT" : "POST";

    const httpResponse = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(headPayload),
    });
    const responseJson = await httpResponse.json();
    if (!responseJson.success) {
      throw new Error(responseJson.error_message || "Failed to save Expense Head");
    }
    setStatusMessage({
      type: "SUCCESS",
      text: responseJson.message || "Expense head saved successfully!",
    });
    setTimeout(() => setStatusMessage(null), 4000);
    loadAllPayableData();
  };

  // Handle Save TDS Rule
  const handleSaveTdsConfiguration = async (tdsPayload) => {
    const isUpdate = Boolean(tdsPayload.tds_config_id);
    const url = isUpdate
      ? `/api/admin/accounts-payable/tds-rates/${tdsPayload.tds_config_id}`
      : "/api/admin/accounts-payable/tds-rates";
    const method = isUpdate ? "PUT" : "POST";

    const httpResponse = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(tdsPayload),
    });
    const responseJson = await httpResponse.json();
    if (!responseJson.success) {
      throw new Error(responseJson.error_message || "Failed to save TDS rule");
    }
    setStatusMessage({
      type: "SUCCESS",
      text: responseJson.message || "TDS rule saved successfully!",
    });
    setTimeout(() => setStatusMessage(null), 4000);
    loadAllPayableData();
  };

  // Filter Vouchers
  const filteredVouchers = vouchers.filter((voucherItem) => {
    const query = voucherSearchQuery.toLowerCase();
    const matchesSearch =
      voucherItem.voucher_number?.toLowerCase().includes(query) ||
      voucherItem.vendor_name?.toLowerCase().includes(query) ||
      voucherItem.expense_head_name?.toLowerCase().includes(query) ||
      voucherItem.invoice_bill_number?.toLowerCase().includes(query) ||
      voucherItem.payment_reference_number?.toLowerCase().includes(query);

    const matchesHead = selectedHeadFilter
      ? String(voucherItem.expense_head_id) === String(selectedHeadFilter)
      : true;

    const matchesVendor = selectedVendorFilter
      ? String(voucherItem.vendor_id) === String(selectedVendorFilter)
      : true;

    return matchesSearch && matchesHead && matchesVendor;
  });

  const totalVouchersGross = filteredVouchers.reduce(
    (sum, v) => sum + parseFloat(v.gross_amount_inr || 0),
    0
  );
  const totalVouchersTds = filteredVouchers.reduce(
    (sum, v) => sum + parseFloat(v.tds_deducted_amount_inr || 0),
    0
  );
  const totalVouchersNet = filteredVouchers.reduce(
    (sum, v) => sum + parseFloat(v.net_payable_amount_inr || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <IndianRupee className="w-7 h-7 text-indigo-600" />
            Expense Management & Accounting (Accounts Payable)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Vendor payouts, AMC contracts tracking, statutory TDS deductions & audit ledgers
          </p>
        </div>

        {/* Global Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsVoucherModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense Voucher</span>
          </button>
        </div>
      </div>

      {/* Status Alert Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-in fade-in ${
            statusMessage.type === "SUCCESS"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {statusMessage.type === "SUCCESS" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("VOUCHERS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "VOUCHERS"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Expense Vouchers Register</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === "VOUCHERS"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {vouchers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("VENDORS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "VENDORS"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Vendor Directory</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === "VENDORS"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {vendors.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("AMC")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "AMC"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>AMC Tracker & Badges</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === "AMC"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {amcContracts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("SETUP")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "SETUP"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Chart of Accounts & TDS Setup</span>
          </button>

          <button
            onClick={() => setActiveTab("REPORTS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "REPORTS"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Auditing Reports & P&L</span>
          </button>
        </div>
      </div>

      {/* TAB 1: EXPENSE VOUCHERS JOURNAL */}
      {activeTab === "VOUCHERS" && (
        <div className="space-y-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Gross Vouchers
              </span>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                ₹{totalVouchersGross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total TDS Withheld
              </span>
              <div className="mt-1 text-2xl font-bold text-amber-700">
                ₹{totalVouchersTds.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Net Disbursed Payable
              </span>
              <div className="mt-1 text-2xl font-bold text-indigo-700">
                ₹{totalVouchersNet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search voucher, vendor, bill no, UTR..."
                value={voucherSearchQuery}
                onChange={(event) => setVoucherSearchQuery(event.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedHeadFilter}
                onChange={(event) => setSelectedHeadFilter(event.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
              >
                <option value="">All Expense Heads</option>
                {expenseHeads.map((headItem) => (
                  <option key={headItem.expense_head_id} value={headItem.expense_head_id}>
                    {headItem.head_name}
                  </option>
                ))}
              </select>

              <select
                value={selectedVendorFilter}
                onChange={(event) => setSelectedVendorFilter(event.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
              >
                <option value="">All Vendors</option>
                {vendors.map((vendorItem) => (
                  <option key={vendorItem.vendor_id} value={vendorItem.vendor_id}>
                    {vendorItem.vendor_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vouchers Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Voucher / Date</th>
                    <th className="px-5 py-3.5">Vendor & Expense Head</th>
                    <th className="px-5 py-3.5">Invoice / Ref No</th>
                    <th className="px-5 py-3.5 text-right">Gross (₹)</th>
                    <th className="px-5 py-3.5 text-right">TDS (₹)</th>
                    <th className="px-5 py-3.5 text-right">Net Paid (₹)</th>
                    <th className="px-5 py-3.5 text-center">Attachment</th>
                    <th className="px-5 py-3.5">Payment Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVouchers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-5 py-12 text-center text-slate-400">
                        No expense vouchers recorded. Click "Record Expense Voucher" to post your first journal entry.
                      </td>
                    </tr>
                  ) : (
                    filteredVouchers.map((voucherItem) => (
                      <tr key={voucherItem.voucher_id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-4">
                          <div className="font-mono font-bold text-indigo-600">
                            {voucherItem.voucher_number}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {voucherItem.voucher_date}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">
                            {voucherItem.vendor_name || (
                              <span className="text-slate-400 italic">Direct / Petty Cash</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                            <span className="font-medium text-slate-800">
                              {voucherItem.expense_head_name}
                            </span>
                            {voucherItem.amc_title && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px]">
                                AMC
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs font-mono text-slate-600">
                          {voucherItem.invoice_bill_number ? (
                            <div>Bill: {voucherItem.invoice_bill_number}</div>
                          ) : (
                            <span className="text-slate-400">No Bill No</span>
                          )}
                          {voucherItem.remarks && (
                            <div className="text-[11px] text-slate-400 truncate max-w-xs font-sans">
                              {voucherItem.remarks}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right font-mono font-bold text-slate-900">
                          ₹{parseFloat(voucherItem.gross_amount_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-5 py-4 text-right font-mono text-xs text-amber-700">
                          ₹{parseFloat(voucherItem.tds_deducted_amount_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          {voucherItem.tds_percentage > 0 && (
                            <span className="block text-[10px] text-slate-400">
                              ({voucherItem.tds_percentage}%)
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right font-mono font-bold text-emerald-700">
                          ₹{parseFloat(voucherItem.net_payable_amount_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-5 py-4 text-center">
                          {voucherItem.invoice_attachment_url ? (
                            <button
                              onClick={() => setSelectedVoucherForAttachment(voucherItem)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold transition"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Bill</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">
                            {voucherItem.payment_mode}
                          </span>
                          {voucherItem.payment_reference_number && (
                            <div className="font-mono text-slate-500 text-[11px]">
                              Ref: {voucherItem.payment_reference_number}
                            </div>
                          )}
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

      {/* TAB 2: VENDOR DIRECTORY */}
      {activeTab === "VENDORS" && (
        <VendorDirectoryList
          vendors={vendors}
          tdsConfigurations={tdsConfigurations}
          onSaveVendor={handleSaveVendor}
        />
      )}

      {/* TAB 3: AMC CONTRACT TRACKER */}
      {activeTab === "AMC" && (
        <AmcTrackerCards
          amcContracts={amcContracts}
          vendors={vendors}
          expenseHeads={expenseHeads}
          onSaveAmcContract={handleSaveAmcContract}
        />
      )}

      {/* TAB 4: CONFIGURATION SETUP */}
      {activeTab === "SETUP" && (
        <ChartOfAccountsAndTaxSetup
          expenseHeads={expenseHeads}
          tdsConfigurations={tdsConfigurations}
          onSaveExpenseHead={handleSaveExpenseHead}
          onSaveTdsConfiguration={handleSaveTdsConfiguration}
        />
      )}

      {/* TAB 5: FINANCIAL AUDITING & REPORTS */}
      {activeTab === "REPORTS" && (
        <AccountsPayableReportsView vendors={vendors} token={authToken} />
      )}

      {/* Expense Voucher Entry Form Modal */}
      <ExpenseVoucherFormModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        expenseHeads={expenseHeads}
        vendors={vendors}
        tdsConfigurations={tdsConfigurations}
        amcContracts={amcContracts}
        onSaveVoucher={handleSaveVoucher}
      />

      {/* Invoice Attachment Preview Modal */}
      {selectedVoucherForAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Invoice Attachment</h3>
                <p className="text-xs text-slate-400">
                  Voucher: {selectedVoucherForAttachment.voucher_number} • File:{" "}
                  {selectedVoucherForAttachment.invoice_attachment_filename || "Bill Document"}
                </p>
              </div>
              <button
                onClick={() => setSelectedVoucherForAttachment(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-6 max-h-[75vh] overflow-y-auto flex items-center justify-center bg-slate-100">
              {selectedVoucherForAttachment.invoice_attachment_url.startsWith("data:application/pdf") ? (
                <iframe
                  src={selectedVoucherForAttachment.invoice_attachment_url}
                  className="w-full h-[60vh] rounded-xl border border-slate-300"
                  title="PDF Attachment Viewer"
                />
              ) : (
                <img
                  src={selectedVoucherForAttachment.invoice_attachment_url}
                  alt="Invoice Bill Attachment"
                  className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
