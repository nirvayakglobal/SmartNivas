import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  DoorClosed,
  CheckCircle,
  AlertCircle,
  Phone,
  Shield,
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
  const [isSubmittingGuard, setIsSubmittingGuard] = useState(false);
  const [guardFeedbackMessage, setGuardFeedbackMessage] = useState("");
  const [guardErrorMessage, setGuardErrorMessage] = useState("");

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
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#0F172A] font-heading flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Security Guard Personnel Accounts
              </h3>
              <span className="text-xs text-[#64748B] font-mono">
                {gatesAndGuardsData.guards.length} Guards Registered
              </span>
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

            {/* Existing Guards List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {gatesAndGuardsData.guards.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#94A3B8] italic">
                  No guard accounts registered yet.
                </div>
              ) : (
                gatesAndGuardsData.guards.map((guardItem) => (
                  <div
                    key={guardItem.user_id}
                    className="flex items-center justify-between p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#0F172A] font-heading">
                        {guardItem.full_name}
                      </div>
                      <div className="text-xs font-mono text-[#64748B] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        {guardItem.phone_number}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      Gate Guard
                    </span>
                  </div>
                ))
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
              <input
                type="password"
                required
                maxLength={4}
                placeholder="4-Digit PIN"
                value={guardFourDigitPin}
                onChange={(event) => setGuardFourDigitPin(event.target.value)}
                className="bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-blue-600"
              />
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
    </div>
  );
}
