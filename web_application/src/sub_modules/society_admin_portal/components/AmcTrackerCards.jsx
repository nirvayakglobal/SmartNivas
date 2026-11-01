import React, { useState } from "react";
import { Plus, Calendar, ShieldCheck, AlertTriangle, Clock, FileText, CheckCircle2, X } from "lucide-react";

export function AmcTrackerCards({
  amcContracts,
  vendors,
  expenseHeads,
  onSaveAmcContract,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAmc, setEditingAmc] = useState(null);

  const [amcFormData, setAmcFormData] = useState({
    contract_title: "",
    vendor_id: "",
    expense_head_id: "",
    start_date: "",
    end_date: "",
    contract_value_inr: "",
    billing_frequency: "QUARTERLY",
    notes: "",
    status: "ACTIVE",
  });

  const [errorMessage, setErrorMessage] = useState("");

  const handleOpenAddModal = () => {
    setEditingAmc(null);
    setAmcFormData({
      contract_title: "",
      vendor_id: vendors.length > 0 ? vendors[0].vendor_id : "",
      expense_head_id: expenseHeads.length > 0 ? expenseHeads[0].expense_head_id : "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      contract_value_inr: "",
      billing_frequency: "QUARTERLY",
      notes: "",
      status: "ACTIVE",
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (amcContractItem) => {
    setEditingAmc(amcContractItem);
    setAmcFormData({
      contract_title: amcContractItem.contract_title || "",
      vendor_id: amcContractItem.vendor_id || "",
      expense_head_id: amcContractItem.expense_head_id || "",
      start_date: amcContractItem.start_date || "",
      end_date: amcContractItem.end_date || "",
      contract_value_inr: amcContractItem.contract_value_inr || "",
      billing_frequency: amcContractItem.billing_frequency || "QUARTERLY",
      notes: amcContractItem.notes || "",
      status: amcContractItem.status || "ACTIVE",
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!amcFormData.contract_title || !amcFormData.vendor_id || !amcFormData.expense_head_id || !amcFormData.end_date) {
      setErrorMessage("Please complete all required fields including Vendor, Expense Head, and End Date.");
      return;
    }

    try {
      await onSaveAmcContract({
        ...amcFormData,
        amc_id: editingAmc ? editingAmc.amc_id : null,
        vendor_id: parseInt(amcFormData.vendor_id, 10),
        expense_head_id: parseInt(amcFormData.expense_head_id, 10),
        contract_value_inr: parseFloat(amcFormData.contract_value_inr) || 0,
      });
      setIsModalOpen(false);
    } catch (saveError) {
      setErrorMessage(saveError.message || "Failed to save AMC contract.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Annual Maintenance Contracts (AMC Tracker)
          </h3>
          <p className="text-xs text-slate-500">
            Proactive contract lifecycle, renewal deadlines, and service provider tracking
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New AMC Contract</span>
        </button>
      </div>

      {/* Cards Grid */}
      {amcContracts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium">No Annual Maintenance Contracts recorded yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Track lift, generator, security, and fire-fighting service agreements here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {amcContracts.map((amcItem) => {
            const isExpiringWithin30Days =
              amcItem.calculated_health_status === "EXPIRING_SOON" ||
              (amcItem.days_remaining >= 0 && amcItem.days_remaining <= 30);
            const isExpired =
              amcItem.calculated_health_status === "EXPIRED" ||
              amcItem.days_remaining < 0;

            let badgeConfig = {
              badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
              dotColor: "bg-emerald-500",
              label: "Active Contract",
              icon: CheckCircle2,
            };

            if (isExpired) {
              badgeConfig = {
                badgeColor: "bg-slate-100 text-slate-600 border-slate-200",
                dotColor: "bg-slate-400",
                label: "Expired",
                icon: Clock,
              };
            } else if (isExpiringWithin30Days) {
              badgeConfig = {
                badgeColor: "bg-rose-50 text-rose-700 border-rose-200 animate-pulse",
                dotColor: "bg-rose-600",
                label: `Expiring in ${amcItem.days_remaining} Days`,
                icon: AlertTriangle,
              };
            }

            const BadgeIcon = badgeConfig.icon;

            return (
              <div
                key={amcItem.amc_id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge & Frequency */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeConfig.badgeColor}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${badgeConfig.dotColor}`} />
                      <BadgeIcon className="w-3.5 h-3.5" />
                      {badgeConfig.label}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded-md">
                      {amcItem.billing_frequency}
                    </span>
                  </div>

                  {/* Title & Vendor */}
                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {amcItem.contract_title}
                  </h4>
                  <div className="text-xs font-medium text-indigo-600 mt-1">
                    {amcItem.vendor_name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Category: <span className="text-slate-700 font-medium">{amcItem.expense_head_name}</span>
                  </div>

                  {/* Contract Dates & Value */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Valid Until</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {amcItem.end_date}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Annual Value</span>
                      <span className="font-bold text-slate-900 mt-0.5 block text-sm">
                        ₹{parseFloat(amcItem.contract_value_inr).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {amcItem.notes && (
                    <p className="mt-3 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl line-clamp-2">
                      {amcItem.notes}
                    </p>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    ID: #{amcItem.amc_id}
                  </span>
                  <button
                    onClick={() => handleOpenEditModal(amcItem)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    Manage / Renew
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit AMC Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editingAmc ? "Update AMC Contract" : "Register Annual Maintenance Contract"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Contract Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schindler Lift Annual Comprehensive AMC"
                  value={amcFormData.contract_title}
                  onChange={(event) =>
                    setAmcFormData({ ...amcFormData, contract_title: event.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Service Vendor *
                  </label>
                  <select
                    required
                    value={amcFormData.vendor_id}
                    onChange={(event) =>
                      setAmcFormData({ ...amcFormData, vendor_id: event.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map((vendorItem) => (
                      <option key={vendorItem.vendor_id} value={vendorItem.vendor_id}>
                        {vendorItem.vendor_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Expense Head *
                  </label>
                  <select
                    required
                    value={amcFormData.expense_head_id}
                    onChange={(event) =>
                      setAmcFormData({ ...amcFormData, expense_head_id: event.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Select Head --</option>
                    {expenseHeads.map((expenseHeadItem) => (
                      <option
                        key={expenseHeadItem.expense_head_id}
                        value={expenseHeadItem.expense_head_id}
                      >
                        {expenseHeadItem.head_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={amcFormData.start_date}
                    onChange={(event) =>
                      setAmcFormData({ ...amcFormData, start_date: event.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Expiry / Renewal Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={amcFormData.end_date}
                    onChange={(event) =>
                      setAmcFormData({ ...amcFormData, end_date: event.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Annual Contract Value (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 85000"
                    value={amcFormData.contract_value_inr}
                    onChange={(event) =>
                      setAmcFormData({ ...amcFormData, contract_value_inr: event.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Billing Frequency
                  </label>
                  <select
                    value={amcFormData.billing_frequency}
                    onChange={(event) =>
                      setAmcFormData({ ...amcFormData, billing_frequency: event.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="HALF_YEARLY">Half Yearly</option>
                    <option value="ANNUALLY">Annually</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Scope of Work / Service Terms
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Includes quarterly lubricant replacement and free breakdown service within 4 hours"
                  value={amcFormData.notes}
                  onChange={(event) =>
                    setAmcFormData({ ...amcFormData, notes: event.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {editingAmc && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Contract Status
                  </label>
                  <select
                    value={amcFormData.status}
                    onChange={(event) =>
                      setAmcFormData({ ...amcFormData, status: event.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="TERMINATED">TERMINATED</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
                >
                  {editingAmc ? "Update AMC" : "Save AMC Contract"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
