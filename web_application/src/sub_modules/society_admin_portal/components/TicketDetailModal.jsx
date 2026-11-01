import React, { useState } from "react";
import {
  X,
  Clock,
  User,
  Phone,
  Building,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Send,
  Shield,
  Briefcase,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export function TicketDetailModal({
  ticket,
  onClose,
  onStatusChange,
  onAssignChange,
  assignees,
  onAddNote,
}) {
  const [newNote, setNewNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!ticket) return null;

  const handleSendNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsSubmittingNote(true);
    await onAddNote(ticket.ticket_id, newNote);
    setNewNote("");
    setIsSubmittingNote(false);
  };

  const getPriorityBadgeClass = (priority) => {
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "OPEN":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "ASSIGNED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "IN_PROGRESS":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "RESOLVED":
      case "CLOSED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="font-mono font-semibold text-slate-800 text-base bg-white px-2.5 py-1 rounded border border-slate-200 shadow-sm">
              {ticket.ticket_number}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                ticket.status
              )}`}
            >
              {ticket.status.replace("_", " ")}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getPriorityBadgeClass(
                ticket.priority
              )}`}
            >
              {ticket.priority} Priority
            </span>

            {ticket.is_overdue && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-full animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                Overdue by {ticket.hours_delta}h
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two column grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 flex-1 overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Left Column: Complaint details & photos (3 cols) */}
          <div className="md:col-span-3 p-6 space-y-6 overflow-y-auto">
            {/* Title & Category */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {ticket.category_name}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> SLA: {ticket.sla_resolution_hours}h target
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {ticket.title}
              </h2>
            </div>

            {/* Resident & Unit Information Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">
                  Resident & Flat
                </p>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Building className="w-4 h-4 text-blue-600" />
                  {ticket.wing_name} — {ticket.flat_number}
                </div>
                <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {ticket.resident_name}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">
                  Contact & Timestamp
                </p>
                <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {ticket.resident_phone || "Not provided"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Logged: {new Date(ticket.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Complaint Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Complaint Description
              </h3>
              <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {ticket.description}
              </div>
            </div>

            {/* Attached Photos / Evidence */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Attached Photos & Evidence</span>
                <span className="text-slate-500 font-normal">
                  ({(ticket.attachments || []).length} photos)
                </span>
              </h3>
              {(ticket.attachments || []).length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {ticket.attachments.map((photoUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPhoto(photoUrl)}
                      className="group relative aspect-video rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-sm hover:shadow transition"
                    >
                      <img
                        src={photoUrl}
                        alt={`Attachment ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <ExternalLink className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No photo attachments uploaded by resident.
                </div>
              )}
            </div>

            {/* Status & Lifecycle Action Bar */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Update Ticket Status
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => onStatusChange(ticket.ticket_id, st)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition ${
                      ticket.status === st
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Internal Chat & Notes Thread (2 cols) */}
          <div className="md:col-span-2 p-6 flex flex-col bg-slate-50/50">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Internal Chat & Notes Thread
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff & committee confidential communication
              </p>
            </div>

            {/* Current Assignee Box */}
            <div className="mb-4 p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Assigned Personnel / Vendor
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {ticket.assigned_to_name ? ticket.assigned_to_name.charAt(0) : "?"}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {ticket.assigned_to_name || "Unassigned"}
                    </p>
                    <p className="text-2xs text-slate-400">
                      {ticket.assigned_to_type === "VENDOR" ? "External Vendor" : "Society Staff"}
                    </p>
                  </div>
                </div>

                {/* Inline Re-assign selector */}
                <select
                  value={ticket.assigned_to_id || ""}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    if (!selectedVal) return;
                    const allList = [
                      ...(assignees?.staff || []),
                      ...(assignees?.vendors || []),
                    ];
                    const match = allList.find((item) => item.id === selectedVal);
                    if (match) {
                      onAssignChange(ticket.ticket_id, match.type, match.id, match.name);
                    }
                  }}
                  className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Map Assignee...</option>
                  <optgroup label="Internal Staff">
                    {(assignees?.staff || []).map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="External Vendors">
                    {(assignees?.vendors || []).map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name} ({vendor.category})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Chat Messages Timeline */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[220px] max-h-[340px]">
              {(ticket.notes || []).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400 p-6">
                  <MessageSquare className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
                  No internal notes yet. Log staff updates, parts requisition, or visit notes below.
                </div>
              ) : (
                ticket.notes.map((note) => (
                  <div
                    key={note.note_id}
                    className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-2xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        {note.author_role === "ADMIN" ? (
                          <Shield className="w-3 h-3 text-blue-600" />
                        ) : (
                          <Briefcase className="w-3 h-3 text-emerald-600" />
                        )}
                        {note.author_name}
                      </span>
                      <span className="text-slate-400">
                        {new Date(note.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-normal">
                      {note.note_text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Input Box */}
            <form onSubmit={handleSendNote} className="mt-4 pt-3 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type internal technician/admin note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <button
                  type="submit"
                  disabled={isSubmittingNote || !newNote.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Lightbox Photo Preview Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={selectedPhoto}
              alt="Enlarged complaint attachment"
              className="rounded-lg max-h-[85vh] object-contain shadow-2xl"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
