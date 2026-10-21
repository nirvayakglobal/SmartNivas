import React, { useState, useEffect } from "react";
import {
  Users,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Phone,
  Search,
} from "lucide-react";

export function ResidentDirectoryAndCsvImportPage() {
  const [societyResidentsList, setSocietyResidentsList] = useState([]);
  const [isLoadingResidents, setIsLoadingResidents] = useState(true);
  const [searchFilterKeyword, setSearchFilterKeyword] = useState("");

  // CSV Import State
  const [csvFileContent, setCsvFileContent] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [importFeedbackMessage, setImportFeedbackMessage] = useState("");
  const [importErrorMessage, setImportErrorMessage] = useState("");

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
    const uploadedFile = fileChangeEvent.target.files[0];
    if (!uploadedFile) return;

    setCsvFileName(uploadedFile.name);
    const fileReader = new FileReader();
    fileReader.onload = (fileLoadEvent) => {
      setCsvFileContent(fileLoadEvent.target.result);
    };
    fileReader.readAsText(uploadedFile);
  };

  const handleExecuteCsvImport = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    if (!csvFileContent.trim()) {
      setImportErrorMessage("Please select or paste valid CSV content.");
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
        body: JSON.stringify({ csv_content: csvFileContent }),
      });

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setImportFeedbackMessage(responseJsonData.message);
        setCsvFileContent("");
        setCsvFileName("");
        fetchSocietyResidents();
      } else {
        setImportErrorMessage(
          responseJsonData.message || "CSV Import transaction failed."
        );
      }
    } catch (networkError) {
      setImportErrorMessage("Network error during CSV import.");
    } finally {
      setIsImportingCsv(false);
    }
  };

  const filteredResidentsList = societyResidentsList.filter((residentRecord) => {
    const targetString = `${residentRecord.full_name} ${residentRecord.phone_number} ${residentRecord.wing_name} ${residentRecord.flat_number}`.toLowerCase();
    return targetString.includes(searchFilterKeyword.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Resident Directory & CSV Bulk Onboarding
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Map flat owners, tenants, and family members with atomic batch validation and default credentials.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-lg px-5 py-2.5 text-right shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
            REGISTERED RESIDENTS
          </span>
          <span className="text-lg font-bold text-[#0F172A] font-heading">
            {societyResidentsList.length} Members
          </span>
        </div>
      </div>

      {/* CSV Bulk Importer (Enterprise Light Resting Card) */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] font-heading flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Batch CSV Resident Importer (All-or-Nothing ACID Rollback)
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Upload a UTF-8 CSV matching headers: <code className="text-blue-600 font-mono">wing_name, flat_number, full_name, phone_number, resident_type</code>
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
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{importFeedbackMessage}</span>
          </div>
        )}

        {importErrorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{importErrorMessage}</span>
          </div>
        )}

        <form onSubmit={handleExecuteCsvImport} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-xs text-[#64748B] file:mr-3 file:py-1 file:px-2.5 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
              {csvFileName && (
                <span className="text-[11px] text-emerald-700 font-mono mt-1 block">
                  File loaded: {csvFileName}
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                CSV Data Preview / Direct Input
              </label>
              <textarea
                rows="4"
                value={csvFileContent}
                onChange={(event) => setCsvFileContent(event.target.value)}
                placeholder="Paste CSV text here or upload file above..."
                className="w-full bg-white border border-[#CBD5E1] rounded-sm p-3 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              ></textarea>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
            <span className="text-xs text-[#64748B]">
              Default Resident Password: <code className="text-[#0F172A] font-mono font-bold">Resident@SmartNivas2026!</code>
            </span>
            <button
              type="submit"
              disabled={isImportingCsv || !csvFileContent}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] text-white font-semibold px-5 py-2 rounded-sm text-xs transition-all shadow-sm active:scale-[0.98]"
            >
              {isImportingCsv ? "Validating & Importing..." : "Start Atomic CSV Import"}
            </button>
          </div>
        </form>
      </div>

      {/* Directory Table (Enterprise Light Resting Card) */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="relative w-80">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, flat, or phone..."
              value={searchFilterKeyword}
              onChange={(event) => setSearchFilterKeyword(event.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-sm pl-9 pr-3.5 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
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
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#334155] font-medium">
              {isLoadingResidents ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-[#94A3B8]">
                    Loading resident directory...
                  </td>
                </tr>
              ) : filteredResidentsList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-[#94A3B8] italic">
                    No residents registered. Use the CSV Importer above to populate members.
                  </td>
                </tr>
              ) : (
                filteredResidentsList.map((residentItem) => (
                  <tr
                    key={residentItem.user_id}
                    className="hover:bg-[#F8FAFC] transition-colors"
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
