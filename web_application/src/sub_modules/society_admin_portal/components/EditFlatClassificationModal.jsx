import React, { useState } from "react";
import {
  Building2,
  UserCheck,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export function EditFlatClassificationModal({
  isOpen,
  onClose,
  flat,
  availableCategories = [],
  onSaved,
}) {
  if (!isOpen || !flat) return null;

  const [flatType, setFlatType] = useState(flat.flat_type || "REGULAR");
  const [occupancyStatus, setOccupancyStatus] = useState(
    flat.occupancy_status || "OWNER_OCCUPIED"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const combinedCategories = Array.from(
    new Set([
      "REGULAR",
      "PENTHOUSE",
      "2BHK",
      "3BHK",
      "4BHK",
      "SHOP",
      ...(availableCategories || []),
      flat.flat_type,
    ].filter(Boolean))
  );

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    try {
      const token = localStorage.getItem("smart_nivas_auth_token");
      const res = await fetch(`/api/admin/billing/flats/${flat.flat_id}/classification`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          flat_type: flatType,
          occupancy_status: occupancyStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved({ ...flat, flat_type: flatType, occupancy_status: occupancyStatus });
        onClose();
      } else {
        setErrorMessage(data.message || "Failed to update flat classification.");
      }
    } catch (err) {
      setErrorMessage("Network error updating classification.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="backdrop-blur-2xl bg-white/95 border border-slate-200/90 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Edit Flat Classification
            </h3>
            <p className="text-xs text-slate-500">
              Unit {flat.wing_name}-{flat.flat_number} ({flat.resident_name || "Unassigned"})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Flat Type / Category
            </label>
            <select
              value={flatType}
              onChange={(e) => setFlatType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200/90 rounded-xl bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-semibold"
            >
              {combinedCategories.map((catKey) => (
                <option key={catKey} value={catKey}>
                  {catKey} {catKey === "REGULAR" ? "(Standard Apartment)" : catKey === "PENTHOUSE" ? "(Top Floor Luxury)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Occupancy Status
            </label>
            <select
              value={occupancyStatus}
              onChange={(e) => setOccupancyStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 font-semibold"
            >
              <option value="OWNER_OCCUPIED">Owner Occupied / Vacant / Builder</option>
              <option value="TENANT_OCCUPIED">Tenant Occupied (Rented Out)</option>
              <option value="VACANT">Vacant</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Maintenance rules dynamically compute rates based on this type & occupancy pairing.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save Classification"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
