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
  X,
  Phone,
  User,
  HeartHandshake,
  Home,
  UserCheck,
  Copy,
  Check,
} from "lucide-react";

export function WingAndFlatBulkGeneratorPage() {
  const [societyTopologyData, setSocietyTopologyData] = useState({
    wings: [],
    flats: [],
  });
  const [isLoadingTopology, setIsLoadingTopology] = useState(true);
  const [selectedWingFilter, setSelectedWingFilter] = useState("ALL");
  const [searchFilterKeyword, setSearchFilterKeyword] = useState("");
  const [selectedFlatForDetails, setSelectedFlatForDetails] = useState(null);
  const [copiedPhoneNumber, setCopiedPhoneNumber] = useState(null);

  const handleCopyPhone = (phoneNumber) => {
    if (!phoneNumber) return;
    navigator.clipboard.writeText(phoneNumber);
    setCopiedPhoneNumber(phoneNumber);
    setTimeout(() => setCopiedPhoneNumber(null), 2000);
  };

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

        <div className="flex items-center gap-2">
          <div className="text-xs text-[#64748B] font-semibold hidden md:block">
            Showing {filteredFlatsList.length} of {totalFlatsCount} flats
          </div>
          <button
            type="button"
            onClick={fetchSocietyTopology}
            title="Refresh directory"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-[#334155] border border-[#CBD5E1] rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingTopology ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            to="/Society/Admin/residents"
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition-all shrink-0"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Resident Directory</span>
          </Link>
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

                          const memberCount = (flatItem.members || []).length;

                          return (
                            <button
                              key={flatItem.flat_id}
                              type="button"
                              onClick={() => setSelectedFlatForDetails(flatItem)}
                              className="px-3.5 py-1.5 rounded-lg bg-white border border-[#CBD5E1] hover:border-blue-500 hover:ring-2 hover:ring-blue-100 hover:shadow-sm transition-all flex items-center gap-2.5 shadow-sm text-left group cursor-pointer"
                              title={`Click to view member details for ${flatItem.wing_name}-${flatItem.flat_number}`}
                            >
                              <span className="text-sm font-extrabold text-[#0F172A] font-mono group-hover:text-blue-600 transition-colors">
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

                              {memberCount > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  <Users className="w-2.5 h-2.5" />
                                  <span>{memberCount}</span>
                                </span>
                              )}

                              {flatItem.flat_type && flatItem.flat_type !== "REGULAR" && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  {flatItem.flat_type}
                                </span>
                              )}
                            </button>
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

      {/* Flat Member Details Slide-Out Drawer */}
      {selectedFlatForDetails && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity duration-200"
          onClick={() => setSelectedFlatForDetails(null)}
        >
          <div
            className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-black font-mono text-base">
                  {selectedFlatForDetails.flat_number}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 font-heading">
                      Wing {selectedFlatForDetails.wing_name} - Flat {selectedFlatForDetails.flat_number}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        selectedFlatForDetails.occupancy_status === "OWNER_OCCUPIED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : selectedFlatForDetails.occupancy_status === "TENANT_OCCUPIED"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {selectedFlatForDetails.occupancy_status === "OWNER_OCCUPIED"
                        ? "Owner Occupied"
                        : selectedFlatForDetails.occupancy_status === "TENANT_OCCUPIED"
                        ? "Tenant Occupied"
                        : "Vacant"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Floor {selectedFlatForDetails.floor_number ?? "N/A"} • {selectedFlatForDetails.flat_type || "Standard Apartment"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFlatForDetails(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(!selectedFlatForDetails.members || selectedFlatForDetails.members.length === 0) ? (
                <div className="text-center py-16 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">No Members Onboarded Yet</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      This unit has no registered owner, tenant, or family member accounts.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      to="/Society/Admin/residents"
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Onboard in Directory</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const membersList = selectedFlatForDetails.members || [];
                    const ownersList = membersList.filter((m) => m.resident_type === "OWNER");
                    const tenantsList = membersList.filter((m) => m.resident_type === "TENANT");
                    const familyList = membersList.filter((m) => m.resident_type === "FAMILY_MEMBER");

                    const renderCleanMemberCard = (memberItem, defaultRoleLabel, roleTheme) => {
                      const displayRole = memberItem.relationship_type || defaultRoleLabel;
                      const isCopied = copiedPhoneNumber === memberItem.phone_number;

                      return (
                        <div
                          key={memberItem.user_id}
                          className="p-3.5 bg-slate-50/60 hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-all flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 truncate">
                                {memberItem.full_name}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleTheme.badgeBg} ${roleTheme.badgeText} ${roleTheme.badgeBorder}`}>
                                {displayRole}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {memberItem.phone_number ? (
                                <a
                                  href={`tel:${memberItem.phone_number}`}
                                  className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-600 hover:text-blue-600 font-medium transition-colors"
                                >
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{memberItem.phone_number}</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  No phone number
                                </span>
                              )}
                            </div>
                          </div>

                          {memberItem.phone_number && (
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(memberItem.phone_number)}
                              title="Copy mobile number"
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all shrink-0 cursor-pointer"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    };

                    return (
                      <div className="space-y-6">
                        {/* Tenant Section */}
                        {tenantsList.length > 0 && (
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
                              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                              <span>Tenant Details ({tenantsList.length})</span>
                            </div>
                            <div className="space-y-2">
                              {tenantsList.map((tenantItem) =>
                                renderCleanMemberCard(tenantItem, "Tenant", {
                                  badgeBg: "bg-amber-50",
                                  badgeText: "text-amber-800",
                                  badgeBorder: "border-amber-200",
                                })
                              )}
                            </div>
                          </div>
                        )}

                        {/* Owner Section */}
                        {ownersList.length > 0 && (
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                              <Home className="w-3.5 h-3.5 text-blue-600" />
                              <span>Owner Details ({ownersList.length})</span>
                            </div>
                            <div className="space-y-2">
                              {ownersList.map((ownerItem) =>
                                renderCleanMemberCard(ownerItem, "Owner", {
                                  badgeBg: "bg-blue-50",
                                  badgeText: "text-blue-800",
                                  badgeBorder: "border-blue-200",
                                })
                              )}
                            </div>
                          </div>
                        )}

                        {/* Family Members Section */}
                        {familyList.length > 0 && (
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-700">
                              <Users className="w-3.5 h-3.5 text-purple-600" />
                              <span>Family Members ({familyList.length})</span>
                            </div>
                            <div className="space-y-2">
                              {familyList.map((familyItem) =>
                                renderCleanMemberCard(familyItem, "Family Member", {
                                  badgeBg: "bg-purple-50",
                                  badgeText: "text-purple-800",
                                  badgeBorder: "border-purple-200",
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Registered under Shilp Serenity
              </span>
              <button
                type="button"
                onClick={() => setSelectedFlatForDetails(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-lg text-xs shadow-2xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
