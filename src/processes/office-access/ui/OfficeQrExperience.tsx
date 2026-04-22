import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import { OfficeQrPanel, useOfficeQr } from "@features/attendance/office-qr";
import { useContext, useEffect, useState } from "react";

export function OfficeQrExperience() {
  const { isCognitoUserRole } = useContext(AuthContext);
  const { getOfficeMode } = useContext(AppConfigContext);
  const [showAdminAlert, setShowAdminAlert] = useState(false);

  const isOfficeModeEnabled = getOfficeMode();

  const {
    qrUrl,
    timeLeft,
    progress,
    isRegisterMode,
    tooltipOpen,
    handleModeChange,
    handleManualRefresh,
    handleCopyUrl,
  } = useOfficeQr();

  useEffect(() => {
    if (isCognitoUserRole(StaffRole.ADMIN)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowAdminAlert(true);
    }
  }, [isCognitoUserRole]);

  return (
    <OfficeQrPanel
      showAdminAlert={showAdminAlert}
      isOfficeModeEnabled={isOfficeModeEnabled}
      isRegisterMode={isRegisterMode}
      timeLeft={timeLeft}
      progress={progress}
      qrUrl={qrUrl}
      tooltipOpen={tooltipOpen}
      onModeChange={handleModeChange}
      onCopyUrl={handleCopyUrl}
      onManualRefresh={handleManualRefresh}
    />
  );
}
