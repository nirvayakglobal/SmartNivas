import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  User,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
  BarChart3,
  Settings,
  MessageSquare,
  Paperclip,
  Check,
  ChevronRight,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

import { TicketDetailModal } from "./components/TicketDetailModal";
import { QuickAssignDropdown } from "./components/QuickAssignDropdown";
import { CategoryAndSlaConfiguration } from "./components/CategoryAndSlaConfiguration";
import { TurnaroundTimeAndTrendsReport } from "./components/TurnaroundTimeAndTrendsReport";

export function HelpdeskAndComplaintManagementPage() {
  const [activeTab, setActiveTab] = useState("KANBAN"); // KANBAN | CONFIG | REPORTS
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assignees, setAssignees] = useState({ staff: [], vendors: [] });
  const [tatReport, setTatReport] = useState([]);
  const [trendReport, setTrendReport] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState(null);

  // Filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [selectedWingFilter, setSelectedWingFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Ticket Modal State
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    category_id: "",
    wing_name: "Wing A",
    flat_number: "A-101",
    resident_name: "",
    resident_phone: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    attachments: [],
  });

  const token = localStorage.getItem("smart_nivas_auth_token");
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  // Fetch initial data
  useEffect(() => {
    loadCategories();
    loadAssignees();
    loadTickets();
  }, [selectedCategoryFilter, selectedWingFilter, searchQuery]);

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/admin/helpdesk/categories", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error("Error loading categories", e);
    }
  };

  const loadAssignees = async () => {
    try {
      const res = await fetch("/api/admin/helpdesk/assignees", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setAssignees(data.assignees || { staff: [], vendors: [] });
      }
    } catch (e) {
      console.error("Error loading assignees", e);
    }
  };

  const loadTickets = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const queryParams = new URLSearchParams();
      if (selectedCategoryFilter !== "ALL") {
        queryParams.append("category_id", selectedCategoryFilter);
      }
      if (selectedWingFilter !== "ALL") {
        queryParams.append("wing", selectedWingFilter);
      }
      if (searchQuery.trim()) {
        queryParams.append("search", searchQuery.trim());
      }

      const res = await fetch(
        `/api/admin/helpdesk/tickets?${queryParams.toString()}`,
        {
          headers: getAuthHeaders(),
        }
      );
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      } else {
        setErrorMessage(data.error_message || "Failed to load tickets");
      }
    } catch (e) {
      setErrorMessage("Network error while connecting to Helpdesk API");
    } finally {
      setIsLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const [resTat, resTrend] = await Promise.all([
        fetch("/api/admin/helpdesk/reports/tat", { headers: getAuthHeaders() }),
        fetch("/api/admin/helpdesk/reports/trends", { headers: getAuthHeaders() }),
      ]);
      const dataTat = await resTat.json();
      const dataTrend = await resTrend.json();
      if (dataTat.success) setTatReport(dataTat.tat_analytics);
      if (dataTrend.success) setTrendReport(dataTrend.trend_analytics);
    } catch (e) {
      console.error("Error loading reports", e);
    }
  };

  const openTicketDetail = async (ticketId) => {
    try {
      setSelectedTicketId(ticketId);
      const res = await fetch(`/api/admin/helpdesk/tickets/${ticketId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTicketDetail(data.ticket);
      }
    } catch (e) {
      console.error("Failed to load ticket details", e);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/helpdesk/tickets/${ticketId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setTickets((prev) =>
          prev.map((t) => (t.ticket_id === ticketId ? data.ticket : t))
        );
        if (selectedTicketDetail && selectedTicketDetail.ticket_id === ticketId) {
          setSelectedTicketDetail(data.ticket);
        }
      }
    } catch (e) {
      console.error("Error updating status", e);
    }
  };

  const handleAssignChange = async (ticketId, type, id, name) => {
    try {
      const res = await fetch(`/api/admin/helpdesk/tickets/${ticketId}/assign`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          assigned_to_type: type,
          assigned_to_id: id,
          assigned_to_name: name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTickets((prev) =>
          prev.map((t) => (t.ticket_id === ticketId ? data.ticket : t))
        );
        if (selectedTicketDetail && selectedTicketDetail.ticket_id === ticketId) {
          setSelectedTicketDetail(data.ticket);
        }
      }
    } catch (e) {
      console.error("Error updating assignee", e);
    }
  };

  const handleAddNote = async (ticketId, noteText) => {
    try {
      const res = await fetch(`/api/admin/helpdesk/tickets/${ticketId}/notes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          note_text: noteText,
          author_name: "Society Admin",
          author_role: "ADMIN",
        }),
      });
      const data = await res.json();
      if (data.success && selectedTicketDetail) {
        setSelectedTicketDetail((prev) => ({
          ...prev,
          notes: [...(prev.notes || []), data.note],
        }));
      }
    } catch (e) {
      console.error("Error posting note", e);
    }
  };

  const handleSaveCategory = async (formData) => {
    try {
      const res = await fetch("/api/admin/helpdesk/categories", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        loadCategories();
      }
    } catch (e) {
      console.error("Error saving category", e);
    }
  };

  const handleUpdateCategory = async (categoryId, formData) => {
    try {
      const res = await fetch(`/api/admin/helpdesk/categories/${categoryId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        loadCategories();
      }
    } catch (e) {
      console.error("Error updating category", e);
    }
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/helpdesk/tickets", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newTicketForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateTicketModalOpen(false);
        setNewTicketForm({
          category_id: categories[0]?.category_id || "",
          wing_name: "Wing A",
          flat_number: "A-101",
          resident_name: "",
          resident_phone: "",
          title: "",
          description: "",
          priority: "MEDIUM",
          attachments: [],
        });
        loadTickets();
      } else {
        alert(data.error_message || "Failed to log ticket");
      }
    } catch (e) {
      alert("Error submitting ticket");
    }
  };

  // Kanban Drag and Drop Handlers
  const handleDragStart = (e, ticketId) => {
    e.dataTransfer.setData("text/plain", ticketId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const draggedTicketId = e.dataTransfer.getData("text/plain");
    if (draggedTicketId) {
      handleStatusChange(draggedTicketId, targetStatus);
    }
  };

  // Kanban Columns
  const kanbanColumns = [
    {
      id: "OPEN",
      title: "Open Tickets",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      description: "Newly logged complaints awaiting triage",
    },
    {
      id: "ASSIGNED",
      title: "Assigned",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      description: "Mapped to staff technician or external vendor",
    },
    {
      id: "IN_PROGRESS",
      title: "In Progress",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      description: "Active diagnosis or spare parts replacement",
    },
    {
      id: "RESOLVED",
      title: "Resolved",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      description: "Successfully addressed within SLA target",
    },
  ];

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "HIGH":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "MEDIUM":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <LifeBuoy className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Helpdesk & Complaint Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track resident maintenance complaints, enforce category SLA turnaround times, and manage internal technician notes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (categories.length > 0 && !newTicketForm.category_id) {
                setNewTicketForm((prev) => ({
                  ...prev,
                  category_id: categories[0].category_id,
                }));
              }
              setIsCreateTicketModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Log New Complaint
          </button>
        </div>
      </div>

      {/* Tab Navigation Navigation Bar */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab("KANBAN")}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === "KANBAN"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Layers className="w-4 h-4" />
          Kanban Ticketing Board
          <span className="ml-1 px-2 py-0.5 rounded-full text-2xs bg-slate-100 text-slate-700 font-bold">
            {tickets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("CONFIG")}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === "CONFIG"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Settings className="w-4 h-4" />
          Categories & SLA Timers
        </button>

        <button
          onClick={() => {
            setActiveTab("REPORTS");
            loadReports();
          }}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === "REPORTS"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          TAT & Volume Analytics
        </button>
      </div>

      {/* TAB 1: KANBAN BOARD */}
      {activeTab === "KANBAN" && (
        <div className="space-y-4">
          {/* Quick Filters Row */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by ticket #, title, flat, resident..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span>Category:</span>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-slate-700 focus:outline-none font-medium"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wing Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Wing:</span>
                <select
                  value={selectedWingFilter}
                  onChange={(e) => setSelectedWingFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-slate-700 focus:outline-none font-medium"
                >
                  <option value="ALL">All Wings</option>
                  <option value="Wing A">Wing A</option>
                  <option value="Wing B">Wing B</option>
                  <option value="Wing C">Wing C</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              💡 Tip: Drag & drop cards between columns to change ticket status
            </div>
          </div>

          {/* Kanban Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {kanbanColumns.map((col) => {
              const colTickets = tickets.filter((t) => t.status === col.id);

              return (
                <div
                  key={col.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className="bg-slate-100/70 border border-slate-200/80 rounded-xl p-3 min-h-[580px] flex flex-col"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800">
                        {col.title}
                      </span>
                      <span
                        className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${col.badgeColor}`}
                      >
                        {colTickets.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards List in Column */}
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {colTickets.length === 0 ? (
                      <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-2xs text-slate-400 text-center p-3">
                        Drop tickets here to mark as {col.title}
                      </div>
                    ) : (
                      colTickets.map((ticket) => (
                        <div
                          key={ticket.ticket_id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, ticket.ticket_id)}
                          onClick={() => openTicketDetail(ticket.ticket_id)}
                          className="bg-white rounded-lg p-3.5 border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer space-y-2.5 group relative"
                        >
                          {/* Card Top Pill Row */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-2xs font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                              {ticket.ticket_number}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-3xs font-bold px-1.5 py-0.5 rounded uppercase border ${getPriorityBadge(
                                  ticket.priority
                                )}`}
                              >
                                {ticket.priority}
                              </span>
                            </div>
                          </div>

                          {/* Overdue Warning Alert Banner on Card */}
                          {ticket.is_overdue && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-3xs font-semibold">
                              <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                              <span>Overdue by {ticket.hours_delta} hrs!</span>
                            </div>
                          )}

                          {/* Ticket Title */}
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                            {ticket.title}
                          </h4>

                          {/* Unit & Category Tags */}
                          <div className="flex items-center justify-between text-2xs text-slate-500 pt-1 border-t border-slate-100">
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <Building className="w-3 h-3 text-blue-600" />
                              {ticket.wing_name} · {ticket.flat_number}
                            </span>
                            <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-3xs font-medium border border-blue-100">
                              {ticket.category_name}
                            </span>
                          </div>

                          {/* Card Footer: Quick Assign & SLA Indicator */}
                          <div className="flex items-center justify-between pt-1 gap-2">
                            {/* Inline Quick Assign Dropdown */}
                            <QuickAssignDropdown
                              ticket={ticket}
                              assignees={assignees}
                              onAssignChange={handleAssignChange}
                            />

                            <div
                              className="text-3xs text-slate-400 flex items-center gap-1"
                              title={`Target SLA: ${ticket.sla_resolution_hours} hours`}
                            >
                              <Clock className="w-3 h-3 text-slate-400" />
                              {ticket.status === "RESOLVED"
                                ? `${ticket.turnaround_minutes || 0}m TAT`
                                : `${ticket.sla_resolution_hours}h SLA`}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORY & SLA CONFIGURATION */}
      {activeTab === "CONFIG" && (
        <CategoryAndSlaConfiguration
          categories={categories}
          onSaveCategory={handleSaveCategory}
          onUpdateCategory={handleUpdateCategory}
        />
      )}

      {/* TAB 3: REPORTS & ANALYTICS */}
      {activeTab === "REPORTS" && (
        <TurnaroundTimeAndTrendsReport
          tatData={tatReport}
          trendData={trendReport}
        />
      )}

      {/* TICKET DETAIL MODAL */}
      {selectedTicketDetail && (
        <TicketDetailModal
          ticket={selectedTicketDetail}
          onClose={() => {
            setSelectedTicketId(null);
            setSelectedTicketDetail(null);
          }}
          onStatusChange={handleStatusChange}
          onAssignChange={handleAssignChange}
          assignees={assignees}
          onAddNote={handleAddNote}
        />
      )}

      {/* CREATE TICKET MODAL */}
      {isCreateTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Log New Resident Complaint
              </h2>
              <button
                onClick={() => setIsCreateTicketModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Wing *
                  </label>
                  <select
                    value={newTicketForm.wing_name}
                    onChange={(e) =>
                      setNewTicketForm({ ...newTicketForm, wing_name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="Wing A">Wing A</option>
                    <option value="Wing B">Wing B</option>
                    <option value="Wing C">Wing C</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Flat Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B-402"
                    value={newTicketForm.flat_number}
                    onChange={(e) =>
                      setNewTicketForm({
                        ...newTicketForm,
                        flat_number: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Resident Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Shah"
                    value={newTicketForm.resident_name}
                    onChange={(e) =>
                      setNewTicketForm({
                        ...newTicketForm,
                        resident_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="9825100000"
                    value={newTicketForm.resident_phone}
                    onChange={(e) =>
                      setNewTicketForm({
                        ...newTicketForm,
                        resident_phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newTicketForm.category_id}
                    onChange={(e) =>
                      setNewTicketForm({
                        ...newTicketForm,
                        category_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name} ({c.sla_resolution_hours}h SLA)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTicketForm.priority}
                    onChange={(e) =>
                      setNewTicketForm({ ...newTicketForm, priority: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Issue Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kitchen ceiling water seepage from upper unit"
                  value={newTicketForm.title}
                  onChange={(e) =>
                    setNewTicketForm({ ...newTicketForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Description & Context *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide details about the issue location, frequency, or urgency..."
                  value={newTicketForm.description}
                  onChange={(e) =>
                    setNewTicketForm({
                      ...newTicketForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateTicketModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
