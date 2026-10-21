import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { KeyRound, Lock, ArrowRight, ShieldCheck } from "lucide-react";

export function SocietyAdminBootstrapActivationPage() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const [bootstrapToken, setBootstrapToken] = useState(tokenFromUrl);
  const [adminFullName, setAdminFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigationController = useNavigate();

  const handleActivationSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setIsActivating(true);
    setErrorMessage("");

    try {
      const httpApiResponse = await fetch("/api/auth/activate-society-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: bootstrapToken,
          new_password: newPassword,
          full_name: adminFullName || null,
        }),
      });

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        localStorage.setItem(
          "smart_nivas_auth_token",
          responseJsonData.data.access_token
        );
        localStorage.setItem(
          "smart_nivas_user_profile",
          JSON.stringify(responseJsonData.data.user)
        );
        navigationController("/admin/topology");
      } else {
        setErrorMessage(responseJsonData.message || "Activation failed.");
      }
    } catch (networkError) {
      setErrorMessage("Network error during account activation.");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex flex-col justify-center items-center p-6 text-[#0F172A] bg-dot-pattern-light">
      <div className="w-full max-w-md bg-white border border-[#CBD5E1] rounded-lg p-8 shadow-[0_20px_25px_-5px_rgba(15,23,42,0.08)] space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading">
            Activate Society Admin
          </h1>
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
            Zero-Knowledge Security Provisioning
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-700 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleActivationSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
              Bootstrap Token *
            </label>
            <input
              type="text"
              required
              value={bootstrapToken}
              onChange={(event) => setBootstrapToken(event.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
              Your Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Ketanbhai Shah"
              value={adminFullName}
              onChange={(event) => setAdminFullName(event.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
              Set New Password (Min 8 Characters) *
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={isActivating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-sm shadow-sm flex items-center justify-center space-x-2 text-sm transition-all active:scale-[0.98]"
          >
            <span>{isActivating ? "Activating..." : "Complete Setup & Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
