import React, { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  LogOut,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import brandMark from "../assets/smartnivas_mark.png";

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
  const storedUserProfileString = localStorage.getItem(
    "smart_nivas_user_profile"
  );
  const storedSocietyProfileString = localStorage.getItem(
    "smart_nivas_society_profile"
  );

  let parsedUserProfile = null;
  if (storedUserProfileString) {
    try {
      parsedUserProfile = JSON.parse(storedUserProfileString);
    } catch (parseError) {
      console.warn("Failed to parse user profile from localStorage.");
    }
  }

  let parsedSocietyProfile = null;
  if (storedSocietyProfileString) {
    try {
      parsedSocietyProfile = JSON.parse(storedSocietyProfileString);
    } catch (parseError) {
      console.warn("Failed to parse society profile.");
    }
  }

  // Strict route guard
  const isSuperAdmin = parsedUserProfile?.user_role === "SUPER_ADMIN";
  const isSocietyAdmin = parsedUserProfile?.user_role === "SOCIETY_ADMIN";

  if (!storedAuthToken || !parsedUserProfile) {
    const targetLoginRoute =
      portalType === "admin" ? "/Society/Admin/login" : "/CRM/login";
    return <Navigate to={targetLoginRoute} replace />;
  }

  if (portalType === "central" && !isSuperAdmin) {
    return <Navigate to="/CRM/login" replace />;
  }

  if (portalType === "admin" && !isSocietyAdmin) {
    return <Navigate to="/Society/Admin/login" replace />;
  }

  const handleUserLogout = () => {
    localStorage.removeItem("smart_nivas_auth_token");
    localStorage.removeItem("smart_nivas_user_profile");
    localStorage.removeItem("smart_nivas_society_profile");
    if (portalType === "admin") {
      navigationController("/Society/Admin/login");
    } else {
      navigationController("/CRM/login");
    }
  };

  return (
    <div className="flex h-screen bg-[#F7F9FB] overflow-hidden antialiased text-[#0F172A]">
      {/* Left Sidebar */}
      <aside
        className={`${
          isSidebarCollapsed ? "w-20" : "w-64"
        } border-r border-[#E2E8F0] bg-white flex flex-col justify-between shrink-0 z-30 shadow-[1px_0_2px_0_rgba(15,23,42,0.03)] transition-all duration-200`}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Brand Header: Logo is cleanly centered when collapsed, and paired with title when expanded */}
          <div className="h-16 min-h-[64px] max-h-[64px] px-4 border-b border-[#E2E8F0] flex items-center bg-white shrink-0">
            {isSidebarCollapsed ? (
              <div className="w-full flex items-center justify-center">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                  <img
                    src={brandMark}
                    alt="Smart Nivas"
                    className="w-8 h-8 object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                  <img
                    src={brandMark}
                    alt="Smart Nivas"
                    className="w-9 h-9 object-contain"
                  />
                </div>
                <div className="overflow-hidden">
                  <span className="font-bold text-base tracking-tight text-[#0F172A] font-heading block truncate leading-tight">
                    Smart Nivas
                  </span>
                  <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block truncate">
                    {currentOperatorBadge}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1">
            {navigationItems.map((navigationItem) => {
              const NavigationIcon = navigationItem.iconComponent;
              const isRouteActive =
                currentBrowserLocation.pathname === navigationItem.targetPath;

              return (
                <Link
                  key={navigationItem.targetPath}
                  to={navigationItem.targetPath}
                  title={isSidebarCollapsed ? navigationItem.displayLabel : ""}
                  className={`flex items-center ${
                    isSidebarCollapsed ? "justify-center" : "justify-between"
                  } px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isRouteActive
                      ? "bg-blue-50 text-blue-600 font-semibold border border-blue-200"
                      : "text-[#334155] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <NavigationIcon
                      className={`w-4 h-4 shrink-0 ${
                        isRouteActive ? "text-blue-600" : "text-[#64748B]"
                      }`}
                    />
                    {!isSidebarCollapsed && (
                      <span className="truncate">{navigationItem.displayLabel}</span>
                    )}
                  </div>
                  {!isSidebarCollapsed && navigationItem.badgeCount !== undefined && (
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
        <div className="p-3 border-t border-[#E2E8F0] bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-600 shrink-0">
                {parsedUserProfile?.user_role === "SUPER_ADMIN" ? "HQ" : "SA"}
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-[#0F172A] truncate">
                    {parsedUserProfile?.full_name || "Administrator"}
                  </p>
                  <p className="text-[11px] text-[#64748B] font-mono truncate">
                    {parsedUserProfile?.phone_number}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleUserLogout}
              title="Sign Out"
              className="p-1.5 rounded-md text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar with Sidebar Toggle and Society Name */}
        <header className="h-16 min-h-[64px] max-h-[64px] border-b border-[#E2E8F0] bg-white px-6 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors shrink-0"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-[#0F172A] tracking-tight font-heading">
                {portalType === "admin" && parsedSocietyProfile?.society_legal_name
                  ? parsedSocietyProfile.society_legal_name
                  : portalTitle || "Smart Nivas"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>System Online</span>
            </div>
          </div>
        </header>

        {/* Page Canvas */}
        <main className="p-8 flex-1 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
