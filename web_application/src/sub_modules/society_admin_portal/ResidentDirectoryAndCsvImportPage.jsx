import React, { useState, useEffect } from "react";
import {
  Users,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Phone,
  Search,
  Edit2,
  Trash2,
  X,
  UserPlus,
  Download,
  Filter,
} from "lucide-react";

export function ResidentDirectoryAndCsvImportPage() {
  const [societyResidentsList, setSocietyResidentsList] = useState([]);
  const [isLoadingResidents, setIsLoadingResidents] = useState(true);
  const [searchFilterKeyword, setSearchFilterKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // CSV Import State
  const [csvFileContent, setCsvFileContent] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [importFeedbackMessage, setImportFeedbackMessage] = useState("");
  const [importErrorMessage, setImportErrorMessage] = useState("");

  // Add Single Resident Modal State
  const [isAddResidentModalOpen, setIsAddResidentModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newWingName, setNewWingName] = useState("A");
  const [newFlatNumber, setNewFlatNumber] = useState("");
  const [newResidentType, setNewResidentType] = useState("OWNER");
  const [isSavingNewResident, setIsSavingNewResident] = useState(false);
  const [addResidentError, setAddResidentError] = useState("");

  // Edit Resident State
  const [editingResidentObject, setEditingResidentObject] = useState(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editWingName, setEditWingName] = useState("");
  const [editFlatNumber, setEditFlatNumber] = useState("");
  const [editResidentType, setEditResidentType] = useState("OWNER");
  const [editApprovalStatus, setEditApprovalStatus] = useState("APPROVED");
  const [isUpdatingResident, setIsUpdatingResident] = useState(false);
  const [editModalErrorMessage, setEditModalErrorMessage] = useState("");

  // Delete State
  const [isDeletingUserId, setIsDeletingUserId] = useState(null);

  const sampleCsvTemplate = `wing_name,flat_number,full_name,phone_number,resident_type
A,101,Rameshbhai Patel,9825111111,OWNER
A,102,Sureshbhai Shah,9825222222,OWNER
B,201,Priya Sharma,9825333333,TENANT`;

  const fetchSocietyResidents = async () => {
    setIsLoadingResidents(true);
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/admin/residents", {
        headers: { Authorization: `Bearer ${storedAuthToken}` },
      });
      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setSocietyResidentsList(responseJsonData.data);
      }
    } catch (networkError) {
      console.error("Failed to fetch residents:", networkError);
    } finally {
      setIsLoadingResidents(false);
    }
  };

  useEffect(() => {
    fetchSocietyResidents();
  }, []);

  const handleFileUpload = (fileChangeEvent) => {
    const selectedFile = fileChangeEvent.target.files[0];
    if (selectedFile) {
      setCsvFileName(selectedFile.name);
      const fileStreamReader = new FileReader();
      fileStreamReader.onload = (fileLoadEvent) => {
        setCsvFileContent(fileLoadEvent.target.result);
      };
      fileStreamReader.readAsText(selectedFile);
    }
  };

  const handleCsvImportSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    if (!csvFileContent.trim()) {
      setImportErrorMessage("Please provide CSV content to import.");
      return;
    }

    setIsImportingCsv(true);
    setImportFeedbackMessage("");
    setImportErrorMessage("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/admin/residents/import-csv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedAuthToken}`,
        },
        body: JSON.stringify({
          csv_content: csvFileContent,
        }),
      });

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setImportFeedbackMessage(responseJsonData.message);
        setCsvFileContent("");
        setCsvFileName("");
        fetchSocietyResidents();
      } else {
        setImportErrorMessage(
          responseJsonData.message || "Failed to import CSV."
        );
      }
    } catch (networkError) {
      setImportErrorMessage("Network error during CSV upload.");
    } finally {
      setIsImportingCsv(false);
    }
  };

  const handleCreateSingleResidentSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    setIsSavingNewResident(true);
    setAddResidentError("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/admin/residents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedAuthToken}`,
        },
        body: JSON.stringify({
          full_name: newFullName,
          phone_number: newPhoneNumber,
          wing_name: newWingName,
          flat_number: newFlatNumber,
          resident_type: newResidentType,
        }),
      });

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setIsAddResidentModalOpen(false);
        setImportFeedbackMessage(responseJsonData.message);
        setNewFullName("");
        setNewPhoneNumber("");
        setNewFlatNumber("");
        fetchSocietyResidents();
      } else {
        setAddResidentError(
          responseJsonData.message || "Failed to add resident."
        );
      }
    } catch (networkError) {
      setAddResidentError("Network error while adding resident.");
    } finally {
      setIsSavingNewResident(false);
    }
  };

  const handleOpenEditModal = (residentItem) => {
    setEditingResidentObject(residentItem);
    setEditFullName(residentItem.full_name);
    setEditPhoneNumber(residentItem.phone_number);
    setEditWingName(residentItem.wing_name);
    setEditFlatNumber(residentItem.flat_number);
    setEditResidentType(residentItem.resident_type || "OWNER");
    setEditApprovalStatus(residentItem.approval_status || "APPROVED");
    setEditModalErrorMessage("");
  };

  const handleUpdateResidentSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    if (!editingResidentObject) return;

    setIsUpdatingResident(true);
    setEditModalErrorMessage("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch(
        `/api/admin/residents/${editingResidentObject.user_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedAuthToken}`,
          },
          body: JSON.stringify({
            full_name: editFullName,
            phone_number: editPhoneNumber,
            wing_name: editWingName,
            flat_number: editFlatNumber,
            resident_type: editResidentType,
            approval_status: editApprovalStatus,
          }),
        }
      );

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setEditingResidentObject(null);
        setImportFeedbackMessage(responseJsonData.message);
        fetchSocietyResidents();
      } else {
        setEditModalErrorMessage(
          responseJsonData.message || "Failed to update resident."
        );
      }
    } catch (networkError) {
      setEditModalErrorMessage("Network error while updating resident.");
    } finally {
      setIsUpdatingResident(false);
    }
  };

  const handleDeleteResident = async (residentItem) => {
    const confirmationPrompt = window.confirm(
      `Are you sure you want to remove ${residentItem.full_name} (${residentItem.wing_name}-${residentItem.flat_number}) from the society directory?`
    );
    if (!confirmationPrompt) return;

    setIsDeletingUserId(residentItem.user_id);
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch(
        `/api/admin/residents/${residentItem.user_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${storedAuthToken}`,
          },
        }
      );

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setImportFeedbackMessage(responseJsonData.message);
        fetchSocietyResidents();
      } else {
        setImportErrorMessage(
          responseJsonData.message || "Failed to delete resident."
        );
      }
    } catch (networkError) {
      setImportErrorMessage("Network error while deleting resident.");
    } finally {
      setIsDeletingUserId(null);
    }
  };

  const handleExportCsv = () => {
    if (societyResidentsList.length === 0) return;

    const csvHeaderLine = "wing_name,flat_number,full_name,phone_number,resident_type,approval_status\n";
    const csvDataLines = societyResidentsList
      .map(
        (residentItem) =>
          `"${residentItem.wing_name}","${residentItem.flat_number}","${residentItem.full_name}","${residentItem.phone_number}","${residentItem.resident_type || "OWNER"}","${residentItem.approval_status}"`
      )
      .join("\n");

    const fullBlob = new Blob([csvHeaderLine + csvDataLines], {
      type: "text/csv;charset=utf-8;",
    });
    const downloadAnchor = document.createElement("a");
    const blobObjectUrl = URL.createObjectURL(fullBlob);
    downloadAnchor.setAttribute("href", blobObjectUrl);
    downloadAnchor.setAttribute("download", `society_residents_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  const filteredResidentsList = societyResidentsList.filter((residentItem) => {
    const searchLowerKeyword = searchFilterKeyword.toLowerCase();
    const matchesName = residentItem.full_name
      .toLowerCase()
      .includes(searchLowerKeyword);
    const matchesPhone = residentItem.phone_number.includes(searchLowerKeyword);
    const matchesFlat =
      `${residentItem.wing_name}-${residentItem.flat_number}`
        .toLowerCase()
        .includes(searchLowerKeyword);

    const matchesType =
      typeFilter === "ALL" || (residentItem.resident_type || "OWNER") === typeFilter;

    return (matchesName || matchesPhone || matchesFlat) && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Resident Directory & Onboarding
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Manage society members, tenant directories, and batch CSV user onboarding.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAddResidentModalOpen(true)}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm text-xs transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Single Resident</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={societyResidentsList.length === 0}
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#334155] font-semibold px-3.5 py-2.5 rounded-lg shadow-sm text-xs transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#64748B]" />
            <span>Export CSV</span>
          </button>

          <div className="flex items-center space-x-3 bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 shadow-sm">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
              TOTAL RESIDENTS
            </span>
            <span className="text-lg font-bold text-[#0F172A] font-heading">
              {societyResidentsList.length} Members
            </span>
          </div>
        </div>
      </div>

      {/* CSV Bulk Importer */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] font-heading flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Batch CSV Resident Importer
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Upload a UTF-8 CSV matching headers:{" "}
              <code className="text-blue-600 font-mono">
                wing_name, flat_number, full_name, phone_number, resident_type
              </code>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCsvFileContent(sampleCsvTemplate)}
            className="flex items-center space-x-1.5 px-3 py-1 bg-white hover:bg-[#F8FAFC] text-[#334155] rounded-sm text-xs font-semibold border border-[#CBD5E1] transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Load Sample CSV</span>
          </button>
        </div>

        {importFeedbackMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{importFeedbackMessage}</span>
          </div>
        )}

        {importErrorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{importErrorMessage}</span>
          </div>
        )}

        <form onSubmit={handleCsvImportSubmit} className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-[#CBD5E1] border-dashed rounded-lg cursor-pointer bg-[#F8FAFC] hover:bg-slate-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-4 pb-4">
                <Upload className="w-6 h-6 text-[#64748B] mb-1" />
                <p className="text-xs text-[#334155]">
                  <span className="font-semibold text-blue-600">
                    Click to browse
                  </span>{" "}
                  or drag and drop CSV file
                </p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">
                  {csvFileName ? `Selected: ${csvFileName}` : "CSV files up to 5MB"}
                </p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
              Raw CSV Content Preview / Direct Paste
            </label>
            <textarea
              rows="4"
              value={csvFileContent}
              onChange={(event) => setCsvFileContent(event.target.value)}
              placeholder="wing_name,flat_number,full_name,phone_number,resident_type..."
              className="w-full bg-white border border-[#CBD5E1] rounded-sm p-3 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            ></textarea>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
            <span className="text-xs text-[#64748B]">
              Default Resident Password:{" "}
              <code className="text-[#0F172A] font-mono font-bold">
                Resident@SmartNivas2026!
              </code>
            </span>
            <button
              type="submit"
              disabled={isImportingCsv || !csvFileContent}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] text-white font-semibold px-5 py-2 rounded-sm text-xs transition-all shadow-sm active:scale-[0.98]"
            >
              {isImportingCsv
                ? "Validating & Importing..."
                : "Start CSV Import"}
            </button>
          </div>
        </form>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, flat, or phone..."
                value={searchFilterKeyword}
                onChange={(event) => setSearchFilterKeyword(event.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-sm pl-9 pr-3.5 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Type Filter Pills */}
            <div className="flex items-center space-x-1">
              {["ALL", "OWNER", "TENANT"].map((filterItem) => (
                <button
                  key={filterItem}
                  onClick={() => setTypeFilter(filterItem)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    typeFilter === filterItem
                      ? "bg-blue-600 text-white"
                      : "bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  {filterItem === "ALL" ? "All" : filterItem}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-[#64748B]">
            {filteredResidentsList.length} Residents Filtered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold uppercase text-[11px] tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="px-6 py-3.5">Flat Location</th>
                <th className="px-6 py-3.5">Resident Full Name</th>
                <th className="px-6 py-3.5">Phone Number</th>
                <th className="px-6 py-3.5">Occupancy Type</th>
                <th className="px-6 py-3.5">Account Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#334155] font-medium">
              {isLoadingResidents ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-[#94A3B8]">
                    Loading resident directory...
                  </td>
                </tr>
              ) : filteredResidentsList.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-12 text-[#94A3B8] italic"
                  >
                    No residents found. Add a single resident or use the CSV Importer above.
                  </td>
                </tr>
              ) : (
                filteredResidentsList.map((residentItem) => (
                  <tr
                    key={residentItem.user_id}
                    className="hover:bg-[#F8FAFC] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-[#0F172A] bg-[#F1F5F9] border border-[#CBD5E1] px-2.5 py-0.5 rounded text-xs">
                        {residentItem.wing_name} - {residentItem.flat_number}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-bold text-[#0F172A] font-heading">
                      {residentItem.full_name}
                    </td>

                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-700">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        {residentItem.phone_number}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1F5F9] border border-[#E2E8F0] text-[#334155]">
                        {residentItem.resident_type || "OWNER"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {residentItem.approval_status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(residentItem)}
                          title="Edit Resident"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteResident(residentItem)}
                          disabled={isDeletingUserId === residentItem.user_id}
                          title="Remove Resident"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Single Resident Modal */}
      {isAddResidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-lg w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-lg font-bold text-[#0F172A] font-heading flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Add Single Resident
              </h3>
              <button
                onClick={() => setIsAddResidentModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addResidentError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs font-semibold">
                {addResidentError}
              </div>
            )}

            <form onSubmit={handleCreateSingleResidentSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ketan Shah"
                  value={newFullName}
                  onChange={(event) => setNewFullName(event.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9825000000"
                  value={newPhoneNumber}
                  onChange={(event) => setNewPhoneNumber(event.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Wing *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="A"
                    value={newWingName}
                    onChange={(event) =>
                      setNewWingName(event.target.value.toUpperCase())
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] font-mono uppercase focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Flat Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="101"
                    value={newFlatNumber}
                    onChange={(event) =>
                      setNewFlatNumber(event.target.value.toUpperCase())
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] font-mono uppercase focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                  Resident Type
                </label>
                <select
                  value={newResidentType}
                  onChange={(event) => setNewResidentType(event.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                >
                  <option value="OWNER">Owner</option>
                  <option value="TENANT">Tenant</option>
                  <option value="FAMILY_MEMBER">Family Member</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddResidentModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewResident}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-sm text-sm disabled:opacity-50"
                >
                  {isSavingNewResident ? "Saving..." : "Add Resident"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resident Modal */}
      {editingResidentObject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-lg w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-lg font-bold text-[#0F172A] font-heading flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                Edit Resident Details
              </h3>
              <button
                onClick={() => setEditingResidentObject(null)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editModalErrorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs font-semibold">
                {editModalErrorMessage}
              </div>
            )}

            <form onSubmit={handleUpdateResidentSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(event) => setEditFullName(event.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={editPhoneNumber}
                  onChange={(event) => setEditPhoneNumber(event.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Wing *
                  </label>
                  <input
                    type="text"
                    required
                    value={editWingName}
                    onChange={(event) =>
                      setEditWingName(event.target.value.toUpperCase())
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] font-mono uppercase focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Flat Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFlatNumber}
                    onChange={(event) =>
                      setEditFlatNumber(event.target.value.toUpperCase())
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] font-mono uppercase focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Resident Type
                  </label>
                  <select
                    value={editResidentType}
                    onChange={(event) => setEditResidentType(event.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="TENANT">Tenant</option>
                    <option value="FAMILY_MEMBER">Family Member</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Account Status
                  </label>
                  <select
                    value={editApprovalStatus}
                    onChange={(event) =>
                      setEditApprovalStatus(event.target.value)
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                  >
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditingResidentObject(null)}
                  className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingResident}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-sm text-sm disabled:opacity-50"
                >
                  {isUpdatingResident ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
