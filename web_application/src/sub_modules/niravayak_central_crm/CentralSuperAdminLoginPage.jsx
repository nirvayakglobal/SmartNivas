import React from "react";
import { UnifiedPortalLoginPage } from "../auth/UnifiedPortalLoginPage";

export function CentralSuperAdminLoginPage() {
  return (
    <UnifiedPortalLoginPage
      portalTitle="Central Super Admin"
      portalSubtitle="Niravayak Global Operations & CRM"
      defaultIdentifier="9999999999"
      defaultPassword="SuperAdmin@Niravayak2026!"
      targetRedirect="/CRM/leads"
    />
  );
}
