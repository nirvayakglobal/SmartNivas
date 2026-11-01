import React, { useState } from "react";
import {
  Settings,
  ShieldCheck,
  Building,
  QrCode,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Percent,
} from "lucide-react";

export function BillingConfigurationModal({
  isOpen,
  onClose,
  initialConfig,
  onConfigSaved,
}) {
  if (!isOpen) return null;

  const [calcMode, setCalcMode] = useState(
    initialConfig?.calculation_mode || "FIXED_PER_FLAT"
  );
  const [fixedRate, setFixedRate] = useState(
    initialConfig?.fixed_monthly_rate_inr || 2000.00
  );
  const [sqftRate, setSqftRate] = useState(
    initialConfig?.rate_per_sqft_inr || 2.50
  );
  const [dueDay, setDueDay] = useState(
    initialConfig?.due_day_of_month || 10
  );
  const [graceDays, setGraceDays] = useState(
    initialConfig?.grace_period_days || 5
  );
  const [penaltyType, setPenaltyType] = useState(
    initialConfig?.penalty_type || "FLAT_FEE"
  );
  const [penaltyAmountOrRate, setPenaltyAmountOrRate] = useState(
    initialConfig?.penalty_amount_or_rate || 500.00
  );

  // Bank & UPI details
  const [beneficiaryName, setBeneficiaryName] = useState(
    initialConfig?.beneficiary_name || "Society Maintenance Account"
  );
  const [bankName, setBankName] = useState(
    initialConfig?.bank_name || "State Bank of India"
  );
  const [accountNumber, setAccountNumber] = useState(
    initialConfig?.account_number || ""
  );
  const [ifscCode, setIfscCode] = useState(
    initialConfig?.ifsc_code || ""
  );
  const [upiVpa, setUpiVpa] = useState(
    initialConfig?.upi_vpa || "smartnivas@sbi"
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("smart_nivas_auth_token");
      const payload = {
        calculation_mode: calcMode,
        fixed_monthly_rate_inr: parseFloat(fixedRate),
        rate_per_sqft_inr: parseFloat(sqftRate),
        due_day_of_month: parseInt(dueDay),
        grace_period_days: parseInt(graceDays),
        penalty_type: penaltyType,
        penalty_amount_or_rate: parseFloat(penaltyAmountOrRate),
        beneficiary_name: beneficiaryName,
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        upi_vpa: upiVpa,
      };

      const res = await fetch("/api/admin/billing/configuration", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Billing rules & bank settings updated successfully!");
        setTimeout(() => {
          onConfigSaved(data.data);
          onClose();
        }, 1200);
      } else {
        setErrorMessage(data.message || "Failed to update configuration.");
      }
    } catch (err) {
      setErrorMessage("Network error updating configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Financial Billing Configuration Setup
            </h2>
            <p className="text-xs text-slate-500">
              Configure maintenance calculation rules, late payment penalties, and bank account / UPI QR.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
          >
            ✕
          </button>
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

        <form onSubmit={handleSaveConfig} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Billing Rules Engine */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Maintenance Calculation Rules Engine
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Radio: Fixed Rate */}
              <label
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  calcMode === "FIXED_PER_FLAT"
                    ? "border-blue-600 bg-blue-50/40"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="calcMode"
                      checked={calcMode === "FIXED_PER_FLAT"}
                      onChange={() => setCalcMode("FIXED_PER_FLAT")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-bold text-slate-900">Fixed Per Flat</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Every flat pays an identical flat monthly maintenance fee.
                </p>
                <div className="mt-3">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">
                    Monthly Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={fixedRate}
                    onChange={(e) => setFixedRate(e.target.value)}
                    disabled={calcMode !== "FIXED_PER_FLAT"}
                    className="w-full mt-1 px-3 py-1.5 text-sm font-bold font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </label>

              {/* Radio: Per Sq.Ft. Area */}
              <label
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  calcMode === "PER_SQFT_AREA"
                    ? "border-blue-600 bg-blue-50/40"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="calcMode"
                      checked={calcMode === "PER_SQFT_AREA"}
                      onChange={() => setCalcMode("PER_SQFT_AREA")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-bold text-slate-900">Per Sq. Ft. Area</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Calculated dynamically from each flat's super built-up square footage.
                </p>
                <div className="mt-3">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">
                    Rate / Sq.Ft. (₹)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={sqftRate}
                    onChange={(e) => setSqftRate(e.target.value)}
                    disabled={calcMode !== "PER_SQFT_AREA"}
                    className="w-full mt-1 px-3 py-1.5 text-sm font-bold font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Grace Period & Late Fee Penalty Toggles */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Grace Period & Late Fee Penalty Toggles
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Due Day of Every Month
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
                    th of month
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Grace Period Days
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={graceDays}
                    onChange={(e) => setGraceDays(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
                    days past due
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Penalty Structure
                </label>
                <select
                  value={penaltyType}
                  onChange={(e) => setPenaltyType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  <option value="FLAT_FEE">Flat ₹ Fixed Late Fee</option>
                  <option value="PERCENTAGE_MONTHLY">Monthly % Interest on Arrears</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {penaltyType === "FLAT_FEE" ? "Flat Penalty Amount (₹)" : "Interest Rate (% per month)"}
                </label>
                <input
                  type="number"
                  step={penaltyType === "FLAT_FEE" ? "50" : "0.25"}
                  value={penaltyAmountOrRate}
                  onChange={(e) => setPenaltyAmountOrRate(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Primary Bank & Dynamic UPI QR Setup */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                3
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Society Primary Bank & Dynamic UPI QR Setup
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Beneficiary Name
                </label>
                <input
                  type="text"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  placeholder="e.g. Shilp Serenity Maintenance A/C"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 39482019482"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0004123"
                  className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Society UPI ID / VPA (For Dynamic QR Code)</span>
                <span className="text-[11px] text-blue-600 font-semibold">Instant Resident Mobile Pay</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value.trim().toLowerCase())}
                  placeholder="e.g. shilpserenity@sbi"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Dynamic QR codes generated on resident invoices will automatically prefill this UPI address and the exact flat outstanding balance.
              </p>
            </div>
          </div>

          {/* Form Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Saving Configuration..." : "Save Financial Rules"}
              <Save className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
