import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
} from "lucide-react";

export function SocietyVisitorLogRegisterPage() {
  const [visitorLogRecords, setVisitorLogRecords] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [searchFilterKeyword, setSearchFilterKeyword] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

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

  const filteredLogsList = visitorLogRecords.filter((logItem) => {
    const matchesKeyword = `${logItem.visitor_full_name} ${logItem.visitor_phone_number} ${logItem.wing_name} ${logItem.flat_number} ${logItem.company_brand_name || ""}`
      .toLowerCase()
      .includes(searchFilterKeyword.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === "ALL" ||
      logItem.approval_status === selectedStatusFilter;

    return matchesKeyword && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Society Visitor Entry & Audit Register
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Complete digital gate ledger tracking walk-ins, pre-approvals, vehicle plates, and timestamps.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-lg px-5 py-2.5 text-right shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
            TOTAL VISITS RECORDED
          </span>
          <span className="text-lg font-bold text-[#0F172A] font-heading">
            {visitorLogRecords.length} Entries
          </span>
        </div>
      </div>

      {/* Filter Toolbar & Table (Enterprise Light Resting Card) */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search visitor, phone, flat, or brand..."
              value={searchFilterKeyword}
              onChange={(event) => setSearchFilterKeyword(event.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-sm pl-9 pr-3.5 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#64748B] font-bold uppercase tracking-wider">
              Status:
            </span>
            <select
              value={selectedStatusFilter}
              onChange={(event) => setSelectedStatusFilter(event.target.value)}
              className="bg-white border border-[#CBD5E1] rounded-sm px-2.5 py-1 text-xs text-[#0F172A] font-semibold focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">APPROVED</option>
              <option value="AUTO_PREAPPROVED">AUTO_PREAPPROVED</option>
              <option value="PENDING">PENDING</option>
              <option value="DENIED">DENIED</option>
              <option value="LEAVE_AT_GATE">LEAVE_AT_GATE</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold uppercase text-[11px] tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="px-6 py-3.5">Visitor Name & Category</th>
                <th className="px-6 py-3.5">Target Flat</th>
                <th className="px-6 py-3.5">Check-in Gate</th>
                <th className="px-6 py-3.5">Vehicle / Delivery</th>
                <th className="px-6 py-3.5">Decision Status</th>
                <th className="px-6 py-3.5 text-right">Timestamp</th>
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
                    No matching visitor logs found.
                  </td>
                </tr>
              ) : (
                filteredLogsList.map((logItem) => (
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
                        <div className="font-mono text-[#64748B]">
                          {logItem.vehicle_registration_number}
                        </div>
                      ) : (
                        <span className="text-[#94A3B8] italic">No Vehicle</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          logItem.approval_status === "APPROVED" ||
                          logItem.approval_status === "AUTO_PREAPPROVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : logItem.approval_status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : logItem.approval_status === "LEAVE_AT_GATE"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {logItem.approval_status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right text-xs font-mono text-[#64748B]">
                      {new Date(logItem.created_at).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
