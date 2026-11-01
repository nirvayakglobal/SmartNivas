import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Clock,
  LogOut,
  CheckCircle,
  AlertCircle,
  Truck,
  Car,
  UserCheck,
  Building,
} from "lucide-react";

export function SocietyVisitorLogRegisterPage() {
  const [visitorLogRecords, setVisitorLogRecords] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [searchFilterKeyword, setSearchFilterKeyword] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [checkoutFeedbackMessage, setCheckoutFeedbackMessage] = useState("");

  const fetchVisitorLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/admin/visitor-logs", {
        headers: { Authorization: `Bearer ${storedAuthToken}` },
      });
      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setVisitorLogRecords(responseJsonData.data);
      }
    } catch (networkError) {
      console.error("Failed to load visitor logs:", networkError);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchVisitorLogs();
  }, []);

  const handleAdminCheckout = async (visitLogRecord) => {
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch(
        `/api/admin/visitor-logs/${visitLogRecord.visit_log_id}/checkout`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${storedAuthToken}`,
          },
        }
      );
      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setCheckoutFeedbackMessage(
          `Visitor ${visitLogRecord.visitor_full_name} checked out successfully.`
        );
        fetchVisitorLogs();
        setTimeout(() => setCheckoutFeedbackMessage(""), 4000);
      }
    } catch (networkError) {
      console.error("Error during checkout:", networkError);
    }
  };

  const activeCampusCount = visitorLogRecords.filter(
    (logItem) => !logItem.exit_timestamp
  ).length;

  const filteredLogsList = visitorLogRecords.filter((logItem) => {
    const matchesKeyword = `${logItem.visitor_full_name} ${logItem.visitor_phone_number} ${logItem.wing_name} ${logItem.flat_number} ${logItem.company_brand_name || ""}`
      .toLowerCase()
      .includes(searchFilterKeyword.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === "ALL" ||
      (selectedStatusFilter === "ON_CAMPUS" && !logItem.exit_timestamp) ||
      (selectedStatusFilter === "CHECKED_OUT" && logItem.exit_timestamp) ||
      logItem.approval_status === selectedStatusFilter;

    const matchesCategory =
      selectedCategoryFilter === "ALL" ||
      logItem.visitor_category === selectedCategoryFilter;

    return matchesKeyword && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Society Visitor Entry Register
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Real-time audit log of campus visitor check-ins, delivery couriers, and gate security passes.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
              ON-CAMPUS GUESTS
            </span>
          </div>
          <span className="text-lg font-bold text-[#0F172A] font-heading">
            {activeCampusCount} Active
          </span>
        </div>
      </div>

      {checkoutFeedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{checkoutFeedbackMessage}</span>
        </div>
      )}

      {/* Register Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
        {/* Table Filters Toolbar */}
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search visitor, flat, vehicle..."
                value={searchFilterKeyword}
                onChange={(event) => setSearchFilterKeyword(event.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-sm pl-9 pr-3.5 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center space-x-1">
              {[
                { key: "ALL", label: "All Logs" },
                { key: "ON_CAMPUS", label: "On Campus" },
                { key: "CHECKED_OUT", label: "Checked Out" },
              ].map((statusPill) => (
                <button
                  key={statusPill.key}
                  onClick={() => setSelectedStatusFilter(statusPill.key)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    selectedStatusFilter === statusPill.key
                      ? "bg-blue-600 text-white"
                      : "bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  {statusPill.label}
                </button>
              ))}
            </div>

            {/* Category Pills */}
            <div className="flex items-center space-x-1 border-l border-slate-200 pl-3">
              {[
                { key: "ALL", label: "All Categories" },
                { key: "DELIVERY", label: "Delivery" },
                { key: "GUEST", label: "Guest" },
                { key: "CAB_SERVICE", label: "Cab" },
              ].map((categoryPill) => (
                <button
                  key={categoryPill.key}
                  onClick={() => setSelectedCategoryFilter(categoryPill.key)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                    selectedCategoryFilter === categoryPill.key
                      ? "bg-slate-800 text-white"
                      : "bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  {categoryPill.label}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-[#64748B] shrink-0">
            {filteredLogsList.length} Entries Filtered
          </span>
        </div>

        {/* Visitor Logs List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold uppercase text-[11px] tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="px-6 py-3.5">Visitor Identity</th>
                <th className="px-6 py-3.5">Destination Flat</th>
                <th className="px-6 py-3.5">Check-in Gate</th>
                <th className="px-6 py-3.5">Company / Vehicle</th>
                <th className="px-6 py-3.5">Status & Time</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#334155] font-medium">
              {isLoadingLogs ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-[#94A3B8]">
                    Loading visitor logs...
                  </td>
                </tr>
              ) : filteredLogsList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-[#94A3B8] italic">
                    No matching visitor entries recorded yet.
                  </td>
                </tr>
              ) : (
                filteredLogsList.map((logItem) => {
                  const isOnCampus = !logItem.exit_timestamp;

                  return (
                    <tr
                      key={logItem.visit_log_id}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#0F172A] font-heading flex items-center gap-2">
                          <span>{logItem.visitor_full_name}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]">
                            {logItem.visitor_category}
                          </span>
                        </div>
                        <div className="text-xs text-[#64748B] font-mono mt-0.5">
                          {logItem.visitor_phone_number}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs">
                          {logItem.wing_name} - {logItem.flat_number}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-[#334155]">
                        {logItem.gate_name || "Main Gate"}
                      </td>

                      <td className="px-6 py-4 text-xs">
                        {logItem.company_brand_name && (
                          <div className="font-semibold text-[#0F172A]">
                            {logItem.company_brand_name}
                          </div>
                        )}
                        {logItem.vehicle_registration_number ? (
                          <div className="text-[#64748B] font-mono text-[11px]">
                            {logItem.vehicle_registration_number}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[11px]">Walk-in</div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isOnCampus ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                            }`}
                          />
                          <span
                            className={`text-xs font-semibold ${
                              isOnCampus ? "text-emerald-700" : "text-slate-500"
                            }`}
                          >
                            {isOnCampus ? "On Campus" : "Checked Out"}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#64748B] font-mono">
                          In: {new Date(logItem.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {isOnCampus && (
                          <button
                            onClick={() => handleAdminCheckout(logItem)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#334155] rounded text-xs font-semibold transition-colors shadow-sm"
                            title="Mark Visitor Checked Out"
                          >
                            <LogOut className="w-3 h-3 text-slate-500" />
                            <span>Check Out</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
