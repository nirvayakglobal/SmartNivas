import React from "react";
import { UnifiedPortalLoginPage } from "../auth/UnifiedPortalLoginPage";

export function SocietyAdminLoginPage() {
  return (
    <UnifiedPortalLoginPage
      portalTitle="Society Admin Portal"
      portalSubtitle="Society Managing Committee ERP"
      defaultIdentifier="9825000000"
      defaultPassword="Admin@Patel2026!"
      targetRedirect="/Society/Admin/dashboard"
    />
  );
}
