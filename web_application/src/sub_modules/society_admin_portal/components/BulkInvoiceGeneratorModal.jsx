import React, { useState } from "react";
import {
  X,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Plus,
} from "lucide-react";

export function BulkInvoiceGeneratorModal({
  isOpen,
  onClose,
  billingConfig,
  availableHeads,
  onInvoicesGenerated,
}) {
  if (!isOpen) return null;

  const today = new Date();
  const nextMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const defaultLabel = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  
  // Default due date: 10th of current month
  const defaultDueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(billingConfig?.due_day_of_month || 10).padStart(2, "0")}`;

  const [step, setStep] = useState(1); // 1: Period & Heads, 2: Preview & Confirm
  const [billingPeriodMonth, setBillingPeriodMonth] = useState(nextMonthYear);
  const [billingPeriodLabel, setBillingPeriodLabel] = useState(defaultLabel);
  const [dueDate, setDueDate] = useState(defaultDueDate);

  // Selected heads with customizable amounts for this run
  const [selectedHeadsMap, setSelectedHeadsMap] = useState(() => {
    const map = {};
    (availableHeads || []).forEach((h) => {
      // Exclude General Maintenance if it's dynamically calculated as base
      if (h.head_name !== "General Maintenance") {
        map[h.head_name] = {
          head_name: h.head_name,
          amount_inr: parseFloat(h.default_amount_inr || 0),
          enabled: h.is_mandatory,
        };
      }
    });
    return map;
  });

  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const toggleHead = (headName) => {
    setSelectedHeadsMap((prev) => ({
      ...prev,
      [headName]: {
        ...prev[headName],
        enabled: !prev[headName].enabled,
      },
    }));
  };

  const updateHeadAmount = (headName, amount) => {
    setSelectedHeadsMap((prev) => ({
      ...prev,
      [headName]: {
        ...prev[headName],
        amount_inr: parseFloat(amount) || 0,
      },
    }));
  };

  const handleFetchPreview = async () => {
    setIsLoadingPreview(true);
    setErrorMessage("");

    const activeHeads = Object.values(selectedHeadsMap)
      .filter((h) => h.enabled)
      .map((h) => ({ head_name: h.head_name, amount_inr: h.amount_inr }));

    try {
      const token = localStorage.getItem("smart_nivas_auth_token");
      const res = await fetch("/api/admin/billing/invoices/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          billing_period_month: billingPeriodMonth,
          billing_period_label: billingPeriodLabel,
          selected_heads: activeHeads,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewData(data.data);
        setStep(2);
      } else {
        setErrorMessage(data.message || "Failed to calculate preview.");
      }
    } catch (err) {
      setErrorMessage("Network error calculating invoice preview.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleExecuteBulkGeneration = async () => {
    setIsGenerating(true);
    setErrorMessage("");
    const activeHeads = Object.values(selectedHeadsMap)
      .filter((h) => h.enabled)
      .map((h) => ({ head_name: h.head_name, amount_inr: h.amount_inr }));

    try {
      const token = localStorage.getItem("smart_nivas_auth_token");
      const res = await fetch("/api/admin/billing/invoices/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          billing_period_month: billingPeriodMonth,
          billing_period_label: billingPeriodLabel,
          due_date: dueDate,
          selected_heads: activeHeads,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
        setTimeout(() => {
          onInvoicesGenerated();
          onClose();
        }, 1200);
      } else {
        setErrorMessage(data.message || "Bulk generation failed.");
      }
    } catch (err) {
      setErrorMessage("Error generating invoices.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Bulk Invoice Generator Wizard
            </h2>
            <p className="text-xs text-slate-500">
              Generate monthly society maintenance invoices across all registered flats.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 1 ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
              }`}
            >
              1
            </span>
            <span className={step === 1 ? "text-blue-900 font-bold" : "text-slate-500"}>
              Billing Period & Heads
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 2 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              2
            </span>
            <span className={step === 2 ? "text-blue-900 font-bold" : "text-slate-400"}>
              Review Preview & Publish
            </span>
          </div>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              {/* Period Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Month Tag
                  </label>
                  <input
                    type="month"
                    value={billingPeriodMonth}
                    onChange={(e) => {
                      setBillingPeriodMonth(e.target.value);
                      if (e.target.value) {
                        const [y, m] = e.target.value.split("-");
                        const d = new Date(parseInt(y), parseInt(m) - 1, 1);
                        setBillingPeriodLabel(d.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
                        setDueDate(`${y}-${m}-${String(billingConfig?.due_day_of_month || 10).padStart(2, "0")}`);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Period Display Label
                  </label>
                  <input
                    type="text"
                    value={billingPeriodLabel}
                    onChange={(e) => setBillingPeriodLabel(e.target.value)}
                    placeholder="e.g. November 2026"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Maintenance Calculation Mode Info Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">Base Calculation Rule: </span>
                  <span className="text-blue-600 font-semibold">
                    {billingConfig?.calculation_mode === "PER_SQFT_AREA"
                      ? `₹${billingConfig?.rate_per_sqft_inr || 2.50} per sq. ft. of flat area`
                      : `Fixed ₹${billingConfig?.fixed_monthly_rate_inr || 2000} per flat`}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Configured in Rules Engine</span>
              </div>

              {/* Additional Billing Heads Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Billing Heads to Include
                </label>
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-white max-h-56 overflow-y-auto">
                  {Object.values(selectedHeadsMap).map((head) => (
                    <div
                      key={head.head_name}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition"
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={head.enabled}
                          onChange={() => toggleHead(head.head_name)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-800">
                          {head.head_name}
                        </span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-400">₹</span>
                        <input
                          type="number"
                          value={head.amount_inr}
                          disabled={!head.enabled}
                          onChange={(e) => updateHeadAmount(head.head_name, e.target.value)}
                          className="w-24 px-2 py-1 text-xs text-right border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && previewData && (
            <div className="space-y-4">
              {/* Summary Stats Pill */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-center">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Target Flats</p>
                  <p className="text-xl font-extrabold text-slate-900 font-heading">
                    {previewData.flats_count}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Billing Period</p>
                  <p className="text-sm font-bold text-blue-700 mt-1">
                    {previewData.billing_period_label}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Projected Total</p>
                  <p className="text-xl font-extrabold text-blue-600 font-heading">
                    ₹{previewData.grand_total_inr.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {previewData.already_generated_count > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Warning: Invoices for this month already exist ({previewData.already_generated_count}). Generating again will be blocked to avoid duplicate billing.
                  </span>
                </div>
              )}

              {/* Sample Flats Preview Table */}
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Sample Invoice Calculations (First {previewData.sample_flats?.length} Flats)
                </p>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="p-2.5">Flat</th>
                        <th className="p-2.5">Resident</th>
                        <th className="p-2.5 text-right">Area</th>
                        <th className="p-2.5 text-right">Base Maint</th>
                        <th className="p-2.5 text-right">Addl Heads</th>
                        <th className="p-2.5 text-right font-bold text-slate-900">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.sample_flats?.map((flat) => (
                        <tr key={flat.flat_id} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-bold text-slate-900">
                            {flat.wing_name}-{flat.flat_number}
                          </td>
                          <td className="p-2.5 text-slate-600 truncate max-w-[120px]">
                            {flat.resident_name}
                          </td>
                          <td className="p-2.5 text-right text-slate-500">
                            {flat.area_sqft} sq.ft.
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-700">
                            ₹{flat.base_maintenance_inr}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-500">
                            ₹{flat.additional_heads_inr}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-blue-600">
                            ₹{flat.total_invoice_inr}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFetchPreview}
                disabled={isLoadingPreview}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoadingPreview ? "Calculating Preview..." : "Calculate & Preview"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkGeneration}
                disabled={isGenerating || previewData?.already_generated_count > 0}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? "Generating & Debiting Ledger..." : "Generate & Post Invoices"}
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
