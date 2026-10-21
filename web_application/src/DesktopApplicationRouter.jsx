import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { DesktopWebPortalLayout } from "./layouts/DesktopWebPortalLayout";

// Niravayak Central CRM Pages (Module 1)
import { NiravayakLeadPipelinePage } from "./sub_modules/niravayak_central_crm/NiravayakLeadPipelinePage";
import { OnboardedSocietyClientsAndEntitlementsPage } from "./sub_modules/niravayak_central_crm/OnboardedSocietyClientsAndEntitlementsPage";
import { SubscriptionPlanMasterPage } from "./sub_modules/niravayak_central_crm/SubscriptionPlanMasterPage";
import { B2bGstInvoicingAndRenewalsPage } from "./sub_modules/niravayak_central_crm/B2bGstInvoicingAndRenewalsPage";
import { CentralSuperAdminLoginPage } from "./sub_modules/niravayak_central_crm/CentralSuperAdminLoginPage";

// Society Admin Portal Pages (Module 2)
import { WingAndFlatBulkGeneratorPage } from "./sub_modules/society_admin_portal/WingAndFlatBulkGeneratorPage";
import { ResidentDirectoryAndCsvImportPage } from "./sub_modules/society_admin_portal/ResidentDirectoryAndCsvImportPage";
import { GateAndSecurityGuardSetupPage } from "./sub_modules/society_admin_portal/GateAndSecurityGuardSetupPage";
import { SocietyVisitorLogRegisterPage } from "./sub_modules/society_admin_portal/SocietyVisitorLogRegisterPage";
import { SocietyDigitalNoticeBoardPage } from "./sub_modules/society_admin_portal/SocietyDigitalNoticeBoardPage";
import { SocietyAdminLoginPage } from "./sub_modules/society_admin_portal/SocietyAdminLoginPage";
import { SocietyAdminBootstrapActivationPage } from "./sub_modules/society_admin_portal/SocietyAdminBootstrapActivationPage";

import {
  Users,
  Building2,
  CreditCard,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  FileText,
  Megaphone,
} from "lucide-react";

export function DesktopApplicationRouter() {
  const centralCrmNavigationItems = [
    {
      targetPath: "/central/leads",
      displayLabel: "Lead Pipeline",
      iconComponent: Users,
    },
    {
      targetPath: "/central/clients",
      displayLabel: "Society Clients & Flags",
      iconComponent: Building2,
    },
    {
      targetPath: "/central/plans",
      displayLabel: "Subscription Plans",
      iconComponent: CreditCard,
    },
    {
      targetPath: "/central/invoices",
      displayLabel: "B2B GST Invoicing",
      iconComponent: FileSpreadsheet,
    },
  ];

  // Dynamically inspect society entitlements stored in localStorage to conditionally show Notice Board
  const storedSocietyProfileString = localStorage.getItem(
    "smart_nivas_society_profile"
  );
  let isNoticeBoardEnabledForSociety = true;
  if (storedSocietyProfileString) {
    try {
      const parsedSocietyProfile = JSON.parse(storedSocietyProfileString);
      if (parsedSocietyProfile.enable_notice_board !== undefined) {
        isNoticeBoardEnabledForSociety = Boolean(
          parsedSocietyProfile.enable_notice_board
        );
      }
    } catch (profileParseError) {
      console.warn("Could not parse society profile for notice board flag.");
    }
  }

  const societyAdminNavigationItems = [
    {
      targetPath: "/admin/topology",
      displayLabel: "Wings & Flat Generator",
      iconComponent: Layers,
    },
    {
      targetPath: "/admin/residents",
      displayLabel: "Resident Directory & CSV",
      iconComponent: Users,
    },
    {
      targetPath: "/admin/gates",
      displayLabel: "Gates & Guards Setup",
      iconComponent: ShieldCheck,
    },
    {
      targetPath: "/admin/visitor-logs",
      displayLabel: "Visitor Entry Register",
      iconComponent: FileText,
    },
  ];

  if (isNoticeBoardEnabledForSociety) {
    societyAdminNavigationItems.push({
      targetPath: "/admin/notices",
      displayLabel: "Digital Notice Board",
      iconComponent: Megaphone,
    });
  }

  return (
    <Routes>
      {/* Central Super Admin Login */}
      <Route path="/central/login" element={<CentralSuperAdminLoginPage />} />

      {/* Society Admin Public Setup & Login */}
      <Route path="/admin/login" element={<SocietyAdminLoginPage />} />
      <Route
        path="/admin/activate"
        element={<SocietyAdminBootstrapActivationPage />}
      />

      {/* Central CRM Protected Portal Routes */}
      <Route
        path="/central/*"
        element={
          <DesktopWebPortalLayout
            portalTitle="Central B2B CRM & Licensing"
            portalSubtitle="Niravayak Global Super Administration"
            currentOperatorBadge="Niravayak Global HQ"
            navigationItems={centralCrmNavigationItems}
          >
            <Routes>
              <Route path="leads" element={<NiravayakLeadPipelinePage />} />
              <Route
                path="clients"
                element={<OnboardedSocietyClientsAndEntitlementsPage />}
              />
              <Route
                path="plans"
                element={<SubscriptionPlanMasterPage />}
              />
              <Route
                path="invoices"
                element={<B2bGstInvoicingAndRenewalsPage />}
              />
              <Route path="*" element={<Navigate to="/central/leads" replace />} />
            </Routes>
          </DesktopWebPortalLayout>
        }
      />

      {/* Society Managing Committee ERP Routes */}
      <Route
        path="/admin/*"
        element={
          <DesktopWebPortalLayout
            portalTitle="Society Managing Committee ERP"
            portalSubtitle="Residential Housing Society Administration"
            currentOperatorBadge="Smart Nivas Tenant"
            portalType="admin"
            navigationItems={societyAdminNavigationItems}
          >
            <Routes>
              <Route path="topology" element={<WingAndFlatBulkGeneratorPage />} />
              <Route
                path="residents"
                element={<ResidentDirectoryAndCsvImportPage />}
              />
              <Route
                path="gates"
                element={<GateAndSecurityGuardSetupPage />}
              />
              <Route
                path="visitor-logs"
                element={<SocietyVisitorLogRegisterPage />}
              />
              <Route
                path="notices"
                element={<SocietyDigitalNoticeBoardPage />}
              />
              <Route path="*" element={<Navigate to="/admin/topology" replace />} />
            </Routes>
          </DesktopWebPortalLayout>
        }
      />

      {/* Root redirect */}
      <Route path="*" element={<Navigate to="/central/leads" replace />} />
    </Routes>
  );
}
