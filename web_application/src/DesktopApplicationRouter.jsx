import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { DesktopWebPortalLayout } from "./layouts/DesktopWebPortalLayout";

// Niravayak Central CRM Pages (Module 1)
import { NiravayakLeadPipelinePage } from "./sub_modules/niravayak_central_crm/NiravayakLeadPipelinePage";
import { OnboardedSocietyClientsAndEntitlementsPage } from "./sub_modules/niravayak_central_crm/OnboardedSocietyClientsAndEntitlementsPage";
import { SubscriptionPlanMasterPage } from "./sub_modules/niravayak_central_crm/SubscriptionPlanMasterPage";
import { B2bGstInvoicingAndRenewalsPage } from "./sub_modules/niravayak_central_crm/B2bGstInvoicingAndRenewalsPage";
import { CentralWingAndFlatProvisionerPage } from "./sub_modules/niravayak_central_crm/CentralWingAndFlatProvisionerPage";
import { CentralSuperAdminLoginPage } from "./sub_modules/niravayak_central_crm/CentralSuperAdminLoginPage";

// Society Admin Portal Pages (Module 2)
import { SocietyDashboardOverviewPage } from "./sub_modules/society_admin_portal/SocietyDashboardOverviewPage";
import { WingAndFlatBulkGeneratorPage } from "./sub_modules/society_admin_portal/WingAndFlatBulkGeneratorPage";
import { ResidentDirectoryAndCsvImportPage } from "./sub_modules/society_admin_portal/ResidentDirectoryAndCsvImportPage";
import { GateAndSecurityGuardSetupPage } from "./sub_modules/society_admin_portal/GateAndSecurityGuardSetupPage";
import { SocietyVisitorLogRegisterPage } from "./sub_modules/society_admin_portal/SocietyVisitorLogRegisterPage";
import { SocietyDigitalNoticeBoardPage } from "./sub_modules/society_admin_portal/SocietyDigitalNoticeBoardPage";
import { FinancialAndBillingManagementPage } from "./sub_modules/society_admin_portal/FinancialAndBillingManagementPage";
import { ExpenseManagementAndAccountingPage } from "./sub_modules/society_admin_portal/ExpenseManagementAndAccountingPage";
import { FinancialReportsPage } from "./sub_modules/society_admin_portal/FinancialReportsPage";
import { HelpdeskAndComplaintManagementPage } from "./sub_modules/society_admin_portal/HelpdeskAndComplaintManagementPage";
import { DailyStaffAndHelperManagementPage } from "./sub_modules/society_admin_portal/DailyStaffAndHelperManagementPage";
import { SocietyAdminLoginPage } from "./sub_modules/society_admin_portal/SocietyAdminLoginPage";
import { SocietyAdminBootstrapActivationPage } from "./sub_modules/society_admin_portal/SocietyAdminBootstrapActivationPage";
import { UnifiedPortalLoginPage } from "./sub_modules/auth/UnifiedPortalLoginPage";

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
  IndianRupee,
  Receipt,
  LifeBuoy,
  UserCheck,
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
      targetPath: "/CRM/provisioner",
      displayLabel: "Wing & Flat Provisioner",
      iconComponent: Layers,
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
      displayLabel: "Wings & Flat Directory",
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
    {
      targetPath: "/Society/Admin/billing",
      displayLabel: "Maintenance & Billing",
      iconComponent: IndianRupee,
    },
    {
      targetPath: "/Society/Admin/accounts-payable",
      displayLabel: "Expense & Accounting",
      iconComponent: Receipt,
    },
    {
      targetPath: "/Society/Admin/reports",
      displayLabel: "Financial Reports",
      iconComponent: FileSpreadsheet,
    },
    {
      targetPath: "/Society/Admin/helpdesk",
      displayLabel: "Helpdesk & Complaints",
      iconComponent: LifeBuoy,
    },
    {
      targetPath: "/Society/Admin/staff",
      displayLabel: "Daily Staff & Helpers",
      iconComponent: UserCheck,
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
      {/* Dedicated Portal Logins (Identical UI/UX layout) */}
      <Route path="/CRM/login" element={<CentralSuperAdminLoginPage />} />
      <Route path="/Society/Admin/login" element={<SocietyAdminLoginPage />} />
      <Route
        path="/member/login"
        element={
          <UnifiedPortalLoginPage
            portalTitle="Resident Member Portal"
            portalSubtitle="Housing Society Resident Access"
            defaultIdentifier="9825100001"
            defaultPassword="Member@Pass2026!"
            targetRedirect="/Society/Admin/dashboard"
          />
        }
      />
      <Route
        path="/resident/login"
        element={
          <UnifiedPortalLoginPage
            portalTitle="Resident Member Portal"
            portalSubtitle="Housing Society Resident Access"
            defaultIdentifier="9825100001"
            defaultPassword="Member@Pass2026!"
            targetRedirect="/Society/Admin/dashboard"
          />
        }
      />
      <Route
        path="/guard/login"
        element={
          <UnifiedPortalLoginPage
            portalTitle="Security Guard Portal"
            portalSubtitle="Gate & Visitor Check-In Access"
            defaultIdentifier="9800000001"
            defaultPassword="Guard@Gate2026!"
            targetRedirect="/Society/Admin/visitor-logs"
          />
        }
      />
      <Route path="/login" element={<Navigate to="/Society/Admin/login" replace />} />
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
                path="provisioner"
                element={<CentralWingAndFlatProvisionerPage />}
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
              <Route
                path="billing"
                element={<FinancialAndBillingManagementPage />}
              />
              <Route
                path="accounts-payable"
                element={<ExpenseManagementAndAccountingPage />}
              />
              <Route
                path="reports"
                element={<FinancialReportsPage />}
              />
              <Route
                path="helpdesk"
                element={<HelpdeskAndComplaintManagementPage />}
              />
              <Route
                path="staff"
                element={<DailyStaffAndHelperManagementPage />}
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
