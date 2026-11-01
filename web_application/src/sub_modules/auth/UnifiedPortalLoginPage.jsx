import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import loginLogo from "../../assets/smartnivas_login_logo.png";

/**
 * Standard Minimal Login Component
 * Strictly contains:
 * 1. Logo
 * 2. Username / Phone number
 * 3. Password
 * 4. Submit button
 *
 * Each portal has its own dedicated URL, title, and target redirection.
 */
export function UnifiedPortalLoginPage({
  portalTitle = "Sign In",
  portalSubtitle = "Smart Nivas Portal",
  defaultIdentifier = "",
  defaultPassword = "",
  targetRedirect = "/Society/Admin/dashboard",
}) {
  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [password, setPassword] = useState(defaultPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigationController = useNavigate();

  const handleLoginSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    setIsAuthenticating(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: identifier.trim(),
          password: password,
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.access_token) {
        localStorage.setItem("smart_nivas_auth_token", result.data.access_token);
        localStorage.setItem(
          "smart_nivas_user_profile",
          JSON.stringify(result.data.user)
        );
        if (result.data.society) {
          localStorage.setItem(
            "smart_nivas_society_profile",
            JSON.stringify(result.data.society)
          );
        }

        const userRole = result.data.user?.user_role;
        if (userRole === "SUPER_ADMIN") {
          navigationController("/CRM/leads");
        } else {
          navigationController(targetRedirect || "/Society/Admin/dashboard");
        }
      } else {
        setErrorMessage(result.message || "Invalid credentials.");
      }
    } catch (networkErr) {
      setErrorMessage("Network error connecting to backend API.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900 bg-dot-pattern-light antialiased">
      <div className="w-full max-w-[420px] bg-white border border-slate-200/90 rounded-2xl p-8 shadow-[0_20px_45px_-12px_rgba(15,23,42,0.08),0_1px_3px_0_rgba(15,23,42,0.04)] space-y-6">
        {/* 1. Logo & Portal Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img
              src={loginLogo}
              alt="Smart Nivas"
              className="h-24 w-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
              {portalTitle}
            </h1>
            {portalSubtitle ? (
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mt-0.5">
                {portalSubtitle}
              </p>
            ) : null}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Form: Username / Phone + Password */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {/* 2. Username / Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Username / Phone Number
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(changeEvent) => setIdentifier(changeEvent.target.value)}
                placeholder="Enter username or phone number"
                className="block w-full pl-10 pr-4 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>
          </div>

          {/* 3. Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(changeEvent) => setPassword(changeEvent.target.value)}
                placeholder="Enter password"
                className="block w-full pl-10 pr-11 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full mt-2 inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-blue-600/25 transition-all duration-150 cursor-pointer"
          >
            {isAuthenticating ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Enterprise Zero-Knowledge Architecture</span>
        </div>
      </div>
    </div>
  );
}
