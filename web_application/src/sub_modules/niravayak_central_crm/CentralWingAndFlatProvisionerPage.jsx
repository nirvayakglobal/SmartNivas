import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  PlusCircle,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Edit2,
  Trash2,
  X,
  Plus,
  RefreshCw,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Calculator,
  ChevronRight,
  Info,
} from "lucide-react";

export function CentralWingAndFlatProvisionerPage() {
  const [societyList, setSocietyList] = useState([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState("");
  const [isLoadingSocieties, setIsLoadingSocieties] = useState(true);

  // Topology state for selected society
  const [societyTopologyData, setSocietyTopologyData] = useState({
    wings: [],
    flats: [],
    total_flats_count: 0,
    total_wings_count: 0,
  });
  const [isLoadingTopology, setIsLoadingTopology] = useState(false);
  const [selectedWingFilter, setSelectedWingFilter] = useState("ALL");
  const [searchFilterKeyword, setSearchFilterKeyword] = useState("");
  const [viewMode, setViewMode] = useState("matrix"); // 'matrix' | 'table'

  // Per-Flat Projected Pricing Calculator State (Commercial Forecast)
  const [projectedRatePerFlatInr, setProjectedRatePerFlatInr] = useState(25);

  // Bulk Generator Form State
  const [wingNamesInput, setWingNamesInput] = useState("A, B");
  const [startFloorNumber, setStartFloorNumber] = useState(1);
  const [endFloorNumber, setEndFloorNumber] = useState(8);
  const [flatsPerFloorCount, setFlatsPerFloorCount] = useState(4);
  const [numberingPattern, setNumberingPattern] = useState("FLOOR_PREFIX");
  const [bulkFlatType, setBulkFlatType] = useState("REGULAR");
  const [bulkAreaSqft, setBulkAreaSqft] = useState(1000);
  const [isGeneratingFlats, setIsGeneratingFlats] = useState(false);
  const [generatorFeedbackMessage, setGeneratorFeedbackMessage] = useState("");
  const [generatorErrorMessage, setGeneratorErrorMessage] = useState("");

  // Add Single Flat Modal State
  const [isAddFlatModalOpen, setIsAddFlatModalOpen] = useState(false);
  const [singleFlatWingName, setSingleFlatWingName] = useState("A");
  const [singleFlatFloorNumber, setSingleFlatFloorNumber] = useState(1);
  const [singleFlatNumber, setSingleFlatNumber] = useState("");
  const [singleFlatType, setSingleFlatType] = useState("REGULAR");
  const [singleFlatAreaSqft, setSingleFlatAreaSqft] = useState(1000);
  const [isSavingSingleFlat, setIsSavingSingleFlat] = useState(false);
  const [singleFlatModalError, setSingleFlatModalError] = useState("");

  // Edit Flat Modal State
  const [editingFlatObject, setEditingFlatObject] = useState(null);
  const [editFlatNumber, setEditFlatNumber] = useState("");
  const [editFloorNumber, setEditFloorNumber] = useState(1);
  const [editFlatType, setEditFlatType] = useState("REGULAR");
  const [editAreaSqft, setEditAreaSqft] = useState(1000);
  const [isUpdatingFlat, setIsUpdatingFlat] = useState(false);
  const [editFlatModalError, setEditFlatModalError] = useState("");

  // Delete Flat State
  const [isDeletingFlatId, setIsDeletingFlatId] = useState(null);

  // 1. Fetch all onboarded societies for dropdown selector
  const fetchSocieties = async () => {
    setIsLoadingSocieties(true);
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/central/clients", {
        headers: { Authorization: `Bearer ${storedAuthToken}` },
      });
      const responseJson = await httpApiResponse.json();
      if (responseJson.success && responseJson.data.length > 0) {
        setSocietyList(responseJson.data);
        if (!selectedSocietyId) {
          setSelectedSocietyId(String(responseJson.data[0].society_id));
        }
      }
    } catch (networkError) {
      console.error("Failed to load societies:", networkError);
    } finally {
      setIsLoadingSocieties(false);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, []);

  // 2. Fetch topology when selected society changes
  const fetchSocietyTopology = async (targetSocietyId) => {
    const activeSocietyId = targetSocietyId || selectedSocietyId;
    if (!activeSocietyId) return;

    setIsLoadingTopology(true);
    setGeneratorFeedbackMessage("");
    setGeneratorErrorMessage("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch(
        `/api/central/provisioner/societies/${activeSocietyId}/flats`,
        {
          headers: { Authorization: `Bearer ${storedAuthToken}` },
        }
      );
      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setSocietyTopologyData(responseJsonData.data);
      }
    } catch (networkError) {
      console.error("Failed to load society topology:", networkError);
    } finally {
      setIsLoadingTopology(false);
    }
  };

  useEffect(() => {
    if (selectedSocietyId) {
      fetchSocietyTopology(selectedSocietyId);
    }
  }, [selectedSocietyId]);

  // Bulk Generator Submission
  const handleBulkGenerateSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    if (!selectedSocietyId) {
      setGeneratorErrorMessage("Please select a target society first.");
      return;
    }

    setIsGeneratingFlats(true);
    setGeneratorFeedbackMessage("");
    setGeneratorErrorMessage("");

    const parsedWingNamesList = wingNamesInput
      .split(",")
      .map((wingNameItem) => wingNameItem.trim().toUpperCase())
      .filter((wingNameItem) => wingNameItem.length > 0);

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch(
        `/api/central/provisioner/societies/${selectedSocietyId}/bulk-generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedAuthToken}`,
          },
          body: JSON.stringify({
            wing_names: parsedWingNamesList,
            start_floor_number: parseInt(startFloorNumber, 10),
            end_floor_number: parseInt(endFloorNumber, 10),
            flats_per_floor_count: parseInt(flatsPerFloorCount, 10),
            numbering_pattern: numberingPattern,
            flat_type: bulkFlatType,
            super_builtup_area_sqft: parseFloat(bulkAreaSqft) || 1000.0,
          }),
        }
      );

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setGeneratorFeedbackMessage(responseJsonData.message);
        fetchSocietyTopology(selectedSocietyId);
      } else {
        setGeneratorErrorMessage(
          responseJsonData.message || "Failed to generate flats."
        );
      }
    } catch (networkError) {
      setGeneratorErrorMessage("Network error during bulk generation.");
    } finally {
      setIsGeneratingFlats(false);
    }
  };

  // Add Single Flat Submission
  const handleOpenAddFlatModal = (initialWingName = "A", initialFloorNumber = 1) => {
    setSingleFlatWingName(initialWingName);
    setSingleFlatFloorNumber(initialFloorNumber);
    setSingleFlatNumber("");
    setSingleFlatType("REGULAR");
    setSingleFlatAreaSqft(1000);
    setSingleFlatModalError("");
    setIsAddFlatModalOpen(true);
  };

  const handleCreateSingleFlatSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    if (!selectedSocietyId) return;

    setIsSavingSingleFlat(true);
    setSingleFlatModalError("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch(
        `/api/central/provisioner/societies/${selectedSocietyId}/flats`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedAuthToken}`,
          },
          body: JSON.stringify({
            wing_name: singleFlatWingName,
            floor_number: parseInt(singleFlatFloorNumber, 10),
            flat_number: singleFlatNumber,
            flat_type: singleFlatType,
            super_builtup_area_sqft: parseFloat(singleFlatAreaSqft) || 1000.0,
          }),
        }
      );

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setIsAddFlatModalOpen(false);
        setGeneratorFeedbackMessage(responseJsonData.message);
        fetchSocietyTopology(selectedSocietyId);
      } else {
        setSingleFlatModalError(
          responseJsonData.message || "Failed to provision flat."
        );
      }
    } catch (networkError) {
      setSingleFlatModalError("Network error while provisioning flat.");
    } finally {
      setIsSavingSingleFlat(false);
    }
  };

  // Edit Flat Submission
  const handleOpenEditFlatModal = (flatRecord) => {
    setEditingFlatObject(flatRecord);
    setEditFlatNumber(flatRecord.flat_number);
    setEditFloorNumber(flatRecord.floor_number);
    setEditFlatType(flatRecord.flat_type || "REGULAR");
    setEditAreaSqft(flatRecord.super_builtup_area_sqft || 1000);
    setEditFlatModalError("");
  };

  const handleUpdateFlatSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    if (!editingFlatObject || !selectedSocietyId) return;

    setIsUpdatingFlat(true);
    setEditFlatModalError("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch(
        `/api/central/provisioner/societies/${selectedSocietyId}/flats/${editingFlatObject.flat_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedAuthToken}`,
          },
          body: JSON.stringify({
            flat_number: editFlatNumber,
            floor_number: parseInt(editFloorNumber, 10),
            flat_type: editFlatType,
            super_builtup_area_sqft: parseFloat(editAreaSqft) || 1000.0,
          }),
        }
      );

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setEditingFlatObject(null);
        setGeneratorFeedbackMessage(responseJsonData.message);
        fetchSocietyTopology(selectedSocietyId);
      } else {
        setEditFlatModalError(
          responseJsonData.message || "Failed to update flat."
        );
      }
    } catch (networkError) {
      setEditFlatModalError("Network error while updating flat.");
    } finally {
      setIsUpdatingFlat(false);
    }
  };

  // Delete Flat
  const handleDeleteFlat = async (targetFlatRecord) => {
    const confirmationPrompt = window.confirm(
      `Are you sure you want to remove Flat ${targetFlatRecord.flat_number} (Wing ${targetFlatRecord.wing_name})? Total billable flat count will be adjusted.`
    );
    if (!confirmationPrompt || !selectedSocietyId) return;

    setIsDeletingFlatId(targetFlatRecord.flat_id);
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch(
        `/api/central/provisioner/societies/${selectedSocietyId}/flats/${targetFlatRecord.flat_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${storedAuthToken}`,
          },
        }
      );

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setGeneratorFeedbackMessage(responseJsonData.message);
        fetchSocietyTopology(selectedSocietyId);
      } else {
        setGeneratorErrorMessage(
          responseJsonData.message || "Failed to remove flat."
        );
      }
    } catch (networkError) {
      setGeneratorErrorMessage("Network error while removing flat.");
    } finally {
      setIsDeletingFlatId(null);
    }
  };

  // Selected society object
  const currentSelectedSociety = societyList.find(
    (societyItem) => String(societyItem.society_id) === String(selectedSocietyId)
  );

  // Filter flats by wing and search keyword
  const filteredFlats = (societyTopologyData.flats || []).filter((flatItem) => {
    const matchesWing =
      selectedWingFilter === "ALL" || flatItem.wing_name === selectedWingFilter;
    const matchesSearch =
      !searchFilterKeyword ||
      flatItem.flat_number.toLowerCase().includes(searchFilterKeyword.toLowerCase()) ||
      flatItem.wing_name.toLowerCase().includes(searchFilterKeyword.toLowerCase()) ||
      (flatItem.flat_type &&
        flatItem.flat_type.toLowerCase().includes(searchFilterKeyword.toLowerCase()));
    return matchesWing && matchesSearch;
  });

  // Group flats hierarchically by Wing -> Floor -> Flats for visual matrix
  const groupedWingsMatrix = useMemo(() => {
    const wingGroupsMap = new Map();

    filteredFlats.forEach((flatItem) => {
      const currentWingName = flatItem.wing_name;
      const currentFloorNumber = flatItem.floor_number ?? 0;

      if (!wingGroupsMap.has(currentWingName)) {
        wingGroupsMap.set(currentWingName, new Map());
      }
      const floorMap = wingGroupsMap.get(currentWingName);

      if (!floorMap.has(currentFloorNumber)) {
        floorMap.set(currentFloorNumber, []);
      }
      floorMap.get(currentFloorNumber).push(flatItem);
    });

    const structuredWingGroups = [];
    wingGroupsMap.forEach((floorMap, wingNameKey) => {
      const sortedFloors = Array.from(floorMap.entries())
        .sort((firstFloorEntry, secondFloorEntry) => firstFloorEntry[0] - secondFloorEntry[0])
        .map(([floorNumberKey, flatsList]) => ({
          floorNumber: floorNumberKey,
          flats: flatsList.sort((firstFlatItem, secondFlatItem) =>
            firstFlatItem.flat_number.localeCompare(
              secondFlatItem.flat_number,
              undefined,
              { numeric: true }
            )
          ),
        }));

      structuredWingGroups.push({
        wingName: wingNameKey,
        floors: sortedFloors,
      });
    });

    return structuredWingGroups.sort((firstWingGroup, secondWingGroup) =>
      firstWingGroup.wingName.localeCompare(secondWingGroup.wingName)
    );
  }, [filteredFlats]);

  // Projected Monthly SaaS calculation
  const totalFlatsCount = societyTopologyData.flats?.length || 0;
  const projectedMonthlyRevenue = totalFlatsCount * projectedRatePerFlatInr;
  const projectedYearlyRevenue = projectedMonthlyRevenue * 12;

  return (
    <div className="space-y-6">
      {/* Page Header (Clean, Light Theme matching Central CRM) */}
      <div className="bg-white border border-[#CBD5E1] rounded-xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Niravayak Commercial Engine</span>
          </div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight font-heading flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-blue-600" />
            Wing & Flat Provisioner
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Configure architectural wings, multi-floor matrices, and billable unit inventory. Flat occupancy (Owner vs. Tenant) is excluded here and managed during resident onboarding.
          </p>
        </div>

        {/* Target Society Selector Card (Clean Light Style) */}
        <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-4 w-full lg:w-auto lg:min-w-[360px] shrink-0 space-y-2 shadow-inner">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" /> Target Society Client
            </span>
            <button
              type="button"
              onClick={() => fetchSocietyTopology(selectedSocietyId)}
              title="Refresh inventory"
              className="text-[#64748B] hover:text-blue-600 transition-colors p-1 rounded hover:bg-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTopology ? "animate-spin" : ""}`} />
            </button>
          </div>
          <select
            value={selectedSocietyId}
            onChange={(inputChangeEvent) =>
              setSelectedSocietyId(inputChangeEvent.target.value)
            }
            disabled={isLoadingSocieties}
            className="w-full bg-white text-[#0F172A] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm font-bold shadow-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {societyList.map((societyRecord) => (
              <option
                key={societyRecord.society_id}
                value={societyRecord.society_id}
              >
                {societyRecord.society_legal_name} ({societyRecord.society_unique_code})
              </option>
            ))}
          </select>
          {currentSelectedSociety && (
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="font-mono text-blue-700 font-semibold">
                Code: {currentSelectedSociety.society_unique_code} • {currentSelectedSociety.city_name || "Ahmedabad"}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                {currentSelectedSociety.license_status || "ACTIVE"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards & Commercial Billing Forecast Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billable Flats (Commercial Metric) */}
        <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 shadow-sm hover:border-blue-400 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Total Billable Units
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-[#0F172A] tracking-tight">
              {totalFlatsCount}
            </div>
            <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              SaaS Billing Inventory Metric
            </div>
          </div>
        </div>

        {/* Wings Registered */}
        <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 shadow-sm hover:border-indigo-400 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Wings Provisioned
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-[#0F172A] tracking-tight">
              {societyTopologyData.wings?.length || 0}
            </div>
            <div className="text-xs text-[#64748B] truncate font-mono mt-0.5">
              {(societyTopologyData.wings || []).map((wingItem) => `Wing ${wingItem.wing_name}`).join(", ") || "No wings provisioned"}
            </div>
          </div>
        </div>

        {/* Projected Monthly B2B SaaS */}
        <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 shadow-sm hover:border-emerald-400 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Monthly Per-Flat SaaS
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-700 tracking-tight">
              ₹{projectedMonthlyRevenue.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-[#64748B] flex items-center gap-1.5 mt-0.5">
              <span>At ₹</span>
              <input
                type="number"
                min="5"
                max="500"
                value={projectedRatePerFlatInr}
                onChange={(inputChangeEvent) =>
                  setProjectedRatePerFlatInr(Number(inputChangeEvent.target.value))
                }
                className="w-14 px-1.5 py-0.5 text-xs font-bold text-center border border-slate-300 rounded bg-slate-50 focus:outline-none focus:border-blue-600"
              />
              <span>/flat/mo</span>
            </div>
          </div>
        </div>

        {/* Projected Annual SaaS Contract */}
        <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 shadow-sm hover:border-purple-400 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Projected Annual Contract
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-purple-700 tracking-tight">
              ₹{projectedYearlyRevenue.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-[#64748B] mt-0.5 font-medium">
              12 Months B2B ARR (excl. GST)
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {generatorFeedbackMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{generatorFeedbackMessage}</span>
        </div>
      )}

      {generatorErrorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{generatorErrorMessage}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 4 Cols: Automated Bulk Provisioner Form */}
        <div className="lg:col-span-4 bg-white border border-[#CBD5E1] rounded-xl p-5 shadow-sm space-y-5">
          <div className="border-b border-[#E2E8F0] pb-3.5">
            <h2 className="text-base font-bold text-[#0F172A] font-heading flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Automated Matrix Generator
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              Instantly provision uniform multi-floor tower blocks for this society.
            </p>
          </div>

          <form onSubmit={handleBulkGenerateSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#334155] uppercase tracking-wider block mb-1.5">
                Wing Identifiers *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. A, B, C, D"
                value={wingNamesInput}
                onChange={(inputChangeEvent) =>
                  setWingNamesInput(inputChangeEvent.target.value)
                }
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] font-mono uppercase font-bold focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <span className="text-[11px] text-[#64748B] mt-1 block">
                Comma separated. Existing wings are preserved; new ones are added.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#334155] uppercase tracking-wider block mb-1.5">
                  Start Floor *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={startFloorNumber}
                  onChange={(inputChangeEvent) =>
                    setStartFloorNumber(inputChangeEvent.target.value)
                  }
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] font-bold focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] uppercase tracking-wider block mb-1.5">
                  End Floor *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={endFloorNumber}
                  onChange={(inputChangeEvent) =>
                    setEndFloorNumber(inputChangeEvent.target.value)
                  }
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] font-bold focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#334155] uppercase tracking-wider block mb-1.5">
                  Flats / Floor *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={flatsPerFloorCount}
                  onChange={(inputChangeEvent) =>
                    setFlatsPerFloorCount(inputChangeEvent.target.value)
                  }
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] font-bold focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] uppercase tracking-wider block mb-1.5">
                  Numbering Style
                </label>
                <select
                  value={numberingPattern}
                  onChange={(inputChangeEvent) =>
                    setNumberingPattern(inputChangeEvent.target.value)
                  }
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-2 text-xs text-[#0F172A] font-bold focus:bg-white focus:outline-none focus:border-blue-600"
                >
                  <option value="FLOOR_PREFIX">101, 102, 201 (Standard)</option>
                  <option value="HYPHENATED">1-1, 1-2, 2-1 (Hyphenated)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#334155] uppercase tracking-wider block mb-1.5">
                  Unit Type
                </label>
                <select
                  value={bulkFlatType}
                  onChange={(inputChangeEvent) =>
                    setBulkFlatType(inputChangeEvent.target.value)
                  }
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-2 text-xs text-[#0F172A] font-bold focus:bg-white focus:outline-none focus:border-blue-600"
                >
                  <option value="REGULAR">REGULAR</option>
                  <option value="2BHK">2BHK</option>
                  <option value="3BHK">3BHK</option>
                  <option value="4BHK">4BHK</option>
                  <option value="PENTHOUSE">PENTHOUSE</option>
                  <option value="SHOP">SHOP</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] uppercase tracking-wider block mb-1.5">
                  Built-up Sqft
                </label>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  value={bulkAreaSqft}
                  onChange={(inputChangeEvent) =>
                    setBulkAreaSqft(inputChangeEvent.target.value)
                  }
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] font-bold focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-blue-800">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Atomic Rollback Guaranteed
              </div>
              <p className="text-[11px] text-blue-700 leading-snug">
                Collision checks ensure no duplicates occur. If any flat number conflicts, the entire batch rolls back cleanly.
              </p>
            </div>

            <button
              type="submit"
              disabled={isGeneratingFlats || !selectedSocietyId}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm hover:shadow transition-all text-sm flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isGeneratingFlats
                  ? "Provisioning Inventory..."
                  : "Execute Bulk Provisioning"}
              </span>
            </button>
          </form>
        </div>

        {/* Right 8 Cols: Visual Matrix & Flat Topology Inventory */}
        <div className="lg:col-span-8 space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search and Wing Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search unit / type..."
                  value={searchFilterKeyword}
                  onChange={(inputChangeEvent) =>
                    setSearchFilterKeyword(inputChangeEvent.target.value)
                  }
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg text-[#0F172A] font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
                />
              </div>

              {/* Wing Filter Pills */}
              <div className="flex items-center space-x-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSelectedWingFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedWingFilter === "ALL"
                      ? "bg-[#0F172A] text-white shadow-sm"
                      : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                  }`}
                >
                  All Wings ({societyTopologyData.flats?.length || 0})
                </button>
                {(societyTopologyData.wings || []).map((wingItem) => {
                  const wingFlatCount = (societyTopologyData.flats || []).filter(
                    (flatRecord) => flatRecord.wing_name === wingItem.wing_name
                  ).length;
                  return (
                    <button
                      key={wingItem.wing_id}
                      type="button"
                      onClick={() => setSelectedWingFilter(wingItem.wing_name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedWingFilter === wingItem.wing_name
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                      }`}
                    >
                      Wing {wingItem.wing_name} ({wingFlatCount})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* View Mode Toggle & Add Unit Button */}
            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
              <div className="flex items-center bg-[#F1F5F9] rounded-lg p-0.5 border border-[#CBD5E1]">
                <button
                  type="button"
                  onClick={() => setViewMode("matrix")}
                  title="Floor Matrix View"
                  className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                    viewMode === "matrix"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Matrix</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  title="Detailed Table View"
                  className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                    viewMode === "table"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddFlatModal("A", 1)}
                disabled={!selectedSocietyId}
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-all text-xs active:scale-[0.98] disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Add Single Unit</span>
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: Architectural Floor Matrix View (Similar to Society Admin) */}
          {viewMode === "matrix" ? (
            <div className="space-y-4">
              {isLoadingTopology ? (
                <div className="bg-white border border-[#CBD5E1] rounded-xl p-12 text-center text-[#94A3B8] text-sm">
                  Loading society unit matrix...
                </div>
              ) : groupedWingsMatrix.length === 0 ? (
                <div className="bg-white border border-[#CBD5E1] rounded-xl p-12 text-center text-[#94A3B8] italic text-sm space-y-3">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                  <p>No flats provisioned yet for this society.</p>
                  <p className="text-xs text-slate-400">
                    Use the Automated Matrix Generator on the left to initialize wings and floors.
                  </p>
                </div>
              ) : (
                groupedWingsMatrix.map((wingGroupItem) => {
                  const wingTotalFlats = wingGroupItem.floors.reduce(
                    (totalFlatSum, currentFloor) =>
                      totalFlatSum + currentFloor.flats.length,
                    0
                  );
                  return (
                    <div
                      key={wingGroupItem.wingName}
                      className="border border-[#CBD5E1] rounded-xl overflow-hidden bg-white shadow-sm"
                    >
                      {/* Wing Header Bar */}
                      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-3 h-3 rounded-full bg-blue-600 shadow-sm" />
                          <h3 className="text-sm font-bold text-[#0F172A] font-heading uppercase tracking-wide">
                            Wing {wingGroupItem.wingName}
                          </h3>
                          <span className="text-xs text-[#64748B] font-semibold">
                            • {wingTotalFlats} Billable Units across {wingGroupItem.floors.length} Floors
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenAddFlatModal(
                              wingGroupItem.wingName,
                              wingGroupItem.floors[wingGroupItem.floors.length - 1]
                                ?.floorNumber || 1
                            )
                          }
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Unit to Wing {wingGroupItem.wingName}</span>
                        </button>
                      </div>

                      {/* Floor Rows */}
                      <div className="divide-y divide-[#F1F5F9] p-3 space-y-1">
                        {wingGroupItem.floors.map((floorGroupItem) => (
                          <div
                            key={floorGroupItem.floorNumber}
                            className="py-2.5 px-3 flex flex-col md:flex-row md:items-center gap-3 hover:bg-[#F8FAFC] transition-colors rounded-lg"
                          >
                            {/* Floor Number Badge */}
                            <div className="w-24 shrink-0 flex items-center gap-1.5">
                              <span className="text-xs font-extrabold text-[#334155] bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                Floor {floorGroupItem.floorNumber}
                              </span>
                            </div>

                            {/* Flat Badges across this floor */}
                            <div className="flex-1 flex flex-wrap gap-2.5 items-center">
                              {floorGroupItem.flats.map((flatItem) => (
                                <div
                                  key={flatItem.flat_id}
                                  className="group px-3 py-1.5 rounded-lg bg-white border border-[#CBD5E1] hover:border-blue-500 hover:shadow-md transition-all flex items-center gap-2.5 shadow-sm"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-extrabold text-[#0F172A] font-mono group-hover:text-blue-600 transition-colors">
                                      {flatItem.flat_number}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                      {flatItem.flat_type || "REGULAR"}
                                    </span>
                                  </div>

                                  <span className="text-[11px] text-[#64748B] font-mono">
                                    {flatItem.super_builtup_area_sqft ? `${Math.round(flatItem.super_builtup_area_sqft)} sqft` : "1000 sqft"}
                                  </span>

                                  {/* Quick Action Buttons */}
                                  <div className="flex items-center gap-1 pl-1.5 border-l border-slate-200 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditFlatModal(flatItem)}
                                      title="Edit Unit"
                                      className="p-1 hover:text-blue-600 text-slate-500 rounded transition-colors"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteFlat(flatItem)}
                                      disabled={isDeletingFlatId === flatItem.flat_id}
                                      title="Remove Unit"
                                      className="p-1 hover:text-rose-600 text-slate-500 rounded transition-colors disabled:opacity-50"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {/* Inline Quick Add button */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenAddFlatModal(
                                    wingGroupItem.wingName,
                                    floorGroupItem.floorNumber
                                  )
                                }
                                title={`Add unit to Floor ${floorGroupItem.floorNumber}`}
                                className="px-2.5 py-1.5 rounded-lg border border-dashed border-[#CBD5E1] hover:border-blue-500 text-slate-400 hover:text-blue-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* VIEW MODE 2: Dense Table View */
            <div className="bg-white border border-[#CBD5E1] rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                <div className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                  Provisioned Units ({filteredFlats.length} of {societyTopologyData.flats?.length || 0})
                </div>
                <div className="text-xs text-[#64748B]">Sorted by Wing & Floor</div>
              </div>

              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3">Wing & Flat</th>
                      <th className="px-5 py-3">Floor</th>
                      <th className="px-5 py-3">Unit Type</th>
                      <th className="px-5 py-3">Built-up Area</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[#334155] font-medium">
                    {filteredFlats.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-12 text-[#94A3B8] italic">
                          No flats matching filter.
                        </td>
                      </tr>
                    ) : (
                      filteredFlats.map((flatRecord) => (
                        <tr
                          key={flatRecord.flat_id}
                          className="hover:bg-[#F8FAFC] transition-colors"
                        >
                          <td className="px-5 py-3">
                            <span className="font-bold text-[#0F172A] font-heading">
                              Wing {flatRecord.wing_name} — {flatRecord.flat_number}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-[#475569]">
                            Floor {flatRecord.floor_number ?? "—"}
                          </td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {flatRecord.flat_type || "REGULAR"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-[#475569]">
                            {flatRecord.super_builtup_area_sqft
                              ? `${Math.round(flatRecord.super_builtup_area_sqft)} sqft`
                              : "1000 sqft"}
                          </td>
                          <td className="px-5 py-3 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditFlatModal(flatRecord)}
                              className="p-1 hover:bg-slate-100 rounded text-[#64748B] hover:text-blue-600 transition-colors"
                              title="Edit Unit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isDeletingFlatId === flatRecord.flat_id}
                              onClick={() => handleDeleteFlat(flatRecord)}
                              className="p-1 hover:bg-rose-50 rounded text-[#64748B] hover:text-rose-600 transition-colors disabled:opacity-40"
                              title="Remove Unit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Single Flat Modal */}
      {isAddFlatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#0F172A] font-heading flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-600" />
                Provision Individual Unit
              </h3>
              <button
                type="button"
                onClick={() => setIsAddFlatModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {singleFlatModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs font-semibold">
                {singleFlatModalError}
              </div>
            )}

            <form onSubmit={handleCreateSingleFlatSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Wing Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A"
                    value={singleFlatWingName}
                    onChange={(inputChangeEvent) =>
                      setSingleFlatWingName(inputChangeEvent.target.value.toUpperCase())
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] font-bold focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Floor Number *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={singleFlatFloorNumber}
                    onChange={(inputChangeEvent) =>
                      setSingleFlatFloorNumber(inputChangeEvent.target.value)
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                  Flat / Unit Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101 or 1-1"
                  value={singleFlatNumber}
                  onChange={(inputChangeEvent) =>
                    setSingleFlatNumber(inputChangeEvent.target.value.toUpperCase())
                  }
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Unit Type
                  </label>
                  <select
                    value={singleFlatType}
                    onChange={(inputChangeEvent) =>
                      setSingleFlatType(inputChangeEvent.target.value)
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-2 text-xs text-[#0F172A] font-semibold focus:outline-none focus:border-blue-600"
                  >
                    <option value="REGULAR">REGULAR</option>
                    <option value="2BHK">2BHK</option>
                    <option value="3BHK">3BHK</option>
                    <option value="4BHK">4BHK</option>
                    <option value="PENTHOUSE">PENTHOUSE</option>
                    <option value="SHOP">SHOP</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Super Built-up Sqft
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    value={singleFlatAreaSqft}
                    onChange={(inputChangeEvent) =>
                      setSingleFlatAreaSqft(inputChangeEvent.target.value)
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddFlatModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSingleFlat}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm transition-all text-xs"
                >
                  {isSavingSingleFlat ? "Saving..." : "Provision Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Flat Modal */}
      {editingFlatObject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#0F172A] font-heading flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Edit Unit Specifications
              </h3>
              <button
                type="button"
                onClick={() => setEditingFlatObject(null)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editFlatModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs font-semibold">
                {editFlatModalError}
              </div>
            )}

            <form onSubmit={handleUpdateFlatSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Flat / Unit Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFlatNumber}
                    onChange={(inputChangeEvent) =>
                      setEditFlatNumber(inputChangeEvent.target.value.toUpperCase())
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] font-bold focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Floor Number *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={editFloorNumber}
                    onChange={(inputChangeEvent) =>
                      setEditFloorNumber(inputChangeEvent.target.value)
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Unit Type
                  </label>
                  <select
                    value={editFlatType}
                    onChange={(inputChangeEvent) =>
                      setEditFlatType(inputChangeEvent.target.value)
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-2 text-xs text-[#0F172A] font-semibold focus:outline-none focus:border-blue-600"
                  >
                    <option value="REGULAR">REGULAR</option>
                    <option value="2BHK">2BHK</option>
                    <option value="3BHK">3BHK</option>
                    <option value="4BHK">4BHK</option>
                    <option value="PENTHOUSE">PENTHOUSE</option>
                    <option value="SHOP">SHOP</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Super Built-up Sqft
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    value={editAreaSqft}
                    onChange={(inputChangeEvent) =>
                      setEditAreaSqft(inputChangeEvent.target.value)
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditingFlatObject(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingFlat}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm transition-all text-xs"
                >
                  {isUpdatingFlat ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
