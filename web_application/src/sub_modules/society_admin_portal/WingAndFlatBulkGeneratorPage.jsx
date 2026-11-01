import React, { useState, useEffect } from "react";
import {
  Layers,
  PlusCircle,
  Building,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Edit2,
  Trash2,
  X,
  Plus,
} from "lucide-react";

export function WingAndFlatBulkGeneratorPage() {
  const [societyTopologyData, setSocietyTopologyData] = useState({
    wings: [],
    flats: [],
  });
  const [isLoadingTopology, setIsLoadingTopology] = useState(true);
  const [selectedWingFilter, setSelectedWingFilter] = useState("ALL");

  // Bulk Generator Form State
  const [wingNamesInput, setWingNamesInput] = useState("A, B");
  const [startFloorNumber, setStartFloorNumber] = useState(1);
  const [endFloorNumber, setEndFloorNumber] = useState(8);
  const [flatsPerFloorCount, setFlatsPerFloorCount] = useState(4);
  const [numberingPattern, setNumberingPattern] = useState("FLOOR_PREFIX");
  const [isGeneratingFlats, setIsGeneratingFlats] = useState(false);
  const [generatorFeedbackMessage, setGeneratorFeedbackMessage] = useState("");
  const [generatorErrorMessage, setGeneratorErrorMessage] = useState("");

  // Add Single Flat Modal State
  const [isAddFlatModalOpen, setIsAddFlatModalOpen] = useState(false);
  const [singleFlatWingName, setSingleFlatWingName] = useState("A");
  const [singleFlatFloorNumber, setSingleFlatFloorNumber] = useState(9);
  const [singleFlatNumber, setSingleFlatNumber] = useState("");
  const [singleFlatOccupancy, setSingleFlatOccupancy] = useState("OWNER_OCCUPIED");
  const [isSavingSingleFlat, setIsSavingSingleFlat] = useState(false);
  const [singleFlatModalError, setSingleFlatModalError] = useState("");

  // Edit Flat Modal State
  const [editingFlatObject, setEditingFlatObject] = useState(null);
  const [editFlatNumber, setEditFlatNumber] = useState("");
  const [editFloorNumber, setEditFloorNumber] = useState(1);
  const [editOccupancyStatus, setEditOccupancyStatus] = useState("OWNER_OCCUPIED");
  const [isUpdatingFlat, setIsUpdatingFlat] = useState(false);
  const [editFlatModalError, setEditFlatModalError] = useState("");

  // Delete State
  const [isDeletingFlatId, setIsDeletingFlatId] = useState(null);

  const fetchSocietyTopology = async () => {
    setIsLoadingTopology(true);
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/admin/topology", {
        headers: { Authorization: `Bearer ${storedAuthToken}` },
      });
      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setSocietyTopologyData(responseJsonData.data);
      }
    } catch (networkError) {
      console.error("Failed to load topology:", networkError);
    } finally {
      setIsLoadingTopology(false);
    }
  };

  useEffect(() => {
    fetchSocietyTopology();
  }, []);

  const handleBulkGenerateSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    setIsGeneratingFlats(true);
    setGeneratorFeedbackMessage("");
    setGeneratorErrorMessage("");

    const parsedWingNamesList = wingNamesInput
      .split(",")
      .map((wingNameItem) => wingNameItem.trim().toUpperCase())
      .filter((wingNameItem) => wingNameItem.length > 0);

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/admin/topology/bulk-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedAuthToken}`,
        },
        body: JSON.stringify({
          wing_names: parsedWingNamesList,
          start_floor_number: parseInt(startFloorNumber),
          end_floor_number: parseInt(endFloorNumber),
          flats_per_floor_count: parseInt(flatsPerFloorCount),
          numbering_pattern: numberingPattern,
        }),
      });

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setGeneratorFeedbackMessage(responseJsonData.message);
        fetchSocietyTopology();
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

  const handleOpenAddFlatModal = (initialWingName = "A", initialFloorNumber = 1) => {
    setSingleFlatWingName(initialWingName);
    setSingleFlatFloorNumber(initialFloorNumber);
    setSingleFlatNumber("");
    setSingleFlatOccupancy("OWNER_OCCUPIED");
    setSingleFlatModalError("");
    setIsAddFlatModalOpen(true);
  };

  const handleCreateSingleFlatSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    setIsSavingSingleFlat(true);
    setSingleFlatModalError("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/admin/topology/flats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedAuthToken}`,
        },
        body: JSON.stringify({
          wing_name: singleFlatWingName,
          floor_number: parseInt(singleFlatFloorNumber),
          flat_number: singleFlatNumber,
          occupancy_status: singleFlatOccupancy,
        }),
      });

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setIsAddFlatModalOpen(false);
        setGeneratorFeedbackMessage(responseJsonData.message);
        fetchSocietyTopology();
      } else {
        setSingleFlatModalError(
          responseJsonData.message || "Failed to create flat."
        );
      }
    } catch (networkError) {
      setSingleFlatModalError("Network error while creating flat.");
    } finally {
      setIsSavingSingleFlat(false);
    }
  };

  const handleOpenEditFlatModal = (flatRecord) => {
    setEditingFlatObject(flatRecord);
    setEditFlatNumber(flatRecord.flat_number);
    setEditFloorNumber(flatRecord.floor_number);
    setEditOccupancyStatus(flatRecord.occupancy_status);
    setEditFlatModalError("");
  };

  const handleUpdateFlatSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    if (!editingFlatObject) return;

    setIsUpdatingFlat(true);
    setEditFlatModalError("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch(
        `/api/admin/topology/flats/${editingFlatObject.flat_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedAuthToken}`,
          },
          body: JSON.stringify({
            flat_number: editFlatNumber,
            floor_number: parseInt(editFloorNumber),
            occupancy_status: editOccupancyStatus,
          }),
        }
      );

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setEditingFlatObject(null);
        setGeneratorFeedbackMessage(responseJsonData.message);
        fetchSocietyTopology();
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

  const handleDeleteFlat = async (targetFlatRecord) => {
    const confirmationPrompt = window.confirm(
      `Are you sure you want to delete flat ${targetFlatRecord.flat_number} from Wing ${targetFlatRecord.wing_name}?`
    );
    if (!confirmationPrompt) return;

    setIsDeletingFlatId(targetFlatRecord.flat_id);
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch(
        `/api/admin/topology/flats/${targetFlatRecord.flat_id}`,
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
        fetchSocietyTopology();
      } else {
        setGeneratorErrorMessage(
          responseJsonData.message || "Failed to delete flat."
        );
      }
    } catch (networkError) {
      setGeneratorErrorMessage("Network error while deleting flat.");
    } finally {
      setIsDeletingFlatId(null);
    }
  };

  const filteredFlatsList =
    selectedWingFilter === "ALL"
      ? societyTopologyData.flats
      : societyTopologyData.flats.filter(
          (flatRecord) => flatRecord.wing_name === selectedWingFilter
        );

  // Group flats hierarchically by Wing -> Floor -> Flats
  const groupedWingsMatrix = React.useMemo(() => {
    const wingGroupsMap = new Map();

    filteredFlatsList.forEach((flatItem) => {
      const currentWingName = flatItem.wing_name;
      const currentFloorNumber = flatItem.floor_number;

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
        .sort(
          (firstFloorEntry, secondFloorEntry) =>
            firstFloorEntry[0] - secondFloorEntry[0]
        )
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
  }, [filteredFlatsList]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" />
            Wing & Flat Topology Provisioner
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Configure symmetrical blocks or customize individual floor counts and flats.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleOpenAddFlatModal("A", 1)}
            className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 font-semibold px-4 py-2.5 rounded-lg shadow-sm text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Flat</span>
          </button>

          <div className="flex items-center space-x-3 bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 shadow-sm">
            <Building className="w-5 h-5 text-blue-600" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                TOTAL FLATS REGISTERED
              </span>
              <span className="text-lg font-bold text-[#0F172A] font-heading">
                {societyTopologyData.flats.length} Flats
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Generator Controls + Live Topology Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bulk Generator Form */}
        <div className="lg:col-span-1 bg-white border border-[#E2E8F0] rounded-lg p-6 space-y-5 shadow-sm h-fit">
          <div className="border-b border-[#E2E8F0] pb-3">
            <h3 className="text-base font-bold text-[#0F172A] font-heading flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              Automated Flat Matrix Provisioner
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Generates complete floor-to-flat matrices in one click.
            </p>
          </div>

          {generatorFeedbackMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{generatorFeedbackMessage}</span>
            </div>
          )}

          {generatorErrorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{generatorErrorMessage}</span>
            </div>
          )}

          <form onSubmit={handleBulkGenerateSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                Wing Names (Comma-Separated) *
              </label>
              <input
                type="text"
                required
                placeholder="A, B, C, D"
                value={wingNamesInput}
                onChange={(event) => setWingNamesInput(event.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-sm text-[#0F172A] font-mono uppercase focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <span className="text-[11px] text-[#64748B] mt-0.5 block">
                Existing wings will be reused; new wings will be created automatically.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                  Start Floor *
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  required
                  value={startFloorNumber}
                  onChange={(event) =>
                    setStartFloorNumber(parseInt(event.target.value))
                  }
                  className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                  End Floor *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={endFloorNumber}
                  onChange={(event) =>
                    setEndFloorNumber(parseInt(event.target.value))
                  }
                  className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                  Flats / Floor *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={flatsPerFloorCount}
                  onChange={(event) =>
                    setFlatsPerFloorCount(parseInt(event.target.value))
                  }
                  className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                  Numbering Style
                </label>
                <select
                  value={numberingPattern}
                  onChange={(event) => setNumberingPattern(event.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] font-medium focus:outline-none focus:border-blue-600"
                >
                  <option value="FLOOR_PREFIX">101, 102 (Standard)</option>
                  <option value="HYPHENATED">1-1, 1-2 (Hyphenated)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
              <p className="font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Flexible Setup Tip:
              </p>
              <p className="mt-0.5 text-blue-700">
                To create irregular towers (e.g., floors 1-8 with 4 flats, and floor 9 with 2 flats), run the generator in passes or click "Add Single Flat" above.
              </p>
            </div>

            <button
              type="submit"
              disabled={isGeneratingFlats}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-sm shadow-sm transition-all text-sm flex items-center justify-center space-x-2 active:scale-[0.98]"
            >
              <span>
                {isGeneratingFlats
                  ? "Validating & Creating..."
                  : "Execute Bulk Generation"}
              </span>
            </button>
          </form>
        </div>

        {/* Right: Live Flat Topology Grid */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-lg p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#0F172A] font-heading">
                Society Flat Matrix
              </h3>
              <p className="text-xs text-[#64748B]">
                Showing all generated apartments grouped by building wing and floor.
              </p>
            </div>

            {/* Wing Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              <button
                onClick={() => setSelectedWingFilter("ALL")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  selectedWingFilter === "ALL"
                    ? "bg-blue-600 text-white"
                    : "bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                All Wings
              </button>
              {societyTopologyData.wings.map((wingItem) => (
                <button
                  key={wingItem.wing_id}
                  onClick={() => setSelectedWingFilter(wingItem.wing_name)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    selectedWingFilter === wingItem.wing_name
                      ? "bg-blue-600 text-white"
                      : "bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  Wing {wingItem.wing_name}
                </button>
              ))}
            </div>
          </div>

          {isLoadingTopology ? (
            <div className="text-center py-16 text-[#94A3B8] text-sm">
              Loading society topology...
            </div>
          ) : groupedWingsMatrix.length === 0 ? (
            <div className="text-center py-16 text-[#94A3B8] italic text-sm">
              No flats generated yet. Use the provisioner form on the left or click "Add Single Flat".
            </div>
          ) : (
            <div className="space-y-6 max-h-[640px] overflow-y-auto pr-2">
              {groupedWingsMatrix.map((wingGroupItem) => (
                <div
                  key={wingGroupItem.wingName}
                  className="border border-[#E2E8F0] rounded-lg overflow-hidden bg-white shadow-sm"
                >
                  {/* Wing Header */}
                  <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <h4 className="text-sm font-bold text-[#0F172A] font-heading">
                        Wing {wingGroupItem.wingName}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          handleOpenAddFlatModal(
                            wingGroupItem.wingName,
                            wingGroupItem.floors[wingGroupItem.floors.length - 1]
                              ?.floorNumber || 1
                          )
                        }
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Flat to Wing</span>
                      </button>
                      <span className="text-xs font-semibold text-[#64748B]">
                        {wingGroupItem.floors.reduce(
                          (totalFlatSum, currentFloor) =>
                            totalFlatSum + currentFloor.flats.length,
                          0
                        )}{" "}
                        Flats across {wingGroupItem.floors.length} Floors
                      </span>
                    </div>
                  </div>

                  {/* Floors and Flats Rows */}
                  <div className="divide-y divide-[#F1F5F9] p-2">
                    {wingGroupItem.floors.map((floorGroupItem) => (
                      <div
                        key={floorGroupItem.floorNumber}
                        className="py-3 px-3 flex flex-col md:flex-row md:items-center gap-3 hover:bg-[#F8FAFC]/60 transition-colors rounded-md"
                      >
                        {/* Floor Label Badge */}
                        <div className="w-24 shrink-0 flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#334155] bg-[#F1F5F9] px-2.5 py-1 rounded border border-[#E2E8F0]">
                            Floor {floorGroupItem.floorNumber}
                          </span>
                        </div>

                        {/* Flat Cards along the Floor */}
                        <div className="flex-1 flex flex-wrap gap-2.5">
                          {floorGroupItem.flats.map((flatItem) => {
                            const isOccupied =
                              flatItem.occupancy_status === "OWNER_OCCUPIED" ||
                              flatItem.occupancy_status === "TENANT_OCCUPIED";
                            const displayOccupancyLabel =
                              flatItem.occupancy_status === "OWNER_OCCUPIED"
                                ? "Owner Occupied"
                                : flatItem.occupancy_status === "TENANT_OCCUPIED"
                                ? "Tenant"
                                : "Vacant";

                            return (
                              <div
                                key={flatItem.flat_id}
                                className="px-3 py-1.5 rounded-lg bg-white border border-[#CBD5E1] hover:border-blue-500 hover:shadow-sm transition-all flex items-center gap-2.5 group"
                              >
                                <span className="text-base font-bold text-[#0F172A] font-mono group-hover:text-blue-600 transition-colors">
                                  {flatItem.flat_number}
                                </span>
                                <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isOccupied
                                        ? "bg-emerald-500"
                                        : "bg-slate-300"
                                    }`}
                                  />
                                  <span
                                    className={`font-medium ${
                                      isOccupied
                                        ? "text-emerald-700"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {displayOccupancyLabel}
                                  </span>
                                </div>

                                {/* Quick Edit & Delete Actions */}
                                <div className="flex items-center gap-1 pl-1 border-l border-slate-200 opacity-60 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleOpenEditFlatModal(flatItem)}
                                    title="Edit Flat"
                                    className="p-1 hover:text-blue-600 text-slate-400 rounded transition-colors"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFlat(flatItem)}
                                    disabled={isDeletingFlatId === flatItem.flat_id}
                                    title="Delete Flat"
                                    className="p-1 hover:text-rose-600 text-slate-400 rounded transition-colors disabled:opacity-50"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {/* Quick Append Flat to Floor */}
                          <button
                            onClick={() =>
                              handleOpenAddFlatModal(
                                wingGroupItem.wingName,
                                floorGroupItem.floorNumber
                              )
                            }
                            title={`Add flat to Floor ${floorGroupItem.floorNumber}`}
                            className="px-2 py-1.5 rounded-lg border border-dashed border-[#CBD5E1] hover:border-blue-500 text-slate-400 hover:text-blue-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Single Flat Modal */}
      {isAddFlatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-lg w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-lg font-bold text-[#0F172A] font-heading flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                Add Individual Flat
              </h3>
              <button
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
                    onChange={(event) =>
                      setSingleFlatWingName(event.target.value.toUpperCase())
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] font-mono uppercase focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Floor Number *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="50"
                    value={singleFlatFloorNumber}
                    onChange={(event) =>
                      setSingleFlatFloorNumber(parseInt(event.target.value))
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                  Flat Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 901 or 9-1"
                  value={singleFlatNumber}
                  onChange={(event) => setSingleFlatNumber(event.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                  Occupancy Status
                </label>
                <select
                  value={singleFlatOccupancy}
                  onChange={(event) => setSingleFlatOccupancy(event.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                >
                  <option value="OWNER_OCCUPIED">Owner Occupied</option>
                  <option value="TENANT_OCCUPIED">Tenant Occupied</option>
                  <option value="VACANT">Vacant</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddFlatModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSingleFlat}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-sm text-sm disabled:opacity-50"
                >
                  {isSavingSingleFlat ? "Saving..." : "Add Flat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Flat Modal */}
      {editingFlatObject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-lg w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-lg font-bold text-[#0F172A] font-heading flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                Edit Flat in Wing {editingFlatObject.wing_name}
              </h3>
              <button
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
                    Flat Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFlatNumber}
                    onChange={(event) => setEditFlatNumber(event.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Floor Number *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="50"
                    value={editFloorNumber}
                    onChange={(event) =>
                      setEditFloorNumber(parseInt(event.target.value))
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                  Occupancy Status
                </label>
                <select
                  value={editOccupancyStatus}
                  onChange={(event) => setEditOccupancyStatus(event.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                >
                  <option value="OWNER_OCCUPIED">Owner Occupied</option>
                  <option value="TENANT_OCCUPIED">Tenant Occupied</option>
                  <option value="VACANT">Vacant</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditingFlatObject(null)}
                  className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingFlat}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-sm text-sm disabled:opacity-50"
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
