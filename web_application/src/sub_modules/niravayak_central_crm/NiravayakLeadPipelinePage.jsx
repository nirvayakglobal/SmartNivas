import React, { useState, useEffect } from "react";
import {
  Users,
  PlusCircle,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";

export function NiravayakLeadPipelinePage() {
  const [pipelineLeadRecords, setPipelineLeadRecords] = useState([]);
  const [isLoadingPipelineLeads, setIsLoadingPipelineLeads] = useState(true);
  const [isCapturingNewLeadModalOpen, setIsCapturingNewLeadModalOpen] =
    useState(false);

  // New Lead Form Fields
  const [prospectiveSocietyName, setProspectiveSocietyName] = useState("");
  const [cityName, setCityName] = useState("Ahmedabad");
  const [contactPersonName, setContactPersonName] = useState("");
  const [contactPhoneNumber, setContactPhoneNumber] = useState("");
  const [contactEmailAddress, setContactEmailAddress] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [isSubmittingNewLead, setIsSubmittingNewLead] = useState(false);
  const [submissionFeedbackMessage, setSubmissionFeedbackMessage] =
    useState("");

  const pipelineStagesList = [
    { key: "NEW_LEAD", label: "New Leads", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
    { key: "DEMO_SCHEDULED", label: "Demo Scheduled", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
    { key: "PROPOSAL_SENT", label: "Proposal Sent", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
    { key: "WON", label: "Won (Converted)", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { key: "LOST", label: "Archived / Lost", badgeColor: "bg-rose-50 text-rose-700 border-rose-200" },
  ];

  const fetchLeadsPipeline = async () => {
    setIsLoadingPipelineLeads(true);
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/central/leads", {
        headers: {
          Authorization: `Bearer ${storedAuthToken}`,
        },
      });
      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setPipelineLeadRecords(responseJsonData.data);
      }
    } catch (networkFetchError) {
      console.error("Failed to fetch CRM leads:", networkFetchError);
    } finally {
      setIsLoadingPipelineLeads(false);
    }
  };

  useEffect(() => {
    fetchLeadsPipeline();
  }, []);

  const handleCreateLeadSubmit = async (formSubmissionEvent) => {
    formSubmissionEvent.preventDefault();
    setIsSubmittingNewLead(true);
    setSubmissionFeedbackMessage("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch("/api/central/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedAuthToken}`,
        },
        body: JSON.stringify({
          prospective_society_name: prospectiveSocietyName,
          city_name: cityName,
          contact_person_name: contactPersonName,
          contact_phone_number: contactPhoneNumber,
          contact_email_address: contactEmailAddress || null,
          follow_up_notes: followUpNotes || null,
        }),
      });

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setIsCapturingNewLeadModalOpen(false);
        setProspectiveSocietyName("");
        setContactPersonName("");
        setContactPhoneNumber("");
        setContactEmailAddress("");
        setFollowUpNotes("");
        fetchLeadsPipeline();
      } else {
        setSubmissionFeedbackMessage(responseJsonData.message || "Failed to create lead.");
      }
    } catch (networkSubmissionError) {
      setSubmissionFeedbackMessage("Network error during lead submission.");
    } finally {
      setIsSubmittingNewLead(false);
    }
  };

  const handleUpdateStage = async (targetLeadId, nextPipelineStage) => {
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch(`/api/central/leads/${targetLeadId}/stage`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedAuthToken}`,
        },
        body: JSON.stringify({
          pipeline_stage: nextPipelineStage,
        }),
      });
      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        fetchLeadsPipeline();
      }
    } catch (updateStageError) {
      console.error("Failed to update lead stage:", updateStageError);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Society Lead Pipeline
          </h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Track prospective residential societies from discovery to proposal and client conversion.
          </p>
        </div>

        <button
          onClick={() => setIsCapturingNewLeadModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-sm transition-all text-sm active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Capture Prospective Lead</span>
        </button>
      </div>

      {/* Kanban / Multi-Stage Pipeline Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {pipelineStagesList.map((pipelineStageItem) => {
          const leadsInCurrentStage = pipelineLeadRecords.filter(
            (leadItem) => leadItem.pipeline_stage === pipelineStageItem.key
          );

          return (
            <div
              key={pipelineStageItem.key}
              className="bg-white border border-[#E2E8F0] rounded-lg flex flex-col min-h-[520px] shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${pipelineStageItem.badgeColor}`}
                >
                  {pipelineStageItem.label}
                </span>
                <span className="text-xs font-bold text-[#64748B] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-full">
                  {leadsInCurrentStage.length}
                </span>
              </div>

              {/* Column Leads List */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto bg-[#F7F9FB]">
                {leadsInCurrentStage.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-xs text-[#94A3B8] italic">
                    No leads in this stage
                  </div>
                ) : (
                  leadsInCurrentStage.map((leadRecord) => (
                    <div
                      key={leadRecord.lead_id}
                      className="p-3.5 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-md space-y-2 transition-all shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-bold text-[#0F172A] font-heading leading-snug">
                          {leadRecord.prospective_society_name}
                        </h4>
                        <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0] px-1.5 py-0.5 rounded flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#94A3B8]" />
                          {leadRecord.city_name}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-[#334155]">
                        <p className="font-medium text-[#0F172A]">
                          {leadRecord.contact_person_name}
                        </p>
                        <p className="flex items-center gap-1.5 text-[#64748B]">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {leadRecord.contact_phone_number}
                        </p>
                        {leadRecord.contact_email_address && (
                          <p className="flex items-center gap-1.5 text-[#64748B] truncate">
                            <Mail className="w-3 h-3 text-blue-600" />
                            {leadRecord.contact_email_address}
                          </p>
                        )}
                      </div>

                      {leadRecord.follow_up_notes && (
                        <p className="text-[11px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded italic">
                          "{leadRecord.follow_up_notes}"
                        </p>
                      )}

                      {/* Advance Stage Selector */}
                      <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                        <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wide">
                          Move to:
                        </span>
                        <select
                          value={leadRecord.pipeline_stage}
                          onChange={(selectionEvent) =>
                            handleUpdateStage(
                              leadRecord.lead_id,
                              selectionEvent.target.value
                            )
                          }
                          className="bg-white border border-[#CBD5E1] text-[11px] text-[#0F172A] rounded px-2 py-1 font-medium focus:outline-none focus:border-blue-600"
                        >
                          {pipelineStagesList.map((stageOption) => (
                            <option
                              key={stageOption.key}
                              value={stageOption.key}
                            >
                              {stageOption.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Capture Lead Modal (Enterprise Light Level 3 Overlay) */}
      {isCapturingNewLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-lg w-full max-w-lg p-6 space-y-5 shadow-[0_20px_25px_-5px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-lg font-bold text-[#0F172A] font-heading flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                Capture Prospective Society Lead
              </h3>
              <button
                onClick={() => setIsCapturingNewLeadModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] text-sm"
              >
                ✕
              </button>
            </div>

            {submissionFeedbackMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs font-semibold">
                {submissionFeedbackMessage}
              </div>
            )}

            <form onSubmit={handleCreateLeadSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                  Prospective Society Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shaligram Prime Heights"
                  value={prospectiveSocietyName}
                  onChange={(inputEvent) =>
                    setProspectiveSocietyName(inputEvent.target.value)
                  }
                  className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    City Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ahmedabad"
                    value={cityName}
                    onChange={(inputEvent) =>
                      setCityName(inputEvent.target.value)
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    RWA Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ketanbhai Shah"
                    value={contactPersonName}
                    onChange={(inputEvent) =>
                      setContactPersonName(inputEvent.target.value)
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9825000000"
                    value={contactPhoneNumber}
                    onChange={(inputEvent) =>
                      setContactPhoneNumber(inputEvent.target.value)
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="ketan@shaligram.com"
                    value={contactEmailAddress}
                    onChange={(inputEvent) =>
                      setContactEmailAddress(inputEvent.target.value)
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                  Follow-up Notes / Society Requirements
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. 180 flats, 2 main gates, wants walk-in visitor approvals and parcel leave-at-gate feature."
                  value={followUpNotes}
                  onChange={(inputEvent) =>
                    setFollowUpNotes(inputEvent.target.value)
                  }
                  className="w-full bg-white border border-[#CBD5E1] rounded-sm px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsCapturingNewLeadModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewLead}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-sm shadow-sm transition-all text-sm active:scale-[0.98]"
                >
                  {isSubmittingNewLead ? "Saving..." : "Create Pipeline Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
