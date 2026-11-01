import React, { useState } from "react";
import {
  Wrench,
  Clock,
  Plus,
  Edit2,
  Check,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  Zap,
  Hammer,
  Droplet,
  ArrowUpDown,
} from "lucide-react";

export function CategoryAndSlaConfiguration({
  categories,
  onSaveCategory,
  onUpdateCategory,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    category_name: "",
    description: "",
    sla_resolution_hours: 24,
    icon_name: "Wrench",
    badge_color: "blue",
    is_active: true,
  });

  const availableIcons = [
    { name: "Droplet", label: "Plumbing / Water" },
    { name: "Zap", label: "Electrical" },
    { name: "Hammer", label: "Carpentry / Civil" },
    { name: "Sparkles", label: "Housekeeping" },
    { name: "ArrowUpDown", label: "Elevator / Lift" },
    { name: "ShieldAlert", label: "Security & Gates" },
    { name: "Wrench", label: "General Repairs" },
  ];

  const availableColors = [
    { name: "blue", label: "Blue", class: "bg-blue-100 text-blue-700 border-blue-200" },
    { name: "amber", label: "Amber", class: "bg-amber-100 text-amber-700 border-amber-200" },
    { name: "emerald", label: "Emerald", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { name: "rose", label: "Rose", class: "bg-rose-100 text-rose-700 border-rose-200" },
    { name: "stone", label: "Stone", class: "bg-stone-100 text-stone-700 border-stone-200" },
    { name: "indigo", label: "Indigo", class: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  ];

  const handleStartEdit = (cat) => {
    setEditingCategoryId(cat.category_id);
    setFormData({
      category_name: cat.category_name,
      description: cat.description || "",
      sla_resolution_hours: cat.sla_resolution_hours,
      icon_name: cat.icon_name || "Wrench",
      badge_color: cat.badge_color || "blue",
      is_active: Boolean(cat.is_active),
    });
    setIsCreating(false);
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingCategoryId(null);
    setFormData({
      category_name: "",
      description: "",
      sla_resolution_hours: 24,
      icon_name: "Wrench",
      badge_color: "blue",
      is_active: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingCategoryId) {
      await onUpdateCategory(editingCategoryId, formData);
      setEditingCategoryId(null);
    } else {
      await onSaveCategory(formData);
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Complaint Categories & SLA Timers
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure expected resolution times (Service Level Agreements) for each complaint
            category. Tickets exceeding the configured SLA threshold automatically trigger
            visual overdue warning badges.
          </p>
        </div>
        {!isCreating && !editingCategoryId && (
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add New Category
          </button>
        )}
      </div>

      {/* Create / Edit Form Drawer/Card */}
      {(isCreating || editingCategoryId) && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-50 border border-blue-200 rounded-xl p-6 shadow-sm space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">
              {editingCategoryId ? "Edit Category & SLA Timer" : "Configure New Complaint Category"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingCategoryId(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Plumbing, Civil, Elevator"
                value={formData.category_name}
                onChange={(e) =>
                  setFormData({ ...formData, category_name: e.target.value })
                }
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                <span>Expected SLA Target (Hours) *</span>
                <span className="text-2xs text-blue-600 font-semibold">
                  {Math.round(formData.sla_resolution_hours / 24)} days / {formData.sla_resolution_hours} hrs
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="720"
                required
                value={formData.sla_resolution_hours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sla_resolution_hours: parseInt(e.target.value) || 24,
                  })
                }
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Badge Color
              </label>
              <select
                value={formData.badge_color}
                onChange={(e) =>
                  setFormData({ ...formData, badge_color: e.target.value })
                }
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {availableColors.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Description & Scope Guidelines
            </label>
            <input
              type="text"
              placeholder="e.g. Tap leaks, flush valves, common pipelines, borewell pumps"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingCategoryId(null);
              }}
              className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              {editingCategoryId ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </form>
      )}

      {/* Categories Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-2xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Description & Scope</th>
                <th className="py-3 px-4 text-center">Expected SLA Window</th>
                <th className="py-3 px-4 text-center">Overdue Rule</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {categories.map((cat) => (
                <tr key={cat.category_id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Wrench className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {cat.category_name}
                        </span>
                        <span className="text-2xs text-slate-400">
                          ID: {cat.category_id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-sm">
                    {cat.description || "—"}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <Clock className="w-3 h-3" />
                      {cat.sla_resolution_hours} Hours
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-2xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Overdue if &gt; {cat.sla_resolution_hours}h
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                        cat.is_active ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    <span className="text-2xs font-medium text-slate-600">
                      {cat.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleStartEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit Category & SLA"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
