import React, { useState } from "react";
import { UserCheck, Shield, ChevronDown, Check } from "lucide-react";

export function QuickAssignDropdown({
  ticket,
  assignees,
  onAssignChange,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (type, id, name) => {
    onAssignChange(ticket.ticket_id, type, id, name);
    setIsOpen(false);
  };

  const currentName = ticket.assigned_to_name;

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-2xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-2xs transition focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <UserCheck className="w-3 h-3 text-slate-500" />
        <span className="truncate max-w-[120px]">
          {currentName ? currentName.split(" ")[0] : "Quick Assign"}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 bottom-full mb-1.5 w-60 rounded-lg bg-white shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 max-h-64 overflow-y-auto">
            {/* Staff Header */}
            <div className="px-3 py-1 font-bold text-2xs uppercase tracking-wider text-slate-400 bg-slate-50">
              Internal Society Staff
            </div>
            {(assignees?.staff || []).map((staff) => (
              <button
                key={staff.id}
                onClick={() => handleSelect("STAFF", staff.id, staff.name)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center justify-between group transition"
              >
                <div>
                  <p className="font-semibold text-slate-800 group-hover:text-blue-700 text-xs">
                    {staff.name}
                  </p>
                  <p className="text-2xs text-slate-400">{staff.category}</p>
                </div>
                {ticket.assigned_to_id === staff.id && (
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                )}
              </button>
            ))}

            {/* Vendor Header */}
            <div className="px-3 py-1 font-bold text-2xs uppercase tracking-wider text-slate-400 bg-slate-50 mt-1">
              External Vendors
            </div>
            {(assignees?.vendors || []).length > 0 ? (
              (assignees?.vendors || []).map((vendor) => (
                <button
                  key={vendor.id}
                  onClick={() => handleSelect("VENDOR", vendor.id, vendor.name)}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-center justify-between group transition"
                >
                  <div>
                    <p className="font-semibold text-slate-800 group-hover:text-blue-700 text-xs">
                      {vendor.name}
                    </p>
                    <p className="text-2xs text-slate-400">{vendor.category}</p>
                  </div>
                  {ticket.assigned_to_id === vendor.id && (
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-2xs text-slate-400 italic">
                No external vendors registered in AP Directory.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
