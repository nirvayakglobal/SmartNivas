import React, { useState, useEffect } from "react";
import {
  Layers,
  PlusCircle,
  Building,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export function WingAndFlatBulkGeneratorPage() {
  const [societyTopologyData, setSocietyTopologyData] = useState({
    wings: [],
    flats: [],
  });
  const [isLoadingTopology, setIsLoadingTopology] = useState(true);
  const [selectedWingFilter, setSelectedWingFilter] = useState("ALL");

  // Bulk Generator Form State
  const [wingNamesInput, setWingNamesInput] = useState("A, B, C");
  const [startFloorNumber, setStartFloorNumber] = useState(1);
  const [endFloorNumber, setEndFloorNumber] = useState(10);
  const [flatsPerFloorCount, setFlatsPerFloorCount] = useState(4);
  const [numberingPattern, setNumberingPattern] = useState("FLOOR_PREFIX");
  const [isGeneratingFlats, setIsGeneratingFlats] = useState(false);
  const [generatorFeedbackMessage, setGeneratorFeedbackMessage] = useState("");
  const [generatorErrorMessage, setGeneratorErrorMessage] = useState("");

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

  const filteredFlatsList =
    selectedWingFilter === "ALL"
      ? societyTopologyData.flats
      : societyTopologyData.flats.filter(
          (flatRecord) => flatRecord.wing_name === selectedWingFilter
        );

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
            Bulk-generate society residential wings and flats with atomic ACID collision rollback protection.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
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

      {/* Main Grid: Generator Controls + Live Topology Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bulk Generator Form (Enterprise Light Resting Card) */}
        <div className="lg:col-span-1 bg-white border border-[#E2E8F0] rounded-lg p-6 space-y-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] h-fit">
          <div className="border-b border-[#E2E8F0] pb-3">
            <h3 className="text-base font-bold text-[#0F172A] font-heading flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              Automated Flat Matrix Provisioner
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Generates complete floor-to-flat matrices in a single ACID transaction.
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
                ACID Conflict Guarantees:
              </p>
              <p className="mt-0.5 text-blue-700">
                If a duplicate flat number is detected within any wing, the entire generation transaction rolls back immediately with zero partial records left behind.
              </p>
            </div>

            <button
              type="submit"
              disabled={isGeneratingFlats}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-sm shadow-sm transition-all text-sm flex items-center justify-center space-x-2 active:scale-[0.98]"
            >
              <span>{isGeneratingFlats ? "Validating & Creating..." : "Execute Bulk Generation"}</span>
            </button>
          </form>
        </div>

        {/* Right: Live Flat Topology Grid */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-lg p-6 space-y-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#0F172A] font-heading">
                Society Flat Matrix
              </h3>
              <p className="text-xs text-[#64748B]">
                Showing all generated apartments grouped by building wing.
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
          ) : filteredFlatsList.length === 0 ? (
            <div className="text-center py-16 text-[#94A3B8] italic text-sm">
              No flats generated yet. Use the provisioner form on the left to generate flats.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredFlatsList.map((flatItem) => (
                <div
                  key={flatItem.flat_id}
                  className="p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] hover:border-blue-400 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                      Wing {flatItem.wing_name}
                    </span>
                    <span className="text-[10px] font-semibold text-[#64748B]">
                      Fl. {flatItem.floor_number}
                    </span>
                  </div>
                  <div className="text-base font-bold text-[#0F172A] mt-1.5 font-mono">
                    {flatItem.flat_number}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                    {flatItem.occupancy_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
