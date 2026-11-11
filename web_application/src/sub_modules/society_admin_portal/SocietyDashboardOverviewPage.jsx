import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  ShieldCheck,
  Megaphone,
  Layers,
  ArrowUpRight,
  UserPlus,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export function SocietyDashboardOverviewPage() {
  const [dashboardMetrics, setDashboardMetrics] = useState({
    total_flats_count: 0,
    owner_occupied_count: 0,
    tenant_occupied_count: 0,
    vacant_flats_count: 0,
    total_residents_count: 0,
    total_guards_count: 0,
    total_gates_count: 0,
    active_campus_visitors_count: 0,
    total_notices_count: 0,
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // Stored Society Profile
  const storedSocietyProfileString = localStorage.getItem(
    "smart_nivas_society_profile"
  );
  let parsedSocietyProfile = null;
  if (storedSocietyProfileString) {
    try {
      parsedSocietyProfile = JSON.parse(storedSocietyProfileString);
    } catch (parseError) {
      console.warn("Failed to parse society profile.");
    }
  }

  const fetchDashboardMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/admin/dashboard/metrics", {
        headers: { Authorization: `Bearer ${storedAuthToken}` },
      });
      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setDashboardMetrics(responseJsonData.data);
      }
    } catch (networkError) {
      console.error("Failed to fetch dashboard metrics:", networkError);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const totalOccupiedCount =
    dashboardMetrics.owner_occupied_count +
    dashboardMetrics.tenant_occupied_count;
  const occupancyPercentage =
    dashboardMetrics.total_flats_count > 0
      ? Math.round(
          (totalOccupiedCount / dashboardMetrics.total_flats_count) * 100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Operations Header Bar: Quick Actions inline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#0F172A] font-heading">
            Overview & Operations
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time apartment occupancy, campus security, and resident directory.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/Society/Admin/residents"
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 rounded-lg text-xs shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard Resident</span>
          </Link>
          <Link
            to="/Society/Admin/notices"
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-[#334155] border border-[#CBD5E1] font-semibold px-3.5 py-2 rounded-lg text-xs shadow-sm transition-all"
          >
            <Megaphone className="w-4 h-4 text-blue-600" />
            <span>Broadcast Circular</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Flats & Occupancy */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Total Apartments
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#0F172A] font-heading">
              {dashboardMetrics.total_flats_count}
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {occupancyPercentage}% Occupied
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#64748B] pt-2 border-t border-[#F1F5F9]">
            <span>
              <strong className="text-[#0F172A]">
                {dashboardMetrics.owner_occupied_count}
              </strong>{" "}
              Owner
            </span>
            <span>•</span>
            <span>
              <strong className="text-[#0F172A]">
                {dashboardMetrics.tenant_occupied_count}
              </strong>{" "}
              Tenant
            </span>
            <span>•</span>
            <span>
              <strong className="text-[#0F172A]">
                {dashboardMetrics.vacant_flats_count}
              </strong>{" "}
              Vacant
            </span>
          </div>
        </div>

        {/* Residents */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Verified Residents
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#0F172A] font-heading">
              {dashboardMetrics.total_residents_count}
            </span>
            <span className="text-xs text-[#64748B]">Members Active</span>
          </div>
          <div className="text-xs text-[#64748B] pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
            <span>Passcode & Push Enabled</span>
            <Link
              to="/Society/Admin/residents"
              className="text-blue-600 font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>Manage</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Security & Guards */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Security Gates
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#0F172A] font-heading">
              {dashboardMetrics.total_gates_count} Gates
            </span>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              {dashboardMetrics.total_guards_count} Guards
            </span>
          </div>
          <div className="text-xs text-[#64748B] pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
            <span>PIN Authentication</span>
            <Link
              to="/Society/Admin/gates"
              className="text-blue-600 font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>Setup</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Visitors Inside Campus */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Visitors On-Campus
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#0F172A] font-heading">
              {dashboardMetrics.active_campus_visitors_count}
            </span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Live Presence
            </span>
          </div>
          <div className="text-xs text-[#64748B] pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
            <span>Entry Register</span>
            <Link
              to="/Society/Admin/visitor-logs"
              className="text-blue-600 font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>View Logs</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Navigation Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/Society/Admin/topology"
          className="bg-white border border-[#E2E8F0] hover:border-blue-500 rounded-xl p-5 shadow-sm transition-all group hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#94A3B8] group-hover:text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A] font-heading">
            Wings & Flat Directory
          </h3>
          <p className="text-xs text-[#64748B] mt-1">
            Visual building elevation stack, wings layout, and apartment inventory.
          </p>
        </Link>

        <Link
          to="/Society/Admin/residents"
          className="bg-white border border-[#E2E8F0] hover:border-blue-500 rounded-xl p-5 shadow-sm transition-all group hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#94A3B8] group-hover:text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A] font-heading">
            Resident Directory & CSV
          </h3>
          <p className="text-xs text-[#64748B] mt-1">
            Onboard new families, bulk CSV imports, member directory search, and export capabilities.
          </p>
        </Link>

        <Link
          to="/Society/Admin/visitor-logs"
          className="bg-white border border-[#E2E8F0] hover:border-blue-500 rounded-xl p-5 shadow-sm transition-all group hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#94A3B8] group-hover:text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A] font-heading">
            Visitor & Gate Audit
          </h3>
          <p className="text-xs text-[#64748B] mt-1">
            Live campus guest tracking, delivery vehicle logs, entry approval records, and checkout actions.
          </p>
        </Link>
      </div>
    </div>
  );
}
