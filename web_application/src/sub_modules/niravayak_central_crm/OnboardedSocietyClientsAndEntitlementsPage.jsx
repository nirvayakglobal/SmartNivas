import React, { useState, useEffect } from "react";
import {
  Building2,
  Sliders,
  Copy,
  Check,
  UserPlus,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export function OnboardedSocietyClientsAndEntitlementsPage() {
  const [onboardedSocietyRecords, setOnboardedSocietyRecords] = useState([]);
  const [availableSubscriptionPlans, setAvailableSubscriptionPlans] = useState([]);
  const [isLoadingSocietyClients, setIsLoadingSocietyClients] = useState(true);
  const [copiedTokenSocietyId, setCopiedTokenSocietyId] = useState(null);

  // Onboard New Society Modal State
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [societyLegalName, setSocietyLegalName] = useState("");
  const [societyUniqueCode, setSocietyUniqueCode] = useState("");
  const [cityName, setCityName] = useState("Ahmedabad");
  const [stateName, setStateName] = useState("Gujarat");
  const [rwaContactPersonName, setRwaContactPersonName] = useState("");
  const [rwaContactPhoneNumber, setRwaContactPhoneNumber] = useState("");
  const [rwaContactEmailAddress, setRwaContactEmailAddress] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(2); // Shield Pro default
  const [isOnboardingSubmitting, setIsOnboardingSubmitting] = useState(false);
  const [onboardingFeedbackMessage, setOnboardingFeedbackMessage] = useState("");

  // Edit Entitlements Drawer/Modal State
  const [editingSocietyRecord, setEditingSocietyRecord] = useState(null);
  const [isUpdatingEntitlements, setIsUpdatingEntitlements] = useState(false);

  const fetchSocietiesAndPlans = async () => {
    setIsLoadingSocietyClients(true);
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const [clientsResponse, plansResponse] = await Promise.all([
        fetch("/api/central/clients", {
          headers: { Authorization: `Bearer ${storedAuthToken}` },
        }),
        fetch("/api/central/plans", {
          headers: { Authorization: `Bearer ${storedAuthToken}` },
        }),
      ]);

      const clientsJson = await clientsResponse.json();
      const plansJson = await plansResponse.json();

      if (clientsJson.success) {
        setOnboardedSocietyRecords(clientsJson.data);
      }
      if (plansJson.success) {
        setAvailableSubscriptionPlans(plansJson.data);
      }
    } catch (networkFetchError) {
      console.error("Failed to load societies or plans:", networkFetchError);
    } finally {
      setIsLoadingSocietyClients(false);
    }
  };

  useEffect(() => {
    fetchSocietiesAndPlans();
  }, []);

  const handleCopyActivationLink = (societyRecord) => {
    const activationToken = societyRecord.bootstrap_activation_token;
    if (!activationToken) return;

    const fullActivationUrl = `${window.location.origin}/admin/activate?token=${activationToken}`;
    navigator.clipboard.writeText(fullActivationUrl);
    setCopiedTokenSocietyId(societyRecord.society_id);
    setTimeout(() => setCopiedTokenSocietyId(null), 2500);
  };

  const handleOnboardSocietySubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    setIsOnboardingSubmitting(true);
    setOnboardingFeedbackMessage("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/central/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedAuthToken}`,
        },
        body: JSON.stringify({
          society_legal_name: societyLegalName,
          society_unique_code: societyUniqueCode.toUpperCase(),
          city_name: cityName,
          state_name: stateName,
          rwa_contact_person_name: rwaContactPersonName,
          rwa_contact_phone_number: rwaContactPhoneNumber,
          rwa_contact_email_address: rwaContactEmailAddress || null,
          subscribed_plan_id: selectedPlanId,
        }),
      });

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setIsOnboardingModalOpen(false);
        setSocietyLegalName("");
        setSocietyUniqueCode("");
        setRwaContactPersonName("");
        setRwaContactPhoneNumber("");
        setRwaContactEmailAddress("");
        fetchSocietiesAndPlans();
      } else {
        setOnboardingFeedbackMessage(responseJsonData.message || "Onboarding failed.");
      }
    } catch (networkError) {
      setOnboardingFeedbackMessage("Network error during onboarding.");
    } finally {
      setIsOnboardingSubmitting(false);
    }
  };

  const handleUpdateEntitlementsSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    if (!editingSocietyRecord) return;
    setIsUpdatingEntitlements(true);

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch(
        `/api/central/clients/${editingSocietyRecord.society_id}/entitlements`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedAuthToken}`,
          },
          body: JSON.stringify({
            max_gates_allowed: Number(editingSocietyRecord.max_gates_allowed),
            photo_retention_days: Number(editingSocietyRecord.photo_retention_days),
            enable_walkin_approval: Boolean(editingSocietyRecord.enable_walkin_approval),
            enable_preapproval_passcode: Boolean(editingSocietyRecord.enable_preapproval_passcode),
            enable_visitor_photo: Boolean(editingSocietyRecord.enable_visitor_photo),
            enable_leave_at_gate: Boolean(editingSocietyRecord.enable_leave_at_gate),
            enable_notice_board: Boolean(editingSocietyRecord.enable_notice_board),
            license_status: editingSocietyRecord.license_status,
            subscription_expiry_date: editingSocietyRecord.subscription_expiry_date,
          }),
        }
      );

      const responseJson = await httpApiResponse.json();
      if (responseJson.success) {
        setEditingSocietyRecord(null);
        fetchSocietiesAndPlans();
      }
    } catch (updateError) {
      console.error("Failed to update entitlements:", updateError);
    } finally {
      setIsUpdatingEntitlements(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Society Clients & Feature Entitlements
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Manage society tenants, configure gated security feature flags, and issue zero-knowledge Admin setup links.
          </p>
        </div>

        <button
          onClick={() => setIsOnboardingModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-sm transition-all text-sm active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Onboard New Society Client</span>
        </button>
      </div>

      {/* Society Table (Resting Card Level 1) */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <span className="text-sm font-semibold text-[#0F172A] font-heading">
            Active Society Tenants ({onboardedSocietyRecords.length})
          </span>
          <span className="text-xs text-[#64748B]">
            Strict Multi-Tenant Row Isolation Guaranteed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold uppercase text-[11px] tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="px-6 py-3.5">Society Name & Code</th>
                <th className="px-6 py-3.5">Subscription Plan</th>
                <th className="px-6 py-3.5">Gates / Photo Retention</th>
                <th className="px-6 py-3.5">License Status</th>
                <th className="px-6 py-3.5">Admin Onboarding Link</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#334155] font-medium">
              {isLoadingSocietyClients ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-[#94A3B8]">
                    Loading society clients...
                  </td>
                </tr>
              ) : onboardedSocietyRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-[#94A3B8] italic">
                    No societies onboarded yet. Click "Onboard New Society Client" to start.
                  </td>
                </tr>
              ) : (
                onboardedSocietyRecords.map((societyRecord) => (
                  <tr
                    key={societyRecord.society_id}
                    className="hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0F172A] font-heading">
                        {societyRecord.society_legal_name}
                      </div>
                      <div className="text-xs text-blue-600 font-mono mt-0.5">
                        Code: {societyRecord.society_unique_code} • {societyRecord.city_name}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                        {societyRecord.plan_name}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-[#334155]">
                      <div>Max Gates: <span className="font-bold text-[#0F172A]">{societyRecord.max_gates_allowed}</span></div>
                      <div>Photos: <span className="font-bold text-[#0F172A]">{societyRecord.photo_retention_days} Days</span></div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          societyRecord.license_status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : societyRecord.license_status === "TRIAL"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {societyRecord.license_status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {societyRecord.is_bootstrap_pending ? (
                        <button
                          onClick={() => handleCopyActivationLink(societyRecord)}
                          className="flex items-center space-x-1.5 px-3 py-1 bg-white hover:bg-[#F8FAFC] text-[#334155] rounded-sm text-xs font-semibold border border-[#CBD5E1] transition-colors shadow-sm"
                        >
                          {copiedTokenSocietyId === societyRecord.society_id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Link Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                              <span>Copy Setup Link</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-4 h-4 text-emerald-600" /> Activated
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditingSocietyRecord({ ...societyRecord })}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-white hover:bg-blue-50 text-[#334155] hover:text-blue-600 rounded-sm text-xs font-semibold border border-[#CBD5E1] hover:border-blue-300 transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Entitlements</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Client Modal */}
      {isOnboardingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-lg w-full max-w-xl p-6 space-y-4 shadow-[0_20px_25px_-5px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-lg font-bold text-[#0F172A] font-heading flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Onboard New Society Client (ACID Multi-Step)
              </h3>
              <button
                onClick={() => setIsOnboardingModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                ✕
              </button>
            </div>

            {onboardingFeedbackMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs font-semibold">
                {onboardingFeedbackMessage}
              </div>
            )}

            <form onSubmit={handleOnboardSocietySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Society Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shaligram Prime RWA"
                    value={societyLegalName}
                    onChange={(inputEvent) =>
                      setSocietyLegalName(inputEvent.target.value)
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Unique Society Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SHALIGRAM"
                    value={societyUniqueCode}
                    onChange={(inputEvent) =>
                      setSocietyUniqueCode(inputEvent.target.value.toUpperCase())
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] font-mono uppercase focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    City Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={cityName}
                    onChange={(inputEvent) => setCityName(inputEvent.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Subscribed Plan *
                  </label>
                  <select
                    value={selectedPlanId}
                    onChange={(inputEvent) =>
                      setSelectedPlanId(Number(inputEvent.target.value))
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] font-semibold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    {availableSubscriptionPlans.map((planItem) => (
                      <option key={planItem.plan_id} value={planItem.plan_id}>
                        {planItem.plan_name} (₹{planItem.base_price_inr})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    RWA Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ketanbhai Shah"
                    value={rwaContactPersonName}
                    onChange={(inputEvent) =>
                      setRwaContactPersonName(inputEvent.target.value)
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    RWA Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9825000000"
                    value={rwaContactPhoneNumber}
                    onChange={(inputEvent) =>
                      setRwaContactPhoneNumber(inputEvent.target.value)
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
                <p className="font-bold">Automated Multi-Step ACID Pipeline:</p>
                <p className="mt-0.5 text-blue-700">
                  1. Inherits plan feature flags • 2. Generates root Society Admin with bootstrap activation link • 3. Creates initial GST invoice.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsOnboardingModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOnboardingSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-sm shadow-sm transition-all text-sm active:scale-[0.98]"
                >
                  {isOnboardingSubmitting ? "Onboarding..." : "Execute Onboarding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Entitlements Modal */}
      {editingSocietyRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-lg w-full max-w-lg p-6 space-y-4 shadow-[0_20px_25px_-5px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A] font-heading flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  Configure Entitlements & License
                </h3>
                <p className="text-xs text-[#64748B]">
                  {editingSocietyRecord.society_legal_name} ({editingSocietyRecord.society_unique_code})
                </p>
              </div>
              <button
                onClick={() => setEditingSocietyRecord(null)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateEntitlementsSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Max Gates Allowed
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={editingSocietyRecord.max_gates_allowed}
                    onChange={(inputEvent) =>
                      setEditingSocietyRecord({
                        ...editingSocietyRecord,
                        max_gates_allowed: inputEvent.target.value,
                      })
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Photo Retention Days
                  </label>
                  <input
                    type="number"
                    min="7"
                    max="365"
                    value={editingSocietyRecord.photo_retention_days}
                    onChange={(inputEvent) =>
                      setEditingSocietyRecord({
                        ...editingSocietyRecord,
                        photo_retention_days: inputEvent.target.value,
                      })
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    License Status
                  </label>
                  <select
                    value={editingSocietyRecord.license_status}
                    onChange={(inputEvent) =>
                      setEditingSocietyRecord({
                        ...editingSocietyRecord,
                        license_status: inputEvent.target.value,
                      })
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] font-semibold focus:outline-none focus:border-blue-600"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="TRIAL">TRIAL</option>
                    <option value="GRACE_PERIOD">GRACE_PERIOD</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={editingSocietyRecord.subscription_expiry_date}
                    onChange={(inputEvent) =>
                      setEditingSocietyRecord({
                        ...editingSocietyRecord,
                        subscription_expiry_date: inputEvent.target.value,
                      })
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Feature Flags Toggles */}
              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                <span className="text-xs font-semibold text-[#64748B] uppercase block mb-1">
                  Feature Entitlement Flags
                </span>

                {[
                  { key: "enable_walkin_approval", label: "Walk-In Visitor Approval" },
                  { key: "enable_preapproval_passcode", label: "Pre-Approval 6-Digit Passcodes" },
                  { key: "enable_visitor_photo", label: "Visitor Camera Snapshot" },
                  { key: "enable_leave_at_gate", label: "Parcel Leave-At-Gate & OTP" },
                  { key: "enable_notice_board", label: "Digital Notice Board" },
                ].map((featureItem) => {
                  const isFeatureActive = Boolean(
                    editingSocietyRecord[featureItem.key]
                  );
                  return (
                    <div
                      key={featureItem.key}
                      onClick={() =>
                        setEditingSocietyRecord({
                          ...editingSocietyRecord,
                          [featureItem.key]: !isFeatureActive,
                        })
                      }
                      className="flex items-center justify-between p-2 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] hover:border-blue-300 cursor-pointer select-none transition-colors"
                    >
                      <span className="text-xs font-medium text-[#0F172A]">
                        {featureItem.label}
                      </span>
                      {isFeatureActive ? (
                        <ToggleRight className="w-5 h-5 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-[#94A3B8]" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditingSocietyRecord(null)}
                  className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingEntitlements}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-sm shadow-sm transition-all text-sm active:scale-[0.98]"
                >
                  {isUpdatingEntitlements ? "Saving..." : "Save Entitlements"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
