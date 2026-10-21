import React from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  Building2,
  LogOut,
  ChevronRight,
  Shield,
} from "lucide-react";

export function DesktopWebPortalLayout({
  portalTitle,
  portalSubtitle,
  currentOperatorBadge,
  navigationItems,
  portalType = "central",
  children,
}) {
  const currentBrowserLocation = useLocation();
  const navigationController = useNavigate();

  const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
  const storedUserProfileString = localStorage.getItem("smart_nivas_user_profile");

  let parsedUserProfile = null;
  if (storedUserProfileString) {
    try {
      parsedUserProfile = JSON.parse(storedUserProfileString);
    } catch (parseError) {
      console.warn("Failed to parse user profile from localStorage.");
    }
  }

  // Strict route guard
  const isSuperAdmin = parsedUserProfile?.user_role === "SUPER_ADMIN";
  const isSocietyAdmin = parsedUserProfile?.user_role === "SOCIETY_ADMIN";

  if (!storedAuthToken || !parsedUserProfile) {
    const targetLoginRoute = portalType === "admin" ? "/admin/login" : "/central/login";
    return <Navigate to={targetLoginRoute} replace />;
  }

  if (portalType === "central" && !isSuperAdmin) {
    return <Navigate to="/central/login" replace />;
  }

  if (portalType === "admin" && !isSocietyAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleUserLogout = () => {
    localStorage.removeItem("smart_nivas_auth_token");
    localStorage.removeItem("smart_nivas_user_profile");
    localStorage.removeItem("smart_nivas_society_profile");
    if (portalType === "admin") {
      navigationController("/admin/login");
    } else {
      navigationController("/central/login");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F7F9FB] text-[#0F172A] antialiased font-sans">
      {/* Desktop Left Sidebar (Enterprise Light Surface) */}
      <aside className="w-72 flex-shrink-0 border-r border-[#E2E8F0] bg-white flex flex-col justify-between shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-[#0F172A] font-heading leading-tight">
                  Smart Nivas
                </h1>
                <p className="text-[11px] text-blue-600 font-semibold tracking-wide uppercase">
                  {currentOperatorBadge || "Niravayak Global"}
                </p>
              </div>
            </div>
          </div>

          {/* Module Identity Box */}
          <div className="px-5 py-4">
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3">
              <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase block">
                ENVIRONMENT
              </span>
              <p className="text-sm font-semibold text-[#0F172A] font-heading mt-0.5">
                {portalTitle}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">
                {portalSubtitle}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-1 space-y-1">
            {navigationItems.map((navigationItem) => {
              const isRouteActive =
                currentBrowserLocation.pathname === navigationItem.targetPath;
              const NavigationIcon = navigationItem.iconComponent;

              return (
                <Link
                  key={navigationItem.targetPath}
                  to={navigationItem.targetPath}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                    isRouteActive
                      ? "bg-blue-50 text-blue-600 font-semibold border border-blue-200"
                      : "text-[#334155] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <NavigationIcon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isRouteActive ? "text-blue-600" : "text-[#64748B]"
                      }`}
                    />
                    <span>{navigationItem.displayLabel}</span>
                  </div>
                  {navigationItem.badgeCount !== undefined && (
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        isRouteActive
                          ? "bg-blue-600 text-white"
                          : "bg-[#F1F5F9] text-[#64748B]"
                      }`}
                    >
                      {navigationItem.badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Card */}
        <div className="p-4 border-t border-[#E2E8F0] bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-600">
                {parsedUserProfile?.user_role === "SUPER_ADMIN" ? "HQ" : "SA"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-[#0F172A] truncate">
                  {parsedUserProfile?.full_name || "Administrator"}
                </p>
                <p className="text-[11px] text-[#64748B] font-mono truncate">
                  {parsedUserProfile?.phone_number}
                </p>
              </div>
            </div>
            <button
              onClick={handleUserLogout}
              title="Sign Out"
              className="p-2 rounded-md text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[#E2E8F0] bg-white px-8 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_2px_0_rgba(15,23,42,0.03)]">
          <div className="flex items-center space-x-2 text-sm text-[#64748B]">
            <span className="font-medium text-[#334155]">Smart Nivas</span>
            <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
            <span className="font-semibold text-[#0F172A] font-heading">{portalTitle}</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>Hostinger WSGI Online</span>
            </div>
          </div>
        </header>

        {/* Page Canvas */}
        <main className="p-8 flex-1 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
