import { toast } from "react-hot-toast";
import { AdminBookingStrikeAlert } from "@/types";

export const getStrikeAlertToastMessage = (
  strikeAlert?: AdminBookingStrikeAlert | null
) => {
  if (!strikeAlert || strikeAlert.type !== "ABSENT_STRIKE") {
    return null;
  }

  if (strikeAlert.isRestricted) {
    const unlockAt = strikeAlert.restrictionUntil
      ? new Date(strikeAlert.restrictionUntil).toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    return unlockAt
      ? `Se registró la falta y quedaste bloqueado temporalmente para reservar (hasta ${unlockAt}).`
      : "Se registró la falta y quedaste bloqueado temporalmente para reservar.";
  }

  return `Se registró la falta. Tus strikes son ${strikeAlert.strikes}/${strikeAlert.threshold}.`;
};

export const showStrikeAlertToast = (
  strikeAlert?: AdminBookingStrikeAlert | null
) => {
  const message = getStrikeAlertToastMessage(strikeAlert);
  if (!message) {
    return;
  }

  toast(message, {
    icon: strikeAlert?.isRestricted ? "⚠️" : "ℹ️",
    id: `strike-alert-${strikeAlert?.userId ?? "user"}`,
  });
};

