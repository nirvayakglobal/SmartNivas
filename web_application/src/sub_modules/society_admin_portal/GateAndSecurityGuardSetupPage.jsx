import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  DoorClosed,
  CheckCircle,
  AlertCircle,
  Phone,
  Shield,
  UserX,
  UserCheck,
  Edit2,
  X,
  Lock,
  Eye,
  EyeOff,
  History,
  Calendar,
  Search,
} from "lucide-react";

export function GateAndSecurityGuardSetupPage() {
  const [gatesAndGuardsData, setGatesAndGuardsData] = useState({
    gates: [],
    guards: [],
  });
  const [isLoadingGatesAndGuards, setIsLoadingGatesAndGuards] = useState(true);

  // New Gate State
  const [newGateName, setNewGateName] = useState("");
  const [isSubmittingGate, setIsSubmittingGate] = useState(false);
  const [gateFeedbackMessage, setGateFeedbackMessage] = useState("");
  const [gateErrorMessage, setGateErrorMessage] = useState("");

  // New Guard State
  const [guardFullName, setGuardFullName] = useState("");
  const [guardPhoneNumber, setGuardPhoneNumber] = useState("");
  const [guardFourDigitPin, setGuardFourDigitPin] = useState("");
  const [showGuardPin, setShowGuardPin] = useState(true);
  const [isSubmittingGuard, setIsSubmittingGuard] = useState(false);
  const [guardFeedbackMessage, setGuardFeedbackMessage] = useState("");
  const [guardErrorMessage, setGuardErrorMessage] = useState("");

  // Edit Guard Modal State
  const [editingGuard, setEditingGuard] = useState(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editPin, setEditPin] = useState("");
  const [showEditPin, setShowEditPin] = useState(true);
  const [isUpdatingGuard, setIsUpdatingGuard] = useState(false);
  const [togglingGuardId, setTogglingGuardId] = useState(null);

  // Guards History Filter State
  const [guardFilterStatus, setGuardFilterStatus] = useState("ALL"); // ALL | ACTIVE | PREVIOUS
  const [guardSearchQuery, setGuardSearchQuery] = useState("");

  const fetchGatesAndGuards = async () => {
    setIsLoadingGatesAndGuards(true);
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/admin/gates", {
        headers: { Authorization: `Bearer ${storedAuthToken}` },
      });
      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setGatesAndGuardsData(responseJsonData.data);
      }
    } catch (networkError) {
      console.error("Failed to load gates and guards:", networkError);
    } finally {
      setIsLoadingGatesAndGuards(false);
    }
  };

  useEffect(() => {
    fetchGatesAndGuards();
  }, []);

  const handleCreateGateSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    setIsSubmittingGate(true);
    setGateFeedbackMessage("");
    setGateErrorMessage("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/admin/gates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedAuthToken}`,
        },
        body: JSON.stringify({ gate_name: newGateName }),
      });

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setGateFeedbackMessage(responseJsonData.message);
        setNewGateName("");
        fetchGatesAndGuards();
      } else {
        setGateErrorMessage(responseJsonData.message || "Failed to setup gate.");
      }
    } catch (networkError) {
      setGateErrorMessage("Network error creating gate.");
    } finally {
      setIsSubmittingGate(false);
    }
  };

  const handleCreateGuardSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    setIsSubmittingGuard(true);
    setGuardFeedbackMessage("");
    setGuardErrorMessage("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/admin/guards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedAuthToken}`,
        },
        body: JSON.stringify({
          full_name: guardFullName,
          phone_number: guardPhoneNumber,
          pin: guardFourDigitPin,
        }),
      });

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setGuardFeedbackMessage(responseJsonData.message);
        setGuardFullName("");
        setGuardPhoneNumber("");
        setGuardFourDigitPin("");
        fetchGatesAndGuards();
      } else {
        setGuardErrorMessage(
          responseJsonData.message || "Failed to create security guard."
        );
      }
    } catch (networkError) {
      setGuardErrorMessage("Network error creating guard.");
    } finally {
      setIsSubmittingGuard(false);
    }
  };

  const handleToggleGuardStatus = async (guardItem) => {
    setTogglingGuardId(guardItem.user_id);
    setGuardFeedbackMessage("");
    setGuardErrorMessage("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const nextStatus = !guardItem.is_active;
      const res = await fetch(`/api/admin/guards/${guardItem.user_id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedAuthToken}`,
        },
        body: JSON.stringify({ is_active: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setGuardFeedbackMessage(data.message || `Guard status changed.`);
        fetchGatesAndGuards();
      } else {
        setGuardErrorMessage(data.message || "Failed to update guard status.");
      }
    } catch (err) {
      setGuardErrorMessage("Network error updating guard status.");
    } finally {
      setTogglingGuardId(null);
    }
  };

  const handleStartEditGuard = (guardItem) => {
    setEditingGuard(guardItem);
    setEditFullName(guardItem.full_name);
    setEditPhoneNumber(guardItem.phone_number);
    setEditPin("");
  };

  const handleUpdateGuardSubmit = async (e) => {
    e.preventDefault();
    if (!editingGuard) return;
    setIsUpdatingGuard(true);
    setGuardFeedbackMessage("");
    setGuardErrorMessage("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const payload = {
        full_name: editFullName,
        phone_number: editPhoneNumber,
      };
      if (editPin.trim()) {
        payload.pin = editPin.trim();
      }

      const res = await fetch(`/api/admin/guards/${editingGuard.user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedAuthToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setGuardFeedbackMessage(data.message || "Guard updated successfully.");
        setEditingGuard(null);
        fetchGatesAndGuards();
      } else {
        setGuardErrorMessage(data.message || "Failed to update guard.");
      }
    } catch (err) {
      setGuardErrorMessage("Network error updating guard.");
    } finally {
      setIsUpdatingGuard(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Gates & Security Guard Account Setup
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Configure checkpoint gates within subscription limits and provision guards with 4-digit rapid-entry PINs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Gates Management (Enterprise Light Resting Card) */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 space-y-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#0F172A] font-heading flex items-center gap-2">
                <DoorClosed className="w-5 h-5 text-blue-600" />
                Physical Checkpoint Gates
              </h3>
              <span className="text-xs text-[#64748B] font-mono">
                {gatesAndGuardsData.gates.length} Gates Configured
              </span>
            </div>

            {gateFeedbackMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{gateFeedbackMessage}</span>
              </div>
            )}

            {gateErrorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{gateErrorMessage}</span>
              </div>
            )}

            {/* Existing Gates List */}
            <div className="space-y-2">
              {gatesAndGuardsData.gates.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#94A3B8] italic">
                  No gates configured yet.
                </div>
              ) : (
                gatesAndGuardsData.gates.map((gateItem) => (
                  <div
                    key={gateItem.gate_id}
                    className="flex items-center justify-between p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-700">
                        #{gateItem.gate_id}
                      </div>
                      <span className="text-sm font-bold text-[#0F172A] font-heading">
                        {gateItem.gate_name}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Active Gate
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Gate Form */}
          <form
            onSubmit={handleCreateGateSubmit}
            className="pt-4 border-t border-[#E2E8F0] space-y-3"
          >
            <label className="text-xs font-semibold text-[#334155] uppercase block">
              Provision New Gate (Plan Quota Enforced)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                required
                placeholder="e.g. Main North Gate / Gate 1"
                value={newGateName}
                onChange={(event) => setNewGateName(event.target.value)}
                className="flex-1 bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={isSubmittingGate}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-sm text-xs transition-all shadow-sm active:scale-[0.98]"
              >
                {isSubmittingGate ? "Adding..." : "Add Gate"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Security Guards Provisioning (Enterprise Light Resting Card) */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 space-y-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2E8F0] pb-3 gap-2">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] font-heading flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Security Guard Personnel Accounts
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Manage active gate personnel & track complete duty service history.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                  {gatesAndGuardsData.guards.filter((g) => g.is_active).length} Active
                </span>
                <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                  {gatesAndGuardsData.guards.filter((g) => !g.is_active).length} Previous
                </span>
              </div>
            </div>

            {guardFeedbackMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{guardFeedbackMessage}</span>
              </div>
            )}

            {guardErrorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{guardErrorMessage}</span>
              </div>
            )}

            {/* Filter & Search Bar for Guard Roster */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by guard name or phone..."
                  value={guardSearchQuery}
                  onChange={(e) => setGuardSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Status Tabs: All, Active, Previously Served */}
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setGuardFilterStatus("ALL")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    guardFilterStatus === "ALL"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  All ({gatesAndGuardsData.guards.length})
                </button>
                <button
                  type="button"
                  onClick={() => setGuardFilterStatus("ACTIVE")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    guardFilterStatus === "ACTIVE"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  Active ({gatesAndGuardsData.guards.filter((g) => g.is_active).length})
                </button>
                <button
                  type="button"
                  onClick={() => setGuardFilterStatus("PREVIOUS")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                    guardFilterStatus === "PREVIOUS"
                      ? "bg-amber-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <History className="w-3 h-3" />
                  <span>
                    Previously Served (
                    {gatesAndGuardsData.guards.filter((g) => !g.is_active).length})
                  </span>
                </button>
              </div>
            </div>

            {/* Existing Guards List */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {gatesAndGuardsData.guards.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#94A3B8] italic">
                  No guard accounts registered yet.
                </div>
              ) : (
                (() => {
                  const filteredGuards = gatesAndGuardsData.guards.filter((guardItem) => {
                    const matchesSearch =
                      guardItem.full_name
                        .toLowerCase()
                        .includes(guardSearchQuery.toLowerCase()) ||
                      guardItem.phone_number.includes(guardSearchQuery);

                    if (!matchesSearch) return false;

                    if (guardFilterStatus === "ACTIVE") return !!guardItem.is_active;
                    if (guardFilterStatus === "PREVIOUS") return !guardItem.is_active;
                    return true;
                  });

                  if (filteredGuards.length === 0) {
                    return (
                      <div className="text-center py-8 text-xs text-[#94A3B8] italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        No guards match the selected filter.
                      </div>
                    );
                  }

                  return filteredGuards.map((guardItem) => {
                    const isActive = !!guardItem.is_active;
                    const isToggling = togglingGuardId === guardItem.user_id;

                    return (
                      <div
                        key={guardItem.user_id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border gap-3 transition-all ${
                          isActive
                            ? "bg-[#F8FAFC] border-[#E2E8F0] shadow-2xs hover:border-slate-300"
                            : "bg-amber-50/40 border-amber-200/80 hover:border-amber-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isActive
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {guardItem.full_name?.charAt(0)?.toUpperCase() || "G"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-sm font-bold font-heading ${
                                  isActive ? "text-[#0F172A]" : "text-slate-700"
                                }`}
                              >
                                {guardItem.full_name}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  isActive
                                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                    : "text-amber-800 bg-amber-100 border-amber-200"
                                }`}
                              >
                                {isActive ? "Active Duty" : "Previously Served / Inactive"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[#64748B] mt-1 flex-wrap">
                              <div className="flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{guardItem.phone_number}</span>
                              </div>
                              {guardItem.created_at && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>
                                    Enrolled:{" "}
                                    {new Date(guardItem.created_at).toLocaleDateString(
                                      "en-IN",
                                      {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      }
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {/* Edit Guard Button */}
                          <button
                            type="button"
                            onClick={() => handleStartEditGuard(guardItem)}
                            title="Edit Guard Details or Reset PIN"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-md transition-colors text-xs flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-medium hidden sm:inline">
                              Edit
                            </span>
                          </button>

                          {/* Inactivate / Reactivate Toggle Button */}
                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() => handleToggleGuardStatus(guardItem)}
                            title={
                              isActive
                                ? "Inactivate Guard (Moves to previously served records)"
                                : "Reactivate Guard (Restores active duty & gate app access)"
                            }
                            className={`px-3 py-1 text-xs font-semibold rounded-md border transition-colors flex items-center gap-1.5 ${
                              isActive
                                ? "text-rose-700 bg-white hover:bg-rose-50 border-rose-200"
                                : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                            }`}
                          >
                            {isActive ? (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>{isToggling ? "Updating..." : "Mark Inactive"}</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>{isToggling ? "Updating..." : "Reactivate Duty"}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>

          {/* Add Guard Form */}
          <form
            onSubmit={handleCreateGuardSubmit}
            className="pt-4 border-t border-[#E2E8F0] space-y-3"
          >
            <label className="text-xs font-semibold text-[#334155] uppercase block">
              Create Guard Account (4-Digit PIN Access)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                required
                placeholder="Guard Full Name"
                value={guardFullName}
                onChange={(event) => setGuardFullName(event.target.value)}
                className="bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-blue-600"
              />
              <input
                type="tel"
                required
                placeholder="Phone (9825444444)"
                value={guardPhoneNumber}
                onChange={(event) => setGuardPhoneNumber(event.target.value)}
                className="bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-blue-600"
              />
              <div className="relative">
                <input
                  type={showGuardPin ? "text" : "password"}
                  required
                  maxLength={4}
                  pattern="[0-9]{4}"
                  placeholder="4-Digit PIN (e.g. 1234)"
                  value={guardFourDigitPin}
                  onChange={(event) =>
                    setGuardFourDigitPin(event.target.value.replace(/\D/g, ""))
                  }
                  className="w-full bg-white border border-[#CBD5E1] rounded-sm pl-3 pr-8 py-2 text-xs text-[#0F172A] font-mono tracking-widest focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowGuardPin(!showGuardPin)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showGuardPin ? "Hide PIN" : "Show PIN"}
                >
                  {showGuardPin ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmittingGuard}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-sm text-xs transition-all shadow-sm active:scale-[0.98]"
            >
              {isSubmittingGuard ? "Registering..." : "Create Guard Account"}
            </button>
          </form>
        </div>
      </div>

      {/* Edit Guard Modal */}
      {editingGuard && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#CBD5E1] shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-[#0F172A] text-sm">
                  Edit Guard Personnel Details
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingGuard(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateGuardSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guard Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={editPhoneNumber}
                  onChange={(e) => setEditPhoneNumber(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Reset 4-Digit PIN Passcode</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Leave empty to keep unchanged)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showEditPin ? "text" : "password"}
                    maxLength={4}
                    pattern="[0-9]{4}"
                    placeholder="Enter new 4-digit numeric PIN (e.g. 1234)"
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-white border border-[#CBD5E1] rounded pl-8 pr-8 py-2 text-xs text-[#0F172A] font-mono tracking-widest focus:outline-none focus:border-blue-600"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <button
                    type="button"
                    onClick={() => setShowEditPin(!showEditPin)}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showEditPin ? "Hide PIN" : "Show PIN"}
                  >
                    {showEditPin ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingGuard(null)}
                  className="px-3.5 py-1.5 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingGuard}
                  className="px-4 py-1.5 rounded text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm active:scale-[0.98] disabled:opacity-60"
                >
                  {isUpdatingGuard ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
