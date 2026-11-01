import React, { useState } from "react";
import { Plus, Percent, FolderTree, CheckCircle, AlertCircle, Edit2 } from "lucide-react";

export function ChartOfAccountsAndTaxSetup({
  expenseHeads,
  tdsConfigurations,
  onSaveExpenseHead,
  onSaveTdsConfiguration,
}) {
  const [activeTab, setActiveTab] = useState("EXPENSE_HEADS");

  // Expense Head State
  const [isHeadModalOpen, setIsHeadModalOpen] = useState(false);
  const [editingHead, setEditingHead] = useState(null);
  const [headFormData, setHeadFormData] = useState({
    category_code: "OPERATING_EXPENSE",
    head_name: "",
    description: "",
    is_active: true,
  });

  // TDS Config State
  const [isTdsModalOpen, setIsTdsModalOpen] = useState(false);
  const [editingTds, setEditingTds] = useState(null);
  const [tdsFormData, setTdsFormData] = useState({
    section_code: "194C_INDIVIDUAL",
    vendor_type: "Contractor - Individual",
    tds_percentage: 1.0,
    threshold_limit_inr: 30000.0,
    is_active: true,
  });

  const [errorMessage, setErrorMessage] = useState("");

  // Handle Head Submit
  const handleHeadSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (!headFormData.head_name) {
      setErrorMessage("Please enter an Expense Head name.");
      return;
    }
    try {
      await onSaveExpenseHead({
        ...headFormData,
        expense_head_id: editingHead ? editingHead.expense_head_id : null,
      });
      setIsHeadModalOpen(false);
    } catch (saveError) {
      setErrorMessage(saveError.message || "Failed to save Expense Head.");
    }
  };

  // Handle TDS Submit
  const handleTdsSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (!tdsFormData.section_code || !tdsFormData.vendor_type) {
      setErrorMessage("Please complete all TDS fields.");
      return;
    }
    try {
      await onSaveTdsConfiguration({
        ...tdsFormData,
        tds_config_id: editingTds ? editingTds.tds_config_id : null,
        tds_percentage: parseFloat(tdsFormData.tds_percentage) || 0,
        threshold_limit_inr: parseFloat(tdsFormData.threshold_limit_inr) || 0,
      });
      setIsTdsModalOpen(false);
    } catch (saveError) {
      setErrorMessage(saveError.message || "Failed to save TDS configuration.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("EXPENSE_HEADS")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "EXPENSE_HEADS"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Chart of Accounts (Expense Heads)</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-700">
            {expenseHeads.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("TDS_RATES")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "TDS_RATES"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>TDS Tax Rates & Vendor Mappings</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-700">
            {tdsConfigurations.length}
          </span>
        </button>
      </div>

      {/* 1. EXPENSE HEADS CONTENT */}
      {activeTab === "EXPENSE_HEADS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Custom Society Expense Heads</h4>
              <p className="text-xs text-slate-500">
                Categorize society outflows for automated P&L reporting and audit statements
              </p>
            </div>
            <button
              onClick={() => {
                setEditingHead(null);
                setHeadFormData({
                  category_code: "OPERATING_EXPENSE",
                  head_name: "",
                  description: "",
                  is_active: true,
                });
                setErrorMessage("");
                setIsHeadModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense Head</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Category Group</th>
                  <th className="px-5 py-3.5">Head Name</th>
                  <th className="px-5 py-3.5">Purpose / Description</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenseHeads.map((headItem) => (
                  <tr key={headItem.expense_head_id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                        {headItem.category_code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{headItem.head_name}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {headItem.description || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          headItem.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {headItem.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setEditingHead(headItem);
                          setHeadFormData({
                            category_code: headItem.category_code,
                            head_name: headItem.head_name,
                            description: headItem.description || "",
                            is_active: Boolean(headItem.is_active),
                          });
                          setErrorMessage("");
                          setIsHeadModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. TDS TAX RATES CONTENT */}
      {activeTab === "TDS_RATES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Statutory TDS (Tax Deducted at Source) Rules
              </h4>
              <p className="text-xs text-slate-500">
                Configure standard Indian Income Tax Section TDS rates (1%, 2%, 10%) per vendor category
              </p>
            </div>
            <button
              onClick={() => {
                setEditingTds(null);
                setTdsFormData({
                  section_code: "194C_COMPANY",
                  vendor_type: "Contractor - Company",
                  tds_percentage: 2.0,
                  threshold_limit_inr: 30000.0,
                  is_active: true,
                });
                setErrorMessage("");
                setIsTdsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add TDS Rule</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3.5">IT Section Code</th>
                  <th className="px-5 py-3.5">Vendor Type Classification</th>
                  <th className="px-5 py-3.5">TDS Rate (%)</th>
                  <th className="px-5 py-3.5">Exemption Threshold (₹)</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tdsConfigurations.map((tdsRuleItem) => (
                  <tr key={tdsRuleItem.tds_config_id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {tdsRuleItem.section_code}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {tdsRuleItem.vendor_type}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {tdsRuleItem.tds_percentage}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                      ₹{parseFloat(tdsRuleItem.threshold_limit_inr).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          tdsRuleItem.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {tdsRuleItem.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setEditingTds(tdsRuleItem);
                          setTdsFormData({
                            section_code: tdsRuleItem.section_code,
                            vendor_type: tdsRuleItem.vendor_type,
                            tds_percentage: tdsRuleItem.tds_percentage,
                            threshold_limit_inr: tdsRuleItem.threshold_limit_inr,
                            is_active: Boolean(tdsRuleItem.is_active),
                          });
                          setErrorMessage("");
                          setIsTdsModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Head Modal */}
      {isHeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingHead ? "Edit Expense Head" : "Add Expense Head"}
              </h3>
              <button
                onClick={() => setIsHeadModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleHeadSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-medium">
                  {errorMessage}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Category Group
                </label>
                <select
                  value={headFormData.category_code}
                  onChange={(event) =>
                    setHeadFormData({ ...headFormData, category_code: event.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="UTILITIES">UTILITIES (Power, Diesel, Water)</option>
                  <option value="REPAIRS_MAINTENANCE">REPAIRS & MAINTENANCE (Lift, Borewell, Painting)</option>
                  <option value="SECURITY_SERVICES">SECURITY SERVICES (Guards, Supervisors)</option>
                  <option value="CLEANING_HOUSEKEEPING">CLEANING & HOUSEKEEPING</option>
                  <option value="ADMINISTRATIVE">ADMINISTRATIVE & LEGAL</option>
                  <option value="OPERATING_EXPENSE">GENERAL OPERATING EXPENSE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Expense Head Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diesel for Generator"
                  value={headFormData.head_name}
                  onChange={(event) =>
                    setHeadFormData({ ...headFormData, head_name: event.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Description / Purpose
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Fuel purchases for power backup during outages"
                  value={headFormData.description}
                  onChange={(event) =>
                    setHeadFormData({ ...headFormData, description: event.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsHeadModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TDS Modal */}
      {isTdsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingTds ? "Edit TDS Configuration" : "Add TDS Tax Rule"}
              </h3>
              <button
                onClick={() => setIsTdsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleTdsSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-medium">
                  {errorMessage}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Section Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 194C_COMPANY"
                  value={tdsFormData.section_code}
                  onChange={(event) =>
                    setTdsFormData({ ...tdsFormData, section_code: event.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Vendor Type Classification *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Contractor - Company / Firm"
                  value={tdsFormData.vendor_type}
                  onChange={(event) =>
                    setTdsFormData({ ...tdsFormData, vendor_type: event.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    TDS Rate (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={tdsFormData.tds_percentage}
                    onChange={(event) =>
                      setTdsFormData({ ...tdsFormData, tds_percentage: event.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Threshold (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={tdsFormData.threshold_limit_inr}
                    onChange={(event) =>
                      setTdsFormData({ ...tdsFormData, threshold_limit_inr: event.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsTdsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
