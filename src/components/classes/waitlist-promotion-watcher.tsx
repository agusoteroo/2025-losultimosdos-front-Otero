"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import bookingService from "@/services/booking.service";
import { BookingStatus } from "@/types";
import { useStore } from "@/store/useStore";
import {
  getTrackedWaitlistClasses,
  removeTrackedWaitlistClass,
} from "@/lib/user-waitlist-tracker";

const ENROLLED_STATUSES: BookingStatus[] = ["RESERVED", "ATTENDED", "ABSENT"];

export const WaitlistPromotionWatcher = () => {
  const { userId } = useAuth();
  const { selectedSede } = useStore();

  const { data: myBookings = [] } = useQuery({
    queryKey: ["myBookings", selectedSede.id],
    queryFn: () => bookingService.getMyBookings(selectedSede.id),
    enabled: !!userId && !!selectedSede.id,
  });

  useEffect(() => {
    if (!userId || !selectedSede.id || !myBookings.length) {
      return;
    }

    const tracked = getTrackedWaitlistClasses(userId, selectedSede.id);
    if (tracked.size === 0) {
      return;
    }

    myBookings.forEach((booking) => {
      if (!tracked.has(booking.classId)) {
        return;
      }

      if (!ENROLLED_STATUSES.includes(booking.status)) {
        return;
      }

      toast.success(
        `Se libero un cupo: ya estas inscripto en ${booking.class?.name ?? "tu clase"}`
      );
      removeTrackedWaitlistClass(userId, selectedSede.id, booking.classId);
    });
  }, [myBookings, selectedSede.id, userId]);

  return null;
};

