import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
  Check,
  Clock,
  UserCheck,
  Building2,
  ShieldCheck,
  UserX,
  Home,
  ChevronRight,
  Smartphone,
  Layers,
  Building,
  RefreshCw,
  Copy,
  User,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Eye,
  FileImage,
  Paperclip,
  ExternalLink,
  ArrowRight,
  ArrowRightLeft,
  Coins,
} from "lucide-react";

export function ResidentDirectoryAndCsvImportPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab Order: 1) Wings & Flat Directory, 2) Members & Resident Directory, 3) Mobile App Approval
  const defaultTab = searchParams.get("tab") || "WINGS_AND_FLATS";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Synchronize URL tab parameter if tab changes
  const handleSelectTab = (targetTab) => {
    setActiveTab(targetTab);
    setSearchParams({ tab: targetTab }, { replace: true });
  };

  // ---------------------------------------------------------------------------
  // STATE: RESIDENTS DIRECTORY & APPROVALS
  // ---------------------------------------------------------------------------
  const [societyResidentsList, setSocietyResidentsList] = useState([]);
  const [isLoadingResidents, setIsLoadingResidents] = useState(true);
  const [searchFilterKeyword, setSearchFilterKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedWingDirectoryFilter, setSelectedWingDirectoryFilter] = useState("ALL");

  // CSV Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvFileContent, setCsvFileContent] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [importFeedbackMessage, setImportFeedbackMessage] = useState("");
  const [importErrorMessage, setImportErrorMessage] = useState("");

  // Quick Approval Processing
  const [processingApprovalUserId, setProcessingApprovalUserId] = useState(null);

  // Add Single Resident Modal State
  const [isAddResidentModalOpen, setIsAddResidentModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newWingName, setNewWingName] = useState("A");
  const [newFlatNumber, setNewFlatNumber] = useState("");
  const [newResidentType, setNewResidentType] = useState("OWNER");
  const [newApprovalStatus, setNewApprovalStatus] = useState("APPROVED");
  const [newResidentDocuments, setNewResidentDocuments] = useState([]);
  const [isSavingNewResident, setIsSavingNewResident] = useState(false);
  const [addResidentError, setAddResidentError] = useState("");

  // Document Preview Modal State
  const [previewingDocument, setPreviewingDocument] = useState(null);
  // View Resident Documents Modal State (for audit from Directory or Approvals)
  const [viewingDocumentsResident, setViewingDocumentsResident] = useState(null);
  const [approvalSubTab, setApprovalSubTab] = useState("PENDING"); // "PENDING" or "APPROVED_HISTORY"

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

  // ---------------------------------------------------------------------------
  // STATE: WINGS & FLATS ARCHITECTURAL DIRECTORY
  // ---------------------------------------------------------------------------
  const [societyTopologyData, setSocietyTopologyData] = useState({
    wings: [],
    flats: [],
  });
  const [isLoadingTopology, setIsLoadingTopology] = useState(true);
  const [selectedWingFilter, setSelectedWingFilter] = useState("ALL");
  const [topologySearchKeyword, setTopologySearchKeyword] = useState("");
  const [selectedFlatForDetails, setSelectedFlatForDetails] = useState(null);
  const [copiedPhoneNumber, setCopiedPhoneNumber] = useState(null);

  // ---------------------------------------------------------------------------
  // STATE: FLAT OWNERSHIP SALE / TRANSFER & HISTORY
  // ---------------------------------------------------------------------------
  const [flatOwnershipHistoryList, setFlatOwnershipHistoryList] = useState([]);
  const [isLoadingOwnershipHistory, setIsLoadingOwnershipHistory] = useState(false);
  const [isOwnershipHistoryModalOpen, setIsOwnershipHistoryModalOpen] = useState(false);

  // Transfer Ownership Form Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetFlatId, setTransferTargetFlatId] = useState("");
  const [transferNewOwnerName, setTransferNewOwnerName] = useState("");
  const [transferNewOwnerPhone, setTransferNewOwnerPhone] = useState("");
  const [transferSaleDate, setTransferSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [transferRemarks, setTransferRemarks] = useState("");
  const [transferFeeCategory, setTransferFeeCategory] = useState("SOCIETY_TRANSFER_FEE"); // SOCIETY_TRANSFER_FEE, SOCIETY_DEVELOPMENT_FUND, BOTH, EXEMPT
  const [transferFeeInr, setTransferFeeInr] = useState("0");
  const [societyDevelopmentFundInr, setSocietyDevelopmentFundInr] = useState("0");
  const [transferPaymentMode, setTransferPaymentMode] = useState("NEFT_RTGS"); // NEFT_RTGS, CHEQUE, UPI, CASH, DEMAND_DRAFT
  const [transferPaymentReference, setTransferPaymentReference] = useState("");
  const [transferSaleDeedFile, setTransferSaleDeedFile] = useState(null);
  const [deactivatePreviousOwner, setDeactivatePreviousOwner] = useState(true);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [transferModalError, setTransferModalError] = useState("");

  const fetchFlatOwnershipHistory = async (targetFlatId) => {
    setIsLoadingOwnershipHistory(true);
    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch(`/api/admin/flats/${targetFlatId}/ownership-history`, {
        headers: { Authorization: `Bearer ${storedAuthToken}` },
      });
      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setFlatOwnershipHistoryList(responseJsonData.data || []);
      }
    } catch (networkError) {
      console.error("Failed to load flat ownership history:", networkError);
    } finally {
      setIsLoadingOwnershipHistory(false);
    }
  };

  const handleOpenTransferModal = (flatRecord = null) => {
    if (flatRecord) {
      setTransferTargetFlatId(String(flatRecord.flat_id));
      setSelectedFlatForDetails(flatRecord);
    } else {
      setTransferTargetFlatId("");
    }
    setTransferNewOwnerName("");
    setTransferNewOwnerPhone("");
    setTransferSaleDate(new Date().toISOString().slice(0, 10));
    setTransferRemarks("");
    setTransferFeeCategory("SOCIETY_TRANSFER_FEE");
    setTransferFeeInr("0");
    setSocietyDevelopmentFundInr("0");
    setTransferPaymentMode("NEFT_RTGS");
    setTransferPaymentReference("");
    setTransferSaleDeedFile(null);
    setDeactivatePreviousOwner(true);
    setTransferModalError("");
    setIsTransferModalOpen(true);
  };

  const handleTransferSubmit = async (formSubmitEvent) => {
    formSubmitEvent.preventDefault();
    const effectiveFlatId = transferTargetFlatId || selectedFlatForDetails?.flat_id;
    if (!effectiveFlatId) {
      setTransferModalError("Please select a flat to transfer.");
      return;
    }

    setIsSubmittingTransfer(true);
    setTransferModalError("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch(
        `/api/admin/flats/${effectiveFlatId}/ownership-transfer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedAuthToken}`,
          },
          body: JSON.stringify({
            new_owner_name: transferNewOwnerName,
            new_owner_phone: transferNewOwnerPhone,
            transfer_sale_date: transferSaleDate,
            sale_deed_document_url: transferSaleDeedFile?.file_path_or_url || null,
            sale_deed_document_filename: transferSaleDeedFile?.file_name || null,
            transfer_remarks: transferRemarks,
            fee_category: transferFeeCategory,
            transfer_fee_inr: parseFloat(transferFeeInr || "0"),
            society_development_fund_inr: parseFloat(societyDevelopmentFundInr || "0"),
            payment_mode: transferPaymentMode,
            payment_reference_number: transferPaymentReference,
            deactivate_previous_owner: deactivatePreviousOwner,
          }),
        }
      );

      const responseJsonData = await httpApiResponse.json();
      if (httpApiResponse.ok && responseJsonData.success) {
        setIsTransferModalOpen(false);
        setImportFeedbackMessage(responseJsonData.message);
        fetchSocietyResidents(true);
        fetchSocietyTopology(true);
        if (selectedFlatForDetails && String(selectedFlatForDetails.flat_id) === String(effectiveFlatId)) {
          fetchFlatOwnershipHistory(effectiveFlatId);
        }
        setSelectedFlatForDetails(null);
      } else {
        setTransferModalError(
          responseJsonData.message || `Transfer failed (HTTP ${httpApiResponse.status}).`
        );
      }
    } catch (networkError) {
      setTransferModalError(`Network error: ${networkError.message || "Failed to execute transfer."}`);
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const handleCopyPhone = (phoneNumber) => {
    if (!phoneNumber) return;
    navigator.clipboard.writeText(phoneNumber);
    setCopiedPhoneNumber(phoneNumber);
    setTimeout(() => setCopiedPhoneNumber(null), 2000);
  };

  const sampleCsvTemplate = `wing_name,flat_number,full_name,phone_number,resident_type
A,101,Rameshbhai Patel,9825111111,OWNER
A,102,Sureshbhai Shah,9825222222,OWNER
B,201,Priya Sharma,9825333333,TENANT`;

  // Fetch Residents
  const fetchSocietyResidents = async (isSilentBackgroundRefresh = false) => {
    if (!isSilentBackgroundRefresh) {
      setIsLoadingResidents(true);
    }
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
      if (!isSilentBackgroundRefresh) {
        setIsLoadingResidents(false);
      }
    }
  };

  // Fetch Topology (Wings and Flats)
  const fetchSocietyTopology = async (isSilentBackgroundRefresh = false) => {
    if (!isSilentBackgroundRefresh) {
      setIsLoadingTopology(true);
    }
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
      if (!isSilentBackgroundRefresh) {
        setIsLoadingTopology(false);
      }
    }
  };

  useEffect(() => {
    fetchSocietyResidents();
    fetchSocietyTopology();
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
        setIsImportModalOpen(false);
        // Refresh data silently in background without resetting loading spinners or unmounting the grid
        fetchSocietyResidents(true);
        fetchSocietyTopology(true);
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

  const handleQuickApproval = async (targetResidentUserId, newApprovalStatus) => {
    setProcessingApprovalUserId(targetResidentUserId);
    setImportFeedbackMessage("");
    setImportErrorMessage("");

    try {
      const storedAuthToken = localStorage.getItem("smart_nivas_auth_token");
      const httpApiResponse = await fetch(
        `/api/admin/residents/${targetResidentUserId}/approval`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedAuthToken}`,
          },
          body: JSON.stringify({
            approval_status: newApprovalStatus,
          }),
        }
      );

      const responseJsonData = await httpApiResponse.json();
      if (responseJsonData.success) {
        setImportFeedbackMessage(responseJsonData.message);

        // Optimistically update selectedFlatForDetails if modal is currently open
        setSelectedFlatForDetails((previousSelectedFlat) => {
          if (!previousSelectedFlat || !previousSelectedFlat.members) {
            return previousSelectedFlat;
          }
          const updatedMembers = previousSelectedFlat.members.map((member) => {
            if (member.user_id === targetResidentUserId) {
              return {
                ...member,
                approval_status: newApprovalStatus,
              };
            }
            return member;
          });
          return {
            ...previousSelectedFlat,
            members: updatedMembers,
          };
        });

        // Optimistically update viewingDocumentsResident if document modal is open
        setViewingDocumentsResident((previousViewingResident) => {
          if (!previousViewingResident || previousViewingResident.user_id !== targetResidentUserId) {
            return previousViewingResident;
          }
          return {
            ...previousViewingResident,
            approval_status: newApprovalStatus,
          };
        });

        // Refresh data silently in background without resetting loading spinners or unmounting the grid
        fetchSocietyResidents(true);
        fetchSocietyTopology(true);
      } else {
        setImportErrorMessage(
          responseJsonData.message || "Failed to update member approval status."
        );
      }
    } catch (networkError) {
      setImportErrorMessage("Network error while updating status.");
    } finally {
      setProcessingApprovalUserId(null);
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
          approval_status: newApprovalStatus,
          documents: newResidentDocuments,
        }),
      });

      let responseJsonData = {};
      try {
        responseJsonData = await httpApiResponse.json();
      } catch (parseError) {
        setAddResidentError(`Server error (${httpApiResponse.status}): Failed to parse response.`);
        return;
      }

      if (httpApiResponse.ok && responseJsonData.success) {
        setIsAddResidentModalOpen(false);
        setImportFeedbackMessage(responseJsonData.message);
        setNewFullName("");
        setNewPhoneNumber("");
        setNewFlatNumber("");
        setNewApprovalStatus("APPROVED");
        setNewResidentDocuments([]);
        // Refresh data silently in background without resetting loading spinners or unmounting the grid
        fetchSocietyResidents(true);
        fetchSocietyTopology(true);
      } else {
        setAddResidentError(
          responseJsonData.message || `Failed to add resident (HTTP ${httpApiResponse.status}).`
        );
      }
    } catch (networkError) {
      setAddResidentError(`Network error: ${networkError.message || "Failed to reach server."}`);
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
        // Refresh data silently in background without resetting loading spinners or unmounting the grid
        fetchSocietyResidents(true);
        fetchSocietyTopology(true);
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
        // Refresh data silently in background without resetting loading spinners or unmounting the grid
        fetchSocietyResidents(true);
        fetchSocietyTopology(true);
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

    const csvHeaderLine =
      "wing_name,flat_number,full_name,phone_number,resident_type,approval_status\n";
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
    downloadAnchor.setAttribute(
      "download",
      `society_residents_directory_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // Group residents by flat for the unified "Members & Residents Directory" view
  const flatsWithMembersMap = useMemo(() => {
    const groupedMap = new Map();

    societyResidentsList.forEach((residentItem) => {
      const wingKey = residentItem.wing_name || "Unassigned";
      const flatKey = residentItem.flat_number || "Unassigned";
      const compositeFlatKey = `${wingKey}-${flatKey}`;

      if (!groupedMap.has(compositeFlatKey)) {
        groupedMap.set(compositeFlatKey, {
          wing_name: wingKey,
          flat_number: flatKey,
          flat_id: residentItem.flat_id,
          members: [],
          hasPending: false,
        });
      }

      const flatGroup = groupedMap.get(compositeFlatKey);
      flatGroup.members.push(residentItem);
      if (residentItem.approval_status === "PENDING") {
        flatGroup.hasPending = true;
      }
    });

    return Array.from(groupedMap.values()).sort((firstFlat, secondFlat) => {
      if (firstFlat.wing_name !== secondFlat.wing_name) {
        return firstFlat.wing_name.localeCompare(secondFlat.wing_name);
      }
      return String(firstFlat.flat_number).localeCompare(
        String(secondFlat.flat_number),
        undefined,
        { numeric: true }
      );
    });
  }, [societyResidentsList]);

  // Filtered flats with members based on search and filters
  const filteredFlatsWithMembers = useMemo(() => {
    const searchLower = searchFilterKeyword.toLowerCase().trim();

    return flatsWithMembersMap
      .filter((flatGroup) => {
        const matchesWing =
          selectedWingDirectoryFilter === "ALL" ||
          flatGroup.wing_name === selectedWingDirectoryFilter;
        return matchesWing;
      })
      .map((flatGroup) => {
        // Filter members inside the flat according to keyword and type
        const matchingMembers = flatGroup.members.filter((member) => {
          const matchesKeyword =
            !searchLower ||
            (member.full_name || "").toLowerCase().includes(searchLower) ||
            (member.phone_number || "").includes(searchLower) ||
            `${flatGroup.wing_name}-${flatGroup.flat_number}`.toLowerCase().includes(searchLower);

          const matchesType =
            typeFilter === "ALL" ||
            (typeFilter === "OWNER" && (member.resident_type === "OWNER" || member.resident_type === "OWNER_FAMILY")) ||
            (typeFilter === "TENANT" && (member.resident_type === "TENANT" || member.resident_type === "TENANT_FAMILY")) ||
            (typeFilter === "FAMILY" && (member.resident_type === "OWNER_FAMILY" || member.resident_type === "TENANT_FAMILY" || member.resident_type === "FAMILY_MEMBER")) ||
            member.resident_type === typeFilter;

          return matchesKeyword && matchesType;
        });

        // Also include if the flat unit itself matches the search
        const flatMatchesDirectly =
          !searchLower ||
          `${flatGroup.wing_name}-${flatGroup.flat_number}`.toLowerCase().includes(searchLower);

        return {
          ...flatGroup,
          displayMembers: flatMatchesDirectly && typeFilter === "ALL" ? flatGroup.members : matchingMembers,
        };
      })
      .filter((flatGroup) => flatGroup.displayMembers.length > 0);
  }, [flatsWithMembersMap, searchFilterKeyword, typeFilter, selectedWingDirectoryFilter]);

  // Pending Member Approvals Count
  const pendingApprovalsList = useMemo(() => {
    return societyResidentsList.filter(
      (residentItem) => residentItem.approval_status === "PENDING"
    );
  }, [societyResidentsList]);

  // Approved Member Registrations (with documents audit history)
  const approvedResidentsList = useMemo(() => {
    return societyResidentsList.filter(
      (residentItem) => residentItem.approval_status === "APPROVED"
    );
  }, [societyResidentsList]);

  const approvedMembersCount = useMemo(() => {
    return approvedResidentsList.length;
  }, [approvedResidentsList]);

  // ---------------------------------------------------------------------------
  // TOPOLOGY MEMOS (WINGS AND FLATS MATRIX)
  // ---------------------------------------------------------------------------
  const filteredFlatsList = useMemo(() => {
    return societyTopologyData.flats.filter((flatRecord) => {
      const matchesWing =
        selectedWingFilter === "ALL" || flatRecord.wing_name === selectedWingFilter;
      const matchesSearch =
        !topologySearchKeyword ||
        flatRecord.flat_number.toLowerCase().includes(topologySearchKeyword.toLowerCase()) ||
        flatRecord.wing_name.toLowerCase().includes(topologySearchKeyword.toLowerCase());
      return matchesWing && matchesSearch;
    });
  }, [societyTopologyData.flats, selectedWingFilter, topologySearchKeyword]);

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

  const totalFlatsCount = societyTopologyData.flats.length;
  const occupiedFlatsCount = societyTopologyData.flats.filter(
    (flatItem) =>
      flatItem.occupancy_status === "OWNER_OCCUPIED" ||
      flatItem.occupancy_status === "TENANT_OCCUPIED"
  ).length;
  const vacantFlatsCount = totalFlatsCount - occupiedFlatsCount;
  const totalWingsCount = societyTopologyData.wings.length;

  return (
    <div className="space-y-6 relative pb-10">
      {/* Subtle ambient light gradient backdrop for glassmorphism */}
      <div className="absolute -top-10 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Modern Frosted Glass Hero Header */}
      <div className="relative backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Apartments & Community Directory
              </span>
              <span className="text-xs font-medium text-slate-500">
                {totalWingsCount} Wings • {totalFlatsCount} Flats • {societyResidentsList.length} Residents
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
                  Wings, Flats & Residents
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Architectural floor matrix, household member directory, document verification, and mobile app approval queue.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleOpenTransferModal(null)}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-sm hover:shadow transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transfer Ownership</span>
            </button>

            <button
              onClick={() => {
                setImportFeedbackMessage("");
                setImportErrorMessage("");
                setIsImportModalOpen(true);
              }}
              className="flex items-center space-x-1.5 bg-white/80 hover:bg-white border border-slate-200/90 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs shadow-xs hover:shadow transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Bulk CSV Import</span>
            </button>

            <button
              onClick={() => setIsAddResidentModalOpen(true)}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-sm hover:shadow transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Resident</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={societyResidentsList.length === 0}
              className="flex items-center space-x-1.5 bg-white/80 hover:bg-white border border-slate-200/90 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Alerts / Feedback */}
      {importFeedbackMessage && (
        <div className="p-4 backdrop-blur-md bg-emerald-50/80 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{importFeedbackMessage}</span>
          </div>
          <button
            onClick={() => setImportFeedbackMessage("")}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {importErrorMessage && (
        <div className="p-4 backdrop-blur-md bg-rose-50/80 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{importErrorMessage}</span>
          </div>
          <button
            onClick={() => setImportErrorMessage("")}
            className="text-rose-600 hover:text-rose-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Frosted Tabs Navigation Bar */}
      <div className="backdrop-blur-md bg-white/70 border border-white/80 shadow-xs rounded-2xl p-1.5 flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleSelectTab("WINGS_AND_FLATS")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === "WINGS_AND_FLATS"
              ? "bg-white text-blue-700 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Wings & Flat Directory ({totalFlatsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab("MEMBERS_PER_FLAT")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === "MEMBERS_PER_FLAT"
              ? "bg-white text-blue-700 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Members & Residents Directory ({societyResidentsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab("MOBILE_APP_APPROVAL")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 relative ${
            activeTab === "MOBILE_APP_APPROVAL"
              ? "bg-white text-amber-900 shadow-sm border border-amber-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Smartphone className="w-4 h-4 text-amber-600" />
          <span>Mobile App Approval</span>
          {pendingApprovalsList.length > 0 && (
            <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold animate-pulse">
              {pendingApprovalsList.length}
            </span>
          )}
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: WINGS & FLAT DIRECTORY (FIRST)                                */}
      {/* ===================================================================== */}
      {activeTab === "WINGS_AND_FLATS" && (
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
                  value={topologySearchKeyword}
                  onChange={(event) => setTopologySearchKeyword(event.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg text-[#0F172A] font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
                />
              </div>

              {/* Wing Filter Pills */}
              <div className="flex items-center space-x-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSelectedWingFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-[#334155] border border-[#CBD5E1] rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoadingTopology ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Architectural Floor Matrix */}
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
                        Click any unit to view occupants
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: MEMBERS & RESIDENTS DIRECTORY (PER-FLAT HOUSEHOLD ROSTER)     */}
      {/* ===================================================================== */}
      {activeTab === "MEMBERS_PER_FLAT" && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Wing Filter, Type Filter */}
          <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-72">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search resident name, phone, or flat..."
                  value={searchFilterKeyword}
                  onChange={(event) => setSearchFilterKeyword(event.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-[#94A3B8] font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
                />
              </div>

              {/* Wing Filter */}
              <div className="flex items-center space-x-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSelectedWingDirectoryFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedWingDirectoryFilter === "ALL"
                      ? "bg-[#0F172A] text-white shadow-sm"
                      : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                  }`}
                >
                  All Wings
                </button>
                {societyTopologyData.wings.map((wingItem) => (
                  <button
                    key={wingItem.wing_id}
                    type="button"
                    onClick={() => setSelectedWingDirectoryFilter(wingItem.wing_name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedWingDirectoryFilter === wingItem.wing_name
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                    }`}
                  >
                    Wing {wingItem.wing_name}
                  </button>
                ))}
              </div>

              {/* Resident Type Pills */}
              <div className="flex items-center space-x-1 border-l border-slate-200 pl-2">
                {[
                  { key: "ALL", label: "All Types" },
                  { key: "OWNER", label: "Owners & Family" },
                  { key: "TENANT", label: "Tenants & Family" },
                  { key: "FAMILY", label: "Family Only" },
                ].map((filterOption) => (
                  <button
                    key={filterOption.key}
                    onClick={() => setTypeFilter(filterOption.key)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      typeFilter === filterOption.key
                        ? "bg-blue-600 text-white"
                        : "bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    {filterOption.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-[#64748B] font-semibold">
              Showing {filteredFlatsWithMembers.length} Flats with Members
            </div>
          </div>

          {/* Flats Grid */}
          {filteredFlatsWithMembers.length === 0 ? (
            <div className="bg-white border border-[#CBD5E1] rounded-xl p-16 text-center text-[#94A3B8] italic text-sm space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p>No residents found matching your filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFlatsWithMembers.map((flatGroup) => {
                const pendingMembers = flatGroup.displayMembers.filter(
                  (m) => m.approval_status === "PENDING"
                );

                return (
                  <div
                    key={`${flatGroup.wing_name}-${flatGroup.flat_number}`}
                    className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm hover:border-blue-300 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      {/* Flat Card Header */}
                      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-extrabold font-mono text-sm flex items-center justify-center border border-blue-200">
                            {flatGroup.wing_name}
                          </span>
                          <div>
                            <span className="text-base font-extrabold text-[#0F172A] font-mono">
                              Flat {flatGroup.flat_number}
                            </span>
                            <span className="text-[11px] text-[#64748B] block">
                              Wing {flatGroup.wing_name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {pendingMembers.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              {pendingMembers.length} Pending
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-[#334155] border border-slate-200">
                            {flatGroup.displayMembers.length} {flatGroup.displayMembers.length === 1 ? "Member" : "Members"}
                          </span>
                        </div>
                      </div>

                      {/* Members List within this Flat grouped by Owner & Tenant */}
                      <div className="space-y-3 mt-3">
                        {(() => {
                          const ownersList = flatGroup.displayMembers.filter(
                            (memberItem) =>
                              (memberItem.resident_type || "OWNER") === "OWNER" ||
                              memberItem.resident_type === "OWNER_FAMILY" ||
                              memberItem.resident_type === "FAMILY_MEMBER"
                          );
                          const tenantsList = flatGroup.displayMembers.filter(
                            (memberItem) =>
                              memberItem.resident_type === "TENANT" ||
                              memberItem.resident_type === "TENANT_FAMILY"
                          );

                          const renderMemberRow = (memberRecord, badgeColorClasses, badgeLabel) => {
                            const isPending = memberRecord.approval_status === "PENDING";
                            const isCopied = copiedPhoneNumber === memberRecord.phone_number;

                            return (
                              <div
                                key={memberRecord.user_id}
                                className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs transition-colors ${
                                  isPending
                                    ? "bg-amber-50/60 border-amber-200"
                                    : "bg-[#F8FAFC] border-[#E2E8F0]"
                                }`}
                              >
                                <div className="min-w-0 space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-[#0F172A] truncate">
                                      {memberRecord.full_name}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${badgeColorClasses}`}
                                    >
                                      {badgeLabel}
                                    </span>
                                    {memberRecord.relationship_type && (
                                      <span className="text-[10px] text-slate-500 font-medium">
                                        ({memberRecord.relationship_type})
                                      </span>
                                    )}
                                  </div>

                                  {memberRecord.phone_number ? (
                                    <div className="flex items-center gap-2">
                                      <a
                                        href={`tel:${memberRecord.phone_number}`}
                                        className="text-[11px] font-mono text-emerald-700 hover:text-blue-600 flex items-center gap-1"
                                      >
                                        <Phone className="w-3 h-3 text-emerald-600" />
                                        {memberRecord.phone_number}
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyPhone(memberRecord.phone_number)}
                                        title="Copy mobile number"
                                        className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                      >
                                        {isCopied ? (
                                          <Check className="w-3 h-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-slate-400 italic">No phone</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* View Attached Verification Documents */}
                                  {memberRecord.documents && memberRecord.documents.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setViewingDocumentsResident(memberRecord)}
                                      title={`View ${memberRecord.documents.length} verified documents`}
                                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                    >
                                      <FileCheck className="w-3 h-3 text-blue-600" />
                                      <span>Docs ({memberRecord.documents.length})</span>
                                    </button>
                                  )}

                                  {isPending ? (
                                    <button
                                      type="button"
                                      disabled={processingApprovalUserId === memberRecord.user_id}
                                      onClick={() => handleQuickApproval(memberRecord.user_id, "APPROVED")}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-2xs transition-all cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditModal(memberRecord)}
                                      title="Edit resident"
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteResident(memberRecord)}
                                    disabled={isDeletingUserId === memberRecord.user_id}
                                    title="Remove from directory"
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer disabled:opacity-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          };

                          return (
                            <div className="space-y-3">
                              {/* Owners & Owner Family Section */}
                              {ownersList.length > 0 && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-blue-700 px-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <Home className="w-3 h-3 text-blue-600" />
                                      <span>Owner & Family ({ownersList.length})</span>
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    {ownersList.map((ownerItem) => {
                                      const isOwnerFamily =
                                        ownerItem.resident_type === "OWNER_FAMILY" ||
                                        ownerItem.resident_type === "FAMILY_MEMBER";
                                      return renderMemberRow(
                                        ownerItem,
                                        isOwnerFamily
                                          ? "bg-purple-50 text-purple-700 border-purple-200"
                                          : "bg-blue-50 text-blue-700 border-blue-200",
                                        isOwnerFamily ? "OWNER FAMILY" : "OWNER"
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Tenants & Tenant Family Section */}
                              {tenantsList.length > 0 && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-amber-700 px-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <UserCheck className="w-3 h-3 text-amber-600" />
                                      <span>Tenant & Family ({tenantsList.length})</span>
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    {tenantsList.map((tenantItem) => {
                                      const isTenantFamily =
                                        tenantItem.resident_type === "TENANT_FAMILY";
                                      return renderMemberRow(
                                        tenantItem,
                                        isTenantFamily
                                          ? "bg-orange-50 text-orange-700 border-orange-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200",
                                        isTenantFamily ? "TENANT FAMILY" : "TENANT"
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Quick Add Member to this Flat */}
                    <div className="pt-2 border-t border-[#F1F5F9] flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setNewWingName(flatGroup.wing_name);
                          setNewFlatNumber(flatGroup.flat_number);
                          setIsAddResidentModalOpen(true);
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Add Member</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: MOBILE APP APPROVAL                                           */}
      {/* ===================================================================== */}
      {activeTab === "MOBILE_APP_APPROVAL" && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm space-y-0">
          {/* Header & Sub-tab navigation: Pending vs Approved History */}
          <div className="p-4 border-b border-[#E2E8F0] bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] font-heading flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-600" />
                Mobile Application Registrations & Document Verification
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Review, verify identity documents, and approve or audit member access for the mobile portal.
              </p>
            </div>

            {/* Sub-tabs: Pending Verifications vs Approved Members Document Archive */}
            <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setApprovalSubTab("PENDING")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  approvalSubTab === "PENDING"
                    ? "bg-white text-[#0F172A] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending Approvals ({pendingApprovalsList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setApprovalSubTab("APPROVED_HISTORY")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  approvalSubTab === "APPROVED_HISTORY"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Approved Member Documents ({approvedMembersCount})</span>
              </button>
            </div>
          </div>

          {/* SUB-VIEW 1: PENDING APPROVALS QUEUE */}
          {approvalSubTab === "PENDING" && (
            <div>
              {pendingApprovalsList.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A]">All Member Registrations Approved</h4>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                    There are no pending mobile application registrations for this society right now.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E2E8F0]">
                  {pendingApprovalsList.map((pendingMember) => (
                    <div
                      key={pendingMember.user_id}
                      className="p-4 sm:p-5 hover:bg-[#F8FAFC] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {pendingMember.wing_name}-{pendingMember.flat_number}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#0F172A] font-heading">
                              {pendingMember.full_name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              {pendingMember.resident_type || "OWNER"}
                            </span>
                            {pendingMember.relationship_type && (
                              <span className="text-[11px] text-slate-500">
                                ({pendingMember.relationship_type})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-[#64748B] flex-wrap">
                            <span className="flex items-center gap-1 font-mono text-emerald-700 font-semibold">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              {pendingMember.phone_number}
                            </span>
                            <span>
                              Applied on:{" "}
                              <span className="font-mono text-[#0F172A]">
                                {pendingMember.created_at
                                  ? new Date(pendingMember.created_at).toLocaleDateString()
                                  : "Recent"}
                              </span>
                            </span>
                          </div>

                          {/* Uploaded Verification Documents Badges */}
                          <div className="pt-2">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                              <Paperclip className="w-3 h-3 text-slate-400" />
                              <span>Uploaded Verification Documents</span>
                              {pendingMember.documents && pendingMember.documents.length > 0 ? (
                                <span className="text-emerald-700 font-bold lowercase">
                                  ({pendingMember.documents.length} uploaded)
                                </span>
                              ) : (
                                <span className="text-rose-600 font-semibold lowercase">
                                  (none uploaded)
                                </span>
                              )}
                            </div>

                            {pendingMember.documents && pendingMember.documents.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-2">
                                {pendingMember.documents.map((docItem) => (
                                  <button
                                    key={docItem.document_id}
                                    type="button"
                                    onClick={() => setPreviewingDocument(docItem)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-blue-50 text-[#0F172A] hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-medium shadow-2xs transition-all cursor-pointer"
                                  >
                                    <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="font-semibold">{docItem.document_title || docItem.file_name}</span>
                                    <Eye className="w-3 h-3 text-slate-400 ml-0.5" />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-amber-700 bg-amber-50/70 border border-amber-200/80 rounded-lg p-2 max-w-lg">
                                <span className="font-semibold">
                                  {pendingMember.resident_type === "TENANT" || pendingMember.resident_type === "TENANT_FAMILY"
                                    ? "Mandatory documents required: Aadhaar Card, Rent Agreement, and Police Verification."
                                    : "Mandatory documents required: Aadhaar Card, Flat Index Copy, and Owner Photo."}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Approve / Reject Actions */}
                      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          disabled={processingApprovalUserId === pendingMember.user_id}
                          onClick={() => handleQuickApproval(pendingMember.user_id, "REJECTED")}
                          className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold rounded-lg text-xs transition-all shadow-2xs disabled:opacity-50 cursor-pointer flex items-center gap-1"
                        >
                          <UserX className="w-3.5 h-3.5 text-rose-600" />
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          disabled={processingApprovalUserId === pendingMember.user_id}
                          onClick={() => handleQuickApproval(pendingMember.user_id, "APPROVED")}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {processingApprovalUserId === pendingMember.user_id
                              ? "Approving..."
                              : "Approve for App"}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 2: APPROVED MEMBERS VERIFIED DOCUMENTS AUDIT ARCHIVE */}
          {approvalSubTab === "APPROVED_HISTORY" && (
            <div className="divide-y divide-[#E2E8F0]">
              <div className="p-3.5 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
                <span className="font-medium">
                  Showing active approved members and their KYC verification documents on file.
                </span>
                <span className="font-bold">
                  {approvedResidentsList.length} Active Approved Residents
                </span>
              </div>

              {approvedResidentsList.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No approved residents found.
                </div>
              ) : (
                approvedResidentsList.map((approvedMember) => (
                  <div
                    key={approvedMember.user_id}
                    className="p-4 sm:p-5 hover:bg-[#F8FAFC] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {approvedMember.wing_name}-{approvedMember.flat_number}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#0F172A] font-heading">
                            {approvedMember.full_name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {approvedMember.resident_type || "OWNER"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            App Active
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-[#64748B] flex-wrap">
                          <span className="flex items-center gap-1 font-mono text-emerald-700 font-semibold">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            {approvedMember.phone_number}
                          </span>
                          <span>Flat {approvedMember.flat_number} (Wing {approvedMember.wing_name})</span>
                        </div>

                        {/* Verified Documents Checklist Pills */}
                        <div className="pt-2">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Paperclip className="w-3 h-3 text-slate-400" />
                            <span>Documents on File</span>
                            <span className="text-slate-600 font-semibold lowercase">
                              ({approvedMember.documents ? approvedMember.documents.length : 0} uploaded)
                            </span>
                          </div>

                          {approvedMember.documents && approvedMember.documents.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2">
                              {approvedMember.documents.map((docItem) => (
                                <button
                                  key={docItem.document_id}
                                  type="button"
                                  onClick={() => setPreviewingDocument(docItem)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-50 text-[#0F172A] hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-medium shadow-2xs transition-all cursor-pointer"
                                >
                                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="font-semibold">{docItem.document_title || docItem.file_name}</span>
                                  <Eye className="w-3 h-3 text-slate-400 ml-0.5" />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 italic">
                              No digital documents uploaded yet for this approved profile.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Audit Action */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setViewingDocumentsResident(approvedMember)}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>View All Docs</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Clean Centered Flat Member Details Inspection Dialog (Option 1)*/}
      {/* ===================================================================== */}
      {selectedFlatForDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFlatForDetails(null)}
        >
          <div
            className="bg-white border border-slate-300 rounded-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-black font-mono text-base shadow-xs">
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
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
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFlatForDetails(null);
                        setNewWingName(selectedFlatForDetails.wing_name);
                        setNewFlatNumber(selectedFlatForDetails.flat_number);
                        setIsAddResidentModalOpen(true);
                      }}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Onboard Resident for Flat {selectedFlatForDetails.flat_number}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const membersList = selectedFlatForDetails.members || [];
                    const ownersAndFamilyList = membersList.filter(
                      (memberItem) =>
                        memberItem.resident_type === "OWNER" ||
                        memberItem.resident_type === "OWNER_FAMILY" ||
                        memberItem.resident_type === "FAMILY_MEMBER"
                    );
                    const tenantsAndFamilyList = membersList.filter(
                      (memberItem) =>
                        memberItem.resident_type === "TENANT" ||
                        memberItem.resident_type === "TENANT_FAMILY"
                    );

                    const renderCleanMemberCard = (memberItem, roleTheme) => {
                      const isOwnerType =
                        memberItem.resident_type === "OWNER" ||
                        memberItem.resident_type === "OWNER_FAMILY" ||
                        memberItem.resident_type === "FAMILY_MEMBER";
                      const isFamilyType =
                        memberItem.resident_type === "OWNER_FAMILY" ||
                        memberItem.resident_type === "TENANT_FAMILY" ||
                        memberItem.resident_type === "FAMILY_MEMBER";

                      let badgeText = isOwnerType
                        ? isFamilyType
                          ? "Owner Family"
                          : "Owner"
                        : isFamilyType
                        ? "Tenant Family"
                        : "Tenant";

                      const displayRole = memberItem.relationship_type
                        ? `${badgeText} (${memberItem.relationship_type})`
                        : badgeText;

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
                              {memberItem.approval_status === "PENDING" && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                  Pending
                                </span>
                              )}
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

                          <div className="flex items-center gap-1 shrink-0">
                            {/* View Resident Documents in Modal - ONLY shown if documents exist */}
                            {memberItem.documents && memberItem.documents.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const fullResidentProfile = societyResidentsList.find(
                                    (residentRecord) => residentRecord.user_id === memberItem.user_id
                                  ) || memberItem;
                                  setViewingDocumentsResident(fullResidentProfile);
                                }}
                                title={`View ${memberItem.documents.length} verified documents`}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <FileCheck className="w-3 h-3 text-blue-600" />
                                <span>Docs ({memberItem.documents.length})</span>
                              </button>
                            )}

                            {memberItem.phone_number && (
                              <button
                                type="button"
                                onClick={() => handleCopyPhone(memberItem.phone_number)}
                                title="Copy mobile number"
                                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            {memberItem.approval_status === "PENDING" && (
                              <button
                                type="button"
                                disabled={processingApprovalUserId === memberItem.user_id}
                                onClick={() => handleQuickApproval(memberItem.user_id, "APPROVED")}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1"
                              >
                                {processingApprovalUserId === memberItem.user_id ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Approving...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Approve</span>
                                  </>
                                )}
                              </button>
                            )}

                            {memberItem.approval_status === "APPROVED" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Approved</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div className="space-y-6">
                        {/* Owner & Owner's Family Section */}
                        {ownersAndFamilyList.length > 0 && (
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                              <Home className="w-3.5 h-3.5 text-blue-600" />
                              <span>Owner & Owner's Family ({ownersAndFamilyList.length})</span>
                            </div>
                            <div className="space-y-2">
                              {ownersAndFamilyList.map((ownerItem) => {
                                const isFamilyMember =
                                  ownerItem.resident_type === "OWNER_FAMILY" ||
                                  ownerItem.resident_type === "FAMILY_MEMBER";
                                return renderCleanMemberCard(
                                  ownerItem,
                                  isFamilyMember
                                    ? {
                                        badgeBg: "bg-purple-50",
                                        badgeText: "text-purple-800",
                                        badgeBorder: "border-purple-200",
                                      }
                                    : {
                                        badgeBg: "bg-blue-50",
                                        badgeText: "text-blue-800",
                                        badgeBorder: "border-blue-200",
                                      }
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Tenant & Tenant's Family Section */}
                        {tenantsAndFamilyList.length > 0 && (
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
                              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                              <span>Tenant & Tenant's Family ({tenantsAndFamilyList.length})</span>
                            </div>
                            <div className="space-y-2">
                              {tenantsAndFamilyList.map((tenantItem) => {
                                const isFamilyMember =
                                  tenantItem.resident_type === "TENANT_FAMILY";
                                return renderCleanMemberCard(
                                  tenantItem,
                                  isFamilyMember
                                    ? {
                                        badgeBg: "bg-orange-50",
                                        badgeText: "text-orange-800",
                                        badgeBorder: "border-orange-200",
                                      }
                                    : {
                                        badgeBg: "bg-amber-50",
                                        badgeText: "text-amber-800",
                                        badgeBorder: "border-amber-200",
                                      }
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer with Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    fetchFlatOwnershipHistory(selectedFlatForDetails.flat_id);
                    setIsOwnershipHistoryModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ownership History</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenTransferModal(selectedFlatForDetails)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Transfer / Change Owner</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFlatForDetails(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CSV Import Modal (Triggered by the clean "Import" button)     */}
      {/* ===================================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A] font-heading flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  Import Society Residents via CSV
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Batch upload residents with automatic verification and account setup.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" />
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

            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
              <div>
                <span className="font-semibold text-slate-700">Required CSV Headers:</span>
                <code className="text-blue-600 font-mono text-[11px] block mt-0.5">
                  wing_name, flat_number, full_name, phone_number, resident_type
                </code>
              </div>
              <button
                type="button"
                onClick={() => setCsvFileContent(sampleCsvTemplate)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-[#334155] rounded-md text-xs font-semibold border border-[#CBD5E1] transition-colors shadow-2xs shrink-0 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Load Sample</span>
              </button>
            </div>

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
                  className="w-full bg-white border border-[#CBD5E1] rounded-md p-3 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                ></textarea>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                <span className="text-xs text-[#64748B]">
                  Default Password:{" "}
                  <code className="text-[#0F172A] font-mono font-bold">
                    Resident@SmartNivas2026!
                  </code>
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isImportingCsv || !csvFileContent}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] text-white font-semibold px-5 py-2 rounded-lg text-xs transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    {isImportingCsv ? "Validating & Importing..." : "Start CSV Import"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Add Single Resident Modal (Modern Frosted Glass Dialog)        */}
      {/* ===================================================================== */}
      {isAddResidentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setIsAddResidentModalOpen(false)}
        >
          <div
            className="backdrop-blur-2xl bg-white/95 border border-slate-200/90 rounded-3xl w-full max-w-xl p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    Add Single Resident
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Register a new flat owner, tenant or family member account
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddResidentModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addResidentError && (
              <div className="p-3.5 bg-rose-50/80 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{addResidentError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSingleResidentSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nirav Patel"
                  value={newFullName}
                  onChange={(event) => setNewFullName(event.target.value)}
                  className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9825000000"
                  value={newPhoneNumber}
                  onChange={(event) => setNewPhoneNumber(event.target.value)}
                  className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
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
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
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
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Resident Type
                  </label>
                  <select
                    value={newResidentType}
                    onChange={(event) => {
                      setNewResidentType(event.target.value);
                      setNewResidentDocuments([]);
                    }}
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  >
                    <option value="OWNER">Owner (Flat Owner)</option>
                    <option value="OWNER_FAMILY">Owner's Family Member</option>
                    <option value="TENANT">Tenant (Primary Rentee)</option>
                    <option value="TENANT_FAMILY">Tenant's Family Member</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Initial App Approval
                  </label>
                  <select
                    value={newApprovalStatus}
                    onChange={(event) => setNewApprovalStatus(event.target.value)}
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  >
                    <option value="APPROVED">Approved (Immediate App Access)</option>
                    <option value="PENDING">Pending (Require Verification)</option>
                  </select>
                </div>
              </div>

              {/* Document Upload Area for Admin Registration */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Verification Documents</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                    {newResidentDocuments.length} Attached
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-2.5 text-xs">
                  <div className="text-[11px] text-slate-600">
                    {newResidentType === "TENANT" || newResidentType === "TENANT_FAMILY" ? (
                      <span>
                        <strong className="text-slate-800">Tenant Checklist:</strong> Aadhaar Card, Rent Agreement, Police Verification.
                      </span>
                    ) : (
                      <span>
                        <strong className="text-slate-800">Owner Checklist:</strong> Aadhaar Card, Flat Index Copy, Owner Photo.
                      </span>
                    )}
                  </div>

                  {/* Document Type Selector & File Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Document Category
                      </label>
                      <select
                        id="document_category_selector"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        defaultValue={
                          newResidentType === "TENANT" || newResidentType === "TENANT_FAMILY"
                            ? "RENT_AGREEMENT"
                            : "AADHAAR_CARD"
                        }
                      >
                        <option value="AADHAAR_CARD">Aadhaar Card</option>
                        <option value="FLAT_INDEX_COPY">Flat Index Copy</option>
                        <option value="OWNER_PHOTO">Owner Photo</option>
                        <option value="RENT_AGREEMENT">Rent Agreement</option>
                        <option value="POLICE_VERIFICATION">Police Verification</option>
                        <option value="OTHER">Other Certificate</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Select File (PDF or Image)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                        onChange={(fileChangeEvent) => {
                          const selectedFile = fileChangeEvent.target.files?.[0];
                          if (!selectedFile) return;

                          const categorySelect = document.getElementById("document_category_selector");
                          const selectedType = categorySelect ? categorySelect.value : "OTHER";
                          const typeLabelMap = {
                            AADHAAR_CARD: "Aadhaar Card",
                            FLAT_INDEX_COPY: "Flat Index Copy",
                            OWNER_PHOTO: "Owner Photo",
                            RENT_AGREEMENT: "Rent Agreement",
                            POLICE_VERIFICATION: "Police Verification",
                            OTHER: "Supporting Document",
                          };

                          const fileReader = new FileReader();
                          fileReader.onload = () => {
                            const base64DataUri = fileReader.result;
                            setNewResidentDocuments((existingDocs) => [
                              ...existingDocs,
                              {
                                document_type: selectedType,
                                document_title: typeLabelMap[selectedType] || "Document",
                                file_name: selectedFile.name,
                                file_path_or_url: base64DataUri,
                                file_size_bytes: selectedFile.size,
                              },
                            ]);
                            fileChangeEvent.target.value = "";
                          };
                          fileReader.readAsDataURL(selectedFile);
                        }}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Attached Documents List */}
                  {newResidentDocuments.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {newResidentDocuments.map((docItem, docIndex) => (
                        <div
                          key={`attached-${docIndex}`}
                          className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-800">{docItem.document_title}:</span>
                            <span className="text-slate-500 truncate">{docItem.file_name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNewResidentDocuments((existingDocs) =>
                                existingDocs.filter((_, filterIndex) => filterIndex !== docIndex)
                              );
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddResidentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewResident}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingNewResident ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Add Resident</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Edit Resident Details Modal                                   */}
      {/* ===================================================================== */}
      {editingResidentObject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-xl w-full max-w-lg p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-lg font-bold text-[#0F172A] font-heading flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                Edit Resident Details & Approval
              </h3>
              <button
                onClick={() => setEditingResidentObject(null)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
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
                  className="w-full bg-white border border-[#CBD5E1] rounded-md px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
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
                  className="w-full bg-white border border-[#CBD5E1] rounded-md px-3 py-2 text-sm text-[#0F172A] font-mono focus:outline-none focus:border-blue-600"
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
                    className="w-full bg-white border border-[#CBD5E1] rounded-md px-3 py-2 text-sm text-[#0F172A] font-mono uppercase focus:outline-none focus:border-blue-600"
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
                    className="w-full bg-white border border-[#CBD5E1] rounded-md px-3 py-2 text-sm text-[#0F172A] font-mono uppercase focus:outline-none focus:border-blue-600"
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
                    className="w-full bg-white border border-[#CBD5E1] rounded-md px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                  >
                    <option value="OWNER">Owner (Flat Owner)</option>
                    <option value="OWNER_FAMILY">Owner's Family Member</option>
                    <option value="TENANT">Tenant (Primary Rentee)</option>
                    <option value="TENANT_FAMILY">Tenant's Family Member</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#334155] uppercase block mb-1">
                    Mobile App Access Status
                  </label>
                  <select
                    value={editApprovalStatus}
                    onChange={(event) =>
                      setEditApprovalStatus(event.target.value)
                    }
                    className="w-full bg-white border border-[#CBD5E1] rounded-md px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-blue-600"
                  >
                    <option value="APPROVED">Approved (Active)</option>
                    <option value="PENDING">Pending Approval</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditingResidentObject(null)}
                  className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingResident}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md text-sm disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingResident ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: View Resident Documents Modal (From Directory / Approvals)     */}
      {/* ===================================================================== */}
      {viewingDocumentsResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] font-heading flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  Verification Documents & Checklist
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Resident: <strong className="text-[#0F172A]">{viewingDocumentsResident.full_name}</strong> (Flat {viewingDocumentsResident.wing_name}-{viewingDocumentsResident.flat_number}) • {viewingDocumentsResident.resident_type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingDocumentsResident(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Checklist Requirements */}
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs space-y-1.5">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span>Regulatory Verification Requirement:</span>
              </div>
              <p className="text-blue-800 leading-relaxed">
                {viewingDocumentsResident.resident_type === "TENANT" || viewingDocumentsResident.resident_type === "TENANT_FAMILY" ? (
                  <span>
                    Tenants require <strong>Aadhaar Card</strong>, <strong>Rent Agreement (11-Month)</strong>, and <strong>Police Verification Certificate</strong> before portal approval.
                  </span>
                ) : (
                  <span>
                    Flat Owners require <strong>Aadhaar Card</strong>, <strong>Registered Flat Index Copy</strong>, and <strong>Owner Photo</strong> before portal approval.
                  </span>
                )}
              </p>
            </div>

            {/* List of Uploaded Documents */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {(!viewingDocumentsResident.documents || viewingDocumentsResident.documents.length === 0) ? (
                <div className="py-12 text-center text-slate-400 italic text-xs space-y-2">
                  <Paperclip className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>No verification documents uploaded for this resident yet.</p>
                </div>
              ) : (
                viewingDocumentsResident.documents.map((docRecord) => (
                  <div
                    key={docRecord.document_id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {docRecord.document_title || docRecord.file_name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="font-mono">{docRecord.document_type}</span>
                          {docRecord.file_size_bytes && (
                            <span>• {Math.round(docRecord.file_size_bytes / 1024)} KB</span>
                          )}
                          <span>
                            • Uploaded:{" "}
                            {docRecord.created_at
                              ? new Date(docRecord.created_at).toLocaleDateString()
                              : "Recent"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewingDocument(docRecord)}
                        className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer with quick approval if pending */}
            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
              <div>
                {viewingDocumentsResident.approval_status === "PENDING" ? (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    Status: Pending Verification
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    Status: {viewingDocumentsResident.approval_status}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {viewingDocumentsResident.approval_status === "PENDING" && (
                  <button
                    type="button"
                    disabled={processingApprovalUserId === viewingDocumentsResident.user_id}
                    onClick={() => {
                      handleQuickApproval(viewingDocumentsResident.user_id, "APPROVED");
                      setViewingDocumentsResident(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Application</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingDocumentsResident(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-lg text-xs shadow-2xs transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Document Preview Modal (Inspect document full screen)          */}
      {/* ===================================================================== */}
      {previewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] font-heading">
                    {previewingDocument.document_title || previewingDocument.file_name}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Type: <span className="font-mono font-semibold text-blue-700">{previewingDocument.document_type}</span> • File: {previewingDocument.file_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingDocument(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Viewer Frame */}
            <div className="flex-1 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 min-h-[350px] max-h-[550px] flex items-center justify-center p-2">
              {(() => {
                const docUrl = previewingDocument.file_path_or_url || "";
                const fileNameLower = (previewingDocument.file_name || "").toLowerCase();
                const isImage =
                  docUrl.startsWith("data:image/") ||
                  fileNameLower.endsWith(".png") ||
                  fileNameLower.endsWith(".jpg") ||
                  fileNameLower.endsWith(".jpeg") ||
                  fileNameLower.endsWith(".webp") ||
                  fileNameLower.endsWith(".svg");
                const isPdf =
                  docUrl.startsWith("data:application/pdf") ||
                  fileNameLower.endsWith(".pdf");

                if (isImage) {
                  return (
                    <div className="w-full h-full flex items-center justify-center p-2 bg-slate-900/5 rounded-lg overflow-auto">
                      <img
                        src={docUrl}
                        alt={previewingDocument.document_title}
                        className="max-h-[500px] max-w-full object-contain rounded-lg shadow-md border border-slate-200 bg-white"
                      />
                    </div>
                  );
                }

                if (isPdf) {
                  return (
                    <iframe
                      src={docUrl}
                      title={previewingDocument.document_title}
                      className="w-full h-full rounded-lg border-0 min-h-[450px]"
                    />
                  );
                }

                return (
                  <div className="text-center p-8 space-y-3">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                    <div className="text-sm font-bold text-slate-800">
                      {previewingDocument.file_name}
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Document ready for verification (PDF / Image). You can view or download the attachment file.
                    </p>
                    {docUrl && (
                      <a
                        href={docUrl}
                        download={previewingDocument.file_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download File</span>
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
              <span className="text-xs text-slate-500">
                Audit record maintained in compliance with society bylaws.
              </span>
              <button
                type="button"
                onClick={() => setPreviewingDocument(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-lg text-xs shadow-2xs transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Flat Ownership Transfer / Sale Modal (Frosted Glass Dialog)    */}
      {/* ===================================================================== */}
      {isTransferModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setIsTransferModalOpen(false)}
        >
          <div
            className="backdrop-blur-2xl bg-white/95 border border-slate-200/90 rounded-3xl w-full max-w-xl p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    Change / Transfer Flat Ownership
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {transferTargetFlatId ? (
                      (() => {
                        const targetFlat = societyTopologyData.flats.find(
                          (f) => String(f.flat_id) === String(transferTargetFlatId)
                        );
                        return targetFlat
                          ? `Wing ${targetFlat.wing_name} - Flat ${targetFlat.flat_number}`
                          : "Select Flat Unit";
                      })()
                    ) : selectedFlatForDetails ? (
                      `Wing ${selectedFlatForDetails.wing_name} - Flat ${selectedFlatForDetails.flat_number}`
                    ) : (
                      "Select flat unit to reassign ownership and record transfer fees"
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {transferModalError && (
              <div className="p-3.5 bg-rose-50/80 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{transferModalError}</span>
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              {/* Flat Selection Dropdown */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Select Apartment / Flat Unit *
                </label>
                <select
                  required
                  value={transferTargetFlatId || (selectedFlatForDetails ? String(selectedFlatForDetails.flat_id) : "")}
                  onChange={(event) => {
                    const pickedFlatId = event.target.value;
                    setTransferTargetFlatId(pickedFlatId);
                    const foundFlat = societyTopologyData.flats.find(
                      (f) => String(f.flat_id) === String(pickedFlatId)
                    );
                    if (foundFlat) {
                      setSelectedFlatForDetails(foundFlat);
                    }
                  }}
                  className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                >
                  <option value="" disabled>-- Select Flat to Transfer --</option>
                  {societyTopologyData.flats.map((flatItem) => {
                    const currentFlatOwner = (flatItem.members || []).find(
                      (m) => m.resident_type === "OWNER" && m.is_active !== false
                    );
                    const ownerLabel = currentFlatOwner ? `Current Owner: ${currentFlatOwner.full_name}` : "Vacant / No Owner";
                    return (
                      <option key={flatItem.flat_id} value={flatItem.flat_id}>
                        Wing {flatItem.wing_name} - Flat {flatItem.flat_number} ({ownerLabel})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Previous Owner Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Current Registered Owner
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {(() => {
                    const activeFlat = transferTargetFlatId
                      ? societyTopologyData.flats.find((f) => String(f.flat_id) === String(transferTargetFlatId))
                      : selectedFlatForDetails;
                    if (!activeFlat) return "Please choose a flat above";
                    const currentOwner = (activeFlat.members || []).find(
                      (m) => m.resident_type === "OWNER" && m.is_active !== false
                    );
                    return currentOwner ? `${currentOwner.full_name} (${currentOwner.phone_number || "No Phone"})` : "None / Unassigned";
                  })()}
                </p>
                <p className="text-[11px] text-slate-500">
                  Transferring will archive the existing owner into the historical register and assign the new buyer.
                </p>
              </div>

              {/* New Owner Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    New Buyer / Owner Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajeshbhai Mehta"
                    value={transferNewOwnerName}
                    onChange={(event) => setTransferNewOwnerName(event.target.value)}
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    New Owner Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9898099887"
                    value={transferNewOwnerPhone}
                    onChange={(event) => setTransferNewOwnerPhone(event.target.value)}
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              {/* Transfer Date & Fee Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Sale / Transfer Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={transferSaleDate}
                    onChange={(event) => setTransferSaleDate(event.target.value)}
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Fee Charge Category *
                  </label>
                  <select
                    value={transferFeeCategory}
                    onChange={(event) => {
                      const nextCategory = event.target.value;
                      setTransferFeeCategory(nextCategory);
                      if (nextCategory === "SOCIETY_TRANSFER_FEE") {
                        setSocietyDevelopmentFundInr("0");
                      } else if (nextCategory === "SOCIETY_DEVELOPMENT_FUND") {
                        setTransferFeeInr("0");
                      } else if (nextCategory === "EXEMPT") {
                        setTransferFeeInr("0");
                        setSocietyDevelopmentFundInr("0");
                      }
                    }}
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  >
                    <option value="SOCIETY_TRANSFER_FEE">Transfer Fee Only</option>
                    <option value="SOCIETY_DEVELOPMENT_FUND">Society Development Fund Only</option>
                    <option value="BOTH">Both (Transfer Fee + Development Fund)</option>
                    <option value="EXEMPT">Exempt / No Fee (Family Gift / Inheritance)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Fee Amount Input based on Fee Charge Category */}
              {transferFeeCategory === "SOCIETY_TRANSFER_FEE" && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Society Transfer Fee (INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={transferFeeInr}
                      onChange={(event) => setTransferFeeInr(event.target.value)}
                      className="w-full bg-white border border-slate-200/90 rounded-xl pl-7 pr-3 py-2 text-xs sm:text-sm text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>
              )}

              {transferFeeCategory === "SOCIETY_DEVELOPMENT_FUND" && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Society Development Fund (INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={societyDevelopmentFundInr}
                      onChange={(event) => setSocietyDevelopmentFundInr(event.target.value)}
                      className="w-full bg-white border border-slate-200/90 rounded-xl pl-7 pr-3 py-2 text-xs sm:text-sm text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>
              )}

              {transferFeeCategory === "BOTH" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Society Transfer Fee (INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={transferFeeInr}
                        onChange={(event) => setTransferFeeInr(event.target.value)}
                        className="w-full bg-white border border-slate-200/90 rounded-xl pl-7 pr-3 py-2 text-xs sm:text-sm text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Society Development Fund (INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={societyDevelopmentFundInr}
                        onChange={(event) => setSocietyDevelopmentFundInr(event.target.value)}
                        className="w-full bg-white border border-slate-200/90 rounded-xl pl-7 pr-3 py-2 text-xs sm:text-sm text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between text-xs pt-1 border-t border-indigo-100 text-slate-600 font-medium">
                    <span>Total Amount Collected:</span>
                    <span className="font-mono font-bold text-indigo-700 text-sm">
                      ₹{(parseFloat(transferFeeInr || "0") + parseFloat(societyDevelopmentFundInr || "0")).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              )}

              {transferFeeCategory === "EXEMPT" && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Exempt transfer: No transfer fee or development fund will be charged.</span>
                </div>
              )}

              {/* Payment Mode & Reference Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={transferPaymentMode}
                    onChange={(event) => setTransferPaymentMode(event.target.value)}
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  >
                    <option value="NEFT_RTGS">Bank Transfer (NEFT / RTGS / IMPS)</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="DEMAND_DRAFT">Demand Draft (DD)</option>
                    <option value="CASH">Cash Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Transaction / Cheque / UTR Ref #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR1928374829 or Cheque #004521"
                    value={transferPaymentReference}
                    onChange={(event) => setTransferPaymentReference(event.target.value)}
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              {/* Upload Sale Deed Document */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Registered Sale Deed / Index-II Document (PDF or Image)</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(fileChangeEvent) => {
                    const selectedFile = fileChangeEvent.target.files?.[0];
                    if (!selectedFile) return;
                    const fileReader = new FileReader();
                    fileReader.onload = () => {
                      setTransferSaleDeedFile({
                        file_name: selectedFile.name,
                        file_path_or_url: fileReader.result,
                        file_size_bytes: selectedFile.size,
                      });
                    };
                    fileReader.readAsDataURL(selectedFile);
                  }}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {transferSaleDeedFile && (
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Attached: {transferSaleDeedFile.file_name}</span>
                  </p>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Transfer Remarks / NOC Details
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Society NOC issued after clearance of maintenance dues and share certificate transfer."
                  value={transferRemarks}
                  onChange={(event) => setTransferRemarks(event.target.value)}
                  className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>

              {/* Checkbox: Deactivate previous owner */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <input
                  type="checkbox"
                  id="deactivate_previous_owner_chk"
                  checked={deactivatePreviousOwner}
                  onChange={(event) => setDeactivatePreviousOwner(event.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="deactivate_previous_owner_chk" className="text-slate-700 font-medium cursor-pointer">
                  Archive previous owner and their family members (mark as Past Owner & deactivate app access)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransfer}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingTransfer ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording Transfer...</span>
                    </>
                  ) : (
                    <span>Confirm Ownership Transfer</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Flat Ownership Historical Audit Trail (Frosted Glass Dialog)  */}
      {/* ===================================================================== */}
      {isOwnershipHistoryModalOpen && selectedFlatForDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOwnershipHistoryModalOpen(false)}
        >
          <div
            className="backdrop-blur-2xl bg-white/95 border border-slate-200/90 rounded-3xl w-full max-w-2xl p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    Ownership History & Title Deeds
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Chronological transfer chain for Wing {selectedFlatForDetails.wing_name} - Flat {selectedFlatForDetails.flat_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOwnershipHistoryModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingOwnershipHistory ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Loading ownership chain...
              </div>
            ) : flatOwnershipHistoryList.length === 0 ? (
              <div className="p-12 text-center space-y-3 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl">
                <Home className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-800">First / Original Owner</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No resale or title transfers recorded for Flat {selectedFlatForDetails.flat_number}. Current occupant is the initial registered owner.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {flatOwnershipHistoryList.map((historyItem) => (
                    <div key={historyItem.history_id} className="relative space-y-2">
                      <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xs" />

                      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                          <span className="font-bold text-slate-900">
                            Transfer Date: {new Date(historyItem.transfer_sale_date).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                            {historyItem.transfer_fee_inr > 0 && (
                              <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                Fee: ₹{Number(historyItem.transfer_fee_inr).toLocaleString("en-IN")}
                              </span>
                            )}
                            {historyItem.society_development_fund_inr > 0 && (
                              <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                Dev Fund: ₹{Number(historyItem.society_development_fund_inr).toLocaleString("en-IN")}
                              </span>
                            )}
                            {historyItem.payment_mode && (
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                {historyItem.payment_mode.replace("_", " / ")} {historyItem.payment_reference_number ? `(${historyItem.payment_reference_number})` : ""}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-100">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Previous Owner
                            </span>
                            <p className="font-bold text-slate-800">
                              {historyItem.previous_owner_name}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500">
                              {historyItem.previous_owner_phone || "—"}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                              New Owner (Purchaser)
                            </span>
                            <p className="font-bold text-slate-900">
                              {historyItem.new_owner_name}
                            </p>
                            <p className="font-mono text-[11px] text-slate-600 font-semibold">
                              {historyItem.new_owner_phone}
                            </p>
                          </div>
                        </div>

                        {historyItem.transfer_remarks && (
                          <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                            "{historyItem.transfer_remarks}"
                          </p>
                        )}

                        {historyItem.sale_deed_document_url && (
                          <div className="pt-1 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewingDocument({
                                  document_title: "Sale Deed / Transfer Document",
                                  file_name: historyItem.sale_deed_document_filename || "sale_deed.pdf",
                                  file_path_or_url: historyItem.sale_deed_document_url,
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                              <span>View Registered Sale Deed</span>
                              <Eye className="w-3 h-3 text-indigo-400" />
                            </button>
                            <span className="text-[10px] text-slate-400">
                              Recorded by: {historyItem.admin_recorder_name || "Society Admin"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Official society land register & title history
              </span>
              <button
                type="button"
                onClick={() => setIsOwnershipHistoryModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
