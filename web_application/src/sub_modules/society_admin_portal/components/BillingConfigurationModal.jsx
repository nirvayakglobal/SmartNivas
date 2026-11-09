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
  Layers,
  Sparkles,
} from "lucide-react";

export function BillingConfigurationModal({
  isOpen,
  onClose,
  initialConfig,
  onConfigSaved,
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState("CALCULATION"); // CALCULATION | CYCLE_PENALTY | BANK_UPI
  const [calcMode, setCalcMode] = useState(
    initialConfig?.calculation_mode || "TIERED_FLAT_TYPE"
  );
  const [billingCycle, setBillingCycle] = useState(
    initialConfig?.billing_cycle || "QUARTERLY"
  );
  const [fixedRate, setFixedRate] = useState(
    initialConfig?.fixed_monthly_rate_inr || 2400.0
  );
  const [sqftRate, setSqftRate] = useState(
    initialConfig?.rate_per_sqft_inr || 2.5
  );

  // Tiered Flat Type Matrix Rates
  const defaultRates = {
    REGULAR: {
      owner_monthly: 2400,
      tenant_monthly: 3000,
      owner_quarterly: 7200,
      tenant_quarterly: 9000,
    },
    PENTHOUSE: {
      owner_monthly: 2900,
      tenant_monthly: 3500,
      owner_quarterly: 8700,
      tenant_quarterly: 10500,
    },
    "2BHK": {
      owner_monthly: 2000,
      tenant_monthly: 2500,
      owner_quarterly: 6000,
      tenant_quarterly: 7500,
    },
    "3BHK": {
      owner_monthly: 2400,
      tenant_monthly: 3000,
      owner_quarterly: 7200,
      tenant_quarterly: 9000,
    },
    "4BHK": {
      owner_monthly: 2800,
      tenant_monthly: 3400,
      owner_quarterly: 8400,
      tenant_quarterly: 10200,
    },
    SHOP: {
      owner_monthly: 1500,
      tenant_monthly: 2000,
      owner_quarterly: 4500,
      tenant_quarterly: 6000,
    },
  };

  const [tieredRates, setTieredRates] = useState(() => {
    if (initialConfig?.parsed_flat_type_rates && Object.keys(initialConfig.parsed_flat_type_rates).length > 0) {
      return { ...defaultRates, ...initialConfig.parsed_flat_type_rates };
    }
    if (initialConfig?.flat_type_rates_json) {
      try {
        return { ...defaultRates, ...JSON.parse(initialConfig.flat_type_rates_json) };
      } catch (e) {
        return defaultRates;
      }
    }
    return defaultRates;
  });

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
    initialConfig?.penalty_amount_or_rate || 500.0
  );

  // Bank & UPI details
  const [beneficiaryName, setBeneficiaryName] = useState(
    initialConfig?.beneficiary_name || "SHILP SERENITY CO OPERATIVE HOUSING SERVICE SOCIETY LIMITED"
  );
  const [bankName, setBankName] = useState(
    initialConfig?.bank_name || "ICICI Bank"
  );
  const [accountNumber, setAccountNumber] = useState(
    initialConfig?.account_number || ""
  );
  const [ifscCode, setIfscCode] = useState(
    initialConfig?.ifsc_code || ""
  );
  const [upiVpa, setUpiVpa] = useState(
    initialConfig?.upi_vpa || "smartnivas@icici"
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleTierRateChange = (flatType, field, value) => {
    setTieredRates((prev) => ({
      ...prev,
      [flatType]: {
        ...(prev[flatType] || {}),
        [field]: parseFloat(value) || 0,
      },
    }));
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("smart_nivas_auth_token");
      const payload = {
        calculation_mode: calcMode,
        billing_cycle: billingCycle,
        fixed_monthly_rate_inr: parseFloat(fixedRate),
        rate_per_sqft_inr: parseFloat(sqftRate),
        flat_type_rates_json: JSON.stringify(tieredRates),
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
        setSuccessMessage("Billing rules, tiered flat rates & bank details updated successfully!");
        setTimeout(() => {
          onConfigSaved(data.data);
          onClose();
        }, 1100);
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
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Maintenance & Billing Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Configure calculation modes, flat-type tiered rates, billing cycles, and bank UPI settings.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Stepper Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("CALCULATION")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "CALCULATION"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            1. Calculation Mode & Rates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("CYCLE_PENALTY")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "CYCLE_PENALTY"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            2. Cycle & Late Fee Penalties
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("BANK_UPI")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "BANK_UPI"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            3. Bank & UPI QR Setup
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
          {/* TAB 1: CALCULATION MODE & RATES */}
          {activeTab === "CALCULATION" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Choose Billing Calculation Engine
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Option 1: Tiered Flat Type & Occupancy */}
                  <label
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      calcMode === "TIERED_FLAT_TYPE"
                        ? "border-blue-600 bg-blue-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <input
                            type="radio"
                            name="calcMode"
                            checked={calcMode === "TIERED_FLAT_TYPE"}
                            onChange={() => setCalcMode("TIERED_FLAT_TYPE")}
                            className="text-blue-600"
                          />
                          Flat Type & Occupancy
                        </span>
                        <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded-md">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Different rates for Regular Flats vs Penthouses, with Owner vs Tenant occupancy (as per Shilp Serenity notice).
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Fixed Per Flat */}
                  <label
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      calcMode === "FIXED_PER_FLAT"
                        ? "border-blue-600 bg-blue-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="calcMode"
                          checked={calcMode === "FIXED_PER_FLAT"}
                          onChange={() => setCalcMode("FIXED_PER_FLAT")}
                          className="text-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-900">Fixed Flat Fee</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Uniform flat fee charged to every flat unit regardless of occupancy or type.
                      </p>
                    </div>
                    {calcMode === "FIXED_PER_FLAT" && (
                      <div className="mt-3">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">
                          Monthly Amount (₹)
                        </label>
                        <input
                          type="number"
                          step="50"
                          value={fixedRate}
                          onChange={(e) => setFixedRate(e.target.value)}
                          className="w-full mt-1 px-2.5 py-1 text-xs font-bold font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
                        />
                      </div>
                    )}
                  </label>

                  {/* Option 3: Per Sq.Ft. Area */}
                  <label
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      calcMode === "PER_SQFT_AREA"
                        ? "border-blue-600 bg-blue-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="calcMode"
                          checked={calcMode === "PER_SQFT_AREA"}
                          onChange={() => setCalcMode("PER_SQFT_AREA")}
                          className="text-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-900">Per Sq. Ft. Area</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Calculated from flat's super built-up square footage (e.g. ₹2.50 / sq.ft).
                      </p>
                    </div>
                    {calcMode === "PER_SQFT_AREA" && (
                      <div className="mt-3">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">
                          Rate / Sq.Ft. (₹)
                        </label>
                        <input
                          type="number"
                          step="0.10"
                          value={sqftRate}
                          onChange={(e) => setSqftRate(e.target.value)}
                          className="w-full mt-1 px-2.5 py-1 text-xs font-bold font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
                        />
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Tiered Flat Type Table Setup */}
              {calcMode === "TIERED_FLAT_TYPE" && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 font-heading flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Flat Type & Occupancy Rate Matrix (₹)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Specify rates applied during Monthly or Quarterly billing cycles for each unit category.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Flat Category / Type</th>
                          <th className="py-2.5 px-3">Owner/Vacant (Monthly)</th>
                          <th className="py-2.5 px-3">Tenant (Monthly)</th>
                          <th className="py-2.5 px-3">Owner/Vacant (Quarterly)</th>
                          <th className="py-2.5 px-3">Tenant (Quarterly)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {["REGULAR", "PENTHOUSE", "2BHK", "3BHK", "4BHK", "SHOP"].map((typeKey) => {
                          const item = tieredRates[typeKey] || {};
                          return (
                            <tr key={typeKey} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-bold text-slate-800">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold mr-1.5 ${
                                  typeKey === "PENTHOUSE" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                                }`}>
                                  {typeKey}
                                </span>
                                {typeKey === "REGULAR" && <span className="text-[10px] text-slate-400 font-normal">(Non-Penthouse)</span>}
                              </td>
                              <td className="py-2 px-3">
                                <div className="relative">
                                  <span className="absolute left-2 top-1.5 text-slate-400">₹</span>
                                  <input
                                    type="number"
                                    value={item.owner_monthly || 0}
                                    onChange={(e) => handleTierRateChange(typeKey, "owner_monthly", e.target.value)}
                                    className="w-24 pl-5 pr-2 py-1 text-xs font-mono font-bold border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <div className="relative">
                                  <span className="absolute left-2 top-1.5 text-slate-400">₹</span>
                                  <input
                                    type="number"
                                    value={item.tenant_monthly || 0}
                                    onChange={(e) => handleTierRateChange(typeKey, "tenant_monthly", e.target.value)}
                                    className="w-24 pl-5 pr-2 py-1 text-xs font-mono font-bold border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <div className="relative">
                                  <span className="absolute left-2 top-1.5 text-slate-400">₹</span>
                                  <input
                                    type="number"
                                    value={item.owner_quarterly || (item.owner_monthly * 3) || 0}
                                    onChange={(e) => handleTierRateChange(typeKey, "owner_quarterly", e.target.value)}
                                    className="w-24 pl-5 pr-2 py-1 text-xs font-mono font-bold border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <div className="relative">
                                  <span className="absolute left-2 top-1.5 text-slate-400">₹</span>
                                  <input
                                    type="number"
                                    value={item.tenant_quarterly || (item.tenant_monthly * 3) || 0}
                                    onChange={(e) => handleTierRateChange(typeKey, "tenant_quarterly", e.target.value)}
                                    className="w-24 pl-5 pr-2 py-1 text-xs font-mono font-bold border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BILLING CYCLE & LATE FEE PENALTIES */}
          {activeTab === "CYCLE_PENALTY" && (
            <div className="space-y-5">
              {/* Billing Cycle Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Default Society Billing Cycle
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                      billingCycle === "QUARTERLY"
                        ? "border-blue-600 bg-blue-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="billingCycle"
                          checked={billingCycle === "QUARTERLY"}
                          onChange={() => setBillingCycle("QUARTERLY")}
                          className="text-blue-600"
                        />
                        <span className="text-sm font-bold text-slate-900">Quarterly Billing</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Billed every 3 months (e.g. Q1, Q2, Q3, Q4) as per standard RWA practice.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                      billingCycle === "MONTHLY"
                        ? "border-blue-600 bg-blue-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="billingCycle"
                          checked={billingCycle === "MONTHLY"}
                          onChange={() => setBillingCycle("MONTHLY")}
                          className="text-blue-600"
                        />
                        <span className="text-sm font-bold text-slate-900">Monthly Billing</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Billed once every month on the configured due day.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Due Date & Grace Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Invoice Due Day of Period
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

              {/* Late Fee Penalty Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Late Fee Penalty Structure
                  </label>
                  <select
                    value={penaltyType}
                    onChange={(e) => setPenaltyType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="FLAT_FEE">Flat ₹ Fixed Late Fee (₹500 / month)</option>
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
          )}

          {/* TAB 3: BANK & UPI QR SETUP */}
          {activeTab === "BANK_UPI" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Beneficiary Name (Society Account)
                  </label>
                  <input
                    type="text"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    placeholder="e.g. SHILP SERENITY CO OP HOUSING SERVICE SOC LTD"
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
                    placeholder="e.g. ICICI Bank / State Bank of India"
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
                    placeholder="e.g. 182905001234"
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
                    placeholder="e.g. ICIC0001829"
                    className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Society UPI ID / VPA (For Dynamic QR Code)</span>
                  <span className="text-[11px] text-blue-600 font-semibold">GPay / PhonePe / Paytm / BHIM</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value.trim().toLowerCase())}
                    placeholder="e.g. shilpserenity@icici"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  When residents scan the QR code from the maintenance circular or invoice, their UPI app auto-fills the society beneficiary and amount.
                </p>
              </div>
            </div>
          )}

          {/* Form Submit & Step controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              {activeTab !== "BANK_UPI" && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "CALCULATION") setActiveTab("CYCLE_PENALTY");
                    else if (activeTab === "CYCLE_PENALTY") setActiveTab("BANK_UPI");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Next Step →
                </button>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving Configuration..." : "Save Configuration"}
                <Save className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
