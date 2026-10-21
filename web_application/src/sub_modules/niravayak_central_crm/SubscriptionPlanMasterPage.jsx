import React, { useState, useEffect } from "react";
import {
  CreditCard,
  PlusCircle,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";

export function SubscriptionPlanMasterPage() {
  const [subscriptionPlanRecords, setSubscriptionPlanRecords] = useState([]);
  const [isLoadingSubscriptionPlans, setIsLoadingSubscriptionPlans] =
    useState(true);
  const [isCreatingNewPlanModalOpen, setIsCreatingNewPlanModalOpen] =
    useState(false);

  // New Plan Form State
  const [planName, setPlanName] = useState("");
  const [billingCycle, setBillingCycle] = useState("YEARLY");
  const [basePriceInr, setBasePriceInr] = useState("19999");
  const [maxGatesAllowed, setMaxGatesAllowed] = useState(2);
  const [photoRetentionDays, setPhotoRetentionDays] = useState(60);
  const [enableWalkinApproval, setEnableWalkinApproval] = useState(true);
  const [enablePreapprovalPasscode, setEnablePreapprovalPasscode] = useState(true);
  const [enableVisitorPhoto, setEnableVisitorPhoto] = useState(true);
  const [enableLeaveAtGate, setEnableLeaveAtGate] = useState(true);
  const [enableNoticeBoard, setEnableNoticeBoard] = useState(true);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

  const fetchSubscriptionPlans = async () => {
    setIsLoadingSubscriptionPlans(true);
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/central/plans", {
        headers: { Authorization: `Bearer ${storedAuthToken}` },
      });
      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setSubscriptionPlanRecords(responseJsonData.data);
      }
    } catch (networkFetchError) {
      console.error("Failed to fetch plans:", networkFetchError);
    } finally {
      setIsLoadingSubscriptionPlans(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  const handleCreatePlanSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    setIsSubmittingPlan(true);

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/central/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedAuthToken}`,
        },
        body: JSON.stringify({
          plan_name: planName,
          billing_cycle: billingCycle,
          base_price_inr: parseFloat(basePriceInr),
          max_gates_allowed: parseInt(maxGatesAllowed),
          photo_retention_days: parseInt(photoRetentionDays),
          enable_walkin_approval: enableWalkinApproval,
          enable_preapproval_passcode: enablePreapprovalPasscode,
          enable_visitor_photo: enableVisitorPhoto,
          enable_leave_at_gate: enableLeaveAtGate,
          enable_notice_board: enableNoticeBoard,
        }),
      });

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setIsCreatingNewPlanModalOpen(false);
        setPlanName("");
        fetchSubscriptionPlans();
      }
    } catch (createPlanError) {
      console.error("Failed to create plan:", createPlanError);
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            Subscription Plan Master
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Define SaaS tier offerings, pricing models, gate quotas, and feature bundle entitlements.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingNewPlanModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-sm transition-all text-sm active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Plan Tier</span>
        </button>
      </div>

      {/* Plan Cards Grid (Enterprise Light Resting Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptionPlanRecords.map((planItem) => {
          const isProPlan = planItem.plan_name.toLowerCase().includes("pro");

          return (
            <div
              key={planItem.plan_id}
              className={`rounded-lg border p-6 flex flex-col justify-between transition-all duration-200 relative bg-white ${
                isProPlan
                  ? "border-blue-500 shadow-[0_10px_15px_-3px_rgba(37,99,235,0.08)] ring-1 ring-blue-500/20"
                  : "border-[#E2E8F0] shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] hover:-translate-y-0.5 hover:shadow-[0_10px_15px_-3px_rgba(15,23,42,0.06)]"
              }`}
            >
              {isProPlan && (
                <div className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A] font-heading">
                    {planItem.plan_name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-[#0F172A] font-heading">
                      ₹{Number(planItem.base_price_inr).toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-[#64748B] font-semibold uppercase">
                      / {planItem.billing_cycle}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] text-xs space-y-1.5 text-[#334155]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Max Gates Allowed:</span>
                    <span className="font-bold text-[#0F172A]">
                      {planItem.max_gates_allowed} Gate(s)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Photo Retention:</span>
                    <span className="font-bold text-[#0F172A]">
                      {planItem.photo_retention_days} Days
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Feature Inclusions
                  </span>

                  {[
                    { label: "Walk-In Approvals", active: planItem.enable_walkin_approval },
                    { label: "6-Digit Pre-Approvals", active: planItem.enable_preapproval_passcode },
                    { label: "Visitor Camera Photos", active: planItem.enable_visitor_photo },
                    { label: "Parcel Leave-at-Gate & OTP", active: planItem.enable_leave_at_gate },
                    { label: "Digital Notice Board", active: planItem.enable_notice_board },
                  ].map((featureSpec) => (
                    <div
                      key={featureSpec.label}
                      className="flex items-center space-x-2 text-xs"
                    >
                      {featureSpec.active ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#CBD5E1] flex-shrink-0" />
                      )}
                      <span
                        className={
                          featureSpec.active ? "text-[#334155] font-medium" : "text-[#94A3B8] line-through"
                        }
                      >
                        {featureSpec.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-[#E2E8F0]">
                <span className="text-[11px] text-[#64748B] font-mono block">
                  Plan Master ID: #{planItem.plan_id}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Plan Modal */}
      {isCreatingNewPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-lg w-full max-w-lg p-6 space-y-4 shadow-[0_20px_25px_-5px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-lg font-bold text-[#0F172A] font-heading flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                Define Subscription Plan Tier
              </h3>
              <button
                onClick={() => setIsCreatingNewPlanModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlanSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                  Plan Tier Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium Gatekeeper Plus"
                  value={planName}
                  onChange={(inputEvent) => setPlanName(inputEvent.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Base Price (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={basePriceInr}
                    onChange={(inputEvent) => setBasePriceInr(inputEvent.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(inputEvent) => setBillingCycle(inputEvent.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="YEARLY">YEARLY</option>
                    <option value="QUARTERLY">QUARTERLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Max Gates Allowed
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxGatesAllowed}
                    onChange={(inputEvent) => setMaxGatesAllowed(inputEvent.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Photo Retention Days
                  </label>
                  <input
                    type="number"
                    min="15"
                    value={photoRetentionDays}
                    onChange={(inputEvent) => setPhotoRetentionDays(inputEvent.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                <span className="text-xs font-semibold text-[#64748B] uppercase block mb-1">
                  Feature Flags
                </span>
                {[
                  { label: "Walk-In Approval", state: enableWalkinApproval, setter: setEnableWalkinApproval },
                  { label: "Pre-Approval 6-Digit Passcode", state: enablePreapprovalPasscode, setter: setEnablePreapprovalPasscode },
                  { label: "Visitor Camera Snapshot", state: enableVisitorPhoto, setter: setEnableVisitorPhoto },
                  { label: "Parcel Leave-At-Gate", state: enableLeaveAtGate, setter: setEnableLeaveAtGate },
                  { label: "Digital Notice Board", state: enableNoticeBoard, setter: setEnableNoticeBoard },
                ].map((toggleItem) => (
                  <label
                    key={toggleItem.label}
                    className="flex items-center space-x-2 text-xs text-[#334155] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={toggleItem.state}
                      onChange={(event) => toggleItem.setter(event.target.checked)}
                      className="rounded border-[#CBD5E1] text-blue-600 focus:ring-blue-500"
                    />
                    <span>{toggleItem.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsCreatingNewPlanModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPlan}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-sm text-sm active:scale-[0.98]"
                >
                  {isSubmittingPlan ? "Saving..." : "Save Plan Tier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
