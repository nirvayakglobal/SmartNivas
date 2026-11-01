import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  DoorOpen,
  ArrowRightLeft,
  FileSpreadsheet,
  Settings,
  Plus,
  Eye,
  Ban,
  ShieldCheck,
  Calendar,
  Home,
  Phone,
  FileText,
  RefreshCw,
  Download,
  AlertCircle,
  X,
} from "lucide-react";

export function DailyStaffAndHelperManagementPage() {
  const [activeTab, setActiveTab] = useState("ROSTER"); // ROSTER | LIVE_ATTENDANCE | CONFIG | REPORTS
  const [roster, setRoster] = useState([]);
  const [liveFeed, setLiveFeed] = useState([]);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [blacklistReport, setBlacklistReport] = useState([]);
  const [staffConfig, setStaffConfig] = useState({
    enforce_mandatory_id_proof: true,
    enforce_mandatory_police_verification: false,
    daily_entry_start_time: "06:00",
    daily_entry_cutoff_time: "22:00",
    allow_emergency_night_entry: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filters for Roster
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Filters for Reports
  const [reportStartDate, setReportStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [reportEndDate, setReportEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reportCategory, setReportCategory] = useState("ALL");

  // Modals
  const [selectedStaffForBlacklist, setSelectedStaffForBlacklist] = useState(null);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [isBlacklistSubmitting, setIsBlacklistSubmitting] = useState(false);

  const [selectedStaffForDetail, setSelectedStaffForDetail] = useState(null);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isGateScanModalOpen, setIsGateScanModalOpen] = useState(false);

  // New Staff Form
  const [newStaffForm, setNewStaffForm] = useState({
    full_name: "",
    phone_number: "",
    role_category: "Maid",
    gender: "Female",
    photo_url: "",
    id_proof_type: "Aadhaar",
    id_proof_number: "",
    id_proof_document_url: "",
    is_id_proof_verified: false,
    police_verification_status: "Pending",
    police_verification_doc_url: "",
    status: "Pending_KYC",
    assigned_flats_raw: "", // comma-separated e.g., "A-101, B-204"
  });

  const roleCategories = [
    "Maid",
    "Cook",
    "Driver",
    "Gardener",
    "Cleaner",
    "Car Washer",
    "Plumber",
    "Electrician",
    "Security",
    "Other",
  ];

  // Load initial data
  useEffect(() => {
    fetchStaffConfig();
    fetchRoster();
  }, [categoryFilter, statusFilter, searchQuery]);

  useEffect(() => {
    if (activeTab === "LIVE_ATTENDANCE") {
      fetchLiveFeed();
      const interval = setInterval(fetchLiveFeed, 10000); // 10s auto-refresh
      return () => clearInterval(interval);
    } else if (activeTab === "REPORTS") {
      fetchAttendanceReport();
      fetchBlacklistReport();
    }
  }, [activeTab, reportStartDate, reportEndDate, reportCategory]);

  const showFeedback = (msg, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(""), 6000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("society_admin_token");
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  // ----------------------------------------------------
  // API Fetch Handlers
  // ----------------------------------------------------
  const fetchStaffConfig = async () => {
    try {
      const res = await fetch("/api/admin/staff/config", { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && data.data) {
        setStaffConfig(data.data);
      }
    } catch (e) {
      console.error("Failed to load staff config:", e);
    }
  };

  const fetchRoster = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        category: categoryFilter,
        status: statusFilter,
        search: searchQuery,
      });
      const res = await fetch(`/api/admin/staff?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setRoster(data.data || []);
      } else {
        showFeedback(data.message || "Failed to load staff roster.", true);
      }
    } catch (e) {
      showFeedback("Network error loading staff roster.", true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLiveFeed = async () => {
    try {
      const res = await fetch("/api/admin/staff/live-attendance", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setLiveFeed(data.data || []);
      }
    } catch (e) {
      console.error("Live attendance error:", e);
    }
  };

  const fetchAttendanceReport = async () => {
    try {
      const params = new URLSearchParams({
        start_date: reportStartDate,
        end_date: reportEndDate,
        category: reportCategory,
      });
      const res = await fetch(`/api/admin/staff/reports/attendance-log?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setAttendanceReport(data.data || []);
      }
    } catch (e) {
      console.error("Attendance report error:", e);
    }
  };

  const fetchBlacklistReport = async () => {
    try {
      const res = await fetch("/api/admin/staff/reports/blacklist-audit", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setBlacklistReport(data.data || []);
      }
    } catch (e) {
      console.error("Blacklist report error:", e);
    }
  };

  // ----------------------------------------------------
  // Action Handlers
  // ----------------------------------------------------
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsConfigSaving(true);
    try {
      const res = await fetch("/api/admin/staff/config", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(staffConfig),
      });
      const data = await res.json();
      if (data.success) {
        setStaffConfig(data.data);
        showFeedback("Staff access timings and KYC policies saved successfully.");
      } else {
        showFeedback(data.message || "Failed to update configuration.", true);
      }
    } catch (e) {
      showFeedback("Error saving config.", true);
    } finally {
      setIsConfigSaving(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const flatList = newStaffForm.assigned_flats_raw
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
        .map((fn) => ({ flat_number: fn }));

      const payload = {
        ...newStaffForm,
        assigned_flats: flatList,
      };

      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Staff member ${data.data.full_name} registered successfully.`);
        setIsAddStaffModalOpen(false);
        setNewStaffForm({
          full_name: "",
          phone_number: "",
          role_category: "Maid",
          gender: "Female",
          photo_url: "",
          id_proof_type: "Aadhaar",
          id_proof_number: "",
          id_proof_document_url: "",
          is_id_proof_verified: false,
          police_verification_status: "Pending",
          police_verification_doc_url: "",
          status: "Pending_KYC",
          assigned_flats_raw: "",
        });
        fetchRoster();
      } else {
        showFeedback(data.message || "Registration failed.", true);
      }
    } catch (e) {
      showFeedback("Network error saving staff.", true);
    }
  };

  const handleExecuteBlacklist = async () => {
    if (!blacklistReason.trim() || blacklistReason.trim().length < 5) {
      showFeedback("A mandatory reason of at least 5 characters is required.", true);
      return;
    }

    setIsBlacklistSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/staff/${selectedStaffForBlacklist.staff_id}/blacklist`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ reason: blacklistReason.trim() }),
        }
      );
      const data = await res.json();
      if (data.success) {
        showFeedback(
          `Staff member ${selectedStaffForBlacklist.full_name} has been blacklisted and society gate access revoked.`
        );
        setSelectedStaffForBlacklist(null);
        setBlacklistReason("");
        fetchRoster();
        fetchLiveFeed();
      } else {
        showFeedback(data.message || "Failed to blacklist staff member.", true);
      }
    } catch (e) {
      showFeedback("Error communicating blacklist action.", true);
    } finally {
      setIsBlacklistSubmitting(false);
    }
  };

  const handleUnblacklist = async (staff) => {
    const reason = window.prompt(
      `Enter reason for lifting the blacklist on ${staff.full_name}:`
    );
    if (!reason || reason.trim().length < 5) {
      alert("A valid reinstatement reason (at least 5 chars) is mandatory.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/staff/${staff.staff_id}/unblacklist`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Blacklist lifted for ${staff.full_name}. Profile set to Inactive for KYC check.`);
        fetchRoster();
      } else {
        showFeedback(data.message || "Failed to unblacklist.", true);
      }
    } catch (e) {
      showFeedback("Error unblacklisting staff.", true);
    }
  };

  const handleManualCheckIn = async (staffId) => {
    try {
      const res = await fetch("/api/admin/staff/gate-checkin", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ staff_id: staffId, entry_gate: "Main Gate" }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("Gate Check-in recorded.");
        fetchLiveFeed();
        fetchRoster();
      } else {
        showFeedback(data.message || "Check-in failed.", true);
      }
    } catch (e) {
      showFeedback("Error recording gate check-in.", true);
    }
  };

  const handleManualCheckOut = async (staffId) => {
    try {
      const res = await fetch("/api/admin/staff/gate-checkout", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ staff_id: staffId, exit_gate: "Main Gate" }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("Gate Check-out recorded.");
        fetchLiveFeed();
        fetchRoster();
      } else {
        showFeedback(data.message || "Check-out failed.", true);
      }
    } catch (e) {
      showFeedback("Error recording gate check-out.", true);
    }
  };

  const handleDownloadCsv = (type) => {
    const token = localStorage.getItem("society_admin_token");
    let url = "";
    if (type === "ATTENDANCE") {
      url = `/api/admin/staff/reports/attendance-log?format=csv&start_date=${reportStartDate}&end_date=${reportEndDate}&category=${reportCategory}`;
    } else {
      url = `/api/admin/staff/reports/blacklist-audit?format=csv`;
    }
    // Fetch with auth then trigger download
    fetch(url, { headers: getAuthHeaders() })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = type === "ATTENDANCE" ? "daily_staff_attendance_timesheet.csv" : "staff_blacklist_audit.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(() => showFeedback("Failed to download CSV.", true));
  };

  // Counts for Stats banner
  const totalStaffCount = roster.length;
  const currentlyInsideCount = roster.filter((s) => s.is_currently_inside).length;
  const pendingKycCount = roster.filter((s) => s.status === "Pending_KYC").length;
  const blacklistedCount = roster.filter((s) => s.status === "Blacklisted").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-600" />
            Daily Staff & Domestic Helper Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Maintain registry of domestic help, enforce mandatory KYC verification, live gate attendance tracking, and immediate security blacklisting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddStaffModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Register New Staff
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-medium text-red-800">{errorMessage}</p>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-md flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Registered Staff</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalStaffCount}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Currently Inside Society</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{currentlyInsideCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <DoorOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending KYC Proofs</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingKycCount}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Blacklisted Individuals</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{blacklistedCount}</p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("ROSTER")}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "ROSTER"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Users className="w-4 h-4" />
            Staff Roster Grid
          </button>

          <button
            onClick={() => setActiveTab("LIVE_ATTENDANCE")}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "LIVE_ATTENDANCE"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Clock className="w-4 h-4" />
            Live Attendance Feed
            {currentlyInsideCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                {currentlyInsideCount} active
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("CONFIG")}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "CONFIG"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Settings className="w-4 h-4" />
            KYC & Access Rules
          </button>

          <button
            onClick={() => setActiveTab("REPORTS")}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "REPORTS"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Timesheet & Blacklist Audit Reports
          </button>
        </nav>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: STAFF ROSTER GRID */}
      {/* ==================================================== */}
      {activeTab === "ROSTER" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff by full name, phone number, flat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Categories</option>
                {roleCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending_KYC">Pending KYC</option>
                <option value="Inactive">Inactive</option>
                <option value="Blacklisted">Blacklisted</option>
              </select>

              <button
                type="button"
                onClick={fetchRoster}
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition"
                title="Refresh Roster"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Roster Photo-Cards Grid */}
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
              Loading staff roster...
            </div>
          ) : roster.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900">No staff members found</h3>
              <p className="text-sm text-gray-500 mt-1">
                Try adjusting your search filters or register a new domestic helper.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {roster.map((staff) => {
                const isBlacklisted = staff.status === "Blacklisted";
                const isInside = staff.is_currently_inside;

                return (
                  <div
                    key={staff.staff_id}
                    className={`bg-white rounded-xl border transition shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden ${
                      isBlacklisted
                        ? "border-red-300 bg-red-50/20"
                        : isInside
                        ? "border-emerald-300"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="p-5">
                      {/* Top Row: Avatar & Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {staff.photo_url ? (
                            <img
                              src={staff.photo_url}
                              alt={staff.full_name}
                              className="w-13 h-13 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                            />
                          ) : (
                            <div className="w-13 h-13 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg shadow-sm">
                              {staff.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900 text-base leading-snug">
                              {staff.full_name}
                            </h3>
                            <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700">
                              {staff.role_category}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isBlacklisted ? (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                              <Ban className="w-3 h-3" />
                              Blacklisted
                            </span>
                          ) : staff.status === "Active" ? (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Active
                            </span>
                          ) : staff.status === "Pending_KYC" ? (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              KYC Pending
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Contact & Flats Info */}
                      <div className="mt-4 space-y-2 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{staff.phone_number}</span>
                        </div>

                        <div className="flex items-start gap-2">
                          <Home className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                          <div className="flex flex-wrap gap-1">
                            {staff.assigned_flats && staff.assigned_flats.length > 0 ? (
                              staff.assigned_flats.map((f) => (
                                <span
                                  key={f.assignment_id || f.flat_number}
                                  className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-medium rounded"
                                >
                                  {f.flat_number}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 italic">No flats assigned</span>
                            )}
                          </div>
                        </div>

                        {/* KYC Verification Mini Badges */}
                        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                          <span
                            className={`flex items-center gap-1 text-[11px] font-medium ${
                              staff.is_id_proof_verified
                                ? "text-emerald-700"
                                : "text-amber-600"
                            }`}
                          >
                            {staff.is_id_proof_verified ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            ID: {staff.id_proof_type || "Aadhaar"}
                          </span>

                          <span
                            className={`flex items-center gap-1 text-[11px] font-medium ${
                              staff.police_verification_status === "Verified"
                                ? "text-emerald-700"
                                : "text-gray-500"
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Police: {staff.police_verification_status}
                          </span>
                        </div>

                        {/* Live Inside Status Indicator */}
                        {isInside && (
                          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-medium">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Inside Society ({staff.current_entry_gate})
                            </span>
                            <span className="text-[11px] font-mono">
                              {staff.current_entry_timestamp
                                ? new Date(staff.current_entry_timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Bottom Strip */}
                    <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {isInside ? (
                          <button
                            type="button"
                            onClick={() => handleManualCheckOut(staff.staff_id)}
                            className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded transition"
                          >
                            Log Exit
                          </button>
                        ) : !isBlacklisted && staff.status === "Active" ? (
                          <button
                            type="button"
                            onClick={() => handleManualCheckIn(staff.staff_id)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded transition"
                          >
                            Log Entry
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => setSelectedStaffForDetail(staff)}
                          className="px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded transition"
                        >
                          View KYC
                        </button>
                      </div>

                      {/* Blacklist Action Button (High Visibility) */}
                      {isBlacklisted ? (
                        <button
                          type="button"
                          onClick={() => handleUnblacklist(staff)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition"
                        >
                          Revoke Ban
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStaffForBlacklist(staff);
                            setBlacklistReason("");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition active:scale-95"
                          title="Instantly revoke society gate access"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Blacklist
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: LIVE ATTENDANCE FEED */}
      {/* ==================================================== */}
      {activeTab === "LIVE_ATTENDANCE" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                Active Gate Attendance Feed
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time tracking of maids, cooks, drivers, and external contractors currently inside the society premises.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchLiveFeed}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {liveFeed.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <DoorOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900">No staff currently inside</h3>
              <p className="text-sm text-gray-500 mt-1">
                When security guards check in staff at the gates, they will appear in this real-time stream.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {liveFeed.map((entry) => (
                  <div
                    key={entry.log_id}
                    className="p-4 hover:bg-gray-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      {entry.photo_url ? (
                        <img
                          src={entry.photo_url}
                          alt={entry.staff_name}
                          className="w-11 h-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center">
                          {entry.staff_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {entry.staff_name}
                          </h4>
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                            {entry.role_category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span>Phone: {entry.phone_number}</span>
                          <span>•</span>
                          <span>Gate: {entry.entry_gate}</span>
                          <span>•</span>
                          <span className="font-semibold text-indigo-600">
                            Assigned Flats: {entry.flats_visited || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Inside: {entry.minutes_inside} min
                        </span>
                        <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                          Entry: {new Date(entry.entry_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleManualCheckOut(entry.staff_id)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-800 hover:bg-gray-900 rounded-lg shadow-sm transition"
                      >
                        Record Gate Exit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: CONFIGURATION SETUP (KYC & ACCESS TIMINGS) */}
      {/* ==================================================== */}
      {activeTab === "CONFIG" && (
        <div className="max-w-4xl space-y-6">
          <form onSubmit={handleSaveConfig} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Society Staff Access & KYC Enforcement Policies
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Configure verification gates that must be fulfilled before domestic staff can enter society grounds.
              </p>
            </div>

            {/* KYC Policies */}
            <div className="border-t border-gray-100 pt-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
                Mandatory KYC Toggles
              </h3>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    Mandatory Government ID Proof (Aadhaar / Voter ID)
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    When enabled, a staff profile cannot be transitioned to "Active" or checked in at the gate unless a valid ID document has been verified.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={staffConfig.enforce_mandatory_id_proof}
                    onChange={(e) =>
                      setStaffConfig({
                        ...staffConfig,
                        enforce_mandatory_id_proof: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    Mandatory Police Verification Certificate
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Strict security requirement: helpers must possess a verified local police verification clearance before society admittance.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={staffConfig.enforce_mandatory_police_verification}
                    onChange={(e) =>
                      setStaffConfig({
                        ...staffConfig,
                        enforce_mandatory_police_verification: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            {/* Access Timings */}
            <div className="border-t border-gray-100 pt-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
                Access Timings & Curfew Rules
              </h3>
              <p className="text-xs text-gray-500">
                Define the permitted daily entry window. Outside these hours, gate check-in will be automatically blocked by the gate scanner.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Daily Permitted Entry Start Time
                  </label>
                  <input
                    type="time"
                    value={staffConfig.daily_entry_start_time}
                    onChange={(e) =>
                      setStaffConfig({
                        ...staffConfig,
                        daily_entry_start_time: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    e.g., 06:00 AM (Early morning milkmen and cooks)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Daily Entry Cutoff Time (No Entry After)
                  </label>
                  <input
                    type="time"
                    value={staffConfig.daily_entry_cutoff_time}
                    onChange={(e) =>
                      setStaffConfig({
                        ...staffConfig,
                        daily_entry_cutoff_time: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    e.g., 22:00 PM (10:00 PM nighttime security boundary)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    Allow Emergency Guard Override for Night Shifts
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Permit security supervisor to authorize emergency entry (e.g. night nurses, elderly care attendants) past curfew.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={staffConfig.allow_emergency_night_entry}
                    onChange={(e) =>
                      setStaffConfig({
                        ...staffConfig,
                        allow_emergency_night_entry: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={isConfigSaving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50 text-sm"
              >
                {isConfigSaving ? "Saving Policies..." : "Save Policies & Rules"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: REPORTS (DAILY ATTENDANCE & BLACKLIST AUDIT) */}
      {/* ==================================================== */}
      {activeTab === "REPORTS" && (
        <div className="space-y-8">
          {/* Section 1: Daily Attendance Timesheet Log */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  Daily Attendance Log & Timesheets
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Downloadable timesheet of staff entry/exits for salary dispute resolution and audit.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadCsv("ATTENDANCE")}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Download Timesheet CSV
              </button>
            </div>

            {/* Date Filters */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">To Date</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Category</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white"
                >
                  <option value="ALL">All Categories</option>
                  {roleCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg mt-3">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Staff Member</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Entry Time</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Exit Time</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Duration</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Flats Visited</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {attendanceReport.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-6 text-gray-400">
                        No attendance records found for selected period.
                      </td>
                    </tr>
                  ) : (
                    attendanceReport.map((row) => (
                      <tr key={row.log_id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900">
                          {row.staff_name}
                          <span className="block text-[11px] text-gray-400 font-normal">
                            {row.phone_number}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{row.role_category}</td>
                        <td className="px-4 py-2.5 text-gray-600 font-mono">
                          {new Date(row.entry_timestamp).toLocaleString([], {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 font-mono">
                          {row.exit_timestamp
                            ? new Date(row.exit_timestamp).toLocaleString([], {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "-"}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-gray-700">
                          {Math.floor(row.total_minutes_logged / 60)}h {row.total_minutes_logged % 60}m
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {row.flats_visited || "N/A"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              row.status_label === "Inside Society"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {row.status_label}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Blacklist Audit Report */}
          <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-red-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  Blacklist Audit Registry
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Audited historical log of all banned individuals and the mandatory reasons recorded by administrators.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadCsv("BLACKLIST")}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Download Blacklist CSV
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-red-50/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Timestamp</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Individual</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Mandatory Reason</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Enforced By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {blacklistReport.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-gray-400">
                        No blacklist audit events recorded.
                      </td>
                    </tr>
                  ) : (
                    blacklistReport.map((audit) => (
                      <tr key={audit.audit_id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-500 font-mono">
                          {new Date(audit.action_timestamp).toLocaleString([], {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">
                          {audit.staff_name}
                          <span className="block text-[11px] text-gray-400 font-normal">
                            {audit.phone_number}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{audit.role_category}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              audit.action_type === "Blacklist"
                                ? "bg-red-100 text-red-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {audit.action_type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-red-700 font-medium max-w-xs">
                          {audit.reason}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {audit.reported_by_admin_name}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: HIGH VISIBILITY BLACKLIST CONFIRMATION */}
      {/* ==================================================== */}
      {selectedStaffForBlacklist && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border-4 border-red-600 animate-in fade-in zoom-in-95 duration-150">
            {/* Red Alert Header */}
            <div className="bg-red-600 text-white p-5 flex items-start gap-4">
              <div className="p-3 bg-red-700 rounded-full shrink-0">
                <Ban className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  Revoke Society Access & Blacklist
                </h3>
                <p className="text-xs text-red-100 mt-1">
                  This action immediately prevents this person from passing any society gate, logs a permanent audit entry, and terminates active visits.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-xs font-semibold text-red-800 uppercase tracking-wide">
                  Staff Member Details
                </p>
                <p className="text-base font-bold text-gray-900 mt-1">
                  {selectedStaffForBlacklist.full_name} ({selectedStaffForBlacklist.role_category})
                </p>
                <p className="text-xs text-gray-600">
                  Phone: {selectedStaffForBlacklist.phone_number}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">
                  Reason for Blacklisting (Mandatory) *
                </label>
                <textarea
                  rows="4"
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  placeholder="Provide explicit reason (e.g., theft, misconduct, trespass, fake KYC credentials)..."
                  className="w-full px-3 py-2 border-2 border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
                  required
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Minimum 5 characters required for administrative audit registry.
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedStaffForBlacklist(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBlacklistSubmitting}
                onClick={handleExecuteBlacklist}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition disabled:opacity-50"
              >
                {isBlacklistSubmitting ? "Enforcing Ban..." : "Confirm & Blacklist"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: REGISTER NEW STAFF */}
      {/* ==================================================== */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Register New Daily Staff & Helper
              </h3>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.full_name}
                    onChange={(e) =>
                      setNewStaffForm({ ...newStaffForm, full_name: e.target.value })
                    }
                    placeholder="e.g. Meena Devi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newStaffForm.phone_number}
                    onChange={(e) =>
                      setNewStaffForm({ ...newStaffForm, phone_number: e.target.value })
                    }
                    placeholder="10 digit mobile"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newStaffForm.role_category}
                    onChange={(e) =>
                      setNewStaffForm({ ...newStaffForm, role_category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {roleCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={newStaffForm.gender}
                    onChange={(e) =>
                      setNewStaffForm({ ...newStaffForm, gender: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={newStaffForm.photo_url}
                  onChange={(e) =>
                    setNewStaffForm({ ...newStaffForm, photo_url: e.target.value })
                  }
                  placeholder="https://... photo link"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assigned Flats (Comma Separated)
                </label>
                <input
                  type="text"
                  value={newStaffForm.assigned_flats_raw}
                  onChange={(e) =>
                    setNewStaffForm({ ...newStaffForm, assigned_flats_raw: e.target.value })
                  }
                  placeholder="e.g. A-101, B-204, C-502"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* KYC Details Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase">
                  KYC & Identification Proofs
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      ID Proof Type
                    </label>
                    <select
                      value={newStaffForm.id_proof_type}
                      onChange={(e) =>
                        setNewStaffForm({ ...newStaffForm, id_proof_type: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white"
                    >
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Passport">Passport</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      ID Document Number
                    </label>
                    <input
                      type="text"
                      value={newStaffForm.id_proof_number}
                      onChange={(e) =>
                        setNewStaffForm({ ...newStaffForm, id_proof_number: e.target.value })
                      }
                      placeholder="e.g. 5432-xxxx-xxxx"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="id_verified_chk"
                    checked={newStaffForm.is_id_proof_verified}
                    onChange={(e) =>
                      setNewStaffForm({
                        ...newStaffForm,
                        is_id_proof_verified: e.target.checked,
                      })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <label htmlFor="id_verified_chk" className="text-xs text-gray-700 font-medium">
                    Mark ID proof as verified (Physical document checked)
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: KYC DETAILS & STATUS MANAGER */}
      {/* ==================================================== */}
      {selectedStaffForDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                Staff Profile & KYC Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedStaffForDetail(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Name:</span>
                <span className="font-semibold text-gray-900">{selectedStaffForDetail.full_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Role:</span>
                <span className="font-medium text-gray-800">{selectedStaffForDetail.role_category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Phone:</span>
                <span className="font-medium text-gray-800">{selectedStaffForDetail.phone_number}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Status:</span>
                <span className="font-bold text-indigo-600">{selectedStaffForDetail.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">ID Proof:</span>
                <span>
                  {selectedStaffForDetail.id_proof_type || "Aadhaar"} (
                  {selectedStaffForDetail.is_id_proof_verified ? "Verified ✓" : "Unverified ✗"}
                  )
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Police Verification:</span>
                <span>{selectedStaffForDetail.police_verification_status}</span>
              </div>

              {/* Quick KYC Status Updater */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4 space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase">
                  Verify & Change Status
                </h4>
                <div className="flex gap-2">
                  {!selectedStaffForDetail.is_id_proof_verified && (
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch(`/api/admin/staff/${selectedStaffForDetail.staff_id}`, {
                          method: "PUT",
                          headers: getAuthHeaders(),
                          body: JSON.stringify({ is_id_proof_verified: true }),
                        });
                        if (res.ok) {
                          showFeedback("ID Proof verified.");
                          setSelectedStaffForDetail(null);
                          fetchRoster();
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    >
                      Verify ID Proof
                    </button>
                  )}

                  {selectedStaffForDetail.police_verification_status !== "Verified" && (
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch(`/api/admin/staff/${selectedStaffForDetail.staff_id}`, {
                          method: "PUT",
                          headers: getAuthHeaders(),
                          body: JSON.stringify({ police_verification_status: "Verified" }),
                        });
                        if (res.ok) {
                          showFeedback("Police Verification verified.");
                          setSelectedStaffForDetail(null);
                          fetchRoster();
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Verify Police Doc
                    </button>
                  )}

                  {selectedStaffForDetail.status !== "Active" && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/admin/staff/${selectedStaffForDetail.staff_id}`, {
                            method: "PUT",
                            headers: getAuthHeaders(),
                            body: JSON.stringify({ status: "Active" }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            showFeedback("Profile activated.");
                            setSelectedStaffForDetail(null);
                            fetchRoster();
                          } else {
                            showFeedback(data.message, true);
                          }
                        } catch (e) {
                          showFeedback("Activation error.", true);
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-700 text-white rounded hover:bg-emerald-800"
                    >
                      Activate Profile
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStaffForDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
