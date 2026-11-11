import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  LogOut,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentBrowserLocation.pathname]);

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

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Header */}
        <div className="h-16 min-h-[64px] max-h-[64px] px-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
              <img
                src={brandMark}
                alt="Smart Nivas"
                className="w-9 h-9 object-contain"
              />
            </div>
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <div className="overflow-hidden">
                <span className="font-bold text-base tracking-tight text-[#0F172A] font-heading block truncate leading-tight">
                  Smart Nivas
                </span>
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block truncate">
                  {currentOperatorBadge}
                </span>
              </div>
            )}
          </div>
          {/* Close button for mobile drawer */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
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
                title={isSidebarCollapsed && !isMobileMenuOpen ? navigationItem.displayLabel : ""}
                className={`flex items-center ${
                  isSidebarCollapsed && !isMobileMenuOpen ? "justify-center" : "justify-between"
                } px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isRouteActive
                    ? "bg-blue-50 text-blue-600 font-semibold border border-blue-200"
                    : "text-[#334155] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <NavigationIcon
                    className={`w-4 h-4 shrink-0 ${
                      isRouteActive ? "text-blue-600" : "text-[#64748B]"
                    }`}
                  />
                  {(!isSidebarCollapsed || isMobileMenuOpen) && (
                    <span className="truncate">{navigationItem.displayLabel}</span>
                  )}
                </div>
                {(!isSidebarCollapsed || isMobileMenuOpen) && navigationItem.badgeCount !== undefined && (
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full shrink-0 ${
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
          <div className="flex items-center space-x-2.5 overflow-hidden min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-600 shrink-0">
              {parsedUserProfile?.user_role === "SUPER_ADMIN" ? "HQ" : "SA"}
            </div>
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <div className="overflow-hidden min-w-0">
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
            className="p-1.5 rounded-md text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F7F9FB] overflow-hidden antialiased text-[#0F172A]">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar (Slide-out drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E2E8F0] transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>

      {/* Desktop / Tablet Left Sidebar */}
      <aside
        className={`hidden md:flex flex-col justify-between shrink-0 z-30 bg-white border-r border-[#E2E8F0] shadow-[1px_0_2px_0_rgba(15,23,42,0.03)] transition-all duration-200 ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {navContent}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 min-h-[64px] max-h-[64px] border-b border-[#E2E8F0] bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              title="Open Navigation"
              className="md:hidden p-2 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors shrink-0"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop / Tablet Collapse Toggle */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="hidden md:inline-flex p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors shrink-0"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            <div className="flex items-center space-x-2 min-w-0">
              <span className="text-sm sm:text-base font-bold text-[#0F172A] tracking-tight font-heading truncate">
                {portalType === "admin" && parsedSocietyProfile?.society_legal_name
                  ? parsedSocietyProfile.society_legal_name
                  : portalTitle || "Smart Nivas"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2 bg-emerald-50 border border-emerald-200 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="hidden sm:inline">System Online</span>
              <span className="sm:hidden text-[11px]">Online</span>
            </div>
          </div>
        </header>

        {/* Page Canvas with responsive padding */}
        <main className="p-3 sm:p-5 md:p-8 flex-1 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
