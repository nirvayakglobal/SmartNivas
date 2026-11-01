import React, { useState } from "react";
import { Plus, Search, Building2, Phone, Mail, FileText, CheckCircle, XCircle, Edit3 } from "lucide-react";

export function VendorDirectoryList({
  vendors,
  tdsConfigurations,
  onSaveVendor,
  onToggleVendorStatus,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const [vendorFormData, setVendorFormData] = useState({
    vendor_name: "",
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    vendor_type: "Contractor - Company",
    gstin: "",
    pan_number: "",
    default_tds_config_id: "",
    bank_name: "",
    bank_account_number: "",
    bank_ifsc_code: "",
    upi_id: "",
    service_description: "",
    is_active: true,
  });

  const [errorMessage, setErrorMessage] = useState("");

  const handleOpenAddModal = () => {
    setEditingVendor(null);
    setVendorFormData({
      vendor_name: "",
      contact_person: "",
      contact_phone: "",
      contact_email: "",
      vendor_type: "Contractor - Company",
      gstin: "",
      pan_number: "",
      default_tds_config_id: "",
      bank_name: "",
      bank_account_number: "",
      bank_ifsc_code: "",
      upi_id: "",
      service_description: "",
      is_active: true,
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vendorRecord) => {
    setEditingVendor(vendorRecord);
    setVendorFormData({
      vendor_name: vendorRecord.vendor_name || "",
      contact_person: vendorRecord.contact_person || "",
      contact_phone: vendorRecord.contact_phone || "",
      contact_email: vendorRecord.contact_email || "",
      vendor_type: vendorRecord.vendor_type || "Contractor - Company",
      gstin: vendorRecord.gstin || "",
      pan_number: vendorRecord.pan_number || "",
      default_tds_config_id: vendorRecord.default_tds_config_id || "",
      bank_name: vendorRecord.bank_name || "",
      bank_account_number: vendorRecord.bank_account_number || "",
      bank_ifsc_code: vendorRecord.bank_ifsc_code || "",
      upi_id: vendorRecord.upi_id || "",
      service_description: vendorRecord.service_description || "",
      is_active: Boolean(vendorRecord.is_active),
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!vendorFormData.vendor_name || !vendorFormData.contact_phone) {
      setErrorMessage("Vendor name and contact phone number are required.");
      return;
    }

    try {
      await onSaveVendor({
        ...vendorFormData,
        vendor_id: editingVendor ? editingVendor.vendor_id : null,
        default_tds_config_id: vendorFormData.default_tds_config_id
          ? parseInt(vendorFormData.default_tds_config_id, 10)
          : null,
      });
      setIsModalOpen(false);
    } catch (saveError) {
      setErrorMessage(saveError.message || "Failed to save vendor details.");
    }
  };

  const filteredVendors = vendors.filter((vendorItem) => {
    const query = searchQuery.toLowerCase();
    return (
      vendorItem.vendor_name?.toLowerCase().includes(query) ||
      vendorItem.contact_person?.toLowerCase().includes(query) ||
      vendorItem.gstin?.toLowerCase().includes(query) ||
      vendorItem.service_description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor by name, GSTIN, service..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vendor</span>
        </button>
      </div>

      {/* Vendor Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Vendor Name & Service</th>
                <th className="px-5 py-3.5">Contact Details</th>
                <th className="px-5 py-3.5">GSTIN / PAN</th>
                <th className="px-5 py-3.5">TDS Rate</th>
                <th className="px-5 py-3.5">Banking / UPI</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-slate-400">
                    No vendors found in directory. Click "Add New Vendor" to register one.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendorItem) => (
                  <tr key={vendorItem.vendor_id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{vendorItem.vendor_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {vendorItem.vendor_type}
                        </span>
                        {vendorItem.service_description && (
                          <span className="truncate max-w-xs text-slate-400">
                            • {vendorItem.service_description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 space-y-1">
                      {vendorItem.contact_person && (
                        <div className="font-medium text-slate-800">{vendorItem.contact_person}</div>
                      )}
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{vendorItem.contact_phone}</span>
                      </div>
                      {vendorItem.contact_email && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{vendorItem.contact_email}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono space-y-1">
                      {vendorItem.gstin ? (
                        <div className="text-slate-800 font-semibold">{vendorItem.gstin}</div>
                      ) : (
                        <span className="text-slate-400 font-sans">No GSTIN</span>
                      )}
                      {vendorItem.pan_number && (
                        <div className="text-slate-500">PAN: {vendorItem.pan_number}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {vendorItem.default_tds_percentage !== null && vendorItem.default_tds_percentage !== undefined ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {vendorItem.default_tds_percentage}% ({vendorItem.default_tds_section_code || "TDS"})
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">0% (Nil)</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {vendorItem.bank_name ? (
                        <div>
                          <div className="font-semibold text-slate-800">{vendorItem.bank_name}</div>
                          <div className="font-mono text-slate-500">
                            A/C: {vendorItem.bank_account_number || "—"}
                          </div>
                          {vendorItem.bank_ifsc_code && (
                            <div className="font-mono text-slate-400 text-[11px]">
                              IFSC: {vendorItem.bank_ifsc_code}
                            </div>
                          )}
                        </div>
                      ) : vendorItem.upi_id ? (
                        <div className="font-mono text-emerald-700 font-semibold">
                          UPI: {vendorItem.upi_id}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          vendorItem.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {vendorItem.is_active ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(vendorItem)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition text-xs font-medium"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Vendor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editingVendor ? "Edit Vendor Details" : "Register New Vendor"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Vendor / Firm Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Schindler Elevators Pvt Ltd"
                    value={vendorFormData.vendor_name}
                    onChange={(event) =>
                      setVendorFormData({ ...vendorFormData, vendor_name: event.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Vendor Type / Category
                  </label>
                  <select
                    value={vendorFormData.vendor_type}
                    onChange={(event) =>
                      setVendorFormData({ ...vendorFormData, vendor_type: event.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Contractor - Company">Contractor - Company / Pvt Ltd</option>
                    <option value="Contractor - Individual">Contractor - Individual / Proprietorship</option>
                    <option value="Professional / Technical">Professional / Technical Services</option>
                    <option value="Government / Municipal Agency">Government / Municipal Agency</option>
                    <option value="Supplier / Retailer">Supplier / Retailer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Sharma (Area Manager)"
                    value={vendorFormData.contact_person}
                    onChange={(event) =>
                      setVendorFormData({ ...vendorFormData, contact_person: event.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Phone / Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9825012345"
                    value={vendorFormData.contact_phone}
                    onChange={(event) =>
                      setVendorFormData({ ...vendorFormData, contact_phone: event.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. service@schindler.com"
                    value={vendorFormData.contact_email}
                    onChange={(event) =>
                      setVendorFormData({ ...vendorFormData, contact_email: event.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Default TDS Tax Rate (%)
                  </label>
                  <select
                    value={vendorFormData.default_tds_config_id}
                    onChange={(event) =>
                      setVendorFormData({
                        ...vendorFormData,
                        default_tds_config_id: event.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- No Automatic TDS (0%) --</option>
                    {tdsConfigurations.map((tdsRuleItem) => (
                      <option key={tdsRuleItem.tds_config_id} value={tdsRuleItem.tds_config_id}>
                        {tdsRuleItem.tds_percentage}% ({tdsRuleItem.section_code} - {tdsRuleItem.vendor_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    GSTIN Number (15 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 24AAACS1429B1ZS"
                    value={vendorFormData.gstin}
                    onChange={(event) =>
                      setVendorFormData({ ...vendorFormData, gstin: event.target.value.toUpperCase() })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    PAN Card Number (10 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. AAACS1429B"
                    value={vendorFormData.pan_number}
                    onChange={(event) =>
                      setVendorFormData({ ...vendorFormData, pan_number: event.target.value.toUpperCase() })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Bank Settlement Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank"
                      value={vendorFormData.bank_name}
                      onChange={(event) =>
                        setVendorFormData({ ...vendorFormData, bank_name: event.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 50200012345678"
                      value={vendorFormData.bank_account_number}
                      onChange={(event) =>
                        setVendorFormData({
                          ...vendorFormData,
                          bank_account_number: event.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0000123"
                      value={vendorFormData.bank_ifsc_code}
                      onChange={(event) =>
                        setVendorFormData({
                          ...vendorFormData,
                          bank_ifsc_code: event.target.value.toUpperCase(),
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Service Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Service Rendered / Scope of Work
                </label>
                <input
                  type="text"
                  placeholder="e.g. Passenger Elevator Bi-monthly Maintenance & 24/7 Breakdown Assistance"
                  value={vendorFormData.service_description}
                  onChange={(event) =>
                    setVendorFormData({ ...vendorFormData, service_description: event.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  id="vendor_is_active_toggle"
                  type="checkbox"
                  checked={vendorFormData.is_active}
                  onChange={(event) =>
                    setVendorFormData({ ...vendorFormData, is_active: event.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor="vendor_is_active_toggle"
                  className="text-sm font-semibold text-slate-800 cursor-pointer"
                >
                  Vendor Active & Eligible for Payouts
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
                >
                  {editingVendor ? "Update Vendor" : "Save Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
