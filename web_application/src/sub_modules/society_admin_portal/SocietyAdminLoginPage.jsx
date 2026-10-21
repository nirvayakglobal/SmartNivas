import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Lock, Phone, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";

export function SocietyAdminLoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [societyCode, setSocietyCode] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigationController = useNavigate();

  const handleLoginSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    setIsAuthenticating(true);
    setErrorMessage("");

    try {
      const httpApiResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phoneNumber,
          password: password,
          society_code: societyCode.toUpperCase() || null,
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
        if (responseJsonData.data.society) {
          localStorage.setItem(
            "smart_nivas_society_profile",
            JSON.stringify(responseJsonData.data.society)
          );
        }
        navigationController("/admin/topology");
      } else {
        setErrorMessage(responseJsonData.message || "Invalid credentials.");
      }
    } catch (networkError) {
      setErrorMessage("Network error connecting to backend API.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex flex-col justify-center items-center p-6 text-[#0F172A] bg-dot-pattern-light">
      <div className="w-full max-w-md bg-white border border-[#CBD5E1] rounded-lg p-8 shadow-[0_20px_25px_-5px_rgba(15,23,42,0.08)] space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading">
            Smart Nivas Admin
          </h1>
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
            Society Managing Committee ERP
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-700 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#334155] uppercase block mb-1.5">
              Society Unique Code (Optional if unique)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="e.g. SHALIGRAM"
                value={societyCode}
                onChange={(event) => setSocietyCode(event.target.value.toUpperCase())}
                className="w-full bg-white border border-[#CBD5E1] rounded-sm pl-9 pr-3.5 py-2 text-sm text-[#0F172A] font-mono uppercase placeholder-[#94A3B8] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#334155] uppercase block mb-1.5">
              Admin Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
              <input
                type="tel"
                required
                placeholder="9825000000"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-sm pl-9 pr-3.5 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#334155] uppercase block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-sm pl-9 pr-3.5 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-sm shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
          >
            <span>{isAuthenticating ? "Verifying..." : "Sign In to Society ERP"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#E2E8F0]">
          <p className="text-[11px] text-[#64748B] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Row-Level Privacy: Zero Access for Niravayak Super Admin
          </p>
        </div>
      </div>
    </div>
  );
}
