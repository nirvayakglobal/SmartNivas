import React from "react";
import { UnifiedPortalLoginPage } from "../auth/UnifiedPortalLoginPage";

export function SocietyAdminLoginPage() {
  return (
    <UnifiedPortalLoginPage
      portalTitle="Society Admin Portal"
      portalSubtitle=""
      defaultIdentifier="9825000000"
      defaultPassword="Admin@Shilp2026!"
      targetRedirect="/Society/Admin/dashboard"
    />
  );
}
