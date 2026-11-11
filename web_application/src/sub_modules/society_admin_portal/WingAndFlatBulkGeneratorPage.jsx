import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Building,
  Lock,
  Search,
  Filter,
  Users,
  ShieldAlert,
  Info,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export function WingAndFlatBulkGeneratorPage() {
  const [societyTopologyData, setSocietyTopologyData] = useState({
    wings: [],
    flats: [],
  });
  const [isLoadingTopology, setIsLoadingTopology] = useState(true);
  const [selectedWingFilter, setSelectedWingFilter] = useState("ALL");
  const [searchFilterKeyword, setSearchFilterKeyword] = useState("");

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

  // Filter flats by wing and search keyword
  const filteredFlatsList = useMemo(() => {
    return societyTopologyData.flats.filter((flatRecord) => {
      const matchesWing =
        selectedWingFilter === "ALL" || flatRecord.wing_name === selectedWingFilter;
      const matchesSearch =
        !searchFilterKeyword ||
        flatRecord.flat_number.toLowerCase().includes(searchFilterKeyword.toLowerCase()) ||
        flatRecord.wing_name.toLowerCase().includes(searchFilterKeyword.toLowerCase());
      return matchesWing && matchesSearch;
    });
  }, [societyTopologyData.flats, selectedWingFilter, searchFilterKeyword]);

  // Group flats hierarchically by Wing -> Floor -> Flats for visual matrix
  const groupedWingsMatrix = useMemo(() => {
    const wingGroupsMap = new Map();

    filteredFlatsList.forEach((flatItem) => {
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
  }, [filteredFlatsList]);

  // Summary Metrics
  const totalFlatsCount = societyTopologyData.flats.length;
  const occupiedFlatsCount = societyTopologyData.flats.filter(
    (flatItem) =>
      flatItem.occupancy_status === "OWNER_OCCUPIED" ||
      flatItem.occupancy_status === "TENANT_OCCUPIED"
  ).length;
  const vacantFlatsCount = totalFlatsCount - occupiedFlatsCount;
  const totalWingsCount = societyTopologyData.wings.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#CBD5E1] rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 mb-2">
            <Lock className="w-3 h-3 text-slate-500" />
            <span>Provisioning Locked by Niravayak HQ</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-blue-600" />
            Wings & Flat Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Floor layouts and apartment inventory provisioned for this society. Building topology is centrally governed by Niravayak Global CRM.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchSocietyTopology}
            title="Refresh directory"
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-[#334155] border border-[#CBD5E1] rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingTopology ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
          <Link
            to="/Society/Admin/residents"
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm transition-all"
          >
            <Users className="w-4 h-4" />
            <span>Resident Directory</span>
          </Link>
        </div>
      </div>

      {/* Topology Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-[#64748B]">Total Wings</div>
            <div className="text-2xl font-black text-[#0F172A] font-heading">
              {totalWingsCount}
            </div>
            <div className="text-xs text-[#64748B] truncate font-mono">
              {societyTopologyData.wings.map((w) => `Wing ${w.wing_name}`).join(", ") || "None"}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-[#64748B]">Total Apartments</div>
            <div className="text-2xl font-black text-[#0F172A] font-heading">
              {totalFlatsCount}
            </div>
            <div className="text-xs text-indigo-600 font-semibold">
              Centrally Provisioned
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-[#64748B]">Occupied Units</div>
            <div className="text-2xl font-black text-emerald-700 font-heading">
              {occupiedFlatsCount}
            </div>
            <div className="text-xs text-emerald-600 font-medium">
              Assigned to Residents
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-[#64748B]">Vacant Units</div>
            <div className="text-2xl font-black text-amber-700 font-heading">
              {vacantFlatsCount}
            </div>
            <div className="text-xs text-[#64748B]">
              Ready for onboarding
            </div>
          </div>
        </div>
      </div>

      {/* Central Governance Notice Box */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
        <Lock className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-0.5">
          <p className="font-bold text-slate-900">
            Building Topology Governance
          </p>
          <p className="text-slate-600 leading-relaxed">
            Wings, floors, and flat inventories are provisioned centrally by Niravayak Global CRM to guarantee license compliance and commercial per-flat billing accuracy. If your society requires structural modifications (e.g. adding new wings or merging flats), please contact your Niravayak account manager.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search apartment number..."
              value={searchFilterKeyword}
              onChange={(event) => setSearchFilterKeyword(event.target.value)}
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
              All Wings ({totalFlatsCount})
            </button>
            {societyTopologyData.wings.map((wingItem) => {
              const wingCount = societyTopologyData.flats.filter(
                (flatItem) => flatItem.wing_name === wingItem.wing_name
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
                  Wing {wingItem.wing_name} ({wingCount})
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-[#64748B] font-semibold">
          Showing {filteredFlatsList.length} of {totalFlatsCount} flats
        </div>
      </div>

      {/* Read-Only Architectural Floor Matrix */}
      {isLoadingTopology ? (
        <div className="bg-white border border-[#CBD5E1] rounded-xl p-16 text-center text-[#94A3B8] text-sm">
          Loading society apartment directory...
        </div>
      ) : groupedWingsMatrix.length === 0 ? (
        <div className="bg-white border border-[#CBD5E1] rounded-xl p-16 text-center text-[#94A3B8] italic text-sm space-y-2">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <p>No apartments found matching your search filter.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedWingsMatrix.map((wingGroupItem) => {
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
                <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-3 h-3 rounded-full bg-blue-600 shadow-sm" />
                    <h3 className="text-sm font-bold text-[#0F172A] font-heading uppercase tracking-wide">
                      Wing {wingGroupItem.wingName}
                    </h3>
                    <span className="text-xs text-[#64748B] font-semibold">
                      • {wingTotalFlats} Apartments across {wingGroupItem.floors.length} Floors
                    </span>
                  </div>
                  <span className="text-xs text-[#64748B] font-mono">
                    Read-Only Directory View
                  </span>
                </div>

                {/* Floors and Flats Rows */}
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
                              className="px-3.5 py-1.5 rounded-lg bg-white border border-[#CBD5E1] hover:border-blue-400 hover:shadow-sm transition-all flex items-center gap-2.5 shadow-sm"
                            >
                              <span className="text-sm font-extrabold text-[#0F172A] font-mono">
                                {flatItem.flat_number}
                              </span>

                              <div className="flex items-center gap-1 text-[11px]">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isOccupied ? "bg-emerald-500" : "bg-slate-300"
                                  }`}
                                />
                                <span
                                  className={`font-semibold ${
                                    isOccupied
                                      ? "text-emerald-700"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {displayOccupancyLabel}
                                </span>
                              </div>

                              {flatItem.flat_type && flatItem.flat_type !== "REGULAR" && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  {flatItem.flat_type}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
