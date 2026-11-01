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
import { SocietyDashboardOverviewPage } from "./sub_modules/society_admin_portal/SocietyDashboardOverviewPage";
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
  LayoutDashboard,
} from "lucide-react";

export function DesktopApplicationRouter() {
  const centralCrmNavigationItems = [
    {
      targetPath: "/CRM/leads",
      displayLabel: "Lead Pipeline",
      iconComponent: Users,
    },
    {
      targetPath: "/CRM/clients",
      displayLabel: "Society Clients & Flags",
      iconComponent: Building2,
    },
    {
      targetPath: "/CRM/plans",
      displayLabel: "Subscription Plans",
      iconComponent: CreditCard,
    },
    {
      targetPath: "/CRM/invoices",
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
      targetPath: "/Society/Admin/dashboard",
      displayLabel: "Command Center",
      iconComponent: LayoutDashboard,
    },
    {
      targetPath: "/Society/Admin/topology",
      displayLabel: "Wings & Flat Generator",
      iconComponent: Layers,
    },
    {
      targetPath: "/Society/Admin/residents",
      displayLabel: "Resident Directory & CSV",
      iconComponent: Users,
    },
    {
      targetPath: "/Society/Admin/gates",
      displayLabel: "Gates & Guards Setup",
      iconComponent: ShieldCheck,
    },
    {
      targetPath: "/Society/Admin/visitor-logs",
      displayLabel: "Visitor Entry Register",
      iconComponent: FileText,
    },
  ];

  if (isNoticeBoardEnabledForSociety) {
    societyAdminNavigationItems.push({
      targetPath: "/Society/Admin/notices",
      displayLabel: "Digital Notice Board",
      iconComponent: Megaphone,
    });
  }

  return (
    <Routes>
      {/* Niravayak Global CRM Login */}
      <Route path="/CRM/login" element={<CentralSuperAdminLoginPage />} />

      {/* Society Admin Login & Activation */}
      <Route path="/Society/Admin/login" element={<SocietyAdminLoginPage />} />
      <Route
        path="/Society/Admin/activate"
        element={<SocietyAdminBootstrapActivationPage />}
      />

      {/* Legacy URL Backward-Compatibility Redirects */}
      <Route path="/central/login" element={<Navigate to="/CRM/login" replace />} />
      <Route path="/central/*" element={<Navigate to="/CRM/login" replace />} />
      <Route path="/admin/login" element={<Navigate to="/Society/Admin/login" replace />} />
      <Route path="/admin/*" element={<Navigate to="/Society/Admin/login" replace />} />

      {/* Niravayak Global CRM Protected Portal Routes */}
      <Route
        path="/CRM/*"
        element={
          <DesktopWebPortalLayout
            portalTitle="Niravayak Global CRM"
            portalSubtitle="Niravayak Global Super Administration"
            currentOperatorBadge="Niravayak Global HQ"
            portalType="central"
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
              <Route path="*" element={<Navigate to="/CRM/login" replace />} />
            </Routes>
          </DesktopWebPortalLayout>
        }
      />

      {/* Society Admin ERP Protected Portal Routes */}
      <Route
        path="/Society/Admin/*"
        element={
          <DesktopWebPortalLayout
            portalTitle="Society Admin ERP"
            portalSubtitle="Residential Housing Society Administration"
            currentOperatorBadge="Smart Nivas Tenant"
            portalType="admin"
            navigationItems={societyAdminNavigationItems}
          >
            <Routes>
              <Route path="dashboard" element={<SocietyDashboardOverviewPage />} />
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
              <Route path="*" element={<Navigate to="/Society/Admin/dashboard" replace />} />
            </Routes>
          </DesktopWebPortalLayout>
        }
      />

      {/* Default root redirect to Niravayak Global CRM Login */}
      <Route path="*" element={<Navigate to="/CRM/login" replace />} />
    </Routes>
  );
}
