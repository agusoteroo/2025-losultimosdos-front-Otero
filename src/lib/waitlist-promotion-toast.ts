import { toast } from "react-hot-toast";
import { WaitlistPromotionInfo } from "@/types";

export const showWaitlistPromotionToast = (
  waitlistPromotion?: WaitlistPromotionInfo | null
) => {
  if (!waitlistPromotion?.promoted) {
    return;
  }

  toast(
    "Se libero un cupo y se promovio automaticamente a una persona desde la lista de espera.",
    { icon: "ℹ️", id: `waitlist-promotion-${waitlistPromotion.classId}` }
  );

  if (waitlistPromotion.pointsGranted) {
    toast.success(
      `Se otorgaron ${waitlistPromotion.pointsAwarded ?? 0} puntos por la inscripcion promovida.`,
      { id: `waitlist-promotion-points-${waitlistPromotion.classId}` }
    );
  }
};

